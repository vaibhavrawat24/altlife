"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import InputForm from "@/components/input/InputForm";
import SimulationGraph from "@/components/graph/SimulationGraph";
import NodePanel from "@/components/graph/NodePanel";
import { useSimulationStream } from "@/hooks/useSimulationStream";

const IMPACT_DOT: Record<string, string> = {
  positive: "#10b981",
  negative: "#ef4444",
  neutral: "#94a3b8",
};

export default function SimulatePage() {
  const { state, start, reset } = useSimulationStream();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const isRunning = state.phase !== "idle";

  const handleNodeClick = (id: string) => {
    setSelectedNodeId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b sticky top-0 z-40"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <Link href="/" className="font-semibold text-sm" style={{ color: "var(--text)" }}>
          Altlife
        </Link>
        {isRunning && (
          <button onClick={() => { reset(); setSelectedNodeId(null); }}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-all"
            style={{ color: "var(--text-secondary)", borderColor: "var(--border)" }}>
            ← New simulation
          </button>
        )}
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {/* Input */}
          {!isRunning && (
            <motion.div key="input"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="max-w-2xl mx-auto">
              <div className="mb-10">
                <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text)" }}>
                  Simulate your decision
                </h1>
                <p className="text-base" style={{ color: "var(--text-secondary)" }}>
                  A network of real-world actors will simulate how your decision unfolds over 12 months.
                </p>
              </div>
              <InputForm onSubmit={start} />
            </motion.div>
          )}

          {/* Simulation */}
          {isRunning && (
            <motion.div key="sim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

              {/* Profile chip */}
              {state.profile && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    {state.profile.decision_summary}
                  </span>
                  {state.profile.profession && (
                    <span className="text-xs px-2.5 py-1 rounded-full border"
                      style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                      {state.profile.profession}
                    </span>
                  )}
                  {state.profile.decision_domain && (
                    <span className="text-xs px-2.5 py-1 rounded-full border"
                      style={{ background: "var(--accent-light)", borderColor: "#c7bfff", color: "var(--accent)" }}>
                      {state.profile.decision_domain}
                    </span>
                  )}
                </motion.div>
              )}

              {/* Reality check alert */}
              {state.reality && state.reality.hard_constraints.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border p-4"
                  style={{
                    background: state.reality.severity === "critical" ? "#fff5f5"
                      : state.reality.severity === "high" ? "#fffbeb"
                      : "var(--surface)",
                    borderColor: state.reality.severity === "critical" ? "#fca5a5"
                      : state.reality.severity === "high" ? "#fcd34d"
                      : "var(--border)",
                  }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">
                      {state.reality.severity === "critical" ? "🚨"
                        : state.reality.severity === "high" ? "⚠️"
                        : "ℹ️"}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-widest"
                      style={{
                        color: state.reality.severity === "critical" ? "#ef4444"
                          : state.reality.severity === "high" ? "#d97706"
                          : "var(--text-secondary)",
                      }}>
                      Real-world check · {state.reality.severity} severity
                    </span>
                    <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
                      {state.reality.facts_found} sources
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {state.reality.hard_constraints.map((c, i) => (
                      <li key={i} className="text-sm flex gap-2" style={{ color: "var(--text)" }}>
                        <span style={{ color: "var(--text-muted)" }}>•</span>{c}
                      </li>
                    ))}
                  </ul>
                  {state.reality.severity_reason && (
                    <p className="text-xs mt-2 italic" style={{ color: "var(--text-muted)" }}>
                      {state.reality.severity_reason}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Graph */}
              <div className="relative">
                <SimulationGraph state={state} onNodeClick={handleNodeClick} />
                <NodePanel nodeId={selectedNodeId} state={state} onClose={() => setSelectedNodeId(null)} />
              </div>

              {/* Agent legend */}
              {state.nodes.filter((n) => n.is_primary).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {state.nodes.filter((n) => n.is_primary).map((n) => {
                    const done = state.completedActorIds.includes(n.id);
                    const subs = state.nodes.filter((s) => s.parent_id === n.id);
                    const doneSubs = subs.filter((s) => state.completedActorIds.includes(s.id)).length;
                    return (
                      <button key={n.id}
                        onClick={() => handleNodeClick(n.id)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
                        style={{
                          background: selectedNodeId === n.id ? n.color + "18" : "var(--surface)",
                          borderColor: selectedNodeId === n.id ? n.color : "var(--border)",
                          color: done ? n.color : "var(--text-secondary)",
                        }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: done ? n.color : "#ccc" }} />
                        {n.label}
                        <span style={{ color: "var(--text-muted)" }}>
                          +{subs.length} sub · {doneSubs}/{subs.length + 1} done
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Error */}
              {state.phase === "error" && (
                <div className="rounded-xl border p-5"
                  style={{ background: "#fff5f5", borderColor: "#fecaca" }}>
                  <p className="font-semibold mb-1" style={{ color: "#ef4444" }}>Simulation failed</p>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{state.error}</p>
                  <button onClick={() => { reset(); setSelectedNodeId(null); }}
                    className="mt-3 text-sm underline" style={{ color: "var(--text-muted)" }}>
                    Try again
                  </button>
                </div>
              )}

              {/* Timeline — compact inline list below graph */}
              {state.timeline.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                  <h3 className="text-xs font-semibold uppercase tracking-widest mb-4"
                    style={{ color: "var(--text-muted)" }}>
                    Full Timeline — {state.timeline.length} events across 12 months
                  </h3>
                  <div className="space-y-2">
                    {state.timeline.map((ev, i) => {
                      const node = state.nodes.find((n) => n.id === ev.actor_id);
                      const color = node?.color ?? "#6366f1";
                      const dot = IMPACT_DOT[ev.impact] ?? "#94a3b8";
                      return (
                        <motion.div key={i}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.025 }}
                          className="flex gap-3 items-start p-3 rounded-xl border cursor-pointer transition-all hover:border-current"
                          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                          onClick={() => handleNodeClick(ev.actor_id)}>
                          <span className="text-xs font-bold shrink-0 w-7"
                            style={{ color: "var(--text-muted)" }}>
                            M{ev.month}
                          </span>
                          <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                            style={{ background: dot }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm" style={{ color: "var(--text)" }}>{ev.event}</p>
                            {ev.financial_delta && (
                              <span className="text-xs font-mono"
                                style={{ color: "var(--text-secondary)" }}>
                                {ev.financial_delta}
                              </span>
                            )}
                          </div>
                          <span className="text-xs shrink-0 px-2 py-0.5 rounded-full"
                            style={{ background: color + "15", color }}>
                            {ev.actor}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Synthesis */}
              {state.synthesis && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4 pt-4 border-t"
                  style={{ borderColor: "var(--border)" }}>

                  <h3 className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "var(--text-muted)" }}>
                    Synthesis
                  </h3>

                  {/* Verdict + Risk */}
                  <div className="rounded-2xl border-2 p-6"
                    style={{ borderColor: "#c7bfff", background: "#faf8ff" }}>
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <p className="text-xs font-semibold uppercase tracking-widest mb-2"
                          style={{ color: "var(--accent)" }}>Verdict</p>
                        <p className="text-base font-medium leading-relaxed"
                          style={{ color: "var(--text)" }}>
                          {state.synthesis.verdict}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-3xl font-bold" style={{
                          color: state.synthesis.risk_score < 35 ? "#10b981"
                            : state.synthesis.risk_score < 65 ? "#f59e0b" : "#ef4444"
                        }}>
                          {state.synthesis.risk_score}
                        </div>
                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>risk score</div>
                      </div>
                    </div>
                    {/* Risk bar */}
                    <div className="mt-4 rounded-full h-1.5 overflow-hidden"
                      style={{ background: "var(--border)" }}>
                      <motion.div className="h-full rounded-full"
                        style={{
                          background: state.synthesis.risk_score < 35 ? "#10b981"
                            : state.synthesis.risk_score < 65 ? "#f59e0b" : "#ef4444"
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${state.synthesis.risk_score}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Risks */}
                    <div className="rounded-xl border p-4"
                      style={{ background: "#fff5f5", borderColor: "#fecaca" }}>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                        style={{ color: "#ef4444" }}>Key Risks</p>
                      {(state.synthesis.key_risks ?? []).map((r, i) => (
                        <p key={i} className="text-sm mb-1.5 flex gap-2"
                          style={{ color: "var(--text-secondary)" }}>
                          <span style={{ color: "#ef4444" }}>•</span>{r}
                        </p>
                      ))}
                    </div>
                    {/* Opportunities */}
                    <div className="rounded-xl border p-4"
                      style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                        style={{ color: "#10b981" }}>Key Opportunities</p>
                      {(state.synthesis.key_opportunities ?? []).map((o, i) => (
                        <p key={i} className="text-sm mb-1.5 flex gap-2"
                          style={{ color: "var(--text-secondary)" }}>
                          <span style={{ color: "#10b981" }}>•</span>{o}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Turning points */}
                  {state.synthesis.turning_points?.length > 0 && (
                    <div className="rounded-xl border p-5"
                      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-4"
                        style={{ color: "var(--text-muted)" }}>
                        Critical Turning Points
                      </p>
                      {state.synthesis.turning_points.map((tp, i) => (
                        <div key={i} className="flex gap-3 mb-3 last:mb-0">
                          <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold"
                            style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                            M{tp.month}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                              {tp.event}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                              {tp.why}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* First step CTA */}
                  <div className="rounded-xl border-2 p-5"
                    style={{ background: "var(--accent-light)", borderColor: "var(--accent)" }}>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                      style={{ color: "var(--accent)" }}>
                      Your next step — this week
                    </p>
                    <p className="text-base font-semibold" style={{ color: "var(--text)" }}>
                      {state.synthesis.first_step}
                    </p>
                  </div>

                  {state.synthesis.agent_consensus && (
                    <p className="text-xs text-center italic px-4"
                      style={{ color: "var(--text-muted)" }}>
                      {state.synthesis.agent_consensus}
                    </p>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
