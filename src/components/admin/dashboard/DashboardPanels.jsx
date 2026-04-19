import React from "react";
import { Heart, Eye, CheckCircle2, Flame, Trophy, Clock, ArrowUpRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/* ─── Engagement Panel ─────────────────────────────────────────────────── */
export function EngagementPanel({ engagementRate, avgLikes, approvedDrops, recentDrops, t, isDark }) {
  const items = [
    { label: "Engagement Rate", value: `${engagementRate}%`, icon: Eye, color: isDark ? "#00CFFF" : "#0B3FD9", pct: Math.min(parseFloat(engagementRate) || 0, 100) },
    { label: "Avg Likes / Drop", value: avgLikes, icon: Heart, color: isDark ? "#f43f5e" : "#e11d48", pct: Math.min((parseFloat(avgLikes) / 10) * 100, 100) },
    { label: "Approved Drops", value: approvedDrops, icon: CheckCircle2, color: isDark ? "#22c55e" : "#16a34a", pct: 75 },
    { label: "Weekly Activity", value: `${recentDrops}`, icon: Flame, color: isDark ? "#FFD000" : "#d97706", pct: Math.min((recentDrops / 20) * 100, 100) },
  ];

  return (
    <div className="rounded-[1.25rem] border overflow-hidden" style={{
      background: isDark ? t.surface : "#FFFFFF",
      borderColor: isDark ? t.border : "rgba(0,0,0,0.04)",
      boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.25)" : "0 4px 20px rgba(0,0,0,0.04)"
    }}>
      <div className="p-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Community Health</h3>
        </div>
        <p className="text-[10px]" style={{ color: t.textMuted }}>Real-time engagement metrics</p>
      </div>
      <div className="grid grid-cols-2">
        {items.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="p-4 border-t relative overflow-hidden group" style={{
              borderColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
              borderRight: i % 2 === 0 ? `1px solid ${isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"}` : "none"
            }}>
              {/* Progress bar at bottom */}
              <div className="absolute bottom-0 left-0 h-[3px] transition-all duration-700 rounded-r-full" style={{ width: `${m.pct}%`, background: m.color, opacity: 0.4 }} />
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{
                  background: `${m.color}10`,
                  border: `1px solid ${m.color}15`
                }}>
                  <Icon size={13} style={{ color: m.color }} />
                </div>
              </div>
              <p className="text-xl font-black font-['Space_Grotesk'] leading-none" style={{ color: t.textPrimary }}>{m.value}</p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] mt-1.5" style={{ color: t.textMuted }}>{m.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Top Performers ───────────────────────────────────────────────────── */
export function TopPerformersPanel({ performers, t, isDark }) {
  const medalStyles = [
    { bg: isDark ? "linear-gradient(135deg, rgba(255,208,0,0.15), rgba(255,159,26,0.08))" : "linear-gradient(135deg, #FFFBEB, #FEF3C7)", border: isDark ? "rgba(255,208,0,0.2)" : "#FDE68A", ring: "#FFD000" },
    { bg: isDark ? "linear-gradient(135deg, rgba(192,192,192,0.1), rgba(156,163,175,0.05))" : "linear-gradient(135deg, #F9FAFB, #F3F4F6)", border: isDark ? "rgba(192,192,192,0.15)" : "#E5E7EB", ring: "#9CA3AF" },
    { bg: isDark ? "linear-gradient(135deg, rgba(205,127,50,0.1), rgba(180,83,9,0.05))" : "linear-gradient(135deg, #FFF7ED, #FFEDD5)", border: isDark ? "rgba(205,127,50,0.15)" : "#FED7AA", ring: "#CD7F32" },
  ];
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="rounded-[1.25rem] border overflow-hidden" style={{
      background: isDark ? t.surface : "#FFFFFF",
      borderColor: isDark ? t.border : "rgba(0,0,0,0.04)",
      boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.25)" : "0 4px 20px rgba(0,0,0,0.04)"
    }}>
      <div className="p-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={14} style={{ color: isDark ? "#FFD000" : "#d97706" }} />
          <h3 className="text-sm font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Top Performers</h3>
        </div>
        <p className="text-[10px]" style={{ color: t.textMuted }}>Ranked by total likes received</p>
      </div>
      {performers.length === 0 ? (
        <p className="text-xs py-8 text-center" style={{ color: t.textMuted }}>No data yet</p>
      ) : (
        <div className="px-3 pb-3">
          {performers.map((p, i) => {
            const style = medalStyles[i] || {};
            return (
              <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5 mb-1 transition-all hover:scale-[1.01]" style={{
                background: i < 3 ? style.bg : "transparent",
                border: i < 3 ? `1px solid ${style.border}` : "1px solid transparent"
              }}>
                <span className="text-base w-7 text-center shrink-0">
                  {medals[i] || <span className="text-[11px] font-black" style={{ color: t.textMuted }}>#{i + 1}</span>}
                </span>
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0" style={{
                  border: i < 3 ? `2px solid ${style.ring}` : `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`
                }}>
                  <img src={p.avatar || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: t.textPrimary }}>{p.name}</p>
                  <p className="text-[9px]" style={{ color: t.textMuted }}>{p.drops} drops shared</p>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-black shrink-0" style={{ color: isDark ? "#f43f5e" : "#e11d48" }}>
                  <Heart size={11} fill="currentColor" /> {p.likes}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Recent Activity ──────────────────────────────────────────────────── */
export function RecentActivityPanel({ activity, t, isDark }) {
  return (
    <div className="rounded-[1.25rem] border overflow-hidden" style={{
      background: isDark ? t.surface : "#FFFFFF",
      borderColor: isDark ? t.border : "rgba(0,0,0,0.04)",
      boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.25)" : "0 4px 20px rgba(0,0,0,0.04)"
    }}>
      <div className="p-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Clock size={14} style={{ color: t.accent }} />
          <h3 className="text-sm font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Recent Activity</h3>
        </div>
        <p className="text-[10px]" style={{ color: t.textMuted }}>Latest community drops</p>
      </div>
      {activity.length === 0 ? (
        <p className="text-xs py-8 text-center" style={{ color: t.textMuted }}>No drops yet</p>
      ) : (
        <div className="px-4 pb-3 space-y-0.5">
          {activity.map((a, i) => (
            <div key={i} className="flex items-start gap-2.5 py-2.5 border-b last:border-0" style={{ borderColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }}>
              <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 mt-0.5" style={{
                border: `2px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`
              }}>
                <img src={a.avatar || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] leading-tight">
                  <span className="font-bold" style={{ color: t.textPrimary }}>{a.user}</span>
                  <span style={{ color: t.textMuted }}> shared a drop</span>
                </p>
                <p className="text-[10px] truncate mt-0.5 italic" style={{ color: t.textSecondary }}>"{a.verse || "—"}"</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[9px] font-medium" style={{ color: t.textMuted }}>{a.time ? formatDistanceToNow(new Date(a.time), { addSuffix: true }) : ""}</span>
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    a.status === "approved" ? (isDark ? "bg-green-500/10 text-green-400 ring-1 ring-green-500/20" : "bg-green-50 text-green-700 ring-1 ring-green-200")
                    : a.status === "rejected" ? (isDark ? "bg-red-500/10 text-red-400 ring-1 ring-red-500/20" : "bg-red-50 text-red-700 ring-1 ring-red-200")
                    : (isDark ? "bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20" : "bg-amber-50 text-amber-700 ring-1 ring-amber-200")
                  }`}>{a.status || "pending"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}