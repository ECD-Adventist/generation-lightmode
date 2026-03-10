import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Star } from "lucide-react";
import { toast } from "sonner";

export default function ChallengesTab({ user }) {
  const { data: challenges = [] } = useQuery({
    queryKey: ["challenges"],
    queryFn: () => base44.entities.Challenge.filter({ active: true })
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

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Target className="text-[#FFD000] w-6 h-6" />
        <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-white">Active Challenges</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {challenges.length === 0 ? (
          <p className="text-gray-400 italic">No active challenges right now. Keep glowing!</p>
        ) : (
          challenges.map(c => (
            <Card key={c.id} className="bg-[#121826] border-gray-800 text-white flex flex-col justify-between">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-bold text-[#00CFFF]">{c.title}</CardTitle>
                  <div className="flex items-center gap-1 bg-[#FFD000]/10 text-[#FFD000] px-2 py-1 rounded-md text-xs font-semibold">
                    <Star className="w-3 h-3" /> {c.points_reward} pts
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300 mb-6">{c.description}</p>
                {hasParticipated(c.id) ? (
                  <Button disabled variant="outline" className="w-full bg-green-500/10 text-green-400 border-green-500/20">
                    Completed
                  </Button>
                ) : (
                  <Button onClick={() => handleParticipate(c)} className="w-full bg-[#8A5CFF] hover:bg-[#8A5CFF]/80 text-white">
                    Participate Now
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}