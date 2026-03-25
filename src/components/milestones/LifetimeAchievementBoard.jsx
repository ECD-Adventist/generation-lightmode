import React from "react";

export default function LifetimeAchievementBoard({ achievements }) {
  return (
    <div className="bg-[#121826] border border-white/10 rounded-3xl p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Lifetime Achievement Board</h2>
        <p className="text-gray-400 mt-2">Track your long-term badge progress across faith, consistency, and community.</p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {achievements.map((achievement) => {
          const progress = Math.min(100, Math.round((achievement.value / achievement.target) * 100));
          const unlocked = achievement.value >= achievement.target;

          return (
            <div key={achievement.key} className={`rounded-2xl border p-5 ${unlocked ? "bg-gradient-to-br from-[#FFD000]/10 to-transparent border-[#FFD000]/30" : "bg-[#0B0F1A] border-white/10"}`}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <h3 className="font-bold text-white text-lg leading-tight">{achievement.title}</h3>
                  <p className="text-sm text-gray-400 mt-2">{achievement.description}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${unlocked ? "bg-[#FFD000]/20 text-[#FFD000]" : "bg-white/5 text-gray-400"}`}>
                  {unlocked ? "Unlocked" : `${achievement.value}/${achievement.target}`}
                </span>
              </div>

              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full ${unlocked ? "bg-gradient-to-r from-[#FFD000] to-[#00CFFF]" : "bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF]"}`} style={{ width: `${progress}%` }} />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Progress</span>
                <span className={unlocked ? "text-[#FFD000] font-bold" : "text-gray-300 font-semibold"}>{progress}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}