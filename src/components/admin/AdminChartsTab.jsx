import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Users, Zap, TrendingUp, Globe } from "lucide-react";
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#121826] border border-white/10 rounded-xl px-4 py-3 text-sm shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function AdminChartsTab({ territoryRestricted, territoryCountries, territoryApproved }) {
  const { data: rawUsers = [] } = useQuery({
    queryKey: ["charts_users"],
    queryFn: () => base44.functions.invoke("listPublicUsers", {}).then(r => r.data || []),
  });
  const { data: groups = [] } = useQuery({
    queryKey: ["charts_groups"],
    queryFn: () => base44.entities.GlowGroup.list(),
  });
  const { data: drops = [] } = useQuery({
    queryKey: ["charts_drops"],
    queryFn: () => base44.entities.GlowDrop.list("-created_date", 500),
  });

  const allowedCountries = (territoryCountries || "").split(",").map(s => s.trim()).filter(Boolean);

  const users = territoryRestricted && territoryApproved
    ? rawUsers.filter(u => allowedCountries.includes(u.country))
    : rawUsers;

  // --- Registration growth (last 30 days) ---
  const registrationData = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    return days.map(day => {
      const label = format(day, "MMM d");
      const dayStart = startOfDay(day).getTime();
      const dayEnd = dayStart + 86400000;
      const count = users.filter(u => {
        const t = u.created_date ? new Date(u.created_date).getTime() : 0;
        return t >= dayStart && t < dayEnd;
      }).length;
      return { date: label, "New Users": count };
    });
  }, [users]);

  // --- Territory engagement ---
  const territoryData = useMemo(() => {
    const map = {};
    users.forEach(u => {
      const key = u.territory_name || u.country || "Unknown";
      if (!map[key]) map[key] = { territory: key, users: 0, xp: 0, drops: 0 };
      map[key].users++;
      map[key].xp += u.glow_score || 0;
    });
    drops.forEach(d => {
      const u = users.find(u => u.email === d.user_email);
      const key = (u?.territory_name || u?.country || "Unknown");
      if (map[key]) map[key].drops++;
    });
    return Object.values(map).sort((a, b) => b.xp - a.xp).slice(0, 10);
  }, [users, drops]);

  // --- Top GlowGroup leaders per region ---
  const leaderData = useMemo(() => {
    const leaderEmails = [...new Set(groups.map(g => g.leader_email))];
    return leaderEmails.map(email => {
      const u = users.find(u => u.email === email);
      const led = groups.filter(g => g.leader_email === email);
      const region = u?.territory_name || u?.country || "Unknown";
      return {
        name: u?.full_name || email.split("@")[0],
        region,
        groups: led.length,
        xp: u?.glow_score || 0,
      };
    }).sort((a, b) => b.groups - a.groups).slice(0, 8);
  }, [users, groups]);

  const totalXP = users.reduce((s, u) => s + (u.glow_score || 0), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-white mb-1">📊 Charts Dashboard</h1>
        <p className="text-gray-400 text-sm">Visual analytics for registration growth, territory engagement, and community leadership.</p>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Members", value: users.length, icon: Users, color: "#00CFFF" },
          { label: "Total XP", value: totalXP.toLocaleString(), icon: Zap, color: "#FFD000" },
          { label: "GlowGroups", value: groups.length, icon: Globe, color: "#8A5CFF" },
          { label: "Glow Drops", value: drops.length, icon: TrendingUp, color: "#22c55e" },
        ].map((s, i) => (
          <div key={i} className="bg-[#121826] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">{s.label}</p>
              <p className="text-xl font-black text-white font-['Space_Grotesk']">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Registration Growth */}
      <div className="bg-[#121826] border border-white/5 rounded-2xl p-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-[#00CFFF]" /> User Registration Growth (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={registrationData}>
            <defs>
              <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00CFFF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00CFFF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fill: "#6B7280", fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="New Users" stroke="#00CFFF" strokeWidth={2} fill="url(#userGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Territory Engagement */}
      <div className="bg-[#121826] border border-white/5 rounded-2xl p-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Globe size={16} className="text-[#8A5CFF]" /> Territory Engagement Levels</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={territoryData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#6B7280", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis dataKey="territory" type="category" tick={{ fill: "#C8D0E0", fontSize: 10 }} tickLine={false} axisLine={false} width={100} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#9CA3AF" }} />
            <Bar dataKey="users" name="Members" fill="#00CFFF" radius={[0, 4, 4, 0]} maxBarSize={16} />
            <Bar dataKey="drops" name="Drops" fill="#8A5CFF" radius={[0, 4, 4, 0]} maxBarSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top GlowGroup Leaders */}
      <div className="bg-[#121826] border border-white/5 rounded-2xl p-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Users size={16} className="text-[#FFD000]" /> Top GlowGroup Leaders by Region</h3>
        {leaderData.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No group leaders found.</p>
        ) : (
          <div className="space-y-3">
            {leaderData.map((leader, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-lg font-black w-6 text-center" style={{ color: i === 0 ? "#FFD000" : i === 1 ? "#C8D0E0" : i === 2 ? "#C77A2B" : "#4B5563" }}>
                  {i < 3 ? ["🥇","🥈","🥉"][i] : `#${i+1}`}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{leader.name}</p>
                  <p className="text-[10px] text-gray-500">{leader.region}</p>
                </div>
                <div className="flex items-center gap-3 text-xs shrink-0">
                  <span className="text-[#8A5CFF] font-bold">{leader.groups} group{leader.groups !== 1 ? "s" : ""}</span>
                  <span className="text-[#FFD000] font-bold flex items-center gap-1"><Zap size={10} />{leader.xp.toLocaleString()} XP</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}