import { LayoutGrid, Zap, Heart, Target, Trophy, Users, Search } from "lucide-react";
import { SAMPLE_AVATARS } from "./homeAssets";

const NAV = [["Overview", LayoutGrid], ["Feed", Zap], ["Prayer Wall", Heart], ["Challenges", Target], ["Leaderboard", Trophy], ["Members", Users]];

/**
 * Floating product mockup for the hero — a GlowGroup "home" preview.
 * Purely presentational; Join calls onJoin (Switch It On flow).
 */
export default function GlowGroupMockup({ memberCount, onJoin, compact = false }) {
  const count = memberCount > 0 ? memberCount : 1240;
  const label = "Space Grotesk, sans-serif";

  return (
    <div className="home-mockup" role="img" aria-label="Preview of a GlowGroup community home inside Generation LightMode" style={{
      display: "grid", gridTemplateColumns: compact ? "1fr" : "210px 1fr",
      borderRadius: compact ? 22 : 28, overflow: "hidden",
      background: "rgba(13,18,32,0.92)", border: "1px solid rgba(255,255,255,0.09)",
      boxShadow: "0 40px 120px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,207,255,0.06), 0 0 80px rgba(0,207,255,0.08)",
    }}>
      <style>{`
        @keyframes glm-aurora { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .home-aurora { background-size: 220% 220%; animation: glm-aurora 14s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .home-aurora { animation: none; } }
      `}</style>

      {!compact && (
        <aside style={{ padding: "18px 14px", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px 14px" }}>
            <div style={{ width: 64, height: 8, borderRadius: 999, background: "rgba(255,255,255,0.12)" }} />
            <Search size={13} color="#8A9BB0" />
          </div>
          {NAV.map(([name, Icon], i) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, background: i === 0 ? "rgba(255,255,255,0.06)" : "transparent", color: i === 0 ? "#FFFFFF" : "#B8C0D0", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500 }}>
              <Icon size={14} color={i === 0 ? "#00CFFF" : "#8A9BB0"} /> {name}
            </div>
          ))}
        </aside>
      )}

      <div className="home-aurora" style={{
        position: "relative", minHeight: compact ? 300 : 400,
        background: "linear-gradient(120deg, #0B0F1A 0%, #0E3A5C 22%, #00CFFF 42%, #3A2C8A 62%, #8A5CFF 78%, #0B0F1A 100%)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: compact ? "36px 20px" : "48px 32px",
      }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 100%, rgba(11,15,26,0.7), transparent 60%)" }} />
        <div style={{ position: "relative", textAlign: "center", maxWidth: 460, width: "100%" }}>
          <div style={{ width: 52, height: 52, margin: "0 auto 14px", borderRadius: "50%", background: "#FFFFFF", color: "#0B0F1A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: label, fontWeight: 800, fontSize: 20, boxShadow: "0 8px 30px rgba(0,0,0,0.35)" }}>G</div>
          <div style={{ fontFamily: label, fontWeight: 800, fontSize: compact ? 18 : 22, color: "#FFFFFF", letterSpacing: "-0.01em", textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>Nairobi Glow Collective</div>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>Led by Amani Okoth · Nairobi, Kenya</div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 16 }}>
            <div style={{ display: "flex" }}>
              {SAMPLE_AVATARS.slice(0, 4).map((src, i) => (
                <img key={src} src={src} alt="" loading="lazy" width="28" height="28" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(13,18,32,0.9)", marginLeft: i === 0 ? 0 : -9 }} />
              ))}
            </div>
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#FFFFFF", fontWeight: 500 }}>{count.toLocaleString()} members</span>
          </div>

          <button onClick={onJoin} style={{
            marginTop: 22, width: "100%", maxWidth: 420, padding: "13px 24px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.35)",
            background: "rgba(255,255,255,0.88)", color: "#0B0F1A", fontFamily: label, fontWeight: 700, fontSize: 14, cursor: "pointer",
            backdropFilter: "blur(10px)", boxShadow: "0 10px 30px rgba(0,0,0,0.3)", transition: "transform 0.25s, background 0.25s",
          }}
            onMouseOver={e => { e.currentTarget.style.background = "#FFFFFF"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.88)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            Join now
          </button>

          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, lineHeight: 1.6, color: "rgba(255,255,255,0.78)", marginTop: 18, marginBottom: 0 }}>
            Daily Glow Drops, weekly prayer huddles and challenges that turn hidden faith into visible light — one group, one city, one movement.
          </p>
        </div>
      </div>
    </div>
  );
}