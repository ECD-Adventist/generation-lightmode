import React from "react";
import { CheckCircle2, XCircle, EyeOff, FileText, Clock } from "lucide-react";

export default function GlowDropsStats({ stats, t, activeFilter, onFilterChange }) {
  const tiles = [
    { key: "all", label: "Total Drops",   value: stats.total,      icon: <FileText size={18} />,      color: "#1FB8FF" },
    { key: "approved", label: "Approved",      value: stats.approved,   icon: <CheckCircle2 size={18} />,  color: "#22c55e" },
    { key: "rejected", label: "Rejected",      value: stats.rejected,   icon: <XCircle size={18} />,       color: "#ef4444" },
    { key: "hidden", label: "Hidden",        value: stats.hidden,     icon: <EyeOff size={18} />,        color: "#8A5CFF" },
    { key: "last24h", label: "Last 24 hrs",   value: `+${stats.last24h}`, icon: <Clock size={18} />,      color: "#FFD000", highlight: stats.last24h > 0 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {tiles.map((s) => {
        const isActive = activeFilter === s.key;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onFilterChange(s.key)}
            className="border rounded-2xl p-4 flex items-center gap-3 text-left transition hover:-translate-y-0.5"
            style={{
              background: t.surface,
              borderColor: isActive || s.highlight ? `${s.color}66` : t.border,
              boxShadow: isActive ? `0 0 0 1px ${s.color}55, ${t.shadow}` : t.shadow
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}18`, color: s.color }}>
              {s.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-bold truncate" style={{ color: t.textMuted }}>{s.label}</p>
              <p className="font-bold text-lg leading-tight" style={{ color: t.textPrimary }}>{s.value}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}