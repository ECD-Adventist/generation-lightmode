import React, { useState } from "react";
import { LayoutDashboard, Users, Zap, Target, Trophy, Globe, Image as ImageIcon, Award, BarChart3, Bell, Settings, MessageSquare, Home, Hash, Brain, Megaphone, Map, UserCheck, PieChart, Flag, TrendingUp, ChevronDown, ChevronRight, Building2, Sparkles, ShieldCheck, FileText, Medal, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";

const LOGO_BLUE = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/ce3018808_LOGO-LANDSCAPE-BLUE.png";
const LOGO_GOLD = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/77c1a906e_LOGO-LANDSCAPE-GOLD.png";

function SidebarSection({ label, children, isDark }) {
  return (
    <div className="mb-1">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] px-4 pt-4 pb-1.5" style={{ color: isDark ? "#6B7FA0" : "#8A97B5" }}>{label}</p>
      {children}
    </div>
  );
}

function SidebarGroup({ label, icon, children, isDark, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-2.5 px-4 py-2 rounded-lg text-xs font-bold transition-all" style={{ color: isDark ? "#8A97B5" : "#6B7FA0" }}
        onMouseOver={e => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"; }}
        onMouseOut={e => { e.currentTarget.style.background = "transparent"; }}
      >
        {icon}
        <span className="flex-1 text-left">{label}</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && <div className="ml-2">{children}</div>}
    </div>
  );
}

export default function AdminSidebar({ activeTab, setActiveTab, isSuperAdmin, isRegionalAdmin }) {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";

  const logoUrl = isDark ? LOGO_GOLD : LOGO_BLUE;

  const SidebarItem = ({ id, icon, label }) => {
    const active = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className="w-full flex items-center gap-2.5 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap md:whitespace-normal shrink-0"
        style={active
          ? {
              background: isDark ? "rgba(0,207,255,0.12)" : "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)",
              color: isDark ? "#00CFFF" : "#FFFFFF",
              boxShadow: isDark ? "0 0 12px rgba(0,207,255,0.08)" : "0 4px 14px rgba(11,63,217,0.25)"
            }
          : { color: isDark ? "#C8D0E0" : "#3A4A6B", background: "transparent" }}
        onMouseOver={e => { if (!active) { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(11,63,217,0.04)"; e.currentTarget.style.color = isDark ? "#fff" : "#0B3FD9"; } }}
        onMouseOut={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = isDark ? "#C8D0E0" : "#3A4A6B"; } }}
      >
        <span className="shrink-0 w-5 h-5 flex items-center justify-center">{icon}</span>
        {label}
      </button>
    );
  };

  // Determine sidebar background
  const sidebarBg = isDark
    ? t.surface
    : "linear-gradient(165deg, #FFFEF9 0%, #FFF7DE 35%, #FFEFC7 70%, #FFE9B5 100%)";
  const sidebarBorder = isDark ? t.border : "#F0DFA0";

  return (
    <div className="w-full md:w-[260px] md:h-screen flex flex-col shrink-0 md:sticky top-0 z-10 overflow-hidden relative"
      style={{ background: sidebarBg, borderRight: `1px solid ${sidebarBorder}` }}>
      {/* Light mode radial glow overlay */}
      {!isDark && (
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 15% 85%, rgba(255,208,0,0.12) 0%, transparent 55%), radial-gradient(circle at 85% 15%, rgba(255,159,26,0.08) 0%, transparent 55%)" }} />
      )}

      {/* Logo Area */}
      <div className="px-5 pt-5 pb-4 relative z-10" style={{ borderBottom: `1px solid ${isDark ? t.border : 'rgba(240,223,160,0.5)'}` }}>
        <Link to={createPageUrl("Home")} className="block">
          <img
            src={logoUrl}
            alt="Generation LightMode"
            style={{ height: 34, width: "auto", objectFit: "contain" }}
          />
        </Link>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] mt-2.5" style={{ color: isDark ? "#6B7FA0" : "#B8A060" }}>Control Center</p>
      </div>

      {/* Scrollable Nav */}
      <div className="flex-1 overflow-x-auto md:overflow-y-auto py-2 px-2 flex md:flex-col gap-0.5 hide-scrollbar relative z-10">

        <SidebarSection label="Overview" isDark={isDark}>
          <SidebarItem id="dashboard" icon={<LayoutDashboard size={16} />} label="Dashboard" />
          {isRegionalAdmin && <SidebarItem id="territory" icon={<Globe size={16} />} label="Territory Setup" />}
        </SidebarSection>

        <SidebarSection label="Community" isDark={isDark}>
          <SidebarItem id="users" icon={<Users size={16} />} label="Users" />
          <SidebarItem id="groups" icon={<MessageSquare size={16} />} label="GlowGroups" />
          <SidebarItem id="drops" icon={<Zap size={16} />} label="Glow Drops" />
          <SidebarItem id="comments" icon={<Flag size={16} />} label="Moderation" />
        </SidebarSection>

        <SidebarSection label="Growth" isDark={isDark}>
          <SidebarItem id="challenges" icon={<Target size={16} />} label="Challenges" />
          <SidebarItem id="leaderboards" icon={<Trophy size={16} />} label="Leaderboards" />
          <SidebarItem id="global-leaderboards" icon={<Medal size={16} />} label="Season Leaderboards" />
          <SidebarItem id="badges" icon={<Award size={16} />} label="Badges & Ranks" />
        </SidebarSection>

        <SidebarSection label="Territory" isDark={isDark}>
          <SidebarItem id="countries" icon={<Globe size={16} />} label="Countries" />
          <SidebarItem id="territory-map" icon={<Map size={16} />} label="Territory Map" />
          <SidebarItem id="territory-assign" icon={<UserCheck size={16} />} label="Territory Assign" />
          <SidebarItem id="territory-challenges" icon={<Target size={16} />} label="Territory Challenges" />
          <SidebarItem id="territory-alerts" icon={<AlertTriangle size={16} />} label="Territory Alerts" />
        </SidebarSection>

        <SidebarSection label="Analytics" isDark={isDark}>
          <SidebarItem id="analytics" icon={<BarChart3 size={16} />} label="Analytics" />
          <SidebarItem id="growth-analytics" icon={<TrendingUp size={16} />} label="Growth Analytics" />
          <SidebarItem id="charts" icon={<PieChart size={16} />} label="Charts Dashboard" />
        </SidebarSection>

        <SidebarSection label="Content" isDark={isDark}>
          <SidebarItem id="codes" icon={<Hash size={16} />} label="Codes of Truth" />
          <SidebarItem id="keepit100" icon={<span className="text-[14px]">💯</span>} label="Keep It 100" />
          <SidebarItem id="media" icon={<ImageIcon size={16} />} label="Media Library" />
        </SidebarSection>

        <SidebarSection label="Comms" isDark={isDark}>
          <SidebarItem id="notifications" icon={<Bell size={16} />} label="Notifications" />
          <SidebarItem id="announcements" icon={<Megaphone size={16} />} label="Announcements" />
          <SidebarItem id="activity" icon={<span className="text-[14px]">⚡</span>} label="Activity Feed" />
        </SidebarSection>

        {isSuperAdmin && (
          <SidebarSection label="Admin" isDark={isDark}>
            <SidebarItem id="institutions" icon={<Building2 size={16} />} label="Institutions" />
            <SidebarItem id="assistant-training" icon={<Brain size={16} />} label="AI Training" />
            <SidebarItem id="custom-posts" icon={<Sparkles size={16} />} label="Custom Posts" />
            <SidebarItem id="settings" icon={<Settings size={16} />} label="System Settings" />
            <SidebarItem id="permissions" icon={<ShieldCheck size={16} />} label="Permissions" />
            <SidebarItem id="audit-logs" icon={<FileText size={16} />} label="Audit Logs" />
          </SidebarSection>
        )}

        {/* Back to App link */}
        <div className="mt-auto pt-4 pb-3 px-4 hidden md:block">
          <Link to={createPageUrl("Feed")} className="flex items-center gap-2 text-xs font-semibold transition" style={{ color: isDark ? "#6B7FA0" : "#B8A060" }}
            onMouseOver={e => e.currentTarget.style.color = isDark ? "#fff" : "#0B3FD9"}
            onMouseOut={e => e.currentTarget.style.color = isDark ? "#6B7FA0" : "#B8A060"}>
            <Home size={14} /> Back to App
          </Link>
        </div>
      </div>
    </div>
  );
}