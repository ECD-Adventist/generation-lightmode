import React from "react";
import { LayoutDashboard, Users, Zap, Target, Trophy, Globe, Image as ImageIcon, Award, BarChart3, Bell, Settings, MessageSquare, Home, Hash, Brain, Megaphone, Map, UserCheck, PieChart, Flag, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";

export default function AdminSidebar({ activeTab, setActiveTab, isSuperAdmin, isRegionalAdmin }) {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";

  const territoryOnlyItems = [
    { id: "territory-map", label: "Territory Map", icon: <Map size={18} /> },
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "groups", label: "GlowGroups", icon: <MessageSquare size={18} /> },
    { id: "drops", label: "Glow Drops", icon: <Zap size={18} /> },
    { id: "countries", label: "Countries", icon: <Globe size={18} /> },
    { id: "charts", label: "Charts Dashboard", icon: <PieChart size={18} /> },
    { id: "territory-challenges", label: "Territory Challenges", icon: <Target size={18} /> },
    { id: "activity", label: "Activity Feed", icon: <span style={{ fontSize: 16 }}>⚡</span> },
    { id: "codes", label: "Codes of Truth", icon: <Hash size={18} /> },
    { id: "keepit100", label: "Keep It 100", icon: <span style={{ fontSize: 16 }}>💯</span> },
  ];

  const fullAdminItems = [
    ...(isRegionalAdmin ? [{ id: "territory", label: "Territory Setup", icon: <Globe size={18} /> }] : []),
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "users", label: "Users", icon: <Users size={18} /> },
    { id: "groups", label: "GlowGroups", icon: <MessageSquare size={18} /> },
    { id: "drops", label: "Glow Drops", icon: <Zap size={18} /> },
    { id: "challenges", label: "Challenges", icon: <Target size={18} /> },
    { id: "leaderboards", label: "Leaderboards", icon: <Trophy size={18} /> },
    { id: "countries", label: "Countries", icon: <Globe size={18} /> },
    { id: "territory-map", label: "Territory Map", icon: <Map size={18} /> },
    { id: "territory-assign", label: "Territory Assign", icon: <UserCheck size={18} /> },
    { id: "charts", label: "Charts Dashboard", icon: <PieChart size={18} /> },
    { id: "territory-challenges", label: "Territory Challenges", icon: <Target size={18} /> },
    { id: "activity", label: "Activity Feed", icon: <span style={{ fontSize: 16 }}>⚡</span> },
    { id: "codes", label: "Codes of Truth", icon: <Hash size={18} /> },
    { id: "keepit100", label: "Keep It 100", icon: <span style={{ fontSize: 16 }}>💯</span> },
    { id: "media", label: "Media Library", icon: <ImageIcon size={18} /> },
    { id: "badges", label: "Badges & Ranks", icon: <Award size={18} /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 size={18} /> },
    { id: "growth-analytics", label: "Growth Analytics", icon: <TrendingUp size={18} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
    { id: "announcements", label: "Announcements", icon: <Megaphone size={18} /> },
    { id: "comments", label: "Comment Moderation", icon: <Flag size={18} /> },
    { id: "assistant-training", label: "Assistant Training", icon: <Brain size={18} /> },
    { id: "institutions", label: "Institution Dashboard", icon: <Globe size={18} /> },
  ];

  const menuItems = (isSuperAdmin || !isRegionalAdmin) ? fullAdminItems : territoryOnlyItems;

  if (isSuperAdmin) {
    menuItems.push({ id: "custom-posts", label: "Custom Posts", icon: <span style={{ fontSize: 16 }}>✨</span> });
    menuItems.push({ id: "settings", label: "System Settings", icon: <Settings size={18} /> });
  }

  const logoUrl = isDark
    ? "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png"
    : "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b1d36c3f0_LOGO-LANDSCAPE-BLUE.png";

  return (
    <div className="w-full md:w-64 md:h-screen flex flex-col shrink-0 md:sticky top-0 z-10 overflow-hidden"
      style={{ background: t.surface, borderRight: `1px solid ${t.border}` }}>
      {/* Logo */}
      <div className="p-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${t.border}` }}>
        <Link to={createPageUrl("Home")} className="flex items-center gap-3">
          <img
            src={logoUrl}
            alt="Generation LightMode"
            style={{ height: 40, width: "auto", filter: isDark ? "drop-shadow(0 0 8px rgba(0,207,255,0.5))" : "drop-shadow(0 2px 6px rgba(11,63,217,0.25))" }}
          />
        </Link>
        <Link to={createPageUrl("Home")} className="md:hidden" style={{ color: t.textMuted }}>
          <Home size={20} />
        </Link>
      </div>
      <div className="px-5 py-3" style={{ borderBottom: `1px solid ${t.border}` }}>
        <h2 className="text-base font-bold font-['Space_Grotesk']" style={{ color: t.accent }}>Control Center</h2>
        <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: t.textMuted }}>LightMode Admin</p>
      </div>

      <div className="flex-1 overflow-x-auto md:overflow-y-auto py-3 md:py-4 px-3 flex md:flex-col gap-2 md:gap-1 hide-scrollbar">
        {menuItems.map(item => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap md:whitespace-normal shrink-0"
              style={active
                ? { background: t.accentSoft, color: t.accent, border: `1px solid ${t.borderStrong}`, boxShadow: isDark ? "0 0 15px rgba(0,207,255,0.1)" : "0 2px 8px rgba(11,63,217,0.1)" }
                : { color: t.textSecondary, background: "transparent", border: "1px solid transparent" }}
              onMouseOver={e => { if (!active) { e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "#F0F4FA"; e.currentTarget.style.color = t.textPrimary; } }}
              onMouseOut={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = t.textSecondary; } }}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}

        <div className="mt-auto pt-6 pb-2 px-2 hidden md:block">
          <Link to={createPageUrl("Feed")} className="flex items-center gap-2 text-sm transition" style={{ color: t.textMuted }}>
            <Home size={16} /> Back to App
          </Link>
        </div>
      </div>
    </div>
  );
}