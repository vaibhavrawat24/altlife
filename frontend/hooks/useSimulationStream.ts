"use client";
import { useState, useCallback } from "react";
import { SimulationState, GraphEdge, SimulationEvent } from "@/types/simulation";

const INITIAL: SimulationState = {
  phase: "idle",
  profile: null,
  nodes: [],
  edges: [],
  timeline: [],
  synthesis: null,
  completedActorIds: [],
  error: null,
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function useSimulationStream() {
  const [state, setState] = useState<SimulationState>(INITIAL);

  const start = useCallback(async (profile: string, decision: string) => {
    setState({ ...INITIAL, phase: "extracting" });

    let response: Response;
    try {
      response = await fetch(`${API_URL}/simulate/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, decision }),
      });
    } catch {
      setState((s) => ({ ...s, phase: "error", error: "Cannot connect to server. Is the backend running on port 8000?" }));
      return;
    }

    if (!response.ok || !response.body) {
      setState((s) => ({ ...s, phase: "error", error: "Server returned an error." }));
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;
        try { applyEvent(JSON.parse(raw)); } catch { /* skip malformed */ }
      }
    }
  }, []);

  function applyEvent(event: { type: string; data: any }) {
    switch (event.type) {
      case "profile_extracted":
        setState((s) => ({ ...s, profile: event.data, phase: "building_world" }));
        break;

      case "graph_ready":
        setState((s) => ({
          ...s,
          nodes: event.data.nodes,
          edges: event.data.edges,
          phase: "simulating",
        }));
        break;

      case "facts_found":
        break;

      case "actor_complete": {
        const { actor_id, stance, events, interaction_edges } = event.data;
        const newEvents: SimulationEvent[] = events || [];
        setState((s) => {
          const newEdges: GraphEdge[] = [...s.edges];
          for (const ie of (interaction_edges || [])) {
            if (!newEdges.find((e) => e.id === ie.id)) {
              newEdges.push(ie);
            }
          }
          return {
            ...s,
            completedActorIds: [...s.completedActorIds, actor_id],
            edges: newEdges,
            nodes: s.nodes.map((n) =>
              n.id === actor_id
                ? { ...n, stance, events: newEvents, status: "done" }
                : n
            ),
          };
        });
        break;
      }

      case "interaction_edges": {
        const newEdges: GraphEdge[] = event.data.edges || [];
        setState((s) => {
          const edgeMap = new Map(s.edges.map((e) => [e.id, e]));
          newEdges.forEach((e) => edgeMap.set(e.id, e));
          return { ...s, edges: Array.from(edgeMap.values()) };
        });
        break;
      }

      case "timeline_ready":
        setState((s) => ({ ...s, timeline: event.data.events, phase: "synthesizing" }));
        break;

      case "synthesis_complete":
        setState((s) => ({ ...s, synthesis: event.data, phase: "complete" }));
        break;

      case "error":
        setState((s) => ({ ...s, phase: "error", error: event.data.message }));
        break;
    }
  }

  const reset = useCallback(() => setState(INITIAL), []);
  return { state, start, reset };
}
