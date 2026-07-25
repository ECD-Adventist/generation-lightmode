import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const CHECK_INTERVAL_MS = 15 * 1000;
const LAST_ACTIVITY_KEY = "glm_last_authenticated_activity";
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
    if (!isAuthenticated) {
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      return;
    }

    let expired = false;
    const markActivity = () => localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    const expireSession = () => {
      if (expired) return;
      expired = true;
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      base44.auth.logout(`${window.location.origin}/Home?session=expired`);
    };
    const checkSession = () => {
      const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
      if (lastActivity && Date.now() - lastActivity >= SESSION_TIMEOUT_MS) expireSession();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") checkSession();
    };

    if (!localStorage.getItem(LAST_ACTIVITY_KEY)) markActivity();
    checkSession();
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, markActivity, { passive: true }));
    document.addEventListener("visibilitychange", handleVisibility);
    const intervalId = window.setInterval(checkSession, CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, markActivity));
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isAuthenticated]);

  return null;
}