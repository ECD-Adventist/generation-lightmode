import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap, ArrowRight, Sparkles } from "lucide-react";

export default function AboutHero({ t, joinNowText }) {
  return (
    <section style={{
      position: "relative", overflow: "hidden",
      background: "radial-gradient(ellipse at 20% 30%, #0F1830 0%, #0B0F1A 55%, #080C14 100%)",
      padding: "clamp(110px, 14vw, 160px) clamp(20px, 6vw, 80px) clamp(80px, 10vw, 120px)",
    }}>
      <style>{`
        @keyframes about-float-slow { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-12px) } }
        @keyframes about-spin-slow { from { transform: rotate(0) } to { transform: rotate(360deg) } }
        @keyframes about-shimmer-line {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>

      {/* Ambient glows */}
      <div style={{ position: "absolute", top: "-15%", left: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,207,255,0.12), transparent 65%)", filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,208,0,0.08), transparent 65%)", filter: "blur(70px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "30%", right: "20%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(138,92,255,0.1), transparent 65%)", filter: "blur(50px)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 2, maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "clamp(32px, 5vw, 72px)", alignItems: "center" }} className="about-hero-grid">
        {/* LEFT — typographic editorial */}
        <div>
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.28)", borderRadius: 999, padding: "8px 18px", marginBottom: 32, backdropFilter: "blur(10px)" }}>
            <Sparkles size={12} style={{ color: "#00CFFF" }} />
            <span style={{ color: "#00CFFF", fontSize: 11, fontWeight: 800, letterSpacing: "0.16em", fontFamily: "Space Grotesk, sans-serif", textTransform: "uppercase" }}>{t("storyBadge")}</span>
          </div>

          {/* Massive headline */}
          <h1 style={{
            fontFamily: "Space Grotesk, sans-serif", fontWeight: 800,
            fontSize: "clamp(44px, 7vw, 96px)", lineHeight: 0.95,
            letterSpacing: "-0.04em", marginBottom: 28, color: "#FFFFFF",
          }}>
            {t("heroTitleBefore")}
            <br />
            <span style={{
              background: "linear-gradient(90deg, #FFD000 0%, #00CFFF 50%, #8A5CFF 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              animation: "about-shimmer-line 6s linear infinite",
            }}>
              {t("heroTitleHighlight")}.
            </span>
          </h1>

          {/* Animated divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
            <div style={{ width: 60, height: 3, background: "linear-gradient(90deg, #FFD000, #00CFFF)", borderRadius: 999 }} />
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", color: "#FFD000", textTransform: "uppercase" }}>Faith. Always On.</span>
          </div>

          {/* Subtitle */}
          <p style={{ color: "#C8D0E0", fontSize: "clamp(15px, 1.5vw, 18px)", fontFamily: "Inter, sans-serif", lineHeight: 1.75, marginBottom: 36, maxWidth: 540 }}>
            {t("heroText")}
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 40 }}>
            <a href={createPageUrl("Dashboard")} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "linear-gradient(135deg, #FFD000, #FFA500)",
              color: "#0B0F1A", fontFamily: "Space Grotesk, sans-serif", fontWeight: 800,
              fontSize: 14, padding: "14px 28px", borderRadius: 999, textDecoration: "none",
              boxShadow: "0 0 40px rgba(255,208,0,0.4), 0 8px 24px rgba(0,0,0,0.3)",
              transition: "all 0.3s",
            }}
              onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 55px rgba(255,208,0,0.6), 0 12px 30px rgba(0,0,0,0.4)"; }}
              onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(255,208,0,0.4), 0 8px 24px rgba(0,0,0,0.3)"; }}
            >
              <Zap size={14} /> {joinNowText}
            </a>
            <Link to={createPageUrl("Challenges")} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.04)", color: "#FFFFFF",
              fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 14,
              padding: "13px 26px", borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.18)",
              backdropFilter: "blur(10px)", textDecoration: "none", transition: "all 0.3s",
            }}
              onMouseOver={e => { e.currentTarget.style.background = "rgba(0,207,255,0.12)"; e.currentTarget.style.borderColor = "rgba(0,207,255,0.5)"; }}
              onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }}
            >
              {t("seeChallenges")} <ArrowRight size={14} />
            </Link>
          </div>

          {/* Verse */}
          <div style={{ paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <p style={{ fontFamily: "Inter, sans-serif", fontStyle: "italic", color: "rgba(200,208,224,0.7)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              "Let your light shine before others, that they may see your good deeds and glorify your Father in heaven."
              <br />
              <span style={{ color: "#FFD000", fontStyle: "normal", fontWeight: 700, letterSpacing: "0.05em", fontSize: 11 }}>— MATTHEW 5:16</span>
            </p>
          </div>
        </div>

        {/* RIGHT — portrait card with floating badges */}
        <div style={{ position: "relative", animation: "about-float-slow 6s ease-in-out infinite" }} className="about-hero-image">
          {/* Rotating border glow */}
          <div style={{
            position: "absolute", inset: -2, borderRadius: 28, overflow: "hidden", pointerEvents: "none",
          }}>
            <div style={{
              position: "absolute", top: "50%", left: "50%", width: "200%", height: "200%",
              background: "conic-gradient(from 0deg, transparent 60%, rgba(0,207,255,0.4) 75%, rgba(255,208,0,0.5) 90%, transparent 100%)",
              animation: "about-spin-slow 10s linear infinite",
            }} />
          </div>

          {/* Image container */}
          <div style={{
            position: "relative", borderRadius: 26, overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.5), 0 0 60px rgba(0,207,255,0.1)",
            aspectRatio: "4/5",
          }}>
            <img
              src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/389dfd11b_group-people-are-sitting-ground-one-them-reads-book.jpg"
              alt="Young believers together"
              loading="eager"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
            />
            {/* Subtle inner gradient for depth */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(11,15,26,0.6) 100%)", pointerEvents: "none" }} />
          </div>

          {/* Floating stat badge — top right */}
          <div style={{
            position: "absolute", top: -16, right: -16, zIndex: 3,
            background: "rgba(11,15,26,0.95)", backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,208,0,0.4)",
            borderRadius: 18, padding: "14px 18px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 0 30px rgba(255,208,0,0.2)",
          }} className="about-hero-badge-top">
            <div style={{ fontSize: 11, fontWeight: 800, color: "#FFD000", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif", marginBottom: 4 }}>Mobilizing</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF", fontFamily: "Space Grotesk, sans-serif", lineHeight: 1, letterSpacing: "-0.02em" }}>1M+</div>
            <div style={{ fontSize: 11, color: "#8A9BB0", fontFamily: "Inter, sans-serif", marginTop: 2 }}>Young believers</div>
          </div>

          {/* Floating stat badge — bottom left */}
          <div style={{
            position: "absolute", bottom: -16, left: -16, zIndex: 3,
            background: "rgba(11,15,26,0.95)", backdropFilter: "blur(20px)",
            border: "1px solid rgba(0,207,255,0.4)",
            borderRadius: 18, padding: "14px 18px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 0 30px rgba(0,207,255,0.2)",
          }} className="about-hero-badge-bottom">
            <div style={{ fontSize: 11, fontWeight: 800, color: "#00CFFF", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif", marginBottom: 4 }}>Across</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF", fontFamily: "Space Grotesk, sans-serif", lineHeight: 1, letterSpacing: "-0.02em" }}>12</div>
            <div style={{ fontSize: 11, color: "#8A9BB0", fontFamily: "Inter, sans-serif", marginTop: 2 }}>ECD Nations</div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .about-hero-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          .about-hero-image { max-width: 420px; margin: 0 auto; }
          .about-hero-badge-top { top: -12px !important; right: -8px !important; padding: 10px 14px !important; }
          .about-hero-badge-top div:nth-child(2) { font-size: 22px !important; }
          .about-hero-badge-bottom { bottom: -12px !important; left: -8px !important; padding: 10px 14px !important; }
          .about-hero-badge-bottom div:nth-child(2) { font-size: 22px !important; }
        }
      `}</style>
    </section>
  );
}