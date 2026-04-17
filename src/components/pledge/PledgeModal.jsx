import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Zap, Check } from "lucide-react";
import { toast } from "sonner";

const pledgeItems = [
  ["LIVE VISIBLY", "Keep my faith always on — unashamed and unhidden."],
  ["SHINE BOLDLY", "Glow for Christ in every post, story, and real-life interaction."],
  ["SPEAK TRUTH", "Share God's love with courage and compassion."],
  ["WALK WITH PURPOSE", "Let my online and offline life reflect Jesus' light."],
  ["IGNITE OTHERS", "Encourage fellow believers and guide seekers to the Light."],
];

export default function PledgeModal({ isOpen, onClose, onSigned }) {
  const [signing, setSigning] = useState(false);
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

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
    } catch (err) {
      toast.error("Couldn't save pledge. Please try again.");
    } finally {
      setSigning(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(11,15,26,0.92)", backdropFilter: "blur(14px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "linear-gradient(180deg, #121826 0%, #0B0F1A 100%)",
          border: "1px solid rgba(255,208,0,0.25)",
          borderRadius: 24, maxWidth: 620, width: "100%",
          maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 0 60px rgba(255,208,0,0.18)",
          position: "relative", padding: "36px 32px",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
            color: "#C8D0E0", width: 36, height: 36, borderRadius: "50%",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <X size={16} />
        </button>

        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontSize: 42, marginBottom: 10, filter: "drop-shadow(0 0 14px rgba(255,208,0,0.5))" }}>✋</div>
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 26, color: "#FFFFFF", marginBottom: 8, letterSpacing: "-0.02em" }}>
            The LightMode <span style={{ background: "linear-gradient(90deg, #FFD000, #00CFFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Pledge</span>
          </h2>
          <p style={{ color: "#8A9BB0", fontSize: 13, fontFamily: "Inter, sans-serif" }}>
            Before entering the movement, take a moment to commit.
          </p>
        </div>

        <div style={{ background: "rgba(11,15,26,0.6)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 22, marginBottom: 20 }}>
          <p style={{ fontSize: 14, color: "#C8D0E0", marginBottom: 16, fontStyle: "italic", fontFamily: "Inter, sans-serif" }}>
            "As a member of Generation LightMode, I pledge to:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pledgeItems.map(([title, text], i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ color: "#00CFFF", fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 12, minWidth: 18, paddingTop: 2 }}>{i + 1}.</span>
                <p style={{ color: "#C8D0E0", fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: 1.55, margin: 0 }}>
                  <strong style={{ color: "#FFFFFF" }}>{title}</strong> → {text}
                </p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: "#FFD000", marginTop: 16, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", textAlign: "center" }}>
            My light will not dim. My faith will not fade. I am Generation LightMode."
          </p>
        </div>

        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 18, cursor: "pointer", padding: 12, background: "rgba(0,207,255,0.04)", border: "1px solid rgba(0,207,255,0.15)", borderRadius: 12 }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            style={{ marginTop: 2, accentColor: "#00CFFF", width: 16, height: 16, cursor: "pointer" }}
          />
          <span style={{ color: "#E0E8F0", fontSize: 13, fontFamily: "Inter, sans-serif", lineHeight: 1.5 }}>
            I commit to this pledge and choose to join Generation LightMode with an always-on faith.
          </span>
        </label>

        <button
          onClick={handleSign}
          disabled={signing || !agreed}
          style={{
            width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: agreed ? "linear-gradient(135deg, #FFD000, #FFA500)" : "rgba(255,255,255,0.06)",
            color: agreed ? "#0B0F1A" : "#6A7585",
            fontFamily: "Space Grotesk, sans-serif", fontWeight: 800,
            fontSize: 15, padding: "14px 28px", borderRadius: 999,
            border: "none", cursor: agreed && !signing ? "pointer" : "not-allowed",
            boxShadow: agreed ? "0 0 30px rgba(255,208,0,0.4)" : "none",
            transition: "all 0.3s",
          }}
        >
          {signing ? "Signing..." : <><Check size={16} /> I Sign This Pledge <Zap size={16} /></>}
        </button>
        <p style={{ color: "#4A5568", fontSize: 11, marginTop: 12, fontFamily: "Inter, sans-serif", textAlign: "center" }}>
          Free to join. Your pledge unlocks access to the movement.
        </p>
      </div>
    </div>
  );
}