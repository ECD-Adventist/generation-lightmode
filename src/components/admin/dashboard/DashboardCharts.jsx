import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";

const ChartTooltip = ({ active, payload, label, color, t, isDark }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl px-4 py-3 border backdrop-blur-xl" style={{
        background: isDark ? "rgba(18,24,38,0.95)" : "rgba(255,255,255,0.97)",
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        boxShadow: isDark ? "0 12px 40px rgba(0,0,0,0.5)" : "0 12px 40px rgba(0,0,0,0.12)"
      }}>
        <p className="text-[9px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: t.textMuted }}>{label}</p>
        <p className="text-xl font-black font-['Space_Grotesk']" style={{ color }}>{payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function DashboardCharts({ growthData, dropsData, scopedUsers, recentDrops, t, isDark }) {
  const axis = isDark ? "#3A4A6B" : "#b0bbd0";
  const grid = isDark ? "rgba(255,255,255,0.025)" : "rgba(15,23,42,0.035)";
  const mainColor = isDark ? "#00CFFF" : "#0B3FD9";
  const goldColor = isDark ? "#FFD000" : "#d97706";

  const chartCardStyle = {
    background: isDark ? t.surface : "#FFFFFF",
    borderColor: isDark ? t.border : "rgba(0,0,0,0.04)",
    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.25)" : "0 4px 20px rgba(0,0,0,0.04)"
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* User Growth */}
      <div className="rounded-[1.25rem] border relative overflow-hidden" style={chartCardStyle}>
        {/* Top gradient bar */}
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${mainColor}, ${isDark ? "#8A5CFF" : "#7e22ce"})` }} />
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
                background: `${mainColor}10`,
                border: `1px solid ${mainColor}18`,
                boxShadow: `0 0 20px ${mainColor}08`
              }}>
                <TrendingUp size={16} style={{ color: mainColor }} />
              </div>
              <div>
                <h3 className="text-sm font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>User Growth</h3>
                <p className="text-[10px]" style={{ color: t.textMuted }}>6 month registration trend</p>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-xl text-[11px] font-black" style={{
              background: `${mainColor}08`,
              color: mainColor,
              border: `1px solid ${mainColor}15`
            }}>{scopedUsers.toLocaleString()} total</div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ugFillPrem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={mainColor} stopOpacity={0.25} />
                    <stop offset="50%" stopColor={mainColor} stopOpacity={0.08} />
                    <stop offset="100%" stopColor={mainColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={grid} vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke={axis} fontSize={10} fontWeight={600} tickLine={false} axisLine={false} />
                <YAxis stroke={axis} fontSize={10} fontWeight={600} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip color={mainColor} t={t} isDark={isDark} />} cursor={{ stroke: mainColor, strokeOpacity: 0.15, strokeWidth: 1.5 }} />
                <Area type="monotone" dataKey="users" stroke={mainColor} strokeWidth={2.5} fill="url(#ugFillPrem)"
                  dot={{ r: 4, fill: isDark ? "#121826" : "#fff", stroke: mainColor, strokeWidth: 2.5 }}
                  activeDot={{ r: 6, fill: mainColor, stroke: isDark ? "#121826" : "#fff", strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weekly Drops */}
      <div className="rounded-[1.25rem] border relative overflow-hidden" style={chartCardStyle}>
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${goldColor}, ${isDark ? "#f97316" : "#ea580c"})` }} />
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
                background: `${goldColor}10`,
                border: `1px solid ${goldColor}18`,
                boxShadow: `0 0 20px ${goldColor}08`
              }}>
                <BarChart3 size={16} style={{ color: goldColor }} />
              </div>
              <div>
                <h3 className="text-sm font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Weekly Drops</h3>
                <p className="text-[10px]" style={{ color: t.textMuted }}>Content created by day</p>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-xl text-[11px] font-black" style={{
              background: `${goldColor}08`,
              color: goldColor,
              border: `1px solid ${goldColor}15`
            }}>{recentDrops} this wk</div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dropsData} barSize={32} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="bgFillPrem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={goldColor} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={goldColor} stopOpacity={0.35} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={grid} vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke={axis} fontSize={10} fontWeight={600} tickLine={false} axisLine={false} />
                <YAxis stroke={axis} fontSize={10} fontWeight={600} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip color={goldColor} t={t} isDark={isDark} />} cursor={{ fill: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", radius: 8 }} />
                <Bar dataKey="drops" fill="url(#bgFillPrem)" radius={[10, 10, 2, 2]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}