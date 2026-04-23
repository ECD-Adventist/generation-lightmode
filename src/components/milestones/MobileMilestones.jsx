import React from "react";
import MilestoneCard from "@/components/milestones/MilestoneCard";
import LifetimeAchievementBoard from "@/components/milestones/LifetimeAchievementBoard";
import MobilePageHeader from "@/components/mobile/MobilePageHeader";
import { Trophy, Zap } from "lucide-react";

export default function MobileMilestones({ user, milestones, earnedKeys, lifetimeAchievements }) {
  const currentLevelProgress = (((user.glow_score || 0) % 50) / 50) * 100;

  return (
    <div className="min-h-screen pb-24 font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      <MobilePageHeader title="Milestones" subtitle="Your faith journey" />

      <div className="px-3 py-4 space-y-4">
        {/* XP Hero */}
        <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, #FFF8E6 0%, #FFF0CC 100%)", border: "1px solid #FFE4A0" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: "#FFFFFF", border: "1px solid #FFD60A" }}>
              <Zap className="w-6 h-6" style={{ color: "#CC7A00" }} />
            </div>
            <div>
              <div className="text-3xl font-black leading-none" style={{ color: "#CC7A00", fontFamily: "Space Grotesk, sans-serif" }}>{user.glow_score || 0}</div>
              <div className="text-[10px] uppercase tracking-widest font-bold mt-0.5" style={{ color: "#8B6914" }}>Total Glow XP</div>
            </div>
          </div>
          <div className="w-full h-2.5 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.6)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${currentLevelProgress}%`, background: "linear-gradient(90deg, #FFD000, #FF9F1A)" }} />
          </div>
          <div className="text-[12px] font-semibold" style={{ color: "#8B6914" }}>{50 - ((user.glow_score || 0) % 50)} XP to next level</div>
        </div>

        {/* Active Milestones */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <Trophy className="w-4 h-4" style={{ color: "#0B3FD9" }} />
            <h2 className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#0B3FD9" }}>Active Milestones</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {milestones.map((m) => (
              <MilestoneCard key={m.key} milestone={m} earned={earnedKeys.has(m.key)} />
            ))}
          </div>
        </div>

        {/* Lifetime */}
        <LifetimeAchievementBoard achievements={lifetimeAchievements} />
      </div>
    </div>
  );
}