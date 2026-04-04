"use client";
import { useState } from "react";
import { motion } from "framer-motion";

interface InputFormProps {
  onSubmit: (profile: string, decision: string) => void;
}

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

export default function InputForm({ onSubmit }: InputFormProps) {
  const [decision, setDecision] = useState("");
  const [age, setAge] = useState("");
  const [role, setRole] = useState("");
  const [runwayIndex, setRunwayIndex] = useState(2);
  const [riskTolerance, setRiskTolerance] = useState("balanced");
  const [supportTags, setSupportTags] = useState<string[]>([]);
  const [constraints, setConstraints] = useState("");

  const toggleSupport = (tag: string) =>
    setSupportTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const canSubmit = decision.trim().length > 10 && role.trim().length > 1;

  const handleSubmit = () => {
    const profileParts: string[] = [];
    if (age)   profileParts.push(`Age: ${age}`);
    if (role)  profileParts.push(`Role: ${role}`);
    profileParts.push(`Financial runway: ${RUNWAY_LABELS[runwayIndex]}`);
    profileParts.push(`Risk tolerance: ${riskTolerance}`);
    if (supportTags.length) profileParts.push(`Support: ${supportTags.join(", ")}`);
    if (constraints.trim()) profileParts.push(`Constraints: ${constraints}`);
    onSubmit(profileParts.join(". "), decision.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Decision — hero input */}
      <div className="mb-8">
        <label className="block text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: "var(--text-muted)" }}>
          What's the decision?
        </label>
        <textarea
          rows={3}
          className="w-full rounded-2xl px-5 py-4 text-base border-2 resize-none focus:outline-none transition-all"
          style={{
            background: "var(--surface)",
            borderColor: decision.length > 10 ? "var(--accent)" : "var(--border)",
            color: "var(--text)",
            boxShadow: decision.length > 10 ? "0 0 0 4px var(--accent-light)" : "none",
          }}
          placeholder='e.g. "What if I quit my job and go all-in on my startup?"'
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
        />
      </div>

      {/* About you */}
      <div className="rounded-2xl border p-6 mb-4 space-y-6"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>About you</p>

        {/* Age + Role */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Age
            </label>
            <input
              type="number"
              min={16} max={80}
              className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:border-violet-400 transition-all"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
              placeholder="e.g. 28"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Current role
            </label>
            <input
              type="text"
              className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:border-violet-400 transition-all"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
              placeholder="e.g. Software Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
        </div>

        {/* Financial runway slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              Financial runway
            </label>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
              {RUNWAY_LABELS[runwayIndex]}
            </span>
          </div>
          <input
            type="range" min={0} max={5} step={1}
            value={runwayIndex}
            onChange={(e) => setRunwayIndex(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: "var(--accent)", background: "var(--border)" }}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Tight</span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Comfortable</span>
          </div>
        </div>

        {/* Risk tolerance */}
        <div>
          <label className="block text-xs font-medium mb-2.5" style={{ color: "var(--text-secondary)" }}>
            Risk tolerance
          </label>
          <div className="grid grid-cols-3 gap-2">
            {RISK_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRiskTolerance(opt.value)}
                className="py-2.5 px-3 rounded-xl border text-left transition-all"
                style={{
                  background: riskTolerance === opt.value ? "var(--accent-light)" : "var(--bg)",
                  borderColor: riskTolerance === opt.value ? "var(--accent)" : "var(--border)",
                  color: riskTolerance === opt.value ? "var(--accent)" : "var(--text-secondary)",
                }}
              >
                <div className="text-xs font-semibold">{opt.label}</div>
                <div className="text-xs opacity-70 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Support system */}
        <div>
          <label className="block text-xs font-medium mb-2.5" style={{ color: "var(--text-secondary)" }}>
            Support system <span className="font-normal opacity-60">(select all that apply)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {SUPPORT_OPTIONS.map((tag) => {
              const active = supportTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleSupport(tag)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                  style={{
                    background: active ? "var(--accent-light)" : "var(--bg)",
                    borderColor: active ? "var(--accent)" : "var(--border)",
                    color: active ? "var(--accent)" : "var(--text-secondary)",
                  }}
                >
                  {active && <span className="mr-1">✓</span>}
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Constraints */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Key constraints <span className="font-normal opacity-60">(optional)</span>
          </label>
          <input
            type="text"
            className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:border-violet-400 transition-all"
            style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            placeholder="e.g. non-compete clause, visa tied to employer, mortgage"
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
          />
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full py-4 rounded-2xl text-white font-semibold text-base transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-2"
        style={{
          background: canSubmit
            ? "linear-gradient(135deg, var(--accent), var(--accent-mid))"
            : "var(--border-strong)",
          boxShadow: canSubmit ? "0 4px 20px rgba(91,69,224,0.35)" : "none",
        }}
      >
        Run Simulation ⚡
      </button>

      <p className="text-center text-xs mt-3" style={{ color: "var(--text-muted)" }}>
        Takes ~30 seconds · Results are illustrative, not financial advice
      </p>
    </motion.div>
  );
}
