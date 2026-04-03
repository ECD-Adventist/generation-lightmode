import React from "react";
import { LayoutDashboard, Zap, Target, Globe, MessageSquare, Home, Hash, PieChart, Map, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const TERRITORY_TABS = [
  { id: "territory-map", label: "Territory Map", icon: <Map size={18} /> },
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { id: "groups", label: "GlowGroups", icon: <MessageSquare size={18} /> },
  { id: "drops", label: "Glow Drops", icon: <Zap size={18} /> },
  { id: "countries", label: "Countries", icon: <Globe size={18} /> },
  { id: "charts", label: "Charts", icon: <PieChart size={18} /> },
  { id: "territory-challenges", label: "Challenges", icon: <Target size={18} /> },
  { id: "activity", label: "Activity Feed", icon: <BarChart3 size={18} /> },
  { id: "codes", label: "Codes of Truth", icon: <Hash size={18} /> },
  { id: "keepit100", label: "Keep It 100", icon: <span style={{ fontSize: 16 }}>💯</span> },
];

export default function TerritorySidebar({ activeTab, setActiveTab, titleName, subTitle }) {
  return (
    <div className="w-full md:w-60 md:h-screen bg-[#0D1220] border-r border-white/5 flex flex-col shrink-0 md:sticky top-0 z-10 overflow-hidden">
      {/* Logo */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <Link to={createPageUrl("Home")}>
          <img
            src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png"
            alt="Generation LightMode"
            style={{ height: 36, width: "auto", filter: "drop-shadow(0 0 8px rgba(0,207,255,0.5))" }}
          />
        </Link>
        <Link to={createPageUrl("Feed")} className="md:hidden text-gray-400 hover:text-white">
          <Home size={18} />
        </Link>
      </div>

      {/* Title */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="text-[10px] font-black text-[#00CFFF] uppercase tracking-[0.2em]">Territory Control Center</div>
        <div className="text-xs text-gray-400 mt-0.5 truncate">{titleName || "Territory Admin"}</div>
        {subTitle && <div className="text-[10px] text-gray-600 truncate">{subTitle}</div>}
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-x-auto md:overflow-y-auto py-3 px-2 flex md:flex-col gap-1 hide-scrollbar">
        {TERRITORY_TABS.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap md:whitespace-normal shrink-0 ${
              activeTab === item.id
                ? "bg-[#00CFFF]/10 text-[#00CFFF] border border-[#00CFFF]/20"
                : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 hidden md:block">
        <Link to={createPageUrl("Feed")} className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition">
          <Home size={14} /> Back to App
        </Link>
      </div>
    </div>
  );
}