import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Trophy, TrendingUp, MapPin, Zap, Home, Bell, User, Globe, ArrowUp, Flame, ArrowLeft, Heart } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { differenceInDays } from "date-fns";

export default function Leaderboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [timeFilter, setTimeFilter] = useState("all-time");

  useEffect(() => {
    base44.auth.isAuthenticated().then((isAuth) => {
      if (isAuth) base44.auth.me().then(setUser);
      else base44.auth.redirectToLogin(window.location.pathname);
    });
  }, []);

  const { data: users = [] } = useQuery({
    queryKey: ["leaderboardUsers"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data;
    },
    enabled: !!user,
  });

  const { data: drops = [] } = useQuery({
    queryKey: ["allGlowDrops"],
    queryFn: () => base44.entities.GlowDrop.list('-created_date', 500),
    enabled: !!user,
  });

  // Calculate total likes per user
  const likesPerUser = useMemo(() => {
    const map = {};
    drops.forEach(d => { map[d.user_email] = (map[d.user_email] || 0) + (d.likes_count || 0); });
    return map;
  }, [drops]);

  const leaderboard = useMemo(() => {
    let filteredUsers = users;
    if (timeFilter === "my-region") {
      filteredUsers = users.filter(u => u.country === user?.country);
    } else if (timeFilter === "top-liked") {
      return [...filteredUsers].sort((a, b) => (likesPerUser[b.email] || 0) - (likesPerUser[a.email] || 0));
    }

    return [...filteredUsers].sort((a, b) => (b.glow_score || 0) - (a.glow_score || 0));
  }, [users, timeFilter, user?.country, likesPerUser]);

  const getMedalEmoji = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return null;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <Trophy className="w-10 h-10 text-[#FFD000] animate-pulse" />
          <span className="text-gray-400">Loading leaderboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition" title="Go back">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Link to={createPageUrl("Home")} className="flex items-center gap-2 shrink-0">
              <img
                src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png"
                alt="LightMode"
                style={{ height: 96, width: "auto", filter: "drop-shadow(0 0 6px rgba(0,207,255,0.5))" }}
              />
            </Link>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            <Link to={createPageUrl("Feed")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Home className="w-4 h-4" /><span className="hidden sm:inline">Feed</span>
            </Link>
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Zap className="w-4 h-4" /><span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link to={createPageUrl("GlobalReach")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Globe className="w-4 h-4" /><span className="hidden sm:inline">Reach</span>
            </Link>
            <Link to={createPageUrl("Notifications")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Bell className="w-4 h-4" /><span className="hidden sm:inline">Alerts</span>
            </Link>
            <Link to={createPageUrl("Profile")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <User className="w-4 h-4" /><span className="hidden sm:inline">Profile</span>
            </Link>
            <Link to={createPageUrl("Home")} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-500 hover:text-[#00CFFF] hover:bg-white/5 transition text-sm font-medium border border-white/5">
              <Globe className="w-4 h-4" /> Website
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFD000]/10 border border-[#FFD000]/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#FFD000] animate-pulse"></span>
            <span className="text-[#FFD000] text-xs font-bold tracking-wider uppercase">Light Leaderboard</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 justify-between">
            <div>
              <h1 className="text-5xl font-bold font-['Space_Grotesk'] text-transparent bg-clip-text bg-gradient-to-r from-[#FFD000] to-[#00CFFF] mb-2">
                Top Light Warriors
              </h1>
              <p className="text-gray-400 text-lg">Celebrating the most impactful believers in our movement.</p>
            </div>
            <div className="flex gap-2">
              {[
                { id: "all-time", label: "All Time", icon: Flame },
                { id: "top-liked", label: "Top Liked", icon: TrendingUp },
                { id: "my-region", label: "My Region", icon: MapPin }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setTimeFilter(filter.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    timeFilter === filter.id
                      ? "bg-gradient-to-r from-[#FFD000] to-[#FFD000] text-black shadow-[0_0_20px_rgba(255,208,0,0.5)]"
                      : "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <filter.icon className="w-4 h-4" />
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="space-y-3">
          {leaderboard.length === 0 ? (
            <div className="text-center py-20 text-gray-500 bg-[#121826]/50 rounded-3xl border border-white/5">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-bold text-lg">No warriors found for this filter.</p>
              <p className="text-sm mt-1">Check back soon or adjust your filters!</p>
            </div>
          ) : (
            leaderboard.map((warrior, index) => {
              const medal = getMedalEmoji(index);
              const isCurrentUser = warrior.email === user.email;
              const isTopThree = index < 3;
              return (
                <Link
                  key={warrior.id}
                  to={createPageUrl("Profile") + `?user=${encodeURIComponent(warrior.email)}`}
                  className={`flex items-center gap-4 p-5 rounded-2xl border transition-all hover:border-[#FFD000]/60 group ${
                    isCurrentUser
                      ? "bg-gradient-to-r from-[#FFD000]/20 to-[#FFD000]/5 border-[#FFD000]/40 shadow-[0_0_20px_rgba(255,208,0,0.15)]"
                      : isTopThree
                      ? "bg-gradient-to-r from-white/5 to-transparent border-white/20"
                      : "bg-[#121826] border-white/10"
                  }`}
                >
                  {/* Rank */}
                  <div className="text-center shrink-0 w-12">
                    {medal ? (
                      <span className="text-4xl">{medal}</span>
                    ) : (
                      <span className={`text-lg font-black font-['Space_Grotesk'] ${isCurrentUser ? "text-[#FFD000]" : "text-gray-500"}`}>
                        #{index + 1}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className={`w-14 h-14 rounded-full overflow-hidden flex items-center justify-center shrink-0 border-2 ${
                    isTopThree ? "border-[#FFD000]/60" : "border-white/10"
                  }`}>
                    <img
                      src={warrior.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                      className="w-full h-full object-cover"
                      alt={warrior.full_name}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-white text-lg truncate">{warrior.full_name}</h3>
                      {isCurrentUser && (
                        <span className="px-2 py-0.5 bg-[#FFD000]/20 border border-[#FFD000]/40 text-[#FFD000] text-xs font-bold rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      {warrior.country && (
                        <>
                          <MapPin className="w-4 h-4 text-[#00CFFF]" />
                          <span>{warrior.country}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <div className={`text-3xl font-black font-['Space_Grotesk'] ${isCurrentUser ? "text-[#FFD000]" : "text-white"}`}>
                      {timeFilter === "top-liked" ? (likesPerUser[warrior.email] || 0) : (warrior.glow_score || 0)}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                      {timeFilter === "top-liked" ? "LIKES" : "XP"}
                    </div>
                    {timeFilter !== "top-liked" && (likesPerUser[warrior.email] || 0) > 0 && (
                      <div className="text-[10px] text-red-400 mt-0.5 flex items-center gap-0.5 justify-end">
                        ❤️ {likesPerUser[warrior.email]} likes
                      </div>
                    )}
                  </div>

                  {/* Hover Arrow */}
                  <ArrowUp className={`w-4 h-4 text-[#00CFFF] opacity-0 group-hover:opacity-100 transition shrink-0 ${isTopThree ? "text-[#FFD000]" : ""}`} />
                </Link>
              );
            })
          )}
        </div>

        {/* Stats Footer */}
        <div className="mt-12 grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-[#FFD000]/10 to-transparent border border-[#FFD000]/20 rounded-2xl p-6 text-center">
            <div className="text-3xl font-black text-[#FFD000] font-['Space_Grotesk'] mb-1">
              {leaderboard.length}
            </div>
            <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Ranked Warriors</div>
          </div>
          <div className="bg-gradient-to-br from-[#00CFFF]/10 to-transparent border border-[#00CFFF]/20 rounded-2xl p-6 text-center">
            <div className="text-3xl font-black text-[#00CFFF] font-['Space_Grotesk'] mb-1">
              {leaderboard[0]?.glow_score || 0}
            </div>
            <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Top Score</div>
          </div>
          <div className="bg-gradient-to-br from-[#8A5CFF]/10 to-transparent border border-[#8A5CFF]/20 rounded-2xl p-6 text-center">
            <div className="text-3xl font-black text-[#8A5CFF] font-['Space_Grotesk'] mb-1">
              {leaderboard[leaderboard.length - 1]?.glow_score || 0}
            </div>
            <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Lowest Ranked</div>
          </div>
        </div>
      </div>
    </div>
  );
}