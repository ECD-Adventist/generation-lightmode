import React from "react";
import { Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Slim sticky bottom bar shown to unauthenticated guests on the Feed.
 * Always visible while scrolling. Nudges them to sign in.
 */
export default function GuestStickyBar() {
  const signIn = () => base44.auth.redirectToLogin(window.location.pathname);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[70] px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3 safe-pb"
      style={{
        background: "linear-gradient(90deg, #0B1B3D 0%, #102a63 100%)",
        borderTop: "1px solid rgba(255,208,0,0.25)",
        boxShadow: "0 -8px 28px rgba(11, 27, 61, 0.35)",
      }}
    >
      <p className="text-[13px] sm:text-sm font-semibold text-white flex items-center gap-1.5 min-w-0">
        <Sparkles className="w-4 h-4 shrink-0" style={{ color: "#FFD000" }} />
        <span className="truncate">Join the movement — post, pray &amp; connect with believers</span>
      </p>
      <button
        onClick={signIn}
        className="shrink-0 rounded-full px-4 sm:px-5 py-2 text-[13px] sm:text-sm font-black transition active:scale-95 hover:opacity-90 whitespace-nowrap"
        style={{ background: "linear-gradient(135deg, #FFD000, #FF9800)", color: "#0B1B3D", boxShadow: "0 4px 14px rgba(255, 152, 0, 0.4)" }}
      >
        Sign In Free →
      </button>
    </div>
  );
}