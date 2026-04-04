import abc
from typing import Any, Dict, List
import asyncio

class BaseAgent(abc.ABC):
    def __init__(self, name: str, system_prompt: str):
        self.name = name
        self.system_prompt = system_prompt

    @abc.abstractmethod
    async def generate_response(self, context: Dict[str, Any], history: List[Dict[str, Any]]) -> Dict[str, Any]:
        pass
