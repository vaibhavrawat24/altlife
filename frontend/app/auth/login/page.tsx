"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { motion } from "framer-motion";

const MONO = "var(--font-space-mono), 'Courier New', monospace";

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

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, loading, error, isAuthenticated } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  // Sync theme from localStorage on mount
  useEffect(() => {
    try {
      setIsDark(localStorage.getItem("altlife-theme") === "dark");
    } catch { /* no localStorage */ }
  }, []);

  const handleThemeToggle = () => {
    try {
      const newTheme = isDark ? "light" : "dark";
      localStorage.setItem("altlife-theme", newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
      setIsDark(!isDark);
    } catch { /* no localStorage */ }
  };

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/simulate");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: MONO, color: "var(--text-secondary)" }}>Redirecting...</p>
      </div>
    );
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    try {
      await login(email, password);
      router.push("/simulate");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handleGoogleLogin = async () => {
    setSubmitError(null);
    try {
      await loginWithGoogle();
      // Redirect happens after callback
      router.push("/simulate");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Google login failed");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        height: "52px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
      }}>
        <Link href="/" style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          textDecoration: "none",
        }}>
          <svg width="22" height="22" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="18" r="3.5" fill="var(--text)" />
            <line x1="2" y1="18" x2="14" y2="18" stroke="var(--text)" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="14" y1="18" x2="30" y2="7" stroke="var(--text)" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="30" cy="7" r="2.4" stroke="var(--text)" strokeWidth="1.8" fill="none" />
            <line x1="14" y1="18" x2="30" y2="29" stroke="var(--text)" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="30" cy="29" r="2.4" stroke="var(--text)" strokeWidth="1.8" fill="none" />
          </svg>
          <span style={{
            fontWeight: 700,
            fontSize: "13px",
            letterSpacing: "-0.01em",
            color: "var(--text)",
            fontFamily: MONO,
          }}>
            altlife
          </span>
        </Link>
        <button
          onClick={handleThemeToggle}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
          }}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <SunIcon color="var(--text)" /> : <MoonIcon color="var(--text)" />}
        </button>
      </nav>

      {/* Content */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            width: "100%",
            maxWidth: "400px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "32px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h1 style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: "8px",
            fontFamily: MONO,
          }}>
            Welcome back
          </h1>
          <p style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            marginBottom: "24px",
            fontFamily: MONO,
          }}>
            Log in to access your simulations and  get instant simulation generation access
          </p>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: MONO,
              fontSize: "13px",
              fontWeight: 600,
              color: "#000",
              transition: "all 0.15s",
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "#f9fafb")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {loading ? "Signing in..." : "Continue with Google"}
          </button>

          {/* Divider */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            margin: "20px 0",
          }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: MONO }}>or</span>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{
                display: "block",
                fontSize: "11px",
                fontFamily: MONO,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "6px",
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
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
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            <div>
              <label style={{
                display: "block",
                fontSize: "11px",
                fontFamily: MONO,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "6px",
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
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
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            {/* Error Message */}
            {(submitError || error) && (
              <div style={{
                padding: "10px 12px",
                borderRadius: "6px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid #fecaca",
                fontSize: "12px",
                color: "#ef4444",
                fontFamily: MONO,
              }}>
                {submitError || error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "4px",
                fontFamily: MONO,
                fontSize: "13px",
                fontWeight: 700,
                background: "var(--accent)",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "opacity 0.15s",
                opacity: loading ? 0.6 : 1,
                letterSpacing: "0.05em",
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = loading ? "0.6" : "1")}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Sign Up Link */}
          <p style={{
            textAlign: "center",
            fontSize: "12px",
            color: "var(--text-secondary)",
            marginTop: "20px",
            fontFamily: MONO,
          }}>
            Don't have an account?{" "}
            <Link
              href="/auth/signup"
              style={{
                color: "var(--accent)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
