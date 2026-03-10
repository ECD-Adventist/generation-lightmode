import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Star } from "lucide-react";
import { toast } from "sonner";

export default function ChallengesTab({ user }) {
  const [activeTab, setActiveTab] = useState("active");

  const { data: challenges = [] } = useQuery({
    queryKey: ["challenges"],
    queryFn: () => base44.entities.Challenge.list()
  });

  const { data: submissions = [], refetch } = useQuery({
    queryKey: ["mySubmissions", user.email],
    queryFn: () => base44.entities.ChallengeSubmission.filter({ user_email: user.email })
  });

  const handleParticipate = async (challenge) => {
    try {
      await base44.entities.ChallengeSubmission.create({
        challenge_id: challenge.id,
        user_email: user.email,
        submission_url: "Participated",
        points_awarded: challenge.points_reward
      });
      await base44.auth.updateMe({ glow_score: (user.glow_score || 0) + challenge.points_reward });
      toast.success(`Joined challenge! +${challenge.points_reward} Points`);
      refetch();
    } catch (err) {
      toast.error("Error joining challenge");
    }
  };

  const hasParticipated = (challengeId) => submissions.some(s => s.challenge_id === challengeId);

  const activeChallenges = challenges.filter(c => c.active);
  const historyChallenges = challenges.filter(c => hasParticipated(c.id));

  const displayChallenges = activeTab === "active" ? activeChallenges : historyChallenges;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-8 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FFD000]/10 flex items-center justify-center border border-[#FFD000]/30 shadow-[0_0_15px_rgba(255,208,0,0.15)]">
            <Target className="text-[#FFD000] w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-bold font-['Space_Grotesk'] text-white">Campaigns</h2>
            <p className="text-sm text-[#FFD000] font-medium font-['Inter'] mt-1">Join the global movement, earn points</p>
          </div>
        </div>
        <div className="flex bg-[#121826]/80 p-1 rounded-xl border border-white/10 shrink-0">
          <button onClick={() => setActiveTab("active")} className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === "active" ? "bg-[#FFD000] text-black shadow-md" : "text-gray-400 hover:text-white"}`}>Active Missions</button>
          <button onClick={() => setActiveTab("history")} className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === "history" ? "bg-[#FFD000] text-black shadow-md" : "text-gray-400 hover:text-white"}`}>Challenge History</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayChallenges.length === 0 ? (
          <div className="col-span-full bg-[#121826]/50 border border-white/5 rounded-2xl p-12 text-center">
            <p className="text-gray-400 text-lg font-['Inter']">No active challenges right now.</p>
            <p className="text-[#00CFFF] mt-2 font-bold font-['Space_Grotesk']">Keep glowing daily!</p>
          </div>
        ) : (
          displayChallenges.map(c => {
            const participated = hasParticipated(c.id);
            return (
              <div key={c.id} className="relative group overflow-hidden rounded-2xl bg-[#121826]/80 backdrop-blur-xl border border-white/10 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] hover:border-[#8A5CFF]/40">
                <div style={{ position: "absolute", top: -50, right: -50, width: 150, height: 150, background: participated ? "radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)" : "radial-gradient(circle, rgba(138,92,255,0.15) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
                
                <div className="p-6 relative z-10 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold font-['Space_Grotesk'] text-white leading-tight pr-4">{c.title}</h3>
                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#FFD000]/20 to-[#FFD000]/5 border border-[#FFD000]/30 text-[#FFD000] px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shadow-[0_0_10px_rgba(255,208,0,0.2)]">
                      <Star className="w-3.5 h-3.5 fill-current" /> {c.points_reward} pts
                    </div>
                  </div>
                  <p className="text-[15px] text-gray-300 font-['Inter'] leading-relaxed">{c.description}</p>
                </div>
                
                <div className="p-6 pt-0 relative z-10 mt-auto">
                  {participated ? (
                    <Button disabled className="w-full bg-green-500/10 text-green-400 border border-green-500/30 h-12 rounded-xl font-bold text-[15px] opacity-100">
                      ✓ Challenge Completed
                    </Button>
                  ) : (
                    <Button onClick={() => handleParticipate(c)} className="w-full bg-white/5 hover:bg-gradient-to-r hover:from-[#00CFFF] hover:to-[#8A5CFF] hover:text-[#0B0F1A] text-white border border-white/10 hover:border-transparent h-12 rounded-xl font-bold font-['Space_Grotesk'] text-[16px] transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.2)] hover:shadow-[0_0_20px_rgba(138,92,255,0.5)]">
                      Join Challenge
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}