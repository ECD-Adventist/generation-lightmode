import React from "react";

export default function LifetimeAchievementBoard({ achievements }) {
  return (
    <div className="rounded-3xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold" style={{ color: "#0B1B3D" }}>Lifetime Achievement Board</h2>
        <p className="mt-2" style={{ color: "#6B7FA0" }}>Track your long-term badge progress across faith, consistency, and community.</p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {achievements.map((achievement) => {
          const progress = Math.min(100, Math.round((achievement.value / achievement.target) * 100));
          const unlocked = achievement.value >= achievement.target;

          return (
            <div key={achievement.key} className="rounded-2xl p-5" style={unlocked ? { background: "linear-gradient(135deg, #FFF8E6 0%, #FFFFFF 100%)", border: "1px solid #FFE4A0" } : { background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <h3 className="font-bold text-lg leading-tight" style={{ color: "#0B1B3D" }}>{achievement.title}</h3>
                  <p className="text-sm mt-2" style={{ color: "#6B7FA0" }}>{achievement.description}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={unlocked ? { background: "rgba(255, 208, 0, 0.15)", color: "#CC7A00", border: "1px solid #FFE4A0" } : { background: "#FFFFFF", color: "#8A97B5", border: "1px solid #E6ECF5" }}>
                  {unlocked ? "Unlocked" : `${achievement.value}/${achievement.target}`}
                </span>
              </div>

              <div className="w-full h-2 rounded-full overflow-hidden mb-3" style={{ background: "#EEF3FF" }}>
                <div className="h-full rounded-full" style={{ width: `${progress}%`, background: unlocked ? "linear-gradient(90deg, #FFD000, #1FB8FF)" : "linear-gradient(90deg, #1FB8FF, #0B3FD9)" }} />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span style={{ color: "#8A97B5" }}>Progress</span>
                <span className="font-semibold" style={unlocked ? { color: "#CC7A00" } : { color: "#0B1B3D" }}>{progress}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}