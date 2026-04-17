import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap, ArrowRight } from "lucide-react";

export default function AboutCTA({ t, joinNowText }) {
  return (
    <section style={{ position: "relative", overflow: "hidden", padding: "clamp(80px, 12vw, 140px) clamp(20px, 6vw, 60px)" }}>
      {/* Background image */}
      <img
        src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/72c5abed3_ChatGPTImageApr15202603_10_56PM.png"
        alt="" loading="lazy"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%", filter: "brightness(0.35) saturate(1.2)" }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(11,15,26,0.92) 0%, rgba(26,18,8,0.7) 40%, rgba(11,15,26,0.85) 80%, rgba(11,15,26,0.98) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 60%, rgba(255,165,0,0.12) 0%, transparent 55%)" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 20, filter: "drop-shadow(0 0 20px rgba(255,208,0,0.5))" }}>⚡</div>
        <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(32px, 5vw, 60px)", letterSpacing: "-0.03em", color: "#FFFFFF", marginBottom: 20 }}>
          {t("storyTitle").split(" ").slice(0, -1).join(" ")}{" "}
          <span style={{ background: "linear-gradient(90deg, #FFD000, #00CFFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            {t("storyTitle").split(" ").slice(-1)}
          </span>
        </h2>
        <p style={{ color: "#C8D0E0", fontSize: 17, fontFamily: "Inter, sans-serif", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 40px" }}>
          {t("storyText")}
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
          <a href={createPageUrl("Dashboard")} style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "linear-gradient(135deg, #FFD000, #FFA500)",
            color: "#0B0F1A", fontFamily: "Space Grotesk, sans-serif", fontWeight: 800,
            fontSize: 16, padding: "16px 36px", borderRadius: 999, textDecoration: "none",
            boxShadow: "0 0 40px rgba(255,208,0,0.5), 0 8px 30px rgba(0,0,0,0.4)",
            transition: "all 0.3s",
          }}
            onMouseOver={e => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = "0 0 60px rgba(255,208,0,0.7)"; }}
            onMouseOut={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(255,208,0,0.5)"; }}
          >
            <Zap size={18} /> {joinNowText}
          </a>
          <Link to={createPageUrl("Challenges")} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.04)", color: "#FFFFFF",
            fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 14,
            padding: "14px 28px", borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.15)",
            textDecoration: "none", backdropFilter: "blur(10px)", transition: "all 0.3s",
          }}
            onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
            onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
          >
            {t("seeChallenges")} <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}