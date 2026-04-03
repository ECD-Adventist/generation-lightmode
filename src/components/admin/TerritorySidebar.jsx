import React from "react";
import { LayoutDashboard, MessageSquare, Zap, Globe, Map, PieChart, Target, BarChart3, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const TERRITORY_MENU = [
  { id: "territory-map", label: "Territory Map", icon: <Map size={18} /> },
  { id: "dashboard", label: "Overview", icon: <LayoutDashboard size={18} /> },
  { id: "groups", label: "GlowGroups", icon: <MessageSquare size={18} /> },
  { id: "drops", label: "Glow Drops", icon: <Zap size={18} /> },
  { id: "countries", label: "Countries", icon: <Globe size={18} /> },
  { id: "charts", label: "Charts", icon: <PieChart size={18} /> },
  { id: "territory-challenges", label: "Challenges", icon: <Target size={18} className="text-[#FFD000]" /> },
  { id: "activity", label: "Activity Feed", icon: <span style={{ fontSize: 16 }}>⚡</span> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 size={18} /> },
];

export default function TerritorySidebar({ activeTab, setActiveTab, titleName }) {
  return (
    <div className="w-full md:w-64 md:h-screen bg-[#121826] border-r border-white/5 flex flex-col shrink-0 md:sticky top-0 z-10 overflow-hidden">
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <Link to={createPageUrl("Home")} className="flex items-center gap-3">
          <img
            src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png"
            alt="Generation LightMode"
            style={{ height: 40, width: "auto", filter: "drop-shadow(0 0 8px rgba(0,207,255,0.5))" }}
          />
        </Link>
        <Link to={createPageUrl("Home")} className="md:hidden text-gray-400 hover:text-white">
          <Home size={20} />
        </Link>
      </div>
      <div className="px-5 py-3 border-b border-white/5">
        <h2 className="text-base font-bold font-['Space_Grotesk'] text-[#00CFFF]">Territory Center</h2>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5 truncate">{titleName}</p>
      </div>

      <div className="flex-1 overflow-x-auto md:overflow-y-auto py-3 md:py-4 px-3 flex md:flex-col gap-2 md:gap-1 custom-scrollbar hide-scrollbar">
        {TERRITORY_MENU.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap md:whitespace-normal shrink-0 ${
              activeTab === item.id
                ? "bg-[#00CFFF]/10 text-[#00CFFF] border border-[#00CFFF]/20 shadow-[0_0_15px_rgba(0,207,255,0.1)]"
                : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}

        <div className="mt-auto pt-6 pb-2 px-2 hidden md:block">
          <Link to={createPageUrl("Feed")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors">
            <Home size={16} /> Back to App
          </Link>
        </div>
      </div>
    </div>
  );
}