import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Bell, ShieldAlert } from "lucide-react";
import AdminTerritorySetupTab from "../components/admin/AdminTerritorySetupTab";
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
import AdminAssistantTrainingTab from "../components/admin/AdminAssistantTrainingTab";
import AdminCountriesTab from "../components/admin/AdminCountriesTab";
import AdminActivityFeedTab from "../components/admin/AdminActivityFeedTab";
import AdminAnalyticsTab from "../components/admin/AdminAnalyticsTab";
import AdminLeaderboardsTab from "../components/admin/AdminLeaderboardsTab";
import AdminNotificationsTab from "../components/admin/AdminNotificationsTab";
import AdminBadgesTab from "../components/admin/AdminBadgesTab";
import AdminMediaTab from "../components/admin/AdminMediaTab";
import AdminContentScheduleTab from "../components/admin/AdminContentScheduleTab";
import AdminAnnouncementsTab from "../components/admin/AdminAnnouncementsTab";
import AdminTerritoryMapTab from "../components/admin/AdminTerritoryMapTab";
import AdminTerritoryAssignTab from "../components/admin/AdminTerritoryAssignTab";
import AdminChartsTab from "../components/admin/AdminChartsTab";
import AdminTerritoryChallengesTab from "../components/admin/AdminTerritoryChallengesTab";
import AdminCommentsTab from "../components/admin/AdminCommentsTab";
import AdminInstitutionTab from "../components/admin/AdminInstitutionTab";
import AdminGrowthAnalyticsTab from "../components/admin/AdminGrowthAnalyticsTab";
import AdminCustomPostTab from "../components/admin/AdminCustomPostTab";
import AdminPermissionMatrixTab from "../components/admin/AdminPermissionMatrixTab";
import AdminAuditLogsTab from "../components/admin/AdminAuditLogsTab";
import AdminGlobalLeaderboardsTab from "../components/admin/AdminGlobalLeaderboardsTab";
import AdminTerritoryAlertsTab from "../components/admin/AdminTerritoryAlertsTab";
import AdminLeaderAccountsTab from "../components/admin/AdminLeaderAccountsTab";
import AdminLeaderPostsTab from "../components/admin/AdminLeaderPostsTab";
import AdminSupabaseExportTab from "../components/admin/AdminSupabaseExportTab";
import AdminStorageDashboardTab from "../components/admin/AdminStorageDashboardTab";
import { AdminThemeProvider, useAdminTheme, getAdminTokens } from "../components/admin/AdminThemeContext";
import AdminThemeToggle from "../components/admin/AdminThemeToggle";
import MobileAdminShell from "../components/admin/MobileAdminShell";

function AdminCenterInner() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);

  const urlParams = new URLSearchParams(window.location.search);
  const REGIONAL_ROLES = ["church_admin", "conference_field_admin", "union_admin", "country_admin", "ecd_admin"];
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
      if (!urlParams.get("tab") && REGIONAL_ROLES.includes(me?.role)) {
        setActiveTab("territory-map");
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && tab !== activeTab) setActiveTab(tab);
  }, [window.location.search]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.history.pushState({}, "", `?tab=${tab}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: t.appBg }}><Loader2 className="w-8 h-8 animate-spin" style={{ color: t.accent }} /></div>;

  const ADMIN_ROLES = ["admin", "super_admin", "ecd_admin", "country_admin", "union_admin", "conference_field_admin", "church_admin"];
  const MODERATOR_ROLES = ["moderator"];
  const LEADER_ROLES = ["GlowGroup Leader"];
  const MISSIONARY_ROLES = ["missionary"];

  const isAdmin = ADMIN_ROLES.includes(user?.role);
  const isModerator = MODERATOR_ROLES.includes(user?.role);
  const isLeader = LEADER_ROLES.includes(user?.role);
  const isMissionary = MISSIONARY_ROLES.includes(user?.role);
  const isRegionalAdmin = ["ecd_admin", "country_admin", "union_admin", "conference_field_admin", "church_admin"].includes(user?.role);

  if (!loading && user && !isAdmin && !isModerator && !isLeader && !isMissionary) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: t.appBg, color: t.textPrimary }}>
        <div className="text-red-500 mb-2"><ShieldAlert size={48} /></div>
        <h2 className="text-2xl font-bold font-['Space_Grotesk']">Access Denied</h2>
        <p style={{ color: t.textSecondary }}>You must be an admin or have a privileged role to view this page.</p>
        <a href={createPageUrl("Dashboard")} className="mt-2 px-6 py-2.5 rounded-xl font-bold text-sm transition" style={{ background: t.gradient, color: "#FFFFFF" }}>Go to Dashboard</a>
      </div>
    );
  }

  if (!loading && user && isModerator) {
    return (
      <div className="flex flex-col md:flex-row" style={{ minHeight: "100vh", background: t.appBg, color: t.textPrimary }}>
        <div className="w-full md:w-64 p-5 flex flex-col gap-2 shrink-0 md:sticky top-0 md:h-screen" style={{ background: t.surface, borderRight: `1px solid ${t.border}` }}>
          <p className="text-xs uppercase tracking-widest mb-2 font-bold" style={{ color: t.textMuted }}>Moderator Panel</p>
          {["drops", "groups"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition"
              style={activeTab === tab
                ? { background: t.accentSoft, color: t.accent, border: `1px solid ${t.borderStrong}` }
                : { color: t.textSecondary, background: "transparent", border: "1px solid transparent" }}>
              {tab === "drops" ? "Glow Drops" : "GlowGroups"}
            </button>
          ))}
          <a href={createPageUrl("Dashboard")} className="mt-auto text-xs transition" style={{ color: t.textMuted }}>← Back to App</a>
        </div>
        <div className="flex-1 p-6 md:p-8 overflow-auto">
          {activeTab === "drops" ? <AdminGlowDropsTab /> : <AdminGlowGroupsTab />}
        </div>
      </div>
    );
  }

  if (!loading && user && isLeader) {
    return (
      <div className="min-h-screen p-6 md:p-10" style={{ background: t.appBg, color: t.textPrimary }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: t.accent }}>GlowGroup Leader Panel</p>
              <h1 className="text-2xl font-bold font-['Space_Grotesk']">Your Groups</h1>
            </div>
            <a href={createPageUrl("Dashboard")} className="text-sm transition" style={{ color: t.textSecondary }}>← Dashboard</a>
          </div>
          <AdminGlowGroupsTab leaderEmail={user.email} />
        </div>
      </div>
    );
  }

  if (!loading && user && isMissionary) {
    window.location.href = createPageUrl("Dashboard");
    return null;
  }

  if (!user || !isAdmin) return null;

  const isSuperAdmin = user.role === "super_admin";
  const canScheduleContent = ["admin", "super_admin", "ecd_admin"].includes(user.role);
  const hasApprovedTerritory = !isRegionalAdmin || user?.territory_status === "approved";

  const renderTab = () => {
    switch (activeTab) {
      case "territory": return <AdminTerritorySetupTab user={user} />;
      case "dashboard": return <AdminDashboardTab user={user} territoryRestricted={isRegionalAdmin} territoryCountries={user?.territory_countries} territoryApproved={hasApprovedTerritory} />;
      case "users": return <AdminUsersTab user={user} />;
      case "groups": return <AdminGlowGroupsTab user={user} territoryRestricted={isRegionalAdmin} territoryCountries={user?.territory_countries} territoryApproved={hasApprovedTerritory} />;
      case "drops": return <AdminGlowDropsTab user={user} territoryRestricted={isRegionalAdmin} territoryCountries={user?.territory_countries} territoryApproved={hasApprovedTerritory} />;
      case "challenges": return <AdminChallengesTab />;
      case "leaderboards": return <AdminLeaderboardsTab />;
      case "countries": return <AdminCountriesTab user={user} territoryRestricted={isRegionalAdmin} territoryCountries={user?.territory_countries} territoryApproved={hasApprovedTerritory} />;
      case "territory-map": return <AdminTerritoryMapTab currentUser={user} />;
      case "territory-assign": return <AdminTerritoryAssignTab />;
      case "charts": return <AdminChartsTab territoryRestricted={isRegionalAdmin} territoryCountries={user?.territory_countries} territoryApproved={hasApprovedTerritory} />;
      case "territory-challenges": return <AdminTerritoryChallengesTab currentUser={user} />;
      case "activity": return <AdminActivityFeedTab currentUser={user} />;
      case "codes": return <AdminCodesTab sourceFilter="codes_of_truth" title="Codes of Truth" />;
      case "keepit100": return <AdminCodesTab sourceFilter="keeping_it_100" title="Keep It 100" />;
      case "media": return <AdminMediaTab />;
      case "content-schedule": return canScheduleContent ? <AdminContentScheduleTab /> : <div className="p-8 text-red-400 text-center font-bold">Super Admin or ECD Admin access required to schedule content.</div>;
      case "badges": return <AdminBadgesTab />;
      case "analytics": return <AdminAnalyticsTab user={user} territoryRestricted={isRegionalAdmin} territoryCountries={user?.territory_countries} territoryApproved={hasApprovedTerritory} />;
      case "growth-analytics": return <AdminGrowthAnalyticsTab territoryRestricted={isRegionalAdmin} territoryCountries={user?.territory_countries} />;
      case "notifications": return <AdminNotificationsTab />;
      case "announcements": return <AdminAnnouncementsTab />;
      case "assistant-training": return <AdminAssistantTrainingTab />;
      case "comments": return <AdminCommentsTab />;
      case "institutions": return isSuperAdmin ? <AdminInstitutionTab /> : <div className="p-8 text-red-400 text-center font-bold">Super Admin access required to view institution applications.</div>;
      case "custom-posts": return isSuperAdmin ? <AdminCustomPostTab user={user} /> : <div className="p-8 text-red-400 text-center font-bold">Super Admin access required to create custom posts.</div>;
      case "settings": return isSuperAdmin ? <AdminSettingsTab /> : <div className="p-8 text-red-400 text-center font-bold">Super Admin access required to view system settings.</div>;
      case "permissions": return isSuperAdmin ? <AdminPermissionMatrixTab /> : <div className="p-8 text-red-400 text-center font-bold">Super Admin access required to manage permissions.</div>;
      case "audit-logs": return isSuperAdmin ? <AdminAuditLogsTab /> : <div className="p-8 text-red-400 text-center font-bold">Super Admin access required to view audit logs.</div>;
      case "leader-accounts": return isSuperAdmin ? <AdminLeaderAccountsTab /> : <div className="p-8 text-red-400 text-center font-bold">Super Admin access required to manage administrator accounts.</div>;
      case "leader-posts": return isSuperAdmin ? <AdminLeaderPostsTab /> : <div className="p-8 text-red-400 text-center font-bold">Super Admin access required to manage leader posts.</div>;
      case "supabase-export": return isSuperAdmin ? <AdminSupabaseExportTab /> : <div className="p-8 text-red-400 text-center font-bold">Super Admin access required to export migration data.</div>;
      case "storage-dashboard": return ["admin", "super_admin"].includes(user.role) ? <AdminStorageDashboardTab /> : <div className="p-8 text-red-400 text-center font-bold">Global admin access required to view storage statistics.</div>;
      case "global-leaderboards": return <AdminGlobalLeaderboardsTab />;
      case "territory-alerts": return <AdminTerritoryAlertsTab currentUser={user} />;
      default: return <AdminDashboardTab />;
    }
  };

  const isDark = theme === "dark";
  const topBarBg = isDark ? "rgba(11,15,26,0.92)" : "rgba(255,255,255,0.85)";
  const contentBg = isDark ? "#080C14" : "#F4F6FA";

  const LOGO_SKYBLUE = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/d2dd1714d_LOGO-LANDSCAPE-SKYBLUE.png";
  const LOGO_WHITE = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b905a4243_LOGO-LANDSCAPE-WHITE.png";
  const topBarLogo = isDark ? LOGO_WHITE : LOGO_SKYBLUE;

  return (
    <>
    {/* Mobile admin shell — dedicated drawer-based navigation */}
    <MobileAdminShell user={user} activeTab={activeTab} setActiveTab={handleTabChange} isSuperAdmin={isSuperAdmin} isRegionalAdmin={isRegionalAdmin} canScheduleContent={canScheduleContent}>
      {renderTab()}
    </MobileAdminShell>

    {/* Desktop layout */}
    <div className="hidden md:flex md:flex-row" style={{ minHeight: "100vh", background: t.appBg, color: t.textPrimary }}>
      <AdminSidebar activeTab={activeTab} setActiveTab={handleTabChange} isSuperAdmin={isSuperAdmin} isRegionalAdmin={isRegionalAdmin} canScheduleContent={canScheduleContent} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden" style={{ background: contentBg }}>
        {/* Top Nav Bar */}
        <div className="sticky top-0 z-50 backdrop-blur-2xl shrink-0 hidden md:block" style={{ background: topBarBg, borderBottom: `1px solid ${t.border}` }}>
          <div className="px-8 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(11,63,217,0.06)" }}>
                  <img src={user.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover rounded-xl" />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: t.textPrimary }}>{user?.full_name || "Admin"}</p>
                  <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: t.textMuted }}>{user?.role?.replace(/_/g, " ")}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AdminThemeToggle />
              <Link to={createPageUrl("Feed")} className="px-4 py-2 rounded-lg font-bold text-xs transition flex items-center gap-1.5" style={{ background: isDark ? "rgba(0,207,255,0.1)" : "rgba(11,63,217,0.06)", color: isDark ? "#00CFFF" : "#0B3FD9", border: `1px solid ${isDark ? "rgba(0,207,255,0.2)" : "rgba(11,63,217,0.12)"}` }}>
                ⚡ Switch It On
              </Link>
              <Link to={createPageUrl("Notifications")} className="relative w-9 h-9 rounded-xl flex items-center justify-center transition" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(11,63,217,0.05)", border: `1px solid ${t.border}` }}>
                <Bell className="w-4 h-4" style={{ color: t.textSecondary }} />
              </Link>
              <Link to={createPageUrl("Profile")} className="w-9 h-9 rounded-xl p-[2px] flex items-center justify-center" title="Profile" style={{ background: t.gradient }}>
                <div className="w-full h-full rounded-[10px] flex items-center justify-center overflow-hidden" style={{ background: t.surface }}>
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
    </>
  );
}

export default function AdminCenter() {
  return (
    <AdminThemeProvider>
      <AdminCenterInner />
    </AdminThemeProvider>
  );
}