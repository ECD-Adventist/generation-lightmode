import React from "react";

const partners = [
  { name: "Communication", role: "Message Strategy & PR", color: "#00CFFF", emoji: "📡" },
  { name: "Media", role: "Creative Content & Branding", color: "#8A5CFF", emoji: "🎬" },
  { name: "IT", role: "Digital Infrastructure", color: "#FFD000", emoji: "💻" },
  { name: "Youth & Evangelism", role: "Mobilization & Reaping", color: "#1DA1FF", emoji: "🔥" },
];

export default function AboutPartners({ t }) {
  return (
    <section style={{ position: "relative", overflow: "hidden", padding: "clamp(80px, 10vw, 120px) clamp(20px, 6vw, 80px)", background: "#0B0F1A" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(255,208,0,0.04) 0%, transparent 50%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,208,0,0.08)", border: "1px solid rgba(255,208,0,0.25)", borderRadius: 999, padding: "6px 16px", marginBottom: 20 }}>
            <span style={{ color: "#FFD000", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", fontFamily: "Space Grotesk, sans-serif", textTransform: "uppercase" }}>Collaborative Effort</span>
          </div>
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.02em", color: "#FFFFFF", marginBottom: 14 }}>
            {t("partnersTitle").split(" ").slice(0, -1).join(" ")}{" "}
            <span style={{ background: "linear-gradient(90deg, #FFD000, #00CFFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {t("partnersTitle").split(" ").slice(-1)}
            </span>
          </h2>
          <p style={{ color: "#8A9BB0", fontSize: 16, fontFamily: "Inter, sans-serif", maxWidth: 520, margin: "0 auto" }}>{t("partnersText")}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 18 }}>
          {partners.map((partner) => (
            <div key={partner.name} style={{
              background: "rgba(18,24,38,0.7)", backdropFilter: "blur(20px)",
              border: `1px solid ${partner.color}22`, borderRadius: 20,
              padding: "30px 24px", textAlign: "center",
              position: "relative", overflow: "hidden",
              transition: "transform 0.3s, box-shadow 0.3s",
            }}
              onMouseOver={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = `0 20px 50px ${partner.color}18`; }}
              onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at top, ${partner.color}08, transparent 50%)`, pointerEvents: "none" }} />
              <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 2, background: `linear-gradient(90deg, transparent, ${partner.color}60, transparent)` }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{
                  width: 64, height: 64, margin: "0 auto 18px",
                  borderRadius: "50%", background: `${partner.color}12`,
                  border: `1.5px solid ${partner.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, boxShadow: `0 0 24px ${partner.color}20`,
                }}>
                  {partner.emoji}
                </div>
                <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 18, color: "#FFFFFF", marginBottom: 6 }}>{partner.name}</h3>
                <p style={{ color: partner.color, fontSize: 13, fontFamily: "Inter, sans-serif", fontWeight: 600 }}>{partner.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}