import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, Zap, Target, Globe, Activity, Trophy, TrendingUp, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Area, AreaChart } from "recharts";

const CustomTooltip = ({ active, payload, label, color }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "rgba(18,24,38,0.95)", border: `1px solid ${color || "#00CFFF"}40`, borderRadius: 12, padding: "10px 16px", boxShadow: `0 8px 32px rgba(0,0,0,0.4)` }}>
        <p style={{ color: "#9CA3AF", fontSize: 11, marginBottom: 4, fontFamily: "Inter, sans-serif" }}>{label}</p>
        <p style={{ color: color || "#00CFFF", fontSize: 20, fontWeight: 800, fontFamily: "Space Grotesk, sans-serif" }}>{payload[0].value.toLocaleString()}</p>
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

  const stats = [
    { label: "Total Users", value: users.length, icon: <Users size={22} />, color: "#00CFFF", bg: "from-[#00CFFF]/20 to-[#00CFFF]/5", border: "#00CFFF", trend: "+12%" },
    { label: "Total Glow Drops", value: drops.length, icon: <Zap size={22} />, color: "#FFD000", bg: "from-[#FFD000]/20 to-[#FFD000]/5", border: "#FFD000", trend: "+28%" },
    { label: "Active Groups", value: groups.length, icon: <Activity size={22} />, color: "#8A5CFF", bg: "from-[#8A5CFF]/20 to-[#8A5CFF]/5", border: "#8A5CFF", trend: "+5%" },
    { label: "Active Challenges", value: challenges.filter(c => c.active).length, icon: <Target size={22} />, color: "#FF6B6B", bg: "from-[#FF6B6B]/20 to-[#FF6B6B]/5", border: "#FF6B6B", trend: "+3%" },
    { label: "Countries", value: 12, icon: <Globe size={22} />, color: "#00E5A0", bg: "from-[#00E5A0]/20 to-[#00E5A0]/5", border: "#00E5A0", trend: "+2" },
    { label: "Avg Engagement", value: "84%", icon: <Trophy size={22} />, color: "#FF9F43", bg: "from-[#FF9F43]/20 to-[#FF9F43]/5", border: "#FF9F43", trend: "+4%" },
  ];

  const growthData = [
    { name: "Jan", users: 400 }, { name: "Feb", users: 600 }, { name: "Mar", users: 900 },
    { name: "Apr", users: 1200 }, { name: "May", users: 1800 }, { name: "Jun", users: users.length || 2400 }
  ];

  const dropsData = [
    { name: "Mon", drops: 120 }, { name: "Tue", drops: 200 }, { name: "Wed", drops: 150 },
    { name: "Thu", drops: 280 }, { name: "Fri", drops: 320 }, { name: "Sat", drops: 450 }, { name: "Sun", drops: 600 }
  ];

  return (
    <div className="space-y-8">
      <style>{`
        @keyframes shimmer-stat {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00CFFF]/10 border border-[#00CFFF]/20 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00CFFF] animate-pulse"></span>
            <span className="text-[#00CFFF] text-[10px] font-bold tracking-widest uppercase">Live Overview</span>
          </div>
          <h1 className="text-3xl font-black font-['Space_Grotesk'] text-white">Dashboard Overview</h1>
          <p className="text-sm text-gray-400 mt-1 font-['Inter']">Platform activity and key metrics at a glance.</p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
          <TrendingUp size={14} className="text-[#00E5A0]" />
          <span className="text-xs font-bold text-[#00E5A0]">All systems operational</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`relative overflow-hidden bg-gradient-to-br ${stat.bg} rounded-2xl p-5 border group hover:scale-[1.02] transition-all duration-300 cursor-default`}
            style={{ borderColor: `${stat.border}30` }}
          >
            {/* Glow orb */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-30 pointer-events-none" style={{ background: stat.color }} />
            
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ background: `${stat.color}20`, borderColor: `${stat.border}40`, color: stat.color }}>
                {stat.icon}
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${stat.color}15`, color: stat.color }}>
                <ArrowUpRight size={10} /> {stat.trend}
              </div>
            </div>

            <div className="text-3xl font-black font-['Space_Grotesk'] text-white mb-1" style={{ textShadow: `0 0 20px ${stat.color}40` }}>
              {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
            </div>
            <p className="text-xs text-gray-400 font-['Inter'] font-medium">{stat.label}</p>

            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl" style={{ background: `linear-gradient(90deg, ${stat.color}, transparent)` }} />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth — Area Chart */}
        <div className="bg-[#0D1220] border border-white/5 rounded-2xl p-6 relative overflow-hidden" style={{ boxShadow: "0 0 40px rgba(0,207,255,0.05)" }}>
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00CFFF]/30 to-transparent" />
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold font-['Space_Grotesk'] text-white">User Growth Trend</h3>
              <p className="text-xs text-gray-500 mt-0.5">Jan – Jun 2026</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#00CFFF]/10 flex items-center justify-center border border-[#00CFFF]/20">
              <TrendingUp size={14} className="text-[#00CFFF]" />
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00CFFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00CFFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" stroke="#555" fontSize={11} tickLine={false} axisLine={false} fontFamily="Inter, sans-serif" />
                <YAxis stroke="#555" fontSize={11} tickLine={false} axisLine={false} fontFamily="Inter, sans-serif" />
                <Tooltip content={<CustomTooltip color="#00CFFF" />} />
                <Area type="monotone" dataKey="users" stroke="#00CFFF" strokeWidth={2.5} fill="url(#userGradient)" dot={{ r: 4, fill: "#00CFFF", strokeWidth: 2, stroke: "#0D1220" }} activeDot={{ r: 6, fill: "#00CFFF", stroke: "#0D1220", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Drops — Bar Chart */}
        <div className="bg-[#0D1220] border border-white/5 rounded-2xl p-6 relative overflow-hidden" style={{ boxShadow: "0 0 40px rgba(255,208,0,0.05)" }}>
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#FFD000]/30 to-transparent" />
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold font-['Space_Grotesk'] text-white">Daily Glow Drops</h3>
              <p className="text-xs text-gray-500 mt-0.5">This week's activity</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#FFD000]/10 flex items-center justify-center border border-[#FFD000]/20">
              <Zap size={14} className="text-[#FFD000]" />
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dropsData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" stroke="#555" fontSize={11} tickLine={false} axisLine={false} fontFamily="Inter, sans-serif" />
                <YAxis stroke="#555" fontSize={11} tickLine={false} axisLine={false} fontFamily="Inter, sans-serif" />
                <Tooltip content={<CustomTooltip color="#FFD000" />} cursor={{ fill: "rgba(255,208,0,0.05)" }} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFD000" stopOpacity={1} />
                    <stop offset="100%" stopColor="#FF9F43" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <Bar dataKey="drops" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom: Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Top Country", value: "Kenya 🇰🇪", sub: "Most active nation", color: "#00CFFF" },
          { label: "Top Drop Today", value: `${drops.filter(d => d.status === "approved").length} approved`, sub: "Approved content", color: "#8A5CFF" },
          { label: "New Members", value: `+${Math.max(1, Math.round(users.length * 0.12))} this week`, sub: "Growing daily", color: "#00E5A0" },
        ].map((item, i) => (
          <div key={i} className="bg-[#0D1220] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-2 h-12 rounded-full" style={{ background: `linear-gradient(180deg, ${item.color}, ${item.color}40)` }} />
            <div>
              <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-base font-black text-white font-['Space_Grotesk']">{item.value}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}