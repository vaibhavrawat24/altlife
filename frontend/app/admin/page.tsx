"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

type AdminUser = {
  user_id: string;
  email: string | null;
  auth_provider: string | null;
  last_login_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  simulation_count?: number;
};

type UserSimulation = {
  share_id: string;
  decision: string;
  profile: string;
  created_at: string;
};


const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function formatDate(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [simulations, setSimulations] = useState<UserSimulation[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [simsLoading, setSimsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const selectedUser = useMemo(
    () => users.find((item) => item.user_id === selectedUserId) || null,
    [selectedUserId, users],
  );

  useEffect(() => {
    if (!loading && user?.is_admin) {
      const token = localStorage.getItem("altlife_token");
      if (!token) {
        setError("Please log in again.");
        return;
      }

      let cancelled = false;
      const loadUsers = async () => {
        setUsersLoading(true);
        setError(null);
        try {
          const response = await fetch(`${API_URL}/admin/users?limit=200`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) {
            const detail = await response.text();
            throw new Error(detail || "Failed to fetch users");
          }

          const data = await response.json();
          const nextUsers: AdminUser[] = data.items || [];
          if (cancelled) return;
          setUsers(nextUsers);
          setSelectedUserId((current) => current ?? nextUsers[0]?.user_id ?? null);
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "Failed to fetch users");
          }
        } finally {
          if (!cancelled) {
            setUsersLoading(false);
          }
        }
      };

      loadUsers();
      return () => {
        cancelled = true;
      };
    }

    if (!loading && user && !user.is_admin) {
      setError("Admin access required.");
    }
  }, [API_URL, loading, user]);

  useEffect(() => {
    if (!user?.is_admin || !selectedUserId) return;

    const token = localStorage.getItem("altlife_token");
    if (!token) return;

    let cancelled = false;
    const loadSimulations = async () => {
      setSimsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_URL}/admin/users/${selectedUserId}/simulations?limit=100`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!response.ok) {
          const detail = await response.text();
          throw new Error(detail || "Failed to fetch simulations");
        }

        const data = await response.json();
        if (!cancelled) {
          setSimulations(data.items || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch simulations");
        }
      } finally {
        if (!cancelled) {
          setSimsLoading(false);
        }
      }
    };

    loadSimulations();
    return () => {
      cancelled = true;
    };
  }, [API_URL, selectedUserId, user?.is_admin]);

  const filteredUsers = users.filter((item) => {
    const searchable = `${item.email || ""} ${item.user_id}`.toLowerCase();
    return searchable.includes(query.toLowerCase());
  });

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h1 style={{ marginTop: 0 }}>Admin Dashboard</h1>
          <p>Please log in to continue.</p>
          <Link href="/auth/login" style={{ color: "var(--accent)", textDecoration: "none" }}>
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  if (!user.is_admin) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h1 style={{ marginTop: 0 }}>Admin Dashboard</h1>
          <p style={{ color: "#ef4444" }}>{error || "Admin access required."}</p>
          <Link href="/simulate" style={{ color: "var(--accent)", textDecoration: "none" }}>
            ← Back to simulate
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "24px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "24px" }}>Admin Dashboard</h1>
            <div style={{ color: "var(--text-secondary)", marginTop: "6px", fontSize: "13px" }}>
              Browse users and inspect their simulation history.
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <Link href="/simulate" style={{ color: "var(--accent)", textDecoration: "none", fontSize: "13px" }}>
              ← Back to simulate
            </Link>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                borderRadius: "6px",
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        {error && <div style={{ color: "#ef4444", marginBottom: "14px" }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "320px minmax(0, 1fr)", gap: "16px", alignItems: "start" }}>
          <div style={{ border: "1px solid var(--border)", borderRadius: "12px", background: "var(--surface)", padding: "14px", minHeight: "70vh" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h2 style={{ margin: 0, fontSize: "16px" }}>Users</h2>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                {usersLoading ? "Loading…" : `${filteredUsers.length} shown`}
              </span>
            </div>

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search email or user id"
              style={{
                width: "100%",
                marginBottom: "12px",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: "13px",
              }}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "calc(70vh - 120px)", overflow: "auto" }}>
              {usersLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} style={{
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    padding: "12px",
                    background: "var(--bg)",
                    opacity: 0.75,
                  }}>
                    <div style={{ height: "14px", width: "68%", background: "var(--border)" }} />
                    <div style={{ height: "10px", width: "88%", background: "var(--border)", marginTop: "8px" }} />
                    <div style={{ height: "10px", width: "45%", background: "var(--border)", marginTop: "8px" }} />
                  </div>
                ))
              ) : filteredUsers.map((item) => {
                const active = item.user_id === selectedUserId;
                return (
                  <button
                    key={item.user_id}
                    onClick={() => setSelectedUserId(item.user_id)}
                    style={{
                      textAlign: "left",
                      border: "1px solid",
                      borderColor: active ? "var(--accent)" : "var(--border)",
                      background: active ? "rgba(59, 130, 246, 0.08)" : "transparent",
                      borderRadius: "10px",
                      padding: "12px",
                      cursor: "pointer",
                      color: "var(--text)",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "4px" }}>{item.email || "(no email)"}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontFamily: "var(--font-space-mono), 'Courier New', monospace", wordBreak: "break-all" }}>
                      {item.user_id}
                    </div>
                    {typeof item.simulation_count === "number" && (
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "6px" }}>
                        {item.simulation_count} simulation{item.simulation_count === 1 ? "" : "s"}
                      </div>
                    )}
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "6px" }}>
                      Last login: {formatDate(item.last_login_at)}
                    </div>
                  </button>
                );
              })}

              {!usersLoading && filteredUsers.length === 0 && (
                <div style={{ color: "var(--text-secondary)", fontSize: "13px", padding: "8px 2px" }}>
                  No matching users.
                </div>
              )}
            </div>
          </div>

          <div style={{ border: "1px solid var(--border)", borderRadius: "12px", background: "var(--surface)", padding: "14px", minHeight: "70vh" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px" }}>{selectedUser?.email || "Select a user"}</h2>
                {selectedUser && (
                  <div style={{ marginTop: "6px", color: "var(--text-secondary)", fontSize: "12px", fontFamily: "var(--font-space-mono), 'Courier New', monospace", wordBreak: "break-all" }}>
                    {selectedUser.user_id}
                  </div>
                )}
              </div>
              {selectedUser && (
                <div style={{ textAlign: "right", fontSize: "12px", color: "var(--text-secondary)" }}>
                  <div>Provider: {selectedUser.auth_provider || "—"}</div>
                  {typeof selectedUser.simulation_count === "number" && (
                    <div>Simulations: {selectedUser.simulation_count}</div>
                  )}
                  <div>Created: {formatDate(selectedUser.created_at)}</div>
                  <div>Updated: {formatDate(selectedUser.updated_at)}</div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                {simsLoading ? "Loading simulations…" : `${simulations.length} simulation${simulations.length === 1 ? "" : "s"}`}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {simsLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      background: "var(--bg)",
                      padding: "12px",
                      opacity: 0.75,
                    }}
                  >
                    <div style={{ height: "10px", width: "30%", background: "var(--border)", marginBottom: "8px" }} />
                    <div style={{ height: "14px", width: "70%", background: "var(--border)", marginBottom: "8px" }} />
                    <div style={{ height: "12px", width: "85%", background: "var(--border)", marginBottom: "10px" }} />
                  </div>
                ))
              ) : simulations.map((item) => (
                <div
                  key={`${item.share_id}-${item.created_at}`}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    background: "var(--bg)",
                    padding: "12px",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                    {formatDate(item.created_at)}
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

              {!simsLoading && selectedUser && simulations.length === 0 && (
                <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                  No simulations found for this user.
                </div>
              )}

              {!selectedUser && (
                <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                  Pick a user on the left to view their simulations.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
