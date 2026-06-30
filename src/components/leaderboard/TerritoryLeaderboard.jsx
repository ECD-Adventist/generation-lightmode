import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Trophy, TrendingUp, Users, Zap, Target, Heart } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function TerritoryLeaderboard({ userTerritory = null }) {
  const [sortBy, setSortBy] = useState("glow_score");

  // Fetch all users and aggregate by territory
  const { data: allUsers = [] } = useQuery({
    queryKey: ["leaderboardUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", { limit: 2000 });
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 30000, // Refresh every 30s for real-time feel
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

  // Compute territory stats
  const territoryStats = useMemo(() => {
    const stats = {};

    // Group users by territory
    allUsers.forEach((user) => {
      const territory = user.country || "Global";
      if (!stats[territory]) {
        stats[territory] = {
          territory_name: territory,
          total_glow_score: 0,
          total_users: 0,
          total_drops: 0,
          total_challenges_completed: 0,
          total_prayer_supports: 0,
          active_groups: 0,
        };
      }
      stats[territory].total_users += 1;
      stats[territory].total_glow_score += user.glow_score || 0;
    });

    // Count drops per territory
    allDrops.forEach((drop) => {
      const user = allUsers.find((u) => u.email === drop.user_email);
      const territory = user?.country || "Global";
      if (stats[territory]) stats[territory].total_drops += 1;
    });

    // Count challenge submissions
    allChallenges.forEach((sub) => {
      const user = allUsers.find((u) => u.email === sub.user_email);
      const territory = user?.country || "Global";
      if (stats[territory]) stats[territory].total_challenges_completed += 1;
    });

    // Count prayer supports
    allPrayerSupports.forEach((support) => {
      const user = allUsers.find((u) => u.email === support.user_email);
      const territory = user?.country || "Global";
      if (stats[territory]) stats[territory].total_prayer_supports += 1;
    });

    // Count active groups per territory
    allGroups.forEach((group) => {
      const territory = group.country || "Global";
      if (!stats[territory]) {
        stats[territory] = {
          territory_name: territory,
          total_glow_score: 0,
          total_users: 0,
          total_drops: 0,
          total_challenges_completed: 0,
          total_prayer_supports: 0,
          active_groups: 0,
        };
      }
      stats[territory].active_groups += 1;
    });

    return Object.values(stats);
  }, [allUsers, allDrops, allChallenges, allGroups, allPrayerSupports]);

  // Sort territories
  const sortedTerritories = useMemo(() => {
    const sorted = [...territoryStats];
    switch (sortBy) {
      case "glow_score":
        return sorted.sort((a, b) => b.total_glow_score - a.total_glow_score);
      case "users":
        return sorted.sort((a, b) => b.total_users - a.total_users);
      case "drops":
        return sorted.sort((a, b) => b.total_drops - a.total_drops);
      case "challenges":
        return sorted.sort((a, b) => b.total_challenges_completed - a.total_challenges_completed);
      default:
        return sorted;
    }
  }, [territoryStats, sortBy]);

  const podiumTop3 = sortedTerritories.slice(0, 3);
  const topTerritory = podiumTop3[0];

  if (allUsers.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#121826] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#00CFFF]/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#00CFFF]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Territories</span>
          </div>
          <div className="text-3xl font-bold text-white font-['Space_Grotesk']">{sortedTerritories.length}</div>
          <p className="text-xs text-gray-500 mt-1">Regions lighting up</p>
        </div>

        <div className="bg-[#121826] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#FFD000]/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#FFD000]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total XP</span>
          </div>
          <div className="text-3xl font-bold text-[#FFD000] font-['Space_Grotesk']">
            {sortedTerritories.reduce((sum, t) => sum + t.total_glow_score, 0).toLocaleString()}
          </div>
          <p className="text-xs text-gray-500 mt-1">Global Glow Score</p>
        </div>

        <div className="bg-[#121826] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#8A5CFF]/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-[#8A5CFF]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Drops</span>
          </div>
          <div className="text-3xl font-bold text-[#8A5CFF] font-['Space_Grotesk']">
            {sortedTerritories.reduce((sum, t) => sum + t.total_drops, 0).toLocaleString()}
          </div>
          <p className="text-xs text-gray-500 mt-1">Lights shared</p>
        </div>

        <div className="bg-[#121826] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <Heart className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Prayer Supports</span>
          </div>
          <div className="text-3xl font-bold text-green-400 font-['Space_Grotesk']">
            {sortedTerritories.reduce((sum, t) => sum + t.total_prayer_supports, 0).toLocaleString()}
          </div>
          <p className="text-xs text-gray-500 mt-1">Intercessions</p>
        </div>
      </div>

      {/* Podium */}
      {podiumTop3.length > 0 && (
        <div className="bg-gradient-to-r from-[#121826] to-[#0B0F1A] border border-white/5 rounded-3xl p-8 shadow-[0_0_40px_rgba(255,208,0,0.1)]">
          <h3 className="text-lg font-bold font-['Space_Grotesk'] text-[#FFD000] mb-8 flex items-center gap-2">
            <Trophy className="w-5 h-5" /> Top 3 Territories
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 2nd Place */}
            {podiumTop3[1] && (
              <div className="relative">
                <div className="bg-[#0B0F1A] border-2 border-[#C7CEDB] rounded-2xl p-6 text-center h-full flex flex-col">
                  <div className="text-4xl mb-3">🥈</div>
                  <h4 className="text-xl font-bold text-[#C7CEDB] font-['Space_Grotesk'] mb-1">{podiumTop3[1].territory_name}</h4>
                  <div className="text-3xl font-bold text-white font-['Space_Grotesk'] mb-4">{podiumTop3[1].total_glow_score.toLocaleString()} XP</div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] mt-auto pt-4 border-t border-white/10">
                    <div><div className="text-[#C7CEDB] font-bold">{podiumTop3[1].total_users}</div><div className="text-gray-500">Users</div></div>
                    <div><div className="text-[#C7CEDB] font-bold">{podiumTop3[1].total_drops}</div><div className="text-gray-500">Drops</div></div>
                  </div>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {podiumTop3[0] && (
              <div className="relative md:scale-105">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-6xl">👑</div>
                <div className="bg-gradient-to-br from-[#FFD000]/20 to-[#0B0F1A] border-2 border-[#FFD000] rounded-2xl p-6 text-center h-full flex flex-col shadow-[0_0_30px_rgba(255,208,0,0.2)]">
                  <div className="text-4xl mb-3 mt-4">🥇</div>
                  <h4 className="text-xl font-bold text-[#FFD000] font-['Space_Grotesk'] mb-1">{podiumTop3[0].territory_name}</h4>
                  <div className="text-4xl font-bold text-[#FFD000] font-['Space_Grotesk'] mb-4">{podiumTop3[0].total_glow_score.toLocaleString()} XP</div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] mt-auto pt-4 border-t border-[#FFD000]/30">
                    <div><div className="text-[#FFD000] font-bold">{podiumTop3[0].total_users}</div><div className="text-gray-500">Users</div></div>
                    <div><div className="text-[#FFD000] font-bold">{podiumTop3[0].total_drops}</div><div className="text-gray-500">Drops</div></div>
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {podiumTop3[2] && (
              <div className="relative">
                <div className="bg-[#0B0F1A] border-2 border-[#C77A2B] rounded-2xl p-6 text-center h-full flex flex-col">
                  <div className="text-4xl mb-3">🥉</div>
                  <h4 className="text-xl font-bold text-[#C77A2B] font-['Space_Grotesk'] mb-1">{podiumTop3[2].territory_name}</h4>
                  <div className="text-3xl font-bold text-white font-['Space_Grotesk'] mb-4">{podiumTop3[2].total_glow_score.toLocaleString()} XP</div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] mt-auto pt-4 border-t border-white/10">
                    <div><div className="text-[#C77A2B] font-bold">{podiumTop3[2].total_users}</div><div className="text-gray-500">Users</div></div>
                    <div><div className="text-[#C77A2B] font-bold">{podiumTop3[2].total_drops}</div><div className="text-gray-500">Drops</div></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Rankings Table */}
      <div className="bg-[#121826] border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-lg font-bold font-['Space_Grotesk']">Full Rankings</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#0B0F1A] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white hover:border-[#00CFFF]/30 transition"
            >
              <option value="glow_score">Glow Score</option>
              <option value="users">Active Users</option>
              <option value="drops">Total Drops</option>
              <option value="challenges">Challenges</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0B0F1A]/50 border-b border-white/5">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Rank</th>
                <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Territory</th>
                <th className="text-right px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Glow Score</th>
                <th className="text-right px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Users</th>
                <th className="text-right px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Drops</th>
                <th className="text-right px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Challenges</th>
                <th className="text-right px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-400">Groups</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedTerritories.map((territory, idx) => (
                <tr
                  key={territory.territory_name}
                  className={`hover:bg-[#0B0F1A]/50 transition ${
                    userTerritory === territory.territory_name ? "bg-[#00CFFF]/5" : ""
                  }`}
                >
                  <td className="px-6 py-4 text-left">
                    <span className="font-bold text-white font-['Space_Grotesk'] text-lg">{idx + 1}</span>
                  </td>
                  <td className="px-6 py-4 text-left font-semibold text-white">{territory.territory_name}</td>
                  <td className="px-6 py-4 text-right font-bold text-[#FFD000]">{territory.total_glow_score.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-gray-400">{territory.total_users}</td>
                  <td className="px-6 py-4 text-right text-gray-400">{territory.total_drops}</td>
                  <td className="px-6 py-4 text-right text-gray-400">{territory.total_challenges_completed}</td>
                  <td className="px-6 py-4 text-right text-gray-400">{territory.active_groups}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}