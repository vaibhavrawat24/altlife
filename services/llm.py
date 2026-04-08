import os
import asyncio
from datetime import datetime, timezone
from openai import AsyncOpenAI, RateLimitError
from typing import Any, Dict, List

# Provider priority via LLM_PROVIDER:
#   "openrouter" (primary) -> fallback github
#   "github" (primary) -> fallback openrouter

PROVIDER = os.getenv("LLM_PROVIDER", "openrouter").lower().strip()


def _build_provider_chain() -> List[Dict[str, Any]]:
    chain: List[Dict[str, Any]] = []

    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    github_key = os.getenv("GITHUB_TOKEN")

    if PROVIDER == "openrouter":
        order = ["openrouter", "github"]
    elif PROVIDER == "github":
        order = ["github", "openrouter"]
    else:
        order = ["openrouter", "github"]

    for provider in order:
        if provider == "openrouter" and openrouter_key:
            chain.append(
                {
                    "name": "openrouter",
                    "client": AsyncOpenAI(
                        base_url="https://openrouter.ai/api/v1",
                        api_key=openrouter_key,
                    ),
                    "model": os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini"),
                }
            )
        elif provider == "github" and github_key:
            chain.append(
                {
                    "name": "github",
                    "client": AsyncOpenAI(
                        base_url="https://models.inference.ai.azure.com",
                        api_key=github_key,
                    ),
                    "model": os.getenv("GITHUB_MODEL", "gpt-4o-mini"),
                }
            )

    if not chain:
        raise ValueError(
            "No LLM providers configured. Set OPENROUTER_API_KEY and/or GITHUB_TOKEN."
        )

    return chain


PROVIDER_CHAIN = _build_provider_chain()

# Lightweight runtime telemetry
LAST_LLM_META: Dict[str, Any] = {
    "provider": None,
    "model": None,
    "agent": None,
    "timestamp": None,
    "fallback_used": False,
}


def get_llm_provider_status() -> Dict[str, Any]:
    """Return provider configuration and last successful provider used."""
    return {
        "configured_order": [p["name"] for p in PROVIDER_CHAIN],
        "configured_models": {p["name"]: p["model"] for p in PROVIDER_CHAIN},
        "active_preference": PROVIDER,
        "last": LAST_LLM_META,
    }


async def call_llm(
    system_prompt: str,
    context: Dict[str, Any],
    history: List[Dict[str, Any]],
    agent_name: str,
    model: str = None,
    max_tokens: int = 900,
) -> Dict[str, Any]:
    messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": f"Profile: {context['profile']}\nDecision: {context['decision']}",
        },
    ]
    for h in history:
        messages.append(
            {"role": "assistant", "content": f"{h['agent']}: {h['response']}"}
        )

    last_error: Exception | None = None

    for idx, provider in enumerate(PROVIDER_CHAIN):
        client = provider["client"]
        provider_name = provider["name"]
        provider_model = provider["model"]

        for attempt in range(4):
            try:
                response = await client.chat.completions.create(
                    model=model or provider_model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=0.7,
                )
                LAST_LLM_META.update(
                    {
                        "provider": provider_name,
                        "model": model or provider_model,
                        "agent": agent_name,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "fallback_used": idx > 0,
                    }
                )
                return {
                    "agent": agent_name,
                    "response": response.choices[0].message.content.strip(),
                }
            except RateLimitError as e:
                last_error = e
                if attempt == 3:
                    print(f"[LLM] {provider_name} rate-limited. Falling back if available.")
                    break
                wait = 2 ** attempt  # 1s, 2s, 4s
                await asyncio.sleep(wait)
            except Exception as e:
                last_error = e
                print(f"[LLM] {provider_name} failed: {e}. Falling back if available.")
                break

    if last_error:
        raise last_error
    raise RuntimeError("LLM call failed with no available providers.")
