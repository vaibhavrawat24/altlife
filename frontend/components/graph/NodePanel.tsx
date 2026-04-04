"use client";
import { motion, AnimatePresence } from "framer-motion";
import { SimulationState, GraphNode, SimulationEvent } from "@/types/simulation";

interface NodePanelProps {
  nodeId: string | null;
  state: SimulationState;
  onClose: () => void;
}

const IMPACT_DOT: Record<string, string> = {
  positive: "#10b981",
  negative: "#ef4444",
  neutral:  "#94a3b8",
};

const IMPACT_BG: Record<string, string> = {
  positive: "var(--success-bg)",
  negative: "var(--danger-bg)",
  neutral:  "var(--neutral-bg)",
};

function EventItem({ event, color }: { event: SimulationEvent; color: string }) {
  const dot = IMPACT_DOT[event.impact] ?? "#94a3b8";
  const bg  = IMPACT_BG[event.impact]  ?? "#f8fafc";

  return (
    <div className="flex gap-3 mb-3 last:mb-0">
      {/* Month pill */}
      <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold"
        style={{ background: color + "18", color }}>
        M{event.month}
      </div>
      {/* Card */}
      <div className="flex-1 rounded-xl p-3 border text-sm"
        style={{ background: bg, borderColor: dot + "44" }}>
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} />
          {event.financial_delta && (
            <span className="text-xs font-mono font-semibold" style={{ color: "var(--text-secondary)" }}>
              {event.financial_delta}
            </span>
          )}
          {event.interacts_with && (
            <span className="text-xs px-1.5 py-0.5 rounded-full ml-auto"
              style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
              interacts
            </span>
          )}
        </div>
        <p className="font-medium" style={{ color: "var(--text)" }}>{event.event}</p>
        {event.detail && (
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{event.detail}</p>
        )}
      </div>
    </div>
  );
}

export default function NodePanel({ nodeId, state, onClose }: NodePanelProps) {
  const node: GraphNode | undefined = state.nodes.find((n) => n.id === nodeId);

  return (
    <AnimatePresence>
      {nodeId && (
        <>
          {/* Backdrop (mobile) */}
          <motion.div
            className="fixed inset-0 z-20 lg:hidden"
            style={{ background: "#00000022" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key={nodeId}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="absolute top-0 right-0 h-full w-80 z-30 flex flex-col rounded-r-2xl border-l overflow-hidden"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b shrink-0"
              style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: node?.color ?? "#6366f1" }} />
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                    {node?.label ?? nodeId}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {node?.role}
                  </p>
                </div>
              </div>
              <button onClick={onClose}
                className="text-lg leading-none transition-colors hover:opacity-60"
                style={{ color: "var(--text-muted)" }}>
                ×
              </button>
            </div>

            {/* Stance */}
            {node?.stance && (
              <div className="px-5 py-3 border-b text-xs italic"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)", background: node.color + "0a" }}>
                "{node.stance}"
              </div>
            )}

            {/* Events */}
            <div className="flex-1 overflow-y-auto p-5">
              {!node || node.events.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: node?.color ?? "#ccc" }} />
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {node?.status === "pending" ? "Waiting to simulate…" : "Simulating…"}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-4"
                    style={{ color: "var(--text-muted)" }}>
                    {node.events.length} Events
                  </p>
                  {node.events.map((ev, i) => (
                    <EventItem key={i} event={ev} color={node.color} />
                  ))}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
