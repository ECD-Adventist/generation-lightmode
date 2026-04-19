import React from "react";
import { CheckCircle2, XCircle, EyeOff, FileText, Clock, Flag } from "lucide-react";

export default function GlowDropsStats({ stats, t }) {
  const tiles = [
    { label: "Total Drops",   value: stats.total,      icon: <FileText size={18} />,      color: "#1FB8FF" },
    { label: "Approved",      value: stats.approved,   icon: <CheckCircle2 size={18} />,  color: "#22c55e" },
    { label: "Rejected",      value: stats.rejected,   icon: <XCircle size={18} />,       color: "#ef4444" },
    { label: "Hidden",        value: stats.hidden,     icon: <EyeOff size={18} />,        color: "#8A5CFF" },
    { label: "Last 24 hrs",   value: `+${stats.last24h}`, icon: <Clock size={18} />,      color: "#FFD000", highlight: stats.last24h > 0 },
    { label: "Needs Review",  value: stats.pending,    icon: <Flag size={18} />,          color: "#f59e0b", highlight: stats.pending > 0 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
      {tiles.map((s, i) => (
        <div
          key={i}
          className="border rounded-2xl p-4 flex items-center gap-3"
          style={{
            background: t.surface,
            borderColor: s.highlight ? `${s.color}66` : t.border,
            boxShadow: t.shadow
          }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}18`, color: s.color }}>
            {s.icon}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-bold truncate" style={{ color: t.textMuted }}>{s.label}</p>
            <p className="font-bold text-lg leading-tight" style={{ color: t.textPrimary }}>{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}