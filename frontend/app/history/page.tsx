"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

type HistoryItem = {
  share_id: string;
  decision: string;
  profile: string;
  created_at: string;
};

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const run = async () => {
      setHistoryLoading(true);
      try {
        const token = localStorage.getItem("altlife_token");
        if (!token) {
          setError("Please log in to view history.");
          setHistoryLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/history?limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch history");
        }

        const data = await res.json();
        setItems(data.items || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch history");
      } finally {
        setHistoryLoading(false);
      }
    };

    if (!loading) run();
  }, [API_URL, loading]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "24px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h1 style={{ margin: 0, fontSize: "20px" }}>Simulation History</h1>
          <Link href="/simulate" style={{ color: "var(--accent)", textDecoration: "none" }}>← Back to simulate</Link>
        </div>

        {error && <div style={{ color: "#ef4444", marginBottom: "12px" }}>{error}</div>}

        {historyLoading ? (
          <div style={{
            border: "1px solid var(--border)",
            borderRadius: "10px",
            background: "var(--surface)",
            padding: "20px",
            color: "var(--text-secondary)",
            fontSize: "13px",
          }}>
            Loading your simulations…
          </div>
        ) : !error && items.length === 0 ? (
          <div style={{ color: "var(--text-secondary)" }}>No simulations found yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {items.map((item) => (
              <div key={`${item.share_id}-${item.created_at}`} style={{
                border: "1px solid var(--border)",
                borderRadius: "8px",
                background: "var(--surface)",
                padding: "12px",
              }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
                  {new Date(item.created_at).toLocaleString()}
                </div>
                <div style={{ fontWeight: 600, marginBottom: "6px" }}>{item.decision || "(No decision text)"}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "8px" }}>
                  {item.profile || "(No profile summary)"}
                </div>
                <Link href={`/simulate?id=${item.share_id}`} style={{ color: "var(--accent)", textDecoration: "none", fontSize: "13px" }}>
                  Open simulation →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
