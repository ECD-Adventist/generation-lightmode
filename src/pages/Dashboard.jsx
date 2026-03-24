import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Home, Zap, Users, Bell, User, Globe, LayoutDashboard, Target, Trophy, MessageSquare, BarChart3, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import OverviewTab from "../components/dashboard/OverviewTab";
import LeaderboardTab from "../components/dashboard/LeaderboardTab";
import SubmitDropTab from "../components/dashboard/SubmitDropTab";
import ChallengesTab from "../components/dashboard/ChallengesTab";
import GlowGroupsTab from "../components/dashboard/GlowGroupsTab";
import PrayerRequestsTab from "../components/dashboard/PrayerRequestsTab";
import PrayerAnalyticsTab from "../components/dashboard/PrayerAnalyticsTab";

const tabs = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard size={15} /> },
  { id: "drops", label: "Submit Drop", icon: <PlusCircle size={15} /> },
  { id: "challenges", label: "Challenges", icon: <Target size={15} /> },
  { id: "glowgroups", label: "GlowGroups", icon: <Users size={15} /> },
  { id: "leaderboard", label: "Leaderboard", icon: <Trophy size={15} /> },
  { id: "prayer", label: "Prayer Wall", icon: <MessageSquare size={15} /> },
  { id: "prayer-analytics", label: "Analytics", icon: <BarChart3 size={15} /> },
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) { base44.auth.redirectToLogin(window.location.pathname); return; }
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A]">
      <Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A] text-white">Redirecting...</div>
  );

  const score = user.glow_score || 0;
  let rank = "Glow Starter", rankColor = "#00CFFF";
  if (score >= 500) { rank = "Glow Champion"; rankColor = "#FFD000"; }
  else if (score >= 200) { rank = "Trendsetter"; rankColor = "#8A5CFF"; }
  else if (score >= 50) { rank = "Light Warrior"; rankColor = "#1DA1FF"; }

  return (
    <div className="min-h-screen text-white relative" style={{ background: "#080C14" }}>
      <style>{`
        @keyframes orb-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -20px) scale(1.05); }
        }
        @keyframes shimmer-line {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Ambient background orbs */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(0,207,255,0.06) 0%, transparent 70%)", animation: "orb-float 10s ease-in-out infinite" }} />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(138,92,255,0.07) 0%, transparent 70%)", animation: "orb-float 14s ease-in-out infinite reverse" }} />

      {/* Top Nav */}
      <div className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5" style={{ background: "rgba(8,12,20,0.85)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2 shrink-0">
            <img
              src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/f58fb7f4b_LOGO02ALL.png"
              alt="LightMode"
              style={{ height: 88, width: "auto", filter: "drop-shadow(0 0 8px rgba(0,207,255,0.5))" }}
            />
          </Link>
          <div className="flex items-center gap-1">
            {[
              { to: "Feed", icon: <Home size={15} />, label: "Feed" },
              { to: "GlowGroups", icon: <Users size={15} />, label: "Groups" },
              { to: "Notifications", icon: <Bell size={15} />, label: "Alerts" },
              { to: "Profile", icon: <User size={15} />, label: "Profile" },
              { to: "Milestones", icon: <Zap size={15} />, label: "Milestones" },
              { to: "GlobalReach", icon: <Globe size={15} />, label: "Reach" },
            ].map(item => (
              <Link key={item.to} to={createPageUrl(item.to)} className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition text-xs font-medium">
                {item.icon}<span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 relative z-10">

        {/* Hero Header */}
        <div className="relative mb-10 rounded-3xl overflow-hidden p-8 sm:p-10" style={{ background: "linear-gradient(135deg, rgba(0,207,255,0.08) 0%, rgba(138,92,255,0.08) 50%, rgba(18,24,38,0.8) 100%)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Shimmer line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden">
            <div className="h-full" style={{ background: "linear-gradient(90deg, transparent, rgba(0,207,255,0.6), rgba(138,92,255,0.6), transparent)", animation: "shimmer-line 3s linear infinite" }} />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar with rank glow */}
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full blur-md opacity-60" style={{ background: rankColor }} />
                <img
                  src={user.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[#0B0F1A] relative z-10 object-cover"
                  alt="Profile"
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-[#0B0F1A] z-20 shadow-lg" style={{ background: rankColor }}>
                  {rank}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E5A0] animate-pulse"></span>
                  <span className="text-[#00E5A0] text-[10px] font-bold tracking-widest uppercase">Missionary Portal</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black font-['Space_Grotesk'] text-white leading-tight">
                  Welcome back,{" "}
                  <span style={{ background: "linear-gradient(90deg, #00CFFF, #8A5CFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {user.full_name?.split(" ")[0]}
                  </span>
                </h1>
                <p className="text-gray-400 text-sm mt-1 font-['Inter']">Keep your faith always on. Your light matters.</p>
              </div>
            </div>

            {/* XP Card */}
            <div className="flex items-center gap-4 bg-black/30 backdrop-blur-sm border border-[#FFD000]/20 rounded-2xl px-6 py-4 shrink-0" style={{ boxShadow: "0 0 30px rgba(255,208,0,0.08)" }}>
              <div className="w-12 h-12 rounded-2xl bg-[#FFD000]/10 border border-[#FFD000]/30 flex items-center justify-center text-2xl" style={{ boxShadow: "0 0 20px rgba(255,208,0,0.2)" }}>
                ⚡
              </div>
              <div>
                <div className="text-3xl font-black text-[#FFD000] font-['Space_Grotesk'] leading-none" style={{ textShadow: "0 0 20px rgba(255,208,0,0.4)" }}>{score.toLocaleString()}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-0.5">Glow Points</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          {/* Tab Navigation */}
          <div className="relative mb-8">
            <TabsList className="bg-transparent border-none p-0 flex flex-wrap gap-2 h-auto justify-start">
              {tabs.map(tab => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="data-[state=active]:text-white data-[state=active]:border-[#00CFFF]/40 data-[state=active]:shadow-[0_0_20px_rgba(0,207,255,0.15)] bg-transparent text-gray-500 border border-white/5 hover:border-white/10 hover:text-gray-300 rounded-xl px-4 py-2 font-['Inter'] font-medium transition-all duration-200 text-sm relative overflow-hidden"
                  style={{}}
                >
                  <span className="data-[state=active]:text-[#00CFFF] flex items-center gap-1.5 relative z-10">
                    {tab.icon} {tab.label}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="overview"><OverviewTab user={user} /></TabsContent>
          <TabsContent value="drops"><SubmitDropTab user={user} /></TabsContent>
          <TabsContent value="challenges"><ChallengesTab user={user} /></TabsContent>
          <TabsContent value="glowgroups"><GlowGroupsTab user={user} /></TabsContent>
          <TabsContent value="leaderboard"><LeaderboardTab user={user} /></TabsContent>
          <TabsContent value="prayer"><PrayerRequestsTab user={user} /></TabsContent>
          <TabsContent value="prayer-analytics"><PrayerAnalyticsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}