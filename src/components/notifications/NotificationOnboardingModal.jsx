import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Zap, BellRing } from "lucide-react";

const STORAGE_KEY = "notif_prompt_shown";

/**
 * First-login notification permission onboarding.
 * Shows a branded full-screen overlay BEFORE the browser's native permission popup.
 * Shows once only — tracked via localStorage "notif_prompt_shown".
 */
export default function NotificationOnboardingModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function maybeShow() {
      // Already made a choice before — never show again.
      if (localStorage.getItem(STORAGE_KEY)) return;

      // Notifications unsupported — mark shown so we don't loop, and skip.
      if (typeof Notification === "undefined") {
        localStorage.setItem(STORAGE_KEY, "true");
        return;
      }

      // If the browser already has a decision (granted/denied), respect it.
      if (Notification.permission !== "default") {
        localStorage.setItem(STORAGE_KEY, "true");
        return;
      }

      // Only prompt authenticated users (new login / register).
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!cancelled && isAuth) setShow(true);
      } catch {
        /* not logged in — do nothing */
      }
    }

    maybeShow();
    return () => { cancelled = true; };
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setShow(false);
  };

  const handleAccept = async () => {
    try {
      if (typeof Notification !== "undefined" && Notification.requestPermission) {
        await Notification.requestPermission();
      }
    } catch {
      /* ignore — user can enable later in browser settings */
    } finally {
      dismiss();
    }
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-5 safe-pt safe-pb"
      style={{ background: "rgba(8, 12, 20, 0.92)", backdropFilter: "blur(16px)" }}
    >
      <div
        className="relative w-full max-w-sm rounded-[28px] p-8 text-center overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #121826 0%, #0B0F1A 100%)",
          border: "1px solid rgba(0,207,255,0.2)",
          boxShadow: "0 24px 70px rgba(0,0,0,0.6), 0 0 40px rgba(0,207,255,0.12)",
        }}
      >
        <div
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,207,255,0.18) 0%, transparent 70%)" }}
        />
        <div className="relative">
          <div
            className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #00CFFF 0%, #8A5CFF 100%)", boxShadow: "0 8px 28px rgba(0,207,255,0.4)" }}
          >
            <BellRing className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-2xl font-black mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#FFFFFF" }}>
            Stay Connected to the Light ⚡
          </h2>
          <p className="text-sm leading-relaxed mb-7" style={{ color: "#C8D0E0" }}>
            Get daily GlowDrops, prayer updates, and challenge reminders sent straight to you.
          </p>

          <button
            onClick={handleAccept}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-black text-sm transition active:scale-[0.98] mb-3"
            style={{ background: "linear-gradient(90deg, #00CFFF 0%, #8A5CFF 100%)", color: "#0B0F1A", boxShadow: "0 6px 22px rgba(0,207,255,0.4)" }}
          >
            <Zap className="w-4 h-4" /> Yes, Keep Me Updated
          </button>
          <button
            onClick={dismiss}
            className="w-full py-3 rounded-full font-bold text-sm transition active:scale-[0.98]"
            style={{ background: "transparent", color: "#8A9BB0", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}