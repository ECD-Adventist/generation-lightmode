import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Award, Zap, Users, Target, Heart } from "lucide-react";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";

const getBadgeDefs = (isDark) => [
  { id: "gs100", name: "Spark", desc: "Reached 100 XP", icon: "⚡", color: isDark ? "#00CFFF" : "#0B3FD9", condition: u => (u.glow_score || 0) >= 100 },
  { id: "gs500", name: "Flame", desc: "Reached 500 XP", icon: "🔥", color: isDark ? "#f97316" : "#ea580c", condition: u => (u.glow_score || 0) >= 500 },
  { id: "gs1000", name: "Beacon", desc: "Reached 1000 XP", icon: "🌟", color: isDark ? "#FFD000" : "#d97706", condition: u => (u.glow_score || 0) >= 1000 },
  { id: "creator", name: "Creator", desc: "Posted at least 1 drop", icon: "📝", color: isDark ? "#8A5CFF" : "#7e22ce", needsDrops: true },
  { id: "community", name: "Community Member", desc: "Joined a GlowGroup", icon: "🤝", color: isDark ? "#22c55e" : "#16a34a", needsMembership: true },
  { id: "warrior", name: "Prayer Warrior", desc: "Supported 50+ prayer requests", icon: "🛡️", color: isDark ? "#a78bfa" : "#8b5cf6", needsPrayers: true },
  { id: "leader", name: "Community Pillar", desc: "GlowGroup Leader role", icon: "🏛️", color: isDark ? "#FFD000" : "#d97706", condition: u => u.role === "GlowGroup Leader" },
];

const getGlowPins = (isDark) => [
  { tier: "Bronze", label: "Starter Missionary", icon: "🥉", color: isDark ? "#C77A2B" : "#b45309", min: 0, desc: "30 Glow Drops posted" },
  { tier: "Silver", label: "Consistent Missionary", icon: "🥈", color: isDark ? "#C7CEDB" : "#6B7FA0", min: 60, desc: "60 Drops + 60 Real Light Talks" },
  { tier: "Gold", label: "Multiplying Missionary", icon: "🥇", color: isDark ? "#FFD000" : "#d97706", min: 200, desc: "Recruit 5 new youth + start GlowGroup" },
  { tier: "Platinum", label: "Ambassador Missionary", icon: "💎", color: isDark ? "#E8EFFE" : "#1e40af", min: 500, desc: "Mentor + Lead + Submit Glow Logs" },
];

export default function AdminBadgesTab() {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";
  const BADGE_DEFS = getBadgeDefs(isDark);
  const GLOW_PINS = getGlowPins(isDark);

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
  }, [users, dropsPerUser, membershipsPerUser, supportsPerUser, BADGE_DEFS]);

  const pinCounts = useMemo(() => {
    return GLOW_PINS.map(p => ({
      ...p,
      count: users.filter(u => (u.glow_score || 0) >= p.min).length,
    }));
  }, [users, GLOW_PINS]);

  const certCounts = useMemo(() => {
    const map = {};
    certificates.forEach(c => { map[c.title] = (map[c.title] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [certificates]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Badges & Ranks</h1>
        <p className="text-sm mt-1" style={{ color: t.textSecondary }}>Overview of earned badges, glow pins, and certificates across the platform.</p>
      </div>

      {/* Glow Pins */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: isDark ? "#FFD000" : "#d97706" }}>
          <Award className="w-4 h-4" /> The 4 Glow Pins — Distribution
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {pinCounts.map(p => (
            <div key={p.tier} className="border rounded-2xl p-5 text-center" style={{ background: t.surface, borderColor: `${p.color}40` }}>
              <div className="text-4xl mb-3">{p.icon}</div>
              <div className="text-2xl font-black" style={{ color: p.color }}>{p.count}</div>
              <div className="text-xs font-bold mt-1" style={{ color: t.textPrimary }}>{p.tier}</div>
              <div className="text-[10px] mt-1" style={{ color: t.textSecondary }}>{p.label}</div>
              <div className="text-[10px] mt-2" style={{ color: t.textMuted }}>{p.desc}</div>
              <div className="mt-2 text-[10px] font-semibold" style={{ color: p.color }}>{p.min}+ XP required</div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievement Badges */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: t.accent }}>
          <Zap className="w-4 h-4" /> Achievement Badges — Earned Count
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {BADGE_DEFS.map(b => (
            <div key={b.id} className="border rounded-2xl p-4 flex flex-col items-center text-center gap-2" style={{ background: t.surface, borderColor: t.border }}>
              <div className="text-3xl">{b.icon}</div>
              <div className="text-xl font-black" style={{ color: b.color }}>{badgeCounts[b.id] || 0}</div>
              <div className="text-xs font-bold" style={{ color: t.textPrimary }}>{b.name}</div>
              <div className="text-[10px]" style={{ color: t.textSecondary }}>{b.desc}</div>
              <div className="text-[10px]" style={{ color: t.textMuted }}>
                {users.length > 0 ? `${Math.round(((badgeCounts[b.id] || 0) / users.length) * 100)}% of members` : "—"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certificates */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: isDark ? "#FFD000" : "#d97706" }}>
          <Award className="w-4 h-4" /> Glow Certificates Issued
        </h2>
        {certCounts.length === 0 ? (
          <div className="border rounded-2xl p-8 text-center text-sm" style={{ background: t.surface, borderColor: t.border, color: t.textMuted }}>No certificates issued yet.</div>
        ) : (
          <div className="border rounded-2xl overflow-hidden" style={{ background: t.surface, borderColor: t.border }}>
            {certCounts.map(([title, count], i) => (
              <div key={title} className="flex items-center justify-between px-5 py-4 border-b last:border-0" style={{ borderColor: t.border }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm border" style={{ background: isDark ? "rgba(255,208,0,0.1)" : "#fffbeb", borderColor: isDark ? "rgba(255,208,0,0.2)" : "#fef3c7" }}>🏅</div>
                  <span className="text-sm font-semibold" style={{ color: t.textPrimary }}>{title}</span>
                </div>
                <span className="text-sm font-black" style={{ color: isDark ? "#FFD000" : "#d97706" }}>{count} issued</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="border rounded-2xl p-6" style={{ background: t.surfaceMuted, borderColor: t.border }}>
        <h3 className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: t.textSecondary }}>Platform Gamification Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Certificates", value: certificates.length, color: isDark ? "#FFD000" : "#d97706" },
            { label: "Platinum Members", value: pinCounts.find(p => p.tier === "Platinum")?.count || 0, color: isDark ? "#E8EFFE" : "#1e40af" },
            { label: "Gold Members", value: pinCounts.find(p => p.tier === "Gold")?.count || 0, color: isDark ? "#FFD000" : "#d97706" },
            { label: "Avg Glow Score", value: users.length ? Math.round(users.reduce((s, u) => s + (u.glow_score || 0), 0) / users.length) : 0, color: t.accent },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] uppercase tracking-wider mt-1" style={{ color: t.textMuted }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}