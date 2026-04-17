import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap, ArrowRight } from "lucide-react";

export default function AboutHero({ t, joinNowText }) {
  return (
    <section style={{
      minHeight: "100vh", position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column", justifyContent: "flex-end",
    }}>
      {/* Full-bleed hero image */}
      <style>{`
        @keyframes about-breathe {
          0%, 100% { filter: brightness(1) contrast(1); transform: scale(1); }
          50% { filter: brightness(1.08) contrast(1.04); transform: scale(1.01); }
        }
      `}</style>
      <img
        src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/389dfd11b_group-people-are-sitting-ground-one-them-reads-book.jpg"
        alt="Young believers together"
        loading="eager"
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center center",
          animation: "about-breathe 8s ease-in-out infinite",
        }}
      />
      {/* Cinematic overlays */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(11,15,26,0.88) 0%, rgba(11,15,26,0.35) 20%, rgba(11,15,26,0.0) 40%, rgba(11,15,26,0.0) 55%, rgba(11,15,26,0.7) 78%, rgba(11,15,26,0.98) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 110%, rgba(255,208,0,0.12) 0%, transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 180, background: "linear-gradient(180deg, rgba(0,207,255,0.06) 0%, transparent 100%)" }} />

      {/* Hero content — bottom left */}
      <div style={{ position: "relative", zIndex: 2, padding: "0 clamp(20px, 6vw, 80px) clamp(48px, 7vw, 72px)", maxWidth: 1200, width: "100%", margin: "0 auto" }}>
        <div style={{ maxWidth: 640 }}>
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.3)", borderRadius: 999, padding: "6px 16px", marginBottom: 22, backdropFilter: "blur(10px)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00CFFF", boxShadow: "0 0 8px #00CFFF" }} />
            <span style={{ color: "#00CFFF", fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", fontFamily: "Space Grotesk, sans-serif", textTransform: "uppercase" }}>{t("storyBadge")}</span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "Space Grotesk, sans-serif", fontWeight: 800,
            fontSize: "clamp(30px, 4.5vw, 58px)", lineHeight: 1.05,
            letterSpacing: "-0.03em", marginBottom: 18, color: "#FFFFFF",
            textShadow: "0 4px 30px rgba(0,0,0,0.7)",
          }}>
            {t("heroTitleBefore")}{" "}
            <span style={{ background: "linear-gradient(135deg, #FFD000 0%, #00CFFF 60%, #8A5CFF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {t("heroTitleHighlight")}
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{ color: "#E0E8F0", fontSize: "clamp(14px, 1.5vw, 17px)", fontFamily: "Inter, sans-serif", lineHeight: 1.7, marginBottom: 28, textShadow: "0 2px 12px rgba(0,0,0,0.7)", maxWidth: 540 }}>
            {t("heroText")} <strong style={{ color: "#FFD000" }}>Faith. Always On.</strong>
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
            <a href={createPageUrl("Dashboard")} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "linear-gradient(135deg, #FFD000, #FFA500)",
              color: "#0B0F1A", fontFamily: "Space Grotesk, sans-serif", fontWeight: 800,
              fontSize: 14, padding: "12px 26px", borderRadius: 999, textDecoration: "none",
              boxShadow: "0 0 30px rgba(255,208,0,0.4), 0 4px 20px rgba(0,0,0,0.3)",
              transition: "all 0.3s",
            }}
              onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 50px rgba(255,208,0,0.6)"; }}
              onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(255,208,0,0.4)"; }}
            >
              <Zap size={14} /> {joinNowText}
            </a>
            <Link to={createPageUrl("Challenges")} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(0,207,255,0.08)", color: "#FFFFFF",
              fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 14,
              padding: "11px 22px", borderRadius: 999,
              border: "1px solid rgba(0,207,255,0.4)",
              backdropFilter: "blur(10px)", textDecoration: "none", transition: "all 0.3s",
            }}
              onMouseOver={e => { e.currentTarget.style.background = "rgba(0,207,255,0.18)"; e.currentTarget.style.borderColor = "rgba(0,207,255,0.7)"; }}
              onMouseOut={e => { e.currentTarget.style.background = "rgba(0,207,255,0.08)"; e.currentTarget.style.borderColor = "rgba(0,207,255,0.4)"; }}
            >
              {t("seeChallenges")} <ArrowRight size={14} />
            </Link>
          </div>

          {/* Verse */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, paddingTop: 16, borderTop: "1px solid rgba(255,208,0,0.18)" }}>
            <span style={{ fontFamily: "Inter, sans-serif", fontStyle: "italic", color: "rgba(200,208,224,0.85)", fontSize: 13, textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}>
              "Let your light shine before others." — Matthew 5:16
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}