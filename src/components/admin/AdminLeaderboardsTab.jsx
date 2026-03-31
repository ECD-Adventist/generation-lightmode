import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trophy, Zap, Heart, Users, Medal } from "lucide-react";

const TIERS = [
  { min: 0, label: "Bronze Missionary", color: "#C77A2B", icon: "🥉" },
  { min: 30, label: "Silver Missionary", color: "#C7CEDB", icon: "🥈" },
  { min: 80, label: "Gold Missionary", color: "#FFD000", icon: "🥇" },
  { min: 200, label: "Platinum Ambassador", color: "#E8EFFE", icon: "💎" },
];

const getTier = (score) => {
  let tier = TIERS[0];
  for (const t of TIERS) { if (score >= t.min) tier = t; }
  return tier;
};

export default function AdminLeaderboardsTab() {
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
    TIERS.forEach(t => { counts[t.label] = 0; });
    users.forEach(u => {
      const tier = getTier(u.glow_score || 0);
      counts[tier.label]++;
    });
    return counts;
  }, [users]);

  const tabs = [
    { key: "xp", label: "Glow XP", icon: <Zap className="w-3.5 h-3.5" /> },
    { key: "drops", label: "Drops", icon: <span className="text-xs">⚡</span> },
    { key: "likes", label: "Likes", icon: <Heart className="w-3.5 h-3.5" /> },
    { key: "followers", label: "Followers", icon: <Users className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-white">Leaderboards</h1>
        <p className="text-gray-400 text-sm mt-1">Top members ranked by performance across the movement.</p>
      </div>

      {/* Tier Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TIERS.map(t => (
          <div key={t.label} className="bg-[#121826] border border-white/5 rounded-2xl p-4 text-center">
            <div className="text-3xl mb-2">{t.icon}</div>
            <div className="text-xl font-black" style={{ color: t.color }}>{tierCounts[t.label] || 0}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">{t.label}</div>
            <div className="text-[10px] text-gray-600 mt-0.5">{t.min}+ XP</div>
          </div>
        ))}
      </div>

      {/* Rank tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setView(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition border ${view === tab.key ? "bg-[#00CFFF]/10 border-[#00CFFF]/30 text-[#00CFFF]" : "bg-[#121826] border-white/5 text-gray-400 hover:text-white"}`}>
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
            const colors = ["#C7CEDB", "#FFD000", "#C77A2B"];
            const tier = getTier(u.glow_score);
            return (
              <div key={u.email} className="flex flex-col items-center gap-2">
                <img src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                  className="w-12 h-12 rounded-full object-cover border-2" style={{ borderColor: colors[idx] }} />
                <span className="text-xs font-bold text-white truncate max-w-[80px] text-center">{u.full_name || u.email?.split("@")[0]}</span>
                <span className="text-xs font-black" style={{ color: colors[idx] }}>
                  {view === "xp" ? `${u.glow_score} XP` : view === "drops" ? `${u.drops} drops` : view === "likes" ? `${u.likes} likes` : `${u.followers} followers`}
                </span>
                <div className={`w-20 ${heights[idx]} rounded-t-xl flex items-center justify-center text-2xl font-black border-t border-x`}
                  style={{ background: `${colors[idx]}18`, borderColor: `${colors[idx]}40` }}>
                  {pos}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="bg-[#121826] border border-white/5 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_auto_auto_auto] gap-3 px-5 py-3 text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5">
          <span>#</span><span>Member</span><span className="text-right">XP</span><span className="text-right">Drops</span><span className="text-right">Tier</span>
        </div>
        {isLoading ? (
          <div className="py-12 text-center text-gray-500 text-sm">Loading rankings...</div>
        ) : ranked.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">No members yet.</div>
        ) : (
          ranked.map((u, i) => {
            const tier = getTier(u.glow_score);
            const isTop3 = i < 3;
            return (
              <div key={u.email} className={`grid grid-cols-[40px_1fr_auto_auto_auto] gap-3 px-5 py-3 items-center border-b border-white/5 last:border-0 ${isTop3 ? "bg-white/[0.02]" : ""} hover:bg-white/[0.02] transition`}>
                <span className={`text-sm font-black ${i === 0 ? "text-[#FFD000]" : i === 1 ? "text-[#C7CEDB]" : i === 2 ? "text-[#C77A2B]" : "text-gray-600"}`}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </span>
                <div className="flex items-center gap-3 min-w-0">
                  <img src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                    className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{u.full_name || "Anonymous"}</p>
                    <p className="text-[10px] text-gray-500 truncate">{u.country || "Global"}</p>
                  </div>
                </div>
                <span className="text-sm font-black text-[#FFD000] text-right">{u.glow_score.toLocaleString()}</span>
                <span className="text-sm font-bold text-gray-300 text-right">{u.drops}</span>
                <span className="text-xs font-bold text-right" style={{ color: tier.color }}>{tier.icon}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}