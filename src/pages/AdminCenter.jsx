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
import AdminSettingsTab from "../components/admin/AdminSettingsTab";
import AdminPlaceholderTab from "../components/admin/AdminPlaceholderTab";

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
      case "media": return <AdminPlaceholderTab title="Media Library" description="Upload and organize assets, videos, and images." />;
      case "badges": return <AdminPlaceholderTab title="Badges & Ranks" description="Configure gamification rules and create new badges." />;
      case "analytics": return <AdminPlaceholderTab title="Advanced Analytics" description="Deep dive into engagement metrics and exports." />;
      case "notifications": return <AdminPlaceholderTab title="Push Notifications" description="Send platform-wide alerts and updates." />;
      case "settings": return isSuperAdmin ? <AdminSettingsTab /> : <div className="p-8 text-red-400 text-center font-bold">Super Admin access required to view system settings.</div>;
      default: return <AdminDashboardTab />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white flex flex-col md:flex-row">
      <AdminSidebar activeTab={activeTab} setActiveTab={handleTabChange} isSuperAdmin={isSuperAdmin} />
      <div className="flex-1 overflow-y-auto h-screen p-4 md:p-8 bg-[#080C14]">
        <div className="max-w-7xl mx-auto pb-20 md:pb-0">
          {renderTab()}
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