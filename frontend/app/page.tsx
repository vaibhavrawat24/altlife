import Link from "next/link";

const EXAMPLES = [
  "What if I quit my job and start a startup?",
  "What if I move to another city for a better role?",
  "What if I switch from engineering to product?",
  "What if I take a year off to travel?",
];

const ACTORS = [
  { name: "Employer", icon: "🏢", color: "#6366f1" },
  { name: "Market", icon: "📈", color: "#0ea5e9" },
  { name: "Finances", icon: "💳", color: "#10b981" },
  { name: "Investors", icon: "🤝", color: "#f59e0b" },
  { name: "Support System", icon: "❤️", color: "#ec4899" },
];

export default function Home() {
  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <span className="font-semibold text-base" style={{ color: "var(--text)" }}>Altlife</span>
        <Link href="/simulate" className="text-sm font-medium px-4 py-1.5 rounded-lg transition-all"
          style={{ background: "var(--accent)", color: "white" }}>
          Try it free
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-8 border"
          style={{ background: "var(--accent-light)", color: "var(--accent)", borderColor: "#c7bfff" }}>
          Multi-actor decision simulation
        </div>
        <h1 className="text-5xl font-bold mb-5 leading-tight tracking-tight" style={{ color: "var(--text)" }}>
          See your decision play out<br />
          <span style={{ color: "var(--accent)" }}>before you make it</span>
        </h1>
        <p className="text-lg mb-10 max-w-xl mx-auto leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Real-world actors — your employer, the market, your finances — simulate
          how your decision actually unfolds over 12 months. Specific events, not generic advice.
        </p>
        <Link href="/simulate"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold text-base shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-mid))" }}>
          Start simulating →
        </Link>
      </section>

      {/* Actor showcase */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <p className="text-xs uppercase tracking-widest text-center mb-6" style={{ color: "var(--text-muted)" }}>
          Actors in your simulation
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {ACTORS.map((a) => (
            <div key={a.name} className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium"
              style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}>
              <span>{a.icon}</span>
              {a.name}
            </div>
          ))}
        </div>
      </section>

      {/* Example questions */}
      <section className="max-w-2xl mx-auto px-6 pb-24">
        <p className="text-xs uppercase tracking-widest text-center mb-5" style={{ color: "var(--text-muted)" }}>
          People are simulating
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EXAMPLES.map((ex) => (
            <Link key={ex} href={`/simulate`}
              className="p-4 rounded-xl border text-sm transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
              style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              "{ex}"
            </Link>
          ))}
        </div>
      </section>

      {/* Footer note */}
      <p className="text-center text-xs pb-10" style={{ color: "var(--text-muted)" }}>
        Not a prediction. A structured simulation. Results are illustrative, not financial advice.
      </p>
    </main>
  );
}
