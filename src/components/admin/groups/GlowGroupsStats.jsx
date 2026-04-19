import React from "react";
import { Users, Globe2, MessageSquare, Crown } from "lucide-react";

export default function GlowGroupsStats({ stats, t }) {
  const tiles = [
    { label: "Total Groups",     value: stats.totalGroups,     icon: <Users size={18} />,        color: "#8A5CFF" },
    { label: "Total Members",    value: stats.totalMembers,    icon: <Users size={18} />,        color: "#1FB8FF" },
    { label: "Active Countries", value: stats.countriesCount,  icon: <Globe2 size={18} />,       color: "#FFD000" },
    { label: "Thriving Groups",  value: stats.thrivingCount,   icon: <MessageSquare size={18} />, color: "#22c55e" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {tiles.map((s, i) => (
        <div key={i} className="border rounded-2xl p-4 flex items-center gap-3" style={{ background: t.surface, borderColor: t.border, boxShadow: t.shadow }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}18`, color: s.color }}>
            {s.icon}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-bold truncate" style={{ color: t.textMuted }}>{s.label}</p>
            <p className="font-bold text-lg leading-tight" style={{ color: t.textPrimary }}>{s.value}</p>
          </div>
        </div>
      ))}

      {stats.topLeader && (
        <div className="col-span-2 md:col-span-4 border rounded-2xl p-4 flex items-center gap-3" style={{ background: t.surface, borderColor: t.border, boxShadow: t.shadow }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,208,0,0.15)", color: "#FFD000" }}>
            <Crown size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: t.textMuted }}>Top Leader</p>
            <p className="font-bold text-sm truncate" style={{ color: t.textPrimary }}>
              {stats.topLeader.email}
              <span className="ml-2 text-xs font-normal" style={{ color: t.textSecondary }}>
                · {stats.topLeader.groupCount} group{stats.topLeader.groupCount === 1 ? "" : "s"}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}