import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Building2, MapPin, Users, BarChart3, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import TerritoryAnalytics from "@/components/institution/TerritoryAnalytics";
import TerritoryVerificationQueue from "@/components/institution/TerritoryVerificationQueue";

const tabs = [
  { key: "verification", label: "Member Verification", icon: ShieldCheck },
  { key: "analytics", label: "Territory Analytics", icon: BarChart3 },
];

export default function InstitutionControlCenter() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("verification");

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
    <div className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0B0F1A]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFD000] to-[#00CFFF] flex items-center justify-center">
                <Building2 className="w-4 h-4 text-black" />
              </div>
              <div>
                <h1 className="text-sm font-bold leading-tight">{institutionApps[0]?.institution_name || "Institution"} Control Center</h1>
                <p className="text-[10px] text-gray-500">Territory Management</p>
              </div>
            </div>
          </div>
          {primaryPage && (
            <Link to={`/InstitutionDashboard?id=${primaryPage.id}`} className="text-xs text-[#00CFFF] font-bold hover:underline hidden sm:block">
              Dashboard →
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto hide-scrollbar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? "bg-[#FFD000]/15 text-[#FFD000] border border-[#FFD000]/30"
                    : "bg-[#121826] text-gray-400 border border-white/5 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "verification" && (
          <TerritoryVerificationQueue
            institutionApps={institutionApps}
            ownerEmail={user.email}
          />
        )}

        {activeTab === "analytics" && (
          <TerritoryAnalytics
            page={primaryPage || {}}
            institutionApps={institutionApps}
          />
        )}
      </div>
    </div>
  );
}