import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Zap, Bell, User, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminDashboardTab from "../components/admin/AdminDashboardTab";
import AdminUsersTab from "../components/admin/AdminUsersTab";
import AdminGlowGroupsTab from "../components/admin/AdminGlowGroupsTab";
import AdminGlowDropsTab from "../components/admin/AdminGlowDropsTab";
import AdminChallengesTab from "../components/admin/AdminChallengesTab";
import AdminCodesTab from "../components/admin/AdminCodesTab";
import AdminSettingsTab from "../components/admin/AdminSettingsTab";
import AdminPlaceholderTab from "../components/admin/AdminPlaceholderTab";
import AdminAssistantTrainingTab from "../components/admin/AdminAssistantTrainingTab";
import AdminCountriesTab from "../components/admin/AdminCountriesTab";
import AdminActivityFeedTab from "../components/admin/AdminActivityFeedTab";
import AdminAnalyticsTab from "../components/admin/AdminAnalyticsTab";

export default function AdminCenter() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get("tab") || "dashboard";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    async function checkAuth() {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin(window.location.pathname);
        return;
      }
      const me = await base44.auth.me();
      setUser(me);
      setLoading(false);
    }
    checkAuth();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [window.location.search]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.history.pushState({}, '', `?tab=${tab}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A]"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>;

  // Role-based access matrix
  const ADMIN_ROLES = ["admin", "super_admin"];
  const MODERATOR_ROLES = ["moderator"];
  const LEADER_ROLES = ["GlowGroup Leader"];
  const MISSIONARY_ROLES = ["missionary"];

  const isAdmin = ADMIN_ROLES.includes(user?.role);
  const isModerator = MODERATOR_ROLES.includes(user?.role);
  const isLeader = LEADER_ROLES.includes(user?.role);
  const isMissionary = MISSIONARY_ROLES.includes(user?.role);

  // Non-admin privileged roles redirect to their relevant pages
  if (!loading && user && !isAdmin && !isModerator && !isLeader && !isMissionary) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0F1A] text-white gap-4">
        <div className="text-red-500 mb-2"><ShieldAlert size={48} /></div>
        <h2 className="text-2xl font-bold font-['Space_Grotesk']">Access Denied</h2>
        <p className="text-gray-400">You must be an admin or have a privileged role to view this page.</p>
        <a href={createPageUrl("Dashboard")} className="mt-2 px-6 py-2.5 rounded-xl bg-[#00CFFF] text-black font-bold text-sm hover:bg-[#00CFFF]/80 transition">Go to Dashboard</a>
      </div>
    );
  }

  // Moderators get drops + groups only
  if (!loading && user && isModerator) {
    return (
      <div className="bg-[#0B0F1A] text-white flex flex-col md:flex-row" style={{ minHeight: "100vh" }}>
        <div className="w-full md:w-64 bg-[#121826] border-r border-white/5 p-5 flex flex-col gap-2 shrink-0 md:sticky top-0 md:h-screen">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-bold">Moderator Panel</p>
          {["drops", "groups"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition ${activeTab === tab ? "bg-[#00CFFF]/10 text-[#00CFFF] border border-[#00CFFF]/20" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}>{tab === "drops" ? "Glow Drops" : "GlowGroups"}</button>
          ))}
          <a href={createPageUrl("Dashboard")} className="mt-auto text-xs text-gray-500 hover:text-white transition">← Back to App</a>
        </div>
        <div className="flex-1 p-6 md:p-8 overflow-auto">
          {activeTab === "drops" ? <AdminGlowDropsTab /> : <AdminGlowGroupsTab />}
        </div>
      </div>
    );
  }

  // GlowGroup Leaders go straight to groups management
  if (!loading && user && isLeader) {
    return (
      <div className="bg-[#0B0F1A] text-white min-h-screen p-6 md:p-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#00CFFF] font-bold uppercase tracking-wider mb-1">GlowGroup Leader Panel</p>
              <h1 className="text-2xl font-bold font-['Space_Grotesk']">Your Groups</h1>
            </div>
            <a href={createPageUrl("Dashboard")} className="text-sm text-gray-400 hover:text-white transition">← Dashboard</a>
          </div>
          <AdminGlowGroupsTab leaderEmail={user.email} />
        </div>
      </div>
    );
  }

  // Missionaries redirect to Dashboard (they have no admin panel)
  if (!loading && user && isMissionary) {
    window.location.href = createPageUrl("Dashboard");
    return null;
  }

  if (!user || !isAdmin) return null;

  const isSuperAdmin = user.role === "super_admin";

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard": return <AdminDashboardTab />;
      case "users": return <AdminUsersTab user={user} />;
      case "groups": return <AdminGlowGroupsTab />;
      case "drops": return <AdminGlowDropsTab />;
      case "challenges": return <AdminChallengesTab />;
      case "leaderboards": return <AdminPlaceholderTab title="Leaderboards Control" description="Adjust rankings and highlight champions." />;
      case "countries": return <AdminCountriesTab />;
      case "activity": return <AdminActivityFeedTab currentUser={user} />;
      case "codes": return <AdminCodesTab sourceFilter="codes_of_truth" title="Codes of Truth" />;
      case "keepit100": return <AdminCodesTab sourceFilter="keeping_it_100" title="Keep It 100" />;
      case "media": return <AdminPlaceholderTab title="Media Library" description="Upload and organize assets, videos, and images." />;
      case "badges": return <AdminPlaceholderTab title="Badges & Ranks" description="Configure gamification rules and create new badges." />;
      case "analytics": return <AdminAnalyticsTab />;
      case "notifications": return <AdminPlaceholderTab title="Push Notifications" description="Send platform-wide alerts and updates." />;
      case "assistant-training": return <AdminAssistantTrainingTab />;
      case "settings": return isSuperAdmin ? <AdminSettingsTab /> : <div className="p-8 text-red-400 text-center font-bold">Super Admin access required to view system settings.</div>;
      default: return <AdminDashboardTab />;
    }
  };

  return (
    <div className="bg-[#0B0F1A] text-white flex flex-col md:flex-row" style={{ minHeight: "100vh" }}>
      <AdminSidebar activeTab={activeTab} setActiveTab={handleTabChange} isSuperAdmin={isSuperAdmin} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#080C14]">
        {/* Top Nav Bar */}
        <div className="sticky top-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-xl border-b border-white/5 shrink-0 hidden md:block">
          <div className="px-6 py-3 flex items-center justify-end gap-4">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl("Feed")} className="text-gray-300 hover:text-white transition font-medium text-sm">
                Switch It On
              </Link>
              <Link to={createPageUrl("Notifications")} className="relative w-10 h-10 rounded-full bg-[#121826] border border-white/10 flex items-center justify-center hover:bg-white/5 transition">
                <Bell className="w-5 h-5 text-gray-300" />
              </Link>
              <Link to={createPageUrl("Profile")} className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00CFFF] to-[#8A5CFF] p-[2px]" title="Profile">
                <div className="w-full h-full rounded-full bg-[#0B0F1A] flex items-center justify-center overflow-hidden">
                  <img src={user.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto pb-20 md:pb-0">
            {renderTab()}
          </div>
        </div>
      </div>
    </div>
  );
}