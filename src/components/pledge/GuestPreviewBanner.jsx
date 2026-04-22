import React from "react";
import { Zap, Clock } from "lucide-react";
import { useSwitchItOn } from "./SwitchItOnProvider";

/**
 * Slim banner shown at the top of guest-previewed pages — shows countdown
 * and a "Sign In to Continue" CTA. Does not block scrolling; when the timer
 * hits zero, the parent page should render <GuestPreviewWall /> instead.
 */
export default function GuestPreviewBanner({ remainingMs, totalMs }) {
  const { trigger } = useSwitchItOn();
  const totalSec = Math.ceil(remainingMs / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const pct = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));

  return (
    <div
      className="sticky top-0 z-[60] w-full"
      style={{
        background: "linear-gradient(90deg, #0B0F1A 0%, #121826 100%)",
        borderBottom: "1px solid rgba(255,208,0,0.25)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(255,208,0,0.12)", border: "1px solid rgba(255,208,0,0.35)" }}>
            <Clock className="w-3.5 h-3.5" style={{ color: "#FFD000" }} />
          </div>
          <div className="hidden sm:block">
            <div className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "#FFD000" }}>Preview Mode</div>
            <div className="text-[11px]" style={{ color: "#C8D0E0" }}>Sign in to stay in the movement</div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full transition-all duration-1000" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #FFD000, #00CFFF)", boxShadow: "0 0 8px rgba(0,207,255,0.5)" }} />
          </div>
        </div>

        <div className="font-['Space_Grotesk'] font-black text-[13px] tabular-nums shrink-0" style={{ color: "#FFFFFF" }}>
          {m}:{String(s).padStart(2, "0")}
        </div>

        <button
          onClick={() => trigger("Feed")}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-['Space_Grotesk'] font-black active:scale-95 transition"
          style={{ background: "linear-gradient(135deg, #FFD000, #FFA500)", color: "#0B0F1A", boxShadow: "0 4px 12px rgba(255,208,0,0.35)" }}
        >
          <Zap className="w-3 h-3" /> Sign In
        </button>
      </div>
    </div>
  );
}