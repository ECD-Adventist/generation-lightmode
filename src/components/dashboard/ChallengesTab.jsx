import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Target, Star } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

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
        submission_url: `${window.location.origin}${createPageUrl("Challenges")}?challenge=${challenge.id}`,
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 font-['Inter']">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-8 border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-500/10 border border-amber-500/20 shadow-sm">
            <Target className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold font-['Space_Grotesk'] text-foreground">Campaigns</h2>
            <p className="text-sm font-medium mt-1 text-amber-600 dark:text-amber-400">Join the global movement, earn points</p>
          </div>
        </div>
        <div className="flex p-1 rounded-xl shrink-0 bg-card border border-border shadow-sm">
          <button onClick={() => setActiveTab("active")} className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === "active" ? "bg-amber-500 text-black shadow-sm" : "bg-transparent text-muted-foreground hover:text-foreground"}`}>Active Missions</button>
          <button onClick={() => setActiveTab("history")} className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === "history" ? "bg-amber-500 text-black shadow-sm" : "bg-transparent text-muted-foreground hover:text-foreground"}`}>Challenge History</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayChallenges.length === 0 ? (
          <div className="col-span-full rounded-2xl p-12 text-center bg-card border border-border">
            <p className="text-lg text-muted-foreground">No active challenges right now.</p>
            <p className="mt-2 font-bold font-['Space_Grotesk'] text-blue-600 dark:text-blue-400">Keep glowing daily!</p>
          </div>
        ) : (
          displayChallenges.map(c => {
            const participated = hasParticipated(c.id);
            return (
              <div key={c.id} className="relative group overflow-hidden rounded-[1.5rem] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 bg-card border border-border shadow-sm hover:shadow-md">
                <div className={`absolute -top-12 -right-12 w-[150px] h-[150px] rounded-full pointer-events-none ${participated ? "bg-green-500/10 blur-2xl" : "bg-cyan-500/10 blur-2xl"}`} />

                <div className="p-6 relative z-10 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold font-['Space_Grotesk'] leading-tight pr-4 text-card-foreground">{c.title}</h3>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-current" /> {c.points_reward} pts
                    </div>
                  </div>
                  <p className="text-[15px] leading-relaxed text-muted-foreground">{c.description}</p>
                </div>

                <div className="p-6 pt-0 relative z-10 mt-auto">
                  {participated ? (
                    <Button disabled className="w-full h-12 rounded-xl font-bold text-[15px] opacity-100 bg-green-500/10 text-green-600 border border-green-500/30">
                      ✓ Challenge Completed
                    </Button>
                  ) : (
                    <Button onClick={() => handleParticipate(c)} className="w-full h-12 rounded-xl font-bold font-['Space_Grotesk'] text-[16px] transition-all duration-300 bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-none shadow-sm hover:shadow-md">
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