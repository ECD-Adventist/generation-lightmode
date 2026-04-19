import React from "react";
import { Heart, Eye, CheckCircle2, Flame, Trophy, Clock, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AnimatedNumber } from "./useCountUp";

/* ─── Animated Progress Bar ────────────────────────────────────────────── */
function AnimatedBar({ percent, color, delay = 0 }) {
  return (
    <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: `${color}10` }}>
      <div className="absolute inset-y-0 left-0 rounded-full"
        style={{
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          width: "0%",
          animation: `bar-grow 1.4s cubic-bezier(0.22,1,0.36,1) ${delay}ms forwards`,
          "--target-width": `${Math.min(percent, 100)}%`,
        }} />
      <style>{`@keyframes bar-grow { to { width: var(--target-width); } }`}</style>
    </div>
  );
}

/* ─── Donut Ring (for the Community Health overview) ───────────────────── */
function DonutRing({ percent, color, size = 80, strokeWidth = 7, delay = 0 }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(percent, 100) / 100) * circ;
  const gradId = `donut-${color.replace("#", "")}`;

  return (
    <svg width={size} height={size}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${color}10`} strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gradId})`} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={circ} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{
          animation: `donut-draw 1.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms forwards`,
          "--final": offset,
        }} />
      <style>{`@keyframes donut-draw { to { stroke-dashoffset: var(--final); } }`}</style>
    </svg>
  );
}

/* ─── Panel shell ──────────────────────────────────────────────────────── */
function PanelShell({ title, subtitle, icon: Icon, iconColor, t, isDark, children, delay = 0 }) {
  return (
    <div className="rounded-[1.5rem] border overflow-hidden relative group" style={{
      background: isDark ? t.surface : "#FFFFFF",
      borderColor: isDark ? t.border : "rgba(0,0,0,0.04)",
      boxShadow: isDark ? "0 8px 28px rgba(0,0,0,0.3)" : "0 8px 28px rgba(15,23,42,0.06)",
      animation: `panel-fade 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`,
    }}>
      <style>{`@keyframes panel-fade { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      {/* Top gradient hairline */}
      <div className="h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${iconColor}, transparent)` }} />

      <div className="p-5 pb-3 relative">
        {/* Subtle glow */}
        <div className="absolute top-0 right-0 w-[120px] h-[120px] rounded-full blur-[60px] opacity-30 pointer-events-none" style={{ background: iconColor }} />
        <div className="relative flex items-center gap-2.5 mb-1">
          {Icon && (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
              background: `${iconColor}12`, border: `1px solid ${iconColor}20`
            }}>
              <Icon size={14} style={{ color: iconColor }} />
            </div>
          )}
          <div>
            <h3 className="text-[14px] font-bold font-['Space_Grotesk'] tracking-tight" style={{ color: t.textPrimary }}>{title}</h3>
            <p className="text-[10px]" style={{ color: t.textMuted }}>{subtitle}</p>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ─── Engagement / Community Health ────────────────────────────────────── */
export function EngagementPanel({ engagementRate, avgLikes, approvedDrops, recentDrops, t, isDark }) {
  const engagePct = Math.min(parseFloat(engagementRate) || 0, 100);
  const mainColor = isDark ? "#00CFFF" : "#0B3FD9";

  const items = [
    { label: "Avg Likes", value: avgLikes, icon: Heart, color: isDark ? "#f43f5e" : "#e11d48", pct: Math.min((parseFloat(avgLikes) / 10) * 100, 100), decimals: 1 },
    { label: "Approved", value: approvedDrops, icon: CheckCircle2, color: isDark ? "#22c55e" : "#16a34a", pct: 75 },
    { label: "This Week", value: recentDrops, icon: Flame, color: isDark ? "#FFD000" : "#d97706", pct: Math.min((recentDrops / 20) * 100, 100) },
  ];

  return (
    <PanelShell title="Community Health" subtitle="Real-time engagement" icon={Eye} iconColor={mainColor} t={t} isDark={isDark} delay={0}>
      {/* Hero: donut ring + big engagement rate */}
      <div className="px-5 pb-4 flex items-center gap-4">
        <div className="relative shrink-0">
          <DonutRing percent={engagePct} color={mainColor} size={86} strokeWidth={7} delay={200} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-lg font-black font-['Space_Grotesk'] leading-none" style={{ color: t.textPrimary }}>
              <AnimatedNumber value={parseFloat(engagementRate) || 0} duration={1600} decimals={1} suffix="%" />
            </p>
            <p className="text-[8px] font-bold uppercase tracking-wider mt-0.5" style={{ color: t.textMuted }}>Rate</p>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.14em] font-bold" style={{ color: t.textMuted }}>Engagement</p>
          <p className="text-[11px] mt-1 leading-snug" style={{ color: t.textSecondary }}>
            Drops per user ratio — a pulse on how actively your community creates.
          </p>
        </div>
      </div>

      {/* Mini metrics */}
      <div className="grid grid-cols-3 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}>
        {items.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="p-3.5 relative" style={{
              borderRight: i < 2 ? `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` : "none"
            }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Icon size={11} style={{ color: m.color }} />
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>{m.label}</span>
              </div>
              <p className="text-xl font-black font-['Space_Grotesk'] leading-none mb-2" style={{ color: t.textPrimary }}>
                <AnimatedNumber value={parseFloat(m.value) || 0} duration={1400} decimals={m.decimals || 0} />
              </p>
              <AnimatedBar percent={m.pct} color={m.color} delay={400 + i * 100} />
            </div>
          );
        })}
      </div>
    </PanelShell>
  );
}

/* ─── Top Performers ───────────────────────────────────────────────────── */
export function TopPerformersPanel({ performers, t, isDark }) {
  const medalStyles = [
    { bg: isDark ? "linear-gradient(135deg, rgba(255,208,0,0.18), rgba(255,159,26,0.08))" : "linear-gradient(135deg, #FFFBEB, #FEF3C7)", border: isDark ? "rgba(255,208,0,0.25)" : "#FDE68A", ring: "#FFD000" },
    { bg: isDark ? "linear-gradient(135deg, rgba(192,192,192,0.12), rgba(156,163,175,0.05))" : "linear-gradient(135deg, #F9FAFB, #F3F4F6)", border: isDark ? "rgba(192,192,192,0.2)" : "#E5E7EB", ring: "#9CA3AF" },
    { bg: isDark ? "linear-gradient(135deg, rgba(205,127,50,0.12), rgba(180,83,9,0.05))" : "linear-gradient(135deg, #FFF7ED, #FFEDD5)", border: isDark ? "rgba(205,127,50,0.2)" : "#FED7AA", ring: "#CD7F32" },
  ];
  const medals = ["🥇", "🥈", "🥉"];
  const goldColor = isDark ? "#FFD000" : "#d97706";
  const maxLikes = Math.max(...performers.map(p => p.likes), 1);

  return (
    <PanelShell title="Top Performers" subtitle="Ranked by total likes" icon={Trophy} iconColor={goldColor} t={t} isDark={isDark} delay={120}>
      {performers.length === 0 ? (
        <p className="text-xs py-10 text-center" style={{ color: t.textMuted }}>No data yet</p>
      ) : (
        <div className="px-3 pb-3">
          {performers.map((p, i) => {
            const style = medalStyles[i] || {};
            const likesPct = (p.likes / maxLikes) * 100;
            return (
              <div key={i} className="rounded-xl px-3 py-2.5 mb-1.5 transition-all hover:scale-[1.01] relative overflow-hidden" style={{
                background: i < 3 ? style.bg : "transparent",
                border: i < 3 ? `1px solid ${style.border}` : `1px solid transparent`,
                animation: `panel-fade 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 90 + 300}ms both`,
              }}>
                <div className="flex items-center gap-3 relative z-10">
                  <span className="text-base w-7 text-center shrink-0">
                    {medals[i] || <span className="text-[11px] font-black" style={{ color: t.textMuted }}>#{i + 1}</span>}
                  </span>
                  <div className="w-9 h-9 rounded-full overflow-hidden shrink-0" style={{
                    border: i < 3 ? `2px solid ${style.ring}` : `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                    boxShadow: i < 3 ? `0 0 0 3px ${style.ring}15` : "none",
                  }}>
                    <img src={p.avatar || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: t.textPrimary }}>{p.name}</p>
                    <p className="text-[9px]" style={{ color: t.textMuted }}>{p.drops} drops shared</p>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-black shrink-0" style={{ color: isDark ? "#f43f5e" : "#e11d48" }}>
                    <Heart size={11} fill="currentColor" />
                    <AnimatedNumber value={p.likes} duration={1400} />
                  </div>
                </div>
                {/* Animated bar below content */}
                <div className="mt-2 relative z-10">
                  <AnimatedBar percent={likesPct} color={i < 3 ? style.ring : (isDark ? "#f43f5e" : "#e11d48")} delay={i * 90 + 500} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PanelShell>
  );
}

/* ─── Recent Activity ──────────────────────────────────────────────────── */
export function RecentActivityPanel({ activity, t, isDark }) {
  const accentColor = t.accent;

  return (
    <PanelShell title="Recent Activity" subtitle="Latest community drops" icon={Clock} iconColor={accentColor} t={t} isDark={isDark} delay={240}>
      {activity.length === 0 ? (
        <p className="text-xs py-10 text-center" style={{ color: t.textMuted }}>No drops yet</p>
      ) : (
        <div className="px-4 pb-4 space-y-0.5 relative">
          {/* Vertical timeline spine */}
          <div className="absolute left-[25px] top-2 bottom-2 w-[1.5px] opacity-40"
            style={{ background: `linear-gradient(180deg, transparent, ${accentColor}40, transparent)` }} />

          {activity.map((a, i) => (
            <div key={i} className="flex items-start gap-3 py-2.5 relative" style={{
              animation: `panel-fade 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 80 + 300}ms both`,
            }}>
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full overflow-hidden mt-0.5" style={{
                  border: `2px solid ${isDark ? t.surface : "#fff"}`,
                  boxShadow: `0 0 0 1.5px ${accentColor}30`,
                }}>
                  <img src={a.avatar || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] leading-tight">
                  <span className="font-bold" style={{ color: t.textPrimary }}>{a.user}</span>
                  <span style={{ color: t.textMuted }}> shared a drop</span>
                </p>
                <p className="text-[10px] truncate mt-0.5 italic" style={{ color: t.textSecondary }}>"{a.verse || "—"}"</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[9px] font-medium" style={{ color: t.textMuted }}>
                    {a.time ? formatDistanceToNow(new Date(a.time), { addSuffix: true }) : ""}
                  </span>
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    a.status === "approved" ? (isDark ? "bg-green-500/10 text-green-400 ring-1 ring-green-500/20" : "bg-green-50 text-green-700 ring-1 ring-green-200")
                    : a.status === "rejected" ? (isDark ? "bg-red-500/10 text-red-400 ring-1 ring-red-500/20" : "bg-red-50 text-red-700 ring-1 ring-red-200")
                    : (isDark ? "bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20" : "bg-amber-50 text-amber-700 ring-1 ring-amber-200")
                  }`}>{a.status || "pending"}</span>
                  {a.likes > 0 && (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold" style={{ color: isDark ? "#f43f5e" : "#e11d48" }}>
                      <Heart size={8} fill="currentColor" /> {a.likes}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PanelShell>
  );
}