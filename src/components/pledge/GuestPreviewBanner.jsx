import React from "react";
import { Zap, Eye } from "lucide-react";
import { useSwitchItOn } from "./SwitchItOnProvider";

/**
 * Slim, persistent banner shown at the top of public pages for guests.
 * Guests can browse freely; this just invites them to sign in to interact.
 * No countdown — browsing the public feed is unlimited.
 */
export default function GuestPreviewBanner() {
  const { trigger } = useSwitchItOn();

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
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(255,208,0,0.12)", border: "1px solid rgba(255,208,0,0.35)" }}>
            <Eye className="w-3.5 h-3.5" style={{ color: "#FFD000" }} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: "#FFD000" }}>Viewing as Guest</div>
            <div className="text-[11px] truncate" style={{ color: "#C8D0E0" }}>Join Generation LightMode to interact — sign in or create your account</div>
          </div>
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