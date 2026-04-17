import React from "react";
import { TrendingUp, Zap } from "lucide-react";
import { getLevelInfo } from "@/lib/gamification";

export default function LevelProgressCard({ user }) {
  const score = user?.glow_score || 0;
  const info = getLevelInfo(score);

  return (
    <div className="rounded-[1.5rem] p-6 font-['Inter']" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold font-['Space_Grotesk'] uppercase tracking-widest flex items-center gap-2" style={{ color: "#0B1B3D" }}>
          <TrendingUp size={16} style={{ color: "#CC7A00" }} /> Level Progress
        </h3>
        <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(255, 208, 0, 0.15)", border: "1px solid #FFE4A0", color: "#CC7A00" }}>
          Level {info.level}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { val: score, label: "Total XP", color: "#0B1B3D" },
          { val: `${info.currentInLevel}/50`, label: "This Level", color: "#0B3FD9" },
          { val: info.remainingToNext, label: "To Next", color: "#1FB8FF" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-3 text-center" style={{ background: "#F6F8FC", border: "1px solid #E6ECF5" }}>
            <div className="text-lg font-black" style={{ color: s.color }}>{s.val}</div>
            <div className="text-[10px] uppercase tracking-widest" style={{ color: "#8A97B5" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="relative">
        <div className="flex justify-between text-[11px] mb-2" style={{ color: "#8A97B5" }}>
          <span>Level {info.level}</span>
          <span>Level {info.level + 1}</span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "#EEF3FF", border: "1px solid #D6E4FF" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${info.progressPercent}%`, background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)" }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1" style={{ color: "#6B7FA0" }}><Zap className="w-3.5 h-3.5" style={{ color: "#CC7A00" }} />{info.currentLevelFloor} XP start</span>
          <span className="font-bold" style={{ color: "#CC7A00" }}>{info.nextLevelTarget} XP goal</span>
        </div>
      </div>
    </div>
  );
}