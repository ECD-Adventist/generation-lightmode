import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, Play, Zap, Sparkles, ChevronRight, Globe, Users, Star, X, Menu, Bell } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import DailyDropsSection from "@/components/home/DailyDropsSection";
import LightModeQuotientQuiz from "@/components/home/LightModeQuotientQuiz";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { countryCoordinates } from "@/lib/countryCoordinates";
import "leaflet/dist/leaflet.css";

/**
 * Mobile-only landing page — LightMode branded.
 * Hero-first, thumb-friendly, high-touch layout for mobile users.
 * All content parity with desktop Home, redesigned for mobile.
 */
export default function MobileHome({ t, triggerSwitchOn, liveCountries, galleryImages }) {
  const [showVideo, setShowVideo] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(isAuth => {
      if (isAuth) base44.auth.me().then(me => setUserEmail(me?.email));
    });
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.2 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  const totalMembers = liveCountries.reduce((s, c) => s + (c.users || 0), 0);
  const totalDrops = liveCountries.reduce((s, c) => s + (c.drops || 0), 0);
  const totalGroups = liveCountries.reduce((s, c) => s + (c.groups || 0), 0);

  return (
    <div className="font-['Inter'] relative overflow-hidden" style={{ background: "#0B0F1A", color: "#FFFFFF" }}>
      <style>{`
        @keyframes mh-float { 0%,100% { transform: translateY(0) scale(1); opacity: 0.25 } 50% { transform: translateY(-14px) scale(1.08); opacity: 0.45 } }
        @keyframes mh-breathe { 0%,100% { filter: brightness(1); transform: scale(1); } 50% { filter: brightness(1.1); transform: scale(1.02); } }
        @keyframes mh-pulse-dot { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.5); opacity: 0.55 } }
        @keyframes mh-scroll-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes mh-scroll-right { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        @keyframes mh-shimmer { 0% { transform: translateX(-100%) skewX(-20deg); } 100% { transform: translateX(200%) skewX(-20deg); } }
        .mh-hide-sb::-webkit-scrollbar { display: none; }
        .mh-hide-sb { scrollbar-width: none; }
      `}</style>

      {/* ═══════ TOP BAR — floats over hero ═══════ */}
      <div className="fixed top-0 left-0 right-0 z-[80] safe-pt" style={{ background: "linear-gradient(180deg, rgba(11,15,26,0.85) 0%, rgba(11,15,26,0) 100%)", backdropFilter: "blur(16px)" }}>
        <div className="flex items-center justify-between px-4 py-2.5">
          <Link to={createPageUrl("Home")} className="flex items-center">
            <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png" alt="LightMode" style={{ height: 36, filter: "drop-shadow(0 0 8px rgba(0,207,255,0.5))" }} />
          </Link>
          <div className="flex items-center gap-2">
            {userEmail && (
              <Link to={createPageUrl("Notifications")} className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF" }}>
                <Bell className="w-4 h-4" />
              </Link>
            )}
            <button onClick={() => setMenuOpen(true)} className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95" style={{ background: "rgba(0,207,255,0.12)", border: "1px solid rgba(0,207,255,0.3)", color: "#00CFFF" }}>
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══════ MOBILE MENU DRAWER ═══════ */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100] flex" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(11,15,26,0.85)", backdropFilter: "blur(14px)" }} />
          <div onClick={e => e.stopPropagation()} className="relative ml-auto w-[85%] max-w-sm h-full overflow-y-auto safe-pt safe-pb" style={{ background: "linear-gradient(180deg, #121826 0%, #0B0F1A 100%)", borderLeft: "1px solid rgba(0,207,255,0.2)" }}>
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "#00CFFF" }}>Menu</div>
              <button onClick={() => setMenuOpen(false)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)", color: "#FFFFFF" }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-2 space-y-1">
              {[
                { label: "About", page: "About" },
                { label: "Impact", page: "Impact" },
                { label: "Assistant", page: "Assistant" },
                { label: "Keep It 100", page: "KeepIt100", emoji: "💯" },
                { label: "Codes of Truth", page: "CodesOfTruth", emoji: "🔐" },
                { label: "Resources", page: "Resources", emoji: "🌍" },
              ].map(item => (
                <Link key={item.page} to={createPageUrl(item.page)} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl active:scale-[0.98] transition" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#E0E8F0" }}>
                  {item.emoji && <span className="text-lg">{item.emoji}</span>}
                  <span className="text-sm font-bold flex-1">{item.label}</span>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </Link>
              ))}
            </div>
            <div className="px-4 pt-4">
              <button onClick={() => { setMenuOpen(false); triggerSwitchOn("Feed"); }} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-black text-sm font-['Space_Grotesk']" style={{ background: "linear-gradient(135deg, #FFD000, #FFA500)", color: "#0B0F1A", boxShadow: "0 8px 28px rgba(255,208,0,0.4)" }}>
                <Zap className="w-4 h-4" /> Switch It On
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ HERO — image extends behind top bar ═══════ */}
      <section className="relative min-h-[100dvh] flex flex-col justify-end overflow-hidden">
        <img
          src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/72c5abed3_ChatGPTImageApr15202603_10_56PM.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "center top", animation: "mh-breathe 7s ease-in-out infinite" }}
        />
        {/* Subtle top wash — keeps logo readable without darkening image */}
        <div className="absolute inset-x-0 top-0 h-[140px] pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(11,15,26,0.55) 0%, rgba(11,15,26,0.2) 60%, rgba(11,15,26,0) 100%)" }} />
        {/* Bottom gradient — only enough to keep text legible near the bottom */}
        <div className="absolute inset-x-0 bottom-0 h-[55%] pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(11,15,26,0) 0%, rgba(11,15,26,0.55) 55%, rgba(11,15,26,0.96) 100%)" }} />
        {/* Warm vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 110%, rgba(255,165,0,0.18) 0%, transparent 55%)" }} />

        {/* Content — bottom anchored, compact so hero image remains dominant */}
        <div className="relative z-10 px-5 pb-7 safe-pb">
          <h1 className="font-['Space_Grotesk'] font-black text-[30px] leading-[1.08] tracking-tight mb-3">
            {t("heroTitleBefore")}{" "}
            <span style={{ background: "linear-gradient(135deg, #FFD000 0%, #00CFFF 55%, #8A5CFF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {t("heroTitleHighlight")}
            </span>
            {" "}{t("heroTitleAfter")}
          </h1>

          <p className="text-[13px] leading-relaxed mb-4" style={{ color: "#E0E8F0" }}>
            Join 10M+ believers turning hidden faith into visible light.
          </p>

          {/* Primary CTA */}
          <button
            onClick={() => triggerSwitchOn("Feed")}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-black text-[15px] font-['Space_Grotesk'] mb-2.5 active:scale-[0.98] transition relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #FFD000, #FFA500)", color: "#0B0F1A", boxShadow: "0 10px 36px rgba(255,208,0,0.45), 0 4px 16px rgba(0,0,0,0.4)" }}
          >
            <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "40%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)", animation: "mh-shimmer 3s infinite ease-in-out" }} />
            <Zap className="w-4 h-4 relative" /> <span className="relative">{t("switchOn") || "Switch It On"}</span>
          </button>

          {/* Secondary CTAs row */}
          <div className="flex gap-2">
            <button
              onClick={() => document.getElementById("mh-quiz")?.scrollIntoView({ behavior: "smooth" })}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full font-bold text-[12px] active:scale-95 transition"
              style={{ background: "rgba(0,207,255,0.12)", color: "#FFFFFF", border: "1px solid rgba(0,207,255,0.4)", backdropFilter: "blur(10px)" }}
            >
              <Sparkles className="w-3.5 h-3.5" /> Take Quiz
            </button>
            <button
              onClick={() => document.getElementById("mh-vision")?.scrollIntoView({ behavior: "smooth" })}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full font-bold text-[12px] active:scale-95 transition"
              style={{ background: "rgba(255,255,255,0.08)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}
            >
              <Play className="w-3 h-3" fill="currentColor" /> Vision
            </button>
          </div>
        </div>
      </section>

      {/* ═══════ WHY LIGHTMODE EXISTS ═══════ */}
      <section className="relative overflow-hidden py-14 px-5" style={{ background: "radial-gradient(ellipse at 20% 30%, #1A1208 0%, #0B0F1A 55%)" }}>
        <div className="absolute -top-20 -left-10 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,208,0,0.15)", animation: "mh-float 10s ease-in-out infinite" }} />
        <div className="absolute -bottom-20 -right-10 w-72 h-72 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(0,207,255,0.12)", animation: "mh-float 12s ease-in-out infinite 2s" }} />

        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(255,208,0,0.1)", border: "1px solid rgba(255,208,0,0.3)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FFD000", boxShadow: "0 0 8px #FFD000" }} />
            <span className="text-[9.5px] font-black uppercase tracking-[0.15em]" style={{ color: "#FFD000" }}>Why It Matters</span>
          </div>

          <h2 className="font-['Space_Grotesk'] font-black text-[32px] leading-[1.05] tracking-tight mb-3">
            {t("whyTitleBefore") || "The world changed."}{" "}
            <span style={{ background: "linear-gradient(90deg, #FFD000 0%, #00CFFF 60%, #8A5CFF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {t("whyTitleHighlight") || "Faith must respond."}
            </span>
          </h2>

          {t("whySubtitle") && (
            <p className="italic text-[14px] mb-8" style={{ color: "#FFD000", textShadow: "0 0 16px rgba(255,208,0,0.25)" }}>
              {t("whySubtitle")}
            </p>
          )}

          {/* Insight cards — stacked, thumb-scrollable */}
          <div className="space-y-4 mb-6">
            {[
              { num: "01", title: "The New Mission Field", text: t("whyText1"), accent: "#FFD000", img: "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c98eb0914_generated_image.png" },
              { num: "02", title: "A Generation Online", text: t("whyText2"), accent: "#00CFFF", img: "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/0b76b2e6f_generated_image.png" },
              { num: "03", title: "A Bold Response", text: t("whyText3"), accent: "#8A5CFF", img: "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/e9655d83e_generated_image.png" },
            ].map(item => (
              <div key={item.num} className="relative rounded-3xl overflow-hidden" style={{ minHeight: 300, border: `1px solid ${item.accent}30` }}>
                <img src={item.img} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${item.accent}10 0%, rgba(11,15,26,0.6) 40%, rgba(11,15,26,0.95) 100%)` }} />
                <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${item.accent}, transparent)` }} />

                <div className="relative p-5 flex flex-col h-full justify-end" style={{ minHeight: 300 }}>
                  <div className="absolute top-4 left-4 w-12 h-12 rounded-xl flex items-center justify-center font-['Space_Grotesk'] font-black text-[18px]" style={{ background: "rgba(11,15,26,0.8)", border: `1.5px solid ${item.accent}70`, color: item.accent, backdropFilter: "blur(10px)", boxShadow: `0 0 20px ${item.accent}40` }}>
                    {item.num}
                  </div>
                  <h3 className="font-['Space_Grotesk'] font-black text-[20px] leading-tight mb-2 text-white">{item.title}</h3>
                  <div className="w-10 h-0.5 rounded-full mb-3" style={{ background: `linear-gradient(90deg, ${item.accent}, transparent)` }} />
                  <p className="text-[13px] leading-relaxed" style={{ color: "#C8D0E0" }}>{item.text}</p>
                </div>
              </div>
            ))}
          </div>

          <Link to={createPageUrl("About")} className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full font-black text-[14px] font-['Space_Grotesk'] no-underline active:scale-[0.98] transition" style={{ background: "linear-gradient(135deg, #FFD000, #FFA500)", color: "#0B0F1A", boxShadow: "0 8px 28px rgba(255,208,0,0.35)" }}>
            {t("learnMore") || "Learn More"} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ═══════ VISION — Pr. Blasious ═══════ */}
      <section id="mh-vision" className="relative overflow-hidden">
        <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/809a08e85_PrBlasiousRuguri-Onthecoach.png" alt="" className="w-full h-[60vh] object-cover" style={{ objectPosition: "center top" }} loading="lazy" />
        <div className="absolute top-0 left-0 right-0 h-[60vh] pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(11,15,26,0.5) 0%, rgba(11,15,26,0) 30%, rgba(11,15,26,0.6) 85%, #0B0F1A 100%)" }} />

        <div className="relative px-5 py-10 -mt-20 z-10" style={{ background: "linear-gradient(180deg, transparent 0%, #0B0F1A 15%)" }}>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(0,207,255,0.12)", border: "1px solid rgba(0,207,255,0.35)", backdropFilter: "blur(10px)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#00CFFF", boxShadow: "0 0 8px #00CFFF" }} />
            <span className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: "#00CFFF" }}>Division President</span>
          </div>

          <h2 className="font-['Space_Grotesk'] font-black text-[30px] leading-[1.05] tracking-tight mb-4">
            {t("visionTitle")?.split(" ")[0] || "A"}{" "}
            <span style={{ background: "linear-gradient(90deg, #00CFFF, #8A5CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {t("visionTitle")?.split(" ").slice(1).join(" ") || "Vision Word"}
            </span>
          </h2>

          <div className="w-12 h-1 rounded-full mb-4" style={{ background: "linear-gradient(90deg, #FFD000, #00CFFF)" }} />

          <p className="text-[14px] leading-relaxed mb-5" style={{ color: "#D8E0EC" }}>{t("visionText")}</p>

          <div className="flex items-center gap-3 mb-6 pb-5 border-b" style={{ borderColor: "rgba(255,208,0,0.15)" }}>
            <div className="w-12 h-0.5 rounded-full" style={{ background: "linear-gradient(90deg, #FFD000, transparent)" }} />
            <div>
              <div className="font-['Space_Grotesk'] font-bold text-[13px] text-white">Pr. Blasious Ruguri</div>
              <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "#FFD000" }}>ECD President</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => toast("Video Coming Soon", { icon: "🎬", description: "The vision video is being produced." })} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-bold text-[13px] active:scale-95" style={{ background: "rgba(255,208,0,0.1)", border: "1px solid rgba(255,208,0,0.35)", color: "#FFD000", backdropFilter: "blur(10px)" }}>
              <Play className="w-3.5 h-3.5" fill="currentColor" /> Watch Vision
            </button>
            <Link to={createPageUrl("About")} className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-full font-bold text-[13px] no-underline active:scale-95" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#C8D0E0" }}>
              Read More <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ LIVE STATS ═══════ */}
      <section ref={statsRef} className="relative overflow-hidden py-12 px-5" style={{ background: "linear-gradient(180deg, #0B0F1A 0%, #0D1220 100%)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,207,255,0.08) 0%, transparent 60%)" }} />

        <div className="relative text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-3" style={{ background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.25)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#00CFFF", animation: "mh-pulse-dot 2s ease-in-out infinite" }} />
            <span className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: "#00CFFF" }}>Live Impact</span>
          </div>
          <h2 className="font-['Space_Grotesk'] font-black text-[28px] leading-tight mb-2 text-white">{t("statsTitle") || "Movement At A Glance"}</h2>
          <p className="text-[13px]" style={{ color: "#8A9BB0" }}>{t("statsSubtitle")}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 1000000, suffix: "+", label: "Youth to Mobilize", icon: Users, color: "#00CFFF" },
            { value: 10000000, suffix: "+", label: "Peers to Reach", icon: Users, color: "#FFD000" },
            { value: 12, suffix: "", label: "ECD Nations", icon: Globe, color: "#8A5CFF" },
            { value: 500, suffix: "+", label: "GlowGroups", icon: Star, color: "#1DA1FF" },
          ].map(s => <MobileStatCard key={s.label} {...s} started={statsVisible} />)}
        </div>
      </section>

      {/* ═══════ GALLERY ═══════ */}
      <section className="py-10" style={{ background: "#080C14" }}>
        <div className="text-center mb-5 px-5">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] font-['Space_Grotesk']" style={{ color: "#8A9BB0" }}>The Movement in Action</p>
        </div>
        <MobileGalleryRow images={galleryImages.slice(0, 7)} direction="left" />
        <div className="h-3" />
        <MobileGalleryRow images={galleryImages.slice(7, 14)} direction="right" />
      </section>

      {/* ═══════ GLOW PINS ═══════ */}
      <section className="py-12 px-5 relative overflow-hidden" style={{ background: "#0D1220" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(138,92,255,0.08) 0%, transparent 55%)" }} />

        <div className="relative text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-3" style={{ background: "rgba(255,208,0,0.1)", border: "1px solid rgba(255,208,0,0.3)" }}>
            <span className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: "#FFD000" }}>Recognition</span>
          </div>
          <h2 className="font-['Space_Grotesk'] font-black text-[28px] leading-tight mb-2" style={{ background: "linear-gradient(90deg, #FFD000, #00CFFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            The 4 Glow Pins
          </h2>
          <p className="text-[13px]" style={{ color: "#8A9BB0" }}>
            LightMode missionaries celebrated for faith in action.
          </p>
        </div>

        <div className="space-y-3">
          {[
            { tier: "Bronze", label: "Starter Missionary", icon: "🥉", color: "#C77A2B", milestone: "First 30 Glow Drops", requirement: "Complete the LightMode Pledge + post your first 30 Glow Drops" },
            { tier: "Silver", label: "Consistent Missionary", icon: "🥈", color: "#C7CEDB", milestone: "60 Drops + 60 Talks", requirement: "Share 60 Glow Drops + 60 Real Light Talks in one month" },
            { tier: "Gold", label: "Multiplying Missionary", icon: "🥇", color: "#FFD000", milestone: "Recruit 5 + GlowGroup", requirement: "Recruit 5 new youth + start a GlowGroup" },
            { tier: "Platinum", label: "Ambassador", icon: "💎", color: "#A8C0FF", milestone: "Mentor · Lead · Report", requirement: "Mentor others + lead a Challenge + submit Glow Logs" },
          ].map((item, idx) => (
            <div key={item.tier} className="rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden" style={{ background: "#0D1220", border: `1px solid ${item.color}35` }}>
              <div className="absolute top-0 left-[20%] right-[20%] h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${item.color}, transparent)` }} />
              <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 text-2xl" style={{ background: `radial-gradient(circle, ${item.color}20, rgba(8,12,20,0.9))`, border: `1.5px solid ${item.color}40`, boxShadow: `0 0 20px ${item.color}25` }}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <h3 className="font-['Space_Grotesk'] font-black text-[16px] text-white">{item.tier}</h3>
                  <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: item.color }}>Tier {idx + 1}</span>
                </div>
                <div className="text-[11px] font-bold mb-1.5" style={{ color: item.color }}>{item.label}</div>
                <div className="inline-block text-[9px] font-black px-2 py-0.5 rounded-full mb-1" style={{ background: `${item.color}15`, color: item.color, border: `1px solid ${item.color}30` }}>
                  {item.milestone}
                </div>
                <p className="text-[11px] leading-snug" style={{ color: "#8A9BB0" }}>{item.requirement}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-[11px] mt-5" style={{ color: "#4A5568" }}>
          Digital badges on your LightMode Dashboard. Physical pins awarded at GlowGroup Bootcamps.
        </p>
      </section>

      {/* ═══════ GLOBAL MAP — interactive Leaflet ═══════ */}
      <section className="pt-12 pb-10" style={{ background: "#0B0F1A" }}>
        <style>{`
          .mh-map-wrap .leaflet-popup-content-wrapper { background: transparent; padding: 0; box-shadow: none; border-radius: 8px; }
          .mh-map-wrap .leaflet-popup-tip { background: #121826; border: 1px solid rgba(0,207,255,0.4); }
          .mh-map-wrap .leaflet-control-attribution { display: none !important; }
        `}</style>

        <div className="text-center mb-5 px-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-3" style={{ background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.25)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#00CFFF", animation: "mh-pulse-dot 2s ease-in-out infinite" }} />
            <span className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: "#00CFFF" }}>Real-Time Data</span>
          </div>
          <h2 className="font-['Space_Grotesk'] font-black text-[28px] leading-tight mb-2" style={{ background: "linear-gradient(90deg, #00CFFF, #8A5CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Global Light Map
          </h2>
          <p className="text-[13px]" style={{ color: "#C8D0E0" }}>
            Where our members illuminate the world.
          </p>
        </div>

        {/* Stats grid */}
        <div className="px-5 grid grid-cols-2 gap-2.5 mb-4">
          {[
            { label: "Members", value: totalMembers, color: "#00CFFF" },
            { label: "Countries", value: liveCountries.length, color: "#FFD000" },
            { label: "GlowGroups", value: totalGroups, color: "#8A5CFF" },
            { label: "Glow Drops", value: totalDrops, color: "#1DA1FF" },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3" style={{ background: "rgba(18,24,38,0.7)", border: `1px solid ${s.color}25`, backdropFilter: "blur(12px)" }}>
              <div className="text-[9px] font-black uppercase tracking-wider mb-1" style={{ color: "#8A9BB0" }}>{s.label}</div>
              <div className="font-['Space_Grotesk'] font-black text-[20px]" style={{ color: s.color }}>{s.value.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* Interactive Leaflet map */}
        <div className="mh-map-wrap relative" style={{ height: "60vh", minHeight: 400, width: "100%", background: "#080C14", borderTop: "1px solid rgba(0,207,255,0.15)", borderBottom: "1px solid rgba(0,207,255,0.15)" }}>
          <MapContainer center={[5, 30]} zoom={3} scrollWheelZoom={false} zoomControl={false} style={{ height: "100%", width: "100%", background: "#0B0F1A" }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" attribution="&copy; CartoDB" />
            {liveCountries.filter(loc => countryCoordinates[loc.country]).flatMap((loc, i) => {
              const coordinates = countryCoordinates[loc.country];
              const color = i % 3 === 0 ? "#00CFFF" : i % 3 === 1 ? "#FFD000" : "#8A5CFF";
              const totalActivity = (loc.users || 0) + (loc.drops || 0) * 0.3 + (loc.groups || 0) * 2;
              const outerR = Math.min(45, Math.max(14, totalActivity * 1.2 + 12));
              const innerR = Math.min(10, Math.max(6, (loc.users || 0) * 0.4 + 6));
              return [
                <CircleMarker key={`outer-${i}`} center={coordinates} radius={outerR} pathOptions={{ color: "transparent", fillColor: color, fillOpacity: 0.15 }} />,
                <CircleMarker key={`inner-${i}`} center={coordinates} radius={innerR} pathOptions={{ color, fillColor: "#FFF", fillOpacity: 0.95, weight: 2 }}>
                  <Popup>
                    <div style={{ background: "rgba(18,24,38,0.96)", backdropFilter: "blur(12px)", padding: "12px", borderRadius: "10px", border: `1px solid ${color}60`, color: "#FFF", minWidth: "160px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />
                        <h4 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "13px", color, margin: 0, fontWeight: 700 }}>{loc.country}</h4>
                      </div>
                      {[["Members", (loc.users || 0).toLocaleString()], ["Groups", loc.groups || 0], ["Drops", loc.drops || 0]].map(([lbl, val], idx, arr) => (
                        <div key={lbl} style={{ display: "flex", justifyContent: "space-between", borderBottom: idx === arr.length - 1 ? "none" : "1px solid rgba(255,255,255,0.06)", paddingBottom: "5px", marginBottom: "5px" }}>
                          <span style={{ fontSize: "11px", color: "#8A9BB0", fontFamily: "Inter, sans-serif" }}>{lbl}</span>
                          <strong style={{ color: "#FFF", fontFamily: "Space Grotesk, sans-serif", fontSize: "12px" }}>{val}</strong>
                        </div>
                      ))}
                    </div>
                  </Popup>
                </CircleMarker>
              ];
            })}
          </MapContainer>
        </div>

        {liveCountries.length > 0 && (
          <div className="px-5 mt-6 space-y-2">
            <div className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: "#8A9BB0" }}>Top Countries</div>
            {liveCountries.slice(0, 5).map((loc, i) => {
              const color = i % 3 === 0 ? "#00CFFF" : i % 3 === 1 ? "#FFD000" : "#8A5CFF";
              return (
                <div key={loc.country} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "rgba(18,24,38,0.6)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-[11px] font-['Space_Grotesk']" style={{ background: `${color}15`, color, border: `1px solid ${color}40` }}>{i + 1}</div>
                  <div className="flex-1 font-bold text-[13px] text-white">{loc.country}</div>
                  <div className="text-[11px] font-black" style={{ color }}>{(loc.users || 0).toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══════ QUIZ ═══════ */}
      <div id="mh-quiz">
        <LightModeQuotientQuiz />
      </div>

      {/* ═══════ DAILY DROPS ═══════ */}
      <DailyDropsSection />

      {/* ═══════ PLEDGE CTA ═══════ */}
      <section className="relative overflow-hidden py-14 px-5">
        <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/72c5abed3_ChatGPTImageApr15202603_10_56PM.png" alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: "brightness(0.32) saturate(1.1)" }} loading="lazy" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(11,15,26,0.92) 0%, rgba(26,18,8,0.75) 40%, rgba(11,15,26,0.95) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(255,165,0,0.14) 0%, transparent 55%)" }} />

        <div className="relative text-center">
          <div className="text-5xl mb-3" style={{ filter: "drop-shadow(0 0 16px rgba(255,208,0,0.5))" }}>✋</div>
          <h2 className="font-['Space_Grotesk'] font-black text-[30px] leading-[1.05] tracking-tight mb-3 text-white">
            {t("pledgeTitle")?.split(" ").slice(0, -1).join(" ") || "Sign The"}{" "}
            <span style={{ background: "linear-gradient(90deg, #FFD000, #00CFFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {t("pledgeTitle")?.split(" ").slice(-1) || "Pledge"}
            </span>
          </h2>
          <p className="text-[14px] leading-relaxed mb-6" style={{ color: "#C8D0E0" }}>
            {t("pledgeText")}
          </p>

          <div className="rounded-2xl p-5 mb-6 text-left" style={{ background: "rgba(18,24,38,0.65)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(14px)" }}>
            <p className="text-[13px] italic mb-3" style={{ color: "#C8D0E0" }}>"As a member of Generation LightMode, I pledge to:</p>
            <div className="space-y-2.5">
              {[
                ["LIVE VISIBLY", "Keep my faith always on."],
                ["SHINE BOLDLY", "Glow for Christ in every post."],
                ["SPEAK TRUTH", "Share God's love with courage."],
                ["WALK WITH PURPOSE", "Reflect Jesus' light."],
                ["IGNITE OTHERS", "Guide seekers to the Light."],
              ].map(([title, text], i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <span className="font-['Space_Grotesk'] font-black text-[11px] shrink-0 pt-0.5" style={{ color: "#00CFFF", minWidth: 16 }}>{i + 1}.</span>
                  <p className="text-[12.5px] leading-relaxed m-0" style={{ color: "#C8D0E0" }}>
                    <strong className="text-white">{title}</strong> → {text}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-[12.5px] font-['Space_Grotesk'] font-black text-center mt-4" style={{ color: "#FFD000", textShadow: "0 0 12px rgba(255,208,0,0.4)" }}>
              My light will not dim. I am Generation LightMode."
            </p>
          </div>

          <button onClick={() => triggerSwitchOn("Feed")} className="w-full flex items-center justify-center gap-2 py-4 rounded-full font-black text-[15px] font-['Space_Grotesk'] active:scale-[0.98] transition" style={{ background: "linear-gradient(135deg, #FFD000, #FFA500)", color: "#0B0F1A", boxShadow: "0 10px 36px rgba(255,208,0,0.5)" }}>
            <Zap className="w-4 h-4" /> {t("signPledge") || "Sign Pledge"}
          </button>
          <p className="text-[11px] mt-3" style={{ color: "#4A5568" }}>{t("freeToJoin") || "Free to join forever."}</p>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="py-8 px-5 safe-pb" style={{ background: "#080C14", borderTop: "1px solid rgba(0,207,255,0.1)" }}>
        <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png" alt="" style={{ height: 40, marginBottom: 14, filter: "drop-shadow(0 0 8px rgba(0,207,255,0.4))" }} />
        <p className="text-[12px] leading-relaxed mb-4" style={{ color: "#C8D0E0" }}>
          {t("footerText") || "Where faith meets action."} <strong style={{ color: "#FFD000" }}>Faith. Always On.</strong>
        </p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            ["About", "About"], ["Impact", "Impact"],
            ["Challenges", "Challenges"], ["GlowGroups", "GlowGroups"],
            ["Keep It 100", "KeepIt100"], ["Codes of Truth", "CodesOfTruth"],
            ["Assistant", "Assistant"], ["Resources", "Resources"],
          ].map(([label, page]) => (
            <Link key={page} to={createPageUrl(page)} className="text-[12px] font-semibold no-underline" style={{ color: "#C8D0E0" }}>{label}</Link>
          ))}
        </div>
        <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <span className="text-[10px]" style={{ color: "#C8D0E0" }}>© 2026 LightMode</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#00CFFF", boxShadow: "0 0 8px #00CFFF" }} />
            <span className="text-[10px]" style={{ color: "#C8D0E0" }}>{t("poweredBy") || "Powered by ECD"}</span>
          </div>
        </div>
      </footer>

      {/* Video modal */}
      {showVideo && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(11,15,26,0.96)", backdropFilter: "blur(12px)" }}>
          <button onClick={() => setShowVideo(false)} className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.15)" }}>
            <X className="w-5 h-5" />
          </button>
          <div className="w-full aspect-video rounded-2xl overflow-hidden" style={{ background: "#000", border: "1px solid rgba(0,207,255,0.3)" }}>
            <iframe width="100%" height="100%" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Vision" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        </div>
      )}
    </div>
  );
}

function MobileStatCard({ value, suffix, label, icon: Icon, color, started }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / 2200, 1);
      setCount(Math.floor(p * value));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, started]);
  return (
    <div className="rounded-2xl p-4 text-center relative overflow-hidden" style={{ background: "rgba(18,24,38,0.7)", border: `1px solid ${color}25`, backdropFilter: "blur(12px)" }}>
      <div className="absolute top-0 left-[20%] right-[20%] h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />
      <Icon size={22} color={color} className="mx-auto mb-2" style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
      <div className="font-['Space_Grotesk'] font-black text-[22px] leading-none" style={{ color }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-[10px] mt-1.5 font-semibold" style={{ color: "#8A9BB0" }}>{label}</div>
    </div>
  );
}

function MobileGalleryRow({ images, direction }) {
  const isLeft = direction === "left";
  return (
    <div className="overflow-hidden w-full">
      <div className="flex gap-2.5 w-max" style={{ animation: `mh-scroll-${isLeft ? "left" : "right"} 80s linear infinite` }}>
        {[...images, ...images].map((src, i) => (
          <img key={i} src={src} alt="" loading="lazy" className="w-[200px] h-[140px] object-cover rounded-xl shrink-0" style={{ border: "1px solid rgba(255,208,0,0.12)", filter: "grayscale(15%) brightness(0.9)" }} />
        ))}
      </div>
    </div>
  );
}