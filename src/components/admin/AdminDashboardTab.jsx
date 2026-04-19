import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Users, Zap, Target, Globe, Activity, Trophy, TrendingUp, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";

const StatCard = ({ label, value, icon: Icon, color, trend, to, t }) => {
  const content = (
    <div className={`relative overflow-hidden rounded-2xl p-5 border group hover:scale-[1.02] transition-transform duration-300 cursor-pointer`}
         style={{ background: t.surface, borderColor: t.border, boxShadow: t.shadow }}>
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-30 pointer-events-none" style={{ background: color }} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: t.textSecondary }}>{label}</p>
          <h3 className="text-3xl font-black font-['Space_Grotesk'] leading-none" style={{ color: t.textPrimary }}>{typeof value === "number" ? value.toLocaleString() : value}</h3>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight size={12} className="text-green-500" />
              <span className="text-xs text-green-500 font-semibold">{trend}</span>
            </div>
          )}
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
    </div>
  );
  return to ? <Link to={to} className="block">{content}</Link> : content;
};

const CustomTooltip = ({ active, payload, label, color, t }) => {
  if (active && payload && payload.length) {
    return (
      <div className="border rounded-xl px-4 py-3 shadow-2xl" style={{ background: t.surface, borderColor: t.border }}>
        <p className="text-xs mb-1" style={{ color: t.textSecondary }}>{label}</p>
        <p className="text-lg font-black" style={{ color }}>{payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function AdminDashboardTab({ user, territoryRestricted, territoryCountries, territoryApproved }) {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";

  const allowedCountries = (territoryCountries || "").split(",").map(item => item.trim()).filter(Boolean);
  const { data: users = [] } = useQuery({ queryKey: ["admin_users"], queryFn: () => base44.functions.invoke("listPublicUsers", {}).then(res => res.data) });
  const { data: drops = [] } = useQuery({ queryKey: ["admin_drops"], queryFn: () => base44.entities.GlowDrop.list() });
  const { data: groups = [] } = useQuery({ queryKey: ["admin_groups"], queryFn: () => base44.entities.GlowGroup.list() });
  const { data: challenges = [] } = useQuery({ queryKey: ["admin_challenges"], queryFn: () => base44.entities.Challenge.list() });

  const scopedUsers = territoryRestricted && territoryApproved
    ? users.filter(entry => allowedCountries.includes(entry.country))
    : users;

  const scopedDrops = territoryRestricted && territoryApproved
    ? drops.filter(drop => {
        const owner = users.find(entry => entry.email === drop.user_email);
        return owner && allowedCountries.includes(owner.country);
      })
    : drops;

  const scopedGroups = territoryRestricted && territoryApproved
    ? groups.filter(group => allowedCountries.includes(group.country))
    : groups;

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

  const uniqueCountries = useMemo(() => {
    const set = new Set(scopedUsers.map(u => u.country).filter(Boolean));
    return set.size || 0;
  }, [scopedUsers]);

  const recentDrops = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return scopedDrops.filter(d => d.created_date && new Date(d.created_date) > cutoff).length;
  }, [scopedDrops]);

  const stats = [
    { label: "Total Users", value: scopedUsers.length, icon: Users, color: "#00CFFF", to: `${createPageUrl("AdminCenter")}?tab=users` },
    { label: "Total Glow Drops", value: scopedDrops.length, icon: Zap, color: "#FFD000", trend: `${recentDrops} this week`, to: `${createPageUrl("AdminCenter")}?tab=drops` },
    { label: "Active Groups", value: scopedGroups.length, icon: Activity, color: "#8A5CFF", to: `${createPageUrl("AdminCenter")}?tab=groups` },
    { label: "Active Challenges", value: challenges.filter(c => c.active).length, icon: Target, color: "#ef4444", to: `${createPageUrl("AdminCenter")}?tab=challenges` },
    { label: "Countries", value: uniqueCountries, icon: Globe, color: "#22c55e", to: `${createPageUrl("AdminCenter")}?tab=countries` },
    { label: "Approved Drops", value: scopedDrops.filter(d => d.status === "approved").length, icon: Trophy, color: "#f97316", to: `${createPageUrl("AdminCenter")}?tab=drops` },
  ];

  if (territoryRestricted && !territoryApproved) {
    return <div className="rounded-2xl p-6 text-sm" style={{ background: t.surface, borderColor: t.border, color: t.textSecondary }}>Please confirm your territory map first to unlock your scoped dashboard.</div>;
  }

  const chartAxisColor = isDark ? "#6B7FA0" : "#8A97B5";
  const chartGridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(11,27,61,0.05)";

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-green-500 uppercase tracking-widest">Live Dashboard</span>
          </div>
          <h1 className="text-3xl font-black font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Platform Overview</h1>
          <p className="text-sm mt-1" style={{ color: t.textSecondary }}>Real-time activity and key metrics across the movement.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 rounded-xl px-4 py-2 border" style={{ background: t.surface, borderColor: t.border }}>
          <TrendingUp size={16} className="text-[#00CFFF]" />
          <span className="text-sm font-semibold" style={{ color: t.textSecondary }}>Reporting: All Time</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} t={t} isDark={isDark} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="rounded-2xl p-6 shadow-xl relative overflow-hidden border" style={{ background: t.surface, borderColor: t.border }}>
          <div className="absolute top-0 left-0 w-full h-1" style={{ background: t.gradient }} />
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>User Growth Trend</h3>
              <p className="text-xs mt-0.5" style={{ color: t.textSecondary }}>Platform registrations over time</p>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.2)", color: "#00CFFF" }}>+{scopedUsers.length} total</div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00CFFF" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00CFFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartGridColor} vertical={false} />
                <XAxis dataKey="name" stroke={chartAxisColor} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={chartAxisColor} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip color="#00CFFF" t={t} />} />
                <Area type="monotone" dataKey="users" stroke="#00CFFF" strokeWidth={2.5} fill="url(#userGradient)" dot={{ r: 4, fill: "#00CFFF", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#00CFFF" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Glow Drops */}
        <div className="rounded-2xl p-6 shadow-xl relative overflow-hidden border" style={{ background: t.surface, borderColor: t.border }}>
          <div className="absolute top-0 left-0 w-full h-1" style={{ background: t.gold }} />
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Daily Glow Drops</h3>
              <p className="text-xs mt-0.5" style={{ color: t.textSecondary }}>Content created this week</p>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(255,208,0,0.1)", border: "1px solid rgba(255,208,0,0.2)", color: "#FFD000" }}>{scopedDrops.length} total</div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dropsData} barSize={28}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFD000" stopOpacity={1} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartGridColor} vertical={false} />
                <XAxis dataKey="name" stroke={chartAxisColor} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={chartAxisColor} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip color="#FFD000" t={t} />} cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "rgba(11,27,61,0.05)", radius: 8 }} />
                <Bar dataKey="drops" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom quick-summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5 flex items-center gap-4 border" style={{ background: t.surface, borderColor: t.border }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.2)" }}>
            <Users size={22} className="text-[#00CFFF]" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: t.textSecondary }}>New This Month</p>
            <p className="text-2xl font-black font-['Space_Grotesk']" style={{ color: t.textPrimary }}>{growthData[growthData.length - 1]?.users ?? 0}</p>
          </div>
        </div>
        <div className="rounded-2xl p-5 flex items-center gap-4 border" style={{ background: t.surface, borderColor: t.border }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(138,92,255,0.1)", border: "1px solid rgba(138,92,255,0.2)" }}>
            <Zap size={22} className="text-[#8A5CFF]" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: t.textSecondary }}>Drops This Week</p>
            <p className="text-2xl font-black font-['Space_Grotesk']" style={{ color: t.textPrimary }}>{recentDrops}</p>
          </div>
        </div>
        <div className="rounded-2xl p-5 flex items-center gap-4 border" style={{ background: t.accentSoft, borderColor: t.borderStrong }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: t.gradient, color: "#fff" }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: t.accent }}>Movement Status</p>
            <p className="text-sm font-bold mt-0.5" style={{ color: t.textPrimary }}>🔆 Faith. Always On.</p>
          </div>
        </div>
      </div>
    </div>
  );
}