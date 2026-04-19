import React from "react";
import { Target, Play, Clock, Users, Zap } from "lucide-react";

export default function ChallengesStats({ stats, t }) {
  const tiles = [
    { label: "Total",        value: stats.total,               icon: <Target size={18} />, color: "#1FB8FF" },
    { label: "Active Now",   value: stats.active,              icon: <Play size={18} />,   color: "#22c55e", highlight: stats.active > 0 },
    { label: "Upcoming",     value: stats.upcoming,            icon: <Clock size={18} />,  color: "#FFD000", highlight: stats.upcoming > 0 },
    { label: "Participants", value: stats.participants,        icon: <Users size={18} />,  color: "#8A5CFF" },
    { label: "Week Subs",    value: `+${stats.submissionsThisWeek}`, icon: <Zap size={18} />, color: "#f59e0b", highlight: stats.submissionsThisWeek > 0 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {tiles.map((s, i) => (
        <div key={i} className="border rounded-2xl p-4 flex items-center gap-3" style={{ background: t.surface, borderColor: s.highlight ? `${s.color}66` : t.border, boxShadow: t.shadow }}>
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