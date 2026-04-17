import React from "react";
import { Flame, CalendarCheck } from "lucide-react";

export default function StreakSummaryCard({ user }) {
  const checkInStreak = user?.daily_checkin_streak || user?.streak_count || 1;
  const checkInBest = Math.max(checkInStreak, user?.longest_checkin_streak || 0);
  const postingStreak = user?.posting_streak_count || 0;
  const postingBest = Math.max(postingStreak, user?.longest_posting_streak || 0);

  return (
    <div className="rounded-[1.75rem] p-6 font-['Inter']" style={{ background: "linear-gradient(135deg, #FFF8E6 0%, #FFF0CC 100%)", border: "1px solid #FFE4A0", boxShadow: "0 4px 16px rgba(255, 159, 26, 0.1)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Flame size={18} style={{ color: "#FF9F1A" }} />
        <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: "#CC7A00" }}>Streak Center</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-2xl p-4 text-center" style={{ background: "#FFFFFF", border: "1px solid #FFE4A0" }}>
          <div className="text-3xl font-black" style={{ color: "#0B1B3D" }}>{checkInStreak}</div>
          <div className="text-xs mt-1" style={{ color: "#6B7FA0" }}>Daily check-ins</div>
          <div className="text-[11px] mt-2" style={{ color: "#CC7A00" }}>Best: {checkInBest}</div>
        </div>
        <div className="rounded-2xl p-4 text-center" style={{ background: "#FFFFFF", border: "1px solid #FFE4A0" }}>
          <div className="text-3xl font-black" style={{ color: "#0B1B3D" }}>{postingStreak}</div>
          <div className="text-xs mt-1" style={{ color: "#6B7FA0" }}>Posting days</div>
          <div className="text-[11px] mt-2" style={{ color: "#0B3FD9" }}>Best: {postingBest}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs rounded-2xl px-4 py-3" style={{ background: "#FFFFFF", border: "1px solid #FFE4A0", color: "#8B6914" }}>
        <CalendarCheck className="w-4 h-4" style={{ color: "#FF9F1A" }} />
        Open the dashboard daily and keep posting to grow both streaks.
      </div>
    </div>
  );
}