import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Users, Zap, TrendingUp, Globe } from "lucide-react";
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";
import { getUserCountry, normalizeCountryName } from "@/lib/countryUtils";

const CustomTooltip = ({ active, payload, label, t }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border rounded-xl px-4 py-3 text-sm shadow-xl" style={{ background: t.surface, borderColor: t.border }}>
      <p className="mb-1" style={{ color: t.textSecondary }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function AdminChartsTab({ territoryRestricted, territoryCountries, territoryApproved }) {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";

  const chartAxisColor = isDark ? "#6B7280" : "#8A97B5";
  const chartGridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(11,27,61,0.04)";

  const { data: rawUsers = [] } = useQuery({
    queryKey: ["charts_users"],
    queryFn: () => base44.functions.invoke("adminListUsers", {}).then(r => r.data || []),
  });
  const { data: groups = [] } = useQuery({
    queryKey: ["charts_groups"],
    queryFn: () => base44.entities.GlowGroup.list("-created_date", 10000),
  });
  const { data: drops = [] } = useQuery({
    queryKey: ["charts_drops"],
    queryFn: () => base44.entities.GlowDrop.list("-created_date", 10000),
  });

  const allowedCountries = (territoryCountries || "").split(",").map(normalizeCountryName).filter(Boolean);

  const users = territoryRestricted && territoryApproved
    ? rawUsers.filter(u => allowedCountries.includes(getUserCountry(u)))
    : rawUsers;

  const registrationData = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    return days.map(day => {
      const label = format(day, "MMM d");
      const dayStart = startOfDay(day).getTime();
      const dayEnd = dayStart + 86400000;
      const count = users.filter(u => {
        const d = u.created_date ? new Date(u.created_date).getTime() : 0;
        return d >= dayStart && d < dayEnd;
      }).length;
      return { date: label, "New Users": count };
    });
  }, [users]);

  const territoryData = useMemo(() => {
    const map = {};
    users.forEach(u => {
      const key = u.territory_name || getUserCountry(u) || "Unknown";
      if (!map[key]) map[key] = { territory: key, users: 0, xp: 0, drops: 0 };
      map[key].users++;
      map[key].xp += u.glow_score || 0;
    });
    drops.forEach(d => {
      const u = users.find(u => u.email === d.user_email);
      const key = (u?.territory_name || getUserCountry(u) || "Unknown");
      if (map[key]) map[key].drops++;
    });
    return Object.values(map).sort((a, b) => b.xp - a.xp).slice(0, 10);
  }, [users, drops]);

  const leaderData = useMemo(() => {
    const leaderEmails = [...new Set(groups.map(g => g.leader_email))];
    return leaderEmails.map(email => {
      const u = users.find(u => u.email === email);
      const led = groups.filter(g => g.leader_email === email);
      const region = u?.territory_name || getUserCountry(u) || "Unknown";
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
        <h1 className="text-2xl font-bold font-['Space_Grotesk'] mb-1" style={{ color: t.textPrimary }}>📊 Charts Dashboard</h1>
        <p className="text-sm" style={{ color: t.textSecondary }}>Visual analytics for registration growth, territory engagement, and community leadership.</p>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Members", value: users.length, icon: Users, color: isDark ? "#00CFFF" : "#0B3FD9" },
          { label: "Total XP", value: totalXP.toLocaleString(), icon: Zap, color: isDark ? "#FFD000" : "#d97706" },
          { label: "GlowGroups", value: groups.length, icon: Globe, color: isDark ? "#8A5CFF" : "#7e22ce" },
          { label: "Glow Drops", value: drops.length, icon: TrendingUp, color: isDark ? "#22c55e" : "#16a34a" },
        ].map((s, i) => (
          <div key={i} className="border rounded-2xl p-4 flex items-center gap-3" style={{ background: t.surface, borderColor: t.border }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: t.textMuted }}>{s.label}</p>
              <p className="text-xl font-black font-['Space_Grotesk']" style={{ color: t.textPrimary }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Registration Growth */}
      <div className="border rounded-2xl p-6" style={{ background: t.surface, borderColor: t.border }}>
        <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: t.textPrimary }}><TrendingUp size={16} style={{ color: t.accent }} /> User Registration Growth (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={registrationData}>
            <defs>
              <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isDark ? "#00CFFF" : "#0B3FD9"} stopOpacity={0.3} />
                <stop offset="95%" stopColor={isDark ? "#00CFFF" : "#0B3FD9"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
            <XAxis dataKey="date" tick={{ fill: chartAxisColor, fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fill: chartAxisColor, fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip t={t} />} />
            <Area type="monotone" dataKey="New Users" stroke={isDark ? "#00CFFF" : "#0B3FD9"} strokeWidth={2} fill="url(#userGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Territory Engagement */}
      <div className="border rounded-2xl p-6" style={{ background: t.surface, borderColor: t.border }}>
        <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: t.textPrimary }}><Globe size={16} style={{ color: isDark ? "#8A5CFF" : "#7e22ce" }} /> Territory Engagement Levels</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={territoryData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} horizontal={false} />
            <XAxis type="number" tick={{ fill: chartAxisColor, fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis dataKey="territory" type="category" tick={{ fill: t.textSecondary, fontSize: 10 }} tickLine={false} axisLine={false} width={100} />
            <Tooltip content={<CustomTooltip t={t} />} />
            <Legend wrapperStyle={{ fontSize: 11, color: t.textSecondary }} />
            <Bar dataKey="users" name="Members" fill={isDark ? "#00CFFF" : "#0B3FD9"} radius={[0, 4, 4, 0]} maxBarSize={16} />
            <Bar dataKey="drops" name="Drops" fill={isDark ? "#8A5CFF" : "#7e22ce"} radius={[0, 4, 4, 0]} maxBarSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top GlowGroup Leaders */}
      <div className="border rounded-2xl p-6" style={{ background: t.surface, borderColor: t.border }}>
        <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: t.textPrimary }}><Users size={16} style={{ color: isDark ? "#FFD000" : "#d97706" }} /> Top GlowGroup Leaders by Region</h3>
        {leaderData.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: t.textMuted }}>No group leaders found.</p>
        ) : (
          <div className="space-y-3">
            {leaderData.map((leader, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl border" style={{ background: t.surfaceMuted, borderColor: t.border }}>
                <span className="text-lg font-black w-6 text-center" style={{ color: i === 0 ? "#FFD000" : i === 1 ? (isDark ? "#C8D0E0" : "#6B7FA0") : i === 2 ? "#C77A2B" : t.textMuted }}>
                  {i < 3 ? ["🥇","🥈","🥉"][i] : `#${i+1}`}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: t.textPrimary }}>{leader.name}</p>
                  <p className="text-[10px]" style={{ color: t.textMuted }}>{leader.region}</p>
                </div>
                <div className="flex items-center gap-3 text-xs shrink-0">
                  <span className="font-bold" style={{ color: isDark ? "#8A5CFF" : "#7e22ce" }}>{leader.groups} group{leader.groups !== 1 ? "s" : ""}</span>
                  <span className="font-bold flex items-center gap-1" style={{ color: isDark ? "#FFD000" : "#d97706" }}><Zap size={10} />{leader.xp.toLocaleString()} XP</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}