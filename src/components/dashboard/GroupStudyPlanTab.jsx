import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, CheckCircle, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export default function GroupStudyPlanTab({ group, user }) {
  const queryClient = useQueryClient();
  const { data: plans = [], isLoading: plansLoading } = useQuery({ queryKey: ["allStudyPlans"], queryFn: () => base44.entities.StudyPlan.list() });
  const { data: groupPlans = [], isLoading: gpLoading } = useQuery({ queryKey: ["groupPlan", group.id], queryFn: () => base44.entities.GroupStudyPlan.filter({ group_id: group.id }) });
  const activePlan = groupPlans[0] || null;
  const planDetails = activePlan ? plans.find(p => p.id === activePlan.plan_id) : null;
  const { data: progressData = [], isLoading: progLoading } = useQuery({ queryKey: ["studyProgress", group.id, activePlan?.plan_id], queryFn: () => base44.entities.UserStudyProgress.filter({ group_id: group.id, plan_id: activePlan.plan_id }), enabled: !!activePlan });
  const myProgress = progressData.find(p => p.user_email === user.email);

  const enrollMutation = useMutation({
    mutationFn: async (planId) => { await base44.entities.GroupStudyPlan.create({ group_id: group.id, plan_id: planId, start_date: new Date().toISOString() }); },
    onSuccess: () => { toast.success("Study plan started!"); queryClient.invalidateQueries({ queryKey: ["groupPlan", group.id] }); }
  });

  const progressMutation = useMutation({
    mutationFn: async () => {
      if (myProgress) await base44.entities.UserStudyProgress.update(myProgress.id, { completed_days: myProgress.completed_days + 1, last_completed_at: new Date().toISOString() });
      else await base44.entities.UserStudyProgress.create({ user_email: user.email, group_id: group.id, plan_id: activePlan.plan_id, completed_days: 1, last_completed_at: new Date().toISOString() });
    },
    onSuccess: () => { toast.success("Progress updated!"); queryClient.invalidateQueries({ queryKey: ["studyProgress", group.id, activePlan?.plan_id] }); }
  });

  if (plansLoading || gpLoading || (activePlan && progLoading)) return <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} /></div>;

  if (!activePlan) {
    return (
      <div className="space-y-6 font-['Inter']">
        <div className="text-center mb-8">
          <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: "#0B3FD9" }} />
          <h3 className="text-2xl font-bold font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>Choose a Study Track</h3>
          <p className="max-w-md mx-auto mt-2" style={{ color: "#6B7FA0" }}>As a leader, you can select a curated reading track for your GlowGroup.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.id} className="p-6 rounded-2xl flex flex-col h-full transition hover:-translate-y-0.5" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
              <h4 className="text-xl font-bold mb-2" style={{ color: "#0B1B3D" }}>{plan.title}</h4>
              <p className="text-sm mb-4 flex-1" style={{ color: "#6B7FA0" }}>{plan.description}</p>
              <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider mb-6" style={{ color: "#0B3FD9" }}>
                <span>{plan.duration_days} Days</span><span>•</span><span>{plan.verses_per_day}</span>
              </div>
              {group.leader_email === user.email ? (
                <Button onClick={() => enrollMutation.mutate(plan.id)} disabled={enrollMutation.isPending} className="w-full font-bold" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", border: "none" }}>Start This Plan</Button>
              ) : (
                <div className="text-xs text-center py-2 rounded-lg" style={{ background: "#F6F8FC", color: "#8A97B5" }}>Only leader can start</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const maxDays = planDetails?.duration_days || 1;
  const currentDays = myProgress?.completed_days || 0;
  const percent = Math.min(100, Math.round((currentDays / maxDays) * 100));
  const totalGroupDays = progressData.reduce((acc, curr) => acc + curr.completed_days, 0);
  const avgDays = progressData.length ? totalGroupDays / progressData.length : 0;
  const groupPercent = Math.min(100, Math.round((avgDays / maxDays) * 100));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-['Inter']">
      <div className="p-8 rounded-[1.75rem] relative overflow-hidden" style={{ background: "linear-gradient(135deg, #EEF3FF 0%, #DDE7FB 100%)", border: "1px solid #D6E4FF" }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" style={{ background: "rgba(31, 184, 255, 0.1)" }} />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full mb-3" style={{ background: "rgba(11, 63, 217, 0.1)", border: "1px solid #D6E4FF", color: "#0B3FD9" }}>Active Track</div>
            <h3 className="text-3xl font-bold font-['Space_Grotesk'] mb-2" style={{ color: "#0B1B3D" }}>{planDetails?.title}</h3>
            <p className="max-w-xl" style={{ color: "#4A5878" }}>{planDetails?.description}</p>
          </div>
          <div className="text-center p-4 rounded-2xl min-w-[140px]" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.06)" }}>
            <div className="text-4xl font-bold font-['Space_Grotesk']" style={{ color: "#CC7A00" }}>{currentDays}<span className="text-xl" style={{ color: "#8A97B5" }}>/{maxDays}</span></div>
            <div className="text-xs uppercase tracking-widest mt-1" style={{ color: "#6B7FA0" }}>Days Completed</div>
          </div>
        </div>
        <div className="mt-8 space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2 font-bold">
              <span style={{ color: "#0B1B3D" }}>My Progress</span>
              <span style={{ color: "#0B3FD9" }}>{percent}%</span>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #D6E4FF" }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percent}%`, background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)" }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-2 font-semibold">
              <span style={{ color: "#6B7FA0" }}>Group Collaborative Progress (Avg)</span>
              <span style={{ color: "#1FB8FF" }}>{groupPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #D6E4FF" }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${groupPercent}%`, background: "#1FB8FF" }} />
            </div>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between pt-6 border-t" style={{ borderColor: "#D6E4FF" }}>
          <div className="flex items-center gap-3 text-sm" style={{ color: "#4A5878" }}>
            <BookOpen className="w-5 h-5" style={{ color: "#0B3FD9" }} /> Today's reading: <strong style={{ color: "#0B1B3D" }}>{planDetails?.verses_per_day}</strong>
          </div>
          <Button onClick={() => progressMutation.mutate()} disabled={progressMutation.isPending || currentDays >= maxDays} className="font-bold px-6"
            style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", border: "none" }}>
            {progressMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : currentDays >= maxDays ? <><Trophy className="w-4 h-4 mr-2" /> Completed!</> : <><CheckCircle className="w-4 h-4 mr-2" /> Mark Day Complete</>}
          </Button>
        </div>
      </div>
    </div>
  );
}