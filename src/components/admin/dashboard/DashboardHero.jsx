import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap, Send, Calendar, ArrowRight, Shield } from "lucide-react";

export default function DashboardHero({ user, pendingDrops, pendingTerritories, t, isDark }) {
  const firstName = user?.full_name?.split(" ")[0] || "Admin";
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const totalPending = pendingDrops + pendingTerritories;

  return (
    <div className="glm-hero-banner relative rounded-[1.75rem] overflow-hidden p-[2px]">
      <style>{`
        /* Spinning gradient border (same as "Switch It On" button) */
        @keyframes glm-hero-spin {
          0%   { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes glm-hero-sweep {
          0%   { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(300%) skewX(-20deg); }
        }
        .glm-hero-banner::before {
          content: '';
          position: absolute;
          top: 50%; left: 50%;
          width: 200%; height: 600%;
          background: conic-gradient(from 0deg, transparent 55%, #5AC8FF 68%, #1FB8FF 78%, #0B3FD9 88%, #FFD60A 95%, transparent 100%);
          animation: glm-hero-spin 8s linear infinite;
          z-index: 0;
          pointer-events: none;
          opacity: ${isDark ? 0.95 : 0.75};
        }
        .glm-hero-inner {
          position: relative;
          z-index: 2;
          border-radius: calc(1.75rem - 2px);
          overflow: hidden;
        }
        /* Sweep shimmer */
        .glm-hero-inner::after {
          content: '';
          position: absolute;
          top: 0; bottom: 0; left: 0;
          width: 30%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,${isDark ? 0.04 : 0.18}), transparent);
          animation: glm-hero-sweep 6s infinite ease-in-out;
          pointer-events: none;
          z-index: 3;
        }
      `}</style>
      <div className="glm-hero-inner">
      {/* Animated mesh gradient background — Feed-inspired deep navy/royal-blue */}
      <div className="absolute inset-0" style={{
        background: isDark
          ? "linear-gradient(135deg, #060B18 0%, #0B1226 25%, #0F1730 50%, #0A1F4A 75%, #060B18 100%)"
          : "linear-gradient(135deg, #EBF1FF 0%, #E3EAFF 25%, #EDE5FF 50%, #F0ECFF 75%, #EBF1FF 100%)"
      }} />

      {/* Hero image — same image from website Home hero, now much more visible */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "url('https://media.base44.com/images/public/69a6fca6155ae283f1b55144/72c5abed3_ChatGPTImageApr15202603_10_56PM.png')",
        backgroundSize: "cover",
        backgroundPosition: "center 30%",
        filter: isDark ? "grayscale(40%) contrast(1.15) brightness(0.95)" : "grayscale(20%) contrast(1.08) saturate(1.1)",
        opacity: isDark ? 0.55 : 0.72,
        mixBlendMode: isDark ? "luminosity" : "normal",
      }} />
      {/* Gradient fade from left — subtler so the image shows through the right side */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: isDark
          ? "linear-gradient(90deg, rgba(6,11,24,0.9) 0%, rgba(6,11,24,0.6) 45%, rgba(6,11,24,0.15) 100%)"
          : "linear-gradient(90deg, rgba(244,248,255,0.94) 0%, rgba(244,248,255,0.62) 45%, rgba(244,248,255,0.08) 100%)",
      }} />

      {/* Animated orbs — Feed's sky→royal-blue + gold */}
      <div className="absolute top-[-80px] right-[-60px] w-[280px] h-[280px] rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ background: isDark ? "rgba(31,184,255,0.18)" : "rgba(11,63,217,0.08)", animationDuration: "4s" }} />
      <div className="absolute bottom-[-60px] left-[10%] w-[220px] h-[220px] rounded-full blur-[90px] pointer-events-none animate-pulse" style={{ background: isDark ? "rgba(11,63,217,0.16)" : "rgba(138,92,255,0.06)", animationDuration: "6s" }} />
      <div className="absolute top-[30%] left-[60%] w-[150px] h-[150px] rounded-full blur-[70px] pointer-events-none animate-pulse" style={{ background: isDark ? "rgba(255,214,10,0.08)" : "rgba(255,159,26,0.04)", animationDuration: "5s" }} />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"} 1px, transparent 1px)`,
        backgroundSize: "40px 40px"
      }} />

      <div className="relative z-10 p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm" style={{
                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(11,63,217,0.08)"}`
              }}>
                <Calendar size={12} style={{ color: t.textMuted }} />
                <span className="text-[11px] font-medium" style={{ color: t.textSecondary }}>{dateStr}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full" style={{
                background: isDark ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.08)",
                border: `1px solid ${isDark ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.15)"}`
              }}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Live</span>
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black font-['Space_Grotesk'] tracking-tight leading-tight" style={{ color: t.textPrimary }}>
              {greeting},{" "}
              <span style={{
                backgroundImage: isDark ? "linear-gradient(135deg, #5AC8FF 0%, #1FB8FF 50%, #0B3FD9 100%)" : "linear-gradient(135deg, #1FB8FF 0%, #0B3FD9 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
                display: "inline",
              }}>{firstName || "Admin"}</span>
            </h1>
            <p className="text-sm mt-2 max-w-md leading-relaxed" style={{ color: t.textSecondary }}>
              Your movement command center is ready. Monitor engagement, manage content, and grow the community.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            {totalPending > 0 && (
              <Link to={`${createPageUrl("AdminCenter")}?tab=drops`} className="group relative flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition-all hover:scale-[1.02] overflow-hidden" style={{
                background: isDark ? "linear-gradient(135deg, rgba(255,214,10,0.18), rgba(255,159,26,0.12))" : "linear-gradient(135deg, #FEF3C7, #FDE68A)",
                color: isDark ? "#FFD60A" : "#92400E",
                border: `1px solid ${isDark ? "rgba(255,214,10,0.3)" : "#FCD34D"}`,
                boxShadow: isDark ? "0 4px 20px rgba(255,214,10,0.15)" : "0 4px 16px rgba(255,159,26,0.15)"
              }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: isDark ? "rgba(255,214,10,0.22)" : "rgba(217,119,6,0.12)" }}>
                  <Shield size={14} />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider opacity-70">Needs Review</div>
                  <div className="font-black">{totalPending} Pending</div>
                </div>
                <ArrowRight size={14} className="ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
            <Link to={`${createPageUrl("AdminCenter")}?tab=notifications`} className="group flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition-all hover:scale-[1.02] backdrop-blur-sm" style={{
              background: isDark ? "linear-gradient(135deg, rgba(31,184,255,0.15), rgba(11,63,217,0.1))" : "rgba(11,63,217,0.06)",
              color: isDark ? "#5AC8FF" : "#0B3FD9",
              border: `1px solid ${isDark ? "rgba(31,184,255,0.3)" : "rgba(11,63,217,0.1)"}`,
              boxShadow: isDark ? "0 4px 20px rgba(31,184,255,0.12)" : "0 4px 16px rgba(11,63,217,0.08)"
            }}>
              <Send size={14} />
              <span>Broadcast</span>
              <ArrowRight size={14} className="ml-0.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}