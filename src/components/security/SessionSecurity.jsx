import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart"];

export default function SessionSecurity() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("session") !== "expired") return;

    toast.error("Session expired, please log in again");
    params.delete("session");
    const search = params.toString();
    window.history.replaceState({}, "", `${location.pathname}${search ? `?${search}` : ""}${location.hash}`);
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId;
    const expireSession = () => base44.auth.logout(`${window.location.origin}/Home?session=expired`);
    const resetTimeout = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(expireSession, SESSION_TIMEOUT_MS);
    };

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimeout, { passive: true }));
    document.addEventListener("visibilitychange", resetTimeout);
    resetTimeout();

    return () => {
      window.clearTimeout(timeoutId);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimeout));
      document.removeEventListener("visibilitychange", resetTimeout);
    };
  }, [isAuthenticated]);

  return null;
}