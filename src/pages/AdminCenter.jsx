import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Zap, Bell, User } from "lucide-react";
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

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0F1A] text-white">
      <div className="text-red-500 mb-4"><ShieldAlert size={48} /></div>
      <h2 className="text-2xl font-bold font-['Space_Grotesk'] mb-2">Access Denied</h2>
      <p className="text-gray-400">You must be an admin to view this page.</p>
    </div>;
  }

  const isSuperAdmin = user.role === "super_admin";

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard": return <AdminDashboardTab />;
      case "users": return <AdminUsersTab user={user} />;
      case "groups": return <AdminGlowGroupsTab />;
      case "drops": return <AdminGlowDropsTab />;
      case "challenges": return <AdminChallengesTab />;
      case "leaderboards": return <AdminPlaceholderTab title="Leaderboards Control" description="Adjust rankings and highlight champions." />;
      case "countries": return <AdminPlaceholderTab title="Country Management" description="Manage ECD regions and global reach stats." />;
      case "codes": return <AdminCodesTab sourceFilter="codes_of_truth" title="Codes of Truth" />;
      case "keepit100": return <AdminCodesTab sourceFilter="keeping_it_100" title="Keep It 100" />;
      case "media": return <AdminPlaceholderTab title="Media Library" description="Upload and organize assets, videos, and images." />;
      case "badges": return <AdminPlaceholderTab title="Badges & Ranks" description="Configure gamification rules and create new badges." />;
      case "analytics": return <AdminPlaceholderTab title="Advanced Analytics" description="Deep dive into engagement metrics and exports." />;
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

// Inline fallback for the icon above
function ShieldAlert(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size||24} height={props.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
      <path d="M12 8v4"/>
      <path d="M12 16h.01"/>
    </svg>
  );
}