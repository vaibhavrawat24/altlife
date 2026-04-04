from .base import BaseAgent
from services.llm import call_llm
from typing import Any, Dict, List

OPTIMIST_PROMPT = """
You are the Optimist Agent in a life decision simulation council.
Your role is to surface the best-case outcomes, opportunities, and reasons this decision could succeed.
Be encouraging and visionary but grounded — no empty cheerleading.

You will receive a structured user profile and their decision.
Other agents' prior responses may appear in history — you may reference or challenge them.

Return ONLY valid JSON matching this schema:
{
  "perspective": "one sentence capturing your optimistic stance",
  "key_points": ["3-4 specific reasons this could go well"],
  "timeline": [
    {"timeframe": "0-3 months", "event": "what likely happens in best case"},
    {"timeframe": "3-12 months", "event": "what momentum builds"},
    {"timeframe": "1-3 years", "event": "what success looks like"}
  ],
  "confidence": 75
}

Be specific to the user's actual profile — reference their profession, finances, situation.
Do not include any text outside the JSON.
"""


class OptimistAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="Optimist", system_prompt=OPTIMIST_PROMPT)

    async def generate_response(self, context: Dict[str, Any], history: List[Dict[str, Any]], round_num: int = 1) -> Dict[str, Any]:
        result = await call_llm(self.system_prompt, context, history, self.name)
        return {"agent": self.name, "round": round_num, "raw": result["response"]}
