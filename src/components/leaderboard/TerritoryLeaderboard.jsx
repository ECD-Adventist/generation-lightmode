import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Users, Zap, Target, Heart, Loader2 } from "lucide-react";

function parseList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function cleanTerritory(value) {
  const raw = String(value || "").trim();
  if (!raw) return "Global";
  const parts = raw.split(",").map(p => p.trim()).filter(Boolean);
  return parts[parts.length - 1] || raw;
}

function keyForTerritory(value) {
  return cleanTerritory(value).toLowerCase();
}

function makeEmptyTerritory(name) {
  return {
    territory_name: cleanTerritory(name),
    total_glow_score: 0,
    total_users: 0,
    total_drops: 0,
    total_challenges_completed: 0,
    total_prayer_supports: 0,
    active_groups: 0,
  };
}

const statCards = [
  { key: "territories", label: "Active Territories", helper: "Regions lighting up", icon: Users, color: "#0B3FD9", bg: "rgba(31,184,255,0.1)" },
  { key: "xp", label: "Total XP", helper: "Global Glow Score", icon: Zap, color: "#CC7A00", bg: "rgba(255,208,0,0.16)" },
  { key: "drops", label: "Total Drops", helper: "Lights shared", icon: Target, color: "#0B3FD9", bg: "rgba(11,63,217,0.08)" },
  { key: "prayers", label: "Prayer Supports", helper: "Intercessions", icon: Heart, color: "#16A34A", bg: "rgba(34,197,94,0.1)" },
];

export default function TerritoryLeaderboard({ userTerritory = null }) {
  const [sortBy, setSortBy] = useState("glow_score");

  const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["leaderboardUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", { limit: 2000, include_count: true });
      return parseList(res.data);
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 30000,
  });

  const { data: allDrops = [] } = useQuery({
    queryKey: ["leaderboardDrops"],
    queryFn: () => base44.entities.GlowDrop.list("-created_date", 1000),
    staleTime: 1000 * 60 * 2,
    refetchInterval: 30000,
  });

  const { data: allChallenges = [] } = useQuery({
    queryKey: ["leaderboardChallenges"],
    queryFn: () => base44.entities.ChallengeSubmission.list("-created_date", 1000),
    staleTime: 1000 * 60 * 2,
    refetchInterval: 30000,
  });

  const { data: allGroups = [] } = useQuery({
    queryKey: ["leaderboardGroups"],
    queryFn: () => base44.entities.GlowGroup.list(),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 30000,
  });

  const { data: allPrayerSupports = [] } = useQuery({
    queryKey: ["leaderboardPrayerSupports"],
    queryFn: () => base44.entities.PrayerSupport.list(),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 30000,
  });

  const { sortedTerritories, totals } = useMemo(() => {
    const stats = new Map();
    const userTerritoryByEmail = new Map();

    const ensure = (territory) => {
      const key = keyForTerritory(territory);
      if (!stats.has(key)) stats.set(key, makeEmptyTerritory(territory));
      return stats.get(key);
    };

    allUsers.forEach(user => {
      const territory = cleanTerritory(user.territory_name || user.country);
      const record = ensure(territory);
      record.total_users += 1;
      record.total_glow_score += user.glow_score || user.xp_points || 0;
      if (user.email) userTerritoryByEmail.set(user.email, territory);
    });

    allDrops.forEach(drop => {
      const territory = userTerritoryByEmail.get(drop.user_email) || "Global";
      ensure(territory).total_drops += 1;
    });

    allChallenges.forEach(sub => {
      const territory = userTerritoryByEmail.get(sub.user_email) || "Global";
      ensure(territory).total_challenges_completed += 1;
    });

    allPrayerSupports.forEach(support => {
      const territory = userTerritoryByEmail.get(support.user_email) || "Global";
      ensure(territory).total_prayer_supports += 1;
    });

    allGroups.forEach(group => {
      ensure(group.country).active_groups += 1;
    });

    const list = Array.from(stats.values());
    const sorted = [...list].sort((a, b) => {
      if (sortBy === "users") return b.total_users - a.total_users;
      if (sortBy === "drops") return b.total_drops - a.total_drops;
      if (sortBy === "challenges") return b.total_challenges_completed - a.total_challenges_completed;
      return b.total_glow_score - a.total_glow_score;
    });

    return {
      sortedTerritories: sorted,
      totals: {
        territories: sorted.length,
        xp: sorted.reduce((sum, t) => sum + t.total_glow_score, 0),
        drops: sorted.reduce((sum, t) => sum + t.total_drops, 0),
        prayers: sorted.reduce((sum, t) => sum + t.total_prayer_supports, 0),
      }
    };
  }, [allUsers, allDrops, allChallenges, allGroups, allPrayerSupports, sortBy]);

  const podiumTop3 = sortedTerritories.slice(0, 3);
  const normalizedUserTerritory = keyForTerritory(userTerritory);

  if (isLoadingUsers) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-['Inter']">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.key} className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #E0EAF5", boxShadow: "0 4px 16px rgba(11,63,217,0.06)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: card.bg }}>
                  <Icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6B7FA0" }}>{card.label}</span>
              </div>
              <div className="text-3xl font-bold font-['Space_Grotesk']" style={{ color: card.color }}>{totals[card.key].toLocaleString()}</div>
              <p className="text-xs mt-1" style={{ color: "#8A97B5" }}>{card.helper}</p>
            </div>
          );
        })}
      </div>

      {podiumTop3.length > 0 && (
        <div className="rounded-3xl p-8" style={{ background: "#FFFFFF", border: "1px solid #E0EAF5", boxShadow: "0 8px 32px rgba(11,63,217,0.08)" }}>
          <h3 className="text-lg font-bold font-['Space_Grotesk'] mb-8 flex items-center gap-2" style={{ color: "#CC7A00" }}>
            <Trophy className="w-5 h-5" /> Top 3 Territories
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {podiumTop3.map((territory, index) => {
              const colors = index === 0
                ? { border: "#FFD000", text: "#CC7A00", bg: "linear-gradient(135deg, #FFF8E6 0%, #FFFFFF 100%)", medal: "👑" }
                : index === 1
                ? { border: "#C7CEDB", text: "#4A5878", bg: "#FFFFFF", medal: "🥈" }
                : { border: "#E8C896", text: "#A16207", bg: "#FFFFFF", medal: "🥉" };
              return (
                <div key={territory.territory_name} className="rounded-2xl p-6 text-center h-full flex flex-col" style={{ background: colors.bg, border: `2px solid ${colors.border}`, boxShadow: index === 0 ? "0 0 28px rgba(255,208,0,0.18)" : "none" }}>
                  <div className="text-5xl mb-3">{colors.medal}</div>
                  <h4 className="text-xl font-bold font-['Space_Grotesk'] mb-1" style={{ color: colors.text }}>{territory.territory_name}</h4>
                  <div className="text-4xl font-bold font-['Space_Grotesk'] mb-4" style={{ color: colors.text }}>{territory.total_glow_score.toLocaleString()} XP</div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] mt-auto pt-4 border-t" style={{ borderColor: "#E0EAF5" }}>
                    <div><div className="font-bold" style={{ color: colors.text }}>{territory.total_users}</div><div style={{ color: "#8A97B5" }}>Users</div></div>
                    <div><div className="font-bold" style={{ color: colors.text }}>{territory.total_drops}</div><div style={{ color: "#8A97B5" }}>Drops</div></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E0EAF5", boxShadow: "0 4px 16px rgba(11,63,217,0.06)" }}>
        <div className="p-6 border-b flex items-center justify-between flex-wrap gap-4" style={{ borderColor: "#E0EAF5" }}>
          <h3 className="text-lg font-bold font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>Full Rankings</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider" style={{ color: "#6B7FA0" }}>Sort by:</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-lg px-3 py-1.5 text-sm outline-none" style={{ background: "#F6F8FC", border: "1px solid #E0EAF5", color: "#0B1B3D" }}>
              <option value="glow_score">Glow Score</option>
              <option value="users">Active Users</option>
              <option value="drops">Total Drops</option>
              <option value="challenges">Challenges</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: "#F6F8FC", borderBottom: "1px solid #E0EAF5" }}>
              <tr>
                {["Rank", "Territory", "Glow Score", "Users", "Drops", "Challenges", "Groups"].map((heading, index) => (
                  <th key={heading} className={`px-6 py-3 text-xs font-bold uppercase tracking-wider ${index < 2 ? "text-left" : "text-right"}`} style={{ color: "#6B7FA0" }}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedTerritories.map((territory, idx) => {
                const isMine = normalizedUserTerritory === keyForTerritory(territory.territory_name);
                return (
                  <tr key={territory.territory_name} className="transition" style={{ borderBottom: "1px solid #F0F4FA", background: isMine ? "#EEF3FF" : "transparent" }}>
                    <td className="px-6 py-4 text-left"><span className="font-bold font-['Space_Grotesk'] text-lg" style={{ color: "#0B1B3D" }}>{idx + 1}</span></td>
                    <td className="px-6 py-4 text-left font-semibold" style={{ color: "#0B1B3D" }}>{territory.territory_name}</td>
                    <td className="px-6 py-4 text-right font-bold" style={{ color: "#CC7A00" }}>{territory.total_glow_score.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right" style={{ color: "#4A5878" }}>{territory.total_users}</td>
                    <td className="px-6 py-4 text-right" style={{ color: "#4A5878" }}>{territory.total_drops}</td>
                    <td className="px-6 py-4 text-right" style={{ color: "#4A5878" }}>{territory.total_challenges_completed}</td>
                    <td className="px-6 py-4 text-right" style={{ color: "#4A5878" }}>{territory.active_groups}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}