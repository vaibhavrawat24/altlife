import os
from openai import AsyncOpenAI
from typing import Any, Dict, List

# Supports two modes via LLM_PROVIDER env var:
#   "github"  → GitHub Models (free with Copilot Pro, uses GITHUB_TOKEN)
#   "openai"  → OpenAI directly (uses OPENAI_API_KEY)

PROVIDER = os.getenv("LLM_PROVIDER", "github")

if PROVIDER == "github":
    client = AsyncOpenAI(
        base_url="https://models.inference.ai.azure.com",
        api_key=os.getenv("GITHUB_TOKEN"),
    )
    DEFAULT_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")
else:
    client = AsyncOpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
    )
    DEFAULT_MODEL = os.getenv("LLM_MODEL", "gpt-4o")


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

    response = await client.chat.completions.create(
        model=model or DEFAULT_MODEL,
        messages=messages,
        max_tokens=max_tokens,
        temperature=0.7,
    )
    return {
        "agent": agent_name,
        "response": response.choices[0].message.content.strip(),
    }
