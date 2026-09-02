import { Zap, Globe, Users } from "lucide-react";
import { MOVEMENT_VISUAL, SAMPLE_AVATARS } from "./homeAssets";

const head = "Space Grotesk, sans-serif";
const body = "Inter, sans-serif";

function Chip({ children, style }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 999, background: "rgba(11,15,26,0.62)", border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(14px)", color: "#FFFFFF", fontFamily: body, fontSize: 12, fontWeight: 600, ...style }}>
      {children}
    </div>
  );
}

/**
 * Hero visual — the movement itself: young believers lifting glowing phones into the night.
 * Replaces the app-window mockup. Join calls onJoin (Switch It On flow).
 */
export default function MovementVisual({ memberCount, onJoin, compact = false }) {
  const count = memberCount > 0 ? memberCount : 1240;
  return (
    <div className="home-mockup" style={{
      position: "relative", borderRadius: compact ? 22 : 30, overflow: "hidden", aspectRatio: compact ? "4 / 5" : "21 / 10",
      border: "1px solid rgba(255,208,0,0.22)",
      boxShadow: "0 40px 120px rgba(0,0,0,0.7), 0 0 90px rgba(255,208,0,0.12), inset 0 1px 0 rgba(255,255,255,0.12)",
    }}>
      <img src={MOVEMENT_VISUAL} alt="Young believers lifting glowing phones into the night sky" loading="eager" decoding="async"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(11,15,26,0.15) 0%, transparent 35%, rgba(11,15,26,0.55) 75%, rgba(11,15,26,0.92) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 100%, rgba(255,208,0,0.16), transparent 55%)", mixBlendMode: "screen" }} />

      {/* Top chips */}
      <div style={{ position: "absolute", top: compact ? 14 : 22, left: compact ? 14 : 22, right: compact ? 14 : 22, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <Chip><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#FFD000", boxShadow: "0 0 10px #FFD000" }} /> LIVE · Faith. Always On.</Chip>
        {!compact && <Chip><Globe size={13} color="#00CFFF" /> 12 nations · East-Central Africa</Chip>}
      </div>

      {/* Bottom caption + action */}
      <div style={{ position: "absolute", left: compact ? 16 : 28, right: compact ? 16 : 28, bottom: compact ? 16 : 26, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ maxWidth: 440 }}>
          <div style={{ fontFamily: head, fontWeight: 800, fontSize: compact ? 20 : 28, color: "#FFFFFF", letterSpacing: "-0.02em", lineHeight: 1.05, textShadow: "0 2px 16px rgba(0,0,0,0.5)" }}>
            A generation lifting its light.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
            <div style={{ display: "flex" }}>
              {SAMPLE_AVATARS.slice(0, 4).map((src, i) => (
                <img key={src} src={src} alt="" loading="lazy" width="26" height="26" style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(11,15,26,0.9)", marginLeft: i === 0 ? 0 : -8 }} />
              ))}
            </div>
            <span style={{ fontFamily: body, fontSize: 12, color: "rgba(255,255,255,0.85)", display: "inline-flex", alignItems: "center", gap: 5 }}><Users size={12} color="#FFD000" /> {count.toLocaleString()} believers already glowing</span>
          </div>
        </div>
        <button onClick={onJoin} style={{
          display: "inline-flex", alignItems: "center", gap: 8, padding: compact ? "11px 18px" : "13px 24px", borderRadius: 999, border: "none", cursor: "pointer",
          background: "linear-gradient(135deg, #FFD000, #FFA500)", color: "#0B0F1A", fontFamily: head, fontWeight: 800, fontSize: 14,
          boxShadow: "0 0 30px rgba(255,208,0,0.4), 0 8px 24px rgba(0,0,0,0.35)", transition: "transform 0.25s, box-shadow 0.25s", whiteSpace: "nowrap",
        }}
          onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 46px rgba(255,208,0,0.6), 0 10px 28px rgba(0,0,0,0.35)"; }}
          onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(255,208,0,0.4), 0 8px 24px rgba(0,0,0,0.35)"; }}
        >
          <Zap size={14} /> Switch It On
        </button>
      </div>
    </div>
  );
}