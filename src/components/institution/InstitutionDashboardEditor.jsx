import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import InstitutionDetailsEditor from "./InstitutionDetailsEditor";
import InstitutionAnalytics from "./InstitutionAnalytics";
import InstitutionTeamManager from "./InstitutionTeamManager";
import TerritoryAnalytics from "./TerritoryAnalytics";
import { Building2, BarChart3, Users, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const tabs = [
  { key: "details", label: "Page Details", icon: Building2 },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "territory", label: "Territory Analytics", icon: MapPin },
  { key: "team", label: "Team Members", icon: Users },
];

export default function InstitutionDashboardEditor({ page, user }) {
  const [activeTab, setActiveTab] = useState("details");
  const queryClient = useQueryClient();

  const { data: institutionApps = [] } = useQuery({
    queryKey: ["profileInstitutionApps", page?.owner_email],
    queryFn: () => base44.entities.InstitutionApplication.filter({ user_email: page.owner_email, status: "approved" }),
    enabled: !!page?.owner_email,
  });

  const onPageUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["institutionPageEdit", page.id] });
    queryClient.invalidateQueries({ queryKey: ["allInstitutionPages"] });
  };

  return (
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
                  ? "bg-[#00CFFF]/15 text-[#00CFFF] border border-[#00CFFF]/30"
                  : "bg-[#121826] text-gray-400 border border-white/5 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "details" && <InstitutionDetailsEditor page={page} onUpdated={onPageUpdated} />}
      {activeTab === "analytics" && <InstitutionAnalytics page={page} />}
      {activeTab === "territory" && <TerritoryAnalytics page={page} institutionApps={institutionApps} />}
      {activeTab === "team" && <InstitutionTeamManager page={page} onUpdated={onPageUpdated} />}
    </div>
  );
}