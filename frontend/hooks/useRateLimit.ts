"use client";
import { useState, useEffect, useCallback } from "react";

// Stores the Unix timestamp (ms) when the cooldown expires
export const RATE_LIMIT_DEADLINE_KEY = "altlife_rate_limit_deadline";
const RATE_LIMIT_SECONDS = 15 * 60; // 15 minutes

export interface RateLimitState {
  isBlocked: boolean;
  remainingSeconds: number;
  formattedTime: string;
  canLoginToReset: boolean;
}

export function useRateLimit(userId?: string): RateLimitState & {
  recordSimulation: () => void;
  blockFor: (seconds: number) => void;
} {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const checkLimit = () => {
      try {
        const raw = localStorage.getItem(RATE_LIMIT_DEADLINE_KEY);
        if (!raw) {
          setIsBlocked(false);
          setRemainingSeconds(0);
          return;
        }

        const remaining = Math.ceil((parseInt(raw, 10) - Date.now()) / 1000);
        if (remaining > 0) {
          setIsBlocked(true);
          setRemainingSeconds(remaining);
        } else {
          setIsBlocked(false);
          setRemainingSeconds(0);
          localStorage.removeItem(RATE_LIMIT_DEADLINE_KEY);
        }
      } catch (e) {
        console.warn("Cannot access localStorage for rate limit check", e);
      }
    };

    checkLimit();
    const interval = setInterval(checkLimit, 1000);
    return () => clearInterval(interval);
  }, []);

  const blockFor = useCallback((seconds: number) => {
    try {
      const deadline = Date.now() + seconds * 1000;
      localStorage.setItem(RATE_LIMIT_DEADLINE_KEY, deadline.toString());
      setIsBlocked(true);
      setRemainingSeconds(seconds);
    } catch (e) {
      console.warn("Cannot write rate limit to localStorage", e);
    }
  }, []);

  // For anonymous users, record the simulation locally with the full cooldown.
  // For auth users, the cooldown is set by the server's 429 response via blockFor.
  const recordSimulation = useCallback(() => {
    if (!userId) {
      blockFor(RATE_LIMIT_SECONDS);
    }
  }, [userId, blockFor]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    isBlocked,
    remainingSeconds,
    formattedTime: formatTime(remainingSeconds),
    canLoginToReset: !userId && isBlocked,
    recordSimulation,
    blockFor,
  };
}
