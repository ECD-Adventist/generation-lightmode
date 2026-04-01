import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, ArrowLeft, Building2, MapPin, Users, BarChart3, ShieldCheck, LayoutDashboard, Flag, FileText, Megaphone, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import TerritoryAnalytics from "@/components/institution/TerritoryAnalytics";
import TerritoryVerificationQueue from "@/components/institution/TerritoryVerificationQueue";
import TerritoryMapManager from "@/components/institution/TerritoryMapManager";
import InstitutionUsersTab from "@/components/institution/InstitutionUsersTab";
import InstitutionDropsTab from "@/components/institution/InstitutionDropsTab";
import InstitutionOverviewDashboard from "@/components/institution/InstitutionOverviewDashboard";

const menuItems = [
  { key: "dashboard", label: "Overview", icon: LayoutDashboard },
  { key: "verification", label: "Member Verification", icon: ShieldCheck },
  { key: "users", label: "Members", icon: Users },
  { key: "analytics", label: "Territory Analytics", icon: BarChart3 },
  { key: "map", label: "Map & Territories", icon: MapPin },
  { key: "drops", label: "Glow Drops", icon: FileText },
];

export default function InstitutionControlCenter() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get("tab") || "dashboard";

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(isAuth => {
      if (isAuth) base44.auth.me().then(setUser);
      else base44.auth.redirectToLogin(window.location.pathname);
    });
  }, []);

  const { data: institutionApps = [], isLoading } = useQuery({
    queryKey: ["myApprovedInstitutions", user?.email],
    queryFn: () => base44.entities.InstitutionApplication.filter({ user_email: user.email, status: "approved" }),
    enabled: !!user,
  });

  const { data: institutionPages = [] } = useQuery({
    queryKey: ["allInstitutionPages"],
    queryFn: () => base44.entities.InstitutionPage.list("-created_date", 100),
    enabled: !!user,
  });

  const primaryPage = institutionPages.find(p => p.owner_email === user?.email);

  if (!user || isLoading) {
    return <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#00CFFF] animate-spin" /></div>;
  }

  if (institutionApps.length === 0) {
    return (
      <div className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Institution Access</h2>
          <p className="text-gray-500 mb-6">You need an approved institution to access the Control Center.</p>
          <Link to="/ClaimInstitutionDashboard" className="text-[#00CFFF] font-bold hover:underline">Apply for an Institution →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C14] text-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0c1020] border-r border-white/5 transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition-transform duration-300 flex flex-col`}>
        <div className="p-6 border-b border-white/5">
          <Link to={createPageUrl("Home")} className="block mb-6">
            <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png" alt="LightMode" className="h-8 object-contain" />
          </Link>
          <div className="text-xs text-[#00CFFF] font-bold uppercase tracking-widest mb-1">Command Center</div>
          <div className="text-sm font-semibold truncate text-white">{institutionApps[0]?.institution_name}</div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setActiveTab(item.key);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? "bg-[#00CFFF]/10 text-[#00CFFF]" 
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/5">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition w-full px-2 py-2 rounded-lg hover:bg-white/5">
            <ArrowLeft className="w-4 h-4" /> Back to Profile
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <div className="h-16 border-b border-white/5 bg-[#0c1020]/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-gray-400" onClick={() => setIsMobileMenuOpen(true)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Building2 className="w-4 h-4" /> / {menuItems.find(m => m.key === activeTab)?.label}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {primaryPage && (
              <Link to={`/InstitutionDashboard?id=${primaryPage.id}`} className="text-xs bg-[#00CFFF] text-black font-bold px-4 py-1.5 rounded-full hover:bg-[#00CFFF]/90 transition shadow-[0_0_15px_rgba(0,207,255,0.3)]">
                Dashboard
              </Link>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === "dashboard" && (
              <InstitutionOverviewDashboard institutionApps={institutionApps} ownerEmail={user.email} />
            )}
            
            {activeTab === "verification" && (
              <TerritoryVerificationQueue institutionApps={institutionApps} ownerEmail={user.email} />
            )}

            {activeTab === "analytics" && (
              <TerritoryAnalytics page={primaryPage || {}} institutionApps={institutionApps} />
            )}

            {activeTab === "map" && (
              <TerritoryMapManager institutionApps={institutionApps} primaryApp={institutionApps[0]} />
            )}

            {activeTab === "users" && (
              <InstitutionUsersTab ownerEmail={user.email} />
            )}

            {activeTab === "drops" && (
              <InstitutionDropsTab ownerEmail={user.email} />
            )}


          </div>
        </div>
      </div>
    </div>
  );
}