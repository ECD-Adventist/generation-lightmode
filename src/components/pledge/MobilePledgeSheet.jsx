import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Zap, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import MobileBottomSheet from "@/components/mobile/MobileBottomSheet";

const pledgeItems = [
  ["LIVE VISIBLY", "Keep my faith always on — unashamed and unhidden."],
  ["SHINE BOLDLY", "Glow for Christ in every post, story, and real-life interaction."],
  ["SPEAK TRUTH", "Share God's love with courage and compassion."],
  ["WALK WITH PURPOSE", "Let my online and offline life reflect Jesus' light."],
  ["IGNITE OTHERS", "Encourage fellow believers and guide seekers to the Light."],
];

/**
 * Mobile-only pledge sheet — LightMode branded (light mode).
 * Light white surface with royal-blue / cyan / gold accents.
 */
export default function MobilePledgeSheet({ isOpen, onClose, onSigned, readOnly = false, signedAt = null }) {
  const [signing, setSigning] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSign = async () => {
    if (!agreed) {
      toast.error("Please check the box to confirm your commitment.");
      return;
    }
    setSigning(true);
    try {
      await base44.auth.updateMe({
        pledge_signed: true,
        pledge_signed_at: new Date().toISOString(),
      });
      toast.success("Pledge signed! Welcome to Generation LightMode ⚡");
      if (onSigned) onSigned();
    } catch {
      toast.error("Couldn't save pledge. Please try again.");
    } finally {
      setSigning(false);
    }
  };

  const header = (
    <div className="relative overflow-hidden px-5 pt-4 pb-5" style={{ background: "linear-gradient(135deg, #EEF3FF 0%, #FFFFFF 100%)" }}>
      <div className="absolute -top-6 -right-10 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: "#FFD000", opacity: 0.25 }} />
      <div className="absolute -bottom-12 -left-10 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: "#1FB8FF", opacity: 0.2 }} />

      <div className="relative text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3" style={{ background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)", boxShadow: "0 8px 24px rgba(11, 63, 217, 0.3)" }}>
          <span className="text-2xl">✋</span>
        </div>
        <h2 className="text-[22px] font-black font-['Space_Grotesk'] leading-tight" style={{ color: "#0B1B3D" }}>
          {readOnly ? "Your " : "The LightMode "}
          <span style={{ background: "linear-gradient(90deg, #0B3FD9, #1FB8FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            {readOnly ? "Signed Pledge" : "Pledge"}
          </span>
        </h2>
        <p className="text-xs mt-1.5" style={{ color: "#6B7FA0" }}>
          {readOnly
            ? (signedAt ? `Signed on ${new Date(signedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : "Your commitment to the movement.")
            : "Before entering the movement, take a moment to commit."}
        </p>
      </div>
    </div>
  );

  return (
    <MobileBottomSheet isOpen={isOpen} onClose={onClose} dismissible header={header} maxHeight="92dvh">
      <div className="px-5 py-4">
        <div className="rounded-2xl p-4 mb-4" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
          <p className="text-[13px] italic mb-3" style={{ color: "#3A4A6B" }}>
            "As a member of Generation LightMode, I pledge to:
          </p>
          <div className="flex flex-col gap-2.5">
            {pledgeItems.map(([title, text], i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center font-black text-[11px] font-['Space_Grotesk']" style={{ background: "rgba(31, 184, 255, 0.12)", color: "#0B3FD9" }}>
                  {i + 1}
                </span>
                <p className="text-[13px] leading-relaxed m-0" style={{ color: "#3A4A6B" }}>
                  <strong style={{ color: "#0B1B3D" }}>{title}</strong> → {text}
                </p>
              </div>
            ))}
          </div>
          <p className="text-[13px] font-black font-['Space_Grotesk'] text-center mt-4 px-2 leading-snug" style={{ color: "#CC7A00" }}>
            My light will not dim. My faith will not fade. I am Generation LightMode."
          </p>
        </div>

        {readOnly ? (
          <>
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl mb-3" style={{ background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.25)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "#16A34A" }}>
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-[12px] font-bold" style={{ color: "#166534" }}>
                You have signed this pledge. Your faith is always on. ⚡
              </span>
            </div>
            <button onClick={onClose} className="w-full h-12 rounded-full font-black text-sm active:scale-[0.98] transition" style={{ background: "#F6F8FC", color: "#4A5878", border: "1px solid #E6ECF5" }}>
              Close
            </button>
          </>
        ) : (
          <>
            <label className="flex items-start gap-3 p-3.5 rounded-2xl mb-4 cursor-pointer active:scale-[0.99] transition" style={{ background: agreed ? "rgba(31, 184, 255, 0.08)" : "#FFFFFF", border: agreed ? "1.5px solid #1FB8FF" : "1.5px solid #E6ECF5" }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="sr-only"
              />
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all mt-0.5" style={agreed ? { background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)", border: "none" } : { background: "#FFFFFF", border: "2px solid #C0CAE0" }}>
                {agreed && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </div>
              <span className="text-[13px] leading-relaxed select-none" style={{ color: "#3A4A6B" }}>
                I commit to this pledge and choose to join Generation LightMode with an always-on faith.
              </span>
            </label>

            <button
              onClick={handleSign}
              disabled={signing || !agreed}
              className="w-full h-14 rounded-full font-black text-[15px] flex items-center justify-center gap-2 font-['Space_Grotesk'] active:scale-[0.98] transition"
              style={{
                background: agreed ? "linear-gradient(90deg, #1FB8FF, #0B3FD9)" : "#E6ECF5",
                color: agreed ? "#FFFFFF" : "#8A97B5",
                boxShadow: agreed ? "0 8px 24px rgba(11, 63, 217, 0.35)" : "none",
                cursor: agreed && !signing ? "pointer" : "not-allowed",
              }}
            >
              {signing ? "Signing..." : <><Check className="w-4 h-4" /> I Sign This Pledge <Zap className="w-4 h-4" /></>}
            </button>
            <p className="text-[11px] text-center mt-3 flex items-center justify-center gap-1.5" style={{ color: "#8A97B5" }}>
              <Sparkles className="w-3 h-3" style={{ color: "#FFD000" }} /> Free to join. Your pledge unlocks the movement.
            </p>
          </>
        )}
      </div>
    </MobileBottomSheet>
  );
}