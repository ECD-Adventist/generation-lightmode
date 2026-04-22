import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";

const PREVIEW_KEY = "glm_guest_preview_start";
const PREVIEW_DURATION_MS = 3 * 60 * 1000; // 3 minutes

/**
 * Guest preview hook — lets unauthenticated visitors preview a page for 3 minutes.
 *
 * Returns { loading, isGuest, remainingMs, expired }.
 * - loading: while auth state is being determined
 * - isGuest: true when not authenticated (in preview mode)
 * - remainingMs: milliseconds left in the preview countdown
 * - expired: true once the 3 minutes are up (trigger signup wall)
 *
 * Preview start time persists in sessionStorage so reloads/navigation inside
 * the preview window don't reset the clock. Once authenticated, the timer
 * is cleared.
 */
export default function useGuestPreview() {
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [remainingMs, setRemainingMs] = useState(PREVIEW_DURATION_MS);
  const intervalRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    base44.auth.isAuthenticated().then((authed) => {
      if (cancelled) return;
      if (authed) {
        sessionStorage.removeItem(PREVIEW_KEY);
        setIsGuest(false);
        setLoading(false);
        return;
      }

      // Guest — start (or resume) the 3-min preview clock
      let start = Number(sessionStorage.getItem(PREVIEW_KEY));
      if (!start || isNaN(start)) {
        start = Date.now();
        sessionStorage.setItem(PREVIEW_KEY, String(start));
      }

      const tick = () => {
        const elapsed = Date.now() - start;
        const left = Math.max(0, PREVIEW_DURATION_MS - elapsed);
        setRemainingMs(left);
        if (left <= 0 && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };

      tick();
      intervalRef.current = setInterval(tick, 1000);
      setIsGuest(true);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    loading,
    isGuest,
    remainingMs,
    expired: isGuest && remainingMs <= 0,
    totalMs: PREVIEW_DURATION_MS,
  };
}