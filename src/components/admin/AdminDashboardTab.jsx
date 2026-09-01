import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Users, Zap, Target, Globe, Activity, Heart, Shield, TrendingUp, Flame, MessageSquare, Sparkles } from "lucide-react";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";
import DashboardHero from "./dashboard/DashboardHero";
import DashboardStats from "./dashboard/DashboardStats";
import DashboardCharts from "./dashboard/DashboardCharts";
import { EngagementPanel, TopPerformersPanel, RecentActivityPanel } from "./dashboard/DashboardPanels";
import { LeadingCountriesPanel, ChallengeImpactPanel, CommunityPulsePanel } from "./dashboard/DashboardExtras";
import GlobalReachMap from "./dashboard/GlobalReachMap";
import LiveOverviewPanel from "./dashboard/LiveOverviewPanel";
import { getUserCountry } from "@/lib/countryUtils";
import { buildTerritoryScope, scopeUsers, scopeGroups, scopeDropsByAuthor } from "@/lib/territoryScope";

export default function AdminDashboardTab({ user, territoryRestricted, territoryCountries, territoryRegions, territoryApproved }) {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";

  const scope = buildTerritoryScope({ territoryRestricted, territoryApproved, territoryCountries, territoryRegions });
  const { data: users = [] } = useQuery({ queryKey: ["admin_users_full"], queryFn: () => base44.functions.invoke("adminListUsers", {}).then(r => r.data || []) });
  const { data: drops = [] } = useQuery({ queryKey: ["admin_drops"], queryFn: () => base44.entities.GlowDrop.list("-created_date", 10000) });
  const { data: groups = [] } = useQuery({ queryKey: ["admin_groups"], queryFn: () => base44.entities.GlowGroup.list("-created_date", 10000) });
  const { data: challenges = [] } = useQuery({ queryKey: ["admin_challenges"], queryFn: () => base44.entities.Challenge.list("-created_date", 10000) });

  const usersByEmail = new Map(users.map(u => [u.email, u]));
  const scopedUsers = scopeUsers(scope, users);
  const scopedDrops = scopeDropsByAuthor(scope, drops, users);
  const scopedGroups = scopeGroups(scope, groups, usersByEmail);

  const pendingDrops = scopedDrops.filter(d => d.status === "pending").length;
  const pendingTerritories = scopedUsers.filter(u => u.territory_status === "pending").length;

  const growthData = useMemo(() => {
    const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const c = {};
    scopedUsers.forEach(u => { if (!u.created_date) return; const d = new Date(u.created_date); c[m[d.getMonth()] + " " + d.getFullYear()] = (c[m[d.getMonth()] + " " + d.getFullYear()] || 0) + 1; });
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1); const k = m[d.getMonth()] + " " + d.getFullYear(); return { name: m[d.getMonth()], users: c[k] || 0 }; });
  }, [scopedUsers]);

  const dropsData = useMemo(() => {
    const ds = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const c = { Sun:0,Mon:0,Tue:0,Wed:0,Thu:0,Fri:0,Sat:0 };
    const weekAgo = Date.now() - 7 * 86400000;
    scopedDrops.forEach(d => {
      if (!d.created_date) return;
      const createdAt = new Date(d.created_date).getTime();
      if (createdAt >= weekAgo) c[ds[new Date(d.created_date).getDay()]]++;
    });
    return ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(n => ({ name: n, drops: c[n] }));
  }, [scopedDrops]);

  const uniqueCountries = useMemo(() => new Set(scopedUsers.map(getUserCountry).filter(Boolean)).size, [scopedUsers]);
  const recentDrops = useMemo(() => { const c = Date.now() - 7 * 86400000; return scopedDrops.filter(d => d.created_date && new Date(d.created_date) > c).length; }, [scopedDrops]);
  const totalLikes = useMemo(() => scopedDrops.reduce((s, d) => s + (d.likes_count || 0), 0), [scopedDrops]);
  const engagementRate = scopedUsers.length > 0 ? ((scopedDrops.length / scopedUsers.length) * 100).toFixed(1) : "0.0";
  const avgLikes = scopedDrops.length > 0 ? (totalLikes / scopedDrops.length).toFixed(1) : "0";
  const approvedDrops = scopedDrops.filter(d => d.status === "approved").length;

  const topPerformers = useMemo(() => {
    const map = {};
    scopedDrops.forEach(d => { if (!d.user_email) return; if (!map[d.user_email]) map[d.user_email] = { email: d.user_email, drops: 0, likes: 0 }; map[d.user_email].drops++; map[d.user_email].likes += d.likes_count || 0; });
    return Object.values(map).sort((a, b) => b.likes - a.likes).slice(0, 5).map(p => { const u = users.find(u => u.email === p.email); return { ...p, name: u?.full_name || p.email?.split("@")[0], avatar: u?.profile_picture_url }; });
  }, [scopedDrops, users]);

  const recentActivity = useMemo(() => {
    return [...scopedDrops].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 6).map(d => {
      const u = users.find(u => u.email === d.user_email);
      return { id: d.id, user: u?.full_name || d.user_email?.split("@")[0], avatar: u?.profile_picture_url, verse: d.verse, time: d.created_date, likes: d.likes_count || 0, status: d.status };
    });
  }, [scopedDrops, users]);

  const stats = [
    { label: "Users", value: scopedUsers.length, icon: Users, color: isDark ? "#00CFFF" : "#0B3FD9", to: `${createPageUrl("AdminCenter")}?tab=users` },
    { label: "Drops", value: scopedDrops.length, icon: Zap, color: isDark ? "#FFD000" : "#d97706", trend: `${recentDrops} this wk`, to: `${createPageUrl("AdminCenter")}?tab=drops` },
    { label: "Groups", value: scopedGroups.length, icon: Activity, color: isDark ? "#8A5CFF" : "#7e22ce", to: `${createPageUrl("AdminCenter")}?tab=groups` },
    { label: "Challenges", value: challenges.filter(c => c.active).length, icon: Target, color: isDark ? "#ef4444" : "#dc2626", to: `${createPageUrl("AdminCenter")}?tab=challenges` },
    { label: "Countries", value: uniqueCountries, icon: Globe, color: isDark ? "#22c55e" : "#16a34a", to: `${createPageUrl("AdminCenter")}?tab=countries` },
    { label: "Likes", value: totalLikes, icon: Heart, color: isDark ? "#f43f5e" : "#e11d48" },
    { label: "Pending Review", value: pendingDrops, icon: Shield, color: isDark ? "#f59e0b" : "#b45309", trend: pendingDrops > 0 ? "needs action" : null, to: `${createPageUrl("AdminCenter")}?tab=drops` },
    { label: "Engagement", value: parseFloat(engagementRate) || 0, icon: TrendingUp, color: isDark ? "#06b6d4" : "#0891b2", suffix: "%", decimals: 1 },
    { label: "Avg Likes", value: parseFloat(avgLikes) || 0, icon: Sparkles, color: isDark ? "#ec4899" : "#db2777", decimals: 1 },
    { label: "This Week", value: recentDrops, icon: Flame, color: isDark ? "#fb923c" : "#ea580c" },
    { label: "Total Groups", value: scopedGroups.length, icon: MessageSquare, color: isDark ? "#a78bfa" : "#7c3aed", to: `${createPageUrl("AdminCenter")}?tab=groups` },
  ];

  if (territoryRestricted && !territoryApproved) {
    return <div className="rounded-2xl p-6 text-sm border" style={{ background: t.surface, borderColor: t.border, color: t.textSecondary }}>Please confirm your territory first (Territory Setup — select your countries).</div>;
  }

  return (
    <div className="space-y-5 pb-12">
      <DashboardHero user={user} pendingDrops={pendingDrops} pendingTerritories={pendingTerritories} t={t} isDark={isDark} />
      <DashboardStats stats={stats} t={t} isDark={isDark} />
      <DashboardCharts growthData={growthData} dropsData={dropsData} scopedUsers={scopedUsers.length} recentDrops={recentDrops} t={t} isDark={isDark} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <EngagementPanel engagementRate={engagementRate} avgLikes={avgLikes} approvedDrops={approvedDrops} recentDrops={recentDrops} t={t} isDark={isDark} />
        <TopPerformersPanel performers={topPerformers} t={t} isDark={isDark} />
        <RecentActivityPanel activity={recentActivity} t={t} isDark={isDark} />
      </div>

      {/* ─── Extra live intelligence panels ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <GlobalReachMap users={scopedUsers} t={t} isDark={isDark} />
        </div>
        <LeadingCountriesPanel users={scopedUsers} drops={scopedDrops} t={t} isDark={isDark} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChallengeImpactPanel t={t} isDark={isDark} />
        <CommunityPulsePanel scopedGroups={scopedGroups} t={t} isDark={isDark} />
      </div>
      <LiveOverviewPanel t={t} isDark={isDark} />
    </div>
  );
}