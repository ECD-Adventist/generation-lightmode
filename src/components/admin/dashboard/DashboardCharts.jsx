import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart, Cell } from "recharts";
import { TrendingUp, BarChart3, Sparkles } from "lucide-react";
import { AnimatedNumber } from "./useCountUp";

const ChartTooltip = ({ active, payload, label, color, t, isDark, suffix = "" }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl px-4 py-3 border backdrop-blur-xl" style={{
        background: isDark ? "rgba(18,24,38,0.96)" : "rgba(255,255,255,0.98)",
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        boxShadow: isDark ? "0 12px 40px rgba(0,0,0,0.5)" : "0 12px 40px rgba(0,0,0,0.12)"
      }}>
        <p className="text-[9px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: t.textMuted }}>{label}</p>
        <p className="text-xl font-black font-['Space_Grotesk']" style={{ color }}>
          {payload[0].value.toLocaleString()}{suffix}
        </p>
      </div>
    );
  }
  return null;
};

/* ─── Premium chart card wrapper ───────────────────────────────────────── */
function ChartCard({ title, subtitle, icon: Icon, color, badge, children, t, isDark, delay = 0 }) {
  return (
    <div className="rounded-[1.5rem] border relative overflow-hidden group" style={{
      background: isDark ? t.surface : "#FFFFFF",
      borderColor: isDark ? t.border : "rgba(11,63,217,0.1)",
      boxShadow: isDark ? "0 8px 28px rgba(0,0,0,0.3)" : "0 6px 22px rgba(11,63,217,0.08)",
      animation: `chart-fade-in 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}ms both`,
    }}>
      {/* Gradient top border */}
      <div className="h-[3px]" style={{ background: `linear-gradient(90deg, transparent, ${color}, ${color}aa, transparent)` }} />
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[200px] h-[200px] rounded-full blur-[80px] opacity-40 pointer-events-none" style={{ background: color }} />

      <div className="relative p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center relative" style={{
              background: `${color}10`,
              border: `1px solid ${color}20`,
            }}>
              <div className="absolute inset-0 rounded-xl opacity-50" style={{ background: `radial-gradient(circle at 30% 30%, ${color}30, transparent 70%)` }} />
              <Icon size={17} style={{ color }} className="relative z-10" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold font-['Space_Grotesk'] tracking-tight" style={{ color: t.textPrimary }}>{title}</h3>
              <p className="text-[11px]" style={{ color: t.textMuted }}>{subtitle}</p>
            </div>
          </div>
          {badge && (
            <div className="px-3 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1.5" style={{
              background: `${color}0d`,
              color,
              border: `1px solid ${color}20`,
            }}>
              {badge}
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export default function DashboardCharts({ growthData, dropsData, scopedUsers, recentDrops, t, isDark }) {
  const axis = isDark ? "#3A4A6B" : "#b0bbd0";
  const grid = isDark ? "rgba(255,255,255,0.03)" : "rgba(15,23,42,0.04)";
  const mainColor = isDark ? "#1FB8FF" : "#0B3FD9";
  const goldColor = isDark ? "#FFD60A" : "#d97706";
  const purpleColor = isDark ? "#5AC8FF" : "#1FB8FF";

  const maxDropsDay = Math.max(...dropsData.map(d => d.drops), 0);

  return (
    <>
      <style>{`
        @keyframes chart-fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* BENTO LAYOUT — User Growth spans 2 columns, Drops takes 1 col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* User Growth — spans 2 cols */}
        <div className="lg:col-span-2">
          <ChartCard
            title="User Growth"
            subtitle="6 month registration trend"
            icon={TrendingUp}
            color={mainColor}
            t={t}
            isDark={isDark}
            delay={0}
            badge={<><AnimatedNumber value={scopedUsers} duration={1600} /> total</>}
          >
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ugFillPrem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={mainColor} stopOpacity={0.35} />
                      <stop offset="50%" stopColor={mainColor} stopOpacity={0.1} />
                      <stop offset="100%" stopColor={mainColor} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ugStrokePrem" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={mainColor} />
                      <stop offset="100%" stopColor={purpleColor} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={grid} vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke={axis} fontSize={10} fontWeight={600} tickLine={false} axisLine={false} />
                  <YAxis stroke={axis} fontSize={10} fontWeight={600} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip color={mainColor} t={t} isDark={isDark} />} cursor={{ stroke: mainColor, strokeOpacity: 0.2, strokeWidth: 1.5, strokeDasharray: "4 4" }} />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="url(#ugStrokePrem)"
                    strokeWidth={3}
                    fill="url(#ugFillPrem)"
                    dot={{ r: 4, fill: isDark ? "#121826" : "#fff", stroke: mainColor, strokeWidth: 2.5 }}
                    activeDot={{ r: 7, fill: mainColor, stroke: isDark ? "#121826" : "#fff", strokeWidth: 3 }}
                    isAnimationActive={true}
                    animationDuration={1800}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Weekly Drops — 1 col */}
        <ChartCard
          title="Weekly Drops"
          subtitle="Content by day"
          icon={BarChart3}
          color={goldColor}
          t={t}
          isDark={isDark}
          delay={120}
          badge={<><AnimatedNumber value={recentDrops} duration={1400} /> this wk</>}
        >
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dropsData} barSize={22} margin={{ top: 10, right: 6, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="bgFillPrem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={goldColor} stopOpacity={1} />
                    <stop offset="100%" stopColor={goldColor} stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="bgFillMax" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isDark ? "#f97316" : "#ea580c"} stopOpacity={1} />
                    <stop offset="100%" stopColor={goldColor} stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={grid} vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke={axis} fontSize={10} fontWeight={600} tickLine={false} axisLine={false} />
                <YAxis stroke={axis} fontSize={10} fontWeight={600} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip color={goldColor} t={t} isDark={isDark} />} cursor={{ fill: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", radius: 8 }} />
                <Bar dataKey="drops" radius={[8, 8, 2, 2]} isAnimationActive={true} animationDuration={1600} animationEasing="ease-out">
                  {dropsData.map((entry, i) => (
                    <Cell key={i} fill={entry.drops === maxDropsDay && maxDropsDay > 0 ? "url(#bgFillMax)" : "url(#bgFillPrem)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </>
  );
}