import React from "react";
import { Flame, Share2, Sparkles, Globe, Building2, CheckCircle2 } from "lucide-react";

const rankConfig = [
  { min: 1000, name: "Beacon", color: "#FFD000", bg: "from-[#FFD000]/20 to-[#FF9F1A]/10" },
  { min: 500, name: "Flame", color: "#FF8A00", bg: "from-[#FF8A00]/20 to-[#FFD000]/10" },
  { min: 100, name: "Spark", color: "#00CFFF", bg: "from-[#00CFFF]/20 to-[#8A5CFF]/10" },
  { min: 0, name: "Seed", color: "#8A5CFF", bg: "from-[#8A5CFF]/20 to-[#00CFFF]/10" }
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 mb-8">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${rank.bg} p-5`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-gray-400 font-bold">Glow Rank</div>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-black/20">
                <Sparkles className="w-4 h-4" style={{ color: rank.color }} />
                <span className="font-bold text-white">{rank.name}</span>
              </div>
              <div className="text-sm text-gray-300 mt-3">You have {glowScore} total glow points.</div>
            </div>
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
                <circle cx="40" cy="40" r="34" stroke="#00CFFF" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
              </svg>
              <div className="absolute text-center">
                <div className="text-lg font-black text-white leading-none">{glowScore}</div>
                <div className="text-[10px] uppercase text-gray-400">score</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#FFD000]/20 bg-gradient-to-br from-[#FFD000]/10 to-[#FF8A00]/5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-gray-400 font-bold">Faith Streak</div>
              <div className="mt-2 text-3xl font-black text-white flex items-center gap-2">
                <Flame className="w-6 h-6 text-[#FFD000]" /> {streak} days
              </div>
              <div className="text-sm text-gray-300 mt-2">Keep showing up daily to keep the fire burning.</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#FFD000]/15 border border-[#FFD000]/30 flex items-center justify-center">
              <Flame className="w-6 h-6 text-[#FFD000]" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:col-span-2">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.25em] text-gray-400 font-bold">Profile Completion</div>
              <div className="text-white font-bold mt-1">{profileCompletion}% complete</div>
            </div>
            <div className="text-sm text-[#00CFFF] font-bold">{nextLevelXp} XP to next level</div>
          </div>
          <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden mb-3">
            <div className="h-full bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF]" style={{ width: `${profileCompletion}%` }} />
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-gray-300">
            {!!user?.country && <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 inline-flex items-center gap-1.5"><Globe className="w-3 h-3 text-[#00CFFF]" /> {user.country}</span>}
            {!!user?.website_url && <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 inline-flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-[#00CFFF]" /> Website added</span>}
            {!!user?.bio && <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 inline-flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-[#00CFFF]" /> Bio added</span>}
            <button onClick={onShare} className="px-3 py-1 rounded-full bg-[#00CFFF]/10 border border-[#00CFFF]/20 inline-flex items-center gap-1.5 text-[#00CFFF] font-semibold hover:bg-[#00CFFF]/15 transition">
              <Share2 className="w-3 h-3" /> Share profile
            </button>
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 inline-flex items-center gap-1.5"><Building2 className="w-3 h-3 text-[#FFD000]" /> {user?.role || "Member"}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="text-[11px] uppercase tracking-[0.25em] text-gray-400 font-bold mb-3">Recent Activity</div>
        <div className="space-y-3">
          {recentActivity.map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <div className="text-sm text-white font-semibold">{item.label}</div>
                <div className="text-xs text-gray-400">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}