import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { CheckCircle2, Circle, Flame, Target } from "lucide-react";

export default function DailyChallenges({ user }) {
  const queryClient = useQueryClient();
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

  const claimMutation = useMutation({
    mutationFn: async (challenge) => {
      await base44.entities.UserDailyChallenge.create({
        user_email: user.email,
        date_string: today,
        challenge_id: challenge.id
      });
      await base44.auth.updateMe({ glow_score: (user.glow_score || 0) + challenge.xp });
    },
    onSuccess: (_, challenge) => {
      queryClient.invalidateQueries({ queryKey: ["dailyChallenges"] });
      toast.success(`Challenge Completed! +${challenge.xp} XP ⚡`);
    }
  });

  if (!user) return null;

  return (
    <div className="bg-[#121826] rounded-[24px] p-5 border border-white/5 mb-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFD000] to-[#FF5500]"></div>
      <div className="flex items-center gap-2 mb-4">
        <Target className="text-[#FFD000] w-5 h-5" />
        <h3 className="font-black text-xs text-[#FFD000] tracking-widest uppercase">Daily Missions</h3>
      </div>
      
      <div className="space-y-3">
        {challenges.map(challenge => {
          const isCompleted = progress.some(p => p.challenge_id === challenge.id);
          return (
            <div key={challenge.id} className={`p-3 rounded-xl border transition-all ${isCompleted ? 'bg-[#0B0F1A]/50 border-green-500/20 opacity-60' : 'bg-[#0B0F1A] border-white/5 hover:border-[#FFD000]/30'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className={`font-bold text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-white'}`}>{challenge.title}</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">{challenge.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold text-[#FFD000] bg-[#FFD000]/10 px-2 py-0.5 rounded-full">+{challenge.xp} XP</span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <button 
                      disabled={claimMutation.isPending}
                      onClick={() => claimMutation.mutate(challenge)}
                      className="text-[9px] font-bold text-white bg-white/10 hover:bg-[#FFD000]/20 hover:text-[#FFD000] px-2 py-1 rounded transition"
                    >
                      CLAIM
                    </button>
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