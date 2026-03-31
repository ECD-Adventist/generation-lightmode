import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Home, Zap, Users, Bell, User, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import OverviewTab from "../components/dashboard/OverviewTab";
import LeaderboardTab from "../components/dashboard/LeaderboardTab";
import SubmitDropTab from "../components/dashboard/SubmitDropTab";
import ChallengesTab from "../components/dashboard/ChallengesTab";
import GlowGroupsTab from "../components/dashboard/GlowGroupsTab";
import PrayerRequestsTab from "../components/dashboard/PrayerRequestsTab";
import PrayerAnalyticsTab from "../components/dashboard/PrayerAnalyticsTab";
import DashboardMapHero from "../components/dashboard/DashboardMapHero";
import OnboardingModal from "../components/dashboard/OnboardingModal";
import AICoachingTab from "../components/dashboard/AICoachingTab";
import { applyDailyCheckIn } from "@/lib/gamification";

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
        const checkedInUser = await applyDailyCheckIn(base44, me);
        setUser(checkedInUser);
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

  const needsOnboarding = !user.privacy_consent_given || !user.country || !user.gender || !user.date_of_birth;

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0B0F1A 0%, #121826 100%)" }}>
      <OnboardingModal
        isOpen={needsOnboarding}
        onCompleted={(updates) => setUser(prev => ({ ...prev, ...updates, privacy_consent_given: true }))}
      />
      {/* Background Glows */}
      <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "50%", height: "50%", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,207,255,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "20%", right: "-10%", width: "40%", height: "40%", borderRadius: "50%", background: "radial-gradient(circle, rgba(138,92,255,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />

      {/* Top Nav Bar */}
      <div className="sticky top-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 shrink-0">
            <img
              src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png"
              alt="LightMode"
              style={{ height: 56, width: "auto", filter: "drop-shadow(0 0 6px rgba(0,207,255,0.5))" }}
            />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to={createPageUrl("Feed")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Home className="w-4 h-4" /><span className="hidden sm:inline">Feed</span>
            </Link>
            <Link to={createPageUrl("GlowGroups")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Users className="w-4 h-4" /><span className="hidden sm:inline">Groups</span>
            </Link>
            <Link to={createPageUrl("Notifications")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Bell className="w-4 h-4" /><span className="hidden sm:inline">Alerts</span>
            </Link>
            <Link to={createPageUrl("Profile")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <User className="w-4 h-4" /><span className="hidden sm:inline">Profile</span>
            </Link>
            <Link to={createPageUrl("Milestones")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Zap className="w-4 h-4" /><span className="hidden sm:inline">Milestones</span>
            </Link>
            <Link to={createPageUrl("GlobalReach")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-sm font-medium">
              <Globe className="w-4 h-4" /><span className="hidden sm:inline">Reach</span>
            </Link>
            <Link to={createPageUrl("Home")} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-500 hover:text-[#00CFFF] hover:bg-white/5 transition text-sm font-medium border border-white/5">
              <Globe className="w-4 h-4" /> Website
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        {/* Hero Map Section */}
        <div className="mb-12 pb-8 border-b border-white/5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00CFFF]/10 border border-[#00CFFF]/20 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#00CFFF] animate-pulse"></span>
            <span className="text-[#00CFFF] text-xs font-bold tracking-wider font-['Inter']">GLOBAL WARRIOR MAP</span>
          </div>
          <h2 className="text-2xl font-bold font-['Space_Grotesk'] mb-6">Light Warriors Around the World</h2>
          <DashboardMapHero userCountry={user?.country} />
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/5 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00CFFF]/10 border border-[#00CFFF]/20 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#00CFFF] animate-pulse"></span>
              <span className="text-[#00CFFF] text-xs font-bold tracking-wider font-['Inter']">MISSIONARY PORTAL</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-['Space_Grotesk'] tracking-tight">
              Welcome back, <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF]">{user.full_name}</span>
            </h1>
            <p className="text-gray-400 mt-3 font-['Inter'] text-lg max-w-xl">
              Track your impact, complete challenges, and keep your faith always on.
            </p>
          </div>
          
          <div className="bg-[#0B0F1A]/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex items-center gap-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="w-12 h-12 rounded-full bg-[#FFD000]/10 flex items-center justify-center border border-[#FFD000]/30 shadow-[0_0_15px_rgba(255,208,0,0.2)]">
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#FFD000] font-['Space_Grotesk'] leading-none mb-1">{user.glow_score || 0}</div>
              <div className="text-xs text-gray-400 uppercase tracking-widest font-['Inter'] font-semibold">Glow Points</div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-transparent border-none p-0 flex flex-wrap gap-2 mb-10 h-auto justify-start">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'drops', label: 'Submit Drop', icon: '✨' },
              { id: 'challenges', label: 'Challenges', icon: '🎯' },
              { id: 'glowgroups', label: 'GlowGroups', icon: '👥' },
              { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
              { id: 'prayer', label: 'Prayer Requests', icon: '🙏' },
              { id: 'prayer-analytics', label: 'Prayer Analytics', icon: '📈' },
              { id: 'ai-coach', label: 'AI Coach', icon: '🧠' }
            ].map(tab => (
              <TabsTrigger 
                key={tab.id}
                value={tab.id} 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00CFFF]/20 data-[state=active]:to-[#8A5CFF]/20 data-[state=active]:text-white data-[state=active]:border-[#00CFFF]/40 data-[state=active]:shadow-[0_0_20px_rgba(0,207,255,0.15)] bg-[#121826]/80 text-gray-400 border border-white/5 rounded-full px-6 py-2.5 font-['Inter'] font-medium transition-all duration-300"
              >
                <span className="mr-2">{tab.icon}</span> {tab.label}
              </TabsTrigger>
            ))}
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
          <TabsContent value="prayer">
            <PrayerRequestsTab user={user} />
          </TabsContent>
          <TabsContent value="prayer-analytics">
            <PrayerAnalyticsTab />
          </TabsContent>
          <TabsContent value="ai-coach">
            <AICoachingTab user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}