import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trophy, Globe, MapPin, Church, Zap, ArrowUp, Flame, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getDisplayName } from "@/lib/displayName";

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
    <span className="text-base font-black font-['Space_Grotesk']" style={{ color: isCurrentUser ? "#CC7A00" : "#8A97B5" }}>
      #{index + 1}
    </span>
  );
}

export default function GlobalGlowLeaderboard({ currentUser }) {
  const [scopeFilter, setScopeFilter] = useState("global");

  const scope = useMemo(() => {
    if (scopeFilter === "country") return { country: currentUser?.country || "" };
    if (scopeFilter === "church") {
      if (currentUser?.city) return { city: currentUser.city };
      return { country: currentUser?.country || "" };
    }
    return {};
  }, [scopeFilter, currentUser?.country, currentUser?.city]);

  const { data: board, isLoading } = useQuery({
    queryKey: ["glowLeaderboardRanked", scope.country || "", scope.city || ""],
    queryFn: async () => {
      const res = await base44.functions.invoke("getLeaderboard", { metric: "glow", limit: 20, ...scope });
      return res.data;
    },
    staleTime: 1000 * 60 * 3,
  });

  const leaderboard = board?.entries || [];
  const currentUserRank = board?.my_rank || null;

  const topScore = leaderboard[0]?.glow_score || 0;

  const filterLabel = scopeFilter === "country"
    ? currentUser?.country || "Your Country"
    : scopeFilter === "church"
    ? currentUser?.city || currentUser?.country || "Your Area"
    : "Global";

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
      {/* Header */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "#E6ECF5", background: "linear-gradient(135deg, rgba(255,208,0,0.04), transparent)" }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5" style={{ color: "#CC7A00" }} />
              <h2 className="text-xl font-black font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>Global Glow Leaderboard</h2>
            </div>
            <p className="text-xs" style={{ color: "#8A97B5" }}>Top 20 believers ranked by Glow Score — <span style={{ color: "#CC7A00" }}>{filterLabel}</span></p>
          </div>
          {currentUserRank && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl shrink-0" style={{ background: "rgba(255, 208, 0, 0.08)", border: "1px solid #FFE4A0" }}>
              <Flame className="w-4 h-4" style={{ color: "#CC7A00" }} />
              <span className="font-black text-sm" style={{ color: "#CC7A00" }}>Your global rank: #{currentUserRank}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setScopeFilter(f.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
              style={scopeFilter === f.id
                ? { background: "linear-gradient(90deg, #FFD000, #FF9F1A)", color: "#0B1B3D", boxShadow: "0 4px 14px rgba(255, 159, 26, 0.3)" }
                : { background: "#F6F8FC", border: "1px solid #E6ECF5", color: "#4A5878" }}>
              <f.icon className="w-3.5 h-3.5" />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="divide-y" style={{ borderColor: "#E6ECF5" }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#CC7A00" }} />
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-16" style={{ color: "#8A97B5" }}>
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-bold text-sm">No members found for this scope.</p>
            <p className="text-xs mt-1">{scopeFilter === "country" ? "You may be the only member from your country!" : "Try a different filter."}</p>
          </div>
        ) : (
          leaderboard.map((warrior, index) => {
            const isCurrentUser = warrior.email === currentUser?.email;
            const isTop3 = index < 3;
            const barWidth = topScore > 0 ? Math.max(4, Math.round(((warrior.glow_score || 0) / topScore) * 100)) : 0;

            return (
              <Link key={warrior.id || warrior.email} to={createPageUrl("Profile") + `?user=${encodeURIComponent(warrior.email)}`}
                className="flex items-center gap-4 px-5 py-4 transition-all group"
                style={isCurrentUser ? { background: "rgba(255,208,0,0.04)", borderLeft: "2px solid #CC7A00" } : {}}>
                <div className="w-10 shrink-0 flex items-center justify-center">
                  <MedalOrRank index={index} isCurrentUser={isCurrentUser} />
                </div>
                <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border-2" style={{ borderColor: isTop3 ? "#FFE4A0" : "#E6ECF5" }}>
                  <img src={warrior.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" alt={getDisplayName(warrior)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-sm truncate" style={{ color: isCurrentUser ? "#CC7A00" : "#0B1B3D" }}>{getDisplayName(warrior)}</span>
                    {isCurrentUser && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0" style={{ background: "rgba(255,208,0,0.12)", border: "1px solid #FFE4A0", color: "#CC7A00" }}>You</span>}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "#8A97B5" }}>
                    {warrior.country && <><MapPin className="w-2.5 h-2.5" style={{ color: "#1FB8FF" }} /><span>{warrior.country}</span></>}
                    {warrior.city && <><span>·</span><span>{warrior.city}</span></>}
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full overflow-hidden w-full max-w-[200px]" style={{ background: "#E6ECF5" }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${barWidth}%`, background: isTop3 || isCurrentUser ? "#CC7A00" : "#1FB8FF" }} />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xl font-black font-['Space_Grotesk']" style={{ color: isTop3 || isCurrentUser ? "#CC7A00" : "#0B1B3D" }}>
                    {(warrior.glow_score || 0).toLocaleString()}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider font-bold flex items-center gap-0.5 justify-end" style={{ color: "#8A97B5" }}>
                    <Zap className="w-2.5 h-2.5" style={{ color: "#CC7A00" }} /> XP
                  </div>
                </div>
                <ArrowUp className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition shrink-0" style={{ color: "#0B3FD9" }} />
              </Link>
            );
          })
        )}
      </div>

      {leaderboard.length > 0 && (
        <div className="px-5 py-4 border-t grid grid-cols-3 gap-4" style={{ borderColor: "#E6ECF5", background: "#F6F8FC" }}>
          <div className="text-center">
            <div className="text-lg font-black" style={{ color: "#CC7A00" }}>{leaderboard.length}</div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: "#8A97B5" }}>Ranked</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black" style={{ color: "#0B3FD9" }}>{topScore.toLocaleString()}</div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: "#8A97B5" }}>Top Score</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black" style={{ color: "#6B7FA0" }}>
              {leaderboard.length > 0 ? Math.round(leaderboard.reduce((s, u) => s + (u.glow_score || 0), 0) / leaderboard.length) : 0}
            </div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: "#8A97B5" }}>Avg XP</div>
          </div>
        </div>
      )}
    </div>
  );
}