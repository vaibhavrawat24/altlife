"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";

import ActorNode from "./ActorNode";
import DecisionNode from "./DecisionNode";
import { SimulationState, GraphNode, GraphEdge } from "@/types/simulation";

const nodeTypes = { actor: ActorNode, decision: DecisionNode };

interface SimulationGraphProps {
  state: SimulationState;
  onNodeClick: (nodeId: string) => void;
}

function toRFNodes(
  graphNodes: GraphNode[],
  completedIds: string[],
  phase: string,
  decisionLabel: string,
  onNodeClick: (id: string) => void
): Node[] {
  const rfNodes: Node[] = [
    {
      id: "__decision__",
      type: "decision",
      position: { x: 365, y: 265 },
      data: { label: decisionLabel, phase },
      draggable: true,
    },
  ];

  for (const n of graphNodes) {
    const isDone = completedIds.includes(n.id);
    const status = isDone ? "done" : phase === "simulating" ? "active" : "pending";

    rfNodes.push({
      id: n.id,
      type: "actor",
      position: { x: n.x - 36, y: n.y - 36 },
      data: {
        label: n.label,
        role: n.role,
        color: n.color,
        is_primary: n.is_primary,
        status,
        stance: n.stance,
        eventCount: (n.events || []).length,
        onClick: () => onNodeClick(n.id),
      },
      draggable: true,
    });
  }

  return rfNodes;
}

function toRFEdges(edges: GraphEdge[], completedIds: string[]): Edge[] {
  return edges.map((e) => {
    const isInteraction = e.type === "interaction";
    const isActive = isInteraction &&
      completedIds.includes(e.source) &&
      completedIds.includes(e.target);

    return {
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label || undefined,
      animated: isInteraction && isActive,
      style: {
        stroke: isInteraction ? "#5b45e088" : "#d4d0c8",
        strokeWidth: isInteraction ? 2 : 1,
        strokeDasharray: e.type === "hierarchy" ? "4 3" : undefined,
      },
      markerEnd: isInteraction
        ? { type: MarkerType.ArrowClosed, color: "#5b45e088", width: 12, height: 12 }
        : undefined,
      labelStyle: { fontSize: 10, fill: "#a09e99" },
      labelBgStyle: { fill: "#ffffff", fillOpacity: 0.85 },
    };
  });
}

// Add edges from decision center to all primary nodes
function addDecisionEdges(rfEdges: Edge[], graphNodes: GraphNode[]): Edge[] {
  const extra: Edge[] = graphNodes
    .filter((n) => n.is_primary)
    .map((n) => ({
      id: `__decision__${n.id}`,
      source: "__decision__",
      target: n.id,
      style: { stroke: "#c7bfff", strokeWidth: 1.5 },
      animated: false,
    }));
  return [...rfEdges, ...extra];
}

export default function SimulationGraph({ state, onNodeClick }: SimulationGraphProps) {
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);

  const decisionLabel = state.profile?.decision_summary ?? "Your Decision";

  useEffect(() => {
    if (state.nodes.length === 0) return;
    const nodes = toRFNodes(
      state.nodes,
      state.completedActorIds,
      state.phase,
      decisionLabel,
      onNodeClick
    );
    setRfNodes(nodes);
  }, [state.nodes, state.completedActorIds, state.phase, decisionLabel, onNodeClick]);

  useEffect(() => {
    if (state.nodes.length === 0) return;
    const edges = toRFEdges(state.edges, state.completedActorIds);
    const withCenter = addDecisionEdges(edges, state.nodes);
    setRfEdges(withCenter);
  }, [state.edges, state.completedActorIds, state.nodes]);

  const PHASE_LABELS: Record<string, string> = {
    extracting:    "Reading your situation…",
    building_world: "Building your world…",
    simulating:    "Actors are simulating…",
    synthesizing:  "Synthesizing your report…",
    complete:      `${state.completedActorIds.length} agents · ${state.timeline.length} events`,
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border"
      style={{ height: 560, background: "#faf9f7", borderColor: "var(--border)" }}>

      {/* Phase badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border"
        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
        {state.phase !== "complete" && state.phase !== "idle" && (
          <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block"
            style={{ background: "var(--accent)" }} />
        )}
        {PHASE_LABELS[state.phase] ?? ""}
      </div>

      {/* Hint */}
      {state.phase === "complete" && (
        <div className="absolute top-4 right-4 z-10 text-xs px-3 py-1.5 rounded-full border"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
          Click any node to inspect
        </div>
      )}

      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.4}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e8e6e0" />
        <Controls showInteractive={false}
          style={{ background: "white", border: "1px solid var(--border)", borderRadius: 8 }} />
      </ReactFlow>
    </div>
  );
}
