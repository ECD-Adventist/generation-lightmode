import React from "react";
import { Flame, CalendarCheck } from "lucide-react";

export default function StreakSummaryCard({ user }) {
  const checkInStreak = user?.daily_checkin_streak || user?.streak_count || 1;
  const checkInBest = Math.max(checkInStreak, user?.longest_checkin_streak || 0);
  const postingStreak = user?.posting_streak_count || 0;
  const postingBest = Math.max(postingStreak, user?.longest_posting_streak || 0);

  return (
    <div className="bg-gradient-to-br from-[#1A1500] to-[#121826] border border-[#FFD000]/20 rounded-3xl p-6 shadow-[0_0_30px_rgba(255,208,0,0.1)]">
      <div className="flex items-center gap-2 mb-4">
        <Flame size={18} className="text-[#FFD000]" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#FFD000]">Streak Center</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-2xl bg-black/20 border border-white/5 p-4 text-center">
          <div className="text-3xl font-black text-white">{checkInStreak}</div>
          <div className="text-xs text-gray-400 mt-1">Daily check-ins</div>
          <div className="text-[11px] text-[#FFD000] mt-2">Best: {checkInBest}</div>
        </div>
        <div className="rounded-2xl bg-black/20 border border-white/5 p-4 text-center">
          <div className="text-3xl font-black text-white">{postingStreak}</div>
          <div className="text-xs text-gray-400 mt-1">Posting days</div>
          <div className="text-[11px] text-[#00CFFF] mt-2">Best: {postingBest}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-300 rounded-2xl bg-[#FFD000]/10 border border-[#FFD000]/20 px-4 py-3">
        <CalendarCheck className="w-4 h-4 text-[#FFD000]" />
        Open the dashboard daily and keep posting to grow both streaks.
      </div>
    </div>
  );
}