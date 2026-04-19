import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, TrendingUp } from "lucide-react";

function MiniProgressRing({ percent, color, size = 38, strokeWidth = 3 }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(percent, 100) / 100) * circ;

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${color}15`} strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 1s ease" }} />
    </svg>
  );
}

export default function DashboardStats({ stats, t, isDark }) {
  // Calculate a pseudo "progress" for the ring based on value
  const maxVal = Math.max(...stats.map(s => typeof s.value === "number" ? s.value : 0), 1);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {stats.map((s, i) => {
        const Icon = s.icon;
        const pct = typeof s.value === "number" ? Math.min((s.value / maxVal) * 100, 100) : 50;
        const card = (
          <div key={i} className="group relative rounded-[1.25rem] p-4 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer overflow-hidden" style={{
            background: isDark ? t.surface : "#FFFFFF",
            borderColor: isDark ? t.border : "rgba(0,0,0,0.04)",
            boxShadow: isDark ? "0 2px 10px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.03)"
          }}>
            {/* Glow effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{
              background: `radial-gradient(circle at 70% 30%, ${s.color}12, transparent 70%)`
            }} />
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: s.color }} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="relative">
                  <MiniProgressRing percent={pct} color={s.color} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon size={15} style={{ color: s.color }} />
                  </div>
                </div>
                {s.trend && (
                  <div className="flex items-center gap-0.5 px-2 py-1 rounded-lg" style={{
                    background: isDark ? "rgba(34,197,94,0.1)" : "rgba(34,197,94,0.06)",
                    border: `1px solid ${isDark ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.1)"}`
                  }}>
                    <TrendingUp size={9} className={isDark ? "text-green-400" : "text-green-600"} />
                    <span className="text-[8px] font-bold" style={{ color: isDark ? "#4ade80" : "#16a34a" }}>{s.trend}</span>
                  </div>
                )}
              </div>
              <p className="text-[26px] font-black font-['Space_Grotesk'] leading-none tracking-tight" style={{ color: t.textPrimary }}>
                {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] mt-1" style={{ color: t.textMuted }}>{s.label}</p>
            </div>
          </div>
        );
        return s.to ? <Link key={i} to={s.to} className="block">{card}</Link> : <div key={i}>{card}</div>;
      })}
    </div>
  );
}