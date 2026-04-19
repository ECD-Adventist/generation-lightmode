import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { 
  Users, Zap, Target, Globe, Activity, Trophy, TrendingUp, ArrowUpRight, 
  AlertCircle, Plus, Send, CheckCircle2, ShieldCheck
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";

const StatCard = ({ label, value, icon: Icon, color, trend, to, t, isDark }) => {
  const content = (
    <div className="relative overflow-hidden rounded-[1.5rem] p-6 group hover:-translate-y-1 transition-all duration-300 cursor-pointer border"
         style={{ 
           background: isDark ? t.surface : "#FFFFFF", 
           borderColor: isDark ? t.border : "rgba(11, 27, 61, 0.05)", 
           boxShadow: isDark ? t.shadow : "0 12px 40px -12px rgba(11,27,61,0.08)" 
         }}>
      {/* Decorative blurred backgrounds */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[40px] opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity" style={{ background: color }} />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full blur-[30px] opacity-[0.15] pointer-events-none" style={{ background: color }} />

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: t.textSecondary }}>{label}</p>
          <h3 className="text-4xl font-black font-['Space_Grotesk'] leading-none" style={{ color: t.textPrimary }}>{typeof value === "number" ? value.toLocaleString() : value}</h3>
          {trend && (
            <div className="flex items-center gap-1.5 mt-4 px-2.5 py-1 rounded-md w-fit" style={{ background: isDark ? "rgba(34,197,94,0.15)" : "#dcfce7" }}>
              <ArrowUpRight size={14} className={isDark ? "text-green-400" : "text-green-600"} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: isDark ? "#4ade80" : "#16a34a" }}>{trend}</span>
            </div>
          )}
        </div>
        <div className="w-14 h-14 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-inner" style={{ background: isDark ? `${color}20` : `${color}10`, border: `1px solid ${color}30` }}>
          <Icon size={26} style={{ color }} />
        </div>
      </div>
    </div>
  );
  return to ? <Link to={to} className="block">{content}</Link> : content;
};

const CustomTooltip = ({ active, payload, label, color, t }) => {
  if (active && payload && payload.length) {
    return (
      <div className="border rounded-xl px-4 py-3 shadow-2xl backdrop-blur-md" style={{ background: t.surface, borderColor: t.border }}>
        <p className="text-xs mb-1 font-bold uppercase tracking-wider" style={{ color: t.textSecondary }}>{label}</p>
        <p className="text-xl font-black" style={{ color }}>{payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function AdminDashboardTab({ user, territoryRestricted, territoryCountries, territoryApproved }) {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";

  // Data fetching
  const allowedCountries = (territoryCountries || "").split(",").map(item => item.trim()).filter(Boolean);
  const { data: users = [] } = useQuery({ queryKey: ["admin_users"], queryFn: () => base44.functions.invoke("listPublicUsers", {}).then(res => res.data) });
  const { data: drops = [] } = useQuery({ queryKey: ["admin_drops"], queryFn: () => base44.entities.GlowDrop.list() });
  const { data: groups = [] } = useQuery({ queryKey: ["admin_groups"], queryFn: () => base44.entities.GlowGroup.list() });
  const { data: challenges = [] } = useQuery({ queryKey: ["admin_challenges"], queryFn: () => base44.entities.Challenge.list() });

  // Scoped metrics
  const scopedUsers = territoryRestricted && territoryApproved ? users.filter(entry => allowedCountries.includes(entry.country)) : users;
  const scopedDrops = territoryRestricted && territoryApproved ? drops.filter(drop => {
    const owner = users.find(entry => entry.email === drop.user_email);
    return owner && allowedCountries.includes(owner.country);
  }) : drops;
  const scopedGroups = territoryRestricted && territoryApproved ? groups.filter(group => allowedCountries.includes(group.country)) : groups;

  // Pending Actions
  const pendingDrops = scopedDrops.filter(d => d.status === "pending").length;
  const pendingTerritories = scopedUsers.filter(u => u.territory_status === "pending").length;
  const hasPendingItems = pendingDrops > 0 || pendingTerritories > 0;

  // Growth Chart
  const growthData = useMemo(() => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const counts = {};
    scopedUsers.forEach(u => {
      if (!u.created_date) return;
      const d = new Date(u.created_date);
      const key = months[d.getMonth()] + " " + d.getFullYear();
      counts[key] = (counts[key] || 0) + 1;
    });
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const key = months[d.getMonth()] + " " + d.getFullYear();
      return { name: months[d.getMonth()], users: counts[key] || 0 };
    });
  }, [scopedUsers]);

  // Drops Chart
  const dropsData = useMemo(() => {
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const counts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    scopedDrops.forEach(d => {
      if (!d.created_date) return;
      const day = days[new Date(d.created_date).getDay()];
      counts[day]++;
    });
    return ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(name => ({ name, drops: counts[name] }));
  }, [scopedDrops]);

  const uniqueCountries = useMemo(() => new Set(scopedUsers.map(u => u.country).filter(Boolean)).size || 0, [scopedUsers]);
  const recentDrops = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return scopedDrops.filter(d => d.created_date && new Date(d.created_date) > cutoff).length;
  }, [scopedDrops]);

  const stats = [
    { label: "Total Users", value: scopedUsers.length, icon: Users, color: isDark ? "#00CFFF" : "#0B3FD9", to: `${createPageUrl("AdminCenter")}?tab=users` },
    { label: "Total Glow Drops", value: scopedDrops.length, icon: Zap, color: isDark ? "#FFD000" : "#d97706", trend: `${recentDrops} this week`, to: `${createPageUrl("AdminCenter")}?tab=drops` },
    { label: "Active Groups", value: scopedGroups.length, icon: Activity, color: isDark ? "#8A5CFF" : "#7e22ce", to: `${createPageUrl("AdminCenter")}?tab=groups` },
    { label: "Active Challenges", value: challenges.filter(c => c.active).length, icon: Target, color: isDark ? "#ef4444" : "#dc2626", to: `${createPageUrl("AdminCenter")}?tab=challenges` },
    { label: "Countries", value: uniqueCountries, icon: Globe, color: isDark ? "#22c55e" : "#16a34a", to: `${createPageUrl("AdminCenter")}?tab=countries` },
    { label: "Approved Drops", value: scopedDrops.filter(d => d.status === "approved").length, icon: Trophy, color: isDark ? "#f97316" : "#ea580c", to: `${createPageUrl("AdminCenter")}?tab=drops` },
  ];

  if (territoryRestricted && !territoryApproved) {
    return <div className="rounded-2xl p-6 text-sm" style={{ background: t.surface, borderColor: t.border, color: t.textSecondary }}>Please confirm your territory map first to unlock your scoped dashboard.</div>;
  }

  const chartAxisColor = isDark ? "#6B7FA0" : "#8A97B5";
  const chartGridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(11,27,61,0.05)";

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Welcome */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-xs font-bold text-green-500 uppercase tracking-widest">Live Dashboard</span>
          </div>
          <h1 className="text-4xl font-black font-['Space_Grotesk'] tracking-tight" style={{ color: t.textPrimary }}>Platform Overview</h1>
          <p className="text-base mt-2" style={{ color: t.textSecondary }}>Welcome back, <span className="font-semibold" style={{ color: t.textPrimary }}>{user?.full_name || "Admin"}</span>. Here's what's happening across the movement.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link to={`${createPageUrl("AdminCenter")}?tab=drops`} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5" style={{ background: isDark ? "rgba(255,208,0,0.15)" : "#fffbeb", color: isDark ? "#FFD000" : "#d97706", border: `1px solid ${isDark ? "rgba(255,208,0,0.3)" : "#fde68a"}` }}>
            <Zap size={16} /> Review Drops
          </Link>
          <Link to={`${createPageUrl("AdminCenter")}?tab=notifications`} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5" style={{ background: isDark ? "rgba(0,207,255,0.15)" : "#eff6ff", color: isDark ? "#00CFFF" : "#2563eb", border: `1px solid ${isDark ? "rgba(0,207,255,0.3)" : "#bfdbfe"}` }}>
            <Send size={16} /> Broadcast
          </Link>
          <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 border" style={{ background: t.surface, borderColor: t.border }}>
            <TrendingUp size={16} style={{ color: isDark ? "#00CFFF" : "#0B3FD9" }} />
            <span className="text-sm font-bold" style={{ color: t.textSecondary }}>All Time</span>
          </div>
        </div>
      </div>

      {/* Pending Actions Banner */}
      {hasPendingItems && (
        <div className="rounded-2xl p-5 border flex flex-col md:flex-row items-start md:items-center justify-between gap-4" style={{ background: isDark ? "rgba(255,208,0,0.1)" : "#fffbeb", borderColor: isDark ? "rgba(255,208,0,0.3)" : "#fde68a" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: isDark ? "rgba(255,208,0,0.2)" : "#fef3c7", color: isDark ? "#FFD000" : "#d97706" }}>
              <AlertCircle size={20} />
            </div>
            <div>
              <h4 className="font-bold text-base" style={{ color: isDark ? "#FFD000" : "#d97706" }}>Action Required</h4>
              <p className="text-sm" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#92400e" }}>There are items awaiting your approval.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {pendingDrops > 0 && (
              <Link to={`${createPageUrl("AdminCenter")}?tab=drops`} className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition hover:opacity-80" style={{ background: isDark ? "#FFD000" : "#d97706", color: isDark ? "#000" : "#fff" }}>
                {pendingDrops} Pending Drops <ArrowUpRight size={14} />
              </Link>
            )}
            {pendingTerritories > 0 && (
              <Link to={`${createPageUrl("AdminCenter")}?tab=territory-assign`} className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition hover:opacity-80" style={{ background: isDark ? "rgba(255,208,0,0.2)" : "#fef3c7", color: isDark ? "#FFD000" : "#d97706" }}>
                {pendingTerritories} Territory Approvals <ArrowUpRight size={14} />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} t={t} isDark={isDark} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="rounded-[1.5rem] p-6 shadow-lg relative overflow-hidden border" style={{ background: t.surface, borderColor: t.border }}>
          <div className="absolute top-0 left-0 w-full h-1" style={{ background: t.gradient }} />
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>User Growth Trend</h3>
              <p className="text-xs mt-1" style={{ color: t.textSecondary }}>Platform registrations over time</p>
            </div>
            <div className="px-4 py-1.5 rounded-full text-xs font-bold" style={{ background: isDark ? "rgba(0,207,255,0.15)" : "#eff6ff", border: `1px solid ${isDark ? "rgba(0,207,255,0.3)" : "#bfdbfe"}`, color: isDark ? "#00CFFF" : "#2563eb" }}>
              +{scopedUsers.length} total
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? "#00CFFF" : "#0B3FD9"} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isDark ? "#00CFFF" : "#0B3FD9"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartGridColor} vertical={false} />
                <XAxis dataKey="name" stroke={chartAxisColor} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={chartAxisColor} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip color={isDark ? "#00CFFF" : "#0B3FD9"} t={t} />} cursor={{ stroke: chartAxisColor, strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Area type="monotone" dataKey="users" stroke={isDark ? "#00CFFF" : "#0B3FD9"} strokeWidth={3} fill="url(#userGradient)" dot={{ r: 4, fill: isDark ? "#00CFFF" : "#0B3FD9", strokeWidth: 0 }} activeDot={{ r: 6, fill: isDark ? "#00CFFF" : "#0B3FD9", strokeWidth: 2, stroke: t.surface }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Glow Drops */}
        <div className="rounded-[1.5rem] p-6 shadow-lg relative overflow-hidden border" style={{ background: t.surface, borderColor: t.border }}>
          <div className="absolute top-0 left-0 w-full h-1" style={{ background: t.gold }} />
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Daily Glow Drops</h3>
              <p className="text-xs mt-1" style={{ color: t.textSecondary }}>Content created this week</p>
            </div>
            <div className="px-4 py-1.5 rounded-full text-xs font-bold" style={{ background: isDark ? "rgba(255,208,0,0.15)" : "#fffbeb", border: `1px solid ${isDark ? "rgba(255,208,0,0.3)" : "#fde68a"}`, color: isDark ? "#FFD000" : "#d97706" }}>
              {scopedDrops.length} total
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dropsData} barSize={32} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isDark ? "#FFD000" : "#d97706"} stopOpacity={1} />
                    <stop offset="100%" stopColor={isDark ? "#f97316" : "#b45309"} stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartGridColor} vertical={false} />
                <XAxis dataKey="name" stroke={chartAxisColor} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={chartAxisColor} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip color={isDark ? "#FFD000" : "#d97706"} t={t} />} cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(11,27,61,0.05)", radius: 8 }} />
                <Bar dataKey="drops" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom quick-summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-[1.25rem] p-5 flex items-center gap-4 border shadow-sm" style={{ background: t.surface, borderColor: t.border }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: isDark ? "rgba(0,207,255,0.15)" : "#eff6ff", border: `1px solid ${isDark ? "rgba(0,207,255,0.2)" : "#bfdbfe"}` }}>
            <Users size={24} style={{ color: isDark ? "#00CFFF" : "#2563eb" }} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-bold mb-1" style={{ color: t.textSecondary }}>New This Month</p>
            <p className="text-3xl font-black font-['Space_Grotesk']" style={{ color: t.textPrimary }}>{growthData[growthData.length - 1]?.users ?? 0}</p>
          </div>
        </div>
        <div className="rounded-[1.25rem] p-5 flex items-center gap-4 border shadow-sm" style={{ background: t.surface, borderColor: t.border }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: isDark ? "rgba(138,92,255,0.15)" : "#f3e8ff", border: `1px solid ${isDark ? "rgba(138,92,255,0.2)" : "#e9d5ff"}` }}>
            <Zap size={24} style={{ color: isDark ? "#8A5CFF" : "#7e22ce" }} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-bold mb-1" style={{ color: t.textSecondary }}>Drops This Week</p>
            <p className="text-3xl font-black font-['Space_Grotesk']" style={{ color: t.textPrimary }}>{recentDrops}</p>
          </div>
        </div>
        <div className="rounded-[1.25rem] p-5 flex items-center gap-4 border shadow-md relative overflow-hidden" style={{ background: t.accentSoft, borderColor: t.borderStrong }}>
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg relative z-10" style={{ background: t.gradient, color: "#fff" }}>
            <ShieldCheck size={26} />
          </div>
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-wider font-bold mb-1" style={{ color: t.accent }}>System Health</p>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-green-500" />
              <p className="text-sm font-bold" style={{ color: t.textPrimary }}>All Systems Nominal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}