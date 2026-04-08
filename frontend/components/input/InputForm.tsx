"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useAuth } from "@/hooks/useAuth";

interface InputFormProps {
  onSubmit: (profile: string, decision: string) => void;
  prefillDecision?: string;
}

const MONO = "var(--font-space-mono), 'Courier New', monospace";

const RISK_OPTIONS = [
  { value: "conservative", label: "Conservative", desc: "Prefer stability" },
  { value: "balanced",     label: "Balanced",     desc: "Weigh both sides" },
  { value: "bold",         label: "Bold",          desc: "High risk, high reward" },
];

const SUPPORT_OPTIONS = [
  "Partner is supportive",
  "Family is supportive",
  "Going solo",
  "Partner is skeptical",
  "Family is opposed",
  "Strong friend network",
];

const RUNWAY_LABELS = ["<1 month", "1–3 months", "3–6 months", "6–12 months", "1–2 years", "2+ years"];

const NEXT_CHAPTER_OPTIONS = [
  { value: "startup",     label: "Start a business",       icon: "↗" },
  { value: "travel",      label: "Travel / time off",      icon: "→" },
  { value: "new_job",     label: "Move to a new job",      icon: "↑" },
  { value: "freelance",   label: "Freelance / consult",    icon: "◈" },
  { value: "relocate",    label: "Relocate somewhere",     icon: "⊕" },
  { value: "caregiving",  label: "Family / caregiving",    icon: "♡" },
  { value: "undecided",   label: "Nothing planned yet",    icon: "?" },
  { value: "other",       label: "Something else",         icon: "+" },
];

// ── Shared style helpers ──────────────────────────────────

const sectionBox: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "10px",
  background: "var(--surface)",
};

const label: React.CSSProperties = {
  display: "block",
  fontSize: "10px",
  fontFamily: MONO,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--text-muted)",
  marginBottom: "10px",
};

const fieldInput: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: "13px",
  fontFamily: MONO,
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  color: "var(--text)",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};

// ── Component ─────────────────────────────────────────────

export default function InputForm({ onSubmit, prefillDecision = "" }: InputFormProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { user, isAuthenticated } = useAuth();
  const { isBlocked, formattedTime, canLoginToReset, recordSimulation } = useRateLimit(user?.user_id);
  const [decision,          setDecision]          = useState(prefillDecision);
  const [age,               setAge]               = useState("");
  const [role,              setRole]              = useState("");
  const [location,          setLocation]          = useState("");
  const [runwayIndex,       setRunwayIndex]       = useState(2);
  const [riskTolerance,     setRiskTolerance]     = useState("balanced");
  const [supportTags,       setSupportTags]       = useState<string[]>([]);
  const [constraints,       setConstraints]       = useState("");
  const [nextChapter,       setNextChapter]       = useState("");
  const [nextChapterDetail, setNextChapterDetail] = useState("");
  const [attempted,         setAttempted]         = useState(false);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [showLoginModal,    setShowLoginModal]    = useState(false);

  const toggleSupport = (tag: string) =>
    setSupportTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const decisionOk = decision.trim().length > 10;
  const roleOk     = role.trim().length > 1;
  const canSubmit  = decisionOk && roleOk;

  const handleSubmit = () => {
    if (isBlocked) {
      return; // Don't allow submission
    }
    if (!canSubmit) {
      setAttempted(true);
      return;
    }
    const parts: string[] = [];
    if (age)      parts.push(`Age: ${age}`);
    if (role)     parts.push(`Current situation: ${role}`);
    if (location) parts.push(`Location: ${location}`);
    parts.push(`Financial runway: ${RUNWAY_LABELS[runwayIndex]}`);
    parts.push(`Risk tolerance: ${riskTolerance}`);
    if (supportTags.length) parts.push(`Support system: ${supportTags.join(", ")}`);
    if (constraints.trim()) parts.push(`Constraints: ${constraints}`);
    if (nextChapter) {
      const lbl = NEXT_CHAPTER_OPTIONS.find(o => o.value === nextChapter)?.label ?? nextChapter;
      parts.push(`Plan after this decision: ${lbl}`);
    }
    if (nextChapterDetail.trim()) parts.push(`Details about next chapter: ${nextChapterDetail}`);
    recordSimulation(); // Record the simulation for rate limiting
    onSubmit(parts.join(". "), decision.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ width: "100%", maxWidth: "640px", margin: "0 auto", fontFamily: MONO }}
    >
      {/* ── Decision ──────────────────────────────────── */}
      <div style={{ marginBottom: "10px" }}>
        <span style={label}>What&apos;s the decision?</span>
        <textarea
          rows={3}
          style={{
            ...fieldInput,
            resize: "none",
            lineHeight: 1.6,
            borderColor: attempted && !decisionOk ? "#ef4444" : decision.length > 10 ? "var(--accent)" : "var(--border)",
            boxShadow: attempted && !decisionOk ? "0 0 0 3px rgba(239,68,68,0.15)" : decision.length > 10 ? "0 0 0 3px var(--accent-light)" : "none",
          }}
          placeholder='e.g. "I am planning to leave my job and travel to Southeast Asia"'
          value={decision}
          onChange={(e) => { setDecision(e.target.value); if (attempted) setAttempted(false); }}
        />
      </div>

      {/* ── Next chapter ──────────────────────────────── */}
      <div style={sectionBox}>
        <span style={label}>What&apos;s the plan after?</span>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: MONO, marginBottom: "14px" }}>
          This changes which actors get spawned and how risks are calculated.
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: "6px",
        }}>
          {NEXT_CHAPTER_OPTIONS.map((opt) => {
            const active = nextChapter === opt.value;
            return (
              <button key={opt.value}
                onClick={() => setNextChapter(active ? "" : opt.value)}
                style={{
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: "6px",
                  padding: "12px 8px",
                  border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "6px",
                  background: active ? "var(--accent-light)" : "var(--bg)",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  cursor: "pointer",
                  fontFamily: MONO,
                  transition: "all 0.15s",
                }}>
                <span style={{ fontSize: "16px", lineHeight: 1 }}>{opt.icon}</span>
                <span style={{ fontSize: "10px", textAlign: "center", lineHeight: 1.3 }}>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {nextChapter && nextChapter !== "undecided" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            style={{ marginTop: "10px" }}
          >
            <input
              type="text"
              style={fieldInput}
              placeholder={
                nextChapter === "startup"    ? "e.g. already have 200 users, B2B fintech idea" :
                nextChapter === "travel"     ? "e.g. 6 months, Southeast Asia, leave in 3 weeks" :
                nextChapter === "new_job"    ? "e.g. offer at a competitor, 30% raise" :
                nextChapter === "freelance"  ? "e.g. 2 clients lined up, design work" :
                nextChapter === "relocate"   ? "e.g. moving to Berlin, have a job offer" :
                nextChapter === "caregiving" ? "e.g. newborn, aging parent, 6 months leave" :
                nextChapter === "other"      ? "describe your plan..." :
                "Tell us more..."
              }
              value={nextChapterDetail}
              onChange={(e) => setNextChapterDetail(e.target.value)}
            />
          </motion.div>
        )}
      </div>

      {/* ── About you ─────────────────────────────────── */}
      <div style={sectionBox}>
        <span style={label}>About you</span>

        {/* Age + Role */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
          <div>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: MONO, marginBottom: "6px" }}>Age</p>
            <input type="number" min={16} max={80}
              style={fieldInput}
              placeholder="e.g. 28"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <div>
            <p style={{ fontSize: "11px", color: attempted && !roleOk ? "#ef4444" : "var(--text-muted)", fontFamily: MONO, marginBottom: "6px" }}>Current situation</p>
            <input type="text"
              style={{
                ...fieldInput,
                borderColor: attempted && !roleOk ? "#ef4444" : "var(--border)",
                boxShadow: attempted && !roleOk ? "0 0 0 3px rgba(239,68,68,0.15)" : "none",
              }}
              placeholder="e.g. nurse, student, freelancer"
              value={role}
              onChange={(e) => { setRole(e.target.value); if (attempted) setAttempted(false); }}
            />
          </div>
        </div>

        {/* Location */}
        <div style={{ marginBottom: "18px" }}>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: MONO, marginBottom: "6px" }}>
            Where are you based?
          </p>
          <input type="text"
            style={fieldInput}
            placeholder="e.g. London, UK · Chicago, US · Mumbai, India"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {/* Financial runway */}
        <div style={{ marginBottom: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: MONO }}>Financial runway</p>
            <span style={{
              fontSize: "10px", fontFamily: MONO,
              padding: "2px 10px",
              border: "1px solid var(--accent-border)",
              borderRadius: "4px",
              background: "var(--accent-light)",
              color: "var(--accent)",
            }}>
              {RUNWAY_LABELS[runwayIndex]}
            </span>
          </div>
          <input type="range" min={0} max={5} step={1}
            value={runwayIndex}
            onChange={(e) => setRunwayIndex(Number(e.target.value))}
            style={{ width: "100%", accentColor: "var(--accent)", cursor: "pointer" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: MONO }}>Tight</span>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: MONO }}>Comfortable</span>
          </div>
        </div>

        {/* Risk tolerance */}
        <div style={{ marginBottom: "18px" }}>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: MONO, marginBottom: "10px" }}>Risk tolerance</p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "6px" }}>
            {RISK_OPTIONS.map((opt) => {
              const active = riskTolerance === opt.value;
              return (
                <button key={opt.value}
                  onClick={() => setRiskTolerance(opt.value)}
                  style={{
                    padding: "10px 12px",
                    border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: "6px",
                    background: active ? "var(--accent-light)" : "var(--bg)",
                    color: active ? "var(--accent)" : "var(--text-secondary)",
                    cursor: "pointer",
                    fontFamily: MONO,
                    textAlign: "left",
                    transition: "all 0.15s",
                  }}>
                  <div style={{ fontSize: "11px", fontWeight: 700 }}>{opt.label}</div>
                  <div style={{ fontSize: "10px", opacity: 0.7, marginTop: "2px" }}>{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Support system */}
        <div style={{ marginBottom: "18px" }}>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: MONO, marginBottom: "10px" }}>
            Support system <span style={{ opacity: 0.6 }}>(select all that apply)</span>
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {SUPPORT_OPTIONS.map((tag) => {
              const active = supportTags.includes(tag);
              return (
                <button key={tag}
                  onClick={() => toggleSupport(tag)}
                  style={{
                    padding: "6px 12px",
                    border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: "4px",
                    background: active ? "var(--accent-light)" : "var(--bg)",
                    color: active ? "var(--accent)" : "var(--text-secondary)",
                    cursor: "pointer",
                    fontFamily: MONO,
                    fontSize: "11px",
                    transition: "all 0.15s",
                  }}>
                  {active && <span style={{ marginRight: "4px" }}>✓</span>}
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Constraints */}
        <div>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: MONO, marginBottom: "6px" }}>
            Key constraints <span style={{ opacity: 0.6 }}>(optional)</span>
          </p>
          <input type="text"
            style={fieldInput}
            placeholder="e.g. visa restrictions, family obligations, health condition, debt"
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
          />
        </div>
      </div>

      {/* ── Validation alert ──────────────────────────── */}
      {attempted && !canSubmit && (
        <div style={{
          marginBottom: "10px",
          padding: "10px 14px",
          borderRadius: "6px",
          border: "1px solid #fecaca",
          background: "var(--danger-bg)",
          fontSize: "11px",
          fontFamily: MONO,
          color: "#ef4444",
          letterSpacing: "0.02em",
        }}>
          fill in the required fields for a better simulation
        </div>
      )}

      {/* ── Rate limit cooldown alert ────────────────── */}
      {isBlocked && (
        <div style={{
          marginBottom: "10px",
          padding: "12px 14px",
          borderRadius: "6px",
          border: "1px solid #fbbf24",
          background: "rgba(251, 191, 36, 0.1)",
          fontSize: "11px",
          fontFamily: MONO,
          color: "#b45309",
          letterSpacing: "0.02em",
        }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              ⏱️ Wait {formattedTime} to generate the next simulation{" "}
              <button
                onClick={() => setShowRateLimitModal(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#b45309",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontFamily: MONO,
                  fontSize: "11px",
                  padding: 0,
                  marginLeft: "4px",
                }}
              >
                (click to know why)
              </button>
            </div>
            {canLoginToReset && !isAuthenticated && (
              <button
                onClick={() => setShowLoginModal(true)}
                style={{
                  background: "#b45309",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  fontFamily: MONO,
                  fontSize: "11px",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  whiteSpace: "nowrap",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                or login →
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Submit ────────────────────────────────────── */}
      <button
        onClick={handleSubmit}
        disabled={isBlocked}
        style={{
          width: "100%",
          padding: "14px",
          fontFamily: MONO,
          fontSize: "13px",
          fontWeight: 700,
          letterSpacing: "0.05em",
          borderRadius: "6px",
          border: "none",
          cursor: isBlocked ? "not-allowed" : "pointer",
          background: isBlocked ? "#d1d5db" : "var(--accent)",
          color: isBlocked ? "#6b7280" : "#fff",
          transition: "opacity 0.15s",
          marginBottom: "2px",
          opacity: isBlocked ? 0.6 : 1,
        }}
      >
        {isBlocked ? `Wait ${formattedTime}` : "Run Simulation ⚡"}
      </button>

      <p style={{
        textAlign: "center",
        fontSize: "10px",
        color: "var(--text-muted)",
        fontFamily: MONO,
        marginTop: "10px",
        letterSpacing: "0.04em",
      }}>
        Takes ~30–45 seconds · Checks live world conditions · Not financial or legal advice
      </p>

      {/* ── Rate Limit Explanation Modal ─────────────── */}
      {showRateLimitModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "16px",
        }} onClick={() => setShowRateLimitModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              fontFamily: MONO,
            }}
          >
            {/* Header with icon */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
            }}>
              <div style={{
                fontSize: "32px",
                filter: "opacity(0.8)",
              }}>
                🔒
              </div>
              <h2 style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--text)",
                letterSpacing: "0.05em",
              }}>
                Why the timeout?
              </h2>
            </div>

            {/* Content */}
            <div style={{
              lineHeight: 1.8,
              marginBottom: "24px",
              color: "var(--text-secondary)",
              fontSize: "13px",
            }}>
              <p style={{ marginBottom: "16px" }}>
                <strong style={{ color: "var(--text)" }}>Altlife is open source</strong> and free for everyone. 
                To keep the service running smoothly and prevent abuse, we limit each user to one simulation every <strong>15 minutes</strong>.
              </p>
              <p style={{ marginBottom: "16px" }}>
                This gives our servers time to rest between requests and ensures fair access for all users worldwide.
              </p>
              {!isAuthenticated && (
                <p style={{ marginBottom: "16px", padding: "12px", background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: "6px", color: "#16a34a" }}>
                  ⚡ <strong>Unlock more simulations:</strong> <a href="/auth/signup" style={{ color: "inherit", textDecoration: "underline", fontWeight: 600, cursor: "pointer" }}>Sign up</a> to simulate instantly without waiting for 15 minutes!
                </p>
              )}
              <p style={{ marginTop: "20px", fontSize: "12px", opacity: 0.7 }}>
                💡 <strong>Pro tip:</strong> Use this time to reflect on your decision or discuss it with someone you trust.
              </p>
            </div>

            {/* Visual meter */}
            <div style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "24px",
              textAlign: "center",
            }}>
              <div style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#fbbf24",
                marginBottom: "8px",
                letterSpacing: "0.1em",
              }}>
                15 MIN
              </div>
              <div style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                letterSpacing: "0.05em",
              }}>
                Timeout between simulations
              </div>
            </div>

            {/* Features list */}
            <div style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "24px",
            }}>
              <div style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--text-muted)",
                marginBottom: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}>
                Open Source Benefits
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {["🌍 Available to everyone globally", "⚡ AI-powered simulations", "🔄 Solo maintained"].map((item, i) => (
                  <div key={i} style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                  }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowRateLimitModal(false)}
              style={{
                width: "100%",
                padding: "12px",
                background: "var(--accent)",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontFamily: MONO,
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.05em",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Got it! ✓
            </button>
          </motion.div>
        </div>
      )}

      {/* ── Login Modal (to get free simulation) ────── */}
      {showLoginModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "16px",
        }} onClick={() => setShowLoginModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              fontFamily: MONO,
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
            }}>
              <div style={{ fontSize: "28px" }}>🔓</div>
              <h2 style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--text)",
                letterSpacing: "0.05em",
              }}>
                Unlock More Simulations
              </h2>
            </div>

            <div style={{
              lineHeight: 1.8,
              marginBottom: "24px",
              color: "var(--text-secondary)",
              fontSize: "13px",
            }}>
              <p style={{ marginBottom: "12px" }}>
                Login to simulate instantly without waiting for 15 minutes.
              </p>
            </div>

            <div style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "24px",
              fontSize: "12px",
              color: "var(--text-muted)",
              textAlign: "center",
            }}>
              💡 Your simulations and preferences are saved to your account
            </div>

            <div style={{
              display: "flex",
              gap: "8px",
              flexDirection: "column",
            }}>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  router.push("/auth/login");
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "var(--accent)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontFamily: MONO,
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  router.push("/auth/signup");
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "transparent",
                  color: "var(--accent)",
                  border: "1px solid var(--accent)",
                  borderRadius: "6px",
                  fontFamily: MONO,
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--accent)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--accent)";
                }}
              >
                Sign Up
              </button>
              <button
                onClick={() => setShowLoginModal(false)}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "none",
                  color: "var(--text-muted)",
                  border: "none",
                  borderRadius: "6px",
                  fontFamily: MONO,
                  fontSize: "12px",
                  cursor: "pointer",
                  letterSpacing: "0.04em",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
  
}
