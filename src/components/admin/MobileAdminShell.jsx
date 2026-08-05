import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, Users, Zap, Target, Trophy, Globe, Image as ImageIcon, Award,
  BarChart3, Bell, Settings, MessageSquare, Home, Hash, Brain, Megaphone, Map,
  UserCheck, PieChart, Flag, TrendingUp, Building2, Sparkles, ShieldCheck, FileText,
  Medal, AlertTriangle, Database, Menu, X, ChevronRight, Search, CalendarDays
} from "lucide-react";
import AdminThemeToggle from "./AdminThemeToggle";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";

const LOGO_GOLD = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/77c1a906e_LOGO-LANDSCAPE-GOLD.png";
const LOGO_BLUE = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/ce3018808_LOGO-LANDSCAPE-BLUE.png";

// Build the grouped nav config. Mirrors AdminSidebar but tuned for mobile.
function buildSections({ isSuperAdmin, isRegionalAdmin, canScheduleContent }) {
  return [
    {
      label: "Overview",
      items: [
        { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
        ...(isRegionalAdmin ? [{ id: "territory", icon: Globe, label: "Territory Setup" }] : []),
      ],
    },
    {
      label: "Community",
      items: [
        { id: "users", icon: Users, label: "Users" },
        { id: "groups", icon: MessageSquare, label: "GlowGroups" },
        { id: "drops", icon: Zap, label: "Glow Drops" },
        { id: "comments", icon: Flag, label: "Moderation" },
      ],
    },
    {
      label: "Growth",
      items: [
        { id: "challenges", icon: Target, label: "Challenges" },
        { id: "leaderboards", icon: Trophy, label: "Leaderboards" },
        { id: "global-leaderboards", icon: Medal, label: "Season Leaderboards" },
        { id: "badges", icon: Award, label: "Badges & Ranks" },
      ],
    },
    {
      label: "Territory",
      items: [
        { id: "countries", icon: Globe, label: "Countries" },
        { id: "territory-map", icon: Map, label: "Territory Map" },
        { id: "territory-assign", icon: UserCheck, label: "Territory Assign" },
        { id: "territory-challenges", icon: Target, label: "Territory Challenges" },
        { id: "territory-alerts", icon: AlertTriangle, label: "Territory Alerts" },
      ],
    },
    {
      label: "Analytics",
      items: [
        { id: "analytics", icon: BarChart3, label: "Analytics" },
        { id: "growth-analytics", icon: TrendingUp, label: "Growth Analytics" },
        { id: "charts", icon: PieChart, label: "Charts Dashboard" },
        ...(!isRegionalAdmin ? [{ id: "storage-dashboard", icon: Database, label: "Storage Dashboard" }] : []),
      ],
    },
    {
      label: "Content",
      items: [
        { id: "codes", icon: Hash, label: "Codes of Truth" },
        { id: "keepit100", icon: null, emoji: "💯", label: "Keep It 100" },
        { id: "media", icon: ImageIcon, label: "Media Library" },
        ...(canScheduleContent ? [{ id: "content-schedule", icon: CalendarDays, label: "All Things New" }] : []),
      ],
    },
    {
      label: "Comms",
      items: [
        { id: "notifications", icon: Bell, label: "Notifications" },
        { id: "announcements", icon: Megaphone, label: "Announcements" },
        { id: "activity", icon: null, emoji: "⚡", label: "Activity Feed" },
      ],
    },
    ...(isSuperAdmin ? [{
      label: "Admin",
      items: [
        { id: "institutions", icon: Building2, label: "Institutions" },
        { id: "assistant-training", icon: Brain, label: "AI Training" },
        { id: "custom-posts", icon: Sparkles, label: "Custom Posts" },
        { id: "settings", icon: Settings, label: "System Settings" },
        { id: "permissions", icon: ShieldCheck, label: "Permissions" },
        { id: "audit-logs", icon: FileText, label: "Audit Logs" },
        { id: "supabase-export", icon: Database, label: "Supabase Export" },
        { id: "leader-accounts", icon: Users, label: "Administrators Accounts" },
        { id: "leader-posts", icon: FileText, label: "Leader Posts" },
      ],
    }] : []),
  ];
}

export default function MobileAdminShell({ user, activeTab, setActiveTab, isSuperAdmin, isRegionalAdmin, canScheduleContent, children }) {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState("");

  const sections = buildSections({ isSuperAdmin, isRegionalAdmin, canScheduleContent });
  const allItems = sections.flatMap(s => s.items);
  const activeItem = allItems.find(i => i.id === activeTab);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [drawerOpen]);

  const filteredSections = query
    ? sections
        .map(s => ({ ...s, items: s.items.filter(i => i.label.toLowerCase().includes(query.toLowerCase())) }))
        .filter(s => s.items.length > 0)
    : sections;

  const handlePick = (id) => {
    setActiveTab(id);
    setDrawerOpen(false);
    setQuery("");
  };

  const logoUrl = isDark ? LOGO_GOLD : LOGO_BLUE;

  return (
    <div className="md:hidden flex flex-col" style={{ minHeight: "100vh", background: isDark ? "#080C14" : "#F4F6FA", color: t.textPrimary }}>
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 backdrop-blur-xl"
        style={{ background: isDark ? "rgba(11,15,26,0.92)" : "rgba(255,255,255,0.92)", borderBottom: `1px solid ${t.border}` }}>
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 active:scale-95 transition"
          style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(11,63,217,0.06)", border: `1px solid ${t.border}` }}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" style={{ color: t.textSecondary }} />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] leading-none mb-1" style={{ color: isDark ? "#5AC8FF" : "#0B3FD9" }}>Control Center</p>
          <p className="text-sm font-bold font-['Space_Grotesk'] truncate leading-none" style={{ color: t.textPrimary }}>
            {activeItem?.label || "Dashboard"}
          </p>
        </div>

        <AdminThemeToggle />
        <Link to={createPageUrl("Profile")} className="w-9 h-9 rounded-xl p-[2px] flex items-center justify-center shrink-0" title="Profile" style={{ background: t.gradient }}>
          <div className="w-full h-full rounded-[10px] overflow-hidden flex items-center justify-center" style={{ background: t.surface }}>
            <img src={user?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
          </div>
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="max-w-2xl mx-auto">
          {children}
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 backdrop-blur-sm" style={{ background: "rgba(8,12,20,0.55)" }} onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[84%] max-w-[330px] flex flex-col safe-pt"
            style={{ background: isDark ? "linear-gradient(180deg, #0A1226 0%, #0B1730 50%, #0A1226 100%)" : "linear-gradient(180deg, #FDFEFF 0%, #F6F9FE 40%, #EEF3FC 100%)", borderRight: `1px solid ${t.border}` }}>

            {/* Drawer header */}
            <div className="flex items-center justify-between pl-4 pr-3 pt-4 pb-3" style={{ borderBottom: `1px solid ${t.border}` }}>
              <img src={logoUrl} alt="Generation LightMode" style={{ height: 40, width: "auto", objectFit: "contain" }} />
              <button onClick={() => setDrawerOpen(false)} className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(11,63,217,0.06)" }} aria-label="Close menu">
                <X className="w-5 h-5" style={{ color: t.textSecondary }} />
              </button>
            </div>

            {/* User chip */}
            <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${t.border}` }}>
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(11,63,217,0.06)" }}>
                <img src={user?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: t.textPrimary }}>{user?.full_name || "Admin"}</p>
                <p className="text-[10px] uppercase tracking-widest font-bold truncate" style={{ color: t.textMuted }}>{user?.role?.replace(/_/g, " ")}</p>
              </div>
            </div>

            {/* Search */}
            <div className="px-3 pt-3 pb-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: t.textMuted }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search panels…"
                  className="w-full rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none"
                  style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF", border: `1px solid ${t.border}`, color: t.textPrimary }}
                />
              </div>
            </div>

            {/* Nav */}
            <div className="flex-1 overflow-y-auto px-2 pb-4 hide-scrollbar">
              {filteredSections.length === 0 && (
                <p className="text-center text-xs py-8" style={{ color: t.textMuted }}>No panels match "{query}"</p>
              )}
              {filteredSections.map(section => (
                <div key={section.label} className="mb-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] px-3 pt-4 pb-1.5" style={{ color: t.textMuted }}>{section.label}</p>
                  {section.items.map(item => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handlePick(item.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition active:scale-[0.98]"
                        style={active
                          ? { background: isDark ? "rgba(0,207,255,0.12)" : "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)", color: isDark ? "#00CFFF" : "#FFFFFF", boxShadow: isDark ? "0 0 12px rgba(0,207,255,0.08)" : "0 4px 14px rgba(11,63,217,0.25)" }
                          : { color: isDark ? "#C8D0E0" : "#334261", background: "transparent" }}
                      >
                        <span className="shrink-0 w-5 h-5 flex items-center justify-center">
                          {Icon ? <Icon size={16} /> : <span className="text-[14px]">{item.emoji}</span>}
                        </span>
                        <span className="flex-1 text-left truncate">{item.label}</span>
                        {active && <ChevronRight size={14} className="opacity-70" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Back to app */}
            <div className="px-4 py-3 safe-pb" style={{ borderTop: `1px solid ${t.border}` }}>
              <Link to={createPageUrl("Feed")} onClick={() => setDrawerOpen(false)} className="flex items-center gap-2 text-xs font-semibold" style={{ color: isDark ? "#6B7FA0" : "#4A5878" }}>
                <Home size={14} /> Back to App
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}