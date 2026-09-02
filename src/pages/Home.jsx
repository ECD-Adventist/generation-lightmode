import { useEffect, useRef, useState } from "react";
import usePublicCommunitySnapshot from "@/hooks/usePublicCommunitySnapshot";
import { countryCoordinates } from "@/lib/countryCoordinates";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Globe, Users, Star, Play, X, ArrowRight, Zap } from "lucide-react";
import { toast } from "sonner";
import { useAppLanguage } from "../components/i18n/useAppLanguage";
import DailyDropsSection from "../components/home/DailyDropsSection";
import LightModeQuotientQuiz from "../components/home/LightModeQuotientQuiz";
import { useSwitchItOn } from "../components/pledge/SwitchItOnProvider";
import { MapContainer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import LocalWorldBasemap from "@/components/maps/LocalWorldBasemap";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileHome from "../components/home/MobileHome";
import MovementVisual from "../components/home/MovementVisual";
import ProductShowcase from "../components/home/ProductShowcase";
import AtmosphericBleed from "../components/home/AtmosphericBleed";
import { HERO_BACKDROP, CONGREGATION_BLEED, CANDLELIGHT_BLEED } from "../components/home/homeAssets";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Reveal from "../components/home/motion/Reveal";
import TextReveal from "../components/home/motion/TextReveal";
import ParallaxLayer from "../components/home/motion/ParallaxLayer";
import ScrollProgress from "../components/home/motion/ScrollProgress";

const HERO_GRADIENT = "linear-gradient(135deg, #FFD000 0%, #00CFFF 60%, #8A5CFF 100%)";
const WHY_GRADIENT = "linear-gradient(90deg, #FFD000 0%, #00CFFF 60%, #8A5CFF 100%)";
const GOLD_CYAN = "linear-gradient(90deg, #FFD000, #00CFFF)";

const galleryImages1 = [
  "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/5b3a8e4c8_4V5A9468.jpg",
  "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/fc3d2e731_african-american-male-friends-standing-park-discussing-bible.jpg",
  "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/8a30f4210_happy-friends-taking-selfiecopy.jpg",
  "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/17ae95dc7_4V5A9500.jpg",
  "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/ddacb4356_parenting-content-creator.jpg",
  "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/07319cc86_medium-shot-community-members.jpg",
  "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/389dfd11b_group-people-are-sitting-ground-one-them-reads-book.jpg",
];

const galleryImages2 = [
  "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b006b5af7_4V5A9524.jpg",
  "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/3474ac78b_business-people-having-online-meeting.jpg",
  "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b4718684c_medium-shot-man-holding-device.jpg",
  "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/91aa7eed5_4V5A9625.jpg",
  "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/a37f93fdb_close-up-smartphone-recording-vlog-african-influencer-home-studio-using-smartphone-speaking-livestreaming-blogger-discussing-podcast-wearing-headphones-professional-microphone.jpg",
  "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/1d96a9c18_medium-shot-students-reading-together.jpg",
  "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/cd297c245_4V5A9685.jpg",
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
  const isMobile = useIsMobile();
  const { t, isRTL } = useAppLanguage("home");
  const { trigger: triggerSwitchOn } = useSwitchItOn();
  const { data: snapshot } = usePublicCommunitySnapshot();
  const liveCountries = snapshot?.countryStats || [];

  if (isMobile) {
    return <MobileHome t={t} triggerSwitchOn={triggerSwitchOn} liveCountries={liveCountries} snapshot={snapshot} galleryImages={[...galleryImages1, ...galleryImages2]} />;
  }

  return <DesktopHome t={t} isRTL={isRTL} triggerSwitchOn={triggerSwitchOn} liveCountries={liveCountries} snapshot={snapshot} />;
}

function DesktopHome({ t, isRTL, triggerSwitchOn, liveCountries, snapshot }) {
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  // Scroll-driven hero: backdrop sinks slowly, copy lifts and fades, product frame floats up and flattens from a 3D tilt.
  const heroRef = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress: heroP } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const r = (a, b) => (reduce ? [a, a] : [a, b]);
  const bgY = useTransform(heroP, [0, 1], r(0, 180));
  const bgScale = useTransform(heroP, [0, 1], r(1, 1.08));
  const copyY = useTransform(heroP, [0, 1], r(0, -90));
  const copyOpacity = useTransform(heroP, [0, 0.55], r(1, 0));
  const mockY = useTransform(heroP, [0, 1], r(0, -140));
  const mockScale = useTransform(heroP, [0, 0.6], r(1, 1.03));
  const mockRotate = useTransform(heroP, [0, 0.5], r(10, 0));

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
      <ScrollProgress />
      <style>{`
        @keyframes home-rise { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        .home-rise { animation: home-rise 0.9s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .home-rise-2 { animation-delay: 0.15s; }
        .home-rise-3 { animation-delay: 0.3s; }
        .home-quiet-link { color: #C8D0E0; background: none; border: none; cursor: pointer; font-family: Inter, sans-serif; font-size: 14px; font-weight: 500; display: inline-flex; align-items: center; gap: 6px; padding: 8px 4px; transition: color 0.2s; }
        .home-quiet-link:hover { color: #00CFFF; }
        .home-cta:focus-visible, .home-quiet-link:focus-visible, .home-mockup button:focus-visible, [role="tab"]:focus-visible { outline: 2px solid #00CFFF; outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) { .home-rise { animation: none; } }
      `}</style>

      {/* ═══════════════════════════════════════ HERO — atmospheric backdrop + floating product ═══════════════════════════════════════ */}
      <section ref={heroRef} style={{
        minHeight: "100vh", position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column", alignItems: "center",
        paddingTop: "clamp(130px, 15vh, 190px)",
      }}>
        {/* Photographic backdrop — night sky with a golden shaft of light on the horizon, masked so it dissolves upward into the canvas; parallax layer 0 */}
        <motion.img
          src={HERO_BACKDROP}
          alt=""
          loading="eager"
          decoding="async"
          fetchpriority="high"
          style={{
            y: bgY, scale: bgScale, transformOrigin: "center bottom",
            position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 70%", pointerEvents: "none",
            WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.8) 40%, #000 70%)",
            maskImage: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.8) 40%, #000 70%)",
          }}
        />
        {/* Scrims — dark at top for the navbar, soft in the middle, dark at the bottom for the product frame */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(180deg, #0B0F1A 0%, rgba(11,15,26,0.7) 22%, rgba(11,15,26,0.05) 55%, rgba(11,15,26,0.45) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 18%, rgba(0,207,255,0.10) 0%, transparent 50%)" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 100%, rgba(255,208,0,0.10) 0%, transparent 50%)" }} />

        {/* Hero copy — centered, one primary action */}
        <motion.div style={{ y: copyY, opacity: copyOpacity, position: "relative", zIndex: 2, textAlign: "center", maxWidth: 880, padding: "0 clamp(20px, 5vw, 48px)" }}>
          <div className="home-rise" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999, padding: "8px 18px", backdropFilter: "blur(14px)", marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFD000", boxShadow: "0 0 10px #FFD000", display: "inline-block" }} />
            <span style={{ color: "#E8EEF8", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", fontFamily: "Inter, sans-serif", textTransform: "uppercase" }}>{t("slogan")}</span>
          </div>

          <TextReveal
            as="h1"
            delay={0.15}
            segments={[{ text: t("heroTitleBefore") }, { text: t("heroTitleHighlight"), gradient: HERO_GRADIENT }, { text: t("heroTitleAfter") }]}
            style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(40px, 5.6vw, 76px)", lineHeight: 1.02, letterSpacing: "-0.035em", marginBottom: 22, color: "#FFFFFF" }}
          />

          <p className="home-rise home-rise-2" style={{ color: "#C8D0E0", fontSize: "clamp(15px, 1.3vw, 18px)", fontFamily: "Inter, sans-serif", lineHeight: 1.65, maxWidth: 560, margin: "0 auto 34px" }}>
            Join 10M+ believers turning hidden faith into visible light — across the nations of the East-Central Africa Division.
          </p>

          <div className="home-rise home-rise-3" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <button className="home-cta" onClick={() => triggerSwitchOn("Feed")} style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: "linear-gradient(135deg, #FFD000, #FFA500)",
              color: "#0B0F1A", fontFamily: "Space Grotesk, sans-serif", fontWeight: 800,
              fontSize: 15, padding: "16px 36px", borderRadius: 999, border: "none", cursor: "pointer",
              boxShadow: "0 0 40px rgba(255,208,0,0.35), 0 10px 30px rgba(0,0,0,0.4)",
              transition: "all 0.3s",
            }}
              onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 60px rgba(255,208,0,0.55), 0 14px 40px rgba(0,0,0,0.4)"; }}
              onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(255,208,0,0.35), 0 10px 30px rgba(0,0,0,0.4)"; }}
            >
              <Zap size={16} /> {t("switchOn")}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap", justifyContent: "center" }}>
              <button className="home-quiet-link" onClick={() => { const el = document.getElementById('quiz'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}>
                ✨ Take the quiz
              </button>
              <span style={{ width: 1, height: 14, background: "rgba(255,255,255,0.15)" }} />
              <button className="home-quiet-link" onClick={() => { const el = document.getElementById('vision-video-section'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}>
                <Play size={12} fill="currentColor" /> {t("watchVideo")}
              </button>
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontStyle: "italic", color: "rgba(200,208,224,0.6)", fontSize: 13, margin: "6px 0 0" }}>{t("verse")}</p>
          </div>
        </motion.div>

        {/* Floating product mockup — enters from below on a 3D tilt, then flattens and floats up as you scroll (layer 2) */}
        <div style={{ position: "relative", zIndex: 2, width: "min(1040px, 92vw)", marginTop: "clamp(56px, 7vw, 88px)", marginBottom: -70, perspective: 1600 }}>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 90 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div style={{ y: mockY, scale: mockScale, rotateX: mockRotate, transformOrigin: "center top", transformStyle: "preserve-3d" }}>
              <MovementVisual memberCount={snapshot?.totalUsers} onJoin={() => triggerSwitchOn("Feed")} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ WHY LIGHTMODE EXISTS — editorial dark + warm gold ═══════════════════ */}
      <section style={{ position: "relative", overflow: "hidden", padding: "clamp(110px, 13vw, 170px) clamp(20px, 6vw, 80px) clamp(100px, 12vw, 150px)", background: "radial-gradient(ellipse at 20% 30%, #1A1208 0%, #0B0F1A 55%, #080C14 100%)" }}>
        {/* Lightbulb pattern background — fading */}
        <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/8f9bf2363_lightbulb-seamless-pattern-background-light-bulb-motif-wallpaper-idea-thinking-creative-electric-energy-solution-vector.jpg" alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.06, pointerEvents: "none", mixBlendMode: "screen" }} />
        {/* Warm gold ambient blobs matching hero tone */}
        <ParallaxLayer range={140} style={{ position: "absolute", top: "-10%", left: "-5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,165,0,0.12), transparent 65%)", pointerEvents: "none", filter: "blur(40px)" }} />
        <ParallaxLayer range={-110} style={{ position: "absolute", bottom: "-15%", right: "-10%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,208,0,0.08), transparent 65%)", pointerEvents: "none", filter: "blur(50px)" }} />
        {/* Edge fade overlay so pattern dissolves at edges */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 30%, #0B0F1A 75%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1080, margin: "0 auto" }}>
          {/* Eyebrow */}
          <Reveal style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,208,0,0.08)", border: "1px solid rgba(255,208,0,0.28)", borderRadius: 999, padding: "7px 18px", backdropFilter: "blur(10px)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFD000", boxShadow: "0 0 10px #FFD000", display: "inline-block" }} />
              <span style={{ color: "#FFD000", fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", fontFamily: "Space Grotesk, sans-serif", textTransform: "uppercase" }}>Why It Matters</span>
            </div>
          </Reveal>

          {/* Big centered headline — word reveal */}
          <TextReveal
            segments={[{ text: t("whyTitleBefore") }, { text: t("whyTitleHighlight"), gradient: WHY_GRADIENT }]}
            style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(40px, 6vw, 76px)", lineHeight: 1, letterSpacing: "-0.035em", color: "#FFFFFF", marginBottom: 18, textAlign: "center" }}
          />

          {/* Subtitle */}
          {t("whySubtitle") && (
            <Reveal delay={0.25}>
              <p style={{ color: "#FFD000", fontSize: "clamp(15px, 1.6vw, 18px)", fontFamily: "Inter, sans-serif", fontStyle: "italic", textAlign: "center", marginBottom: 64, letterSpacing: "0.02em", textShadow: "0 0 20px rgba(255,208,0,0.25)" }}>
                {t("whySubtitle")}
              </p>
            </Reveal>
          )}

          {/* Tabbed product showcase — one platform, four ways to shine */}
          <Reveal y={56} duration={1.1} style={{ marginBottom: "clamp(72px, 8vw, 110px)" }}>
            <ProductShowcase />
          </Reveal>

          {/* 3-card insight grid — supporting narrative row, staggered reveal */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, marginBottom: 54 }}>
            {[
              { num: "01", title: "The New Mission Field", text: t("whyText1"), accent: "#FFD000", img: "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c98eb0914_generated_image.png" },
              { num: "02", title: "A Generation Online", text: t("whyText2"), accent: "#00CFFF", img: "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/0b76b2e6f_generated_image.png" },
              { num: "03", title: "A Bold Response", text: t("whyText3"), accent: "#8A5CFF", emphasis: true, img: "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/e9655d83e_generated_image.png" },
            ].map((item, i) => (
              <Reveal key={item.num} delay={i * 0.14} y={48} style={{ display: "flex" }}>
              <div style={{
                position: "relative",
                flex: 1,
                borderRadius: 24,
                overflow: "hidden",
                transition: "transform 0.4s ease, box-shadow 0.4s ease",
                cursor: "default",
                minHeight: 380,
                display: "flex",
                flexDirection: "column",
              }}
                onMouseOver={e => { e.currentTarget.style.transform = "translateY(-8px) scale(1.01)"; e.currentTarget.style.boxShadow = `0 30px 70px ${item.accent}25, 0 0 40px ${item.accent}10`; }}
                onMouseOut={e => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                {/* Full-bleed background image */}
                <img src={item.img} alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                {/* Dark cinematic overlay */}
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${item.accent}10 0%, rgba(11,15,26,0.55) 35%, rgba(11,15,26,0.92) 70%, rgba(11,15,26,0.98) 100%)` }} />
                {/* Side accent glow */}
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at top left, ${item.accent}18, transparent 50%)`, pointerEvents: "none" }} />
                {/* Top accent line */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${item.accent}, ${item.accent}40, transparent)` }} />

                {/* Content */}
                <div style={{ position: "relative", zIndex: 2, padding: "28px 26px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "flex-end" }}>
                  {/* Floating number badge */}
                  <div style={{
                    position: "absolute", top: 24, left: 26,
                    width: 58, height: 58, borderRadius: 16,
                    background: `rgba(11,15,26,0.75)`,
                    border: `2px solid ${item.accent}80`,
                    backdropFilter: "blur(16px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "Space Grotesk, sans-serif", fontWeight: 900, fontSize: 24,
                    color: item.accent,
                    boxShadow: `0 0 30px ${item.accent}50, inset 0 0 12px ${item.accent}15`,
                    textShadow: `0 0 12px ${item.accent}`,
                  }}>
                    {item.num}
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontFamily: "Space Grotesk, sans-serif", fontWeight: 800,
                    fontSize: 22, color: "#FFFFFF", marginBottom: 12,
                    lineHeight: 1.2, letterSpacing: "-0.01em",
                  }}>
                    {item.title}
                  </h3>

                  {/* Divider */}
                  <div style={{ width: 40, height: 2, background: `linear-gradient(90deg, ${item.accent}, transparent)`, borderRadius: 999, marginBottom: 14 }} />

                  {/* Body text */}
                  <p style={{
                    color: item.emphasis ? "#E8ECF2" : "#B8C0D0",
                    fontSize: 14,
                    fontFamily: "Inter, sans-serif",
                    lineHeight: 1.75,
                    fontWeight: 400,
                    margin: 0,
                  }}>
                    {item.text}
                  </p>
                </div>
              </div>
              </Reveal>
            ))}
          </div>

          {/* CTA */}
          <Reveal delay={0.2} style={{ textAlign: "center" }}>
            <Link to={createPageUrl("About")} style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              color: "#0B0F1A",
              background: "linear-gradient(135deg, #FFD000, #FFA500)",
              fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: 14,
              textDecoration: "none",
              borderRadius: 999, padding: "13px 28px",
              boxShadow: "0 0 30px rgba(255,208,0,0.35)",
              transition: "all 0.3s",
            }}
              onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 45px rgba(255,208,0,0.55)"; }}
              onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(255,208,0,0.35)"; }}
            >
              {t("learnMore")} <ArrowRight size={15} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════ VISION / PR. BLASIOUS — split layout, face visible ═══════════════════ */}
      <section id="vision-video-section" style={{ position: "relative", minHeight: "95vh", overflow: "hidden", background: "linear-gradient(180deg, #0B0F1A 0%, #120A05 50%, #0B0F1A 100%)" }}>
        {/* Background image — full bleed but heavily pushed right so text side stays clean */}
        <ParallaxLayer range={70} scaleRange={[1.06, 1]} style={{ position: "absolute", inset: -70 }}>
          <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/809a08e85_PrBlasiousRuguri-Onthecoach.png"
            alt="Pr. Blasious Ruguri" loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
        </ParallaxLayer>
        {/* Left-to-right dark-to-transparent gradient so left column is readable AND the subject's face (center) stays fully visible */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(11,15,26,0.96) 0%, rgba(11,15,26,0.88) 22%, rgba(11,15,26,0.3) 42%, rgba(11,15,26,0) 58%, rgba(11,15,26,0.1) 100%)" }} />
        {/* Warm lamp-light vignette on the right side */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 85% 40%, rgba(220,140,40,0.18) 0%, transparent 45%)" }} />
        {/* Top/bottom fades for smooth section transitions */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(11,15,26,0.5) 0%, transparent 12%, transparent 88%, rgba(11,15,26,0.7) 100%)" }} />

        <div style={{ position: "relative", zIndex: 2, maxWidth: 1280, margin: "0 auto", padding: "clamp(60px, 8vw, 110px) clamp(24px, 5vw, 70px)", display: "grid", gridTemplateColumns: "minmax(320px, 1fr) 1fr", gap: 40, alignItems: "center", minHeight: "95vh" }} className="vision-grid">
          {/* Left column — text block */}
          <Reveal y={44} duration={1} style={{ maxWidth: 520 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.3)", borderRadius: 999, padding: "6px 16px", marginBottom: 22, backdropFilter: "blur(10px)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00CFFF", boxShadow: "0 0 8px #00CFFF", display: "inline-block" }} />
              <span style={{ color: "#00CFFF", fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", fontFamily: "Space Grotesk, sans-serif", textTransform: "uppercase" }}>A Word From The Division President</span>
            </div>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(32px, 4.5vw, 56px)", lineHeight: 1, letterSpacing: "-0.03em", color: "#FFFFFF", marginBottom: 20 }}>
              {t("visionTitle").split(" ")[0]}{" "}
              <span style={{ background: "linear-gradient(90deg, #00CFFF, #8A5CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {t("visionTitle").split(" ").slice(1).join(" ")}
              </span>
            </h2>
            <div style={{ width: 52, height: 3, background: "linear-gradient(90deg, #FFD000, #00CFFF)", borderRadius: 999, marginBottom: 24 }} />
            <p style={{ color: "#D8E0EC", fontSize: 16, fontFamily: "Inter, sans-serif", lineHeight: 1.75, marginBottom: 32 }}>
              {t("visionText")}
            </p>

            {/* Speaker attribution — minimal inline caption, not a card */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
              <div style={{ width: 26, height: 1, background: "linear-gradient(90deg, #FFD000, transparent)" }} />
              <div>
                <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: 13, color: "#FFFFFF", letterSpacing: "0.01em" }}>Pr. Blasious Ruguri</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#FFD000", letterSpacing: "0.06em", textTransform: "uppercase", opacity: 0.9 }}>East-Central Africa Division President</div>
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <button onClick={() => toast("Video Coming Soon", { icon: "🎬", description: "The vision video is currently being produced. Stay tuned!" })} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,208,0,0.08)", border: "1px solid rgba(255,208,0,0.3)", borderRadius: 999, padding: "10px 22px 10px 14px", color: "#FFD000", fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 14, backdropFilter: "blur(12px)", cursor: "pointer", transition: "all 0.3s" }}
                onMouseOver={e => { e.currentTarget.style.background = "rgba(255,208,0,0.18)"; e.currentTarget.style.borderColor = "rgba(255,208,0,0.6)"; }}
                onMouseOut={e => { e.currentTarget.style.background = "rgba(255,208,0,0.08)"; e.currentTarget.style.borderColor = "rgba(255,208,0,0.3)"; }}
              >
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,208,0,0.15)", border: "1px solid rgba(255,208,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Play size={13} color="#FFD000" fill="#FFD000" style={{ marginLeft: 1 }} />
                </div>
                Watch the Vision
              </button>
              <Link to={createPageUrl("About")} style={{ color: "#C8D0E0", fontFamily: "Inter, sans-serif", fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, transition: "color 0.2s" }}
                onMouseOver={e => e.currentTarget.style.color = "#FFD000"}
                onMouseOut={e => e.currentTarget.style.color = "#C8D0E0"}
              >
                {t("readMore")} <ArrowRight size={13} />
              </Link>
            </div>
          </Reveal>

          {/* Right column — intentionally empty to preserve view of the subject */}
          <div />
        </div>

        <style>{`
          @media (max-width: 900px) {
            .vision-grid { grid-template-columns: 1fr !important; align-items: flex-end !important; padding-bottom: 40px !important; }
          }
        `}</style>
      </section>

      {/* ═══════════════════ STATS — floating glass cards ═══════════════════ */}
      <section ref={statsRef} style={{ padding: "clamp(80px, 10vw, 120px) clamp(20px, 5vw, 60px)", background: "linear-gradient(180deg, #0B0F1A 0%, #0D1220 100%)", position: "relative", overflow: "hidden" }}>
        {/* Background texture */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(0,207,255,0.06) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.2)", borderRadius: 999, padding: "6px 16px", marginBottom: 20 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFD000", boxShadow: "0 0 8px #FFD000", display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
              <span style={{ color: "#FFD000", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", fontFamily: "Space Grotesk, sans-serif", textTransform: "uppercase" }}>Our Vision</span>
            </div>
            <TextReveal
              segments={[{ text: "The Goal We're Chasing" }]}
              style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(30px, 4vw, 52px)", letterSpacing: "-0.02em", color: "#FFFFFF", marginBottom: 12 }}
            />
            <p style={{ color: "#8A9BB0", fontSize: 16, fontFamily: "Inter, sans-serif", maxWidth: 500, margin: "0 auto" }}>The bold targets driving Generation LightMode across the East-Central Africa Division.</p>
          </Reveal>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { value: 1000000, suffix: "+", label: "Youth to Mobilize (Goal)", icon: Users, color: "#00CFFF" },
              { value: 10000000, suffix: "+", label: "Peers to Reach (Goal)", icon: Users, color: "#FFD000" },
              { value: 12, suffix: "", label: "ECD Nations", icon: Globe, color: "#8A5CFF" },
              { value: 500, suffix: "+", label: "GlowGroups Target", icon: Star, color: "#1DA1FF" },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 0.12} y={40} style={{ flex: "1 1 200px", display: "flex" }}>
                <StatCard {...s} started={statsVisible} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Photographic bleed — congregation at dusk dissolving into the canvas */}
      <AtmosphericBleed src={CONGREGATION_BLEED} height={460} tint="rgba(255,208,0,0.08)" />

      {/* ═══════════════════ GALLERY — scrolling strips ═══════════════════ */}
      <div style={{ background: "#0B0F1A", padding: "24px 0 72px", overflow: "hidden" }}>
        <Reveal style={{ textAlign: "center", marginBottom: 36, padding: "0 24px" }}>
          <p style={{ color: "#8A9BB0", fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", fontFamily: "Space Grotesk, sans-serif", textTransform: "uppercase" }}>The Movement in Action</p>
        </Reveal>
        <ScrollingGallery images={galleryImages1} direction="left" speed="160s" />
        <div style={{ height: 14 }} />
        <ScrollingGallery images={galleryImages2} direction="right" speed="180s" />
      </div>

      {/* ═══════════════════ GLOW RANKS ═══════════════════ */}
      <section style={{ padding: "clamp(80px, 10vw, 120px) clamp(20px, 5vw, 60px)", background: "#0D1220", position: "relative", overflow: "hidden" }}>
        {/* Lightbulb pattern background */}
        <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/8f9bf2363_lightbulb-seamless-pattern-background-light-bulb-motif-wallpaper-idea-thinking-creative-electric-energy-solution-vector.jpg" alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.04, pointerEvents: "none", mixBlendMode: "screen" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 30%, #0D1220 75%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 100%, rgba(138,92,255,0.06) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,208,0,0.08)", border: "1px solid rgba(255,208,0,0.25)", borderRadius: 999, padding: "6px 16px", marginBottom: 20 }}>
              <span style={{ color: "#FFD000", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", fontFamily: "Space Grotesk, sans-serif", textTransform: "uppercase" }}>Recognition System</span>
            </div>
            <TextReveal
              segments={[{ text: "The 4 Glow Pins", gradient: GOLD_CYAN }]}
              style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(30px, 4vw, 52px)", letterSpacing: "-0.02em", marginBottom: 14 }}
            />
            <p style={{ color: "#8A9BB0", fontSize: 16, fontFamily: "Inter, sans-serif", maxWidth: 580, margin: "0 auto" }}>
              Just as Pathfinders earn honors and Literature Evangelists receive pins, LightMode missionaries are celebrated for their faith in action.
            </p>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 18 }}>
            {[
              { tier: "Bronze", label: "Starter Missionary", icon: "🥉", color: "#C77A2B", glow: "rgba(199,122,43,0.22)", milestone: "First 30 Glow Drops", requirement: "Complete the LightMode Pledge + post your first 30 Glow Drops" },
              { tier: "Silver", label: "Consistent Missionary", icon: "🥈", color: "#C7CEDB", glow: "rgba(199,206,219,0.18)", milestone: "60 Drops + 60 Talks", requirement: "Share 60 Glow Drops + 60 Real Light Talks in one month" },
              { tier: "Gold", label: "Multiplying Missionary", icon: "🥇", color: "#FFD000", glow: "rgba(255,208,0,0.22)", milestone: "Recruit 5 + GlowGroup", requirement: "Recruit 5 new youth + start or strengthen a GlowGroup" },
              { tier: "Platinum", label: "Ambassador Missionary", icon: "💎", color: "#A8C0FF", glow: "rgba(168,192,255,0.15)", milestone: "Mentor · Lead · Report", requirement: "Mentor others + lead a LightMode Challenge + submit Glow Logs" },
            ].map((item, idx) => (
              <Reveal key={item.tier} delay={idx * 0.1} y={44}>
              <div style={{
                background: "#0D1220",
                border: `1px solid ${item.color}35`, borderRadius: 20, padding: "32px 22px",
                textAlign: "center", position: "relative", overflow: "hidden",
                transition: "transform 0.3s, box-shadow 0.3s",
              }}
                onMouseOver={e => { e.currentTarget.style.transform = "translateY(-8px)"; e.currentTarget.style.boxShadow = `0 24px 60px ${item.glow}`; e.currentTarget.style.borderColor = `${item.color}55`; }}
                onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = `${item.color}35`; }}
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
              </Reveal>
            ))}
          </div>
          <p style={{ textAlign: "center", marginTop: 36, color: "#4A5568", fontSize: 13, fontFamily: "Inter, sans-serif", maxWidth: 520, margin: "36px auto 0" }}>
            Digital badges appear on your LightMode Dashboard profile as you level up. Physical pins are awarded at GlowGroup Bootcamps and the annual Switch On Summit.
          </p>
        </div>
      </section>

      {/* ═══════════════════ GLOBAL MAP ═══════════════════ */}
      <section style={{ background: "#0B0F1A", position: "relative" }}>
        <style>{`
          .leaflet-popup-content-wrapper { background: transparent; padding: 0; box-shadow: none; border-radius: 8px; }
          .leaflet-popup-tip { background: #121826; border: 1px solid rgba(0,207,255,0.4); }
        `}</style>

        <div style={{ position: "relative", zIndex: 10 }}>
          {/* Heading overlay — inside the map */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1000, textAlign: "center", padding: "clamp(32px, 5vw, 56px) 24px 0", pointerEvents: "none", background: "linear-gradient(180deg, rgba(11,15,26,0.85) 0%, rgba(11,15,26,0.4) 60%, transparent 100%)" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.2)", borderRadius: 999, padding: "6px 16px", marginBottom: 16, pointerEvents: "auto" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00CFFF", boxShadow: "0 0 8px #00CFFF", display: "inline-block" }} />
              <span style={{ color: "#00CFFF", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", fontFamily: "Space Grotesk, sans-serif", textTransform: "uppercase" }}>Real-Time Data</span>
            </div>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.02em", background: "linear-gradient(90deg, #00CFFF, #8A5CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: 10 }}>
              Global Light Map
            </h2>
            <p style={{ color: "#C8D0E0", fontSize: 15, fontFamily: "Inter, sans-serif", maxWidth: 500, margin: "0 auto", textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}>
              Real-time data showing where our members, GlowGroups, and Glow Drops are illuminating the world.
            </p>
          </div>

          {/* Stats panel */}
          <div style={{ position: "absolute", top: 20, right: 20, zIndex: 1000, background: "rgba(11,15,26,0.92)", backdropFilter: "blur(14px)", borderRadius: 16, padding: "16px 18px", border: "1px solid rgba(0,207,255,0.2)", minWidth: 180 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: "#00CFFF", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12, fontFamily: "Space Grotesk, sans-serif" }}>Live Statistics</div>
            {[
              { label: "Members", value: snapshot?.totalUsers || 0, color: "#00CFFF" },
              { label: "Countries", value: snapshot?.totalCountries || 0, color: "#FFD000" },
              { label: "GlowGroups", value: snapshot?.totalGroups || 0, color: "#8A5CFF" },
              { label: "Glow Drops", value: snapshot?.totalDrops || 0, color: "#1DA1FF" },
            ].map((stat, index, arr) => (
              <div key={stat.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: index === arr.length - 1 ? "none" : "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize: 11, color: "#8A9BB0", fontFamily: "Inter, sans-serif" }}>{stat.label}</span>
                <strong style={{ color: stat.color, fontFamily: "Space Grotesk, sans-serif", fontSize: 15 }}>{stat.value.toLocaleString()}</strong>
              </div>
            ))}
          </div>
          <div style={{ height: "85vh", minHeight: 550, width: "100%", background: "#080C14" }}>
            <MapContainer center={[5, 30]} zoom={3} scrollWheelZoom={false} zoomControl={false} style={{ height: "100%", width: "100%", background: "#0B0F1A" }}>
              <LocalWorldBasemap variant="dark" />
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

      {/* ═══════════════════ LIGHTMODE QUOTIENT QUIZ ═══════════════════ */}
      <LightModeQuotientQuiz />

      <div className="section-divider" />

      {/* ═══════════════════ DAILY TRUTH DROPS ═══════════════════ */}
      <DailyDropsSection />

      {/* Photographic bleed — candlelight before the pledge */}
      <AtmosphericBleed src={CANDLELIGHT_BLEED} height={400} tint="rgba(255,165,0,0.10)" />

      {/* ═══════════════════ PLEDGE CTA — immersive ═══════════════════ */}
      <section id="join" style={{ position: "relative", overflow: "hidden", padding: "clamp(80px, 12vw, 140px) clamp(20px, 6vw, 60px)" }}>
        {/* Hero-tone warm background — pledge imagery */}
        <ParallaxLayer range={80} scaleRange={[1.08, 1]} style={{ position: "absolute", inset: -80 }}>
          <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/72c5abed3_ChatGPTImageApr15202603_10_56PM.png" alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%", filter: "brightness(0.35) saturate(1.2)" }} />
        </ParallaxLayer>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(11,15,26,0.92) 0%, rgba(26,18,8,0.7) 40%, rgba(11,15,26,0.85) 80%, rgba(11,15,26,0.98) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 60%, rgba(255,165,0,0.12) 0%, transparent 55%)" }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
          <Reveal>
            <div style={{ fontSize: 56, marginBottom: 20, filter: "drop-shadow(0 0 20px rgba(255,208,0,0.5))" }}>✋</div>
          </Reveal>
          <TextReveal
            segments={[{ text: t("pledgeTitle").split(" ").slice(0, -1).join(" ") }, { text: t("pledgeTitle").split(" ").slice(-1).join(" "), gradient: GOLD_CYAN }]}
            style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 800, fontSize: "clamp(32px, 5vw, 60px)", letterSpacing: "-0.03em", color: "#FFFFFF", marginBottom: 20 }}
          />
          <Reveal delay={0.2}>
            <p style={{ color: "#C8D0E0", fontSize: 17, fontFamily: "Inter, sans-serif", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 48px" }}>
              {t("pledgeText")}
            </p>
          </Reveal>

          {/* Pledge items — clean card style */}
          <Reveal y={50} duration={1.1} style={{ background: "rgba(18,24,38,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "32px", marginBottom: 40, textAlign: "left" }}>
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
          </Reveal>

          <Reveal delay={0.15}>
          <button onClick={() => triggerSwitchOn("Feed")} style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "linear-gradient(135deg, #FFD000, #FFA500)",
            color: "#0B0F1A", fontFamily: "Space Grotesk, sans-serif", fontWeight: 800,
            fontSize: 18, padding: "18px 48px", borderRadius: 999, border: "none", cursor: "pointer",
            boxShadow: "0 0 40px rgba(255,208,0,0.5), 0 8px 30px rgba(0,0,0,0.4)",
            transition: "all 0.3s",
          }}
            onMouseOver={e => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = "0 0 60px rgba(255,208,0,0.7), 0 12px 40px rgba(0,0,0,0.4)"; }}
            onMouseOut={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(255,208,0,0.5), 0 8px 30px rgba(0,0,0,0.4)"; }}
          >
            <Zap size={20} /> {t("signPledge")}
          </button>
          <p style={{ color: "#4A5568", fontSize: 13, marginTop: 16, fontFamily: "Inter, sans-serif" }}>{t("freeToJoin")}</p>
          </Reveal>
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