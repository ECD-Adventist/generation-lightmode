import { useEffect, useRef, useState } from "react";
import usePublicCommunitySnapshot from "@/hooks/usePublicCommunitySnapshot";
import { countryCoordinates } from "@/lib/countryCoordinates";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Globe, Users, Star, ChevronDown, Play, X, ArrowRight, Zap } from "lucide-react";
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

function ScrollingGallery({ images, direction = "left", speed = "160s" }) {
  const isLeft = direction === 'left';
  return (
    <div style={{ overflow: "hidden", width: "100%", padding: "10px 0" }}>
      <style>{`
        @keyframes scroll-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes scroll-right { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
      `}</style>
      <div style={{ display: "flex", gap: 14, width: "max-content", animation: `scroll-${isLeft ? 'left' : 'right'} ${speed} linear infinite` }}>
        {[...images, ...images].map((src, i) => (
          <img key={i} src={src} alt="Gallery" loading="lazy" decoding="async" width="340" height="220"
            style={{ height: 220, width: 340, objectFit: "cover", borderRadius: 14, border: "1px solid rgba(255,208,0,0.12)", filter: "grayscale(20%) brightness(0.85)", opacity: 0.75, transition: "all 0.4s", flexShrink: 0 }}
            onMouseOver={e => { e.currentTarget.style.filter = "grayscale(0%) brightness(1)"; e.currentTarget.style.opacity = "1"; e.currentTarget.style.border = "1px solid rgba(0,207,255,0.4)"; }}
            onMouseOut={e => { e.currentTarget.style.filter = "grayscale(20%) brightness(0.85)"; e.currentTarget.style.opacity = "0.75"; e.currentTarget.style.border = "1px solid rgba(255,208,0,0.12)"; }}
          />
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
      flex: "1 1 200px", textAlign: "center", padding: "36px 24px",
      background: "rgba(18,24,38,0.7)", backdropFilter: "blur(20px)",
      border: `1px solid ${color}22`, borderRadius: 20,
      position: "relative", overflow: "hidden",
      transition: "transform 0.3s, box-shadow 0.3s",
    }}
      onMouseOver={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 20px 60px ${color}22`; }}
      onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at top, ${color}08, transparent 60%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 1, background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />
      {Icon && <Icon size={28} color={color} style={{ margin: "0 auto 12px", display: "block", filter: `drop-shadow(0 0 10px ${color})` }} />}
      <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 44, color, lineHeight: 1, letterSpacing: "-0.02em" }}>
        {num.toLocaleString()}{suffix}
      </div>
      <div style={{ color: "#8A9BB0", fontSize: 13, fontFamily: "Inter, sans-serif", fontWeight: 500, marginTop: 8 }}>{label}</div>
    </div>
  );
}

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
      { threshold: 0.2 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ background: "#0B0F1A" }}>

      {/* ═══════════════════════════════════════ HERO ═══════════════════════════════════════ */}
      <section style={{
        minHeight: "100vh", position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
      }}>
        {/* Full-bleed hero image */}
        <img
          src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/72c5abed3_ChatGPTImageApr15202603_10_56PM.png"
          alt="Generation LightMode Youth"
          loading="eager"
          decoding="async"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", pointerEvents: "none" }}
        />
        {/* Branded gradient — dark at top (for navbar visibility) + bottom (for text) with subtle cyan/gold tint */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "linear-gradient(180deg, rgba(11,15,26,0.85) 0%, rgba(11,15,26,0.45) 14%, rgba(11,15,26,0.0) 30%, rgba(11,15,26,0.0) 55%, rgba(11,15,26,0.75) 82%, rgba(11,15,26,0.98) 100%)",
        }} />
        {/* Warm golden side vignette matching hero image tonality */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 110%, rgba(255,208,0,0.10) 0%, transparent 55%)" }} />
        {/* Cyan top accent tint to enhance navbar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 180, pointerEvents: "none", background: "linear-gradient(180deg, rgba(0,207,255,0.08) 0%, transparent 100%)" }} />

        {/* Hero Content — bottom-anchored, compact so faces stay visible */}
        <div style={{ position: "relative", zIndex: 2, padding: "0 clamp(20px, 6vw, 80px) clamp(40px, 7vw, 72px)", maxWidth: 1200, width: "100%", margin: "0 auto" }}>
          {/* Headline — reduced size to avoid covering faces */}
          <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(26px, 4vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: 20, color: "#FFFFFF", textShadow: "0 2px 20px rgba(0,0,0,0.6)", maxWidth: 820 }}>
            {t("heroTitleBefore")}{" "}
            <span style={{ background: "linear-gradient(135deg, #FFD000 0%, #00CFFF 60%, #8A5CFF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {t("heroTitleHighlight")}
            </span>
            {" "}{t("heroTitleAfter")}
          </h1>

          {/* Two-column bottom bar */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 28, flexWrap: "wrap" }}>
            <div style={{ maxWidth: 560 }}>
              <p style={{ color: "#E0E8F0", fontSize: "clamp(14px, 1.5vw, 16px)", fontFamily: "Inter, sans-serif", lineHeight: 1.6, marginBottom: 24, textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>
                Join 10M+ believers turning hidden faith into visible light — across the nations of the East-Central Africa Division.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href={createPageUrl("Dashboard")} style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "linear-gradient(135deg, #FFD000, #FFA500)",
                  color: "#0B0F1A", fontFamily: "Space Grotesk, sans-serif", fontWeight: 800,
                  fontSize: 15, padding: "14px 28px", borderRadius: 999, textDecoration: "none",
                  boxShadow: "0 0 30px rgba(255,208,0,0.4), 0 4px 20px rgba(0,0,0,0.3)",
                  transition: "all 0.3s",
                }}
                  onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 50px rgba(255,208,0,0.6), 0 8px 30px rgba(0,0,0,0.3)"; }}
                  onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(255,208,0,0.4), 0 4px 20px rgba(0,0,0,0.3)"; }}
                >
                  <Zap size={16} /> {t("switchOn")}
                </a>
                <button onClick={() => { const el = document.getElementById('vision-video-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.06)", color: "#FFFFFF", fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 15, padding: "13px 26px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", backdropFilter: "blur(10px)", transition: "all 0.3s" }}
                  onMouseOver={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.borderColor = "rgba(0,207,255,0.4)"; }}
                  onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                >
                  <Play size={15} fill="currentColor" /> {t("watchVideo")}
                </button>
              </div>
            </div>

            {/* Verse / Slogan block */}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, color: "#FFD000", fontSize: 15, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6, textShadow: "0 0 20px rgba(255,208,0,0.6)" }}>
                {t("slogan")}
              </p>
              <p style={{ fontFamily: "Inter, sans-serif", fontStyle: "italic", color: "rgba(138,92,255,0.9)", fontSize: 13, letterSpacing: "0.04em" }}>
                {t("verse")}
              </p>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", animation: "float 2.5s ease-in-out infinite", zIndex: 2, opacity: 0.5 }}>
          <ChevronDown size={24} color="#00CFFF" />
        </div>
      </section>

      {/* ═══════════════════ MISSION STRIP — cinematic side-by-side ═══════════════════ */}
      <section style={{ position: "relative", overflow: "hidden", minHeight: "85vh", display: "flex", alignItems: "stretch" }}>
        {/* Left: image panel */}
        <div style={{ flex: "0 0 50%", position: "relative", overflow: "hidden" }} className="hidden lg:block" >
          <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/03e3bfc33_COVER02copy.jpg" alt="Mission field" loading="lazy"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent 70%, #0B0F1A 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(11,15,26,0.4) 0%, transparent 30%, transparent 70%, rgba(11,15,26,0.8) 100%)" }} />
        </div>
        {/* Right: text panel */}
        <div style={{ flex: 1, background: "#0B0F1A", display: "flex", alignItems: "center", padding: "clamp(60px, 8vw, 100px) clamp(32px, 6vw, 80px)" }}>
          {/* Mobile bg */}
          <div className="lg:hidden" style={{ position: "absolute", inset: 0 }}>
            <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/03e3bfc33_COVER02copy.jpg" alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.15 }} />
          </div>
          <div style={{ position: "relative", zIndex: 1, maxWidth: 540 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,208,0,0.08)", border: "1px solid rgba(255,208,0,0.3)", borderRadius: 999, padding: "6px 16px", marginBottom: 24 }}>
              <span style={{ color: "#FFD000", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", fontFamily: "Space Grotesk, sans-serif", textTransform: "uppercase" }}>Why It Matters</span>
            </div>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(32px, 4vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.02em", color: "#FFFFFF", marginBottom: 16 }}>
              {t("whyTitleBefore")}{" "}
              <span style={{ background: "linear-gradient(90deg, #00CFFF, #8A5CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {t("whyTitleHighlight")}
              </span>
            </h2>
            <div style={{ width: 48, height: 3, background: "linear-gradient(90deg, #FFD000, #00CFFF)", borderRadius: 999, marginBottom: 28 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 36 }}>
              <p style={{ color: "#C8D0E0", fontSize: 16, fontFamily: "Inter, sans-serif", lineHeight: 1.7 }}>{t("whyText1")}</p>
              <p style={{ color: "#C8D0E0", fontSize: 16, fontFamily: "Inter, sans-serif", lineHeight: 1.7 }}>{t("whyText2")}</p>
              <p style={{ color: "#E8EFFE", fontSize: 16, fontFamily: "Inter, sans-serif", lineHeight: 1.7, fontWeight: 500 }}>{t("whyText3")}</p>
            </div>
            <Link to={createPageUrl("About")} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#00CFFF", fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 15, textDecoration: "none", border: "1px solid rgba(0,207,255,0.4)", borderRadius: 999, padding: "12px 24px", transition: "all 0.3s" }}
              onMouseOver={e => { e.currentTarget.style.background = "rgba(0,207,255,0.1)"; e.currentTarget.style.borderColor = "rgba(0,207,255,0.8)"; }}
              onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(0,207,255,0.4)"; }}
            >
              {t("learnMore")} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════ VISION / PR. BLASIOUS — dramatic full screen ═══════════════════ */}
      <section id="vision-video-section" style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        {/* Background */}
        <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/809a08e85_PrBlasiousRuguri-Onthecoach.png"
          alt="Pr. Blasious Ruguri" loading="lazy"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
        {/* Warm cinematic overlay matching the couch/lamp warmth */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(11,15,26,0.97) 0%, rgba(11,15,26,0.85) 40%, rgba(11,15,26,0.4) 70%, rgba(20,12,5,0.2) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 50%, rgba(180,100,20,0.15) 0%, transparent 55%)" }} />

        <div style={{ position: "relative", zIndex: 2, maxWidth: 1200, margin: "0 auto", padding: "clamp(60px, 8vw, 100px) clamp(24px, 6vw, 80px)", display: "flex", flexDirection: "column", gap: 32 }}>
          <div style={{ maxWidth: 600 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.25)", borderRadius: 999, padding: "6px 16px", marginBottom: 24 }}>
              <span style={{ color: "#00CFFF", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", fontFamily: "Space Grotesk, sans-serif", textTransform: "uppercase" }}>The Vision</span>
            </div>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 0.98, letterSpacing: "-0.03em", color: "#FFFFFF", marginBottom: 24 }}>
              {t("visionTitle").split(" ")[0]}{" "}
              <span style={{ background: "linear-gradient(90deg, #00CFFF, #8A5CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {t("visionTitle").split(" ").slice(1).join(" ")}
              </span>
            </h2>
            <p style={{ color: "#C8D0E0", fontSize: 17, fontFamily: "Inter, sans-serif", lineHeight: 1.75, marginBottom: 40 }}>
              {t("visionText")}
            </p>

            {/* Play button + CTA */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <button onClick={() => setShowVideo(true)} style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.4)", borderRadius: 999, padding: "14px 24px 14px 18px", cursor: "pointer", color: "#FFFFFF", fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 15, backdropFilter: "blur(12px)", transition: "all 0.3s" }}
                onMouseOver={e => { e.currentTarget.style.background = "rgba(0,207,255,0.2)"; e.currentTarget.style.borderColor = "rgba(0,207,255,0.7)"; }}
                onMouseOut={e => { e.currentTarget.style.background = "rgba(0,207,255,0.1)"; e.currentTarget.style.borderColor = "rgba(0,207,255,0.4)"; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#00CFFF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(0,207,255,0.6)", flexShrink: 0 }}>
                  <Play size={18} color="#0B0F1A" fill="#0B0F1A" style={{ marginLeft: 3 }} />
                </div>
                Watch the Vision
              </button>
              <Link to={createPageUrl("About")} style={{ color: "#C8D0E0", fontFamily: "Inter, sans-serif", fontSize: 14, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid rgba(200,208,224,0.3)", paddingBottom: 2, transition: "color 0.2s" }}
                onMouseOver={e => e.currentTarget.style.color = "#FFFFFF"}
                onMouseOut={e => e.currentTarget.style.color = "#C8D0E0"}
              >
                {t("readMore")} <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ STATS — floating glass cards ═══════════════════ */}
      <section ref={statsRef} style={{ padding: "clamp(80px, 10vw, 120px) clamp(20px, 5vw, 60px)", background: "linear-gradient(180deg, #0B0F1A 0%, #0D1220 100%)", position: "relative", overflow: "hidden" }}>
        {/* Background texture */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(0,207,255,0.06) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.2)", borderRadius: 999, padding: "6px 16px", marginBottom: 20 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00CFFF", boxShadow: "0 0 8px #00CFFF", display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
              <span style={{ color: "#00CFFF", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", fontFamily: "Space Grotesk, sans-serif", textTransform: "uppercase" }}>Live Impact</span>
            </div>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(30px, 4vw, 52px)", letterSpacing: "-0.02em", color: "#FFFFFF", marginBottom: 12 }}>
              {t("statsTitle")}
            </h2>
            <p style={{ color: "#8A9BB0", fontSize: 16, fontFamily: "Inter, sans-serif", maxWidth: 500, margin: "0 auto" }}>{t("statsSubtitle")}</p>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
            <StatCard value={1000000} suffix="+" label="Youth to be Mobilized" icon={Users} color="#00CFFF" started={statsVisible} />
            <StatCard value={10000000} suffix="+" label="Peers to be Reached" icon={Users} color="#FFD000" started={statsVisible} />
            <StatCard value={12} suffix="" label="ECD Nations" icon={Globe} color="#8A5CFF" started={statsVisible} />
            <StatCard value={500} suffix="+" label="Glow Groups Target" icon={Star} color="#1DA1FF" started={statsVisible} />
          </div>
        </div>
      </section>

      {/* ═══════════════════ GALLERY — scrolling strips ═══════════════════ */}
      <div style={{ background: "#080C14", padding: "48px 0", overflow: "hidden" }}>
        <div style={{ textAlign: "center", marginBottom: 36, padding: "0 24px" }}>
          <p style={{ color: "#8A9BB0", fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", fontFamily: "Space Grotesk, sans-serif", textTransform: "uppercase" }}>The Movement in Action</p>
        </div>
        <ScrollingGallery images={galleryImages1} direction="left" speed="160s" />
        <div style={{ height: 14 }} />
        <ScrollingGallery images={galleryImages2} direction="right" speed="180s" />
      </div>

      {/* ═══════════════════ GLOW RANKS ═══════════════════ */}
      <section style={{ padding: "clamp(80px, 10vw, 120px) clamp(20px, 5vw, 60px)", background: "#0D1220", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 100%, rgba(138,92,255,0.06) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,208,0,0.08)", border: "1px solid rgba(255,208,0,0.25)", borderRadius: 999, padding: "6px 16px", marginBottom: 20 }}>
              <span style={{ color: "#FFD000", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", fontFamily: "Space Grotesk, sans-serif", textTransform: "uppercase" }}>Recognition System</span>
            </div>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(30px, 4vw, 52px)", letterSpacing: "-0.02em", background: "linear-gradient(90deg, #FFD000, #00CFFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 14 }}>
              The 4 Glow Pins
            </h2>
            <p style={{ color: "#8A9BB0", fontSize: 16, fontFamily: "Inter, sans-serif", maxWidth: 580, margin: "0 auto" }}>
              Just as Pathfinders earn honors and Literature Evangelists receive pins, LightMode missionaries are celebrated for their faith in action.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 18 }}>
            {[
              { tier: "Bronze", label: "Starter Missionary", icon: "🥉", color: "#C77A2B", glow: "rgba(199,122,43,0.22)", milestone: "First 30 Glow Drops", requirement: "Complete the LightMode Pledge + post your first 30 Glow Drops" },
              { tier: "Silver", label: "Consistent Missionary", icon: "🥈", color: "#C7CEDB", glow: "rgba(199,206,219,0.18)", milestone: "60 Drops + 60 Talks", requirement: "Share 60 Glow Drops + 60 Real Light Talks in one month" },
              { tier: "Gold", label: "Multiplying Missionary", icon: "🥇", color: "#FFD000", glow: "rgba(255,208,0,0.22)", milestone: "Recruit 5 + GlowGroup", requirement: "Recruit 5 new youth + start or strengthen a GlowGroup" },
              { tier: "Platinum", label: "Ambassador Missionary", icon: "💎", color: "#A8C0FF", glow: "rgba(168,192,255,0.15)", milestone: "Mentor · Lead · Report", requirement: "Mentor others + lead a LightMode Challenge + submit Glow Logs" },
            ].map((item, idx) => (
              <div key={item.tier} style={{
                background: "linear-gradient(160deg, rgba(255,255,255,0.025) 0%, rgba(8,12,20,0.95) 100%)",
                border: `1px solid ${item.color}25`, borderRadius: 20, padding: "32px 22px",
                textAlign: "center", position: "relative", overflow: "hidden",
                transition: "transform 0.3s, box-shadow 0.3s",
              }}
                onMouseOver={e => { e.currentTarget.style.transform = "translateY(-8px)"; e.currentTarget.style.boxShadow = `0 24px 60px ${item.glow}`; e.currentTarget.style.borderColor = `${item.color}55`; }}
                onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = `${item.color}25`; }}
              >
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at top, ${item.glow}, transparent 50%)`, pointerEvents: "none" }} />
                <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 2, background: `linear-gradient(90deg, transparent, ${item.color}, transparent)` }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ width: 68, height: 68, margin: "0 auto 18px", borderRadius: "50%", background: `radial-gradient(circle, ${item.color}18, rgba(8,12,20,0.9))`, border: `1.5px solid ${item.color}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, boxShadow: `0 0 24px ${item.glow}` }}>
                    {item.icon}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: item.color, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 6, fontFamily: "Space Grotesk, sans-serif", opacity: 0.8 }}>Tier {idx + 1}</div>
                  <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 20, color: "#FFFFFF", marginBottom: 4 }}>{item.tier}</h3>
                  <div style={{ fontSize: 12, fontWeight: 600, color: item.color, marginBottom: 16, fontFamily: "Inter, sans-serif" }}>{item.label}</div>
                  <div style={{ display: "inline-block", background: `${item.color}12`, border: `1px solid ${item.color}28`, borderRadius: 999, padding: "3px 12px", fontSize: 10, fontWeight: 700, color: item.color, marginBottom: 14, letterSpacing: "0.04em" }}>
                    {item.milestone}
                  </div>
                  <p style={{ fontSize: 12, lineHeight: 1.6, color: "#8A9BB0", fontFamily: "Inter, sans-serif" }}>{item.requirement}</p>
                  <div style={{ width: "50%", margin: "18px auto 0", height: 1, background: `linear-gradient(90deg, transparent, ${item.color}40, transparent)` }} />
                </div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", marginTop: 36, color: "#4A5568", fontSize: 13, fontFamily: "Inter, sans-serif", maxWidth: 520, margin: "36px auto 0" }}>
            Digital badges appear on your LightMode Dashboard profile as you level up. Physical pins are awarded at GlowGroup Bootcamps and the annual Switch On Summit.
          </p>
        </div>
      </section>

      {/* ═══════════════════ GLOBAL MAP ═══════════════════ */}
      <section style={{ padding: "clamp(80px, 10vw, 100px) 0 0", background: "#0B0F1A" }}>
        <div style={{ textAlign: "center", padding: "0 24px", marginBottom: 48 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.2)", borderRadius: 999, padding: "6px 16px", marginBottom: 20 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00CFFF", boxShadow: "0 0 8px #00CFFF", display: "inline-block" }} />
            <span style={{ color: "#00CFFF", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", fontFamily: "Space Grotesk, sans-serif", textTransform: "uppercase" }}>Real-Time Data</span>
          </div>
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.02em", background: "linear-gradient(90deg, #00CFFF, #8A5CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 12 }}>
            Global Light Map
          </h2>
          <p style={{ color: "#8A9BB0", fontSize: 16, fontFamily: "Inter, sans-serif", maxWidth: 500, margin: "0 auto" }}>
            Real-time data showing where our members, GlowGroups, and Glow Drops are illuminating the world.
          </p>
        </div>

        <style>{`
          .leaflet-popup-content-wrapper { background: transparent; padding: 0; box-shadow: none; border-radius: 8px; }
          .leaflet-popup-tip { background: #121826; border: 1px solid rgba(0,207,255,0.4); }
          .leaflet-control-attribution { display: none !important; }
        `}</style>

        <div style={{ position: "relative", zIndex: 10 }}>
          <div style={{ position: "absolute", top: 20, right: 20, zIndex: 1000, background: "rgba(11,15,26,0.92)", backdropFilter: "blur(14px)", borderRadius: 16, padding: "16px 18px", border: "1px solid rgba(0,207,255,0.2)", minWidth: 180 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: "#00CFFF", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12, fontFamily: "Space Grotesk, sans-serif" }}>Live Statistics</div>
            {[
              { label: "Members", value: liveCountries.reduce((s, c) => s + (c.users || 0), 0), color: "#00CFFF" },
              { label: "Countries", value: liveCountries.length, color: "#FFD000" },
              { label: "GlowGroups", value: liveCountries.reduce((s, c) => s + (c.groups || 0), 0), color: "#8A5CFF" },
              { label: "Glow Drops", value: liveCountries.reduce((s, c) => s + (c.drops || 0), 0), color: "#1DA1FF" },
            ].map((stat, index, arr) => (
              <div key={stat.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: index === arr.length - 1 ? "none" : "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize: 11, color: "#8A9BB0", fontFamily: "Inter, sans-serif" }}>{stat.label}</span>
                <strong style={{ color: stat.color, fontFamily: "Space Grotesk, sans-serif", fontSize: 15 }}>{stat.value.toLocaleString()}</strong>
              </div>
            ))}
          </div>
          <div style={{ height: "70vh", minHeight: 450, width: "100%", background: "#080C14" }}>
            <MapContainer center={[10, 20]} zoom={2} scrollWheelZoom={false} zoomControl={false} style={{ height: "100%", width: "100%", background: "#0B0F1A" }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" attribution='&copy; CartoDB' />
              {liveCountries.filter(loc => countryCoordinates[loc.country]).flatMap((loc, i) => {
                const coordinates = countryCoordinates[loc.country];
                const color = i % 3 === 0 ? "#00CFFF" : i % 3 === 1 ? "#FFD000" : "#8A5CFF";
                const totalActivity = (loc.users || 0) + (loc.drops || 0) * 0.3 + (loc.groups || 0) * 2;
                const outerR = Math.min(60, Math.max(20, totalActivity * 1.5 + 15));
                const innerR = Math.min(14, Math.max(8, (loc.users || 0) * 0.5 + 8));
                return [
                  <CircleMarker key={`outer-${i}`} center={coordinates} radius={outerR} pathOptions={{ color: "transparent", fillColor: color, fillOpacity: 0.15 }} />,
                  <CircleMarker key={`inner-${i}`} center={coordinates} radius={innerR} pathOptions={{ color, fillColor: "#FFF", fillOpacity: 0.95, weight: 2 }}>
                    <Popup>
                      <div style={{ background: "rgba(18,24,38,0.96)", backdropFilter: "blur(12px)", padding: "16px", borderRadius: "12px", border: `1px solid ${color}60`, color: "#FFF", minWidth: "180px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />
                          <h4 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "15px", color, margin: 0, fontWeight: 700 }}>{loc.country}</h4>
                        </div>
                        {[["Members", (loc.users || 0).toLocaleString()], ["GlowGroups", loc.groups || 0], ["Glow Drops", loc.drops || 0]].map(([lbl, val], idx, arr) => (
                          <div key={lbl} style={{ display: "flex", justifyContent: "space-between", borderBottom: idx === arr.length - 1 ? "none" : "1px solid rgba(255,255,255,0.05)", paddingBottom: "7px", marginBottom: "7px" }}>
                            <span style={{ fontSize: "12px", color: "#8A9BB0", fontFamily: "Inter, sans-serif" }}>{lbl}</span>
                            <strong style={{ color: "#FFF", fontFamily: "Space Grotesk, sans-serif", fontSize: "14px" }}>{val}</strong>
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

      {/* ═══════════════════ DAILY TRUTH DROPS ═══════════════════ */}
      <DailyDropsSection />

      <div className="section-divider" />

      {/* ═══════════════════ PLEDGE CTA — immersive ═══════════════════ */}
      <section id="join" style={{ position: "relative", overflow: "hidden", padding: "clamp(80px, 12vw, 140px) clamp(20px, 6vw, 60px)" }}>
        {/* Dramatic layered background */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1493612276216-ee3925520721?q=80&w=2000&auto=format&fit=crop')", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.4 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(11,15,26,0.9) 0%, rgba(11,15,26,0.55) 50%, rgba(11,15,26,0.92) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(138,92,255,0.1) 0%, transparent 65%)" }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 20, filter: "drop-shadow(0 0 20px rgba(255,208,0,0.5))" }}>🔆</div>
          <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(32px, 5vw, 60px)", letterSpacing: "-0.03em", color: "#FFFFFF", marginBottom: 20 }}>
            {t("pledgeTitle").split(" ").slice(0, -1).join(" ")}{" "}
            <span style={{ background: "linear-gradient(90deg, #FFD000, #00CFFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {t("pledgeTitle").split(" ").slice(-1)}
            </span>
          </h2>
          <p style={{ color: "#C8D0E0", fontSize: 17, fontFamily: "Inter, sans-serif", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 48px" }}>
            {t("pledgeText")}
          </p>

          {/* Pledge items — clean card style */}
          <div style={{ background: "rgba(18,24,38,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "32px", marginBottom: 40, textAlign: "left" }}>
            <p style={{ fontSize: 15, color: "#C8D0E0", marginBottom: 20, fontStyle: "italic", fontFamily: "Inter, sans-serif" }}>"As a member of Generation LightMode, I pledge to:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                ["LIVE VISIBLY", "Keep my faith always on — unashamed and unhidden."],
                ["SHINE BOLDLY", "Glow for Christ in every post, story, and real-life interaction."],
                ["SPEAK TRUTH", "Share God's love with courage and compassion."],
                ["WALK WITH PURPOSE", "Let my online and offline life reflect Jesus' light."],
                ["IGNITE OTHERS", "Encourage fellow believers and guide seekers to the Light."],
              ].map(([title, text], i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <span style={{ color: "#00CFFF", fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 13, minWidth: 20, paddingTop: 2 }}>{i + 1}.</span>
                  <p style={{ color: "#C8D0E0", fontFamily: "Inter, sans-serif", fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                    <strong style={{ color: "#FFFFFF" }}>{title}</strong> → {text}
                  </p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 15, color: "#FFD000", marginTop: 24, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", textAlign: "center", textShadow: "0 0 15px rgba(255,208,0,0.4)" }}>
              My light will not dim. My faith will not fade. I am Generation LightMode."
            </p>
          </div>

          <a href={createPageUrl("Dashboard")} style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "linear-gradient(135deg, #FFD000, #FFA500)",
            color: "#0B0F1A", fontFamily: "Space Grotesk, sans-serif", fontWeight: 800,
            fontSize: 18, padding: "18px 48px", borderRadius: 999, textDecoration: "none",
            boxShadow: "0 0 40px rgba(255,208,0,0.5), 0 8px 30px rgba(0,0,0,0.4)",
            transition: "all 0.3s",
          }}
            onMouseOver={e => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = "0 0 60px rgba(255,208,0,0.7), 0 12px 40px rgba(0,0,0,0.4)"; }}
            onMouseOut={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(255,208,0,0.5), 0 8px 30px rgba(0,0,0,0.4)"; }}
          >
            <Zap size={20} /> {t("signPledge")}
          </a>
          <p style={{ color: "#4A5568", fontSize: 13, marginTop: 16, fontFamily: "Inter, sans-serif" }}>{t("freeToJoin")}</p>
        </div>
      </section>

      {/* VIDEO MODAL */}
      {showVideo && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(11,15,26,0.95)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(12px)" }}>
          <button onClick={() => setShowVideo(false)} style={{ position: "absolute", top: 24, right: 24, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", width: 48, height: 48, borderRadius: "50%", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
            onMouseOver={e => e.currentTarget.style.background = "rgba(0,207,255,0.2)"}
            onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
          >
            <X size={22} />
          </button>
          <div style={{ width: "100%", maxWidth: 960, aspectRatio: "16/9", background: "#000", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,207,255,0.3)", boxShadow: "0 0 60px rgba(0,207,255,0.2)" }}>
            <iframe width="100%" height="100%" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Vision Video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
          </div>
        </div>
      )}
    </div>
  );
}