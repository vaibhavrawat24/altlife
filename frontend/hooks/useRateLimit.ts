"use client";
import { useState, useEffect, useCallback } from "react";

const RATE_LIMIT_KEY = "altlife_last_simulation";
const RATE_LIMIT_SECONDS = 15 * 60; // 15 minutes

export function useRateLimit() {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  // Check if user is rate limited on mount and setup interval
  useEffect(() => {
    const checkLimit = () => {
      try {
        const lastTime = localStorage.getItem(RATE_LIMIT_KEY);
        if (!lastTime) {
          setIsBlocked(false);
          setRemainingSeconds(0);
          return;
        }

        const elapsed = Math.floor((Date.now() - parseInt(lastTime)) / 1000);
        const remaining = RATE_LIMIT_SECONDS - elapsed;

        if (remaining > 0) {
          setIsBlocked(true);
          setRemainingSeconds(remaining);
        } else {
          setIsBlocked(false);
          setRemainingSeconds(0);
          localStorage.removeItem(RATE_LIMIT_KEY);
        }
      } catch (e) {
        // localStorage not available (e.g., incognito)
        console.warn("Cannot access localStorage for rate limit check", e);
      }
    };

    checkLimit();
    const interval = setInterval(checkLimit, 1000); // Update every second
    return () => clearInterval(interval);
  }, []);

  const recordSimulation = useCallback(() => {
    try {
      localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());
      setIsBlocked(true);
      setRemainingSeconds(RATE_LIMIT_SECONDS);
    } catch (e) {
      console.warn("Cannot record simulation in localStorage", e);
    }
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    isBlocked,
    remainingSeconds,
    formattedTime: formatTime(remainingSeconds),
    recordSimulation,
  };
}
