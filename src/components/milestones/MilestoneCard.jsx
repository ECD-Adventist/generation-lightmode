import React from "react";

export default function MilestoneCard({ milestone, earned }) {
  const progress = Math.min(100, Math.round((milestone.value / milestone.target) * 100));

  return (
    <div className="rounded-3xl p-5 transition-all hover:-translate-y-1" style={earned ? { background: "#FFFFFF", border: "1px solid #B8E5FF", boxShadow: "0 4px 16px rgba(31, 184, 255, 0.1)" } : { background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.04)" }}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-lg font-bold" style={{ color: "#0B1B3D" }}>{milestone.title}</div>
          <div className="text-sm mt-1" style={{ color: "#6B7FA0" }}>{milestone.description}</div>
        </div>
        <div className="px-3 py-1 rounded-full text-xs font-bold" style={earned ? { background: "rgba(31, 184, 255, 0.1)", color: "#0B3FD9", border: "1px solid #B8E5FF" } : { background: "#F6F8FC", color: "#4A5878", border: "1px solid #E6ECF5" }}>
          {earned ? "Unlocked" : `+${milestone.rewardXp} XP`}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between text-sm">
        <span style={{ color: "#6B7FA0" }}>Progress</span>
        <span className="font-semibold" style={{ color: "#0B1B3D" }}>{Math.min(milestone.value, milestone.target)} / {milestone.target}</span>
      </div>

      <div className="w-full h-2 rounded-full overflow-hidden mb-3" style={{ background: "#EEF3FF" }}>
        <div className="h-full rounded-full" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)" }} />
      </div>

      <div className="text-xs" style={{ color: "#8A97B5" }}>Reward: {milestone.rewardXp} XP</div>
    </div>
  );
}