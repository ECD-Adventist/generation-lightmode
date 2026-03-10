import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import OverviewTab from "../components/dashboard/OverviewTab";
import LeaderboardTab from "../components/dashboard/LeaderboardTab";
import SubmitDropTab from "../components/dashboard/SubmitDropTab";
import ChallengesTab from "../components/dashboard/ChallengesTab";
import GlowGroupsTab from "../components/dashboard/GlowGroupsTab";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          base44.auth.redirectToLogin(window.location.pathname);
          return;
        }
        const me = await base44.auth.me();
        setUser(me);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A]"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A] text-white">Redirecting to login...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white p-6">
      <div className="max-w-6xl mx-auto mt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-['Space_Grotesk']">Welcome back, {user.full_name}</h1>
            <p className="text-gray-400 mt-2">Your LightMode Dashboard</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#FFD000]">{user.glow_score || 0}</div>
            <div className="text-xs text-gray-400 uppercase tracking-widest">Glow Score</div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-[#121826] border border-gray-800 p-1 flex flex-wrap gap-2 mb-8 h-auto justify-start">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#00CFFF]/20 data-[state=active]:text-[#00CFFF]">Overview</TabsTrigger>
            <TabsTrigger value="drops" className="data-[state=active]:bg-[#00CFFF]/20 data-[state=active]:text-[#00CFFF]">Submit Drop</TabsTrigger>
            <TabsTrigger value="challenges" className="data-[state=active]:bg-[#00CFFF]/20 data-[state=active]:text-[#00CFFF]">Challenges</TabsTrigger>
            <TabsTrigger value="glowgroups" className="data-[state=active]:bg-[#00CFFF]/20 data-[state=active]:text-[#00CFFF]">GlowGroups</TabsTrigger>
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-[#00CFFF]/20 data-[state=active]:text-[#00CFFF]">Leaderboard</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <OverviewTab user={user} />
          </TabsContent>
          <TabsContent value="drops">
            <SubmitDropTab user={user} />
          </TabsContent>
          <TabsContent value="challenges">
            <ChallengesTab user={user} />
          </TabsContent>
          <TabsContent value="glowgroups">
            <GlowGroupsTab user={user} />
          </TabsContent>
          <TabsContent value="leaderboard">
            <LeaderboardTab user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}