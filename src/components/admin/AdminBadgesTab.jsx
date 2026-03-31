import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Award, Zap, Users, Target, Heart } from "lucide-react";

const BADGE_DEFS = [
  { id: "gs100", name: "Spark", desc: "Reached 100 XP", icon: "⚡", color: "#00CFFF", condition: u => (u.glow_score || 0) >= 100 },
  { id: "gs500", name: "Flame", desc: "Reached 500 XP", icon: "🔥", color: "#f97316", condition: u => (u.glow_score || 0) >= 500 },
  { id: "gs1000", name: "Inferno", desc: "Reached 1000 XP", icon: "🌟", color: "#FFD000", condition: u => (u.glow_score || 0) >= 1000 },
  { id: "creator", name: "Creator", desc: "Posted at least 1 drop", icon: "📝", color: "#8A5CFF", needsDrops: true },
  { id: "community", name: "Community Member", desc: "Joined a GlowGroup", icon: "🤝", color: "#22c55e", needsMembership: true },
  { id: "warrior", name: "Prayer Warrior", desc: "Supported 50+ prayer requests", icon: "🛡️", color: "#a78bfa", needsPrayers: true },
  { id: "leader", name: "Community Pillar", desc: "GlowGroup Leader role", icon: "🏛️", color: "#FFD000", condition: u => u.role === "GlowGroup Leader" },
];

const GLOW_PINS = [
  { tier: "Bronze", label: "Starter Missionary", icon: "🥉", color: "#C77A2B", min: 0, desc: "30 Glow Drops posted" },
  { tier: "Silver", label: "Consistent Missionary", icon: "🥈", color: "#C7CEDB", min: 60, desc: "60 Drops + 60 Real Light Talks" },
  { tier: "Gold", label: "Multiplying Missionary", icon: "🥇", color: "#FFD000", min: 200, desc: "Recruit 5 new youth + start GlowGroup" },
  { tier: "Platinum", label: "Ambassador Missionary", icon: "💎", color: "#E8EFFE", min: 500, desc: "Mentor + Lead + Submit Glow Logs" },
];

export default function AdminBadgesTab() {
  const { data: users = [] } = useQuery({
    queryKey: ["badges_users"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data || [];
    }
  });

  const { data: drops = [] } = useQuery({
    queryKey: ["badges_drops"],
    queryFn: () => base44.entities.GlowDrop.list("-created_date", 500),
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ["badges_memberships"],
    queryFn: () => base44.entities.GlowGroupMember.list(),
  });

  const { data: supports = [] } = useQuery({
    queryKey: ["badges_supports"],
    queryFn: () => base44.entities.PrayerSupport.list(),
  });

  const { data: certificates = [] } = useQuery({
    queryKey: ["badges_certs"],
    queryFn: () => base44.entities.Certificate.list(),
  });

  const dropsPerUser = useMemo(() => {
    const m = {}; drops.forEach(d => { m[d.user_email] = (m[d.user_email] || 0) + 1; }); return m;
  }, [drops]);

  const membershipsPerUser = useMemo(() => {
    const m = new Set(memberships.map(mb => mb.user_email)); return m;
  }, [memberships]);

  const supportsPerUser = useMemo(() => {
    const m = {}; supports.forEach(s => { m[s.user_email] = (m[s.user_email] || 0) + 1; }); return m;
  }, [supports]);

  const badgeCounts = useMemo(() => {
    const counts = {};
    BADGE_DEFS.forEach(b => {
      counts[b.id] = users.filter(u => {
        if (b.condition) return b.condition(u);
        if (b.needsDrops) return (dropsPerUser[u.email] || 0) >= 1;
        if (b.needsMembership) return membershipsPerUser.has(u.email);
        if (b.needsPrayers) return (supportsPerUser[u.email] || 0) >= 50;
        return false;
      }).length;
    });
    return counts;
  }, [users, dropsPerUser, membershipsPerUser, supportsPerUser]);

  const pinCounts = useMemo(() => {
    return GLOW_PINS.map(p => ({
      ...p,
      count: users.filter(u => (u.glow_score || 0) >= p.min).length,
    }));
  }, [users]);

  const certCounts = useMemo(() => {
    const map = {};
    certificates.forEach(c => { map[c.title] = (map[c.title] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [certificates]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-white">Badges & Ranks</h1>
        <p className="text-gray-400 text-sm mt-1">Overview of earned badges, glow pins, and certificates across the platform.</p>
      </div>

      {/* Glow Pins */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-widest text-[#FFD000] mb-4 flex items-center gap-2">
          <Award className="w-4 h-4" /> The 4 Glow Pins — Distribution
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {pinCounts.map(p => (
            <div key={p.tier} className="bg-[#121826] border border-white/5 rounded-2xl p-5 text-center" style={{ borderColor: `${p.color}20` }}>
              <div className="text-4xl mb-3">{p.icon}</div>
              <div className="text-2xl font-black" style={{ color: p.color }}>{p.count}</div>
              <div className="text-xs font-bold text-white mt-1">{p.tier}</div>
              <div className="text-[10px] text-gray-500 mt-1">{p.label}</div>
              <div className="text-[10px] text-gray-600 mt-2">{p.desc}</div>
              <div className="mt-2 text-[10px]" style={{ color: p.color }}>{p.min}+ XP required</div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievement Badges */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-widest text-[#00CFFF] mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4" /> Achievement Badges — Earned Count
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {BADGE_DEFS.map(b => (
            <div key={b.id} className="bg-[#121826] border border-white/5 rounded-2xl p-4 flex flex-col items-center text-center gap-2">
              <div className="text-3xl">{b.icon}</div>
              <div className="text-xl font-black" style={{ color: b.color }}>{badgeCounts[b.id] || 0}</div>
              <div className="text-xs font-bold text-white">{b.name}</div>
              <div className="text-[10px] text-gray-500">{b.desc}</div>
              <div className="text-[10px] text-gray-600">
                {users.length > 0 ? `${Math.round(((badgeCounts[b.id] || 0) / users.length) * 100)}% of members` : "—"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certificates */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-widest text-[#FFD000] mb-4 flex items-center gap-2">
          <Award className="w-4 h-4" /> Glow Certificates Issued
        </h2>
        {certCounts.length === 0 ? (
          <div className="bg-[#121826] border border-white/5 rounded-2xl p-8 text-center text-gray-500 text-sm">No certificates issued yet.</div>
        ) : (
          <div className="bg-[#121826] border border-white/5 rounded-2xl overflow-hidden">
            {certCounts.map(([title, count], i) => (
              <div key={title} className="flex items-center justify-between px-5 py-4 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FFD000]/10 border border-[#FFD000]/20 flex items-center justify-center text-sm">🏅</div>
                  <span className="text-sm font-semibold text-white">{title}</span>
                </div>
                <span className="text-sm font-black text-[#FFD000]">{count} issued</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-[#00CFFF]/5 to-[#8A5CFF]/5 border border-[#00CFFF]/15 rounded-2xl p-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Platform Gamification Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Certificates", value: certificates.length, color: "#FFD000" },
            { label: "Platinum Members", value: pinCounts.find(p => p.tier === "Platinum")?.count || 0, color: "#E8EFFE" },
            { label: "Gold Members", value: pinCounts.find(p => p.tier === "Gold")?.count || 0, color: "#FFD000" },
            { label: "Avg Glow Score", value: users.length ? Math.round(users.reduce((s, u) => s + (u.glow_score || 0), 0) / users.length) : 0, color: "#00CFFF" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}