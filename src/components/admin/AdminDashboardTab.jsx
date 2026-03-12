import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, Zap, Target, Globe, Activity, Trophy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function AdminDashboardTab() {
  const { data: users = [] } = useQuery({ queryKey: ["admin_users"], queryFn: () => base44.functions.invoke("listPublicUsers", {}).then(res => res.data) });
  const { data: drops = [] } = useQuery({ queryKey: ["admin_drops"], queryFn: () => base44.entities.GlowDrop.list() });
  const { data: groups = [] } = useQuery({ queryKey: ["admin_groups"], queryFn: () => base44.entities.GlowGroup.list() });
  const { data: challenges = [] } = useQuery({ queryKey: ["admin_challenges"], queryFn: () => base44.entities.Challenge.list() });

  const stats = [
    { label: "Total Users", value: users.length, icon: <Users size={20} className="text-[#00CFFF]" /> },
    { label: "Total Glow Drops", value: drops.length, icon: <Zap size={20} className="text-[#FFD000]" /> },
    { label: "Active Groups", value: groups.length, icon: <Activity size={20} className="text-[#8A5CFF]" /> },
    { label: "Active Challenges", value: challenges.filter(c => c.active).length, icon: <Target size={20} className="text-red-400" /> },
    { label: "Countries", value: 12, icon: <Globe size={20} className="text-green-400" /> },
    { label: "Avg Engagement", value: "84%", icon: <Trophy size={20} className="text-orange-400" /> },
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk']">Dashboard Overview</h1>
        <p className="text-sm md:text-base text-gray-400 mt-1">Platform activity and key metrics at a glance.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[#121826] border border-white/5 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between shadow-lg gap-3">
            <div>
              <p className="text-xs md:text-sm text-gray-400 mb-1 font-medium">{stat.label}</p>
              <h3 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk']">{stat.value.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-[#121826] border border-white/5 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold mb-6 font-['Space_Grotesk'] text-[#00CFFF]">User Growth Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#121826', border: '1px solid #333', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="users" stroke="#00CFFF" strokeWidth={3} dot={{ r: 4, fill: '#00CFFF' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#121826] border border-white/5 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold mb-6 font-['Space_Grotesk'] text-[#FFD000]">Daily Glow Drops</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dropsData}>
                <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#121826', border: '1px solid #333', borderRadius: '8px' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <Bar dataKey="drops" fill="#FFD000" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}