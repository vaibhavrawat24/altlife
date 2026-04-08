"use client";
import { useEffect, useState, Suspense } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import InputForm from "@/components/input/InputForm";
import SimulationGraph from "@/components/graph/SimulationGraph";
import NodePanel from "@/components/graph/NodePanel";
import { useSimulationStream } from "@/hooks/useSimulationStream";

const IMPACT_DOT: Record<string, string> = {
  positive: "#10b981",
  negative: "#ef4444",
  neutral:  "#94a3b8",
};

// ── Theme toggle icons ────────────────────────────────────

function SunIcon({ color }: { color: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3.2" stroke={color} strokeWidth="1.4"/>
      {[0,45,90,135,180,225,270,315].map((deg) => {
        const r = Math.PI * deg / 180;
        return <line key={deg}
          x1={8 + Math.cos(r) * 5.2} y1={8 + Math.sin(r) * 5.2}
          x2={8 + Math.cos(r) * 7}   y2={8 + Math.sin(r) * 7}
          stroke={color} strokeWidth="1.4" strokeLinecap="round"/>;
      })}
    </svg>
  );
}

function MoonIcon({ color }: { color: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M13 10.5A6 6 0 0 1 5.5 3a6 6 0 1 0 7.5 7.5z"
        stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────

function SimulatePageInner() {
  const { state, start, reset } = useSimulationStream();
  const { user, logout, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const prefillDecision = searchParams.get("decision") ?? "";
  const shareId = searchParams.get("id") ?? "";

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [copyLabel, setCopyLabel] = useState("share results");
  const [shareDismissed, setShareDismissed] = useState(false);
  const [sharedState, setSharedState] = useState<any>(null);
  const [shareLoading, setShareLoading] = useState(!!shareId);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // If ?id= param present, fetch shared result from backend
  useEffect(() => {
    if (!shareId) {
      setShareLoading(false);
      setSharedState(null);
      return;
    }

    setShareLoading(true);
    setSharedState(null);

    fetch(`${API_URL}/share/${shareId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) setSharedState({
          ...data,
          completedActorIds: (data.nodes ?? []).map((n: any) => n.id),
          edges: data.edges ?? [],
          phase: "complete",
          error: null,
        });
      })
      .finally(() => {
        setShareLoading(false);
      });
  }, [shareId, API_URL]);

  const activeState = sharedState ?? state;
  const isRunning = !sharedState && state.phase !== "idle";

  // Wrapper to pass user_id to start function
  const handleSimulationStart = (profile: string, decision: string) => {
    start(profile, decision, user?.user_id);
  };

  // sync theme from localStorage on mount
  useEffect(() => {
    try {
      setIsDark(localStorage.getItem("altlife-theme") === "dark");
    } catch { /* no localStorage */ }
  }, []);

  const handleShare = async () => {
    const payload = {
      profile: activeState.profile,
      reality: activeState.reality,
      synthesis: activeState.synthesis,
      timeline: activeState.timeline,
      nodes: activeState.nodes,
    };
    try {
      // Pass user_id if authenticated
      let shareUrl = `${API_URL}/share`;
      if (user?.user_id) {
        shareUrl += `?user_id=${encodeURIComponent(user.user_id)}`;
      }
      
      const res = await fetch(shareUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const { id } = await res.json();
      const url = `${window.location.origin}/simulate?id=${id}`;
      await navigator.clipboard.writeText(url);
      setCopyLabel("link copied!");
      setTimeout(() => setCopyLabel("share results"), 2500);
    } catch {
      setCopyLabel("failed to share");
      setTimeout(() => setCopyLabel("share results"), 2500);
    }
  };

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    const t = next ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("altlife-theme", t); } catch { /* no localStorage */ }
  };

  const handleNodeClick = (id: string) =>
    setSelectedNodeId((prev) => (prev === id ? null : id));

  const isMobile = useIsMobile();
  const iconColor = isDark ? "rgba(205,195,178,0.5)" : "rgba(92,79,68,0.5)";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", transition: "background 0.25s ease" }}>

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 40,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: isMobile ? "0 16px" : "0 28px", height: "52px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        transition: "background 0.25s ease",
      }}>
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: "8px",
          textDecoration: "none",
        }}>
          <svg width="22" height="22" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="18" r="3.5" fill="var(--text)"/>
            <line x1="2" y1="18" x2="14" y2="18" stroke="var(--text)" strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="14" y1="18" x2="30" y2="7" stroke="var(--text)" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="30" cy="7" r="2.4" stroke="var(--text)" strokeWidth="1.8" fill="none"/>
            <line x1="14" y1="18" x2="30" y2="29" stroke="var(--text)" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="30" cy="29" r="2.4" stroke="var(--text)" strokeWidth="1.8" fill="none"/>
          </svg>
          <span style={{
            fontWeight: 700, fontSize: "13px",
            letterSpacing: "-0.01em", color: "var(--text)",
            fontFamily: "var(--font-space-mono), 'Courier New', monospace",
          }}>
            altlife
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* theme toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to light" : "Switch to dark"}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "32px", height: "32px",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "6px", cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {isDark ? <SunIcon color={iconColor} /> : <MoonIcon color={iconColor} />}
          </button>

          {(isRunning || sharedState) && activeState.synthesis && (
            <button onClick={handleShare}
              style={{
                fontSize: "11px", fontFamily: "var(--font-space-mono), 'Courier New', monospace",
                padding: "6px 12px", borderRadius: "6px",
                border: "1px solid var(--border)",
                background: copyLabel === "link copied!" ? "var(--success-bg)" : "transparent",
                color: copyLabel === "link copied!" ? "#10b981" : "var(--text-secondary)",
                cursor: "pointer", letterSpacing: "0.02em",
                transition: "all 0.2s",
              }}>
              {copyLabel}
            </button>
          )}
          {isRunning && (
            <button onClick={() => { reset(); setSelectedNodeId(null); }}
              style={{
                fontSize: "11px", fontFamily: "var(--font-space-mono), 'Courier New', monospace",
                padding: "6px 12px", borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "transparent", color: "var(--text-secondary)",
                cursor: "pointer", letterSpacing: "0.02em",
              }}>
              {isMobile ? "← new" : "← new simulation"}
            </button>
          )}

          {/* Auth Section */}
          {user ? (
            // Profile Menu
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {user.is_admin && (
                <Link href="/admin" style={{
                  fontSize: "11px", fontFamily: "var(--font-space-mono), 'Courier New', monospace",
                  padding: "6px 10px", borderRadius: "6px",
                  border: "1px solid var(--border)",
                  background: "transparent", color: "var(--accent)",
                  textDecoration: "none",
                }}>
                  Admin
                </Link>
              )}

              <Link href="/history" style={{
                fontSize: "11px", fontFamily: "var(--font-space-mono), 'Courier New', monospace",
                padding: "6px 10px", borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "transparent", color: "var(--text-secondary)",
                textDecoration: "none",
              }}>
                History
              </Link>

              <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                title={user.email}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "32px", height: "32px",
                  background: "var(--accent)",
                  border: "none",
                  borderRadius: "50%", cursor: "pointer",
                  color: "#fff", fontSize: "14px", fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {user.email?.[0]?.toUpperCase() || "U"}
              </button>

              {showProfileMenu && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  zIndex: 1000,
                  minWidth: "180px",
                }}>
                  <div style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid var(--border)",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-space-mono), 'Courier New', monospace",
                  }}>
                    {user.email}
                  </div>
                  
                  {user.login_bonus_remaining > 0 && (
                    <div style={{
                      padding: "8px 12px",
                      fontSize: "11px",
                      color: "#10b981",
                      fontFamily: "var(--font-space-mono), 'Courier New', monospace",
                      borderBottom: "1px solid var(--border)",
                    }}>
                      🎁 {user.login_bonus_remaining} free sim{user.login_bonus_remaining !== 1 ? "s" : ""}
                    </div>
                  )}
                  
                  <button
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "transparent",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontFamily: "var(--font-space-mono), 'Courier New', monospace",
                      textAlign: "left",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    Logout
                  </button>
                </div>
              )}
              </div>
            </div>
          ) : authLoading ? (
            <div style={{
              width: "128px",
              height: "32px",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              opacity: 0.55,
            }} />
          ) : (
            // Login/Signup Buttons
            <div style={{ display: "flex", gap: "8px" }}>
              <Link href="/auth/login" style={{
                fontSize: "11px", fontFamily: "var(--font-space-mono), 'Courier New', monospace",
                padding: "6px 12px", borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "transparent", color: "var(--text-secondary)",
                cursor: "pointer", letterSpacing: "0.02em",
                textDecoration: "none",
                transition: "all 0.2s",
              }} onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                Log in
              </Link>
              <Link href="/auth/signup" style={{
                fontSize: "11px", fontFamily: "var(--font-space-mono), 'Courier New', monospace",
                padding: "6px 12px", borderRadius: "6px",
                border: "none",
                background: "var(--accent)", color: "#fff",
                cursor: "pointer", letterSpacing: "0.02em",
                textDecoration: "none",
                transition: "opacity 0.2s",
              }} onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: isMobile ? "24px 16px" : "48px 24px" }}>
        <AnimatePresence mode="wait">

          {/* ── Input ─────────────────────────────────── */}
          {!isRunning && !sharedState && !shareLoading && !shareId && (
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
              <InputForm onSubmit={handleSimulationStart} prefillDecision={prefillDecision} />
            </motion.div>
          )}

          {/* ── Simulation ────────────────────────────── */}
          {(isRunning || sharedState) && (
            <motion.div key="sim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

              {/* Profile chip */}
              {activeState.profile && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    {activeState.profile.decision_summary}
                  </span>
                  {activeState.profile.profession && (
                    <span className="text-xs px-2.5 py-1 rounded-full border"
                      style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                      {activeState.profile.profession}
                    </span>
                  )}
                  {activeState.profile.decision_domain && (
                    <span className="text-xs px-2.5 py-1 rounded-full border"
                      style={{ background: "var(--accent-light)", borderColor: "var(--accent-border)", color: "var(--accent)" }}>
                      {activeState.profile.decision_domain}
                    </span>
                  )}
                </motion.div>
              )}

              {/* Reality check */}
              {activeState.reality && activeState.reality.hard_constraints.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border p-4"
                  style={{
                    background: activeState.reality.severity === "critical" ? "var(--danger-bg)"
                      : activeState.reality.severity === "high" ? "var(--warning-bg)"
                      : "var(--surface)",
                    borderColor: activeState.reality.severity === "critical" ? "var(--danger-border)"
                      : activeState.reality.severity === "high" ? "var(--warning-border)"
                      : "var(--border)",
                  }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">
                      {activeState.reality.severity === "critical" ? "🚨"
                        : activeState.reality.severity === "high" ? "⚠️" : "ℹ️"}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-widest"
                      style={{
                        color: activeState.reality.severity === "critical" ? "#ef4444"
                          : activeState.reality.severity === "high" ? "#d97706"
                          : "var(--text-secondary)",
                      }}>
                      Real-world check · {activeState.reality.severity} severity
                    </span>
                    <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
                      {activeState.reality.facts_found} sources
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {activeState.reality.hard_constraints.map((c: any, i: number) => (
                      <li key={i} className="text-sm flex gap-2" style={{ color: "var(--text)" }}>
                        <span style={{ color: "var(--text-muted)" }}>•</span>{c}
                      </li>
                    ))}
                  </ul>
                  {activeState.reality.severity_reason && (
                    <p className="text-xs mt-2 italic" style={{ color: "var(--text-muted)" }}>
                      {activeState.reality.severity_reason}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Graph */}
              <div className="relative">
                <SimulationGraph state={activeState} onNodeClick={handleNodeClick} />
                <NodePanel nodeId={selectedNodeId} state={activeState} onClose={() => setSelectedNodeId(null)} />
              </div>

              {/* Agent legend */}
              {activeState.nodes.filter((n: any) => n.is_primary).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeState.nodes.filter((n: any) => n.is_primary).map((n: any) => {
                    const done    = activeState.completedActorIds.includes(n.id);
                    const subs    = activeState.nodes.filter((s: any) => s.parent_id === n.id);
                    const doneSubs = subs.filter((s: any) => activeState.completedActorIds.includes(s.id)).length;
                    return (
                      <button key={n.id}
                        onClick={() => handleNodeClick(n.id)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all"
                        style={{
                          background: selectedNodeId === n.id ? n.color + "18" : "var(--surface)",
                          borderColor: selectedNodeId === n.id ? n.color : "var(--border)",
                          color: done ? n.color : "var(--text-secondary)",
                        }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: done ? n.color : "var(--border-strong)" }} />
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
                  style={{ background: "var(--danger-bg)", borderColor: "var(--danger-border)" }}>
                  <p className="font-semibold mb-1" style={{ color: "#ef4444" }}>Simulation failed</p>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{state.error}</p>
                  <button onClick={() => { reset(); setSelectedNodeId(null); }}
                    className="mt-3 text-sm underline" style={{ color: "var(--text-muted)" }}>
                    Try again
                  </button>
                </div>
              )}

              {/* Synthesis */}
              {activeState.synthesis && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4 pt-4 border-t"
                  style={{ borderColor: "var(--border)" }}>

                  <h3 className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: "var(--text-muted)" }}>
                    Synthesis
                  </h3>

                  {/* Verdict card */}
                  <div className="rounded-2xl border-2 p-6"
                    style={{ borderColor: "var(--accent-border)", background: "var(--accent-surface)" }}>
                    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "flex-start", justifyContent: "space-between", gap: isMobile ? "12px" : "24px" }}>
                      <div style={{ flex: 1 }}>
                        <p className="text-xs font-semibold uppercase tracking-widest mb-2"
                          style={{ color: "var(--accent)" }}>Verdict</p>
                        <p className="text-base font-medium leading-relaxed" style={{ color: "var(--text)" }}>
                          {activeState.synthesis.verdict}
                        </p>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: isMobile ? "left" : "right" }}>
                        <div className="text-3xl font-bold" style={{
                          color: activeState.synthesis.risk_score < 35 ? "#10b981"
                            : activeState.synthesis.risk_score < 65 ? "#f59e0b" : "#ef4444"
                        }}>
                          {activeState.synthesis.risk_score}
                        </div>
                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>risk score</div>
                      </div>
                    </div>
                    {/* Risk bar */}
                    <div className="mt-4 rounded-full h-1.5 overflow-hidden" style={{ background: "var(--border)" }}>
                      <motion.div className="h-full rounded-full"
                        style={{
                          background: activeState.synthesis.risk_score < 35 ? "#10b981"
                            : activeState.synthesis.risk_score < 65 ? "#f59e0b" : "#ef4444"
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${activeState.synthesis.risk_score}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Risks */}
                    <div className="rounded-xl border p-4"
                      style={{ background: "var(--danger-bg)", borderColor: "var(--danger-border)" }}>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                        style={{ color: "#ef4444" }}>Key Risks</p>
                      {(activeState.synthesis.key_risks ?? []).map((r: any, i: number) => (
                        <p key={i} className="text-sm mb-1.5 flex gap-2" style={{ color: "var(--text-secondary)" }}>
                          <span style={{ color: "#ef4444" }}>•</span>{r}
                        </p>
                      ))}
                    </div>
                    {/* Opportunities */}
                    <div className="rounded-xl border p-4"
                      style={{ background: "var(--success-bg)", borderColor: "var(--success-border)" }}>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-3"
                        style={{ color: "#10b981" }}>Key Opportunities</p>
                      {(activeState.synthesis.key_opportunities ?? []).map((o: any, i: number) => (
                        <p key={i} className="text-sm mb-1.5 flex gap-2" style={{ color: "var(--text-secondary)" }}>
                          <span style={{ color: "#10b981" }}>•</span>{o}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Turning points */}
                  {activeState.synthesis.turning_points?.length > 0 && (
                    <div className="rounded-xl border p-5"
                      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                      <p className="text-xs font-semibold uppercase tracking-widest mb-4"
                        style={{ color: "var(--text-muted)" }}>
                        Critical Turning Points
                      </p>
                      {activeState.synthesis.turning_points.map((tp: any, i: number) => (
                        <div key={i} className="flex gap-3 mb-3 last:mb-0">
                          <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold"
                            style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                            M{tp.month}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{tp.event}</p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{tp.why}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* First step */}
                  <div className="rounded-xl border-2 p-5"
                    style={{ background: "var(--accent-light)", borderColor: "var(--accent)" }}>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                      style={{ color: "var(--accent)" }}>
                      Your next step — this week
                    </p>
                    <p className="text-base font-semibold" style={{ color: "var(--text)" }}>
                      {activeState.synthesis.first_step}
                    </p>
                  </div>

                  {activeState.synthesis.agent_consensus && (
                    <p className="text-xs text-center italic px-4" style={{ color: "var(--text-muted)" }}>
                      {activeState.synthesis.agent_consensus}
                    </p>
                  )}
                </motion.div>
              )}


              {/* Timeline */}
              {activeState.timeline.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{
                      fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em",
                      textTransform: "uppercase", color: "var(--text-muted)",
                      fontFamily: "var(--font-space-mono), 'Courier New', monospace",
                    }}>
                      Timeline — {activeState.timeline.length} events across 12 months
                    </h3>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {(timelineExpanded ? activeState.timeline : activeState.timeline.slice(0, 3)).map((ev: any, i: number) => {
                      const node  = activeState.nodes.find((n: any) => n.id === ev.actor_id);
                      const color = node?.color ?? "#6366f1";
                      const dot   = IMPACT_DOT[ev.impact] ?? "#94a3b8";
                      return (
                        <motion.div key={i}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.025 }}
                          onClick={() => handleNodeClick(ev.actor_id)}
                          style={{
                            padding: "12px 14px",
                            borderRadius: "10px",
                            border: "1px solid var(--border)",
                            background: "var(--surface)",
                            cursor: "pointer",
                          }}>
                          {/* Top row: month + dot + actor */}
                          <div style={{ width: "100%" }}>
                            <div style={{
                              display: "flex", alignItems: "center", gap: "8px",
                              marginBottom: "6px",
                            }}>
                              <span style={{
                                fontSize: "10px", fontWeight: 700,
                                fontFamily: "var(--font-space-mono), 'Courier New', monospace",
                                color: "var(--text-muted)", letterSpacing: "0.04em",
                              }}>
                                M{ev.month}
                              </span>
                              <div style={{
                                width: "6px", height: "6px", borderRadius: "50%", background: dot, flexShrink: 0,
                              }} />
                              <span style={{
                                fontSize: "10px",
                                fontFamily: "var(--font-space-mono), 'Courier New', monospace",
                                padding: "2px 8px", borderRadius: "20px",
                                background: color + "18", color,
                              }}>
                                {ev.actor}
                              </span>
                            </div>
                            {/* Event text */}
                            <p style={{
                              margin: 0, fontSize: "13px", lineHeight: 1.6,
                              color: "var(--text)",
                              fontFamily: "var(--font-space-mono), 'Courier New', monospace",
                            }}>
                              {ev.event}
                            </p>
                            {ev.financial_delta && (
                              <span style={{
                                display: "inline-block", marginTop: "4px",
                                fontSize: "11px", color: "var(--text-secondary)",
                                fontFamily: "var(--font-space-mono), 'Courier New', monospace",
                              }}>
                                {ev.financial_delta}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );

                      {shareLoading && !sharedState && (
                        <motion.div
                          key="share-loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          style={{
                            minHeight: isMobile ? "240px" : "320px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid var(--border)",
                            borderRadius: "12px",
                            background: "var(--surface)",
                            color: "var(--text-secondary)",
                            fontSize: "13px",
                          }}
                        >
                          Loading simulation…
                        </motion.div>
                      )}
                    })}
                  </div>

                  {activeState.timeline.length > 3 && (
                    <button
                      onClick={() => setTimelineExpanded(p => !p)}
                      style={{
                        marginTop: "10px",
                        width: "100%",
                        padding: "10px",
                        fontSize: "11px",
                        fontFamily: "var(--font-space-mono), 'Courier New', monospace",
                        letterSpacing: "0.05em",
                        background: "transparent",
                        border: "1px solid var(--border)",
                        borderRadius: "6px",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        transition: "border-color 0.15s, color 0.15s",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-strong)";
                        (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                        (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                      }}
                    >
                      {timelineExpanded
                        ? "↑ show less"
                        : `↓ show ${activeState.timeline.length - 3} more events`}
                    </button>
                  )}
                </motion.div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed share bar */}
      {activeState.synthesis && !sharedState && !shareDismissed && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 260, damping: 24 }}
          style={{
            position: "fixed", bottom: "24px",
            right: "24px",
            zIndex: 50,
            display: "flex", alignItems: "center", gap: "10px",
            padding: "8px 12px",
            borderRadius: "40px",
            background: "var(--surface)",
            border: "1px solid var(--border-strong)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            fontFamily: "var(--font-space-mono), 'Courier New', monospace",
            whiteSpace: "nowrap",
          }}>
          {/* Close button on left border */}
          <button onClick={() => setShareDismissed(true)} style={{
            position: "absolute", left: "-8px", top: "50%", transform: "translateY(-50%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "16px", height: "16px",
            background: "var(--surface)", border: "1px solid var(--border-strong)",
            borderRadius: "50%", cursor: "pointer",
            color: "var(--text-muted)", fontSize: "11px",
            lineHeight: 1, padding: 0,
          }}>×</button>
          <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
            know someone facing this?
          </span>
          <button onClick={handleShare} style={{
            padding: "5px 12px",
            fontSize: "10px", fontWeight: 700,
            letterSpacing: "0.04em",
            fontFamily: "var(--font-space-mono), 'Courier New', monospace",
            borderRadius: "20px", border: "none",
            cursor: "pointer",
            background: copyLabel === "link copied!" ? "#10b981" : "var(--accent)",
            color: "#fff",
            transition: "background 0.2s",
          }}>
            {copyLabel === "link copied!" ? "✓ copied!" : "share →"}
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default function SimulatePage() {
  return (
    <Suspense>
      <SimulatePageInner />
    </Suspense>
  );
}
