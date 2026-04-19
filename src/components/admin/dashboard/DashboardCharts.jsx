import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";

const ChartTooltip = ({ active, payload, label, color, t }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg px-3 py-2 shadow-xl border backdrop-blur-md" style={{ background: t.surface, borderColor: t.border }}>
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>{label}</p>
        <p className="text-base font-black" style={{ color }}>{payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function DashboardCharts({ growthData, dropsData, scopedUsers, recentDrops, t, isDark }) {
  const axis = isDark ? "#4B5C7A" : "#94a3b8";
  const grid = isDark ? "rgba(255,255,255,0.03)" : "rgba(15,23,42,0.04)";
  const mainColor = isDark ? "#00CFFF" : "#0B3FD9";
  const goldColor = isDark ? "#FFD000" : "#d97706";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* User Growth */}
      <div className="rounded-2xl p-5 border relative overflow-hidden" style={{ background: t.surface, borderColor: t.border }}>
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: t.gradient }} />
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>User Growth</h3>
            <p className="text-[10px]" style={{ color: t.textMuted }}>6 month registration trend</p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg" style={{ background: `${mainColor}12`, color: mainColor }}>{scopedUsers} total</span>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growthData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="ugFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={mainColor} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={mainColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="name" stroke={axis} fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke={axis} fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip color={mainColor} t={t} />} cursor={{ stroke: axis, strokeDasharray: "3 3" }} />
              <Area type="monotone" dataKey="users" stroke={mainColor} strokeWidth={2} fill="url(#ugFill)" dot={{ r: 3, fill: mainColor, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Drops */}
      <div className="rounded-2xl p-5 border relative overflow-hidden" style={{ background: t.surface, borderColor: t.border }}>
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: t.gold }} />
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Weekly Drops</h3>
            <p className="text-[10px]" style={{ color: t.textMuted }}>Content created by day</p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg" style={{ background: `${goldColor}12`, color: goldColor }}>{recentDrops} this wk</span>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dropsData} barSize={28} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="bgFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={goldColor} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={goldColor} stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="name" stroke={axis} fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke={axis} fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip color={goldColor} t={t} />} cursor={{ fill: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", radius: 6 }} />
              <Bar dataKey="drops" fill="url(#bgFill)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}