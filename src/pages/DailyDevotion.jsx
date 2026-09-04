import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Zap, Bell, User, BookOpen, ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import DevotionDayCard from "@/components/devotion/DevotionDayCard";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileDailyDevotion from "@/components/devotion/MobileDailyDevotion";
import { awardXp } from "@/lib/xp";

const PLANS = [
  {
    id: "psalm_23",
    title: "Walk Through Psalm 23",
    description: "A 7-day journey through the shepherd's psalm.",
    duration: 7,
    color: "#0B3FD9",
    days: [
      { day: 1, verse: "Psalm 23:1", text: "The Lord is my shepherd; I shall not want." },
      { day: 2, verse: "Psalm 23:2", text: "He maketh me to lie down in green pastures: he leadeth me beside the still waters." },
      { day: 3, verse: "Psalm 23:3", text: "He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake." },
      { day: 4, verse: "Psalm 23:4", text: "Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me." },
      { day: 5, verse: "Psalm 23:5", text: "Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over." },
      { day: 6, verse: "Psalm 23:6", text: "Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the Lord for ever." },
      { day: 7, verse: "Psalm 23 (Full)", text: "Re-read the full psalm and reflect on your week-long journey with the Shepherd." },
    ],
  },
  {
    id: "armor_of_god",
    title: "The Armor of God",
    description: "A 6-day study through Ephesians 6:10-18.",
    duration: 6,
    color: "#CC7A00",
    days: [
      { day: 1, verse: "Ephesians 6:10-11", text: "Be strong in the Lord and in his mighty power. Put on the full armor of God." },
      { day: 2, verse: "Ephesians 6:14", text: "Stand firm then, with the belt of truth buckled around your waist, with the breastplate of righteousness in place." },
      { day: 3, verse: "Ephesians 6:15", text: "And with your feet fitted with the readiness that comes from the gospel of peace." },
      { day: 4, verse: "Ephesians 6:16", text: "Take up the shield of faith, with which you can extinguish all the flaming arrows of the evil one." },
      { day: 5, verse: "Ephesians 6:17", text: "Take the helmet of salvation and the sword of the Spirit, which is the word of God." },
      { day: 6, verse: "Ephesians 6:18", text: "And pray in the Spirit on all occasions with all kinds of prayers and requests." },
    ],
  },
  {
    id: "love_chapter",
    title: "The Love Chapter",
    description: "A 5-day dive into 1 Corinthians 13.",
    duration: 5,
    color: "#1FB8FF",
    days: [
      { day: 1, verse: "1 Corinthians 13:1-3", text: "If I speak in the tongues of men or of angels, but do not have love, I am only a resounding gong." },
      { day: 2, verse: "1 Corinthians 13:4-5", text: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud." },
      { day: 3, verse: "1 Corinthians 13:6-7", text: "Love does not delight in evil but rejoices with the truth. It always protects, always trusts." },
      { day: 4, verse: "1 Corinthians 13:8-10", text: "Love never fails. But where there are prophecies, they will cease; where there are tongues, they will be stilled." },
      { day: 5, verse: "1 Corinthians 13:13", text: "And now these three remain: faith, hope and love. But the greatest of these is love." },
    ],
  },
];

export default function DailyDevotion() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [activeDayIndex, setActiveDayIndex] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.isAuthenticated().then(isAuth => {
      if (isAuth) base44.auth.me().then(setUser);
      else base44.auth.redirectToLogin(window.location.pathname);
    });
  }, []);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["devotionEntries", user?.email],
    queryFn: () => base44.entities.DevotionEntry.filter({ user_email: user?.email }),
    enabled: !!user,
  });

  const selectedPlan = PLANS.find(p => p.id === selectedPlanId);

  const completedForPlan = useMemo(() => {
    if (!selectedPlanId) return new Set();
    return new Set(entries.filter(e => e.plan_id === selectedPlanId && e.completed).map(e => e.day_number));
  }, [entries, selectedPlanId]);

  const planProgress = useMemo(() => {
    const map = {};
    PLANS.forEach(plan => {
      const completed = entries.filter(e => e.plan_id === plan.id && e.completed).length;
      map[plan.id] = { completed, total: plan.duration };
    });
    return map;
  }, [entries]);

  const completeDayMutation = useMutation({
    mutationFn: async ({ planId, dayNumber, reflection }) => {
      const existing = entries.find(e => e.plan_id === planId && e.day_number === dayNumber);
      if (existing) {
        await base44.entities.DevotionEntry.update(existing.id, { completed: true, reflection, date_string: new Date().toISOString().split("T")[0] });
      } else {
        const plan = PLANS.find(p => p.id === planId);
        const dayData = plan.days.find(d => d.day === dayNumber);
        await base44.entities.DevotionEntry.create({
          user_email: user.email, plan_id: planId, day_number: dayNumber,
          verse: dayData?.verse || "", reflection, completed: true,
          date_string: new Date().toISOString().split("T")[0],
        });
      }
      // Server verifies the completed entry and awards +10 once per plan day.
      return awardXp("devotion_day", { plan_id: planId, day_number: dayNumber });
    },
    onSuccess: (xp) => {
      queryClient.invalidateQueries({ queryKey: ["devotionEntries", user?.email] });
      toast.success(xp?.awarded > 0 ? `Day completed! +${xp.awarded} XP ⚡` : "Day completed! ⚡");
      setActiveDayIndex(null);
    },
  });

  if (!user) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F8FC" }}><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} /></div>;

  if (isMobile) {
    return (
      <MobileDailyDevotion
        plans={PLANS}
        selectedPlanId={selectedPlanId} setSelectedPlanId={setSelectedPlanId}
        selectedPlan={selectedPlan} planProgress={planProgress}
        completedForPlan={completedForPlan} entries={entries}
        activeDayIndex={activeDayIndex} setActiveDayIndex={setActiveDayIndex}
        completeDayMutation={completeDayMutation}
      />
    );
  }

  return (
    <div className="min-h-screen font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      {/* Nav */}
      <div className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: "rgba(246, 248, 252, 0.92)", borderColor: "#E2E8F0" }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => selectedPlanId ? setSelectedPlanId(null) : navigate(-1)} className="p-2 rounded-lg transition" style={{ color: "#4A5878" }}><ArrowLeft className="w-5 h-5" /></button>
            <Link to={createPageUrl("Home")} className="shrink-0">
              <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b1d36c3f0_LOGO-LANDSCAPE-BLUE.png" alt="LightMode" className="h-14 w-auto object-contain" />
            </Link>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {[
              { to: "Feed", icon: <Home className="w-4 h-4" />, label: "Feed" },
              { to: "Dashboard", icon: <Zap className="w-4 h-4" />, label: "Dashboard" },
              { to: "Profile", icon: <User className="w-4 h-4" />, label: "Profile" },
            ].map(item => (
              <Link key={item.to} to={createPageUrl(item.to)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition text-sm font-semibold" style={{ color: "#4A5878" }}
                onMouseOver={e => { e.currentTarget.style.background = "#EEF3FF"; e.currentTarget.style.color = "#0B3FD9"; }}
                onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4A5878"; }}>
                {item.icon}<span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {!selectedPlanId ? (
          <>
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(11, 63, 217, 0.08)", border: "1px solid #D6E4FF" }}>
                <BookOpen className="w-3.5 h-3.5" style={{ color: "#0B3FD9" }} />
                <span className="text-xs font-bold tracking-wider uppercase" style={{ color: "#0B3FD9" }}>Daily Devotion</span>
              </div>
              <h1 className="text-4xl font-bold font-['Space_Grotesk'] mb-2" style={{ color: "#0B1B3D" }}>Scripture Reading Plans</h1>
              <p className="text-lg" style={{ color: "#6B7FA0" }}>Follow a guided plan, reflect daily, and grow in the Word.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PLANS.map(plan => {
                const progress = planProgress[plan.id] || { completed: 0, total: plan.duration };
                const pct = Math.round((progress.completed / progress.total) * 100);
                return (
                  <button key={plan.id} onClick={() => setSelectedPlanId(plan.id)} className="rounded-3xl p-6 text-left transition-all group hover:-translate-y-0.5" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 16px rgba(11, 63, 217, 0.06)" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: `${plan.color}10`, border: `1px solid ${plan.color}30` }}>📖</div>
                      <div className="flex-1">
                        <h3 className="font-bold transition" style={{ color: "#0B1B3D" }}>{plan.title}</h3>
                        <p className="text-xs" style={{ color: "#8A97B5" }}>{plan.duration} days</p>
                      </div>
                      <ChevronRight className="w-5 h-5" style={{ color: "#8A97B5" }} />
                    </div>
                    <p className="text-sm mb-4 line-clamp-2" style={{ color: "#6B7FA0" }}>{plan.description}</p>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#E6ECF5" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: plan.color }} />
                    </div>
                    <p className="text-xs mt-2" style={{ color: "#8A97B5" }}>{progress.completed}/{progress.total} days completed</p>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold font-['Space_Grotesk'] mb-2" style={{ color: selectedPlan.color }}>{selectedPlan.title}</h1>
              <p style={{ color: "#6B7FA0" }}>{selectedPlan.description}</p>
              <div className="mt-4 w-full h-2 rounded-full overflow-hidden max-w-md" style={{ background: "#E6ECF5" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${(completedForPlan.size / selectedPlan.duration) * 100}%`, background: selectedPlan.color }} />
              </div>
              <p className="text-xs mt-2" style={{ color: "#8A97B5" }}>{completedForPlan.size}/{selectedPlan.duration} days completed</p>
            </div>

            <div className="space-y-4 max-w-2xl">
              {selectedPlan.days.map((day, idx) => {
                const isCompleted = completedForPlan.has(day.day);
                const existingEntry = entries.find(e => e.plan_id === selectedPlanId && e.day_number === day.day);
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