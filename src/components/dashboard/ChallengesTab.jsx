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

  const cardStyle = { background: "#FFFFFF", border: "1px solid #E0EAF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 font-['Inter']">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-8 border-b pb-6" style={{ borderColor: "#E0EAF5" }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FFF8E6, #FFF0CC)", border: "1px solid #FFE4A0", boxShadow: "0 4px 16px rgba(255, 159, 26, 0.12)" }}>
            <Target className="w-6 h-6" style={{ color: "#CC7A00" }} />
          </div>
          <div>
            <h2 className="text-3xl font-bold font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>Campaigns</h2>
            <p className="text-sm font-medium mt-1" style={{ color: "#CC7A00" }}>Join the global movement, earn points</p>
          </div>
        </div>
        <div className="flex p-1 rounded-xl shrink-0" style={cardStyle}>
          <button onClick={() => setActiveTab("active")} className="px-5 py-2 rounded-lg font-bold text-sm transition-all" style={activeTab === "active" ? { background: "linear-gradient(90deg, #FFD60A, #FF9F1A)", color: "#0B1B3D", boxShadow: "0 2px 6px rgba(255, 159, 26, 0.25)" } : { background: "transparent", color: "#6B7FA0" }}>Active Missions</button>
          <button onClick={() => setActiveTab("history")} className="px-5 py-2 rounded-lg font-bold text-sm transition-all" style={activeTab === "history" ? { background: "linear-gradient(90deg, #FFD60A, #FF9F1A)", color: "#0B1B3D", boxShadow: "0 2px 6px rgba(255, 159, 26, 0.25)" } : { background: "transparent", color: "#6B7FA0" }}>Challenge History</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayChallenges.length === 0 ? (
          <div className="col-span-full rounded-2xl p-12 text-center" style={cardStyle}>
            <p className="text-lg" style={{ color: "#6B7FA0" }}>No active challenges right now.</p>
            <p className="mt-2 font-bold font-['Space_Grotesk']" style={{ color: "#0B3FD9" }}>Keep glowing daily!</p>
          </div>
        ) : (
          displayChallenges.map(c => {
            const participated = hasParticipated(c.id);
            return (
              <div key={c.id} className="relative group overflow-hidden rounded-[1.5rem] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={cardStyle}>
                <div className={`absolute -top-12 -right-12 w-[150px] h-[150px] rounded-full pointer-events-none blur-2xl`} style={{ background: participated ? "rgba(34, 197, 94, 0.15)" : "rgba(31, 184, 255, 0.15)" }} />

                <div className="p-6 relative z-10 flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold font-['Space_Grotesk'] leading-tight pr-4" style={{ color: "#0B1B3D" }}>{c.title}</h3>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap" style={{ background: "rgba(255, 208, 0, 0.12)", border: "1px solid #FFE4A0", color: "#CC7A00" }}>
                      <Star className="w-3.5 h-3.5 fill-current" /> {c.points_reward} pts
                    </div>
                  </div>
                  <p className="text-[15px] leading-relaxed" style={{ color: "#4A5878" }}>{c.description}</p>
                </div>

                <div className="p-6 pt-0 relative z-10 mt-auto">
                  {participated ? (
                    <Button disabled className="w-full h-12 rounded-xl font-bold text-[15px] opacity-100" style={{ background: "rgba(34, 197, 94, 0.1)", color: "#16A34A", border: "1px solid rgba(34, 197, 94, 0.3)" }}>
                      ✓ Challenge Completed
                    </Button>
                  ) : (
                    <Button onClick={() => handleParticipate(c)} className="w-full h-12 rounded-xl font-bold font-['Space_Grotesk'] text-[16px] transition-all border-none" style={{ background: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: "#FFFFFF", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.3)" }}>
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