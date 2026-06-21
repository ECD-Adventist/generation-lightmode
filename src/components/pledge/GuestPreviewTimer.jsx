import React, { useEffect } from "react";
import { Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Top "PREVIEW MODE" banner shown to guests during the 3-minute preview window.
 * Layout: circle icon + "PREVIEW MODE" + subtitle on the left, a live MM:SS
 * countdown in the middle/right, and a gold "Sign In" button on the far right.
 * A thin colored bar below drains from full to empty as time runs out, and when
 * the countdown reaches 0:00 the guest is redirected to the sign-in page.
 *
 * Props:
 *   remainingMs — milliseconds left in the preview
 *   totalMs     — full preview duration (for the progress percentage)
 *   expired     — true once the window is up
 *   inline      — when true, renders as a normal in-flow banner (not a fixed overlay)
 */
export default function GuestPreviewTimer({ remainingMs = 0, totalMs = 1, expired = false, inline = false }) {
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
      className={inline ? "relative w-full" : "fixed top-0 left-0 right-0 z-[80]"}
      style={inline
        ? { background: "#0B1B3D" }
        : { paddingTop: "env(safe-area-inset-top)", background: "#0B1B3D", boxShadow: "0 4px 18px rgba(11,27,61,0.4)" }}
    >
      <div className="px-3 sm:px-5 py-2 flex items-center justify-between gap-3">
        {/* Left: icon + PREVIEW MODE + subtitle */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,208,0,0.15)", border: "1px solid rgba(255,208,0,0.4)" }}
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: "#FFD000" }} />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-[12px] sm:text-[13px] font-black text-white tracking-wide">PREVIEW MODE</p>
            <p className="text-[10px] sm:text-[11px] truncate" style={{ color: "#9FB3D9" }}>Sign in to stay in the movement</p>
          </div>
        </div>

        {/* Center/right: countdown */}
        <div
          className="shrink-0 font-black tabular-nums text-[15px] sm:text-[17px] px-2.5 py-0.5 rounded-lg"
          style={{ color: barColor, background: "rgba(255,255,255,0.06)" }}
        >
          {timeLabel}
        </div>

        {/* Far right: Sign In */}
        <button
          onClick={signIn}
          className="shrink-0 rounded-full px-4 sm:px-5 py-1.5 text-[12px] sm:text-[13px] font-black transition active:scale-95 hover:opacity-90 whitespace-nowrap"
          style={{ background: "linear-gradient(135deg, #FFD000, #FF9800)", color: "#0B1B3D", boxShadow: "0 3px 12px rgba(255,152,0,0.4)" }}
        >
          Sign In
        </button>
      </div>

      {/* Draining progress bar */}
      <div className="w-full h-1" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-full transition-all duration-1000 ease-linear"
          style={{ width: `${pct}%`, background: barColor, boxShadow: `0 0 10px ${barColor}` }}
        />
      </div>
    </div>
  );
}