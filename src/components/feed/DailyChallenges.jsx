import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Target } from "lucide-react";

export default function DailyChallenges({ user }) {
  const today = new Date().toISOString().split('T')[0];

  const { data: progress = [], isLoading } = useQuery({
    queryKey: ["dailyChallenges", user?.email, today],
    queryFn: () => base44.entities.UserDailyChallenge.filter({ user_email: user?.email, date_string: today }),
    enabled: !!user
  });

  const challenges = [
    { id: "share_verse", title: "Share a Verse", description: "Post a new GlowDrop", xp: 10 },
    { id: "comment", title: "Encourage Someone", description: "Comment on a post", xp: 5 },
    { id: "like_drops", title: "Spread the Light", description: "Like a GlowDrop", xp: 5 }
  ];




  return (
    <div className="rounded-[24px] p-5 mb-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #FFF8E0 0%, #FFF0C0 100%)", border: "1px solid #FFD000", boxShadow: "0 4px 16px rgba(255, 208, 0, 0.15)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4" style={{ color: "#B8860B" }} />
        <h3 className="font-black text-[11px] tracking-[0.18em] uppercase" style={{ color: "#8B6914" }}>Daily Missions</h3>
      </div>
      
      <div className="space-y-3">
        {challenges.map(challenge => {
          const isCompleted = progress.some(p => p.challenge_id === challenge.id);
          return (
            <div key={challenge.id} className="p-3 rounded-xl transition-all" style={isCompleted
              ? { background: "rgba(255,255,255,0.5)", border: "1px solid rgba(76,175,80,0.3)", opacity: 0.65 }
              : { background: "#FFFFFF", border: "1px solid #F0E0A0", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className={`font-bold text-sm ${isCompleted ? 'line-through' : ''}`} style={{ color: isCompleted ? "#8A97B5" : "#0A1A3D" }}>{challenge.title}</h4>
                  <p className="text-[10px] mt-0.5" style={{ color: "#8B6914" }}>{challenge.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "linear-gradient(90deg, #FFD000, #FF9F1A)", color: "#0A1A3D" }}>+{challenge.xp} XP</span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <span className="text-[9px] font-bold px-2 py-1 rounded" style={{ background: "rgba(139,105,20,0.1)", color: "#8B6914" }}>
                      PENDING
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}