"""
Actor agent — simulates a specific entity's reaction to the user's decision.
Now generates events WITH interactions (edges) to other actors.
"""
import json
from services.llm import call_llm
from typing import Any, Dict, List

ACTOR_PROMPT_TEMPLATE = """
You are simulating {actor_name} — {actor_role}.
Your motivation: {actor_motivation}
Your stance: {actor_stance}

The person: {profile_summary}
Their decision: {decision}

{facts_section}

Other actors in this simulation: {other_actors}

You are NOT an advisor. You ARE this entity reacting in real life.
Simulate what actually happens from your perspective over 12 months.

Generate 4-6 specific, concrete events. Some events should INTERACT with other actors
(e.g. HR Manager contacts Team Lead, Competitor reacts to startup launch).

Return ONLY valid JSON:
{{
  "actor": "{actor_name}",
  "actor_id": "{actor_id}",
  "stance": "one sentence on your position",
  "events": [
    {{
      "month": 1,
      "event": "Specific thing that happens — include real names, numbers, details",
      "type": "action|reaction|consequence|opportunity|risk",
      "impact": "positive|negative|neutral",
      "financial_delta": "$-2,400" or null,
      "detail": "One sentence of context",
      "interacts_with": "other_actor_id or null"
    }}
  ]
}}

Rules:
- Be SPECIFIC. Bad: "Things get hard." Good: "Posts replacement job listing on LinkedIn at $140k — 20% more than your salary."
- Include real numbers when relevant
- At least 2 events should interact with other actors (use their exact IDs: {other_actor_ids})
- Events should escalate month by month
- Reference real-world data if provided above

Do not include any text outside the JSON.
"""


async def run_actor(
    actor: Dict[str, Any],
    all_actors: List[Dict[str, Any]],
    profile_summary: str,
    decision: str,
    facts: str = "",
) -> Dict[str, Any]:
    other_actors = [a for a in all_actors if a["id"] != actor["id"]]
    other_names = ", ".join([f"{a['name']} (id: {a['id']})" for a in other_actors])
    other_ids = ", ".join([a["id"] for a in other_actors])

    prompt = ACTOR_PROMPT_TEMPLATE.format(
        actor_name=actor["name"],
        actor_id=actor["id"],
        actor_role=actor["role"],
        actor_motivation=actor["motivation"],
        actor_stance=actor["stance"],
        profile_summary=profile_summary,
        decision=decision,
        facts_section=facts if facts else "",
        other_actors=other_names,
        other_actor_ids=other_ids,
    )

    result = await call_llm(
        system_prompt=prompt,
        context={"profile": profile_summary, "decision": decision},
        history=[],
        agent_name=actor["name"],
        model="gpt-4o-mini",
        max_tokens=1200,
    )

    raw = result["response"]
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    try:
        return json.loads(raw.strip())
    except json.JSONDecodeError:
        return {
            "actor": actor["name"],
            "actor_id": actor["id"],
            "stance": actor.get("stance", ""),
            "events": [],
        }
