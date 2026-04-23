import React from "react";
import { BookOpen, ChevronRight } from "lucide-react";
import DevotionDayCard from "@/components/devotion/DevotionDayCard";
import MobilePageHeader from "@/components/mobile/MobilePageHeader";

export default function MobileDailyDevotion({
  plans, selectedPlanId, setSelectedPlanId, selectedPlan, planProgress,
  completedForPlan, entries, activeDayIndex, setActiveDayIndex, completeDayMutation
}) {
  return (
    <div className="min-h-screen pb-24 font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      <MobilePageHeader
        title={selectedPlan ? selectedPlan.title : "Bible School"}
        subtitle={selectedPlan ? `${completedForPlan.size}/${selectedPlan.duration} days done` : "Reading plans"}
      />

      <div className="px-3 py-4">
        {!selectedPlanId ? (
          <>
            <div className="mb-5 px-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3" style={{ background: "rgba(11,63,217,0.08)", border: "1px solid #D6E4FF" }}>
                <BookOpen className="w-3 h-3" style={{ color: "#0B3FD9" }} />
                <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: "#0B3FD9" }}>Daily Devotion</span>
              </div>
              <h2 className="text-2xl font-black" style={{ fontFamily: "Space Grotesk, sans-serif", color: "#0B1B3D" }}>Scripture Reading Plans</h2>
              <p className="text-[13px] mt-1" style={{ color: "#6B7FA0" }}>Follow a guided plan, reflect daily, and grow in the Word.</p>
            </div>

            <div className="space-y-3">
              {plans.map((plan) => {
                const progress = planProgress[plan.id] || { completed: 0, total: plan.duration };
                const pct = Math.round((progress.completed / progress.total) * 100);
                return (
                  <button key={plan.id} onClick={() => setSelectedPlanId(plan.id)} className="w-full rounded-2xl p-4 text-left active:scale-[0.99] transition" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 2px 8px rgba(11,63,217,0.04)" }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: `${plan.color}10`, border: `1px solid ${plan.color}30` }}>📖</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold truncate" style={{ color: "#0B1B3D" }}>{plan.title}</h3>
                        <p className="text-[11px]" style={{ color: "#8A97B5" }}>{plan.duration} days</p>
                      </div>
                      <ChevronRight className="w-5 h-5 shrink-0" style={{ color: "#8A97B5" }} />
                    </div>
                    <p className="text-[13px] mb-3 line-clamp-2" style={{ color: "#6B7FA0" }}>{plan.description}</p>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#EEF3FF" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: plan.color }} />
                    </div>
                    <p className="text-[11px] mt-2" style={{ color: "#8A97B5" }}>{progress.completed}/{progress.total} days completed</p>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="mb-5 rounded-2xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
              <h2 className="text-xl font-black" style={{ color: selectedPlan.color, fontFamily: "Space Grotesk, sans-serif" }}>{selectedPlan.title}</h2>
              <p className="text-[13px] mt-1 mb-3" style={{ color: "#6B7FA0" }}>{selectedPlan.description}</p>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#EEF3FF" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${(completedForPlan.size / selectedPlan.duration) * 100}%`, background: selectedPlan.color }} />
              </div>
              <p className="text-[11px] mt-2" style={{ color: "#8A97B5" }}>{completedForPlan.size}/{selectedPlan.duration} days completed</p>
              <button onClick={() => setSelectedPlanId(null)} className="mt-3 text-[12px] font-bold" style={{ color: "#0B3FD9" }}>← All plans</button>
            </div>

            <div className="space-y-3">
              {selectedPlan.days.map((day, idx) => {
                const isCompleted = completedForPlan.has(day.day);
                const existingEntry = entries.find((e) => e.plan_id === selectedPlanId && e.day_number === day.day);
                return (
                  <DevotionDayCard
                    key={day.day} day={day} isCompleted={isCompleted}
                    isActive={activeDayIndex === idx} existingReflection={existingEntry?.reflection}
                    color={selectedPlan.color}
                    onToggle={() => setActiveDayIndex(activeDayIndex === idx ? null : idx)}
                    onComplete={(reflection) => completeDayMutation.mutate({ planId: selectedPlanId, dayNumber: day.day, reflection })}
                    isSubmitting={completeDayMutation.isPending}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}