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
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scroll-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>
      <div style={{
        display: "flex", gap: 14, width: "max-content",
        animation: `scroll-${isLeft ? 'left' : 'right'} ${speed} linear infinite`,
      }}>
        {[...images, ...images].map((src, i) => (
          <div key={i} style={{ position: "relative", flexShrink: 0, borderRadius: 20, overflow: "hidden", border: "1px solid rgba(0,207,255,0.18)" }}>
            <img
              src={src} alt="Gallery" loading="lazy" decoding="async"
              width="380" height="250"
              style={{ height: 250, width: 380, objectFit: "cover", display: "block", transition: "transform 0.5s ease" }}
              onMouseOver={e => { e.currentTarget.style.transform = "scale(1.05)"; }}
              onMouseOut={e => { e.currentTarget.style.transform = "scale(1)"; }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(11,15,26,0.7) 100%)" }} />
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
      background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(11,15,26,0.6) 100%)",
      border: `1px solid ${color}25`,
      borderRadius: 24,
      padding: "36px 28px",
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
      backdropFilter: "blur(10px)",
    }}>
      <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, borderRadius: 999 }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at top center, ${color}10, transparent 60%)`, pointerEvents: "none" }} />
      {Icon && <Icon size={28} color={color} style={{ margin: "0 auto 16px", display: "block", filter: `drop-shadow(0 0 10px ${color})` }} />}
      <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(36px, 5vw, 52px)", color, lineHeight: 1, letterSpacing: "-0.02em" }}>
        {num.toLocaleString()}{suffix}
      </div>
      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#8A9BB0", marginTop: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
    </div>
  );
}

const glowPins = [
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

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh", position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
      }}>
        {/* Full-bleed hero image */}
        <img
          src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/72c5abed3_ChatGPTImageApr15202603_10_56PM.png"
          alt="Generation LightMode Youth"
          loading="eager"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", zIndex: 0 }}
        />
        {/* Cinematic gradient overlay — top dark, middle clear, bottom dark */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: "linear-gradient(180deg, rgba(11,15,26,0.55) 0%, rgba(11,15,26,0.0) 30%, rgba(11,15,26,0.0) 55%, rgba(11,15,26,0.92) 85%, rgba(11,15,26,1) 100%)",
        }} />
        {/* Side vignette */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: "linear-gradient(90deg, rgba(11,15,26,0.3) 0%, transparent 25%, transparent 75%, rgba(11,15,26,0.3) 100%)",
          pointerEvents: "none",
        }} />
        {/* Cyan accent light from bottom-left */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, width: "60%", height: "50%", zIndex: 1,
          background: "radial-gradient(ellipse at bottom left, rgba(0,207,255,0.08) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />

        {/* Hero content — anchored to bottom */}
        <div style={{ position: "relative", zIndex: 2, width: "100%", padding: "0 clamp(24px, 6vw, 80px) clamp(60px, 8vw, 100px)" }}>
          {/* Badge */}
          <div style={{ marginBottom: 20 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.35)",
              borderRadius: 999, padding: "7px 18px",
              backdropFilter: "blur(12px)",
              color: "#00CFFF", fontSize: 12, fontFamily: "Inter, sans-serif", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00CFFF", boxShadow: "0 0 10px #00CFFF", display: "inline-block" }} />
              {t("heroBadge")}
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "Space Grotesk, sans-serif", fontWeight: 800,
            fontSize: "clamp(38px, 6.5vw, 90px)", lineHeight: 1.0,
            letterSpacing: "-0.03em", color: "#FFFFFF",
            marginBottom: 20, maxWidth: 900,
            textShadow: "0 4px 40px rgba(0,0,0,0.5)",
          }}>
            {t("heroTitleBefore")}{" "}
            <span style={{
              background: "linear-gradient(90deg, #00CFFF 0%, #8A5CFF 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>{t("heroTitleHighlight")}</span>
            <br />{t("heroTitleAfter")}
          </h1>

          {/* Subtext row */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px 40px", marginBottom: 36 }}>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "clamp(15px, 1.6vw, 18px)", color: "#C8D0E0", maxWidth: 560, lineHeight: 1.7, margin: 0 }}>
              {t("heroSubtitle")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, borderLeft: "2px solid rgba(255,208,0,0.4)", paddingLeft: 20 }}>
              <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, color: "#FFD000", fontSize: 15, letterSpacing: "0.06em", textShadow: "0 0 20px rgba(255,208,0,0.4)" }}>
                {t("slogan")}
              </span>
              <span style={{ fontFamily: "Inter, sans-serif", fontStyle: "italic", color: "#8A5CFF", fontSize: 13 }}>
                {t("verse")}
              </span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <a href={createPageUrl("Dashboard")} style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: "#00CFFF", color: "#0B0F1A",
              fontFamily: "Space Grotesk, sans-serif", fontWeight: 800,
              fontSize: 16, padding: "15px 34px", borderRadius: 999,
              textDecoration: "none", transition: "all 0.3s",
              boxShadow: "0 0 30px rgba(0,207,255,0.5)",
            }}
              onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 50px rgba(0,207,255,0.8)"; }}
              onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(0,207,255,0.5)"; }}
            >
              <Zap size={18} /> {t("switchOn")}
            </a>
            <button onClick={() => {
              document.getElementById('vision-video-section')?.scrollIntoView({ behavior: 'smooth' });
            }} style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: "rgba(255,255,255,0.06)", color: "#FFFFFF",
              fontFamily: "Space Grotesk, sans-serif", fontWeight: 700,
              fontSize: 16, padding: "15px 34px", borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.25)", cursor: "pointer",
              backdropFilter: "blur(10px)", transition: "all 0.3s",
            }}
              onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.borderColor = "rgba(0,207,255,0.5)"; }}
              onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
            >
              <Play size={18} /> {t("watchVideo")}
            </button>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ position: "absolute", bottom: 24, right: 40, zIndex: 2, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Scroll</span>
          <ChevronDown size={18} color="rgba(0,207,255,0.5)" />
        </div>
      </section>

      {/* ── WHY LIGHTMODE EXISTS ──────────────────────────────────── */}
      <section style={{ position: "relative", overflow: "hidden", minHeight: "85vh", display: "flex", alignItems: "center" }}>
        <img
          src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/03e3bfc33_COVER02copy.jpg"
          alt="Mission field" loading="lazy"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", zIndex: 0 }}
        />
        {/* Heavy left overlay, image shows right */}
        <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(105deg, rgba(11,15,26,1) 0%, rgba(11,15,26,0.97) 35%, rgba(11,15,26,0.75) 55%, rgba(11,15,26,0.1) 100%)" }} />
        {/* Top/bottom fade */}
        <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(180deg, rgba(11,15,26,1) 0%, transparent 10%, transparent 90%, rgba(11,15,26,1) 100%)", pointerEvents: "none" }} />
        {/* Cyan accent */}
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, zIndex: 2, background: "linear-gradient(180deg, transparent, #00CFFF, transparent)" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(80px, 10vw, 120px) clamp(24px, 6vw, 80px)", position: "relative", zIndex: 3, width: "100%" }}>
          <div style={{ maxWidth: 580 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,208,0,0.08)", border: "1px solid rgba(255,208,0,0.3)", borderRadius: 999, padding: "6px 16px", marginBottom: 24 }}>
              <span style={{ color: "#FFD000", fontSize: 11, fontWeight: 800, fontFamily: "Inter, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>WHY IT MATTERS</span>
            </div>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(34px, 5vw, 60px)", lineHeight: 1.05, letterSpacing: "-0.02em", color: "#FFFFFF", marginBottom: 16 }}>
              {t("whyTitleBefore")} <span style={{ background: "linear-gradient(90deg, #00CFFF, #8A5CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{t("whyTitleHighlight")}</span>
            </h2>
            <p style={{ color: "#FFD000", fontSize: 13, fontWeight: 700, fontFamily: "Inter, sans-serif", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 28 }}>
              — {t("whySubtitle")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 36 }}>
              {[t("whyText1"), t("whyText2"), t("whyText3")].map((text, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: i === 0 ? "#00CFFF" : i === 1 ? "#FFD000" : "#8A5CFF", marginTop: 8, flexShrink: 0, boxShadow: `0 0 8px ${i === 0 ? "#00CFFF" : i === 1 ? "#FFD000" : "#8A5CFF"}` }} />
                  <p style={{ fontFamily: "Inter, sans-serif", color: "#C8D0E0", fontSize: 16, lineHeight: 1.75, margin: 0 }}>{text}</p>
                </div>
              ))}
            </div>
            <Link to={createPageUrl("About")} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              color: "#00CFFF", fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 15,
              textDecoration: "none", borderBottom: "1px solid rgba(0,207,255,0.4)", paddingBottom: 4,
              transition: "all 0.3s",
            }}
              onMouseOver={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#fff"; }}
              onMouseOut={e => { e.currentTarget.style.color = "#00CFFF"; e.currentTarget.style.borderColor = "rgba(0,207,255,0.4)"; }}
            >
              {t("learnMore")} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── WATCH THE VISION ─────────────────────────────────────── */}
      <section id="vision-video-section" style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
          <img
            src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/809a08e85_PrBlasiousRuguri-Onthecoach.png"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
            alt="Pr. Blasious Ruguri"
          />
        </div>
        <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(180deg, rgba(11,15,26,0.6) 0%, rgba(11,15,26,0.0) 35%, rgba(11,15,26,0.0) 55%, rgba(11,15,26,0.95) 85%, rgba(11,15,26,1) 100%)" }} />
        {/* Gold accent bottom */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, zIndex: 2, background: "linear-gradient(90deg, transparent, #FFD000, transparent)" }} />

        <div style={{ position: "relative", zIndex: 3, padding: "0 clamp(24px, 6vw, 80px) clamp(60px, 8vw, 100px)", maxWidth: 900, margin: "0 auto", width: "100%", textAlign: "center" }}>
          {/* Play button */}
          <button onClick={() => setShowVideo(true)} style={{
            width: 96, height: 96, borderRadius: "50%",
            background: "rgba(0,207,255,0.1)", backdropFilter: "blur(12px)",
            border: "2px solid rgba(0,207,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", margin: "0 auto 32px", transition: "all 0.3s",
            boxShadow: "0 0 40px rgba(0,207,255,0.3)",
          }}
            onMouseOver={e => { e.currentTarget.style.background = "rgba(0,207,255,0.25)"; e.currentTarget.style.boxShadow = "0 0 60px rgba(0,207,255,0.6)"; e.currentTarget.style.transform = "scale(1.08)"; }}
            onMouseOut={e => { e.currentTarget.style.background = "rgba(0,207,255,0.1)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(0,207,255,0.3)"; e.currentTarget.style.transform = "scale(1)"; }}
          >
            <Play size={44} color="#00CFFF" style={{ marginLeft: 6 }} />
          </button>
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(32px, 5vw, 62px)", lineHeight: 1.05, letterSpacing: "-0.02em", color: "#fff", marginBottom: 20 }}>
            {t("visionTitle").split(" ")[0]}{" "}
            <span style={{ background: "linear-gradient(90deg, #00CFFF, #8A5CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {t("visionTitle").split(" ").slice(1).join(" ")}
            </span>
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 17, lineHeight: 1.8, color: "#C8D0E0", marginBottom: 36, maxWidth: 640, margin: "0 auto 36px" }}>
            {t("visionText")}
          </p>
          <Link to={createPageUrl("About")} style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff", fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 15,
            padding: "13px 30px", borderRadius: 999, textDecoration: "none", backdropFilter: "blur(10px)",
            transition: "all 0.3s",
          }}
            onMouseOver={e => { e.currentTarget.style.background = "rgba(0,207,255,0.12)"; e.currentTarget.style.borderColor = "rgba(0,207,255,0.5)"; }}
            onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
          >
            {t("readMore")} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────── */}
      <section ref={statsRef} style={{ padding: "clamp(80px, 10vw, 120px) clamp(24px, 6vw, 80px)", background: "#080C14", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(0,207,255,0.04) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.2)", borderRadius: 999, padding: "6px 16px", marginBottom: 20 }}>
              <span style={{ color: "#00CFFF", fontSize: 11, fontWeight: 800, fontFamily: "Inter, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>Real Impact</span>
            </div>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4vw, 52px)", color: "#fff", letterSpacing: "-0.02em", marginBottom: 12 }}>
              {t("statsTitle")}
            </h2>
            <p style={{ fontFamily: "Inter, sans-serif", color: "#8A9BB0", fontSize: 16 }}>{t("statsSubtitle")}</p>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
            <StatCard value={1000000} suffix="+" label="Youth to be Mobilized" icon={Users} color="#00CFFF" started={statsVisible} />
            <StatCard value={10000000} suffix="+" label="Peers to be Reached" icon={Users} color="#FFD000" started={statsVisible} />
            <StatCard value={12} suffix="" label="ECD Nations" icon={Globe} color="#1DA1FF" started={statsVisible} />
            <StatCard value={500} suffix="+" label="Glow Groups Target" icon={Star} color="#8A5CFF" started={statsVisible} />
          </div>
        </div>
      </section>

      {/* ── GALLERY ──────────────────────────────────────────────── */}
      <div style={{ background: "#0B0F1A", padding: "60px 0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(0,207,255,0.3), transparent)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(138,92,255,0.3), transparent)" }} />
        <div style={{ textAlign: "center", marginBottom: 40, padding: "0 24px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(138,92,255,0.08)", border: "1px solid rgba(138,92,255,0.2)", borderRadius: 999, padding: "6px 16px", color: "#8A5CFF", fontSize: 11, fontWeight: 800, fontFamily: "Inter, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            The Movement in Pictures
          </span>
        </div>
        <ScrollingGallery images={galleryImages1} direction="left" speed="160s" />
        <div style={{ height: 14 }} />
        <ScrollingGallery images={galleryImages2} direction="right" speed="180s" />
      </div>

      {/* ── GLOW PINS ────────────────────────────────────────────── */}
      <section style={{ padding: "clamp(80px, 10vw, 120px) clamp(24px, 6vw, 80px)", background: "#0D1220", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at top center, rgba(255,208,0,0.04) 0%, transparent 50%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,208,0,0.08)", border: "1px solid rgba(255,208,0,0.25)", borderRadius: 999, padding: "6px 16px", marginBottom: 20 }}>
              <span style={{ color: "#FFD000", fontSize: 11, fontWeight: 800, fontFamily: "Inter, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>Recognition System</span>
            </div>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4vw, 52px)", color: "#fff", letterSpacing: "-0.02em", marginBottom: 14 }}>
              The <span style={{ background: "linear-gradient(90deg, #FFD000, #00CFFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>4 Glow Pins</span>
            </h2>
            <p style={{ fontFamily: "Inter, sans-serif", color: "#8A9BB0", fontSize: 16, maxWidth: 580, margin: "0 auto" }}>
              Just as Pathfinders earn honors and Literature Evangelists receive pins, LightMode missionaries are celebrated for their faith in action.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {glowPins.map((item, idx) => (
              <div key={item.tier} style={{
                background: `linear-gradient(160deg, ${item.color}06 0%, rgba(11,15,26,0.98) 100%)`,
                border: `1px solid ${item.color}22`,
                borderRadius: 28,
                padding: "36px 24px",
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
                transition: "transform 0.3s, box-shadow 0.3s",
                cursor: "default",
              }}
                onMouseOver={e => { e.currentTarget.style.transform = "translateY(-8px)"; e.currentTarget.style.boxShadow = `0 24px 60px ${item.glow}`; }}
                onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 2, background: `linear-gradient(90deg, transparent, ${item.color}, transparent)`, borderRadius: 999 }} />
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at top center, ${item.glow}, transparent 55%)`, pointerEvents: "none" }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{
                    width: 76, height: 76, margin: "0 auto 20px",
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${item.color}20, rgba(11,15,26,0.9))`,
                    border: `1px solid ${item.color}35`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 36, boxShadow: `0 0 30px ${item.glow}`,
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: item.color, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 8, opacity: 0.7 }}>Tier {idx + 1}</div>
                  <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 22, color: "#FFFFFF", marginBottom: 4 }}>{item.tier}</h3>
                  <div style={{ fontSize: 12, fontWeight: 700, color: item.color, marginBottom: 18, fontFamily: "Inter, sans-serif" }}>{item.label}</div>
                  <div style={{ display: "inline-block", background: `${item.color}12`, border: `1px solid ${item.color}28`, borderRadius: 999, padding: "4px 14px", fontSize: 11, fontWeight: 700, color: item.color, marginBottom: 16 }}>
                    {item.milestone}
                  </div>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: 1.65, color: "#7A8498" }}>{item.requirement}</p>
                  <div style={{ width: "50%", margin: "20px auto 0", height: 1, background: `linear-gradient(90deg, transparent, ${item.color}40, transparent)` }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 44 }}>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#5A6478", maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
              Digital badges appear on your LightMode Dashboard profile as you level up. Physical pins are awarded at GlowGroup Bootcamps and the annual Switch On Summit.
            </p>
          </div>
        </div>
      </section>

      {/* ── GLOBAL LIGHT MAP ─────────────────────────────────────── */}
      <section style={{ padding: "clamp(80px, 10vw, 120px) 0 0", background: "#080C14", position: "relative" }}>
        <div style={{ textAlign: "center", padding: "0 24px", marginBottom: 48 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.2)", borderRadius: 999, padding: "6px 16px", marginBottom: 20 }}>
            <span style={{ color: "#00CFFF", fontSize: 11, fontWeight: 800, fontFamily: "Inter, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>Live Data</span>
          </div>
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4vw, 52px)", color: "#fff", letterSpacing: "-0.02em", marginBottom: 12 }}>
            Global <span style={{ background: "linear-gradient(90deg, #00CFFF, #8A5CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Light Map</span>
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", color: "#8A9BB0", fontSize: 16, maxWidth: 540, margin: "0 auto" }}>
            Real-time data showing where our members, GlowGroups, and Glow Drops are illuminating the world.
          </p>
        </div>

        <style>{`
          .leaflet-popup-content-wrapper { background: transparent; padding: 0; box-shadow: none; border-radius: 8px; }
          .leaflet-popup-tip { background: #121826; border: 1px solid rgba(0,207,255,0.4); }
          .leaflet-control-attribution { display: none !important; }
        `}</style>

        <div style={{ position: "relative", zIndex: 10 }}>
          <div style={{ position: "absolute", top: 20, right: 20, zIndex: 1000, background: "rgba(11,15,26,0.9)", backdropFilter: "blur(16px)", borderRadius: 20, padding: "18px 20px", border: "1px solid rgba(0,207,255,0.2)", minWidth: 190 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#00CFFF", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Live Statistics</div>
            {[
              { label: "Members", value: liveCountries.reduce((s, c) => s + (c.users || 0), 0), color: "#00CFFF" },
              { label: "Countries", value: liveCountries.length, color: "#FFD000" },
              { label: "GlowGroups", value: liveCountries.reduce((s, c) => s + (c.groups || 0), 0), color: "#8A5CFF" },
              { label: "Glow Drops", value: liveCountries.reduce((s, c) => s + (c.drops || 0), 0), color: "#1DA1FF" },
            ].map((stat, i, arr) => (
              <div key={stat.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i === arr.length - 1 ? "none" : "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#6A7A90" }}>{stat.label}</span>
                <strong style={{ color: stat.color, fontFamily: "Space Grotesk, sans-serif", fontSize: 16 }}>{stat.value.toLocaleString()}</strong>
              </div>
            ))}
          </div>
          <div style={{ height: "70vh", minHeight: 480, width: "100%", background: "#060A10" }}>
            <MapContainer center={[10, 20]} zoom={2} scrollWheelZoom={false} zoomControl={false} style={{ height: "100%", width: "100%", background: "#0B0F1A" }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" attribution='&copy; CartoDB' />
              {liveCountries.filter(loc => countryCoordinates[loc.country]).flatMap((loc, i) => {
                const coords = countryCoordinates[loc.country];
                const color = i % 3 === 0 ? "#00CFFF" : i % 3 === 1 ? "#FFD000" : "#8A5CFF";
                const totalActivity = (loc.users || 0) + (loc.drops || 0) * 0.3 + (loc.groups || 0) * 2;
                const outerR = Math.min(60, Math.max(20, totalActivity * 1.5 + 15));
                const innerR = Math.min(14, Math.max(8, (loc.users || 0) * 0.5 + 8));
                return [
                  <CircleMarker key={`o-${i}`} center={coords} radius={outerR} pathOptions={{ color: "transparent", fillColor: color, fillOpacity: 0.12 }} />,
                  <CircleMarker key={`i-${i}`} center={coords} radius={innerR} pathOptions={{ color, fillColor: "#FFF", fillOpacity: 0.95, weight: 2 }}>
                    <Popup>
                      <div style={{ background: "rgba(11,15,26,0.98)", backdropFilter: "blur(12px)", padding: "16px", borderRadius: "14px", border: `1px solid ${color}50`, color: "#FFF", minWidth: "180px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, boxShadow: `0 0 10px ${color}` }} />
                          <h4 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "15px", color, margin: 0, fontWeight: 700 }}>{loc.country}</h4>
                        </div>
                        {[["Members", (loc.users || 0).toLocaleString()], ["GlowGroups", loc.groups || 0], ["Glow Drops", loc.drops || 0]].map(([label, val], j, arr) => (
                          <div key={label} style={{ display: "flex", justifyContent: "space-between", borderBottom: j < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", paddingBottom: j < arr.length - 1 ? 8 : 0, marginBottom: j < arr.length - 1 ? 8 : 0 }}>
                            <span style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#8A9BB0" }}>{label}</span>
                            <strong style={{ color: "#FFF", fontFamily: "Space Grotesk, sans-serif", fontSize: 14 }}>{val}</strong>
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

      {/* ── DAILY TRUTH DROPS ────────────────────────────────────── */}
      <DailyDropsSection />

      {/* ── PLEDGE & CTA ─────────────────────────────────────────── */}
      <section id="join" style={{ padding: "clamp(80px, 12vw, 140px) clamp(24px, 6vw, 80px)", position: "relative", overflow: "hidden" }}>
        {/* Background */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          backgroundImage: "url('https://images.unsplash.com/photo-1493612276216-ee3925520721?q=80&w=2000&auto=format&fit=crop')",
          backgroundSize: "cover", backgroundPosition: "center",
        }} />
        <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(180deg, rgba(11,15,26,1) 0%, rgba(11,15,26,0.88) 40%, rgba(11,15,26,0.88) 60%, rgba(11,15,26,1) 100%)" }} />
        {/* Violet glow center */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(138,92,255,0.1) 0%, transparent 65%)", zIndex: 1, pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 2, maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 60, marginBottom: 24, filter: "drop-shadow(0 0 20px rgba(255,208,0,0.5))" }}>🔆</div>
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(32px, 5vw, 60px)", letterSpacing: "-0.02em", color: "#fff", marginBottom: 20 }}>
            {t("pledgeTitle").split(" ").slice(0, -1).join(" ")}{" "}
            <span style={{ background: "linear-gradient(90deg, #00CFFF, #8A5CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {t("pledgeTitle").split(" ").slice(-1)}
            </span>
          </h2>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 17, color: "#C8D0E0", maxWidth: 520, margin: "0 auto 48px", lineHeight: 1.75 }}>
            {t("pledgeText")}
          </p>

          {/* Pledge list */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "clamp(24px, 4vw, 40px)", marginBottom: 48, textAlign: "left", backdropFilter: "blur(10px)" }}>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: "#C8D0E0", marginBottom: 24, fontStyle: "italic" }}>"As a member of Generation LightMode, I pledge to:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                ["LIVE VISIBLY", "Keep my faith always on — unashamed and unhidden."],
                ["SHINE BOLDLY", "Glow for Christ in every post, story, and real-life interaction."],
                ["SPEAK TRUTH", "Share God's love with courage and compassion."],
                ["WALK WITH PURPOSE", "Let my online and offline life reflect Jesus' light."],
                ["IGNITE OTHERS", "Encourage fellow believers and guide seekers to the Light."],
              ].map(([bold, rest], i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "rgba(0,207,255,0.12)", border: "1px solid rgba(0,207,255,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 12, color: "#00CFFF", flexShrink: 0,
                  }}>{i + 1}</span>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "#C8D0E0", margin: 0, lineHeight: 1.6 }}>
                    <strong style={{ color: "#fff" }}>{bold}</strong> → {rest}
                  </p>
                </div>
              ))}
            </div>
            <p style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 16, color: "#FFD000", textAlign: "center", marginTop: 28, filter: "drop-shadow(0 0 10px rgba(255,208,0,0.3))" }}>
              My light will not dim. My faith will not fade. I am Generation LightMode."
            </p>
          </div>

          <a href={createPageUrl("Dashboard")} style={{
            display: "inline-flex", alignItems: "center", gap: 12,
            background: "#00CFFF", color: "#0B0F1A",
            fontFamily: "Space Grotesk, sans-serif", fontWeight: 800,
            fontSize: 18, padding: "18px 52px", borderRadius: 999,
            textDecoration: "none", transition: "all 0.3s",
            boxShadow: "0 0 40px rgba(0,207,255,0.6)",
          }}
            onMouseOver={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 0 70px rgba(0,207,255,0.9)"; }}
            onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(0,207,255,0.6)"; }}
          >
            <Zap size={20} /> {t("signPledge")}
          </a>
          <p style={{ fontFamily: "Inter, sans-serif", color: "#5A6478", fontSize: 13, marginTop: 18 }}>{t("freeToJoin")}</p>
        </div>
      </section>

      {/* ── VIDEO MODAL ──────────────────────────────────────────── */}
      {showVideo && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(5,8,14,0.97)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(16px)" }}>
          <button onClick={() => setShowVideo(false)} style={{
            position: "absolute", top: 28, right: 28,
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
            color: "#FFF", width: 48, height: 48, borderRadius: "50%",
            fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <X size={22} />
          </button>
          <div style={{ width: "100%", maxWidth: 1060, aspectRatio: "16/9", background: "#000", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(0,207,255,0.25)", boxShadow: "0 0 80px rgba(0,207,255,0.15)" }}>
            <iframe width="100%" height="100%" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Vision Video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
          </div>
        </div>
      )}
    </div>
  );
}