import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trophy, Zap, Heart, Users, Medal } from "lucide-react";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";

const getTiers = (isDark) => [
  { min: 0, label: "Seed", color: isDark ? "#5A8CFF" : "#0B3FD9", icon: "🌱" },
  { min: 100, label: "Spark", color: "#1FB8FF", icon: "⚡" },
  { min: 500, label: "Flame", color: "#FF8A00", icon: "🔥" },
  { min: 1000, label: "Beacon", color: isDark ? "#FFD000" : "#d97706", icon: "🏆" },
  { min: 5000, label: "Radiance", color: "#8A5CFF", icon: "💎" },
];

const getTierForScore = (score, tiers) => {
  let tier = tiers[0];
  for (const t of tiers) { if (score >= t.min) tier = t; }
  return tier;
};

export default function AdminLeaderboardsTab() {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";
  const TIERS = getTiers(isDark);

  const [view, setView] = useState("xp");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["lb_users"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data || [];
    }
  });

  const { data: drops = [] } = useQuery({
    queryKey: ["lb_drops"],
    queryFn: () => base44.entities.GlowDrop.list("-created_date", 500),
  });

  const { data: follows = [] } = useQuery({
    queryKey: ["lb_follows"],
    queryFn: () => base44.entities.Follow.list("-created_date", 500),
  });

  const dropsPerUser = useMemo(() => {
    const map = {};
    drops.forEach(d => { map[d.user_email] = (map[d.user_email] || 0) + 1; });
    return map;
  }, [drops]);

  const likesPerUser = useMemo(() => {
    const map = {};
    drops.forEach(d => {
      if (d.likes_count) map[d.user_email] = (map[d.user_email] || 0) + (d.likes_count || 0);
    });
    return map;
  }, [drops]);

  const followersPerUser = useMemo(() => {
    const map = {};
    follows.forEach(f => { map[f.following_email] = (map[f.following_email] || 0) + 1; });
    return map;
  }, [follows]);

  const ranked = useMemo(() => {
    return [...users]
      .map(u => ({
        ...u,
        drops: dropsPerUser[u.email] || 0,
        likes: likesPerUser[u.email] || 0,
        followers: followersPerUser[u.email] || 0,
        glow_score: u.glow_score || 0,
      }))
      .sort((a, b) => {
        if (view === "xp") return b.glow_score - a.glow_score;
        if (view === "drops") return b.drops - a.drops;
        if (view === "likes") return b.likes - a.likes;
        if (view === "followers") return b.followers - a.followers;
        return 0;
      })
      .slice(0, 50);
  }, [users, view, dropsPerUser, likesPerUser, followersPerUser]);

  const tierCounts = useMemo(() => {
    const counts = {};
    TIERS.forEach(tier => { counts[tier.label] = 0; });
    users.forEach(u => {
      const tier = getTierForScore(u.glow_score || 0, TIERS);
      counts[tier.label]++;
    });
    return counts;
  }, [users, TIERS]);

  const tabs = [
    { key: "xp", label: "Glow XP", icon: <Zap className="w-3.5 h-3.5" /> },
    { key: "drops", label: "Drops", icon: <span className="text-xs">⚡</span> },
    { key: "likes", label: "Likes", icon: <Heart className="w-3.5 h-3.5" /> },
    { key: "followers", label: "Followers", icon: <Users className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Leaderboards</h1>
        <p className="text-sm mt-1" style={{ color: t.textSecondary }}>Top members ranked by performance across the movement.</p>
      </div>

      {/* Tier Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {TIERS.map(tier => (
          <div key={tier.label} className="border rounded-2xl p-4 text-center" style={{ background: t.surface, borderColor: t.border }}>
            <div className="text-3xl mb-2">{tier.icon}</div>
            <div className="text-xl font-black" style={{ color: tier.color }}>{tierCounts[tier.label] || 0}</div>
            <div className="text-[10px] uppercase tracking-wider mt-1" style={{ color: t.textMuted }}>{tier.label}</div>
            <div className="text-[10px] mt-0.5" style={{ color: t.textMuted }}>{tier.min}+ XP</div>
          </div>
        ))}
      </div>

      {/* Rank tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setView(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition border`}
            style={view === tab.key ? { background: t.accentSoft, borderColor: t.borderStrong, color: t.accent } : { background: t.surface, borderColor: t.border, color: t.textSecondary }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      {ranked.length >= 3 && (
        <div className="flex items-end justify-center gap-4 py-4">
          {[ranked[1], ranked[0], ranked[2]].map((u, idx) => {
            const positions = [2, 1, 3];
            const pos = positions[idx];
            const heights = ["h-24", "h-32", "h-20"];
            const colors = isDark ? ["#C7CEDB", "#FFD000", "#C77A2B"] : ["#6B7FA0", "#d97706", "#b45309"];
            const tierColor = colors[idx];
            return (
              <div key={u.email} className="flex flex-col items-center gap-2">
                <img src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                  className="w-12 h-12 rounded-full object-cover border-2" style={{ borderColor: tierColor }} />
                <span className="text-xs font-bold truncate max-w-[80px] text-center" style={{ color: t.textPrimary }}>{u.full_name || u.email?.split("@")[0]}</span>
                <span className="text-xs font-black" style={{ color: tierColor }}>
                  {view === "xp" ? `${u.glow_score} XP` : view === "drops" ? `${u.drops} drops` : view === "likes" ? `${u.likes} likes` : `${u.followers} followers`}
                </span>
                <div className={`w-20 ${heights[idx]} rounded-t-xl flex items-center justify-center text-2xl font-black border-t border-x`}
                  style={{ background: `${tierColor}18`, borderColor: `${tierColor}40`, color: tierColor }}>
                  {pos}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="border rounded-2xl overflow-hidden" style={{ background: t.surface, borderColor: t.border }}>
        <div className="grid grid-cols-[40px_1fr_auto_auto_auto] gap-3 px-5 py-3 text-[10px] uppercase tracking-widest border-b" style={{ color: t.textMuted, borderColor: t.border }}>
          <span>#</span><span>Member</span><span className="text-right">XP</span><span className="text-right">Drops</span><span className="text-right">Tier</span>
        </div>
        {isLoading ? (
          <div className="py-12 text-center text-sm" style={{ color: t.textMuted }}>Loading rankings...</div>
        ) : ranked.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: t.textMuted }}>No members yet.</div>
        ) : (
          ranked.map((u, i) => {
            const tier = getTierForScore(u.glow_score, TIERS);
            const isTop3 = i < 3;
            return (
              <div key={u.email} className={`grid grid-cols-[40px_1fr_auto_auto_auto] gap-3 px-5 py-3 items-center border-b last:border-0 transition hover:opacity-80`} style={{ borderColor: t.border, background: isTop3 ? t.surfaceMuted : "transparent" }}>
                <span className={`text-sm font-black`} style={{ color: i === 0 ? (isDark ? "#FFD000" : "#d97706") : i === 1 ? (isDark ? "#C7CEDB" : "#6B7FA0") : i === 2 ? (isDark ? "#C77A2B" : "#b45309") : t.textMuted }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </span>
                <div className="flex items-center gap-3 min-w-0">
                  <img src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                    className="w-8 h-8 rounded-full object-cover border shrink-0" style={{ borderColor: t.border }} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: t.textPrimary }}>{u.full_name || "Anonymous"}</p>
                    <p className="text-[10px] truncate" style={{ color: t.textMuted }}>{u.country || "Global"}</p>
                  </div>
                </div>
                <span className="text-sm font-black text-right" style={{ color: isDark ? "#FFD000" : "#d97706" }}>{u.glow_score.toLocaleString()}</span>
                <span className="text-sm font-bold text-right" style={{ color: t.textSecondary }}>{u.drops}</span>
                <span className="text-xs font-bold text-right" style={{ color: tier.color }}>{tier.icon}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}