import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, Zap, Sparkles, Radio, Globe2, Heart, Flame, Target, Menu, X, Bell, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MobileSiteFooter from "@/components/site/MobileSiteFooter";

/**
 * Mobile-only About page — branded LightMode (royal blue, cyan, gold).
 * High-touch, immersive, thumb-friendly redesign.
 */
export default function MobileAbout({ t, joinNowText, liveImpactStats }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then((isAuth) => {
      if (isAuth) base44.auth.me().then(setUser).catch(() => {});
    });
  }, []);

  const values = [
    { icon: "💡", title: "Live Visibly", text: "Unashamed, unhidden. Faith that shows up online and off.", color: "#FFD000" },
    { icon: "🔥", title: "Shine Boldly", text: "Glow for Christ in every post, story, and conversation.", color: "#00CFFF" },
    { icon: "🗣️", title: "Speak Truth", text: "Share God's love with courage and compassion.", color: "#8A5CFF" },
    { icon: "🚀", title: "Walk With Purpose", text: "Let your digital life reflect Jesus' light.", color: "#1DA1FF" },
    { icon: "⚡", title: "Ignite Others", text: "Encourage believers and guide seekers to the Light.", color: "#FF9F1A" },
  ];

  return (
    <div className="min-h-[100dvh] font-['Inter'] overflow-x-hidden w-full max-w-full" style={{ background: "#0B0F1A", color: "#FFFFFF" }}>
      <style>{`
        @keyframes ma-float { 0%,100% { transform: translateY(0) scale(1); opacity: 0.22 } 50% { transform: translateY(-18px) scale(1.08); opacity: 0.42 } }
        @keyframes ma-shimmer { 0% { transform: translateX(-150%) skewX(-20deg); } 100% { transform: translateX(260%) skewX(-20deg); } }
        @keyframes ma-pulse-dot { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.4); opacity: 0.6 } }
        @keyframes ma-breathe { 0%,100% { filter: brightness(1); transform: scale(1); } 50% { filter: brightness(1.08); transform: scale(1.015); } }
        .ma-hide-sb::-webkit-scrollbar { display: none; }
        .ma-hide-sb { scrollbar-width: none; }
      `}</style>

      {/* ═══ TOP BAR — glassy, floats over hero ═══ */}
      <div className="fixed top-0 left-0 right-0 z-50 safe-pt px-4 pb-2" style={{ background: "linear-gradient(180deg, rgba(11,15,26,0.55) 0%, rgba(11,15,26,0) 100%)" }}>
        <div className="flex items-center justify-between pt-2">
          <Link to={createPageUrl("Home")} className="active:scale-95 transition">
            <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png" alt="" className="h-8 w-auto object-contain" style={{ filter: "drop-shadow(0 0 10px rgba(0,207,255,0.5))" }} />
          </Link>
          <div className="flex items-center gap-2">
            {user && (
              <Link to={createPageUrl("Notifications")} className="w-11 h-11 rounded-xl flex items-center justify-center backdrop-blur-md active:scale-95 transition" style={{ background: "rgba(255,255,255,0.08)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.12)" }}>
                <Bell className="w-[18px] h-[18px]" />
              </Link>
            )}
            <button onClick={() => setMenuOpen(true)} className="w-11 h-11 rounded-xl flex items-center justify-center backdrop-blur-md active:scale-95 transition" style={{ background: "rgba(255,255,255,0.08)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.12)" }}>
              <Menu className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══ HERO — full-bleed behind the top bar ═══ */}
      <section className="relative min-h-[100dvh] flex flex-col justify-end overflow-hidden">
        <img
          src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/389dfd11b_group-people-are-sitting-ground-one-them-reads-book.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "center center", animation: "ma-breathe 8s ease-in-out infinite" }}
        />
        {/* Soft top wash so logo is readable without darkening subjects */}
        <div className="absolute inset-x-0 top-0 h-[140px] pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(11,15,26,0.55) 0%, rgba(11,15,26,0) 100%)" }} />
        {/* Bottom gradient for text — stronger for readability */}
        <div className="absolute inset-x-0 bottom-0 h-[70%] pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(11,15,26,0) 0%, rgba(11,15,26,0.75) 45%, rgba(11,15,26,0.98) 100%)" }} />
        {/* Warm vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 105%, rgba(255,165,0,0.18) 0%, transparent 55%)" }} />

        <div className="relative z-10 px-5 pb-7 safe-pb" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(0,207,255,0.18)", border: "1px solid rgba(0,207,255,0.5)", backdropFilter: "blur(10px)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#00CFFF", animation: "ma-pulse-dot 2s ease-in-out infinite" }} />
            <span className="text-[9.5px] font-black uppercase tracking-[0.18em]" style={{ color: "#00CFFF" }}>{t("storyBadge") || "Our Story"}</span>
          </div>

          <h1 className="font-['Space_Grotesk'] font-black text-[32px] leading-[1.05] tracking-tight mb-3" style={{ textShadow: "0 3px 16px rgba(0,0,0,0.75)" }}>
            {t("heroTitleBefore")}{" "}
            <span style={{ background: "linear-gradient(135deg, #FFD000 0%, #00CFFF 55%, #8A5CFF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", filter: "drop-shadow(0 2px 10px rgba(0,207,255,0.35))" }}>
              {t("heroTitleHighlight")}
            </span>
          </h1>

          <p className="text-[14px] leading-relaxed mb-5 font-medium" style={{ color: "#F0F4FA", textShadow: "0 2px 10px rgba(0,0,0,0.7)" }}>
            {t("heroText")} <strong style={{ color: "#FFD000" }}>Faith. Always On.</strong>
          </p>

          <a href={createPageUrl("Dashboard")} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-black text-[15px] font-['Space_Grotesk'] mb-2.5 active:scale-[0.98] transition relative overflow-hidden no-underline" style={{ background: "linear-gradient(135deg, #FFD000, #FFA500)", color: "#0B0F1A", boxShadow: "0 10px 36px rgba(255,208,0,0.45), 0 4px 16px rgba(0,0,0,0.4)" }}>
            <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "40%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)", animation: "ma-shimmer 3s infinite ease-in-out" }} />
            <Zap className="w-4 h-4 relative" /> <span className="relative">{joinNowText}</span>
          </a>

          <Link to={createPageUrl("Challenges")} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-full font-bold text-[12.5px] active:scale-95 transition no-underline" style={{ background: "rgba(0,207,255,0.12)", color: "#FFFFFF", border: "1px solid rgba(0,207,255,0.4)", backdropFilter: "blur(10px)" }}>
            {t("seeChallenges")} <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <div className="flex items-center gap-2 pt-4 mt-4 border-t" style={{ borderColor: "rgba(255,208,0,0.15)" }}>
            <span className="text-[10px] italic truncate" style={{ color: "rgba(200,208,224,0.75)" }}>
              "Let your light shine before others." — Matthew 5:16
            </span>
          </div>
        </div>
      </section>

      {/* ═══ MISSION ═══ */}
      <section className="relative px-5 py-14 overflow-hidden" style={{ background: "linear-gradient(180deg, #0B0F1A 0%, #120A05 50%, #0B0F1A 100%)" }}>
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full blur-3xl pointer-events-none" style={{ background: "#FFA500", opacity: 0.14, animation: "ma-float 9s ease-in-out infinite" }} />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.28)" }}>
            <Radio className="w-3 h-3" style={{ color: "#00CFFF" }} />
            <span className="text-[9.5px] font-black uppercase tracking-[0.14em]" style={{ color: "#00CFFF" }}>{t("missionTitle") || "Our Mission"}</span>
          </div>
          <h2 className="font-['Space_Grotesk'] font-black text-[28px] leading-[1.1] tracking-tight mb-3">
            A Digital Movement Built For{" "}
            <span style={{ background: "linear-gradient(90deg, #FFD000, #00CFFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              This Generation
            </span>
          </h2>
          <div className="w-12 h-[3px] rounded-full mb-4" style={{ background: "linear-gradient(90deg, #FFD000, #00CFFF)" }} />
          <p className="text-[14px] leading-[1.75] mb-4" style={{ color: "#D8E0EC" }}>{t("missionText1")}</p>
          <p className="text-[13.5px] leading-[1.7] mb-6" style={{ color: "#B0BAC8" }}>{t("missionText2")}</p>

          {/* Live stats */}
          <div className="grid grid-cols-3 gap-3">
            {liveImpactStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl p-3 text-center" style={{ background: "rgba(18,24,38,0.7)", border: `1px solid ${stat.color}25`, backdropFilter: "blur(10px)" }}>
                <div className="font-['Space_Grotesk'] font-black text-[22px] leading-none mb-1.5" style={{ color: stat.color }}>{(stat.value || 0).toLocaleString()}</div>
                <div className="text-[9px] font-black uppercase tracking-[0.06em]" style={{ color: "#8A9BB0" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ VISION CARDS — vertical stack ═══ */}
      <section className="relative px-5 py-14" style={{ background: "#0B0F1A" }}>
        <div className="absolute top-[10%] right-[-15%] w-[300px] h-[300px] rounded-full blur-[100px] pointer-events-none" style={{ background: "#8A5CFF", opacity: 0.08 }} />
        <div className="absolute bottom-[-5%] left-[-15%] w-[340px] h-[340px] rounded-full blur-[110px] pointer-events-none" style={{ background: "#FFD000", opacity: 0.06 }} />

        <div className="relative text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-3" style={{ background: "rgba(255,208,0,0.08)", border: "1px solid rgba(255,208,0,0.25)" }}>
            <Globe2 className="w-3 h-3" style={{ color: "#FFD000" }} />
            <span className="text-[9.5px] font-black uppercase tracking-[0.14em]" style={{ color: "#FFD000" }}>{t("vision") || "Vision"}</span>
          </div>
          <h2 className="font-['Space_Grotesk'] font-black text-[28px] leading-tight">
            Where We're{" "}
            <span style={{ background: "linear-gradient(90deg, #FFD000, #00CFFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Going</span>
          </h2>
        </div>

        <div className="space-y-4 relative">
          {[
            { img: "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/8a30f4210_happy-friends-taking-selfiecopy.jpg", badge: "01 — Vision", title: "Known For Light, Not Silence", text: t("visionText1"), color: "#00CFFF" },
            { img: "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/3474ac78b_business-people-having-online-meeting.jpg", badge: "02 — Community", title: "Faith Communities Thriving Online", text: t("visionText2"), color: "#8A5CFF" },
          ].map((card) => (
            <div key={card.badge} className="relative rounded-[1.5rem] overflow-hidden" style={{ minHeight: 340 }}>
              <img src={card.img} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${card.color}10 0%, rgba(11,15,26,0.45) 40%, rgba(11,15,26,0.96) 100%)` }} />
              <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${card.color}, transparent)` }} />
              <div className="relative z-10 h-full flex flex-col justify-end p-5" style={{ minHeight: 340 }}>
                <div className="inline-block self-start rounded-full px-2.5 py-1 mb-3 text-[9px] font-black uppercase tracking-[0.1em]" style={{ background: `${card.color}15`, color: card.color, border: `1px solid ${card.color}35` }}>{card.badge}</div>
                <h3 className="font-['Space_Grotesk'] font-black text-[20px] text-white leading-tight mb-2">{card.title}</h3>
                <p className="text-[13px] leading-[1.7]" style={{ color: "#B0BAC8" }}>{card.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ VALUES — pledge items ═══ */}
      <section className="px-5 py-14" style={{ background: "linear-gradient(180deg, #0B0F1A 0%, #0D1220 100%)" }}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-3" style={{ background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.25)" }}>
            <Sparkles className="w-3 h-3" style={{ color: "#00CFFF" }} />
            <span className="text-[9.5px] font-black uppercase tracking-[0.14em]" style={{ color: "#00CFFF" }}>Our Values</span>
          </div>
          <h2 className="font-['Space_Grotesk'] font-black text-[28px] leading-tight">
            Five Things{" "}
            <span style={{ background: "linear-gradient(90deg, #00CFFF, #8A5CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>We Live By</span>
          </h2>
        </div>

        <div className="space-y-3">
          {values.map((v, i) => (
            <div key={v.title} className="flex items-start gap-3 rounded-2xl p-4" style={{ background: "rgba(18,24,38,0.7)", border: `1px solid ${v.color}25`, backdropFilter: "blur(10px)" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-[20px]" style={{ background: `${v.color}15`, border: `1px solid ${v.color}35`, boxShadow: `0 0 20px ${v.color}25` }}>{v.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black font-['Space_Grotesk']" style={{ color: v.color }}>0{i + 1}</span>
                  <h3 className="font-['Space_Grotesk'] font-black text-[15px] text-white">{v.title}</h3>
                </div>
                <p className="text-[12.5px] leading-[1.6]" style={{ color: "#B0BAC8" }}>{v.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="relative overflow-hidden px-5 py-16">
        <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/72c5abed3_ChatGPTImageApr15202603_10_56PM.png" alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: "center 30%", filter: "brightness(0.3) saturate(1.2)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(11,15,26,0.92) 0%, rgba(26,18,8,0.7) 40%, rgba(11,15,26,0.88) 80%, rgba(11,15,26,0.98) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(255,165,0,0.14) 0%, transparent 55%)" }} />

        <div className="relative z-10 text-center">
          <div className="text-[48px] mb-3" style={{ filter: "drop-shadow(0 0 20px rgba(255,208,0,0.5))" }}>⚡</div>
          <h2 className="font-['Space_Grotesk'] font-black text-[30px] leading-[1.05] tracking-tight mb-3">
            {t("storyTitle")?.split(" ").slice(0, -1).join(" ")}{" "}
            <span style={{ background: "linear-gradient(90deg, #FFD000, #00CFFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {t("storyTitle")?.split(" ").slice(-1)}
            </span>
          </h2>
          <p className="text-[13.5px] leading-[1.7] mb-6" style={{ color: "#C8D0E0" }}>{t("storyText")}</p>

          <a href={createPageUrl("Dashboard")} className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-full font-black text-[15px] font-['Space_Grotesk'] mb-3 active:scale-[0.98] transition relative overflow-hidden no-underline" style={{ background: "linear-gradient(135deg, #FFD000, #FFA500)", color: "#0B0F1A", boxShadow: "0 10px 40px rgba(255,208,0,0.5), 0 8px 30px rgba(0,0,0,0.4)" }}>
            <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "40%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)", animation: "ma-shimmer 3s infinite ease-in-out" }} />
            <Zap className="w-4 h-4 relative" /> <span className="relative">{joinNowText}</span>
          </a>
          <Link to={createPageUrl("Challenges")} className="w-full inline-flex items-center justify-center gap-1.5 py-3 rounded-full font-bold text-[12.5px] no-underline active:scale-95 transition" style={{ background: "rgba(255,255,255,0.05)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}>
            {t("seeChallenges")} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <MobileSiteFooter t={t} />

      {/* ═══ MOBILE MENU DRAWER ═══ */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100]" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 backdrop-blur-md" style={{ background: "rgba(11,15,26,0.7)" }} />
          <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-0 bottom-0 w-[82%] max-w-[340px] p-5 safe-pt safe-pb overflow-y-auto" style={{ background: "linear-gradient(180deg, #0D1220 0%, #0B0F1A 100%)", borderLeft: "1px solid rgba(0,207,255,0.15)" }}>
            <div className="flex items-center justify-between mb-6">
              <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png" alt="" className="h-8 w-auto object-contain" />
              <button onClick={() => setMenuOpen(false)} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <X className="w-5 h-5" style={{ color: "#FFFFFF" }} />
              </button>
            </div>

            <nav className="space-y-1">
              {[
                { label: "Home", to: "Home" },
                { label: "About", to: "About" },
                { label: "Impact", to: "Impact" },
                { label: "Assistant", to: "Assistant" },
                { label: "Keep It 100", to: "KeepIt100" },
                { label: "Codes of Truth", to: "CodesOfTruth" },
                { label: "Resources", to: "Resources" },
              ].map((l) => (
                <Link key={l.to} to={createPageUrl(l.to)} onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-xl text-[14px] font-semibold no-underline active:scale-95 transition" style={{ color: "#E0E8F0", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="mt-6">
              {user ? (
                <Link to={createPageUrl("Feed")} onClick={() => setMenuOpen(false)} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-black text-[13.5px] font-['Space_Grotesk'] no-underline active:scale-95 transition" style={{ background: "linear-gradient(135deg, #FFD000, #FFA500)", color: "#0B0F1A", boxShadow: "0 6px 24px rgba(255,208,0,0.35)" }}>
                  <Zap className="w-4 h-4" /> Go to Feed
                </Link>
              ) : (
                <a href={createPageUrl("Dashboard")} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-black text-[13.5px] font-['Space_Grotesk'] no-underline active:scale-95 transition" style={{ background: "linear-gradient(135deg, #FFD000, #FFA500)", color: "#0B0F1A", boxShadow: "0 6px 24px rgba(255,208,0,0.35)" }}>
                  <Zap className="w-4 h-4" /> {joinNowText}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}