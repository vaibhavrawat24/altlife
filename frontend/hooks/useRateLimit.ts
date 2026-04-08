"use client";
import { useState, useEffect, useCallback } from "react";

const RATE_LIMIT_KEY = "altlife_last_simulation";
const RATE_LIMIT_SECONDS = 15 * 60; // 15 minutes

export interface RateLimitState {
  isBlocked: boolean;
  remainingSeconds: number;
  formattedTime: string;
  canLoginToReset: boolean;
}

export function useRateLimit(userId?: string): RateLimitState & { recordSimulation: () => void } {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [canLoginToReset, setCanLoginToReset] = useState(false);

  // Check if user is rate limited on mount and setup interval
  useEffect(() => {
    const checkLimit = () => {
      try {
        // For authenticated users, rate limit is managed server-side
        if (userId) {
          setIsBlocked(false);
          setRemainingSeconds(0);
          setCanLoginToReset(false);
          return;
        }

        // For anonymous users, check localStorage
        const lastTime = localStorage.getItem(RATE_LIMIT_KEY);
        if (!lastTime) {
          setIsBlocked(false);
          setRemainingSeconds(0);
          setCanLoginToReset(true); // Can login to bypass
          return;
        }

        const elapsed = Math.floor((Date.now() - parseInt(lastTime)) / 1000);
        const remaining = RATE_LIMIT_SECONDS - elapsed;

        if (remaining > 0) {
          setIsBlocked(true);
          setRemainingSeconds(remaining);
          setCanLoginToReset(true); // Can login to get another free sim
        } else {
          setIsBlocked(false);
          setRemainingSeconds(0);
          setCanLoginToReset(false);
          localStorage.removeItem(RATE_LIMIT_KEY);
        }
      } catch (e) {
        console.warn("Cannot access localStorage for rate limit check", e);
      }
    };

    checkLimit();
    const interval = setInterval(checkLimit, 1000); // Update every second
    return () => clearInterval(interval);
  }, [userId]);

  const recordSimulation = useCallback(() => {
    try {
      // Only record for anonymous users
      if (!userId) {
        localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());
        setIsBlocked(true);
        setRemainingSeconds(RATE_LIMIT_SECONDS);
        setCanLoginToReset(true);
      }
    } catch (e) {
      console.warn("Cannot record simulation in localStorage", e);
    }
  }, [userId]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    isBlocked,
    remainingSeconds,
    formattedTime: formatTime(remainingSeconds),
    canLoginToReset,
    recordSimulation,
  };
}
