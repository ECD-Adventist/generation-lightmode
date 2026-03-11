import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap, Globe, Users, Star, ChevronDown, Play, X } from "lucide-react";
import { useAppLanguage } from "../components/i18n/useAppLanguage";
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
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/8b7388f03_african-american-male-friends-standing-park-discussing-bible.jpg",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/b1de4c3f2_authentic-book-club-scene.jpg",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/c6ad94d7f_cinematic-style-view-parent-child-spending-time-together.jpg",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/4e00b099d_closeup-shot-couple-sitting-park-reading-bible-with-blurred-background.jpg",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/ee6c61c7a_diverse-group-friends-enjoying-quality-time-together-vibrant-outdoor-setting.jpg",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/14079f808_4V5A9468.jpg",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/d7f1e55cf_4V5A9500.jpg",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/f0c6f3f3f_4V5A9524.jpg",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/84146e9e3_4V5A9625.jpg",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/6ecc10600_close-up-people-working-as-team.jpg",
];

const galleryImages2 = [
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/e83180081_group-diverse-people-sitting-table-reading-bible.jpg",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/69f11852d_group-people-are-sitting-ground-one-them-reads-book.jpg",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/38e68ed9e_medium-shot-students-reading-together.jpg",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/a890a8acd_men-doing-makeup-indoors.jpg",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/c0937858a_portrait-interracial-couple-reading-together.jpg",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/db8f107d1_4V5A9685.jpg",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/6cd03ab20_4V5A9699.jpg",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/117e3c882_group-friends-gathering-together.jpg",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/478c205e6_medium-shot-community-members.jpg",
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/9d1bba277_medium-shot-smiley-kids-playing-together.jpg",
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
      <section style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "120px 24px 80px",
        position: "relative",
        overflow: "hidden",
      }}>
        <style>
          {`
            @keyframes image-glow {
              0%, 100% { filter: brightness(1) contrast(1.1); opacity: 0.35; }
              50% { filter: brightness(1.3) contrast(1.2); opacity: 0.55; }
            }
          `}
        </style>
        {/* Background image */}
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/9dae14706_HEROIMAGE.jpg"
          alt="Dark room"
          loading="eager"
          decoding="async"
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center top", opacity: 0.35, pointerEvents: "none",
            animation: "image-glow 4s ease-in-out infinite"
          }}
        />

        {/* Dark overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(11,15,26,0.65) 0%, rgba(11,15,26,0.35) 50%, rgba(11,15,26,0.95) 100%)",
          pointerEvents: "none",
        }} />

        {/* Glow orbs on top of video */}
        <div style={{
          position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
          width: 800, height: 800, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,207,255,0.12) 0%, transparent 70%)",
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

        {/* Logo — GIGANTIC GLOW */}
        <style>{`
          @keyframes logo-glow {
            0%, 100% { filter: drop-shadow(0 0 80px rgba(0,207,255,0.8)) drop-shadow(0 0 150px rgba(255,208,0,0.4)) brightness(1); }
            50% { filter: drop-shadow(0 0 120px rgba(0,207,255,1)) drop-shadow(0 0 200px rgba(255,208,0,0.6)) brightness(1.1); }
          }
        `}</style>
        <div style={{ position: "relative", zIndex: 2, marginBottom: 32, width: "100%", maxWidth: "600px" }}>
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/e51a96559_GENERATIONLIGHTMODE-LOGO.png"
            alt="Generation LightMode"
            style={{ height: "auto", width: "100%", animation: "logo-glow 4s ease-in-out infinite" }}
          />
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
      <section style={{ padding: "88px 24px", position: "relative", overflow: "hidden" }}>
        {/* Scrolling background image */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/e88a5564f_COVER02.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "scroll",
          opacity: 0.18,
          zIndex: 0
        }} />
        {/* Dark overlay */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          background: "linear-gradient(180deg, rgba(11,15,26,0.92) 0%, rgba(11,15,26,0.75) 50%, rgba(11,15,26,0.92) 100%)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 18% 28%, rgba(0,207,255,0.07), transparent 28%), radial-gradient(circle at 82% 78%, rgba(138,92,255,0.12), transparent 24%)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <div className="why-lightmode-stack" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)", gap: 36, alignItems: "center" }}>
            <div style={{ maxWidth: 650 }}>
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

            <div style={{ position: "relative", minHeight: 520, borderRadius: 30, overflow: "hidden", border: "1px solid rgba(138,92,255,0.24)", boxShadow: "0 0 50px rgba(138,92,255,0.14)" }}>
              <img
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
                alt="Young person thinking while using technology"
                loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(11,15,26,0.28) 0%, rgba(11,15,26,0.35) 36%, rgba(11,15,26,0.96) 100%)" }} />

              <div style={{ position: "absolute", inset: 0, padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", opacity: 0.8 }}>
                  {["Screens", "Networks", "Connections"].map((item) => (
                    <span key={item} style={{ padding: "8px 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(11,15,26,0.22)", backdropFilter: "blur(6px)", color: "#FFFFFF", fontSize: 12, fontFamily: "Inter, sans-serif", fontWeight: 700 }}>
                      {item}
                    </span>
                  ))}
                </div>

                <div style={{ maxWidth: 420 }}>
                  <div className="glm-headline" style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.06, marginBottom: 12, textShadow: "0 8px 30px rgba(0,0,0,0.45)" }}>
                    The mission field is already in their hands.
                  </div>
                  <p className="glm-body" style={{ fontSize: 16, color: "#EAF2FF", marginBottom: 18, textShadow: "0 4px 18px rgba(0,0,0,0.45)" }}>
                    LightMode equips young people to meet this moment with courage, clarity, and a visible faith that shines where the world is already looking.
                  </p>
                  <div style={{ width: 170, height: 4, borderRadius: 999, background: "linear-gradient(90deg, #00CFFF 0%, #8A5CFF 55%, #FFD000 100%)", boxShadow: "0 0 20px rgba(0,207,255,0.25)" }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .why-lightmode-stack {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </section>

      <div className="section-divider" />

      {/* WATCH THE VISION (FULL WIDTH) */}
      <section id="vision-video-section" style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        
        {/* Background Image with Play Button */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0, background: "#000", overflow: "hidden" }}>
           <img 
             src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/787db261d_PrBlasiousRuguri-onthecoachcopy.png" 
             style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }}
             alt="Vision Background"
           />
           <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 3 }}>
             <button onClick={() => alert("Video coming soon!")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
               <div style={{ width: 110, height: 110, borderRadius: "50%", background: "rgba(0,207,255,0.15)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid rgba(0,207,255,0.6)", animation: "pulse-glow 2.5s ease-in-out infinite" }}>
                 <Play size={48} color="#00CFFF" style={{ marginLeft: 8 }} />
               </div>
             </button>
           </div>
        </div>

        {/* Dark overlay for text readability */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: "linear-gradient(180deg, rgba(11,15,26,0.8) 0%, rgba(11,15,26,0.3) 50%, rgba(11,15,26,1) 100%)",
          pointerEvents: "none",
        }} />

        {/* Content at the bottom */}
        <div style={{ position: "relative", zIndex: 2, padding: "80px 24px 60px", maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
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
      <section ref={statsRef} style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 className="glm-headline glm-gradient-text" style={{ fontSize: "clamp(28px, 4vw, 48px)" }}>
              {t("statsTitle")}
            </h2>
            <p className="glm-body" style={{ marginTop: 12, fontSize: 17 }}>{t("statsSubtitle")}</p>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
            <StatCard value={1000000} suffix="+" label={t("youthMobilized")} icon={Users} color="#00CFFF" started={statsVisible} />
            <StatCard value={10000000} suffix="+" label={t("peersReached")} icon={Users} color="#FFD000" started={statsVisible} />
            <StatCard value={12} suffix="" label={t("nations")} icon={Globe} color="#1DA1FF" started={statsVisible} />
            <StatCard value={500} suffix="+" label={t("groupsActive")} icon={Star} color="#8A5CFF" started={statsVisible} />
          </div>
        </div>
      </section>

      {/* GALLERIES */}
      <div style={{ background: "#0B0F1A", padding: "40px 0" }}>
        <ScrollingGallery images={galleryImages1} direction="left" speed="160s" />
        <ScrollingGallery images={galleryImages2} direction="right" speed="180s" />
      </div>

      <div className="section-divider" />

      {/* RANKS */}
      <section style={{ padding: "100px 24px", background: "#121826" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <h2 className="glm-headline glm-gradient-text" style={{ fontSize: "clamp(28px, 4vw, 48px)", marginBottom: 16 }}>
            {t("ranksTitle")}
          </h2>
          <p className="glm-body" style={{ fontSize: 17, marginBottom: 56, maxWidth: 600, margin: "0 auto 56px" }}>
            {t("ranksSubtitle")}
          </p>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { rank: "Glow Starter", color: "#00CFFF", icon: "💡", desc: "Posted 3 Glow Drops weekly" },
              { rank: "Light Warrior", color: "#1DA1FF", icon: "⚔️", desc: "Leads a GlowGroup" },
              { rank: "Trendsetter", color: "#8A5CFF", icon: "🌟", desc: "Reached 1,000+ engagements" },
              { rank: "Glow Champion", color: "#FFD000", icon: "🏆", desc: "Mentors others + multiplies disciples" },
            ].map((item, idx) => (
              <div key={item.rank} className="glm-card" style={{ flex: "1 1 200px", maxWidth: 240, border: `1px solid ${item.color}40`, textAlign: "center", position: "relative", overflow: "hidden" }}>
                <div style={{
                  fontSize: 44, marginBottom: 12,
                  filter: `drop-shadow(0 0 12px ${item.color}) drop-shadow(0 0 24px ${item.color}88)`,
                  animation: `pulse-glow ${2 + idx * 0.4}s ease-in-out infinite`,
                  display: "inline-block",
                }}>{item.icon}</div>
                <h3 className="glm-headline" style={{ fontSize: 18, color: item.color, marginBottom: 8, textShadow: `0 0 12px ${item.color}60` }}>{item.rank}</h3>
                <p className="glm-body" style={{ fontSize: 14 }}>{item.desc}</p>
                <style>{`
                  @keyframes bar-grow-${idx} {
                    from { width: 0; }
                    to { width: 100%; }
                  }
                  .glow-bar-${idx} {
                    animation: bar-grow-${idx} 1.8s ease-out ${0.3 + idx * 0.2}s both;
                  }
                `}</style>
                <div className={`glow-bar-${idx}`} style={{ marginTop: 16, height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${item.color}, transparent)` }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* GLOW MAP */}
      <section style={{ padding: "100px 24px", background: "#0B0F1A" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <h2 className="glm-headline glm-gradient-text" style={{ fontSize: "clamp(28px, 4vw, 48px)", marginBottom: 16 }}>
            Global Light Map
          </h2>
          <p className="glm-body" style={{ fontSize: 17, marginBottom: 56, maxWidth: 600, margin: "0 auto 56px" }}>
            Explore where GlowGroups and active members are illuminating the world.
          </p>

          <style>{`
            .leaflet-popup-content-wrapper { background: transparent; padding: 0; box-shadow: none; border-radius: 8px; }
            .leaflet-popup-tip { background: #121826; border: 1px solid rgba(0,207,255,0.4); }
          `}</style>

          <div style={{ 
            height: "500px", width: "100%", borderRadius: "24px", overflow: "hidden", 
            position: "relative", zIndex: 10, background: "#080C14",
            boxShadow: "0 0 40px rgba(0,207,255,0.15), inset 0 0 40px rgba(0,207,255,0.1)",
            border: "1px solid rgba(0,207,255,0.3)"
          }}>
            <MapContainer 
              center={[-1.286389, 34.817223]} 
              zoom={5} 
              scrollWheelZoom={false}
              zoomControl={false}
              style={{ height: "100%", width: "100%", background: "#0B0F1A" }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
                attribution='&copy; CartoDB'
              />
              {mapLocations.flatMap((loc, i) => [
                <CircleMarker
                  key={`outer-${i}`}
                  center={loc.coordinates}
                  radius={Math.max(12, loc.members / 2500)}
                  pathOptions={{ color: "transparent", fillColor: loc.color, fillOpacity: 0.15 }}
                />,
                <CircleMarker
                  key={`inner-${i}`}
                  center={loc.coordinates}
                  radius={Math.max(4, loc.members / 8000)}
                  pathOptions={{ color: loc.color, fillColor: "#FFF", fillOpacity: 0.9, weight: 2 }}
                >
                  <Popup>
                    <div style={{ background: "rgba(18,24,38,0.95)", backdropFilter: "blur(10px)", padding: "16px", borderRadius: "12px", border: `1px solid ${loc.color}60`, color: "#FFF", minWidth: "180px", boxShadow: `0 8px 32px ${loc.color}20` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: loc.color, boxShadow: `0 0 10px ${loc.color}` }} />
                        <h4 className="glm-headline" style={{ fontSize: "16px", color: loc.color, margin: 0 }}>{loc.name}</h4>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px", marginBottom: "8px" }}>
                        <span className="glm-body" style={{ fontSize: "13px" }}>Members</span>
                        <strong style={{color:"#FFF", fontFamily: "Space Grotesk, sans-serif"}}>{loc.members.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span className="glm-body" style={{ fontSize: "13px" }}>GlowGroups</span>
                        <strong style={{color:"#FFF", fontFamily: "Space Grotesk, sans-serif"}}>{loc.groups}</strong>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ])}
            </MapContainer>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* PLEDGE & CTA */}
      <section id="join" style={{ padding: "120px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        
        {/* Background Image */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a6fca6155ae283f1b55144/94eae4cde_couch-light-dimly-lit-room-with-lamp-wall-it.jpg')",
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