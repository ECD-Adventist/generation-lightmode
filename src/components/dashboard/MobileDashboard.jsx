import React, { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MobilePageHeader from "@/components/mobile/MobilePageHeader";
import usePullToRefresh from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/mobile/PullToRefreshIndicator";
import OverviewTab from "@/components/dashboard/OverviewTab";
import LeaderboardTab from "@/components/dashboard/LeaderboardTab";
import SubmitDropTab from "@/components/dashboard/SubmitDropTab";
import ChallengesTab from "@/components/dashboard/ChallengesTab";
import GlowGroupsTab from "@/components/dashboard/GlowGroupsTab";
import PrayerRequestsTab from "@/components/dashboard/PrayerRequestsTab";
import PrayerAnalyticsTab from "@/components/dashboard/PrayerAnalyticsTab";
import AICoachingTab from "@/components/dashboard/AICoachingTab";
import TerritoryLeaderboard from "@/components/leaderboard/TerritoryLeaderboard";
import DashboardMapHero from "@/components/dashboard/DashboardMapHero";
import { Zap } from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "drops", label: "Submit", icon: "✨" },
  { id: "challenges", label: "Challenges", icon: "🎯" },
  { id: "glowgroups", label: "Groups", icon: "👥" },
  { id: "territory-leaderboard", label: "Territory", icon: "🌍" },
  { id: "leaderboard", label: "Ranks", icon: "🏆" },
  { id: "prayer", label: "Prayers", icon: "🙏" },
  { id: "prayer-analytics", label: "Analytics", icon: "📈" },
  { id: "ai-coach", label: "AI Coach", icon: "🧠" },
];

export default function MobileDashboard({ user }) {
  const [active, setActive] = useState("overview");
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

  // Pull-to-refresh: only enabled on the Overview tab (which loads aggregated data).
  const { pullDistance, isRefreshing, threshold } = usePullToRefresh(scrollRef, async () => {
    if (active !== "overview") return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["myGlowDrops", user.email] }),
      queryClient.invalidateQueries({ queryKey: ["myMemberships", user.email] }),
      queryClient.invalidateQueries({ queryKey: ["overviewPublicUsers"] }),
      queryClient.invalidateQueries({ queryKey: ["activeChallenges"] }),
      queryClient.invalidateQueries({ queryKey: ["myCertificates", user.email] }),
      queryClient.invalidateQueries({ queryKey: ["communityFeedOverview"] }),
      queryClient.invalidateQueries({ queryKey: ["unreadNotifications", user.email] }),
      queryClient.invalidateQueries({ queryKey: ["overviewDailyCodesLatest"] }),
    ]);
  });

  return (
    <div ref={scrollRef} className="min-h-screen pb-24 font-['Inter'] overflow-y-auto" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      <MobilePageHeader title="Dashboard" subtitle={`Welcome, ${(user.full_name || "").split(" ")[0]}`} />
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} threshold={threshold} />

      <div className="px-3 py-4 space-y-4">
        {/* XP Hero */}
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "linear-gradient(135deg, #FFF8E6 0%, #FFF0CC 100%)", border: "1px solid #FFE4A0" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: "#FFFFFF", border: "1px solid #FFD60A" }}>
            <Zap className="w-6 h-6" style={{ color: "#CC7A00" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-black leading-none" style={{ color: "#CC7A00", fontFamily: "Space Grotesk, sans-serif" }}>{user.glow_score || 0}</div>
            <div className="text-[10px] uppercase tracking-widest font-bold mt-0.5" style={{ color: "#8B6914" }}>Glow Points</div>
          </div>
        </div>

        {/* Map */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5" }}>
          <div className="px-4 pt-3 pb-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full" style={{ background: "rgba(31,184,255,0.1)", border: "1px solid #B8E5FF" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#1FB8FF" }}></span>
              <span className="text-[9px] font-bold tracking-wider" style={{ color: "#0B3FD9" }}>GLOBAL WARRIORS</span>
            </div>
          </div>
          <DashboardMapHero userCountry={user?.country} />
        </div>

        {/* Horizontal tab scroll */}
        <div className="overflow-x-auto hide-scrollbar -mx-3 px-3">
          <div className="flex gap-2 w-max">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className="shrink-0 px-4 py-2 rounded-full text-[12px] font-bold whitespace-nowrap transition"
                style={active === t.id
                  ? { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 4px 12px rgba(11,63,217,0.3)" }
                  : { background: "#FFFFFF", border: "1px solid #E6ECF5", color: "#4A5878" }}
              >
                <span className="mr-1">{t.icon}</span> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <Tabs value={active} onValueChange={setActive} className="w-full">
          <TabsList className="hidden" />
          <TabsContent value="overview"><OverviewTab user={user} /></TabsContent>
          <TabsContent value="drops"><SubmitDropTab user={user} /></TabsContent>
          <TabsContent value="challenges"><ChallengesTab user={user} /></TabsContent>
          <TabsContent value="glowgroups"><GlowGroupsTab user={user} /></TabsContent>
          <TabsContent value="leaderboard"><LeaderboardTab user={user} /></TabsContent>
          <TabsContent value="prayer"><PrayerRequestsTab user={user} /></TabsContent>
          <TabsContent value="prayer-analytics"><PrayerAnalyticsTab /></TabsContent>
          <TabsContent value="territory-leaderboard"><TerritoryLeaderboard userTerritory={user?.country} /></TabsContent>
          <TabsContent value="ai-coach"><AICoachingTab user={user} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}