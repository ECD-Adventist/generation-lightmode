import { useEffect, useRef, useState } from "react";
import usePublicCommunitySnapshot from "@/hooks/usePublicCommunitySnapshot";
import { countryCoordinates } from "@/lib/countryCoordinates";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap, Globe, Users, Star, ChevronDown, Play, X } from "lucide-react";
import { useAppLanguage } from "../components/i18n/useAppLanguage";
import DailyDropsSection from "../components/home/DailyDropsSection";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const mapLocations = [
  { name: "Nairobi, Kenya", coordinates: [-1.286389, 36.817223], members: 85000, groups: 120, color: "#00CFFF" },
  { name: "Kampala, Uganda", coordinates: [0.347596, 32.582520], members: 62000, groups: 85, color: "#FFD000" },
  { name: "Dar es Salaam, Tanzania", coordinates: [-6.792354, 39.208328], members: 58000, groups: 72, color: "#8A5CFF" },
  { name: "Kigali, Rwanda", coordinates: [-1.944073, 30.061886], members: 45000, groups: 55, color: "#00CFFF" },
  { name: "Bujumbura, Burundi", coordinates: [-3.382200, 29.364400], members: 32000, groups: 40, color: "#FFD000" },
  { name: "Addis Ababa, Ethiopia", coordinates: [9.005401, 38.763611], members: 42000, groups: 60, color: "#8A5CFF" }
];

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
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506869640319-ce1a5e18ef4b?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=2070&auto=format&fit=crop",
];

function ScrollingGallery({ images, direction = "left", speed = "40s" }) {
  const isLeft = direction === 'left';
  return (
    <div style={{ overflow: "hidden", width: "100%", padding: "12px 0" }}>
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
        display: "flex",
        gap: 16,
        width: "max-content",
        animation: `scroll-${isLeft ? 'left' : 'right'} ${speed} linear infinite`,
      }}>
        {[...images, ...images].map((src, i) => (
          <img
            key={i}
            src={src}
            alt="Gallery"
            loading="lazy"
            decoding="async"
            width="360"
            height="240"
            style={{
              height: 240, width: 360, objectFit: "cover", borderRadius: 16,
              border: "1px solid rgba(0,207,255,0.2)",
              filter: "grayscale(30%) contrast(1.1)", opacity: 0.7,
              transition: "all 0.3s", flexShrink: 0,
            }}
            onMouseOver={e => { e.currentTarget.style.filter = "grayscale(0%) contrast(1.1)"; e.currentTarget.style.opacity = "1"; }}
            onMouseOut={e => { e.currentTarget.style.filter = "grayscale(30%) contrast(1.1)"; e.currentTarget.style.opacity = "0.7"; }}
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

function AfricaMapIcon({ color, size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: "0 auto", display: "block", filter: `drop-shadow(0 0 8px ${color})` }}>
      <path d="M30 5 C20 5 12 12 10 22 L8 38 C6 48 10 55 8 65 C6 75 12 85 20 92 C28 99 38 108 42 115 C44 119 48 120 50 118 C52 120 56 119 58 115 C62 108 72 99 80 92 C88 85 94 75 92 65 C90 55 94 48 92 38 L90 22 C88 12 80 5 70 5 Z" fill={color} opacity="0.85"/>
    </svg>
  );
}

function StatCard({ value, suffix, label, icon: Icon, color, started, africaMap }) {
  const num = useCountUp(value, 2200, started);
  return (
    <div className="glm-card" style={{ textAlign: "center", flex: "1 1 180px" }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>
        {africaMap ? <AfricaMapIcon color={color} size={36} /> : Icon && <Icon size={36} color={color} style={{ margin: "0 auto", filter: `drop-shadow(0 0 12px ${color})` }} />}
      </div>
      <div className="glm-headline" style={{ fontSize: 42, color }}>
        {num.toLocaleString()}{suffix}
      </div>
      <div className="glm-body" style={{ fontSize: 14, marginTop: 4 }}>{label}</div>
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
  const liveTopGroups = snapshot?.topGroups || [];

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
      {/* HERO */}
      <section className="pt-[86px] px-6 pb-20" style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        paddingBottom: "clamp(60px, 10vw, 120px)",
      }}>
        {/* Background image */}
        <img
          src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/72c5abed3_ChatGPTImageApr15202603_10_56PM.png"
          alt="Generation LightMode Youth"
          loading="eager"
          decoding="async"
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center top", opacity: 0.6, pointerEvents: "none",
          }}
        />

        {/* Dark overlay — gentle bottom fade */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(11,15,26,0.15) 0%, rgba(11,15,26,0.1) 40%, rgba(11,15,26,0.8) 85%, rgba(11,15,26,1) 100%)",
          pointerEvents: "none",
        }} />

        {/* Tagline badge */}
        <div style={{
          position: "relative", zIndex: 2,
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(0,207,255,0.12)", border: "1px solid rgba(0,207,255,0.4)",
          borderRadius: 50, padding: "8px 20px", marginBottom: 32,
          backdropFilter: "blur(8px)",
        }}>
          <span className="glow-dot"></span>
          <span style={{ color: "#00CFFF", fontSize: 13, fontFamily: "Inter, sans-serif", fontWeight: 600 }}>
            {t("heroBadge")}
          </span>
        </div>

        <h1 className="glm-headline" style={{ position: "relative", zIndex: 2, fontSize: "clamp(30px, 5.5vw, 68px)", lineHeight: 1.1, marginBottom: 24, maxWidth: 900 }}>
          {t("heroTitleBefore")}{" "}
          <span className="glm-gradient-text">{t("heroTitleHighlight")}</span>
          <br />{t("heroTitleAfter")}
        </h1>

        <p className="glm-body" style={{ position: "relative", zIndex: 2, fontSize: "clamp(16px, 2vw, 20px)", maxWidth: 680, marginBottom: 24, color: "#E0E8F0" }}>
          {t("heroSubtitle")}
        </p>

        {/* Slogan */}
        <p style={{ position: "relative", zIndex: 2, fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, color: "#FFD000", fontSize: 18, marginBottom: 16, letterSpacing: "0.08em", textShadow: "0 0 20px rgba(255,208,0,0.5)" }}>
          {t("slogan")}
        </p>

        {/* Bible verse */}
        <p style={{ position: "relative", zIndex: 2, fontFamily: "Inter, sans-serif", fontStyle: "italic", color: "#8A5CFF", fontSize: 15, marginBottom: 48, letterSpacing: "0.05em" }}>
          {t("verse")}
        </p>

        <div style={{ position: "relative", zIndex: 2, display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", width: "100%", maxWidth: 500, margin: "0 auto" }}>
          <a href={createPageUrl("Dashboard")} className="glm-btn-primary" style={{ fontSize: 16, padding: "14px 28px", flex: "1 1 180px", textAlign: "center" }}>
            {t("switchOn")}
          </a>
          <button onClick={() => {
            const el = document.getElementById('vision-video-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }} className="glm-btn-secondary" style={{ fontSize: 16, padding: "14px 28px", flex: "1 1 180px", textAlign: "center" }}>
            {t("watchVideo")}
          </button>
        </div>

        {/* Scroll hint */}
        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", animation: "float 2s ease-in-out infinite", zIndex: 2 }}>
          <ChevronDown size={28} color="rgba(0,207,255,0.5)" />
        </div>
      </section>

      <div className="section-divider" />

      {/* WHY LIGHTMODE EXISTS */}
      <section style={{ padding: "0", position: "relative", overflow: "hidden", minHeight: "80vh", display: "flex", alignItems: "center" }}>
        {/* Full background image */}
        <img
          src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/809a08e85_PrBlasiousRuguri-Onthecoach.png"
          alt="Pr. Blasious Ruguri"
          loading="lazy"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", zIndex: 0 }}
        />
        {/* Dark overlay — heavy left for text, fully transparent right so image shows */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: "linear-gradient(90deg, rgba(11,15,26,0.95) 0%, rgba(11,15,26,0.85) 40%, rgba(11,15,26,0.40) 65%, rgba(11,15,26,0.0) 100%)",
          pointerEvents: "none",
        }} />
        {/* Top/bottom fade */}
        <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(180deg, rgba(11,15,26,0.7) 0%, transparent 15%, transparent 85%, rgba(11,15,26,0.7) 100%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(60px, 10vw, 100px) 24px", position: "relative", zIndex: 2, width: "100%" }}>
          <div style={{ maxWidth: 620 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,208,0,0.08)", border: "1px solid rgba(255,208,0,0.24)", borderRadius: 999, padding: "7px 14px", marginBottom: 22 }}>
              <span style={{ color: "#FFD000", fontSize: 12, fontWeight: 700, fontFamily: "Inter, sans-serif", letterSpacing: "0.04em" }}>WHY IT MATTERS</span>
            </div>
            <h2 className="glm-headline" style={{ fontSize: "clamp(34px, 5vw, 58px)", lineHeight: 1.02, marginBottom: 18 }}>
              {t("whyTitleBefore")} <span className="glm-gradient-text">{t("whyTitleHighlight")}</span>
            </h2>
            <p style={{ color: "#FFD000", fontSize: 14, fontWeight: 700, fontFamily: "Inter, sans-serif", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 24 }}>
              {t("whySubtitle")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 30 }}>
              <p className="glm-body" style={{ fontSize: 17 }}>{t("whyText1")}</p>
              <p className="glm-body" style={{ fontSize: 17 }}>{t("whyText2")}</p>
              <p className="glm-body" style={{ fontSize: 17, color: "#EAF2FF" }}>{t("whyText3")}</p>
            </div>
            <Link to={createPageUrl("About")} className="glm-btn-secondary" style={{ fontSize: 16 }}>
              {t("learnMore")}
            </Link>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* WATCH THE VISION (FULL WIDTH) */}
      <section id="vision-video-section" style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        
        {/* Background Image with Play Button */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0, background: "#000", overflow: "hidden" }}>
           <img 
             src="https://images.unsplash.com/photo-1478147424095-2016abc223b2?q=80&w=2000&auto=format&fit=crop" 
             style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }}
             alt="Vision Background"
           />
        </div>

        {/* Dark overlay for text readability */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: "linear-gradient(180deg, rgba(11,15,26,0.8) 0%, rgba(11,15,26,0.3) 50%, rgba(11,15,26,1) 100%)",
          pointerEvents: "none",
        }} />

        {/* Content at the bottom */}
        <div style={{ position: "relative", zIndex: 2, padding: "80px 24px 60px", maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
            <Link to={createPageUrl("About")} style={{ display: "inline-block", marginBottom: "24px" }}>
               <div style={{ width: 90, height: 90, borderRadius: "50%", background: "rgba(0,207,255,0.15)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(0,207,255,0.6)", animation: "pulse-glow 2.5s ease-in-out infinite", margin: "0 auto" }}>
                 <Play size={40} color="#00CFFF" style={{ marginLeft: 6 }} />
               </div>
             </Link>
            <h2 className="glm-headline" style={{ fontSize: "clamp(32px, 5vw, 56px)", marginBottom: 24, textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>
              {t("visionTitle").split(" ")[0]} <span className="glm-gradient-text">{t("visionTitle").split(" ").slice(1).join(" ")}</span>
            </h2>
            <p className="glm-body" style={{ fontSize: 18, marginBottom: 40, lineHeight: 1.8, color: "#E0E8F0", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>
              {t("visionText")}
            </p>
            <Link to={createPageUrl("About")} className="glm-btn-secondary" style={{ fontSize: 17, background: "rgba(11,15,26,0.6)", backdropFilter: "blur(10px)" }}>
              {t("readMore")}
            </Link>
        </div>
      </section>

      <div className="section-divider" />

      {/* STATS */}
      <section ref={statsRef} style={{ padding: "clamp(60px, 8vw, 80px) 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 className="glm-headline glm-gradient-text" style={{ fontSize: "clamp(28px, 4vw, 48px)" }}>
              {t("statsTitle")}
            </h2>
            <p className="glm-body" style={{ marginTop: 12, fontSize: 17 }}>{t("statsSubtitle")}</p>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
            <StatCard value={1000000} suffix="+" label="Youth to be Mobilized" icon={Users} color="#00CFFF" started={statsVisible} />
            <StatCard value={10000000} suffix="+" label="Peers to be Reached" icon={Users} color="#FFD000" started={statsVisible} />
            <StatCard value={12} suffix="" label="ECD Nations" icon={Globe} color="#1DA1FF" started={statsVisible} />
            <StatCard value={500} suffix="+" label="Glow Groups Target" icon={Star} color="#8A5CFF" started={statsVisible} />
          </div>
        </div>
      </section>

      {/* GALLERIES */}
      <div style={{ background: "#0B0F1A", padding: "40px 0" }}>
        <ScrollingGallery images={galleryImages1} direction="left" speed="160s" />
        <ScrollingGallery images={galleryImages2} direction="right" speed="180s" />
      </div>

      <div className="section-divider" />

      {/* GLOW RANKS — 4 Tier System */}
      <section style={{ padding: "clamp(60px, 10vw, 100px) 24px", background: "#121826" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,208,0,0.1)", border: "1px solid rgba(255,208,0,0.25)", borderRadius: 999, padding: "6px 16px", marginBottom: 18 }}>
              <span style={{ color: "#FFD000", fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>Recognition System</span>
            </div>
            <h2 className="glm-headline glm-gradient-text" style={{ fontSize: "clamp(28px, 4vw, 48px)", marginBottom: 14 }}>
              The 4 Glow Pins
            </h2>
            <p className="glm-body" style={{ fontSize: 17, maxWidth: 620, margin: "0 auto" }}>
              Just as Pathfinders earn honors and Literature Evangelists receive pins, LightMode missionaries are celebrated for their faith in action.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
            {[
              {
                tier: "Bronze",
                label: "Starter Missionary",
                icon: "🥉",
                color: "#C77A2B",
                glow: "rgba(199,122,43,0.22)",
                requirement: "Complete the LightMode Pledge + post your first 30 Glow Drops",
                milestone: "First 30 Glow Drops"
              },
              {
                tier: "Silver",
                label: "Consistent Missionary",
                icon: "🥈",
                color: "#C7CEDB",
                glow: "rgba(199,206,219,0.18)",
                requirement: "Share 60 Glow Drops + 60 Real Light Talks in one month",
                milestone: "60 Drops + 60 Talks"
              },
              {
                tier: "Gold",
                label: "Multiplying Missionary",
                icon: "🥇",
                color: "#FFD000",
                glow: "rgba(255,208,0,0.22)",
                requirement: "Recruit 5 new youth + start or strengthen a GlowGroup",
                milestone: "Recruit 5 + GlowGroup"
              },
              {
                tier: "Platinum",
                label: "Ambassador Missionary",
                icon: "💎",
                color: "#E8EFFE",
                glow: "rgba(232,239,254,0.15)",
                requirement: "Mentor others + lead a LightMode Challenge + submit Glow Logs",
                milestone: "Mentor · Lead · Report"
              },
            ].map((item, idx) => (
              <div key={item.tier} style={{
                background: "linear-gradient(160deg, rgba(255,255,255,0.03) 0%, rgba(11,15,26,0.98) 100%)",
                border: `1px solid ${item.color}28`,
                borderRadius: 24,
                padding: "32px 24px",
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
                transition: "transform 0.3s, box-shadow 0.3s",
              }}
                onMouseOver={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = `0 20px 60px ${item.glow}`; }}
                onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                {/* Background glow */}
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at top center, ${item.glow}, transparent 55%)`, pointerEvents: "none" }} />
                {/* Top accent line */}
                <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 2, background: `linear-gradient(90deg, transparent, ${item.color}, transparent)`, borderRadius: 999 }} />

                <div style={{ position: "relative", zIndex: 1 }}>
                  {/* Icon badge */}
                  <div style={{
                    width: 72, height: 72, margin: "0 auto 20px",
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${item.color}22, rgba(11,15,26,0.8))`,
                    border: `2px solid ${item.color}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 34,
                    boxShadow: `0 0 28px ${item.glow}, inset 0 0 20px ${item.color}10`,
                  }}>
                    {item.icon}
                  </div>

                  {/* Step indicator */}
                  <div style={{ fontSize: 10, fontWeight: 800, color: item.color, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6, opacity: 0.8 }}>
                    Tier {idx + 1}
                  </div>

                  <h3 className="glm-headline" style={{ fontSize: 22, color: "#FFFFFF", marginBottom: 4, lineHeight: 1.15 }}>{item.tier}</h3>
                  <div style={{ fontSize: 13, fontWeight: 700, color: item.color, marginBottom: 18, fontFamily: "Inter, sans-serif" }}>
                    {item.label}
                  </div>

                  {/* Milestone pill */}
                  <div style={{
                    display: "inline-block",
                    background: `${item.color}14`,
                    border: `1px solid ${item.color}30`,
                    borderRadius: 999,
                    padding: "4px 14px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: item.color,
                    marginBottom: 16,
                    letterSpacing: "0.04em",
                  }}>
                    {item.milestone}
                  </div>

                  <p className="glm-body" style={{ fontSize: 13, lineHeight: 1.6, color: "#A0A8BC" }}>{item.requirement}</p>

                  <div style={{ width: "60%", margin: "20px auto 0", height: 1, background: `linear-gradient(90deg, transparent, ${item.color}50, transparent)` }} />
                </div>
              </div>
            ))}
          </div>
          {/* Bottom note */}
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <p className="glm-body" style={{ fontSize: 14, maxWidth: 560, margin: "0 auto", opacity: 0.7 }}>
              Digital badges appear on your LightMode Dashboard profile as you level up. Physical pins are awarded at GlowGroup Bootcamps and the annual Switch On Summit.
            </p>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* GLOW MAP — Full Width */}
      <section style={{ padding: "clamp(60px, 10vw, 80px) 0 0", background: "#0B0F1A" }}>
        <div style={{ textAlign: "center", padding: "0 24px", marginBottom: 40 }}>
          <h2 className="glm-headline glm-gradient-text" style={{ fontSize: "clamp(28px, 4vw, 48px)", marginBottom: 12 }}>
            Global Light Map
          </h2>
          <p className="glm-body" style={{ fontSize: 17, maxWidth: 600, margin: "0 auto" }}>
            Real-time data showing where our members, GlowGroups, and Glow Drops are illuminating the world.
          </p>
        </div>

        <style>{`
          .leaflet-popup-content-wrapper { background: transparent; padding: 0; box-shadow: none; border-radius: 8px; }
          .leaflet-popup-tip { background: #121826; border: 1px solid rgba(0,207,255,0.4); }
          .leaflet-control-attribution { display: none !important; }
        `}</style>

        <div style={{ position: "relative", zIndex: 10 }}>
          {/* Stats overlay */}
          <div style={{ position: "absolute", top: 20, right: 20, zIndex: 1000, background: "rgba(11,15,26,0.92)", backdropFilter: "blur(14px)", borderRadius: 18, padding: "16px 18px", border: "1px solid rgba(0,207,255,0.2)", minWidth: 180 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#00CFFF", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Live Statistics</div>
            {[
              { label: "Members", value: liveCountries.reduce((s, c) => s + (c.users || 0), 0), color: "#00CFFF" },
              { label: "Countries", value: liveCountries.length, color: "#FFD000" },
              { label: "GlowGroups", value: liveCountries.reduce((s, c) => s + (c.groups || 0), 0), color: "#8A5CFF" },
              { label: "Glow Drops", value: liveCountries.reduce((s, c) => s + (c.drops || 0), 0), color: "#1DA1FF" },
            ].map((stat, index, arr) => (
              <div key={stat.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: index === arr.length - 1 ? "none" : "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize: 12, color: "#8A9BB0" }}>{stat.label}</span>
                <strong style={{ color: stat.color, fontFamily: "Space Grotesk, sans-serif", fontSize: 16 }}>{stat.value.toLocaleString()}</strong>
              </div>
            ))}
          </div>

          <div style={{ height: "70vh", minHeight: 450, width: "100%", background: "#080C14" }}>
            <MapContainer 
              center={[10, 20]} 
              zoom={2}
              scrollWheelZoom={false}
              zoomControl={false}
              style={{ height: "100%", width: "100%", background: "#0B0F1A" }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
                attribution='&copy; CartoDB'
              />
              {liveCountries.filter(loc => countryCoordinates[loc.country]).flatMap((loc, i) => {
                const coordinates = countryCoordinates[loc.country];
                const color = i % 3 === 0 ? "#00CFFF" : i % 3 === 1 ? "#FFD000" : "#8A5CFF";
                // Scale radii to be visible even with small numbers
                const totalActivity = (loc.users || 0) + (loc.drops || 0) * 0.3 + (loc.groups || 0) * 2;
                const outerR = Math.min(60, Math.max(20, totalActivity * 1.5 + 15));
                const innerR = Math.min(14, Math.max(8, (loc.users || 0) * 0.5 + 8));
                return [
                  <CircleMarker key={`outer-${i}`} center={coordinates} radius={outerR} pathOptions={{ color: "transparent", fillColor: color, fillOpacity: 0.15 }} />,
                  <CircleMarker key={`inner-${i}`} center={coordinates} radius={innerR} pathOptions={{ color, fillColor: "#FFF", fillOpacity: 0.95, weight: 2 }}>
                    <Popup>
                      <div style={{ background: "rgba(18,24,38,0.96)", backdropFilter: "blur(12px)", padding: "16px", borderRadius: "12px", border: `1px solid ${color}60`, color: "#FFF", minWidth: "180px", boxShadow: `0 8px 32px ${color}20` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, boxShadow: `0 0 10px ${color}` }} />
                          <h4 className="glm-headline" style={{ fontSize: "16px", color, margin: 0 }}>{loc.country}</h4>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px", marginBottom: "8px" }}>
                          <span className="glm-body" style={{ fontSize: "13px" }}>Members</span>
                          <strong style={{color:"#FFF", fontFamily: "Space Grotesk, sans-serif"}}>{(loc.users || 0).toLocaleString()}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px", marginBottom: "8px" }}>
                          <span className="glm-body" style={{ fontSize: "13px" }}>GlowGroups</span>
                          <strong style={{color:"#FFF", fontFamily: "Space Grotesk, sans-serif"}}>{loc.groups || 0}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span className="glm-body" style={{ fontSize: "13px" }}>Glow Drops</span>
                          <strong style={{color:"#FFF", fontFamily: "Space Grotesk, sans-serif"}}>{loc.drops || 0}</strong>
                        </div>
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

      {/* DAILY TRUTH DROPS — Live Feed */}
      <DailyDropsSection />

      <div className="section-divider" />

      {/* PLEDGE & CTA */}
      <section id="join" style={{ padding: "clamp(60px, 12vw, 120px) 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        
        {/* Background Image */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url('https://images.unsplash.com/photo-1493612276216-ee3925520721?q=80&w=2000&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "scroll",
          opacity: 0.65,
          zIndex: 0
        }} />

        {/* Dark overlay for readability (Hero-style) */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          background: "linear-gradient(180deg, rgba(11,15,26,1) 0%, rgba(11,15,26,0.5) 50%, rgba(11,15,26,1) 100%)",
          pointerEvents: "none",
        }} />

        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(138,92,255,0.12) 0%, transparent 70%)",
          pointerEvents: "none", zIndex: 0
        }} />
        
        <div style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto", padding: "40px" }}>
          <div style={{ fontSize: 64, marginBottom: 24, textShadow: "0 0 20px rgba(255,208,0,0.5)" }}>🔆</div>
          <h2 className="glm-headline" style={{ fontSize: "clamp(32px, 5vw, 56px)", marginBottom: 24, textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>
            {t("pledgeTitle").split(" ").slice(0, -1).join(" ")} <span className="glm-gradient-text">{t("pledgeTitle").split(" ").slice(-1)}</span>
          </h2>
          <p className="glm-body" style={{ fontSize: 18, maxWidth: 560, margin: "0 auto 48px", color: "#E0E8F0", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>
            {t("pledgeText")}
          </p>

          <div style={{ marginBottom: 48, textAlign: "left", padding: "0 20px" }}>
            <p style={{ fontSize: 18, color: "#E0E8F0", marginBottom: 24, fontStyle: "italic", fontFamily: "Inter, sans-serif", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>"As a member of Generation LightMode, I pledge to:</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 16 }}>
              <li style={{ display: "flex", gap: 12, alignItems: "flex-start" }}><span style={{ color: "#00CFFF", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>1.</span> <span className="glm-body" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}><strong>LIVE VISIBLY</strong> → Keep my faith always on — unashamed and unhidden.</span></li>
              <li style={{ display: "flex", gap: 12, alignItems: "flex-start" }}><span style={{ color: "#00CFFF", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>2.</span> <span className="glm-body" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}><strong>SHINE BOLDLY</strong> → Glow for Christ in every post, story, and real-life interaction.</span></li>
              <li style={{ display: "flex", gap: 12, alignItems: "flex-start" }}><span style={{ color: "#00CFFF", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>3.</span> <span className="glm-body" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}><strong>SPEAK TRUTH</strong> → Share God's love with courage and compassion.</span></li>
              <li style={{ display: "flex", gap: 12, alignItems: "flex-start" }}><span style={{ color: "#00CFFF", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>4.</span> <span className="glm-body" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}><strong>WALK WITH PURPOSE</strong> → Let my online and offline life reflect Jesus' light.</span></li>
              <li style={{ display: "flex", gap: 12, alignItems: "flex-start" }}><span style={{ color: "#00CFFF", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>5.</span> <span className="glm-body" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}><strong>IGNITE OTHERS</strong> → Encourage fellow believers and guide seekers to the Light.</span></li>
            </ul>
            <p style={{ fontSize: 18, color: "#FFD000", marginTop: 32, fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", textAlign: "center", textShadow: "0 0 20px rgba(255,208,0,0.5)" }}>My light will not dim. My faith will not fade. I am Generation LightMode."</p>
          </div>

          <a href={createPageUrl("Dashboard")} className="glm-btn-primary animate-pulse-glow" style={{ fontSize: 20, padding: "18px 52px" }}>
            {t("signPledge")}
          </a>
          <p style={{ color: "#C8D0E0", fontSize: 14, marginTop: 20, fontFamily: "Inter, sans-serif", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>
            {t("freeToJoin")}
          </p>
        </div>
      </section>

      {/* VIDEO MODAL */}
      {showVideo && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999, background: "rgba(11,15,26,0.95)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(10px)"
        }}>
          <button onClick={() => setShowVideo(false)} style={{
            position: "absolute", top: 24, right: 24, background: "rgba(255,255,255,0.1)",
            border: "none", color: "#FFF", width: 48, height: 48, borderRadius: "50%",
            fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s"
          }}
          onMouseOver={e => e.currentTarget.style.background = "rgba(0,207,255,0.2)"}
          onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
          >
            <X size={24} />
          </button>
          <div style={{ width: "100%", maxWidth: 1000, aspectRatio: "16/9", background: "#000", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,207,255,0.3)", boxShadow: "0 0 40px rgba(0,207,255,0.2)" }}>
            <iframe width="100%" height="100%" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Vision Video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
          </div>
        </div>
      )}
    </div>
  );
}