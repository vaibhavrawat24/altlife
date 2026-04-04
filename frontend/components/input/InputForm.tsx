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

const NEXT_CHAPTER_OPTIONS = [
  { value: "startup",    label: "Start a business",      icon: "🚀" },
  { value: "travel",     label: "Travel / take time off", icon: "✈️" },
  { value: "new_job",    label: "Move to a new job",      icon: "💼" },
  { value: "study",      label: "Go back to school",      icon: "🎓" },
  { value: "freelance",  label: "Freelance / consult",    icon: "💻" },
  { value: "relocate",   label: "Relocate somewhere",     icon: "🌍" },
  { value: "caregiving", label: "Family / caregiving",    icon: "❤️" },
  { value: "undecided",  label: "Nothing planned yet",    icon: "🤷" },
];

export default function InputForm({ onSubmit }: InputFormProps) {
  const [decision, setDecision] = useState("");
  const [age, setAge] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [runwayIndex, setRunwayIndex] = useState(2);
  const [riskTolerance, setRiskTolerance] = useState("balanced");
  const [supportTags, setSupportTags] = useState<string[]>([]);
  const [constraints, setConstraints] = useState("");
  const [nextChapter, setNextChapter] = useState("");
  const [nextChapterDetail, setNextChapterDetail] = useState("");

  const toggleSupport = (tag: string) =>
    setSupportTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const canSubmit = decision.trim().length > 10 && role.trim().length > 1;

  const handleSubmit = () => {
    const profileParts: string[] = [];
    if (age)      profileParts.push(`Age: ${age}`);
    if (role)     profileParts.push(`Current situation: ${role}`);
    if (location) profileParts.push(`Location: ${location}`);
    profileParts.push(`Financial runway: ${RUNWAY_LABELS[runwayIndex]}`);
    profileParts.push(`Risk tolerance: ${riskTolerance}`);
    if (supportTags.length) profileParts.push(`Support system: ${supportTags.join(", ")}`);
    if (constraints.trim()) profileParts.push(`Constraints: ${constraints}`);
    if (nextChapter) {
      const label = NEXT_CHAPTER_OPTIONS.find(o => o.value === nextChapter)?.label ?? nextChapter;
      profileParts.push(`Plan after this decision: ${label}`);
    }
    if (nextChapterDetail.trim()) profileParts.push(`Details about next chapter: ${nextChapterDetail}`);
    onSubmit(profileParts.join(". "), decision.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Decision — hero input */}
      <div className="mb-6">
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
          placeholder='e.g. "I am planning to leave my job and travel to Southeast Asia"'
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
        />
      </div>

      {/* Next chapter — what are you moving toward? */}
      <div className="rounded-2xl border p-6 mb-4 space-y-4"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div>
          <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--text)" }}>
            What's the plan after?
          </p>
          <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
            This changes which actors get spawned and how risks are calculated.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {NEXT_CHAPTER_OPTIONS.map((opt) => {
              const active = nextChapter === opt.value;
              return (
                <button key={opt.value} onClick={() => setNextChapter(active ? "" : opt.value)}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-center transition-all"
                  style={{
                    background: active ? "var(--accent-light)" : "var(--bg)",
                    borderColor: active ? "var(--accent)" : "var(--border)",
                    color: active ? "var(--accent)" : "var(--text-secondary)",
                  }}>
                  <span className="text-xl">{opt.icon}</span>
                  <span className="text-xs font-medium leading-tight">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional detail about next chapter */}
        {nextChapter && nextChapter !== "undecided" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
            <input
              type="text"
              className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:border-violet-400 transition-all"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
              placeholder={
                nextChapter === "startup"   ? "e.g. already have 200 users, B2B fintech idea" :
                nextChapter === "travel"    ? "e.g. 6 months, Southeast Asia, leave in 3 weeks" :
                nextChapter === "new_job"   ? "e.g. offer at a competitor, 30% raise" :
                nextChapter === "study"     ? "e.g. MBA, part-time, already accepted" :
                nextChapter === "freelance" ? "e.g. 2 clients lined up, design work" :
                nextChapter === "relocate"  ? "e.g. moving to Berlin, have a job offer" :
                nextChapter === "caregiving"? "e.g. newborn, aging parent, 6 months leave" :
                "Tell us more..."
              }
              value={nextChapterDetail}
              onChange={(e) => setNextChapterDetail(e.target.value)}
            />
          </motion.div>
        )}
      </div>

      {/* About you */}
      <div className="rounded-2xl border p-6 mb-4 space-y-5"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>About you</p>

        {/* Age + Role + Location */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Age
            </label>
            <input type="number" min={16} max={80}
              className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:border-violet-400 transition-all"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
              placeholder="e.g. 28"
              value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Current situation
            </label>
            <input type="text"
              className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:border-violet-400 transition-all"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
              placeholder="e.g. nurse, student, freelancer"
              value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Where are you based? <span className="font-normal opacity-60">(city / country)</span>
          </label>
          <input type="text"
            className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:border-violet-400 transition-all"
            style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            placeholder="e.g. London, UK · Chicago, US · Mumbai, India"
            value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>

        {/* Financial runway */}
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
          <input type="range" min={0} max={5} step={1}
            value={runwayIndex}
            onChange={(e) => setRunwayIndex(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: "var(--accent)", background: "var(--border)" }} />
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
              <button key={opt.value} onClick={() => setRiskTolerance(opt.value)}
                className="py-2.5 px-3 rounded-xl border text-left transition-all"
                style={{
                  background: riskTolerance === opt.value ? "var(--accent-light)" : "var(--bg)",
                  borderColor: riskTolerance === opt.value ? "var(--accent)" : "var(--border)",
                  color: riskTolerance === opt.value ? "var(--accent)" : "var(--text-secondary)",
                }}>
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
                <button key={tag} onClick={() => toggleSupport(tag)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                  style={{
                    background: active ? "var(--accent-light)" : "var(--bg)",
                    borderColor: active ? "var(--accent)" : "var(--border)",
                    color: active ? "var(--accent)" : "var(--text-secondary)",
                  }}>
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
          <input type="text"
            className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none focus:border-violet-400 transition-all"
            style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            placeholder="e.g. visa restrictions, family obligations, health condition, debt"
            value={constraints} onChange={(e) => setConstraints(e.target.value)} />
        </div>
      </div>

      {/* Submit */}
      <button onClick={handleSubmit} disabled={!canSubmit}
        className="w-full py-4 rounded-2xl text-white font-semibold text-base transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-2"
        style={{
          background: canSubmit
            ? "linear-gradient(135deg, var(--accent), var(--accent-mid))"
            : "var(--border-strong)",
          boxShadow: canSubmit ? "0 4px 20px rgba(91,69,224,0.35)" : "none",
        }}>
        Run Simulation ⚡
      </button>

      <p className="text-center text-xs mt-3" style={{ color: "var(--text-muted)" }}>
        Takes ~30–45 seconds · Checks live world conditions · Not financial or legal advice
      </p>
    </motion.div>
  );
}
