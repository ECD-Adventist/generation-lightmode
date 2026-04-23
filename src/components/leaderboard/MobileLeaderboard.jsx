import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Trophy, TrendingUp, MapPin, Flame } from "lucide-react";
import GlobalGlowLeaderboard from "@/components/leaderboard/GlobalGlowLeaderboard";
import MobilePageHeader from "@/components/mobile/MobilePageHeader";

export default function MobileLeaderboard({ user, leaderboard, timeFilter, setTimeFilter, likesPerUser }) {
  const filters = [
    { id: "all-time", label: "All Time", icon: Flame },
    { id: "top-liked", label: "Top Liked", icon: TrendingUp },
    { id: "my-region", label: "My Region", icon: MapPin },
  ];
  const getMedal = (i) => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;

  return (
    <div className="min-h-screen pb-24 font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      <MobilePageHeader title="Leaderboard" subtitle="Top Light Warriors" />

      <div className="px-3 py-4 space-y-4">
        {/* Hero card */}
        <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #FFF8E6 0%, #FFF0CC 100%)", border: "1px solid #FFE4A0" }}>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4" style={{ color: "#CC7A00" }} />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#CC7A00" }}>Light Leaderboard</span>
          </div>
          <h2 className="text-2xl font-black leading-tight" style={{ fontFamily: "Space Grotesk, sans-serif", color: "#0B1B3D" }}>Top Light Warriors</h2>
          <p className="text-[12px] mt-1" style={{ color: "#8B6914" }}>Celebrating the most impactful believers.</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setTimeFilter(f.id)}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition"
              style={timeFilter === f.id
                ? { background: "linear-gradient(90deg, #FFD000, #FF9F1A)", color: "#0B1B3D", boxShadow: "0 4px 12px rgba(255,159,26,0.3)" }
                : { background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#4A5878" }}
            >
              <f.icon className="w-3.5 h-3.5" /> {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        {leaderboard.length === 0 ? (
          <div className="text-center py-12 rounded-2xl" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#8A97B5" }}>
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-bold text-sm" style={{ color: "#0B1B3D" }}>No warriors yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((w, index) => {
              const medal = getMedal(index);
              const isMe = w.email === user.email;
              const isTop = index < 3;
              return (
                <Link
                  key={w.id}
                  to={createPageUrl("Profile") + `?user=${encodeURIComponent(w.email)}`}
                  className="flex items-center gap-3 p-3 rounded-2xl transition active:scale-[0.99]"
                  style={isMe
                    ? { background: "linear-gradient(135deg, rgba(255,208,0,0.1), rgba(255,208,0,0.02))", border: "1px solid #FFE4A0" }
                    : { background: "#FFFFFF", border: `1px solid ${isTop ? "#D6E4FF" : "#E6ECF5"}` }}
                >
                  <div className="w-9 text-center shrink-0">
                    {medal ? <span className="text-2xl">{medal}</span> : <span className="text-[13px] font-black" style={{ color: isMe ? "#CC7A00" : "#8A97B5", fontFamily: "Space Grotesk, sans-serif" }}>#{index + 1}</span>}
                  </div>
                  <div className="w-11 h-11 rounded-full overflow-hidden shrink-0" style={{ border: `2px solid ${isTop ? "#FFE4A0" : "#E6ECF5"}` }}>
                    <img src={w.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" alt={w.full_name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-[14px] truncate" style={{ color: "#0B1B3D" }}>{w.full_name}</h3>
                      {isMe && <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full shrink-0" style={{ background: "rgba(255,208,0,0.15)", color: "#CC7A00" }}>You</span>}
                    </div>
                    {w.country && (
                      <div className="flex items-center gap-1 text-[11px] mt-0.5" style={{ color: "#6B7FA0" }}>
                        <MapPin className="w-3 h-3" style={{ color: "#1FB8FF" }} />
                        <span className="truncate">{w.country}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-black leading-none" style={{ color: isMe ? "#CC7A00" : "#0B1B3D", fontFamily: "Space Grotesk, sans-serif" }}>
                      {timeFilter === "top-liked" ? (likesPerUser[w.email] || 0) : (w.glow_score || 0)}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider font-bold mt-0.5" style={{ color: "#8A97B5" }}>
                      {timeFilter === "top-liked" ? "Likes" : "XP"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="pt-2">
          <GlobalGlowLeaderboard currentUser={user} />
        </div>
      </div>
    </div>
  );
}