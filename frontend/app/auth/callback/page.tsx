"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase handles the callback automatically via session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session) {
          // Get user info from Supabase Auth
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user?.email) {
            // Store the token
            const token = session.access_token;
            localStorage.setItem("altlife_token", token);

            // Create/update user in backend with login bonus
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const response = await fetch(`${API_URL}/auth/oauth-callback`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                email: user.email,
                user_id: user.id,
              }),
            });

            if (!response.ok) {
              throw new Error("Failed to complete OAuth login");
            }

            // Redirect to simulate page
            router.push("/simulate");
          }
        } else {
          setError("No session found. Please try logging in again.");
          setTimeout(() => router.push("/auth/login"), 2000);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Authentication failed";
        setError(message);
        console.error("OAuth callback error:", err);
        setTimeout(() => router.push("/auth/login"), 3000);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="mb-4 inline-block">
            <div className="w-12 h-12 border-4 border-slate-600 border-t-cyan-400 rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-300">Processing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <p className="text-red-400 mb-2">Authentication Error</p>
          <p className="text-slate-400">{error}</p>
          <p className="text-slate-500 text-sm mt-4">Redirecting...</p>
        </div>
      </div>
    );
  }

  return null;
}
