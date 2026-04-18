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
import TerritoryLeaderboard from "../components/leaderboard/TerritoryLeaderboard";
import { applyDailyCheckIn } from "@/lib/gamification";
import AppFooter from "@/components/AppFooter";

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
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F8FC" }}><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FB8FF" }} /></div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>Redirecting to login...</div>;
  }

  const needsOnboarding = !user.privacy_consent_given || !user.country || !user.gender || !user.date_of_birth;

  return (
    <div className="min-h-screen relative overflow-hidden font-['Inter']" style={{ background: "#F6F8FC", color: "#0B1B3D" }}>
      <OnboardingModal
        isOpen={needsOnboarding}
        onCompleted={(updates) => setUser(prev => ({ ...prev, ...updates, privacy_consent_given: true }))}
      />
      {/* Soft accent lights */}
      <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "50%", height: "50%", borderRadius: "50%", background: "radial-gradient(circle, rgba(31,184,255,0.12) 0%, transparent 60%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "20%", right: "-10%", width: "40%", height: "40%", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,208,0,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />

      {/* Top Nav Bar */}
      <div className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: "rgba(246, 248, 252, 0.9)", borderColor: "#E2E8F0" }}>
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 shrink-0">
            <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b1d36c3f0_LOGO-LANDSCAPE-BLUE.png" alt="LightMode" style={{ height: 48, width: "auto" }} />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            {[
              { to: "Feed", icon: <Home className="w-4 h-4" />, label: "Feed" },
              { to: "GlowGroups", icon: <Users className="w-4 h-4" />, label: "Groups" },
              { to: "Notifications", icon: <Bell className="w-4 h-4" />, label: "Alerts" },
              { to: "Profile", icon: <User className="w-4 h-4" />, label: "Profile" },
              { to: "Milestones", icon: <Zap className="w-4 h-4" />, label: "Milestones" },
              { to: "GlobalReach", icon: <Globe className="w-4 h-4" />, label: "Reach" },
            ].map(item => (
              <Link key={item.to} to={createPageUrl(item.to)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition text-sm font-semibold" style={{ color: "#4A5878" }}
                onMouseOver={e => { e.currentTarget.style.background = "#EEF3FF"; e.currentTarget.style.color = "#0B3FD9"; }}
                onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#4A5878"; }}
              >
                {item.icon}<span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        {/* Hero Map Section */}
        <div className="mb-12 pb-8 border-b" style={{ borderColor: "#E6ECF5" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(31, 184, 255, 0.1)", border: "1px solid #B8E5FF" }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#1FB8FF" }}></span>
            <span className="text-xs font-bold tracking-wider font-['Inter']" style={{ color: "#0B3FD9" }}>GLOBAL WARRIOR MAP</span>
          </div>
          <h2 className="text-2xl font-bold font-['Space_Grotesk'] mb-6" style={{ color: "#0B1B3D" }}>Light Warriors Around the World</h2>
          <DashboardMapHero userCountry={user?.country} />
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b pb-8" style={{ borderColor: "#E6ECF5" }}>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(31, 184, 255, 0.1)", border: "1px solid #B8E5FF" }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#1FB8FF" }}></span>
              <span className="text-xs font-bold tracking-wider font-['Inter']" style={{ color: "#0B3FD9" }}>MISSIONARY PORTAL</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-['Space_Grotesk'] tracking-tight" style={{ color: "#0B1B3D" }}>
              Welcome back, <br/><span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)" }}>{user.full_name}</span>
            </h1>
            <p className="mt-3 font-['Inter'] text-lg max-w-xl" style={{ color: "#4A5878" }}>
              Track your impact, complete challenges, and keep your faith always on.
            </p>
          </div>

          <div className="p-5 rounded-[1.5rem] flex items-center gap-6" style={{ background: "linear-gradient(135deg, #FFF8E6 0%, #FFF0CC 100%)", border: "1px solid #FFE4A0", boxShadow: "0 8px 24px rgba(255, 159, 26, 0.15)" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#FFFFFF", border: "1px solid #FFD000", boxShadow: "0 2px 10px rgba(255, 208, 0, 0.3)" }}>
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <div className="text-3xl font-bold font-['Space_Grotesk'] leading-none mb-1" style={{ color: "#CC7A00" }}>{user.glow_score || 0}</div>
              <div className="text-xs uppercase tracking-widest font-['Inter'] font-semibold" style={{ color: "#8B6914" }}>Glow Points</div>
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
              { id: 'territory-leaderboard', label: 'Territory Board', icon: '🌍' },
              { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
              { id: 'prayer', label: 'Prayer Requests', icon: '🙏' },
              { id: 'prayer-analytics', label: 'Prayer Analytics', icon: '📈' },
              { id: 'ai-coach', label: 'AI Coach', icon: '🧠' }
            ].map(tab => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:!bg-gradient-to-r data-[state=active]:!from-[#1FB8FF] data-[state=active]:!to-[#0B3FD9] data-[state=active]:!text-white data-[state=active]:!border-transparent data-[state=active]:!shadow-[0_4px_14px_rgba(11,63,217,0.35)] rounded-full px-6 py-2.5 font-['Inter'] font-semibold transition-all duration-300"
                style={{ background: "#FFFFFF", color: "#4A5878", border: "1px solid #E6ECF5" }}
              >
                <span className="mr-2">{tab.icon}</span> {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

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
      <AppFooter />
    </div>
  );
}