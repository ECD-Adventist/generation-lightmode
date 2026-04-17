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

export default function PledgeModal({ isOpen, onClose, onSigned, readOnly = false, signedAt = null }) {
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
        background: "rgba(11, 27, 61, 0.5)", backdropFilter: "blur(14px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#FFFFFF",
          border: "1px solid #E6ECF5",
          borderRadius: 24, maxWidth: 620, width: "100%",
          maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 24px 64px rgba(11, 63, 217, 0.15), 0 8px 24px rgba(0,0,0,0.08)",
          position: "relative", padding: "36px 32px",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "#F6F8FC", border: "1px solid #E6ECF5",
            color: "#6B7FA0", width: 36, height: 36, borderRadius: "50%",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <X size={16} />
        </button>

        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontSize: 42, marginBottom: 10 }}>✋</div>
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 26, color: "#0B1B3D", marginBottom: 8, letterSpacing: "-0.02em" }}>
            {readOnly ? "Your " : "The LightMode "}<span style={{ background: "linear-gradient(90deg, #0B3FD9, #1FB8FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{readOnly ? "Signed Pledge" : "Pledge"}</span>
          </h2>
          <p style={{ color: "#6B7FA0", fontSize: 13, fontFamily: "Inter, sans-serif" }}>
            {readOnly
              ? (signedAt ? `Signed on ${new Date(signedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : "Your commitment to the movement.")
              : "Before entering the movement, take a moment to commit."}
          </p>
        </div>

        <div style={{ background: "#F6F8FC", border: "1px solid #E6ECF5", borderRadius: 16, padding: 22, marginBottom: 20 }}>
          <p style={{ fontSize: 14, color: "#3A4A6B", marginBottom: 16, fontStyle: "italic", fontFamily: "Inter, sans-serif" }}>
            "As a member of Generation LightMode, I pledge to:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pledgeItems.map(([title, text], i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ color: "#0B3FD9", fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 12, minWidth: 18, paddingTop: 2 }}>{i + 1}.</span>
                <p style={{ color: "#3A4A6B", fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: 1.55, margin: 0 }}>
                  <strong style={{ color: "#0B1B3D" }}>{title}</strong> → {text}
                </p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: "#CC7A00", marginTop: 16, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", textAlign: "center" }}>
            My light will not dim. My faith will not fade. I am Generation LightMode."
          </p>
        </div>

        {readOnly ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.25)", borderRadius: 12, marginBottom: 14 }}>
              <Check size={18} color="#16A34A" style={{ flexShrink: 0 }} />
              <span style={{ color: "#16A34A", fontSize: 13, fontFamily: "Inter, sans-serif", fontWeight: 600 }}>
                You have signed this pledge. Your faith is always on. ⚡
              </span>
            </div>
            <button
              onClick={onClose}
              style={{
                width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: "#F6F8FC", color: "#4A5878",
                fontFamily: "Space Grotesk, sans-serif", fontWeight: 700,
                fontSize: 14, padding: "13px 28px", borderRadius: 999,
                border: "1px solid #E6ECF5", cursor: "pointer",
              }}
            >
              Close
            </button>
          </>
        ) : (
          <>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 18, cursor: "pointer", padding: 12, background: "rgba(31, 184, 255, 0.05)", border: "1px solid rgba(31, 184, 255, 0.2)", borderRadius: 12 }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                style={{ marginTop: 2, accentColor: "#0B3FD9", width: 16, height: 16, cursor: "pointer" }}
              />
              <span style={{ color: "#3A4A6B", fontSize: 13, fontFamily: "Inter, sans-serif", lineHeight: 1.5 }}>
                I commit to this pledge and choose to join Generation LightMode with an always-on faith.
              </span>
            </label>

            <button
              onClick={handleSign}
              disabled={signing || !agreed}
              style={{
                width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: agreed ? "linear-gradient(90deg, #1FB8FF, #0B3FD9)" : "#E6ECF5",
                color: agreed ? "#FFFFFF" : "#8A97B5",
                fontFamily: "Space Grotesk, sans-serif", fontWeight: 800,
                fontSize: 15, padding: "14px 28px", borderRadius: 999,
                border: "none", cursor: agreed && !signing ? "pointer" : "not-allowed",
                boxShadow: agreed ? "0 4px 20px rgba(11, 63, 217, 0.35)" : "none",
                transition: "all 0.3s",
              }}
            >
              {signing ? "Signing..." : <><Check size={16} /> I Sign This Pledge <Zap size={16} /></>}
            </button>
            <p style={{ color: "#8A97B5", fontSize: 11, marginTop: 12, fontFamily: "Inter, sans-serif", textAlign: "center" }}>
              Free to join. Your pledge unlocks access to the movement.
            </p>
          </>
        )}
      </div>
    </div>
  );
}