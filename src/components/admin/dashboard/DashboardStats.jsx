import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export default function DashboardStats({ stats, t, isDark }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {stats.map((s, i) => {
        const Icon = s.icon;
        const card = (
          <div key={i} className="group relative rounded-2xl p-4 border transition-all duration-200 hover:-translate-y-0.5 cursor-pointer overflow-hidden" style={{
            background: isDark ? t.surface : "#FFFFFF",
            borderColor: isDark ? t.border : "rgba(0,0,0,0.04)",
            boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.04)"
          }}>
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-[28px] opacity-0 group-hover:opacity-25 transition-opacity pointer-events-none" style={{ background: s.color }} />
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${s.color}12`, border: `1px solid ${s.color}18` }}>
                <Icon size={16} style={{ color: s.color }} />
              </div>
              {s.trend && (
                <div className="flex items-center gap-0.5 ml-auto">
                  <ArrowUpRight size={10} className={isDark ? "text-green-400" : "text-green-600"} />
                  <span className="text-[9px] font-bold" style={{ color: isDark ? "#4ade80" : "#16a34a" }}>{s.trend}</span>
                </div>
              )}
            </div>
            <p className="text-2xl font-black font-['Space_Grotesk'] leading-none mb-0.5" style={{ color: t.textPrimary }}>
              {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>{s.label}</p>
          </div>
        );
        return s.to ? <Link key={i} to={s.to} className="block">{card}</Link> : <div key={i}>{card}</div>;
      })}
    </div>
  );
}