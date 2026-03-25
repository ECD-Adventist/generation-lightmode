import React from "react";
import { TrendingUp, Zap } from "lucide-react";
import { getLevelInfo } from "@/lib/gamification";

export default function LevelProgressCard({ user }) {
  const score = user?.glow_score || 0;
  const info = getLevelInfo(score);

  return (
    <div className="bg-[#121826] border border-white/5 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold font-['Space_Grotesk'] text-gray-300 uppercase tracking-widest flex items-center gap-2">
          <TrendingUp size={16} className="text-[#FFD000]" /> Level Progress
        </h3>
        <span className="px-3 py-1 rounded-full bg-[#FFD000]/10 border border-[#FFD000]/20 text-[#FFD000] text-xs font-bold">
          Level {info.level}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-2xl bg-[#0B0F1A] border border-white/5 p-3 text-center">
          <div className="text-lg font-black text-white">{score}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest">Total XP</div>
        </div>
        <div className="rounded-2xl bg-[#0B0F1A] border border-white/5 p-3 text-center">
          <div className="text-lg font-black text-[#00CFFF]">{info.currentInLevel}/50</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest">This Level</div>
        </div>
        <div className="rounded-2xl bg-[#0B0F1A] border border-white/5 p-3 text-center">
          <div className="text-lg font-black text-[#8A5CFF]">{info.remainingToNext}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest">To Next</div>
        </div>
      </div>

      <div className="relative">
        <div className="flex justify-between text-[11px] text-gray-500 mb-2">
          <span>Level {info.level}</span>
          <span>Level {info.level + 1}</span>
        </div>
        <div className="w-full h-3 bg-[#0B0F1A] rounded-full overflow-hidden border border-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#00CFFF] via-[#1DA1FF] to-[#8A5CFF] transition-all duration-700"
            style={{ width: `${info.progressPercent}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-gray-400 flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-[#FFD000]" />{info.currentLevelFloor} XP start</span>
          <span className="text-[#FFD000] font-bold">{info.nextLevelTarget} XP goal</span>
        </div>
      </div>
    </div>
  );
}