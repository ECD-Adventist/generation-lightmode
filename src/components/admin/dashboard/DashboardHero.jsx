import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Zap, Send, Calendar } from "lucide-react";

export default function DashboardHero({ user, pendingDrops, pendingTerritories, t, isDark }) {
  const firstName = user?.full_name?.split(" ")[0] || "Admin";
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="relative rounded-3xl overflow-hidden p-6 md:p-8" style={{
      background: isDark
        ? "linear-gradient(135deg, #0D1B3E 0%, #162044 40%, #1A1040 100%)"
        : "linear-gradient(135deg, #EEF4FF 0%, #E8EDFF 40%, #F0E6FF 100%)",
      border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(11,63,217,0.08)"}`,
    }}>
      {/* Decorative orbs */}
      <div className="absolute top-[-60px] right-[-40px] w-[200px] h-[200px] rounded-full blur-[80px] pointer-events-none" style={{ background: isDark ? "rgba(0,207,255,0.15)" : "rgba(11,63,217,0.1)" }} />
      <div className="absolute bottom-[-40px] left-[20%] w-[160px] h-[160px] rounded-full blur-[70px] pointer-events-none" style={{ background: isDark ? "rgba(138,92,255,0.12)" : "rgba(138,92,255,0.08)" }} />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={14} style={{ color: t.textMuted }} />
            <span className="text-xs font-medium" style={{ color: t.textMuted }}>{dateStr}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black font-['Space_Grotesk'] tracking-tight" style={{ color: t.textPrimary }}>
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: t.textSecondary }}>
            Here's your movement overview.
            {(pendingDrops > 0 || pendingTerritories > 0) && (
              <span className="ml-1 font-semibold" style={{ color: isDark ? "#FFD000" : "#d97706" }}>
                {pendingDrops + pendingTerritories} items need attention.
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {pendingDrops > 0 && (
            <Link to={`${createPageUrl("AdminCenter")}?tab=drops`} className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all hover:scale-[1.02] shadow-sm" style={{
              background: isDark ? "rgba(255,208,0,0.15)" : "#FEF3C7",
              color: isDark ? "#FFD000" : "#92400E",
              border: `1px solid ${isDark ? "rgba(255,208,0,0.25)" : "#FDE68A"}`
            }}>
              <Zap size={14} /> {pendingDrops} Pending
            </Link>
          )}
          <Link to={`${createPageUrl("AdminCenter")}?tab=notifications`} className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all hover:scale-[1.02] shadow-sm" style={{
            background: isDark ? "rgba(0,207,255,0.12)" : "rgba(11,63,217,0.08)",
            color: isDark ? "#00CFFF" : "#0B3FD9",
            border: `1px solid ${isDark ? "rgba(0,207,255,0.2)" : "rgba(11,63,217,0.12)"}`
          }}>
            <Send size={14} /> Broadcast
          </Link>
        </div>
      </div>
    </div>
  );
}