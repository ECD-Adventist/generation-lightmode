import React from "react";

export default function MilestoneCard({ milestone, earned }) {
  const progress = Math.min(100, Math.round((milestone.value / milestone.target) * 100));

  return (
    <div className={`rounded-3xl border p-5 transition-all hover:-translate-y-1 ${earned ? "bg-[#121826] border-[#00CFFF]/30 shadow-[0_0_24px_rgba(0,207,255,0.12)]" : "bg-[#121826] border-white/10"}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-lg font-bold text-white">{milestone.title}</div>
          <div className="text-sm text-gray-400 mt-1">{milestone.description}</div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${earned ? "bg-[#00CFFF]/15 text-[#00CFFF]" : "bg-white/10 text-gray-300"}`}>
          {earned ? "Unlocked" : `+${milestone.rewardXp} XP`}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="text-gray-400">Progress</span>
        <span className="text-white font-semibold">{Math.min(milestone.value, milestone.target)} / {milestone.target}</span>
      </div>

      <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden mb-3">
        <div className="h-full bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF]" style={{ width: `${progress}%` }} />
      </div>

      <div className="text-xs text-gray-500">Reward: {milestone.rewardXp} XP</div>
    </div>
  );
}