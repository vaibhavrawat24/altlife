"""
Builds a 2-tier world of actors:
  - 4-5 primary actors (major forces in the user's world)
  - 2-3 sub-agents per primary (specific entities within that force)
  - Relationships between actors (edges in the graph)
"""
import json
from services.llm import call_llm
from models.schemas import ExtractedProfile

WORLD_BUILDER_PROMPT = """
You are a world-building agent. Given a person's profile and decision,
build a structured cast of real-world actors who will be affected by this decision.

Use a 2-tier structure:
- Primary actors: major forces (employer, market, finances, investors, support)
- Sub-agents: specific entities within each primary (HR manager, team lead, early adopter, etc.)
- Relationships: who interacts with whom and how

Return ONLY valid JSON:
{
  "primary_actors": [
    {
      "id": "employer",
      "name": "Current Employer",
      "role": "The company the person is leaving",
      "motivation": "Retain talent, manage transition",
      "stance": "concerned",
      "color": "#6366f1",
      "search_queries": ["average notice period tech companies 2024"],
      "sub_agents": [
        {
          "id": "hr_manager",
          "name": "HR Manager",
          "role": "Handles the exit process and replacement hiring",
          "motivation": "Minimize disruption, file paperwork, find replacement",
          "stance": "neutral"
        },
        {
          "id": "team_lead",
          "name": "Team Lead",
          "role": "Directly affected by losing a key engineer",
          "motivation": "Protect project timelines, redistribute workload",
          "stance": "frustrated"
        }
      ]
    }
  ],
  "relationships": [
    {
      "source": "hr_manager",
      "target": "team_lead",
      "label": "coordinates replacement",
      "type": "collaboration"
    }
  ]
}

Rules:
- Generate 4-5 primary actors SPECIFIC to this decision and domain
- Each primary gets 2-3 sub-agents — real, named entities (not abstract)
- Relationships must reference valid actor IDs from the actors list
- Assign distinct colors to primary actors from: #6366f1, #0ea5e9, #10b981, #f59e0b, #ec4899
- Sub-agents inherit a lighter shade of their parent's color
- search_queries: 1-2 specific factual queries per primary actor
- Total agents should be 14-18 (4-5 primaries × 2-3 sub-agents each)

Do not include any text outside the JSON.
"""


async def build_world(profile: ExtractedProfile, decision: str) -> dict:
    context = {
        "profile": json.dumps(profile.model_dump(), indent=2),
        "decision": decision,
    }
    result = await call_llm(
        system_prompt=WORLD_BUILDER_PROMPT,
        context=context,
        history=[],
        agent_name="WorldBuilder",
        model="gpt-4o",
        max_tokens=3000,
    )
    raw = result["response"]
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    data = json.loads(raw.strip())
    return data
