import os
from typing import List, Dict

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")


async def search_facts(queries: List[str]) -> List[Dict[str, str]]:
    """
    Search for real-world facts to ground the simulation.
    Returns list of {query, result} dicts.
    Gracefully skips if TAVILY_API_KEY is not set.
    """
    if not TAVILY_API_KEY:
        return []

    try:
        from tavily import AsyncTavilyClient
        client = AsyncTavilyClient(api_key=TAVILY_API_KEY)

        import asyncio
        tasks = [_search_one(client, q) for q in queries]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        facts = []
        for query, result in zip(queries, results):
            if isinstance(result, Exception):
                continue
            facts.append({"query": query, "result": result})
        return facts
    except ImportError:
        return []


async def _search_one(client, query: str) -> str:
    response = await client.search(
        query=query,
        search_depth="basic",
        max_results=3,
    )
    snippets = [r.get("content", "") for r in response.get("results", [])]
    return " | ".join(snippets[:2])


def format_facts_for_prompt(facts: List[Dict[str, str]]) -> str:
    if not facts:
        return ""
    lines = ["REAL-WORLD DATA (use these facts to ground your simulation):"]
    for f in facts:
        lines.append(f"• {f['query']}: {f['result'][:300]}")
    return "\n".join(lines)
