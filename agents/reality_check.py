"""
Reality Check Agent — runs BEFORE world building.

Generates decision-specific search queries, fetches current real-world facts,
and produces a "hard constraints" block that ALL actors must respect.

This is what grounds the simulation in reality:
- "Travel to Iran" → finds Level 4 travel advisory, active conflict, sanctions
- "Quit job in tech" → finds current layoff rates, hiring freeze data
- "Move to Berlin" → finds visa rules, cost of living changes, job market
"""
import json
from services.llm import call_llm
from services.search import search_facts
from agents.json_utils import extract_json_from_response
from typing import Dict, Any

QUERY_GENERATOR_PROMPT = """
You are a research agent. Given a person's situation and decision, generate
5-7 specific search queries that would uncover CURRENT REAL-WORLD facts
that could significantly affect the outcome of this decision.

Focus on:
- Current events, conflicts, crises relevant to the decision
- Current market conditions (job market, housing, cost of living)
- Legal/regulatory status (visa rules, laws, restrictions)
- Safety and security (travel advisories, conflict zones)
- Economic conditions (inflation, recession signals, industry trends)

Return ONLY valid JSON:
{
  "queries": [
    "specific search query 1",
    "specific search query 2"
  ],
  "domain_flags": ["travel_safety", "geopolitical", "job_market", "financial", "legal", "health"]
}

domain_flags: mark which risk domains are relevant to this decision.
Only include flags that genuinely apply.
Do not include any text outside the JSON.
"""

REALITY_SYNTHESIZER_PROMPT = """
You are a reality check agent. You have been given real-world search results
about a person's decision. Your job is to extract HARD FACTS that must
constrain the simulation — things that are objectively true right now,
regardless of what the person hopes or plans.

These facts will be shown to ALL simulation agents as non-negotiable constraints.

Return ONLY valid JSON:
{
  "hard_constraints": [
    "Fact that is objectively true and significantly affects this decision",
    "Another hard constraint"
  ],
  "risk_flags": {
    "safety": "null or specific safety concern found",
    "legal": "null or specific legal/visa constraint found",
    "financial": "null or specific financial/economic constraint found",
    "market": "null or specific market condition found",
    "geopolitical": "null or specific geopolitical situation found"
  },
  "severity": "low|medium|high|critical",
  "severity_reason": "one sentence explaining the severity rating"
}

Rules:
- Only include facts that are CURRENT and REAL (from the search results)
- Do not invent or hallucinate — if searches returned nothing relevant, say so
- hard_constraints should be specific: include numbers, dates, names when available
- If severity is high or critical, the first constraint should state WHY clearly
- severity=critical means the decision is genuinely dangerous or likely to fail

Do not include any text outside the JSON.
"""


async def run_reality_check(decision: str, profile_summary: str) -> Dict[str, Any]:
    """
    Full reality check pipeline:
    1. Generate specific search queries for this decision
    2. Run the searches
    3. Synthesize into hard constraints
    """

    # Step 1: Generate targeted queries
    query_result = await call_llm(
        system_prompt=QUERY_GENERATOR_PROMPT,
        context={"profile": profile_summary, "decision": decision},
        history=[],
        agent_name="RealityQueryGen",
        model="gpt-4o-mini",
        max_tokens=600,
    )

    raw = query_result["response"]
    
    parsed = extract_json_from_response(raw, "RealityQueryGen")
    if "error" in parsed:
        queries = [f"{decision} risks 2025", f"{decision} current situation 2025"]
        domain_flags = []
    else:
        queries = parsed.get("queries", [])
        domain_flags = parsed.get("domain_flags", [])

    # Step 2: Run searches
    facts = await search_facts(queries[:6])

    if not facts:
        # No Tavily key or no results — return minimal reality check
        return {
            "hard_constraints": [],
            "risk_flags": {},
            "severity": "low",
            "severity_reason": "No real-world data available — simulation based on general knowledge only.",
            "domain_flags": domain_flags,
            "searches_ran": len(queries),
            "facts_found": 0,
        }

    # Step 3: Synthesize facts into hard constraints
    facts_text = "\n\n".join([
        f"Search: {f['query']}\nResult: {f['result']}"
        for f in facts
    ])

    synthesis_result = await call_llm(
        system_prompt=REALITY_SYNTHESIZER_PROMPT,
        context={
            "profile": profile_summary,
            "decision": f"{decision}\n\nSEARCH RESULTS:\n{facts_text}",
        },
        history=[],
        agent_name="RealityCheck",
        model="gpt-4o",
        max_tokens=1000,
    )

    raw2 = synthesis_result["response"]
    
    parsed = extract_json_from_response(raw2, "RealityCheck")
    if "error" in parsed:
        result = {
            "hard_constraints": [],
            "risk_flags": {},
            "severity": "low",
            "severity_reason": "Failed to synthesize search results.",
            "domain_flags": domain_flags,
            "searches_ran": len(queries),
            "facts_found": len(facts),
        }
    else:
        result = parsed
        result["domain_flags"] = domain_flags
        result["searches_ran"] = len(queries)
        result["facts_found"] = len(facts)
    
    return result


def format_reality_for_actors(reality: Dict[str, Any]) -> str:
    """Format reality check output as a mandatory context block for all actors."""
    if not reality.get("hard_constraints"):
        return ""

    lines = [
        "=== MANDATORY REAL-WORLD CONSTRAINTS ===",
        "The following are CURRENT FACTS you must treat as hard constraints.",
        "Do NOT contradict these in your simulation:",
        "",
    ]

    for constraint in reality["hard_constraints"]:
        lines.append(f"• {constraint}")

    severity = reality.get("severity", "low")
    if severity in ("high", "critical"):
        lines.append("")
        lines.append(f"⚠ SEVERITY: {severity.upper()} — {reality.get('severity_reason', '')}")

    lines.append("=========================================")
    return "\n".join(lines)
