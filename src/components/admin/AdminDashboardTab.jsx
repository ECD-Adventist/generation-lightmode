import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Users, Zap, Target, Globe, Activity, Trophy, TrendingUp, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";

const StatCard = ({ label, value, icon: Icon, color, bg, border, trend, to }) => {
  const content = (
    <div className={`relative overflow-hidden rounded-2xl p-5 border ${border} ${bg} group hover:scale-[1.02] transition-transform duration-300 cursor-pointer`}>
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-30 pointer-events-none" style={{ background: color }} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">{label}</p>
          <h3 className="text-3xl font-black font-['Space_Grotesk'] text-white leading-none">{typeof value === "number" ? value.toLocaleString() : value}</h3>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight size={12} className="text-green-400" />
              <span className="text-xs text-green-400 font-semibold">{trend}</span>
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

const CustomTooltip = ({ active, payload, label, color }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-lg font-black" style={{ color }}>{payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function AdminDashboardTab() {
  const { data: users = [] } = useQuery({ queryKey: ["admin_users"], queryFn: () => base44.functions.invoke("listPublicUsers", {}).then(res => res.data) });
  const { data: drops = [] } = useQuery({ queryKey: ["admin_drops"], queryFn: () => base44.entities.GlowDrop.list() });
  const { data: groups = [] } = useQuery({ queryKey: ["admin_groups"], queryFn: () => base44.entities.GlowGroup.list() });
  const { data: challenges = [] } = useQuery({ queryKey: ["admin_challenges"], queryFn: () => base44.entities.Challenge.list() });

  // Real user growth: bucket registrations by month
  const growthData = useMemo(() => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const counts = {};
    users.forEach(u => {
      if (!u.created_date) return;
      const d = new Date(u.created_date);
      const key = months[d.getMonth()] + " " + d.getFullYear();
      counts[key] = (counts[key] || 0) + 1;
    });
    // Get last 6 months
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const key = months[d.getMonth()] + " " + d.getFullYear();
      return { name: months[d.getMonth()], users: counts[key] || 0 };
    });
  }, [users]);

  // Real drops: bucket by day of week
  const dropsData = useMemo(() => {
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const counts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    drops.forEach(d => {
      if (!d.created_date) return;
      const day = days[new Date(d.created_date).getDay()];
      counts[day]++;
    });
    return ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(name => ({ name, drops: counts[name] }));
  }, [drops]);

  // Real unique countries from users
  const uniqueCountries = useMemo(() => {
    const set = new Set(users.map(u => u.country).filter(Boolean));
    return set.size || 0;
  }, [users]);

  // Drops in last 7 days
  const recentDrops = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return drops.filter(d => d.created_date && new Date(d.created_date) > cutoff).length;
  }, [drops]);

  const stats = [
    { label: "Total Users", value: users.length, icon: Users, color: "#00CFFF", bg: "bg-[#00CFFF]/5", border: "border-[#00CFFF]/15", to: `${createPageUrl("AdminCenter")}?tab=users` },
    { label: "Total Glow Drops", value: drops.length, icon: Zap, color: "#FFD000", bg: "bg-[#FFD000]/5", border: "border-[#FFD000]/15", trend: `${recentDrops} this week`, to: `${createPageUrl("AdminCenter")}?tab=drops` },
    { label: "Active Groups", value: groups.length, icon: Activity, color: "#8A5CFF", bg: "bg-[#8A5CFF]/5", border: "border-[#8A5CFF]/15", to: `${createPageUrl("AdminCenter")}?tab=groups` },
    { label: "Active Challenges", value: challenges.filter(c => c.active).length, icon: Target, color: "#ef4444", bg: "bg-red-500/5", border: "border-red-500/15", to: `${createPageUrl("AdminCenter")}?tab=challenges` },
    { label: "Countries", value: uniqueCountries, icon: Globe, color: "#22c55e", bg: "bg-green-500/5", border: "border-green-500/15", to: `${createPageUrl("AdminCenter")}?tab=countries` },
    { label: "Approved Drops", value: drops.filter(d => d.status === "approved").length, icon: Trophy, color: "#f97316", bg: "bg-orange-500/5", border: "border-orange-500/15", to: `${createPageUrl("AdminCenter")}?tab=drops` },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Live Dashboard</span>
          </div>
          <h1 className="text-3xl font-black font-['Space_Grotesk'] text-white">Platform Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time activity and key metrics across the movement.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-[#121826] border border-white/10 rounded-xl px-4 py-2">
          <TrendingUp size={16} className="text-[#00CFFF]" />
          <span className="text-sm font-semibold text-gray-300">Reporting: All Time</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="bg-[#0D1117] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF]" />
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold font-['Space_Grotesk'] text-white">User Growth Trend</h3>
              <p className="text-xs text-gray-500 mt-0.5">Platform registrations over time</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-[#00CFFF]/10 border border-[#00CFFF]/20 text-[#00CFFF] text-xs font-bold">+{users.length} total</div>
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
                <CartesianGrid stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="name" stroke="#444" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#444" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip color="#00CFFF" />} />
                <Area type="monotone" dataKey="users" stroke="#00CFFF" strokeWidth={2.5} fill="url(#userGradient)" dot={{ r: 4, fill: "#00CFFF", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#00CFFF" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Glow Drops */}
        <div className="bg-[#0D1117] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FFD000] to-[#f97316]" />
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold font-['Space_Grotesk'] text-white">Daily Glow Drops</h3>
              <p className="text-xs text-gray-500 mt-0.5">Content created this week</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-[#FFD000]/10 border border-[#FFD000]/20 text-[#FFD000] text-xs font-bold">{drops.length} total</div>
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
                <CartesianGrid stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="name" stroke="#444" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#444" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip color="#FFD000" />} cursor={{ fill: "rgba(255,208,0,0.05)", radius: 8 }} />
                <Bar dataKey="drops" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom quick-summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0D1117] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#00CFFF]/10 border border-[#00CFFF]/20 flex items-center justify-center shrink-0">
            <Users size={22} className="text-[#00CFFF]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">New This Month</p>
            <p className="text-2xl font-black text-white font-['Space_Grotesk']">{growthData[growthData.length - 1]?.users ?? 0}</p>
          </div>
        </div>
        <div className="bg-[#0D1117] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#8A5CFF]/10 border border-[#8A5CFF]/20 flex items-center justify-center shrink-0">
            <Zap size={22} className="text-[#8A5CFF]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Drops This Week</p>
            <p className="text-2xl font-black text-white font-['Space_Grotesk']">{recentDrops}</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-[#00CFFF]/10 to-[#8A5CFF]/10 border border-[#00CFFF]/20 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <TrendingUp size={22} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Movement Status</p>
            <p className="text-sm font-bold text-[#00CFFF] mt-0.5">🔆 Faith. Always On.</p>
          </div>
        </div>
      </div>
    </div>
  );
}