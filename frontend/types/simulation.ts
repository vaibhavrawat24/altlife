export type SimulationPhase =
  | "idle"
  | "extracting"
  | "building_world"
  | "searching"
  | "simulating"
  | "synthesizing"
  | "complete"
  | "error";

export interface SimulationEvent {
  month: number;
  actor: string;
  actor_id: string;
  event: string;
  type: string;
  impact: "positive" | "negative" | "neutral";
  financial_delta?: string | null;
  detail?: string;
  interacts_with?: string | null;
}

export interface GraphNode {
  id: string;
  label: string;
  role: string;
  color: string;
  is_primary: boolean;
  parent_id: string | null;
  x: number;
  y: number;
  stance: string;
  events: SimulationEvent[];
  status: "pending" | "active" | "done";
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type: "hierarchy" | "interaction" | "collaboration";
  month?: number;
}

export interface ExtractedProfile {
  age: string | null;
  profession: string | null;
  financial_runway: string | null;
  support_system: string | null;
  risk_tolerance: string | null;
  constraints: string[];
  key_assets: string[];
  decision_domain: string;
  decision_summary: string;
}

export interface SynthesisResult {
  verdict: string;
  most_likely_outcome: string;
  turning_points: Array<{ month: number; event: string; why: string }>;
  key_risks: string[];
  key_opportunities: string[];
  risk_score: number;
  first_step: string;
  conditions_for_success: string;
  agent_consensus: string;
}

export interface RealityCheck {
  severity: "low" | "medium" | "high" | "critical";
  severity_reason: string;
  hard_constraints: string[];
  risk_flags: Record<string, string | null>;
  domain_flags: string[];
  facts_found: number;
}

export interface SimulationState {
  phase: SimulationPhase;
  profile: ExtractedProfile | null;
  reality: RealityCheck | null;
  nodes: GraphNode[];
  edges: GraphEdge[];
  timeline: SimulationEvent[];
  synthesis: SynthesisResult | null;
  completedActorIds: string[];
  error: string | null;
}
