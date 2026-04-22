import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Trophy, TrendingUp, MapPin, Zap, Home, Bell, User, Globe, ArrowUp, Flame, Heart } from "lucide-react";
import GlobalGlowLeaderboard from "@/components/leaderboard/GlobalGlowLeaderboard";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function Leaderboard() {
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
    queryFn: async () => { const res = await base44.functions.invoke("listPublicUsers", {}); return res.data; },
    enabled: !!user,
  });

  const { data: drops = [] } = useQuery({
    queryKey: ["allGlowDrops"],
    queryFn: () => base44.entities.GlowDrop.list('-created_date', 500),
    enabled: !!user,
  });

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

  const getMedalEmoji = (index) => index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : null;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F8FC" }}>
        <div className="flex flex-col items-center gap-3">
          <Trophy className="w-10 h-10 animate-pulse" style={{ color: "#CC7A00" }} />
          <span style={{ color: "#6B7FA0" }}>Loading leaderboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: "rgba(246, 248, 252, 0.92)", borderColor: "#E2E8F0" }}>
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link to={createPageUrl("Home")} className="shrink-0">
            <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b1d36c3f0_LOGO-LANDSCAPE-BLUE.png" alt="LightMode" style={{ height: 48, width: "auto" }} />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            {[
              { to: "Feed", icon: <Home className="w-4 h-4" />, label: "Feed" },
              { to: "Dashboard", icon: <Zap className="w-4 h-4" />, label: "Dashboard" },
              { to: "GlobalReach", icon: <Globe className="w-4 h-4" />, label: "Reach" },
              { to: "Notifications", icon: <Bell className="w-4 h-4" />, label: "Alerts" },
              { to: "Profile", icon: <User className="w-4 h-4" />, label: "Profile" },
            ].map(item => (
              <Link key={item.to} to={createPageUrl(item.to)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition text-sm font-semibold" style={{ color: "#4A5878" }}
                onMouseOver={e => { e.currentTarget.style.background = "#EEF3FF"; e.currentTarget.style.color = "#0B3FD9"; }}
                onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4A5878"; }}>
                {item.icon}<span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ background: "rgba(255, 208, 0, 0.08)", border: "1px solid #FFE4A0" }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#CC7A00" }}></span>
            <span className="text-xs font-bold tracking-wider uppercase" style={{ color: "#CC7A00" }}>Light Leaderboard</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 justify-between">
            <div>
              <h1 className="text-5xl font-bold font-['Space_Grotesk'] mb-2 text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg, #CC7A00, #0B3FD9)" }}>
                Top Light Warriors
              </h1>
              <p className="text-lg" style={{ color: "#6B7FA0" }}>Celebrating the most impactful believers in our movement.</p>
            </div>
            <div className="flex gap-2">
              {[
                { id: "all-time", label: "All Time", icon: Flame },
                { id: "top-liked", label: "Top Liked", icon: TrendingUp },
                { id: "my-region", label: "My Region", icon: MapPin }
              ].map(filter => (
                <button key={filter.id} onClick={() => setTimeFilter(filter.id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap"
                  style={timeFilter === filter.id
                    ? { background: "linear-gradient(90deg, #FFD000, #FF9F1A)", color: "#0B1B3D", boxShadow: "0 4px 14px rgba(255, 159, 26, 0.3)" }
                    : { background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#4A5878" }}>
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
            <div className="text-center py-20 rounded-3xl" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#8A97B5" }}>
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
                <Link key={warrior.id} to={createPageUrl("Profile") + `?user=${encodeURIComponent(warrior.email)}`}
                  className="flex items-center gap-4 p-5 rounded-2xl border transition-all group"
                  style={isCurrentUser
                    ? { background: "linear-gradient(135deg, rgba(255,208,0,0.08), rgba(255,208,0,0.02))", border: "1px solid #FFE4A0" }
                    : isTopThree
                    ? { background: "#FFFFFF", border: "1px solid #D6E4FF" }
                    : { background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
                  <div className="text-center shrink-0 w-12">
                    {medal ? <span className="text-4xl">{medal}</span> : <span className="text-lg font-black font-['Space_Grotesk']" style={{ color: isCurrentUser ? "#CC7A00" : "#8A97B5" }}>#{index + 1}</span>}
                  </div>
                  <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2" style={{ borderColor: isTopThree ? "#FFE4A0" : "#E6ECF5" }}>
                    <img src={warrior.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" alt={warrior.full_name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg truncate" style={{ color: "#0B1B3D" }}>{warrior.full_name}</h3>
                      {isCurrentUser && <span className="px-2 py-0.5 text-xs font-bold rounded-full" style={{ background: "rgba(255, 208, 0, 0.12)", border: "1px solid #FFE4A0", color: "#CC7A00" }}>You</span>}
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: "#6B7FA0" }}>
                      {warrior.country && <><MapPin className="w-4 h-4" style={{ color: "#1FB8FF" }} /><span>{warrior.country}</span></>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-3xl font-black font-['Space_Grotesk']" style={{ color: isCurrentUser ? "#CC7A00" : "#0B1B3D" }}>
                      {timeFilter === "top-liked" ? (likesPerUser[warrior.email] || 0) : (warrior.glow_score || 0)}
                    </div>
                    <div className="text-xs uppercase tracking-wider font-semibold" style={{ color: "#8A97B5" }}>
                      {timeFilter === "top-liked" ? "LIKES" : "XP"}
                    </div>
                    {timeFilter !== "top-liked" && (likesPerUser[warrior.email] || 0) > 0 && (
                      <div className="text-[10px] mt-0.5 flex items-center gap-0.5 justify-end" style={{ color: "#EF4444" }}>❤️ {likesPerUser[warrior.email]} likes</div>
                    )}
                  </div>
                  <ArrowUp className="w-4 h-4 opacity-0 group-hover:opacity-100 transition shrink-0" style={{ color: "#0B3FD9" }} />
                </Link>
              );
            })
          )}
        </div>

        <div className="mt-12 mb-10">
          <GlobalGlowLeaderboard currentUser={user} />
        </div>

        {/* Stats Footer */}
        <div className="mt-12 grid grid-cols-3 gap-4">
          {[
            { value: leaderboard.length, label: "Ranked Warriors", color: "#CC7A00", bg: "rgba(255,208,0,0.06)", border: "#FFE4A0" },
            { value: leaderboard[0]?.glow_score || 0, label: "Top Score", color: "#0B3FD9", bg: "rgba(31,184,255,0.06)", border: "#B8E5FF" },
            { value: leaderboard[leaderboard.length - 1]?.glow_score || 0, label: "Lowest Ranked", color: "#6B7FA0", bg: "#F6F8FC", border: "#E6ECF5" },
          ].map((stat, i) => (
            <div key={i} className="rounded-2xl p-6 text-center" style={{ background: stat.bg, border: `1px solid ${stat.border}` }}>
              <div className="text-3xl font-black font-['Space_Grotesk'] mb-1" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-sm uppercase tracking-wider font-semibold" style={{ color: "#8A97B5" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}