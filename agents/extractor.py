from services.llm import call_llm
from models.schemas import ExtractedProfile
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
  "decision_domain": "one of: startup | career | relocation | relationship | education | financial | lifestyle | other",
  "decision_summary": "one sentence summary of the core decision"
}

Be specific. Infer reasonably from context. If something is truly unknown, use null.
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
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    data = json.loads(raw.strip())
    return ExtractedProfile(**data)
