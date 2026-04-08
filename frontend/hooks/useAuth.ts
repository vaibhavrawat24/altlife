"use client";
import { useState, useCallback, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export interface AuthUser {
  user_id: string;
  email: string;
  login_bonus_remaining: number;
  is_admin?: boolean;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("altlife_token");
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else {
          localStorage.removeItem("altlife_token");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [API_URL]);

  const signup = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ email, password }).toString(),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || "Signup failed");
        }

        const data = await response.json();
        if (data.session) {
          localStorage.setItem("altlife_token", data.session);
          // Fetch full user data
          const userResponse = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${data.session}` },
          });
          if (userResponse.ok) {
            setUser(await userResponse.json());
          }
        }
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Signup failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [API_URL]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ email, password }).toString(),
        });

        if (!response.ok) {
          throw new Error("Invalid credentials");
        }

        const data = await response.json();
        if (data.session) {
          localStorage.setItem("altlife_token", data.session);
          // Fetch full user data
          const userResponse = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${data.session}` },
          });
          if (userResponse.ok) {
            setUser(await userResponse.json());
          }
        }
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Login failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [API_URL]
  );

  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/auth/callback`,
        },
      });

      if (authError) throw authError;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google login failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signupWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/auth/callback`,
        },
      });

      if (authError) throw authError;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google signup failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("altlife_token");
    setUser(null);
  }, []);

  return {
    user,
    loading,
    error,
    login,
    signup,
    loginWithGoogle,
    signupWithGoogle,
    logout,
    isAuthenticated: !!user,
  };
}
