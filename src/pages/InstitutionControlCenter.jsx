import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Loader2, Bell } from "lucide-react";
import { createPageUrl } from "@/utils";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminDashboardTab from "@/components/admin/AdminDashboardTab";
import AdminGlowGroupsTab from "@/components/admin/AdminGlowGroupsTab";
import AdminGlowDropsTab from "@/components/admin/AdminGlowDropsTab";
import AdminCountriesTab from "@/components/admin/AdminCountriesTab";
import AdminActivityFeedTab from "@/components/admin/AdminActivityFeedTab";
import AdminAnalyticsTab from "@/components/admin/AdminAnalyticsTab";
import AdminTerritoryMapTab from "@/components/admin/AdminTerritoryMapTab";
import AdminChartsTab from "@/components/admin/AdminChartsTab";
import AdminTerritoryChallengesTab from "@/components/admin/AdminTerritoryChallengesTab";
import AdminCodesTab from "@/components/admin/AdminCodesTab";

const ALLOWED_TERRITORY_TABS = [
  "territory-map",
  "dashboard",
  "groups",
  "drops",
  "countries",
  "charts",
  "territory-challenges",
  "activity",
  "codes",
  "keepit100",
];

export default function InstitutionControlCenter() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const urlParams = new URLSearchParams(window.location.search);
  const requestedTab = urlParams.get("tab") || "territory-map";
  const [activeTab, setActiveTab] = useState(ALLOWED_TERRITORY_TABS.includes(requestedTab) ? requestedTab : "territory-map");

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

  const { data: institutionApps = [] } = useQuery({
    queryKey: ["myApprovedInstitutionsForTerritoryCenter", user?.email],
    queryFn: () => base44.entities.InstitutionApplication.filter({ user_email: user.email, status: "approved" }),
    enabled: !!user,
  });

  const isRegionalAdmin = ["ecd_admin", "country_admin", "union_admin", "conference_field_admin", "church_admin"].includes(user?.role);
  const hasApprovedInstitutionAccess = institutionApps.some(app => app.status === "approved");
  const territoryApproved = !isRegionalAdmin || user?.territory_status === "approved" || hasApprovedInstitutionAccess;
  const territoryCountries = user?.territory_countries;

  const titleName = institutionApps[0]?.institution_name || user?.territory_name || user?.full_name || "Territory";

  const handleTabChange = (tab) => {
    if (!ALLOWED_TERRITORY_TABS.includes(tab)) return;
    setActiveTab(tab);
    window.history.pushState({}, "", `?tab=${tab}`);
  };

  const renderTab = () => {
    // Enforce that territory admins can only access allowed tabs
    if (!ALLOWED_TERRITORY_TABS.includes(activeTab)) {
      return <AdminTerritoryMapTab currentUser={user} />;
    }

    switch (activeTab) {
      case "dashboard":
        return <AdminDashboardTab user={user} territoryRestricted={true} territoryCountries={territoryCountries} territoryApproved={territoryApproved} />;
      case "groups":
        return <AdminGlowGroupsTab user={user} territoryRestricted={true} territoryCountries={territoryCountries} territoryApproved={territoryApproved} />;
      case "drops":
        return <AdminGlowDropsTab user={user} territoryRestricted={true} territoryCountries={territoryCountries} territoryApproved={territoryApproved} />;
      case "countries":
        return <AdminCountriesTab user={user} territoryRestricted={true} territoryCountries={territoryCountries} territoryApproved={territoryApproved} />;
      case "territory-map":
        return <AdminTerritoryMapTab currentUser={user} />;
      case "charts":
        return <AdminChartsTab territoryRestricted={true} territoryCountries={territoryCountries} territoryApproved={territoryApproved} />;
      case "territory-challenges":
        return <AdminTerritoryChallengesTab currentUser={user} />;
      case "activity":
        return <AdminActivityFeedTab currentUser={user} />;
      case "codes":
        return <AdminCodesTab sourceFilter="codes_of_truth" title="Codes of Truth" />;
      case "keepit100":
        return <AdminCodesTab sourceFilter="keeping_it_100" title="Keep It 100" />;
      default:
        return <AdminTerritoryMapTab currentUser={user} />;
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A]"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>;
  }

  if (!isRegionalAdmin && !hasApprovedInstitutionAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0F1A] text-white gap-4 px-6">
        <h2 className="text-2xl font-bold font-['Space_Grotesk']">Access Denied</h2>
        <p className="text-gray-400 text-center">This area is only for approved territory or institution leaders.</p>
        <a href={createPageUrl("Dashboard")} className="px-6 py-2.5 rounded-xl bg-[#00CFFF] text-black font-bold text-sm hover:bg-[#00CFFF]/80 transition">Go to Dashboard</a>
      </div>
    );
  }

  return (
    <div className="bg-[#0B0F1A] text-white flex flex-col md:flex-row" style={{ minHeight: "100vh" }}>
      <AdminSidebar activeTab={activeTab} setActiveTab={handleTabChange} isSuperAdmin={false} isRegionalAdmin={!hasApprovedInstitutionAccess || isRegionalAdmin} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#080C14]">
        <div className="sticky top-0 z-50 bg-[#0B0F1A]/90 backdrop-blur-xl border-b border-white/5 shrink-0 hidden md:block">
          <div className="px-6 py-3 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs text-[#00CFFF] font-bold uppercase tracking-widest">Territory Control Center</div>
              <div className="text-sm text-gray-400">{titleName}</div>
            </div>
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