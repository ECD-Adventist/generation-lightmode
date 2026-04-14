import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trophy, Globe, MapPin, Church, Zap, ArrowUp, Flame, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const FILTERS = [
  { id: "global", label: "Global", icon: Globe },
  { id: "country", label: "My Country", icon: MapPin },
  { id: "church", label: "My Church", icon: Church },
];

function MedalOrRank({ index, isCurrentUser }) {
  if (index === 0) return <span className="text-3xl">🥇</span>;
  if (index === 1) return <span className="text-3xl">🥈</span>;
  if (index === 2) return <span className="text-3xl">🥉</span>;
  return (
    <span className={`text-base font-black font-['Space_Grotesk'] ${isCurrentUser ? "text-[#FFD000]" : "text-gray-500"}`}>
      #{index + 1}
    </span>
  );
}

export default function GlobalGlowLeaderboard({ currentUser }) {
  const [scopeFilter, setScopeFilter] = useState("global");

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ["glowLeaderboardUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data;
    },
    staleTime: 1000 * 60 * 3,
  });

  const leaderboard = useMemo(() => {
    let pool = allUsers;

    if (scopeFilter === "country" && currentUser?.country) {
      pool = pool.filter(u => u.country === currentUser.country);
    } else if (scopeFilter === "church") {
      // Use city as a proxy for local church community
      if (currentUser?.city) {
        pool = pool.filter(u => u.city && u.city.toLowerCase() === currentUser.city.toLowerCase());
      } else if (currentUser?.country) {
        pool = pool.filter(u => u.country === currentUser.country);
      }
    }

    return [...pool]
      .sort((a, b) => (b.glow_score || 0) - (a.glow_score || 0))
      .slice(0, 20);
  }, [allUsers, scopeFilter, currentUser]);

  const currentUserRank = useMemo(() => {
    const sorted = [...allUsers].sort((a, b) => (b.glow_score || 0) - (a.glow_score || 0));
    const idx = sorted.findIndex(u => u.email === currentUser?.email);
    return idx >= 0 ? idx + 1 : null;
  }, [allUsers, currentUser]);

  const topScore = leaderboard[0]?.glow_score || 0;

  const filterLabel = scopeFilter === "country"
    ? currentUser?.country || "Your Country"
    : scopeFilter === "church"
    ? currentUser?.city || currentUser?.country || "Your Area"
    : "Global";

  return (
    <div className="bg-[#0B0F1A] rounded-2xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-5 border-b border-white/5 bg-gradient-to-r from-[#FFD000]/5 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-[#FFD000]" />
              <h2 className="text-xl font-black font-['Space_Grotesk'] text-white">Global Glow Leaderboard</h2>
            </div>
            <p className="text-gray-500 text-xs">Top 20 believers ranked by Glow Score — <span className="text-[#FFD000]">{filterLabel}</span></p>
          </div>
          {currentUserRank && (
            <div className="flex items-center gap-2 px-4 py-2 bg-[#FFD000]/10 border border-[#FFD000]/20 rounded-xl shrink-0">
              <Flame className="w-4 h-4 text-[#FFD000]" />
              <span className="text-[#FFD000] font-black text-sm">Your global rank: #{currentUserRank}</span>
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mt-4">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setScopeFilter(f.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                scopeFilter === f.id
                  ? "bg-[#FFD000] text-black shadow-[0_0_14px_rgba(255,208,0,0.4)]"
                  : "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <f.icon className="w-3.5 h-3.5" />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-white/5">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 text-[#FFD000] animate-spin" />
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-bold text-sm">No members found for this scope.</p>
            <p className="text-xs mt-1">
              {scopeFilter === "country" ? "You may be the only member from your country!" : "Try a different filter."}
            </p>
          </div>
        ) : (
          leaderboard.map((warrior, index) => {
            const isCurrentUser = warrior.email === currentUser?.email;
            const isTop3 = index < 3;
            const barWidth = topScore > 0 ? Math.max(4, Math.round(((warrior.glow_score || 0) / topScore) * 100)) : 0;

            return (
              <Link
                key={warrior.id || warrior.email}
                to={createPageUrl("Profile") + `?user=${encodeURIComponent(warrior.email)}`}
                className={`flex items-center gap-4 px-5 py-4 transition-all hover:bg-white/[0.03] group ${
                  isCurrentUser ? "bg-[#FFD000]/5 border-l-2 border-[#FFD000]" : ""
                }`}
              >
                {/* Rank */}
                <div className="w-10 shrink-0 flex items-center justify-center">
                  <MedalOrRank index={index} isCurrentUser={isCurrentUser} />
                </div>

                {/* Avatar */}
                <div className={`w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 ${isTop3 ? "border-[#FFD000]/60" : "border-white/10"}`}>
                  <img
                    src={warrior.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                    className="w-full h-full object-cover"
                    alt={warrior.full_name}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`font-bold text-sm truncate ${isCurrentUser ? "text-[#FFD000]" : "text-white"}`}>
                      {warrior.full_name}
                    </span>
                    {isCurrentUser && (
                      <span className="text-[9px] bg-[#FFD000]/20 border border-[#FFD000]/30 text-[#FFD000] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                        You
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    {warrior.country && <><MapPin className="w-2.5 h-2.5 text-[#00CFFF]" /><span>{warrior.country}</span></>}
                    {warrior.city && <><span>·</span><span>{warrior.city}</span></>}
                  </div>
                  {/* XP bar */}
                  <div className="mt-1.5 h-1.5 bg-white/5 rounded-full overflow-hidden w-full max-w-[200px]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${barWidth}%`,
                        background: isTop3 ? "#FFD000" : isCurrentUser ? "#FFD000" : "#00CFFF",
                      }}
                    />
                  </div>
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <div className={`text-xl font-black font-['Space_Grotesk'] ${isTop3 || isCurrentUser ? "text-[#FFD000]" : "text-white"}`}>
                    {(warrior.glow_score || 0).toLocaleString()}
                  </div>
                  <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold flex items-center gap-0.5 justify-end">
                    <Zap className="w-2.5 h-2.5 text-[#FFD000]" /> XP
                  </div>
                </div>

                <ArrowUp className="w-3.5 h-3.5 text-[#00CFFF] opacity-0 group-hover:opacity-100 transition shrink-0" />
              </Link>
            );
          })
        )}
      </div>

      {/* Footer summary */}
      {leaderboard.length > 0 && (
        <div className="px-5 py-4 border-t border-white/5 grid grid-cols-3 gap-4 bg-[#121826]/50">
          <div className="text-center">
            <div className="text-lg font-black text-[#FFD000]">{leaderboard.length}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Ranked</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-[#00CFFF]">{topScore.toLocaleString()}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Top Score</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-[#8A5CFF]">
              {leaderboard.length > 0 ? Math.round(leaderboard.reduce((s, u) => s + (u.glow_score || 0), 0) / leaderboard.length) : 0}
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Avg XP</div>
          </div>
        </div>
      )}
    </div>
  );
}