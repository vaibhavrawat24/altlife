from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


class DecisionDomain(str, Enum):
    startup = "startup"
    career = "career"
    relocation = "relocation"
    travel = "travel"
    relationship = "relationship"
    education = "education"
    financial = "financial"
    health = "health"
    lifestyle = "lifestyle"
    other = "other"


class ExtractedProfile(BaseModel):
    age: Optional[str] = None
    profession: Optional[str] = None
    financial_runway: Optional[str] = None
    support_system: Optional[str] = None
    dependents: Optional[str] = None
    risk_tolerance: Optional[str] = None
    constraints: List[str] = []
    key_assets: List[str] = []
    decision_domain: DecisionDomain = DecisionDomain.other
    decision_summary: str
    next_chapter: Optional[str] = None
    next_chapter_detail: Optional[str] = None
    location: Optional[str] = None


class TimelineEvent(BaseModel):
    timeframe: str
    event: str


class AgentResponse(BaseModel):
    agent: str
    round: int
    perspective: str
    key_points: List[str]
    timeline: List[TimelineEvent]
    confidence: int


class SynthesisResult(BaseModel):
    verdict: str
    most_likely_outcome: str
    key_risks: List[str]
    key_opportunities: List[str]
    timeline: List[TimelineEvent]
    risk_score: int
    first_step: str
    agent_consensus: str


class SimulateRequest(BaseModel):
    profile: str
    decision: str


class SimulationEvent(BaseModel):
    type: str  # "profile_extracted" | "agent_complete" | "round_complete" | "synthesis_complete" | "error"
    data: dict
