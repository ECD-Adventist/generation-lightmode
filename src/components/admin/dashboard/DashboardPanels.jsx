import React from "react";
import { Heart, Eye, CheckCircle2, Flame, Trophy, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/* ─── Engagement Card ──────────────────────────────────────────────────── */
export function EngagementPanel({ engagementRate, avgLikes, approvedDrops, recentDrops, t, isDark }) {
  const items = [
    { label: "Engagement Rate", value: `${engagementRate}%`, icon: Eye, color: isDark ? "#00CFFF" : "#0B3FD9" },
    { label: "Avg Likes / Drop", value: avgLikes, icon: Heart, color: isDark ? "#f43f5e" : "#e11d48" },
    { label: "Approved Drops", value: approvedDrops, icon: CheckCircle2, color: isDark ? "#22c55e" : "#16a34a" },
    { label: "Weekly Activity", value: `${recentDrops}`, icon: Flame, color: isDark ? "#FFD000" : "#d97706" },
  ];

  return (
    <div className="rounded-2xl border p-5" style={{ background: t.surface, borderColor: t.border }}>
      <h3 className="text-sm font-bold font-['Space_Grotesk'] mb-4" style={{ color: t.textPrimary }}>Community Health</h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="rounded-xl p-3 border" style={{ background: isDark ? "rgba(255,255,255,0.02)" : "#FAFBFF", borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ background: `${m.color}10` }}>
                <Icon size={14} style={{ color: m.color }} />
              </div>
              <p className="text-lg font-black font-['Space_Grotesk'] leading-none" style={{ color: t.textPrimary }}>{m.value}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wider mt-1" style={{ color: t.textMuted }}>{m.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Top Performers ───────────────────────────────────────────────────── */
export function TopPerformersPanel({ performers, t, isDark }) {
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="rounded-2xl border p-5" style={{ background: t.surface, borderColor: t.border }}>
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={14} style={{ color: isDark ? "#FFD000" : "#d97706" }} />
        <h3 className="text-sm font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Top Performers</h3>
      </div>
      {performers.length === 0 ? (
        <p className="text-xs py-4 text-center" style={{ color: t.textMuted }}>No data yet</p>
      ) : (
        <div className="space-y-2.5">
          {performers.map((p, i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-xl p-2 transition" style={{ background: i === 0 ? (isDark ? "rgba(255,208,0,0.06)" : "rgba(255,208,0,0.08)") : "transparent" }}>
              <span className="text-sm w-6 text-center">{medals[i] || <span className="text-[10px] font-bold" style={{ color: t.textMuted }}>{i + 1}</span>}</span>
              <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 ring-1" style={{ ringColor: t.border }}>
                <img src={p.avatar || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: t.textPrimary }}>{p.name}</p>
                <p className="text-[9px]" style={{ color: t.textMuted }}>{p.drops} drops</p>
              </div>
              <div className="flex items-center gap-0.5 text-[10px] font-black" style={{ color: isDark ? "#f43f5e" : "#e11d48" }}>
                <Heart size={10} /> {p.likes}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Recent Activity ──────────────────────────────────────────────────── */
export function RecentActivityPanel({ activity, t, isDark }) {
  return (
    <div className="rounded-2xl border p-5" style={{ background: t.surface, borderColor: t.border }}>
      <div className="flex items-center gap-2 mb-4">
        <Clock size={14} style={{ color: t.accent }} />
        <h3 className="text-sm font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Recent Activity</h3>
      </div>
      {activity.length === 0 ? (
        <p className="text-xs py-4 text-center" style={{ color: t.textMuted }}>No drops yet</p>
      ) : (
        <div className="space-y-3">
          {activity.map((a, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 mt-0.5 ring-1" style={{ ringColor: t.border }}>
                <img src={a.avatar || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] leading-tight">
                  <span className="font-bold" style={{ color: t.textPrimary }}>{a.user}</span>
                  <span style={{ color: t.textMuted }}> shared a drop</span>
                </p>
                <p className="text-[10px] truncate mt-0.5 italic" style={{ color: t.textSecondary }}>"{a.verse || "—"}"</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px]" style={{ color: t.textMuted }}>{a.time ? formatDistanceToNow(new Date(a.time), { addSuffix: true }) : ""}</span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                    a.status === "approved" ? (isDark ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-700 ring-1 ring-green-200")
                    : a.status === "rejected" ? (isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-700 ring-1 ring-red-200")
                    : (isDark ? "bg-yellow-500/10 text-yellow-400" : "bg-amber-50 text-amber-700 ring-1 ring-amber-200")
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