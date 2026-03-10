import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, CheckCircle, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export default function GroupStudyPlanTab({ group, user }) {
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["allStudyPlans"],
    queryFn: () => base44.entities.StudyPlan.list()
  });

  const { data: groupPlans = [], isLoading: gpLoading } = useQuery({
    queryKey: ["groupPlan", group.id],
    queryFn: () => base44.entities.GroupStudyPlan.filter({ group_id: group.id })
  });

  const activePlan = groupPlans.length > 0 ? groupPlans[0] : null;
  const planDetails = activePlan ? plans.find(p => p.id === activePlan.plan_id) : null;

  const { data: progressData = [], isLoading: progLoading } = useQuery({
    queryKey: ["studyProgress", group.id, activePlan?.plan_id],
    queryFn: () => base44.entities.UserStudyProgress.filter({ group_id: group.id, plan_id: activePlan.plan_id }),
    enabled: !!activePlan
  });

  const myProgress = progressData.find(p => p.user_email === user.email);

  const enrollMutation = useMutation({
    mutationFn: async (planId) => {
      await base44.entities.GroupStudyPlan.create({
        group_id: group.id,
        plan_id: planId,
        start_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      toast.success("Study plan started for the group!");
      queryClient.invalidateQueries({ queryKey: ["groupPlan", group.id] });
    }
  });

  const progressMutation = useMutation({
    mutationFn: async () => {
      if (myProgress) {
        await base44.entities.UserStudyProgress.update(myProgress.id, {
          completed_days: myProgress.completed_days + 1,
          last_completed_at: new Date().toISOString()
        });
      } else {
        await base44.entities.UserStudyProgress.create({
          user_email: user.email,
          group_id: group.id,
          plan_id: activePlan.plan_id,
          completed_days: 1,
          last_completed_at: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      toast.success("Progress updated!");
      queryClient.invalidateQueries({ queryKey: ["studyProgress", group.id, activePlan?.plan_id] });
    }
  });

  if (plansLoading || gpLoading || (activePlan && progLoading)) {
    return <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>;
  }

  if (!activePlan) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <BookOpen className="w-12 h-12 text-[#00CFFF] mx-auto mb-4" />
          <h3 className="text-2xl font-bold font-['Space_Grotesk'] text-white">Choose a Study Track</h3>
          <p className="text-gray-400 max-w-md mx-auto mt-2">As a leader, you can select a curated reading track for your GlowGroup to study together.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.id} className="bg-[#121826]/80 p-6 rounded-2xl border border-white/10 hover:border-[#00CFFF]/40 transition-all flex flex-col h-full">
              <h4 className="text-xl font-bold text-white mb-2">{plan.title}</h4>
              <p className="text-sm text-gray-400 mb-4 flex-1">{plan.description}</p>
              <div className="flex items-center gap-4 text-xs font-bold text-[#8A5CFF] mb-6 uppercase tracking-wider">
                <span>{plan.duration_days} Days</span>
                <span>•</span>
                <span>{plan.verses_per_day}</span>
              </div>
              {group.leader_email === user.email ? (
                <Button 
                  onClick={() => enrollMutation.mutate(plan.id)}
                  disabled={enrollMutation.isPending}
                  className="w-full bg-[#00CFFF]/20 text-[#00CFFF] hover:bg-[#00CFFF] hover:text-black font-bold"
                >
                  Start This Plan
                </Button>
              ) : (
                <div className="text-xs text-center text-gray-500 bg-white/5 py-2 rounded-lg">Only leader can start</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Active Plan View
  const maxDays = planDetails?.duration_days || 1;
  const currentDays = myProgress?.completed_days || 0;
  const percent = Math.min(100, Math.round((currentDays / maxDays) * 100));

  // Calculate group average
  const totalGroupDays = progressData.reduce((acc, curr) => acc + curr.completed_days, 0);
  const avgDays = progressData.length ? totalGroupDays / progressData.length : 0;
  const groupPercent = Math.min(100, Math.round((avgDays / maxDays) * 100));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-gradient-to-br from-[#121826] to-[#0B0F1A] p-8 rounded-3xl border border-[#00CFFF]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00CFFF]/5 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#8A5CFF]/20 text-[#8A5CFF] text-xs font-bold uppercase tracking-wider rounded-full mb-3">
              Active Track
            </div>
            <h3 className="text-3xl font-bold font-['Space_Grotesk'] text-white mb-2">{planDetails?.title}</h3>
            <p className="text-gray-400 max-w-xl">{planDetails?.description}</p>
          </div>
          
          <div className="text-center bg-[#0B0F1A]/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 min-w-[140px]">
            <div className="text-4xl font-bold text-[#FFD000] font-['Space_Grotesk']">{currentDays}<span className="text-xl text-gray-500">/{maxDays}</span></div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mt-1">Days Completed</div>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2 font-bold">
              <span className="text-white">My Progress</span>
              <span className="text-[#00CFFF]">{percent}%</span>
            </div>
            <Progress value={percent} className="h-3 bg-[#0B0F1A]" indicatorClassName="bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF]" />
          </div>
          
          <div>
            <div className="flex justify-between text-xs mb-2 font-semibold">
              <span className="text-gray-400">Group Collaborative Progress (Avg)</span>
              <span className="text-[#8A5CFF]">{groupPercent}%</span>
            </div>
            <Progress value={groupPercent} className="h-2 bg-[#0B0F1A]" indicatorClassName="bg-[#8A5CFF]" />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 text-sm text-gray-300">
            <BookOpen className="w-5 h-5 text-[#00CFFF]" />
            Today's reading: <strong className="text-white">{planDetails?.verses_per_day}</strong>
          </div>
          <Button 
            onClick={() => progressMutation.mutate()} 
            disabled={progressMutation.isPending || currentDays >= maxDays}
            className="bg-[#00CFFF] text-black hover:bg-white font-bold px-6"
          >
            {progressMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : currentDays >= maxDays ? <><Trophy className="w-4 h-4 mr-2" /> Completed!</> : <><CheckCircle className="w-4 h-4 mr-2" /> Mark Day Complete</>}
          </Button>
        </div>
      </div>
    </div>
  );
}