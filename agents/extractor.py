from services.llm import call_llm
from models.schemas import ExtractedProfile
from agents.json_utils import extract_json_from_response
import json

EXTRACTOR_PROMPT = """
You are a profile extraction agent. Your job is to analyze a user's freeform description
of themselves and their life decision, and extract structured information from it.

Return ONLY valid JSON matching this exact schema:
{
  "age": "string or null",
  "profession": "string or null",
  "financial_runway": "string or null (e.g. '6 months', '$40k savings', 'in debt')",
  "support_system": "string or null (e.g. 'partner supportive', 'family opposed', 'alone')",
  "dependents": "string or null (e.g. 'no dependents', '2 kids', 'aging parents')",
  "risk_tolerance": "low | medium | high | null (infer from context if not stated)",
  "constraints": ["list", "of", "constraints"],
  "key_assets": ["list", "of", "strengths or assets"],
  "decision_domain": "one of: startup | career | relocation | travel | relationship | education | financial | health | lifestyle | other",
  "decision_summary": "one sentence summary of the core decision",
  "next_chapter": "null or one of: startup | travel | new_job | study | freelance | relocate | caregiving | undecided",
  "next_chapter_detail": "null or brief description of what they plan to do after the decision",
  "location": "null or city/country if mentioned"
}

Rules:
- decision_domain should reflect the PRIMARY nature of the decision
- If travel is involved (trip, moving abroad, visiting a country) use 'travel' or 'relocation'
- next_chapter captures what they're moving TOWARD — extract from context if stated
- Be specific. Infer reasonably from context. If something is truly unknown, use null.
Do not include any text outside the JSON.
"""


async def extract_profile(profile: str, decision: str) -> ExtractedProfile:
    context = {"profile": profile, "decision": decision}
    result = await call_llm(
        system_prompt=EXTRACTOR_PROMPT,
        context=context,
        history=[],
        agent_name="Extractor",
        model="gpt-4o-mini",
    )
    raw = result["response"]
    
    data = extract_json_from_response(raw, "Extractor")
    
    if "error" in data:
        print(f"Extractor: Using fallback profile due to: {data['error']}")
        return ExtractedProfile(
            decision_summary="Unable to parse profile",
            decision_domain="other"
        )
    
    try:
        return ExtractedProfile(**data)
    except Exception as e:
        print(f"Extractor: Failed to create ExtractedProfile from data: {e}")
        print(f"  Data keys: {list(data.keys())}")
        return ExtractedProfile(
            decision_summary="Unable to create profile",
            decision_domain="other"
        )
