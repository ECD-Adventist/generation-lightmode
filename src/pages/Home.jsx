import { useEffect, useRef, useState } from "react";
import usePublicCommunitySnapshot from "@/hooks/usePublicCommunitySnapshot";
import { countryCoordinates } from "@/lib/countryCoordinates";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap, Globe, Users, Star, ChevronDown, Play, X, ArrowRight } from "lucide-react";
import { useAppLanguage } from "../components/i18n/useAppLanguage";
import DailyDropsSection from "../components/home/DailyDropsSection";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const galleryImages1 = [
  "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=2069&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop",
];

const galleryImages2 = [
  "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=2049&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506869640319-ce1a5e18ef4b?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=2070&auto=format&fit=crop",
];

function ScrollingGallery({ images, direction = "left", speed = "40s" }) {
  const isLeft = direction === 'left';
  return (
    <div style={{ overflow: "hidden", width: "100%", padding: "10px 0" }}>
      <style>{`
        @keyframes scroll-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes scroll-right { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
      `}</style>
      <div style={{ display: "flex", gap: 14, width: "max-content", animation: `scroll-${isLeft ? 'left' : 'right'} ${speed} linear infinite` }}>
        {[...images, ...images].map((src, i) => (
          <div key={i} style={{ position: "relative", flexShrink: 0, borderRadius: 20, overflow: "hidden", border: "1px solid rgba(0,207,255,0.18)", boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}>
            <img
              src={src} alt="Gallery" loading="lazy" decoding="async" width="340" height="220"
              style={{ height: 220, width: 340, objectFit: "cover", display: "block", filter: "grayscale(20%) brightness(0.85)", transition: "all 0.4s" }}
              onMouseOver={e => { e.currentTarget.style.filter = "grayscale(0%) brightness(1.05)"; e.currentTarget.parentElement.style.boxShadow = "0 0 32px rgba(0,207,255,0.35)"; }}
              onMouseOut={e => { e.currentTarget.style.filter = "grayscale(20%) brightness(0.85)"; e.currentTarget.parentElement.style.boxShadow = "0 4px 24px rgba(0,0,0,0.4)"; }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 60%, rgba(11,15,26,0.7) 100%)", pointerEvents: "none" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function useCountUp(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function StatCard({ value, suffix, label, icon: Icon, color, started }) {
  const num = useCountUp(value, 2200, started);
  return (
    <div style={{
      flex: "1 1 200px",
      background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(11,15,26,0.95) 100%)",
      border: `1px solid ${color}30`,
      borderRadius: 24,
      padding: "32px 24px",
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
      backdropFilter: "blur(12px)",
      transition: "transform 0.3s, box-shadow 0.3s",
    }}
      onMouseOver={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = `0 20px 60px ${color}25`; }}
      onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at top center, ${color}12, transparent 60%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 1, background: `linear-gradient(90deg, transparent, ${color}80, transparent)` }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        {Icon && <Icon size={32} color={color} style={{ margin: "0 auto 14px", filter: `drop-shadow(0 0 12px ${color})`, display: "block" }} />}
        <div className="glm-headline" style={{ fontSize: 48, color, lineHeight: 1, marginBottom: 8, textShadow: `0 0 30px ${color}60` }}>
          {num.toLocaleString()}{suffix}
        </div>
        <div style={{ fontSize: 13, color: "#8A9BB0", fontFamily: "Inter, sans-serif", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
      </div>
    </div>
  );
}

const GLOW_PINS = [
  { tier: "Bronze", label: "Starter Missionary", icon: "🥉", color: "#C77A2B", glow: "rgba(199,122,43,0.22)", requirement: "Complete the LightMode Pledge + post your first 30 Glow Drops", milestone: "First 30 Glow Drops" },
  { tier: "Silver", label: "Consistent Missionary", icon: "🥈", color: "#C7CEDB", glow: "rgba(199,206,219,0.18)", requirement: "Share 60 Glow Drops + 60 Real Light Talks in one month", milestone: "60 Drops + 60 Talks" },
  { tier: "Gold", label: "Multiplying Missionary", icon: "🥇", color: "#FFD000", glow: "rgba(255,208,0,0.22)", requirement: "Recruit 5 new youth + start or strengthen a GlowGroup", milestone: "Recruit 5 + GlowGroup" },
  { tier: "Platinum", label: "Ambassador Missionary", icon: "💎", color: "#E8EFFE", glow: "rgba(232,239,254,0.15)", requirement: "Mentor others + lead a LightMode Challenge + submit Glow Logs", milestone: "Mentor · Lead · Report" },
];

export default function Home() {
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const { t, isRTL } = useAppLanguage("home");
  const { data: snapshot } = usePublicCommunitySnapshot();
  const liveCountries = snapshot?.countryStats || [];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ background: "#0B0F1A" }}>
      <style>{`
        @keyframes float-slow { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-16px); } }
        @keyframes breathe { 0%,100% { opacity: 0.5; } 50% { opacity: 0.9; } }
        @keyframes hero-scan { 0% { top: 0%; } 100% { top: 100%; } }
        .hero-scan-line { position: absolute; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(0,207,255,0.4), transparent); animation: hero-scan 6s linear infinite; pointer-events: none; z-index: 3; }
      `}</style>

      {/* ═══════════════════════════════════════════
          HERO — Full bleed cinematic
      ═══════════════════════════════════════════ */}
      <section style={{
        minHeight: "100vh", position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
        paddingBottom: "clamp(60px, 10vw, 120px)",
      }}>
        {/* Background */}
        <img
          src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/72c5abed3_ChatGPTImageApr15202603_10_56PM.png"
          alt="Generation LightMode Youth"
          loading="eager"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", opacity: 0.7, pointerEvents: "none" }}
        />
        {/* Cinematic gradient overlays */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(11,15,26,0.3) 0%, rgba(11,15,26,0.1) 35%, rgba(11,15,26,0.75) 75%, rgba(11,15,26,1) 100%)", pointerEvents: "none", zIndex: 1 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(11,15,26,0.25) 0%, transparent 50%, rgba(11,15,26,0.1) 100%)", pointerEvents: "none", zIndex: 1 }} />
        {/* Subtle cyan corner glow */}
        <div style={{ position: "absolute", bottom: 0, left: 0, width: "50%", height: "40%", background: "radial-gradient(ellipse at bottom left, rgba(0,207,255,0.1) 0%, transparent 70%)", pointerEvents: "none", zIndex: 2 }} />
        <div style={{ position: "absolute", bottom: 0, right: 0, width: "40%", height: "35%", background: "radial-gradient(ellipse at bottom right, rgba(138,92,255,0.08) 0%, transparent 70%)", pointerEvents: "none", zIndex: 2 }} />
        {/* Scan line */}
        <div className="hero-scan-line" />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 4, textAlign: "center", padding: "0 24px", maxWidth: 960, width: "100%" }}>
          {/* Live badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.35)", borderRadius: 999, padding: "7px 20px", marginBottom: 28, backdropFilter: "blur(12px)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#00CFFF", boxShadow: "0 0 10px #00CFFF", display: "inline-block", animation: "breathe 2s ease-in-out infinite" }} />
            <span style={{ color: "#00CFFF", fontSize: 12, fontFamily: "Inter, sans-serif", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{t("heroBadge")}</span>
          </div>

          <h1 className="glm-headline" style={{ fontSize: "clamp(36px, 6vw, 76px)", lineHeight: 1.06, marginBottom: 22, textShadow: "0 4px 40px rgba(0,0,0,0.6)" }}>
            {t("heroTitleBefore")}{" "}
            <span className="glm-gradient-text">{t("heroTitleHighlight")}</span>
            <br />{t("heroTitleAfter")}
          </h1>

          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "clamp(16px, 2vw, 19px)", color: "#D0DCF0", marginBottom: 20, lineHeight: 1.7, maxWidth: 640, margin: "0 auto 20px" }}>
            {t("heroSubtitle")}
          </p>

          <p style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, color: "#FFD000", fontSize: 17, marginBottom: 14, letterSpacing: "0.08em", textShadow: "0 0 24px rgba(255,208,0,0.5)" }}>
            {t("slogan")}
          </p>

          <p style={{ fontFamily: "Inter, sans-serif", fontStyle: "italic", color: "#8A5CFF", fontSize: 14, marginBottom: 44, letterSpacing: "0.04em" }}>
            {t("verse")}
          </p>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
            <a href={createPageUrl("Dashboard")} className="glm-btn-primary" style={{ fontSize: 16, padding: "15px 36px", display: "inline-flex", alignItems: "center", gap: 8 }}>
              {t("switchOn")} <Zap size={16} />
            </a>
            <button onClick={() => { const el = document.getElementById('vision-video-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }} className="glm-btn-secondary" style={{ fontSize: 16, padding: "14px 32px", display: "inline-flex", alignItems: "center", gap: 8, backdropFilter: "blur(8px)" }}>
              <Play size={15} /> {t("watchVideo")}
            </button>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 4, animation: "float-slow 2.5s ease-in-out infinite" }}>
          <ChevronDown size={26} color="rgba(0,207,255,0.6)" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          WHY LIGHTMODE EXISTS
      ═══════════════════════════════════════════ */}
      <section style={{ position: "relative", overflow: "hidden", minHeight: "85vh", display: "flex", alignItems: "center" }}>
        <img
          src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/03e3bfc33_COVER02copy.jpg"
          alt="Mission field"
          loading="lazy"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
        />
        {/* Overlays */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, rgba(11,15,26,0.97) 0%, rgba(11,15,26,0.88) 45%, rgba(11,15,26,0.35) 75%, rgba(11,15,26,0.0) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(11,15,26,0.7) 0%, transparent 20%, transparent 80%, rgba(11,15,26,0.8) 100%)" }} />
        {/* Cyan accent line left */}
        <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 3, background: "linear-gradient(180deg, transparent, #00CFFF, transparent)", borderRadius: 999 }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(80px, 10vw, 120px) 48px", position: "relative", zIndex: 2, width: "100%" }}>
          <div style={{ maxWidth: 580 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,208,0,0.08)", border: "1px solid rgba(255,208,0,0.28)", borderRadius: 999, padding: "6px 16px", marginBottom: 24 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFD000", display: "inline-block" }} />
              <span style={{ color: "#FFD000", fontSize: 11, fontWeight: 800, fontFamily: "Inter, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>WHY IT MATTERS</span>
            </div>
            <h2 className="glm-headline" style={{ fontSize: "clamp(34px, 5vw, 58px)", lineHeight: 1.05, marginBottom: 16 }}>
              {t("whyTitleBefore")} <span className="glm-gradient-text">{t("whyTitleHighlight")}</span>
            </h2>
            <p style={{ color: "#FFD000", fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 28, opacity: 0.9 }}>
              {t("whySubtitle")}
            </p>
            {/* Divider */}
            <div style={{ width: 60, height: 2, background: "linear-gradient(90deg, #00CFFF, #8A5CFF)", borderRadius: 999, marginBottom: 28 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 36 }}>
              <p style={{ fontFamily: "Inter, sans-serif", color: "#C8D0E0", fontSize: 17, lineHeight: 1.75 }}>{t("whyText1")}</p>
              <p style={{ fontFamily: "Inter, sans-serif", color: "#C8D0E0", fontSize: 17, lineHeight: 1.75 }}>{t("whyText2")}</p>
              <p style={{ fontFamily: "Inter, sans-serif", color: "#E8F2FF", fontSize: 17, lineHeight: 1.75 }}>{t("whyText3")}</p>
            </div>
            <Link to={createPageUrl("About")} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              color: "#00CFFF", fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 15,
              border: "2px solid rgba(0,207,255,0.5)", borderRadius: 50, padding: "12px 28px",
              textDecoration: "none", transition: "all 0.3s",
              backdropFilter: "blur(8px)", background: "rgba(0,207,255,0.05)",
            }}
              onMouseOver={e => { e.currentTarget.style.background = "rgba(0,207,255,0.15)"; e.currentTarget.style.boxShadow = "0 0 24px rgba(0,207,255,0.3)"; }}
              onMouseOut={e => { e.currentTarget.style.background = "rgba(0,207,255,0.05)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              {t("learnMore")} <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══════════════════════════════════════════
          WATCH THE VISION
      ═══════════════════════════════════════════ */}
      <section id="vision-video-section" style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "flex-end", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "#000", overflow: "hidden" }}>
          <img
            src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/809a08e85_PrBlasiousRuguri-Onthecoach.png"
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }}
            alt="Pr. Blasious Ruguri"
          />
        </div>
        {/* Gradient overlays */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(11,15,26,0.85) 0%, rgba(11,15,26,0.2) 40%, rgba(11,15,26,0.95) 100%)", zIndex: 1 }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 60%, rgba(0,207,255,0.06) 0%, transparent 60%)", zIndex: 1 }} />

        {/* Floating label top-right */}
        <div style={{ position: "absolute", top: 40, right: 40, zIndex: 3, background: "rgba(11,15,26,0.7)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,208,0,0.3)", borderRadius: 16, padding: "12px 20px" }}>
          <p style={{ color: "#FFD000", fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 12, letterSpacing: "0.1em", margin: 0 }}>PR. BLASIOUS RUGURI</p>
          <p style={{ color: "#8A9BB0", fontFamily: "Inter, sans-serif", fontSize: 11, margin: "3px 0 0" }}>President, ECD Division</p>
        </div>

        <div style={{ position: "relative", zIndex: 2, padding: "clamp(60px, 8vw, 100px) 24px clamp(60px, 8vw, 80px)", maxWidth: 900, margin: "0 auto", textAlign: "center", width: "100%" }}>
          <button
            onClick={() => setShowVideo(true)}
            style={{
              width: 100, height: 100, borderRadius: "50%",
              background: "rgba(0,207,255,0.12)", backdropFilter: "blur(12px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px solid rgba(0,207,255,0.6)", margin: "0 auto 32px",
              cursor: "pointer", transition: "all 0.3s",
              boxShadow: "0 0 40px rgba(0,207,255,0.25)",
            }}
            onMouseOver={e => { e.currentTarget.style.background = "rgba(0,207,255,0.25)"; e.currentTarget.style.boxShadow = "0 0 60px rgba(0,207,255,0.5)"; e.currentTarget.style.transform = "scale(1.08)"; }}
            onMouseOut={e => { e.currentTarget.style.background = "rgba(0,207,255,0.12)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(0,207,255,0.25)"; e.currentTarget.style.transform = "scale(1)"; }}
          >
            <Play size={44} color="#00CFFF" style={{ marginLeft: 6 }} />
          </button>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.2)", borderRadius: 999, padding: "5px 14px", marginBottom: 20 }}>
            <span style={{ color: "#00CFFF", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Vision Message</span>
          </div>

          <h2 className="glm-headline" style={{ fontSize: "clamp(32px, 5vw, 60px)", marginBottom: 20, textShadow: "0 2px 30px rgba(0,0,0,0.8)" }}>
            {t("visionTitle").split(" ")[0]} <span className="glm-gradient-text">{t("visionTitle").split(" ").slice(1).join(" ")}</span>
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 18, marginBottom: 40, lineHeight: 1.8, color: "#D4DDED", textShadow: "0 2px 10px rgba(0,0,0,0.7)", maxWidth: 700, margin: "0 auto 40px" }}>
            {t("visionText")}
          </p>
          <Link to={createPageUrl("About")} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            color: "#00CFFF", fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 16,
            border: "2px solid rgba(0,207,255,0.5)", borderRadius: 50, padding: "13px 32px",
            textDecoration: "none", transition: "all 0.3s",
            background: "rgba(11,15,26,0.5)", backdropFilter: "blur(12px)",
          }}
            onMouseOver={e => { e.currentTarget.style.background = "rgba(0,207,255,0.12)"; e.currentTarget.style.boxShadow = "0 0 24px rgba(0,207,255,0.3)"; }}
            onMouseOut={e => { e.currentTarget.style.background = "rgba(11,15,26,0.5)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            {t("readMore")} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══════════════════════════════════════════
          STATS
      ═══════════════════════════════════════════ */}
      <section ref={statsRef} style={{ padding: "clamp(80px, 10vw, 120px) 24px", position: "relative", overflow: "hidden" }}>
        {/* Ambient bg */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 50%, rgba(0,207,255,0.05) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(138,92,255,0.05) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.2)", borderRadius: 999, padding: "6px 16px", marginBottom: 20 }}>
              <span style={{ color: "#00CFFF", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>Impact Numbers</span>
            </div>
            <h2 className="glm-headline glm-gradient-text" style={{ fontSize: "clamp(30px, 4.5vw, 52px)", marginBottom: 14 }}>
              {t("statsTitle")}
            </h2>
            <p style={{ fontFamily: "Inter, sans-serif", color: "#8A9BB0", fontSize: 17, maxWidth: 520, margin: "0 auto" }}>{t("statsSubtitle")}</p>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
            <StatCard value={1000000} suffix="+" label="Youth to be Mobilized" icon={Users} color="#00CFFF" started={statsVisible} />
            <StatCard value={10000000} suffix="+" label="Peers to be Reached" icon={Users} color="#FFD000" started={statsVisible} />
            <StatCard value={12} suffix="" label="ECD Nations" icon={Globe} color="#1DA1FF" started={statsVisible} />
            <StatCard value={500} suffix="+" label="Glow Groups Target" icon={Star} color="#8A5CFF" started={statsVisible} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SCROLLING GALLERIES
      ═══════════════════════════════════════════ */}
      <div style={{ background: "linear-gradient(180deg, #0B0F1A 0%, #0E1320 50%, #0B0F1A 100%)", padding: "48px 0", position: "relative", overflow: "hidden" }}>
        {/* Left/right fade masks */}
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 120, background: "linear-gradient(90deg, #0B0F1A, transparent)", zIndex: 10, pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 120, background: "linear-gradient(270deg, #0B0F1A, transparent)", zIndex: 10, pointerEvents: "none" }} />
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span style={{ color: "#8A9BB0", fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>The Movement in Action</span>
        </div>
        <ScrollingGallery images={galleryImages1} direction="left" speed="160s" />
        <div style={{ height: 14 }} />
        <ScrollingGallery images={galleryImages2} direction="right" speed="180s" />
      </div>

      <div className="section-divider" />

      {/* ═══════════════════════════════════════════
          GLOW PINS — 4 Tier System
      ═══════════════════════════════════════════ */}
      <section style={{ padding: "clamp(80px, 10vw, 120px) 24px", background: "#080C14", position: "relative", overflow: "hidden" }}>
        {/* Ambient */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,208,0,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,208,0,0.08)", border: "1px solid rgba(255,208,0,0.25)", borderRadius: 999, padding: "6px 18px", marginBottom: 20 }}>
              <span style={{ color: "#FFD000", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>Recognition System</span>
            </div>
            <h2 className="glm-headline glm-gradient-text" style={{ fontSize: "clamp(30px, 4.5vw, 52px)", marginBottom: 16 }}>
              The 4 Glow Pins
            </h2>
            <p style={{ fontFamily: "Inter, sans-serif", color: "#8A9BB0", fontSize: 17, maxWidth: 600, margin: "0 auto" }}>
              Just as Pathfinders earn honors and Literature Evangelists receive pins, LightMode missionaries are celebrated for their faith in action.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {GLOW_PINS.map((item, idx) => (
              <div key={item.tier}
                style={{
                  background: `linear-gradient(155deg, ${item.color}08 0%, rgba(8,12,20,0.98) 100%)`,
                  border: `1px solid ${item.color}25`,
                  borderRadius: 28,
                  padding: "36px 24px",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                  transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s",
                  backdropFilter: "blur(8px)",
                }}
                onMouseOver={e => { e.currentTarget.style.transform = "translateY(-10px) scale(1.02)"; e.currentTarget.style.boxShadow = `0 24px 60px ${item.glow}, 0 0 0 1px ${item.color}40`; }}
                onMouseOut={e => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at top center, ${item.glow}, transparent 55%)`, pointerEvents: "none" }} />
                <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 2, background: `linear-gradient(90deg, transparent, ${item.color}, transparent)`, borderRadius: 999 }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{
                    width: 80, height: 80, margin: "0 auto 24px",
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${item.color}20, rgba(8,12,20,0.9))`,
                    border: `2px solid ${item.color}45`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 38,
                    boxShadow: `0 0 32px ${item.glow}`,
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: item.color, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 6, opacity: 0.8 }}>Tier {idx + 1}</div>
                  <h3 className="glm-headline" style={{ fontSize: 24, color: "#FFFFFF", marginBottom: 4 }}>{item.tier}</h3>
                  <div style={{ fontSize: 13, fontWeight: 700, color: item.color, marginBottom: 20, fontFamily: "Inter, sans-serif" }}>{item.label}</div>
                  <div style={{ display: "inline-block", background: `${item.color}12`, border: `1px solid ${item.color}30`, borderRadius: 999, padding: "4px 16px", fontSize: 11, fontWeight: 700, color: item.color, marginBottom: 18, letterSpacing: "0.04em" }}>
                    {item.milestone}
                  </div>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: 1.65, color: "#8A9BB0" }}>{item.requirement}</p>
                  <div style={{ width: "55%", margin: "22px auto 0", height: 1, background: `linear-gradient(90deg, transparent, ${item.color}50, transparent)` }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 48 }}>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#4A5568", maxWidth: 560, margin: "0 auto" }}>
              Digital badges appear on your LightMode Dashboard profile as you level up. Physical pins are awarded at GlowGroup Bootcamps and the annual Switch On Summit.
            </p>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ═══════════════════════════════════════════
          GLOBAL LIGHT MAP
      ═══════════════════════════════════════════ */}
      <section style={{ padding: "clamp(80px, 10vw, 100px) 0 0", background: "#0B0F1A", position: "relative" }}>
        <div style={{ textAlign: "center", padding: "0 24px", marginBottom: 48 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.2)", borderRadius: 999, padding: "6px 16px", marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00CFFF", boxShadow: "0 0 8px #00CFFF", display: "inline-block", animation: "breathe 2s ease-in-out infinite" }} />
            <span style={{ color: "#00CFFF", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>Live Global Data</span>
          </div>
          <h2 className="glm-headline glm-gradient-text" style={{ fontSize: "clamp(30px, 4.5vw, 52px)", marginBottom: 14 }}>
            Global Light Map
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", color: "#8A9BB0", fontSize: 17, maxWidth: 600, margin: "0 auto" }}>
            Real-time data showing where our members, GlowGroups, and Glow Drops are illuminating the world.
          </p>
        </div>

        <style>{`
          .leaflet-popup-content-wrapper { background: transparent; padding: 0; box-shadow: none; border-radius: 8px; }
          .leaflet-popup-tip { background: #121826; border: 1px solid rgba(0,207,255,0.4); }
          .leaflet-control-attribution { display: none !important; }
        `}</style>

        <div style={{ position: "relative", zIndex: 10 }}>
          <div style={{ position: "absolute", top: 20, right: 20, zIndex: 1000, background: "rgba(11,15,26,0.88)", backdropFilter: "blur(20px)", borderRadius: 20, padding: "18px 20px", border: "1px solid rgba(0,207,255,0.2)", minWidth: 190, boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#00CFFF", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Live Statistics</div>
            {[
              { label: "Members", value: liveCountries.reduce((s, c) => s + (c.users || 0), 0), color: "#00CFFF" },
              { label: "Countries", value: liveCountries.length, color: "#FFD000" },
              { label: "GlowGroups", value: liveCountries.reduce((s, c) => s + (c.groups || 0), 0), color: "#8A5CFF" },
              { label: "Glow Drops", value: liveCountries.reduce((s, c) => s + (c.drops || 0), 0), color: "#1DA1FF" },
            ].map((stat, index, arr) => (
              <div key={stat.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: index === arr.length - 1 ? "none" : "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize: 12, color: "#6B7A94" }}>{stat.label}</span>
                <strong style={{ color: stat.color, fontFamily: "Space Grotesk, sans-serif", fontSize: 17 }}>{stat.value.toLocaleString()}</strong>
              </div>
            ))}
          </div>

          <div style={{ height: "70vh", minHeight: 480, width: "100%", background: "#080C14", borderTop: "1px solid rgba(0,207,255,0.08)" }}>
            <MapContainer center={[10, 20]} zoom={2} scrollWheelZoom={false} zoomControl={false} style={{ height: "100%", width: "100%", background: "#0B0F1A" }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" attribution='&copy; CartoDB' />
              {liveCountries.filter(loc => countryCoordinates[loc.country]).flatMap((loc, i) => {
                const coordinates = countryCoordinates[loc.country];
                const color = i % 3 === 0 ? "#00CFFF" : i % 3 === 1 ? "#FFD000" : "#8A5CFF";
                const totalActivity = (loc.users || 0) + (loc.drops || 0) * 0.3 + (loc.groups || 0) * 2;
                const outerR = Math.min(60, Math.max(20, totalActivity * 1.5 + 15));
                const innerR = Math.min(14, Math.max(8, (loc.users || 0) * 0.5 + 8));
                return [
                  <CircleMarker key={`outer-${i}`} center={coordinates} radius={outerR} pathOptions={{ color: "transparent", fillColor: color, fillOpacity: 0.12 }} />,
                  <CircleMarker key={`inner-${i}`} center={coordinates} radius={innerR} pathOptions={{ color, fillColor: "#FFF", fillOpacity: 0.95, weight: 2 }}>
                    <Popup>
                      <div style={{ background: "rgba(8,12,20,0.97)", backdropFilter: "blur(16px)", padding: "16px", borderRadius: "14px", border: `1px solid ${color}50`, color: "#FFF", minWidth: "180px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, boxShadow: `0 0 10px ${color}` }} />
                          <h4 className="glm-headline" style={{ fontSize: "15px", color, margin: 0 }}>{loc.country}</h4>
                        </div>
                        {[["Members", (loc.users || 0).toLocaleString()], ["GlowGroups", loc.groups || 0], ["Glow Drops", loc.drops || 0]].map(([label, val], li, la) => (
                          <div key={label} style={{ display: "flex", justifyContent: "space-between", borderBottom: li < la.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", paddingBottom: li < la.length - 1 ? "7px" : 0, marginBottom: li < la.length - 1 ? "7px" : 0 }}>
                            <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8A9BB0" }}>{label}</span>
                            <strong style={{ color: "#FFF", fontFamily: "Space Grotesk, sans-serif" }}>{val}</strong>
                          </div>
                        ))}
                      </div>
                    </Popup>
                  </CircleMarker>
                ];
              })}
            </MapContainer>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* DAILY TRUTH DROPS */}
      <DailyDropsSection />

      <div className="section-divider" />

      {/* ═══════════════════════════════════════════
          PLEDGE & CTA
      ═══════════════════════════════════════════ */}
      <section id="join" style={{ padding: "clamp(80px, 12vw, 140px) 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        {/* Background */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url('https://images.unsplash.com/photo-1493612276216-ee3925520721?q=80&w=2000&auto=format&fit=crop')",
          backgroundSize: "cover", backgroundPosition: "center", opacity: 0.5,
        }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(8,12,20,1) 0%, rgba(8,12,20,0.55) 40%, rgba(8,12,20,0.55) 60%, rgba(8,12,20,1) 100%)" }} />
        {/* Violet glow */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(138,92,255,0.14) 0%, transparent 65%)", pointerEvents: "none" }} />
        {/* Gold shimmer top */}
        <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,208,0,0.5), transparent)" }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 820, margin: "0 auto" }}>
          <div style={{ fontSize: 68, marginBottom: 24, filter: "drop-shadow(0 0 24px rgba(255,208,0,0.6))" }}>🔆</div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,208,0,0.08)", border: "1px solid rgba(255,208,0,0.25)", borderRadius: 999, padding: "6px 18px", marginBottom: 24 }}>
            <span style={{ color: "#FFD000", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>The Pledge</span>
          </div>

          <h2 className="glm-headline" style={{ fontSize: "clamp(32px, 5vw, 58px)", marginBottom: 20, textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>
            {t("pledgeTitle").split(" ").slice(0, -1).join(" ")} <span className="glm-gradient-text">{t("pledgeTitle").split(" ").slice(-1)}</span>
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 18, maxWidth: 560, margin: "0 auto 48px", color: "#D0DCF0", textShadow: "0 2px 10px rgba(0,0,0,0.8)", lineHeight: 1.7 }}>
            {t("pledgeText")}
          </p>

          {/* Pledge card */}
          <div style={{
            background: "rgba(8,12,20,0.75)", backdropFilter: "blur(20px)",
            border: "1px solid rgba(0,207,255,0.18)", borderRadius: 28,
            padding: "40px 36px", marginBottom: 48, textAlign: "left",
            boxShadow: "0 8px 60px rgba(0,0,0,0.5)",
          }}>
            {/* Top accent */}
            <div style={{ height: 2, background: "linear-gradient(90deg, #00CFFF, #8A5CFF, #FFD000)", borderRadius: 999, marginBottom: 32 }} />
            <p style={{ fontSize: 17, color: "#C8D0E0", marginBottom: 28, fontStyle: "italic", fontFamily: "Inter, sans-serif" }}>"As a member of Generation LightMode, I pledge to:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {[
                ["LIVE VISIBLY", "Keep my faith always on — unashamed and unhidden."],
                ["SHINE BOLDLY", "Glow for Christ in every post, story, and real-life interaction."],
                ["SPEAK TRUTH", "Share God's love with courage and compassion."],
                ["WALK WITH PURPOSE", "Let my online and offline life reflect Jesus' light."],
                ["IGNITE OTHERS", "Encourage fellow believers and guide seekers to the Light."],
              ].map(([bold, text], i) => (
                <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,207,255,0.12)", border: "1px solid rgba(0,207,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <span style={{ color: "#00CFFF", fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 12 }}>{i + 1}</span>
                  </div>
                  <span style={{ fontFamily: "Inter, sans-serif", color: "#C8D0E0", fontSize: 16, lineHeight: 1.6 }}>
                    <strong style={{ color: "#FFFFFF" }}>{bold}</strong> → {text}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,208,0,0.3), transparent)", margin: "28px 0" }} />
            <p style={{ fontSize: 17, color: "#FFD000", fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", textAlign: "center", textShadow: "0 0 20px rgba(255,208,0,0.4)" }}>
              My light will not dim. My faith will not fade. I am Generation LightMode."
            </p>
          </div>

          <a href={createPageUrl("Dashboard")} className="glm-btn-primary" style={{ fontSize: 19, padding: "18px 56px", display: "inline-flex", alignItems: "center", gap: 10 }}>
            {t("signPledge")} <Zap size={18} />
          </a>
          <p style={{ color: "#6B7A94", fontSize: 13, marginTop: 18, fontFamily: "Inter, sans-serif" }}>
            {t("freeToJoin")}
          </p>
        </div>
      </section>

      {/* VIDEO MODAL */}
      {showVideo && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(8,12,20,0.97)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(16px)" }}>
          <button onClick={() => setShowVideo(false)} style={{
            position: "absolute", top: 24, right: 24, background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)", color: "#FFF", width: 48, height: 48, borderRadius: "50%",
            fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s"
          }}
            onMouseOver={e => e.currentTarget.style.background = "rgba(0,207,255,0.2)"}
            onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
          >
            <X size={22} />
          </button>
          <div style={{ width: "100%", maxWidth: 1000, aspectRatio: "16/9", background: "#000", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(0,207,255,0.25)", boxShadow: "0 0 60px rgba(0,207,255,0.15)" }}>
            <iframe width="100%" height="100%" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Vision Video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
          </div>
        </div>
      )}
    </div>
  );
}