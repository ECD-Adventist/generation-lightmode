import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import {
  Users, Zap, Target, Globe, Activity, Trophy, TrendingUp, ArrowUpRight,
  AlertCircle, Send, CheckCircle2, ShieldCheck, Heart, MessageSquare, Eye, Flame
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";
import { formatDistanceToNow } from "date-fns";

/* ─── Stat Card ─────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon: Icon, color, trend, to, t, isDark }) => {
  const content = (
    <div className="relative overflow-hidden rounded-2xl p-5 group hover:-translate-y-0.5 transition-all duration-300 cursor-pointer border"
         style={{
           background: isDark ? t.surface : "#FFFFFF",
           borderColor: isDark ? t.border : "rgba(11,27,61,0.06)",
           boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 8px 30px -10px rgba(11,27,61,0.1)"
         }}>
      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-[35px] opacity-20 pointer-events-none group-hover:opacity-35 transition-opacity" style={{ background: color }} />
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.15em] mb-1" style={{ color: t.textMuted }}>{label}</p>
          <h3 className="text-3xl font-black font-['Space_Grotesk'] leading-none" style={{ color: t.textPrimary }}>{typeof value === "number" ? value.toLocaleString() : value}</h3>
          {trend && (
            <div className="flex items-center gap-1 mt-3 px-2 py-0.5 rounded w-fit" style={{ background: isDark ? "rgba(34,197,94,0.15)" : "#dcfce7" }}>
              <ArrowUpRight size={12} className={isDark ? "text-green-400" : "text-green-600"} />
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: isDark ? "#4ade80" : "#16a34a" }}>{trend}</span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
          <Icon size={22} style={{ color }} />
        </div>
      </div>
    </div>
  );
  return to ? <Link to={to} className="block">{content}</Link> : content;
};

/* ─── Chart Tooltip ─────────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label, color, t }) => {
  if (active && payload && payload.length) {
    return (
      <div className="border rounded-lg px-3 py-2 shadow-xl backdrop-blur-md" style={{ background: t.surface, borderColor: t.border }}>
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>{label}</p>
        <p className="text-lg font-black" style={{ color }}>{payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

/* ─── Main Dashboard ────────────────────────────────────────────────────── */
export default function AdminDashboardTab({ user, territoryRestricted, territoryCountries, territoryApproved }) {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";

  const allowedCountries = (territoryCountries || "").split(",").map(item => item.trim()).filter(Boolean);
  const { data: users = [] } = useQuery({ queryKey: ["admin_users"], queryFn: () => base44.functions.invoke("listPublicUsers", {}).then(res => res.data) });
  const { data: drops = [] } = useQuery({ queryKey: ["admin_drops"], queryFn: () => base44.entities.GlowDrop.list() });
  const { data: groups = [] } = useQuery({ queryKey: ["admin_groups"], queryFn: () => base44.entities.GlowGroup.list() });
  const { data: challenges = [] } = useQuery({ queryKey: ["admin_challenges"], queryFn: () => base44.entities.Challenge.list() });

  const scopedUsers = territoryRestricted && territoryApproved ? users.filter(entry => allowedCountries.includes(entry.country)) : users;
  const scopedDrops = territoryRestricted && territoryApproved ? drops.filter(drop => { const owner = users.find(entry => entry.email === drop.user_email); return owner && allowedCountries.includes(owner.country); }) : drops;
  const scopedGroups = territoryRestricted && territoryApproved ? groups.filter(group => allowedCountries.includes(group.country)) : groups;

  const pendingDrops = scopedDrops.filter(d => d.status === "pending").length;
  const pendingTerritories = scopedUsers.filter(u => u.territory_status === "pending").length;
  const hasPendingItems = pendingDrops > 0 || pendingTerritories > 0;

  const growthData = useMemo(() => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const counts = {};
    scopedUsers.forEach(u => { if (!u.created_date) return; const d = new Date(u.created_date); const key = months[d.getMonth()] + " " + d.getFullYear(); counts[key] = (counts[key] || 0) + 1; });
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1); const key = months[d.getMonth()] + " " + d.getFullYear(); return { name: months[d.getMonth()], users: counts[key] || 0 }; });
  }, [scopedUsers]);

  const dropsData = useMemo(() => {
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const counts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    scopedDrops.forEach(d => { if (!d.created_date) return; const day = days[new Date(d.created_date).getDay()]; counts[day]++; });
    return ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(name => ({ name, drops: counts[name] }));
  }, [scopedDrops]);

  const uniqueCountries = useMemo(() => new Set(scopedUsers.map(u => u.country).filter(Boolean)).size || 0, [scopedUsers]);
  const recentDrops = useMemo(() => { const cutoff = Date.now() - 7 * 86400000; return scopedDrops.filter(d => d.created_date && new Date(d.created_date) > cutoff).length; }, [scopedDrops]);
  const totalLikes = useMemo(() => scopedDrops.reduce((s, d) => s + (d.likes_count || 0), 0), [scopedDrops]);
  const engagementRate = useMemo(() => scopedUsers.length > 0 ? ((scopedDrops.length / scopedUsers.length) * 100).toFixed(1) : "0.0", [scopedUsers, scopedDrops]);

  // Top Performers
  const topPerformers = useMemo(() => {
    const map = {};
    scopedDrops.forEach(d => {
      if (!d.user_email) return;
      if (!map[d.user_email]) map[d.user_email] = { email: d.user_email, drops: 0, likes: 0 };
      map[d.user_email].drops++;
      map[d.user_email].likes += d.likes_count || 0;
    });
    return Object.values(map).sort((a, b) => b.likes - a.likes).slice(0, 5).map(p => {
      const u = users.find(u => u.email === p.email);
      return { ...p, name: u?.full_name || p.email?.split("@")[0], avatar: u?.profile_picture_url };
    });
  }, [scopedDrops, users]);

  // Recent Activity
  const recentActivity = useMemo(() => {
    return [...scopedDrops].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5).map(d => {
      const u = users.find(u => u.email === d.user_email);
      return { id: d.id, user: u?.full_name || d.user_email?.split("@")[0], avatar: u?.profile_picture_url, verse: d.verse, time: d.created_date, likes: d.likes_count || 0, status: d.status };
    });
  }, [scopedDrops, users]);

  const stats = [
    { label: "Total Users", value: scopedUsers.length, icon: Users, color: isDark ? "#00CFFF" : "#0B3FD9", to: `${createPageUrl("AdminCenter")}?tab=users` },
    { label: "Total Drops", value: scopedDrops.length, icon: Zap, color: isDark ? "#FFD000" : "#d97706", trend: `${recentDrops} this week`, to: `${createPageUrl("AdminCenter")}?tab=drops` },
    { label: "Active Groups", value: scopedGroups.length, icon: Activity, color: isDark ? "#8A5CFF" : "#7e22ce", to: `${createPageUrl("AdminCenter")}?tab=groups` },
    { label: "Challenges", value: challenges.filter(c => c.active).length, icon: Target, color: isDark ? "#ef4444" : "#dc2626", to: `${createPageUrl("AdminCenter")}?tab=challenges` },
    { label: "Countries", value: uniqueCountries, icon: Globe, color: isDark ? "#22c55e" : "#16a34a", to: `${createPageUrl("AdminCenter")}?tab=countries` },
    { label: "Total Likes", value: totalLikes, icon: Heart, color: isDark ? "#f43f5e" : "#e11d48", to: `${createPageUrl("AdminCenter")}?tab=drops` },
  ];

  if (territoryRestricted && !territoryApproved) {
    return <div className="rounded-2xl p-6 text-sm border" style={{ background: t.surface, borderColor: t.border, color: t.textSecondary }}>Please confirm your territory map first to unlock your scoped dashboard.</div>;
  }

  const chartAxis = isDark ? "#6B7FA0" : "#94a3b8";
  const chartGrid = isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)";

  return (
    <div className="space-y-7 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.2em]">Live Dashboard</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black font-['Space_Grotesk'] tracking-tight" style={{ color: t.textPrimary }}>Welcome back, {user?.full_name?.split(" ")[0] || "Admin"}</h1>
          <p className="text-sm mt-1.5" style={{ color: t.textSecondary }}>Here's what's happening across the movement right now.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`${createPageUrl("AdminCenter")}?tab=drops`} className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all hover:-translate-y-0.5 border" style={{ background: isDark ? "rgba(255,208,0,0.1)" : "#fffbeb", color: isDark ? "#FFD000" : "#d97706", borderColor: isDark ? "rgba(255,208,0,0.2)" : "#fde68a" }}>
            <Zap size={14} /> Review Drops
          </Link>
          <Link to={`${createPageUrl("AdminCenter")}?tab=notifications`} className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all hover:-translate-y-0.5 border" style={{ background: isDark ? "rgba(0,207,255,0.1)" : "#eff6ff", color: isDark ? "#00CFFF" : "#2563eb", borderColor: isDark ? "rgba(0,207,255,0.2)" : "#bfdbfe" }}>
            <Send size={14} /> Broadcast
          </Link>
        </div>
      </div>

      {/* Pending Banner */}
      {hasPendingItems && (
        <div className="rounded-2xl p-4 border flex flex-col md:flex-row items-start md:items-center justify-between gap-3" style={{ background: isDark ? "rgba(255,208,0,0.08)" : "#fffbeb", borderColor: isDark ? "rgba(255,208,0,0.2)" : "#fde68a" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: isDark ? "rgba(255,208,0,0.2)" : "#fef3c7", color: isDark ? "#FFD000" : "#d97706" }}>
              <AlertCircle size={18} />
            </div>
            <div>
              <h4 className="font-bold text-sm" style={{ color: isDark ? "#FFD000" : "#d97706" }}>Action Required</h4>
              <p className="text-xs" style={{ color: isDark ? "rgba(255,255,255,0.6)" : "#92400e" }}>Items awaiting your approval.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {pendingDrops > 0 && (
              <Link to={`${createPageUrl("AdminCenter")}?tab=drops`} className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition" style={{ background: isDark ? "#FFD000" : "#d97706", color: isDark ? "#000" : "#fff" }}>
                {pendingDrops} Pending Drops <ArrowUpRight size={12} />
              </Link>
            )}
            {pendingTerritories > 0 && (
              <Link to={`${createPageUrl("AdminCenter")}?tab=territory-assign`} className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition" style={{ background: isDark ? "rgba(255,208,0,0.2)" : "#fef3c7", color: isDark ? "#FFD000" : "#d97706" }}>
                {pendingTerritories} Territory Approvals <ArrowUpRight size={12} />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, i) => <StatCard key={i} {...stat} t={t} isDark={isDark} />)}
      </div>

      {/* Charts + Engagement Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* User Growth — spans 2 cols */}
        <div className="lg:col-span-2 rounded-2xl p-5 border relative overflow-hidden" style={{ background: t.surface, borderColor: t.border }}>
          <div className="absolute top-0 left-0 w-full h-[3px]" style={{ background: t.gradient }} />
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>User Growth</h3>
              <p className="text-[10px] mt-0.5" style={{ color: t.textMuted }}>Registrations over 6 months</p>
            </div>
            <div className="px-3 py-1 rounded-full text-[10px] font-bold" style={{ background: isDark ? "rgba(0,207,255,0.12)" : "#eff6ff", color: isDark ? "#00CFFF" : "#2563eb" }}>+{scopedUsers.length}</div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="ugDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? "#00CFFF" : "#0B3FD9"} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={isDark ? "#00CFFF" : "#0B3FD9"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartGrid} vertical={false} />
                <XAxis dataKey="name" stroke={chartAxis} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={chartAxis} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip color={isDark ? "#00CFFF" : "#0B3FD9"} t={t} />} cursor={{ stroke: chartAxis, strokeDasharray: "4 4" }} />
                <Area type="monotone" dataKey="users" stroke={isDark ? "#00CFFF" : "#0B3FD9"} strokeWidth={2.5} fill="url(#ugDash)" dot={{ r: 3.5, fill: isDark ? "#00CFFF" : "#0B3FD9", strokeWidth: 0 }} activeDot={{ r: 5.5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="rounded-2xl p-5 border flex flex-col justify-between" style={{ background: t.surface, borderColor: t.border }}>
          <div>
            <h3 className="text-base font-bold font-['Space_Grotesk'] mb-1" style={{ color: t.textPrimary }}>Engagement</h3>
            <p className="text-[10px]" style={{ color: t.textMuted }}>Community health snapshot</p>
          </div>
          <div className="space-y-4 mt-5">
            {[
              { label: "Engagement Rate", value: `${engagementRate}%`, icon: <Eye size={18} />, color: isDark ? "#00CFFF" : "#0B3FD9" },
              { label: "Avg Likes / Drop", value: scopedDrops.length > 0 ? (totalLikes / scopedDrops.length).toFixed(1) : "0", icon: <Heart size={18} />, color: isDark ? "#f43f5e" : "#e11d48" },
              { label: "Approved Drops", value: scopedDrops.filter(d => d.status === "approved").length, icon: <CheckCircle2 size={18} />, color: isDark ? "#22c55e" : "#16a34a" },
              { label: "Active Streak", value: `${recentDrops}/wk`, icon: <Flame size={18} />, color: isDark ? "#FFD000" : "#d97706" },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${m.color}12`, border: `1px solid ${m.color}20` }}>
                  <span style={{ color: m.color }}>{m.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>{m.label}</p>
                  <p className="text-lg font-black font-['Space_Grotesk']" style={{ color: t.textPrimary }}>{m.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Drops + Top Performers + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Daily Drops Chart */}
        <div className="rounded-2xl p-5 border relative overflow-hidden" style={{ background: t.surface, borderColor: t.border }}>
          <div className="absolute top-0 left-0 w-full h-[3px]" style={{ background: t.gold }} />
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Weekly Drops</h3>
              <p className="text-[10px] mt-0.5" style={{ color: t.textMuted }}>Content by day</p>
            </div>
            <div className="px-3 py-1 rounded-full text-[10px] font-bold" style={{ background: isDark ? "rgba(255,208,0,0.12)" : "#fffbeb", color: isDark ? "#FFD000" : "#d97706" }}>{recentDrops} wk</div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dropsData} barSize={24} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="bgDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isDark ? "#FFD000" : "#d97706"} stopOpacity={1} />
                    <stop offset="100%" stopColor={isDark ? "#f97316" : "#b45309"} stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartGrid} vertical={false} />
                <XAxis dataKey="name" stroke={chartAxis} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={chartAxis} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip color={isDark ? "#FFD000" : "#d97706"} t={t} />} cursor={{ fill: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", radius: 6 }} />
                <Bar dataKey="drops" fill="url(#bgDash)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers */}
        <div className="rounded-2xl p-5 border" style={{ background: t.surface, borderColor: t.border }}>
          <h3 className="text-base font-bold font-['Space_Grotesk'] mb-1" style={{ color: t.textPrimary }}>Top Performers</h3>
          <p className="text-[10px] mb-4" style={{ color: t.textMuted }}>By total likes received</p>
          <div className="space-y-3">
            {topPerformers.length === 0 && <p className="text-xs" style={{ color: t.textMuted }}>No data yet.</p>}
            {topPerformers.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-black w-5 text-center" style={{ color: i === 0 ? (isDark ? "#FFD000" : "#d97706") : t.textMuted }}>{i + 1}</span>
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border" style={{ borderColor: t.border }}>
                  <img src={p.avatar || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: t.textPrimary }}>{p.name}</p>
                  <p className="text-[10px]" style={{ color: t.textMuted }}>{p.drops} drops</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold" style={{ color: isDark ? "#f43f5e" : "#e11d48" }}>
                  <Heart size={12} /> {p.likes}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl p-5 border" style={{ background: t.surface, borderColor: t.border }}>
          <h3 className="text-base font-bold font-['Space_Grotesk'] mb-1" style={{ color: t.textPrimary }}>Recent Activity</h3>
          <p className="text-[10px] mb-4" style={{ color: t.textMuted }}>Latest drops submitted</p>
          <div className="space-y-3">
            {recentActivity.length === 0 && <p className="text-xs" style={{ color: t.textMuted }}>No drops yet.</p>}
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 mt-0.5 border" style={{ borderColor: t.border }}>
                  <img src={a.avatar || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate"><span className="font-bold" style={{ color: t.textPrimary }}>{a.user}</span> <span style={{ color: t.textMuted }}>posted a drop</span></p>
                  <p className="text-[10px] truncate mt-0.5" style={{ color: t.textSecondary }}>"{a.verse || "No verse"}"</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[9px] font-bold" style={{ color: t.textMuted }}>{a.time ? formatDistanceToNow(new Date(a.time), { addSuffix: true }) : ""}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${a.status === "approved" ? (isDark ? "bg-green-500/10 text-green-400" : "bg-green-100 text-green-700") : a.status === "rejected" ? (isDark ? "bg-red-500/10 text-red-400" : "bg-red-100 text-red-700") : (isDark ? "bg-yellow-500/10 text-yellow-400" : "bg-amber-100 text-amber-700")}`}>{a.status || "pending"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl p-4 flex items-center gap-3 border" style={{ background: t.surface, borderColor: t.border }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: isDark ? "rgba(0,207,255,0.12)" : "#eff6ff" }}>
            <Users size={20} style={{ color: isDark ? "#00CFFF" : "#2563eb" }} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: t.textMuted }}>New This Month</p>
            <p className="text-2xl font-black font-['Space_Grotesk']" style={{ color: t.textPrimary }}>{growthData[growthData.length - 1]?.users ?? 0}</p>
          </div>
        </div>
        <div className="rounded-2xl p-4 flex items-center gap-3 border" style={{ background: t.surface, borderColor: t.border }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: isDark ? "rgba(138,92,255,0.12)" : "#f3e8ff" }}>
            <MessageSquare size={20} style={{ color: isDark ? "#8A5CFF" : "#7e22ce" }} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: t.textMuted }}>Active Groups</p>
            <p className="text-2xl font-black font-['Space_Grotesk']" style={{ color: t.textPrimary }}>{scopedGroups.length}</p>
          </div>
        </div>
        <div className="rounded-2xl p-4 flex items-center gap-3 border relative overflow-hidden" style={{ background: t.accentSoft, borderColor: t.borderStrong }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: t.gradient, color: "#fff" }}>
            <ShieldCheck size={20} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: t.accent }}>System Health</p>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-green-500" />
              <p className="text-xs font-bold" style={{ color: t.textPrimary }}>All Systems Nominal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}