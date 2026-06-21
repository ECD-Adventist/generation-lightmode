import React, { useEffect } from "react";
import { Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Thin top progress bar + MM:SS countdown shown to guests during the
 * 3-minute preview window. The bar drains as time runs out, and when the
 * countdown reaches 0:00 the guest is redirected to the sign-in page.
 *
 * Props:
 *   remainingMs — milliseconds left in the preview
 *   totalMs     — full preview duration (for the progress percentage)
 *   expired     — true once the window is up
 */
export default function GuestPreviewTimer({ remainingMs = 0, totalMs = 1, expired = false }) {
  // When the preview window ends, send the guest to sign in.
  useEffect(() => {
    if (expired) {
      base44.auth.redirectToLogin(window.location.pathname);
    }
  }, [expired]);

  const signIn = () => base44.auth.redirectToLogin(window.location.pathname);

  const pct = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeLabel = `${minutes}:${String(seconds).padStart(2, "0")}`;

  // Bar shifts from cyan → gold → red as time drains.
  const barColor = pct > 50 ? "#1FB8FF" : pct > 20 ? "#FFC107" : "#E53935";

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[80]"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Draining progress bar */}
      <div className="w-full h-1" style={{ background: "rgba(11,27,61,0.15)" }}>
        <div
          className="h-full transition-all duration-1000 ease-linear"
          style={{ width: `${pct}%`, background: barColor, boxShadow: `0 0 10px ${barColor}` }}
        />
      </div>

      {/* Countdown row */}
      <div
        className="px-3 sm:px-5 py-1.5 flex items-center justify-between gap-3"
        style={{ background: "rgba(11,27,61,0.96)", backdropFilter: "blur(8px)" }}
      >
        <div className="flex items-center gap-2 min-w-0 text-white">
          <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: barColor }} />
          <span className="text-[12px] sm:text-[13px] font-semibold truncate">
            Preview mode · <span style={{ color: barColor }}>{timeLabel}</span> left
          </span>
        </div>
        <button
          onClick={signIn}
          className="shrink-0 rounded-full px-4 py-1.5 text-[12px] sm:text-[13px] font-black transition active:scale-95 hover:opacity-90 whitespace-nowrap"
          style={{ background: "linear-gradient(135deg, #FFD000, #FF9800)", color: "#0B1B3D" }}
        >
          Sign In
        </button>
      </div>
    </div>
  );
}