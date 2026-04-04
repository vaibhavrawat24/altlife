"use client";
import { useState } from "react";
import { motion } from "framer-motion";

interface InputFormProps {
  onSubmit: (profile: string, decision: string) => void;
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

export default function InputForm({ onSubmit }: InputFormProps) {
  const [decision,          setDecision]          = useState("");
  const [age,               setAge]               = useState("");
  const [role,              setRole]              = useState("");
  const [location,          setLocation]          = useState("");
  const [runwayIndex,       setRunwayIndex]       = useState(2);
  const [riskTolerance,     setRiskTolerance]     = useState("balanced");
  const [supportTags,       setSupportTags]       = useState<string[]>([]);
  const [constraints,       setConstraints]       = useState("");
  const [nextChapter,       setNextChapter]       = useState("");
  const [nextChapterDetail, setNextChapterDetail] = useState("");

  const toggleSupport = (tag: string) =>
    setSupportTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const canSubmit = decision.trim().length > 10 && role.trim().length > 1;

  const handleSubmit = () => {
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
            borderColor: decision.length > 10 ? "var(--accent)" : "var(--border)",
            boxShadow: decision.length > 10 ? "0 0 0 3px var(--accent-light)" : "none",
          }}
          placeholder='e.g. "I am planning to leave my job and travel to Southeast Asia"'
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
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
          gridTemplateColumns: "repeat(4, 1fr)",
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
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
            <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: MONO, marginBottom: "6px" }}>Current situation</p>
            <input type="text"
              style={fieldInput}
              placeholder="e.g. nurse, student, freelancer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
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

      {/* ── Submit ────────────────────────────────────── */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          width: "100%",
          padding: "14px",
          fontFamily: MONO,
          fontSize: "13px",
          fontWeight: 700,
          letterSpacing: "0.05em",
          borderRadius: "6px",
          border: "none",
          cursor: canSubmit ? "pointer" : "not-allowed",
          background: canSubmit
            ? "var(--accent)"
            : "var(--border-strong)",
          color: canSubmit ? "#fff" : "var(--text-muted)",
          opacity: canSubmit ? 1 : 0.5,
          transition: "all 0.15s",
          marginBottom: "2px",
        }}
      >
        Run Simulation ⚡
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
    </motion.div>
  );
}
