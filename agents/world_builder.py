"""
Builds a 2-tier world of actors based on the decision domain and reality check.
Spawns appropriate actors for ANY life domain — not just tech/career.
"""
import json
from services.llm import call_llm
from models.schemas import ExtractedProfile
from agents.json_utils import extract_json_from_response
from typing import Dict, Any

WORLD_BUILDER_PROMPT = """
You are a world-building agent. Given a person's profile, their decision,
and current real-world facts, build a cast of actors who will be affected
by this decision.

{reality_section}

Use a 2-tier structure:
- 4-5 primary actors: major forces directly involved in this decision
- 2-3 sub-agents per primary: specific real entities within that force
- Relationships: who interacts with whom

IMPORTANT: Spawn actors appropriate for THIS specific decision domain.
Do NOT default to tech/career actors if the decision is about travel, health,
relationships, education, or anything else.

Examples by domain:
- Travel decision → Travel Advisory / Embassy, Airlines, Local Security, Finances, Support
- Health decision → Medical Team, Insurance, Employer, Family, Financial Impact
- Relocation → Housing Market, Employer/Job Market, Social Network, Finances, Government/Visa
- Education → Institution, Finances/Loans, Career Market, Family, Current Employer
- Relationship → Partner, Family, Social Circle, Finances, Career Impact
- Career change → Current Employer, Target Industry, Finances, Recruiter, Support System
- Startup → Current Employer, Target Market, Investors, Finances, Support System

Return ONLY valid JSON:
{
  "primary_actors": [
    {
      "id": "travel_advisory",
      "name": "US State Department / Travel Advisory",
      "role": "Issues official travel warnings and advisories for the destination",
      "motivation": "Citizen safety — will not soften warnings for political reasons",
      "stance": "warning",
      "color": "#ef4444",
      "search_queries": ["Iran travel advisory 2025 US State Department"],
      "sub_agents": [
        {
          "id": "embassy",
          "name": "Iranian Embassy / Consulate",
          "role": "Processes visa applications for this destination",
          "motivation": "Process applications per current policy — may have restrictions",
          "stance": "bureaucratic"
        },
        {
          "id": "border_control",
          "name": "Border Control / Entry",
          "role": "Enforces entry requirements at point of arrival",
          "motivation": "Apply current entry rules strictly",
          "stance": "strict"
        }
      ]
    }
  ],
  "relationships": [
    {
      "source": "embassy",
      "target": "border_control",
      "label": "issues visa for",
      "type": "collaboration"
    }
  ]
}

Rules:
- Generate actors specific to THIS decision — not generic career actors
- If reality check flagged safety/geopolitical risks, include a safety/advisory actor
- If reality check flagged legal constraints, include a legal/regulatory actor
- Assign distinct colors: #ef4444 (risk/safety), #6366f1 (institutional), #0ea5e9 (market/economic), #10b981 (opportunity), #f59e0b (financial), #ec4899 (personal/social)
- Total 14-18 agents across all primaries
- search_queries: 1 specific current-events query per primary

Do not include any text outside the JSON.
"""

# Domain-specific actor hints for the prompt
DOMAIN_HINTS = {
    "startup":      "Spawn: Current Employer, Target Market, Angel Investors, Personal Finances, Support System",
    "career":       "Spawn: Current Employer, Target Company/Industry, Recruiter Market, Personal Finances, Support System",
    "relocation":   "Spawn: Housing Market at Destination, Visa/Immigration Authority, Job Market, Current Social Network, Personal Finances",
    "travel":       "Spawn: Travel Advisory/Embassy, Airlines/Transport, Local Security Situation, Personal Finances, Support System",
    "relationship": "Spawn: Partner/Family, Social Circle, Personal Finances, Career Impact, Mental/Emotional Health",
    "education":    "Spawn: Target Institution, Student Finances/Loans, Career Market, Current Employer, Family/Support",
    "financial":    "Spawn: Bank/Lender, Market Conditions, Tax/Legal System, Personal Income, Family/Dependents",
    "health":       "Spawn: Medical System, Health Insurance, Employer/Work Impact, Family/Caregiving, Personal Finances",
    "lifestyle":    "Spawn: Personal Health/Wellness, Social Circle, Personal Finances, Career Impact, Support System",
    "other":        "Spawn actors most relevant to the specific decision described",
}


async def build_world(profile: ExtractedProfile, decision: str, reality: Dict[str, Any] = None) -> dict:
    domain = profile.decision_domain or "other"
    domain_hint = DOMAIN_HINTS.get(domain, DOMAIN_HINTS["other"])

    # Format reality constraints for the world builder
    reality_section = ""
    if reality and reality.get("hard_constraints"):
        severity = reality.get("severity", "low")
        constraints = reality.get("hard_constraints", [])
        reality_section = f"""CURRENT REAL-WORLD FACTS (from live searches):
Severity: {severity.upper()}
{chr(10).join(f'• {c}' for c in constraints)}

These facts MUST shape which actors you spawn and their stances.
For example: if there is an active conflict or travel warning, spawn a Safety/Advisory actor.
If there are sanctions or financial restrictions, spawn a Financial Restrictions actor."""

    # IMPORTANT: do NOT use str.format() here because the prompt contains many
    # JSON braces (e.g. { "primary_actors": ... }) which can trigger KeyError
    # like '\n "primary_actors"'.
    prompt = WORLD_BUILDER_PROMPT.replace("{reality_section}", reality_section)

    context = {
        "profile": json.dumps(profile.model_dump(), indent=2),
        "decision": f"{decision}\n\nDomain hint: {domain_hint}",
    }

    result = await call_llm(
        system_prompt=prompt,
        context=context,
        history=[],
        agent_name="WorldBuilder",
        model="gpt-4o",
        max_tokens=3000,
    )

    raw = result["response"]
    parsed = extract_json_from_response(raw, "WorldBuilder")
    
    if "error" in parsed:
        print(f"WorldBuilder: {parsed['error']}, using fallback minimal world")
        return {
            "primary_actors": [
                {
                    "id": "situation",
                    "name": "Current Situation",
                    "role": "The person's current circumstances",
                    "motivation": "Maintain stability",
                    "stance": "neutral",
                    "color": "#6366f1",
                    "search_queries": [],
                    "sub_agents": [],
                }
            ],
            "relationships": [],
        }
    
    return parsed
