import React from "react";
import { Flame, Share2, Sparkles, Globe, Building2, CheckCircle2 } from "lucide-react";

const rankConfig = [
  { min: 5000, name: "Radiance", color: "#8A5CFF", bg: "linear-gradient(135deg, #F3EEFF 0%, #E8DDFF 100%)", border: "#D6C5FF" },
  { min: 1000, name: "Beacon", color: "#FFD000", bg: "linear-gradient(135deg, #FFF8E6 0%, #FFF0CC 100%)", border: "#FFE4A0" },
  { min: 500, name: "Flame", color: "#FF8A00", bg: "linear-gradient(135deg, #FFF3E6 0%, #FFE6CC 100%)", border: "#FFD0A0" },
  { min: 100, name: "Spark", color: "#1FB8FF", bg: "linear-gradient(135deg, #EEF8FF 0%, #DDF0FF 100%)", border: "#B8E5FF" },
  { min: 0, name: "Seed", color: "#0B3FD9", bg: "linear-gradient(135deg, #EEF3FF 0%, #DDE7FB 100%)", border: "#D6E4FF" }
];

export function getGlowRank(score = 0) {
  return rankConfig.find((rank) => score >= rank.min) || rankConfig[rankConfig.length - 1];
}

export default function ProfileHighlights({
  user,
  profileCompletion,
  nextLevelXp,
  recentActivity,
  onShare,
}) {
  const glowScore = user?.glow_score || 0;
  const streak = user?.faith_streak_count || 0;
  const rank = getGlowRank(glowScore);
  const circumference = 2 * Math.PI * 34;
  const progress = Math.min(glowScore % 100, 100);
  const offset = circumference - (progress / 100) * circumference;

  const cardStyle = { background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 mb-8">
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Glow Rank card */}
        <div className="rounded-[1.5rem] p-5" style={{ background: rank.bg, border: `1px solid ${rank.border}`, boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] font-bold" style={{ color: "#6B7FA0" }}>Glow Rank</div>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
                <Sparkles className="w-4 h-4" style={{ color: rank.color }} />
                <span className="font-bold" style={{ color: "#0B1B3D" }}>{rank.name}</span>
              </div>
              <div className="text-sm mt-3" style={{ color: "#3A4A6B" }}>You have {glowScore} total glow points.</div>
            </div>
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" stroke="#E6ECF5" strokeWidth="6" fill="none" />
                <circle cx="40" cy="40" r="34" stroke="#0B3FD9" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
              </svg>
              <div className="absolute text-center">
                <div className="text-lg font-black leading-none" style={{ color: "#0B1B3D" }}>{glowScore}</div>
                <div className="text-[10px] uppercase" style={{ color: "#8A97B5" }}>score</div>
              </div>
            </div>
          </div>
        </div>

        {/* Faith Streak card */}
        <div className="rounded-[1.5rem] p-5" style={{ background: "linear-gradient(135deg, #FFF8E6 0%, #FFF0CC 100%)", border: "1px solid #FFE4A0", boxShadow: "0 4px 16px rgba(255, 159, 26, 0.1)" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] font-bold" style={{ color: "#8B6914" }}>Faith Streak</div>
              <div className="mt-2 text-3xl font-black flex items-center gap-2" style={{ color: "#0B1B3D" }}>
                <Flame className="w-6 h-6" style={{ color: "#FF9F1A" }} /> {streak} days
              </div>
              <div className="text-sm mt-2" style={{ color: "#3A4A6B" }}>Keep showing up daily to keep the fire burning.</div>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#FFFFFF", border: "1px solid #FFD000", boxShadow: "0 2px 8px rgba(255, 208, 0, 0.2)" }}>
              <Flame className="w-6 h-6" style={{ color: "#FF9F1A" }} />
            </div>
          </div>
        </div>

        {/* Profile Completion card */}
        <div className="rounded-[1.5rem] p-5 sm:col-span-2" style={cardStyle}>
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] font-bold" style={{ color: "#6B7FA0" }}>Profile Completion</div>
              <div className="font-bold mt-1" style={{ color: "#0B1B3D" }}>{profileCompletion}% complete</div>
            </div>
            <div className="text-sm font-bold" style={{ color: "#0B3FD9" }}>{nextLevelXp} XP to next level</div>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden mb-3" style={{ background: "#EEF3FF" }}>
            <div className="h-full" style={{ width: `${profileCompletion}%`, background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)" }} />
          </div>
          <div className="flex flex-wrap gap-2 text-xs" style={{ color: "#3A4A6B" }}>
            {!!user?.country && <span className="px-3 py-1 rounded-full inline-flex items-center gap-1.5" style={{ background: "#EEF3FF", border: "1px solid #D6E4FF" }}><Globe className="w-3 h-3" style={{ color: "#1FB8FF" }} /> {user.country}</span>}
            {!!user?.website_url && <span className="px-3 py-1 rounded-full inline-flex items-center gap-1.5" style={{ background: "#EEF3FF", border: "1px solid #D6E4FF" }}><CheckCircle2 className="w-3 h-3" style={{ color: "#1FB8FF" }} /> Website added</span>}
            {!!user?.bio && <span className="px-3 py-1 rounded-full inline-flex items-center gap-1.5" style={{ background: "#EEF3FF", border: "1px solid #D6E4FF" }}><CheckCircle2 className="w-3 h-3" style={{ color: "#1FB8FF" }} /> Bio added</span>}
            <button onClick={onShare} className="px-3 py-1 rounded-full inline-flex items-center gap-1.5 font-semibold transition" style={{ background: "rgba(31, 184, 255, 0.1)", border: "1px solid #B8E5FF", color: "#0B3FD9" }}>
              <Share2 className="w-3 h-3" /> Share profile
            </button>
            <span className="px-3 py-1 rounded-full inline-flex items-center gap-1.5" style={{ background: "rgba(255, 208, 0, 0.12)", border: "1px solid #FFE4A0", color: "#CC7A00" }}><Building2 className="w-3 h-3" /> {user?.role || "Member"}</span>
          </div>
        </div>
      </div>

      {/* Recent Activity card */}
      <div className="rounded-[1.5rem] p-5" style={cardStyle}>
        <div className="text-[11px] uppercase tracking-[0.25em] font-bold mb-3" style={{ color: "#6B7FA0" }}>Recent Activity</div>
        <div className="space-y-3">
          {recentActivity.map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ background: "#EEF3FF", border: "1px solid #D6E4FF" }}>
                {item.icon}
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "#0B1B3D" }}>{item.label}</div>
                <div className="text-xs" style={{ color: "#6B7FA0" }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}