import React from "react";
import { Zap, Lock } from "lucide-react";
import { useSwitchItOn } from "./SwitchItOnProvider";

/**
 * Full-screen blocking wall shown after the 3-minute guest preview expires.
 * Prompts the guest to sign in (→ pledge flow handled by SwitchItOnProvider).
 */
export default function GuestPreviewWall({ destination = "Feed" }) {
  const { trigger } = useSwitchItOn();

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-5 font-['Inter']"
      style={{
        background: "radial-gradient(ellipse at center, rgba(11,15,26,0.85) 0%, rgba(11,15,26,0.98) 100%)",
        backdropFilter: "blur(24px)",
      }}
    >
      <style>{`
        @keyframes gpw-pulse { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.08); opacity: 0.9 } }
        @keyframes gpw-float { 0%,100% { transform: translateY(0); opacity: 0.3 } 50% { transform: translateY(-20px); opacity: 0.55 } }
      `}</style>

      <div className="relative w-full max-w-md rounded-3xl p-8 text-center overflow-hidden" style={{ background: "linear-gradient(180deg, #121826 0%, #0B0F1A 100%)", border: "1px solid rgba(0,207,255,0.25)", boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(0,207,255,0.15)" }}>
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,208,0,0.18)", animation: "gpw-float 8s ease-in-out infinite" }} />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(0,207,255,0.18)", animation: "gpw-float 10s ease-in-out infinite 1s" }} />

        <div className="relative">
          <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(255,208,0,0.2), rgba(0,207,255,0.2))", border: "2px solid rgba(255,208,0,0.4)", boxShadow: "0 0 30px rgba(255,208,0,0.3)", animation: "gpw-pulse 2.5s ease-in-out infinite" }}>
            <Lock className="w-7 h-7" style={{ color: "#FFD000" }} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4" style={{ background: "rgba(255,208,0,0.1)", border: "1px solid rgba(255,208,0,0.3)" }}>
            <span className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: "#FFD000" }}>Preview Ended</span>
          </div>

          <h2 className="font-['Space_Grotesk'] font-black text-[26px] leading-tight mb-3 text-white">
            Join the{" "}
            <span style={{ background: "linear-gradient(135deg, #FFD000, #00CFFF, #8A5CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Movement
            </span>
          </h2>
          <p className="text-[14px] leading-relaxed mb-6" style={{ color: "#C8D0E0" }}>
            You just saw a glimpse of Generation LightMode. To keep going — post your own drops, join GlowGroups, and take on challenges — sign in and take the pledge.
          </p>

          <div className="space-y-2 mb-6 text-left">
            {[
              "Post your daily Glow Drops",
              "Join GlowGroups in your city",
              "Take on live challenges & earn pins",
              "Connect with 10M+ believers",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-[12.5px]" style={{ color: "#B0BAC8" }}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#00CFFF", boxShadow: "0 0 6px #00CFFF" }} />
                {f}
              </div>
            ))}
          </div>

          <button
            onClick={() => trigger(destination)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-full font-black text-[15px] font-['Space_Grotesk'] active:scale-[0.98] transition"
            style={{ background: "linear-gradient(135deg, #FFD000, #FFA500)", color: "#0B0F1A", boxShadow: "0 10px 36px rgba(255,208,0,0.5)" }}
          >
            <Zap className="w-4 h-4" /> Sign In & Take The Pledge
          </button>
          <p className="text-[11px] mt-3" style={{ color: "#4A5568" }}>Free to join. Your pledge unlocks everything.</p>
        </div>
      </div>
    </div>
  );
}