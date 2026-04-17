import React from "react";
import { Radio, Globe2 } from "lucide-react";

export default function AboutMission({ t, liveImpactStats }) {
  return (
    <section style={{ position: "relative", overflow: "hidden", padding: "clamp(80px, 10vw, 130px) clamp(20px, 6vw, 80px)", background: "linear-gradient(180deg, #0B0F1A 0%, #120A05 50%, #0B0F1A 100%)" }}>
      {/* Background image */}
      <img
        src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/07319cc86_medium-shot-community-members.jpg"
        alt="" loading="lazy"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(11,15,26,0.96) 0%, rgba(11,15,26,0.88) 25%, rgba(11,15,26,0.4) 50%, rgba(11,15,26,0.2) 75%, rgba(11,15,26,0.5) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(11,15,26,0.5) 0%, transparent 15%, transparent 85%, rgba(11,15,26,0.7) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 40%, rgba(255,165,0,0.1) 0%, transparent 45%)" }} />

      <div style={{ position: "relative", zIndex: 2, maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(320px, 1fr) 1fr", gap: 48, alignItems: "center" }} className="about-mission-grid">
        <div style={{ maxWidth: 560 }}>
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.3)", borderRadius: 999, padding: "6px 16px", marginBottom: 22, backdropFilter: "blur(10px)" }}>
            <Radio size={13} color="#00CFFF" />
            <span style={{ color: "#00CFFF", fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", fontFamily: "Space Grotesk, sans-serif", textTransform: "uppercase" }}>{t("missionTitle")}</span>
          </div>

          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4vw, 50px)", lineHeight: 1.05, letterSpacing: "-0.03em", color: "#FFFFFF", marginBottom: 20 }}>
            A Digital Movement Built For{" "}
            <span style={{ background: "linear-gradient(90deg, #FFD000, #00CFFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              This Generation
            </span>
          </h2>

          <div style={{ width: 52, height: 3, background: "linear-gradient(90deg, #FFD000, #00CFFF)", borderRadius: 999, marginBottom: 24 }} />

          <p style={{ color: "#D8E0EC", fontSize: 16, fontFamily: "Inter, sans-serif", lineHeight: 1.75, marginBottom: 20 }}>
            {t("missionText1")}
          </p>
          <p style={{ color: "#B0BAC8", fontSize: 15, fontFamily: "Inter, sans-serif", lineHeight: 1.75, marginBottom: 32 }}>
            {t("missionText2")}
          </p>

          {/* Live stats row */}
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {liveImpactStats.map((stat) => (
              <div key={stat.label} style={{ minWidth: 90 }}>
                <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 32, color: stat.color, lineHeight: 1, marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "#8A9BB0", fontWeight: 600, fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — empty to show image */}
        <div />
      </div>

      <style>{`
        @media (max-width: 900px) {
          .about-mission-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}