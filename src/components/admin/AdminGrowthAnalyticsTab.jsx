import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";
import { Globe, Users, TrendingUp, Zap, MapPin, CheckCircle, Activity } from "lucide-react";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";
import { getUserCountry } from "@/lib/countryUtils";

const COLORS = ["#00CFFF", "#8A5CFF", "#FFD000", "#10B981", "#F43F5E", "#F97316", "#EC4899", "#6366F1", "#14B8A6", "#EAB308"];

const CustomTooltip = ({ active, payload, label, t }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border rounded-xl px-4 py-3 text-sm shadow-xl" style={{ background: t.surface, borderColor: t.border }}>
      <p className="mb-1 font-semibold" style={{ color: t.textSecondary }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

function StatCard({ label, value, icon, color, sub, t }) {
  return (
    <div className="border rounded-2xl p-5 flex flex-col gap-2" style={{ background: t.surface, borderColor: t.border }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: t.textSecondary }}>{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
          {React.cloneElement(icon, { className: "w-4 h-4", style: { color } })}
        </div>
      </div>
      <div className="text-3xl font-black font-['Space_Grotesk']" style={{ color }}>{value}</div>
      {sub && <div className="text-xs" style={{ color: t.textMuted }}>{sub}</div>}
    </div>
  );
}

export default function AdminGrowthAnalyticsTab({ territoryRestricted, territoryCountries }) {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";
  const chartAxisColor = isDark ? "#6B7280" : "#8A97B5";
  const chartGridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(11,27,61,0.04)";

  const { data: allUsers = [] } = useQuery({
    queryKey: ["adminAllUsersGrowth"],
    queryFn: async () => { const r = await base44.functions.invoke("adminListUsers", {}); return r.data || []; },
  });

  const { data: drops = [] } = useQuery({
    queryKey: ["adminDropsGrowth"],
    queryFn: () => base44.entities.GlowDrop.list("-created_date", 10000),
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["adminGroupsGrowth"],
    queryFn: () => base44.entities.GlowGroup.list("-created_date", 10000),
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ["adminChallengesGrowth"],
    queryFn: () => base44.entities.Challenge.list("-created_date", 10000),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["adminSubmissionsGrowth"],
    queryFn: () => base44.entities.ChallengeSubmission.list("-created_date", 10000),
  });

  const users = useMemo(() => {
    if (!territoryRestricted || !territoryCountries) return allUsers;
    const allowed = territoryCountries.split(",").map(c => getUserCountry({ country: c }).toLowerCase()).filter(Boolean);
    return allUsers.filter(u => allowed.includes(getUserCountry(u).toLowerCase()));
  }, [allUsers, territoryRestricted, territoryCountries]);

  const profileFields = ["bio", "country", "city", "profile_picture_url", "gender", "date_of_birth"];
  const profileStats = useMemo(() => {
    if (!users.length) return { complete: 0, partial: 0, empty: 0, pct: 0 };
    let complete = 0, partial = 0, empty = 0;
    users.forEach(u => {
      const filled = profileFields.filter(f => u[f]).length;
      if (filled >= 5) complete++;
      else if (filled >= 2) partial++;
      else empty++;
    });
    return { complete, partial, empty, pct: Math.round((complete / users.length) * 100) };
  }, [users]);

  const registrationByMonth = useMemo(() => {
    const map = {};
    users.forEach(u => {
      if (!u.created_date) return;
      const d = new Date(u.created_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([month, count]) => ({
      month: month.slice(5) + "/" + month.slice(2, 4),
      users: count
    }));
  }, [users]);

  const countryData = useMemo(() => {
    const map = {};
    users.forEach(u => {
      const country = getUserCountry(u);
      if (!country) return;
      map[country] = (map[country] || 0) + 1;
    });
    return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 10).map(([country, count]) => ({ country, count }));
  }, [users]);

  const xpByCountry = useMemo(() => {
    const map = {};
    users.forEach(u => {
      const country = getUserCountry(u);
      if (!country) return;
      map[country] = (map[country] || 0) + (u.glow_score || 0);
    });
    return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 10).map(([country, xp]) => ({ country, xp }));
  }, [users]);

  const dropsByMonth = useMemo(() => {
    const map = {};
    drops.forEach(d => {
      if (!d.created_date) return;
      const date = new Date(d.created_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([month, count]) => ({
      month: month.slice(5) + "/" + month.slice(2, 4),
      drops: count
    }));
  }, [drops]);

  const profilePieData = [
    { name: "Complete", value: profileStats.complete },
    { name: "Partial", value: profileStats.partial },
    { name: "Minimal", value: profileStats.empty },
  ];

  const totalXP = useMemo(() => users.reduce((sum, u) => sum + (u.glow_score || 0), 0), [users]);
  const avgXP = users.length ? Math.round(totalXP / users.length) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black font-['Space_Grotesk']" style={{ color: t.textPrimary }}>Growth Analytics</h2>
        <p className="text-sm mt-1" style={{ color: t.textSecondary }}>User activity, movement growth, and engagement across the network.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={users.length} icon={<Users />} color={isDark ? "#00CFFF" : "#0B3FD9"} sub={`${countryData.length} countries`} t={t} />
        <StatCard label="Profile Complete" value={`${profileStats.pct}%`} icon={<CheckCircle />} color={isDark ? "#10B981" : "#16a34a"} sub={`${profileStats.complete} fully filled`} t={t} />
        <StatCard label="Total XP Earned" value={totalXP.toLocaleString()} icon={<Zap />} color={isDark ? "#FFD000" : "#d97706"} sub={`Avg ${avgXP} XP/member`} t={t} />
        <StatCard label="Total Glow Drops" value={drops.length} icon={<Activity />} color={isDark ? "#8A5CFF" : "#7e22ce"} sub={`${groups.length} active groups`} t={t} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Growth */}
        <div className="rounded-2xl p-5 border" style={{ background: t.surface, borderColor: t.border }}>
          <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: isDark ? "#00CFFF" : "#0B3FD9" }}>
            <TrendingUp className="w-4 h-4" /> Member Registration Growth
          </h3>
          {registrationByMonth.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm" style={{ color: t.textMuted }}>No registration data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={registrationByMonth}>
                <defs>
                  <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? "#00CFFF" : "#0B3FD9"} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isDark ? "#00CFFF" : "#0B3FD9"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis dataKey="month" tick={{ fill: chartAxisColor, fontSize: 11 }} />
                <YAxis tick={{ fill: chartAxisColor, fontSize: 11 }} />
                <Tooltip content={<CustomTooltip t={t} />} />
                <Area type="monotone" dataKey="users" stroke={isDark ? "#00CFFF" : "#0B3FD9"} fill="url(#usersGrad)" strokeWidth={2} name="New Members" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Drops per Month */}
        <div className="rounded-2xl p-5 border" style={{ background: t.surface, borderColor: t.border }}>
          <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: isDark ? "#8A5CFF" : "#7e22ce" }}>
            <Activity className="w-4 h-4" /> Glow Drops per Month
          </h3>
          {dropsByMonth.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm" style={{ color: t.textMuted }}>No drop data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dropsByMonth}>
                <defs>
                  <linearGradient id="dropsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? "#8A5CFF" : "#7e22ce"} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isDark ? "#8A5CFF" : "#7e22ce"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis dataKey="month" tick={{ fill: chartAxisColor, fontSize: 11 }} />
                <YAxis tick={{ fill: chartAxisColor, fontSize: 11 }} />
                <Tooltip content={<CustomTooltip t={t} />} />
                <Area type="monotone" dataKey="drops" stroke={isDark ? "#8A5CFF" : "#7e22ce"} fill="url(#dropsGrad)" strokeWidth={2} name="Drops" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Countries by Members */}
        <div className="lg:col-span-2 rounded-2xl p-5 border" style={{ background: t.surface, borderColor: t.border }}>
          <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: isDark ? "#FFD000" : "#d97706" }}>
            <MapPin className="w-4 h-4" /> Top Countries by Members
          </h3>
          {countryData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm" style={{ color: t.textMuted }}>No country data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={countryData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis type="number" tick={{ fill: chartAxisColor, fontSize: 11 }} />
                <YAxis type="category" dataKey="country" tick={{ fill: t.textSecondary, fontSize: 11 }} width={90} />
                <Tooltip content={<CustomTooltip t={t} />} />
                <Bar dataKey="count" name="Members" radius={[0, 6, 6, 0]}>
                  {countryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Profile Completion Pie */}
        <div className="rounded-2xl p-5 border" style={{ background: t.surface, borderColor: t.border }}>
          <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: isDark ? "#10B981" : "#16a34a" }}>
            <CheckCircle className="w-4 h-4" /> Profile Completion
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={profilePieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {profilePieData.map((_, i) => <Cell key={i} fill={[isDark ? "#10B981" : "#16a34a", isDark ? "#FFD000" : "#d97706", isDark ? "#6b7280" : "#9ca3af"][i]} />)}
              </Pie>
              <Legend formatter={(v) => <span style={{ color: t.textSecondary, fontSize: 12 }}>{v}</span>} />
              <Tooltip content={<CustomTooltip t={t} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center mt-2">
            <span className="text-2xl font-black" style={{ color: isDark ? "#10B981" : "#16a34a" }}>{profileStats.pct}%</span>
            <span className="text-xs ml-2" style={{ color: t.textMuted }}>fully complete</span>
          </div>
        </div>
      </div>

      {/* XP Engagement by Country */}
      <div className="rounded-2xl p-5 border" style={{ background: t.surface, borderColor: t.border }}>
        <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: isDark ? "#00CFFF" : "#0B3FD9" }}>
          <Zap className="w-4 h-4" /> Total XP Engagement by Country
        </h3>
        {xpByCountry.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm" style={{ color: t.textMuted }}>No XP data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={xpByCountry}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
              <XAxis dataKey="country" tick={{ fill: chartAxisColor, fontSize: 11 }} />
              <YAxis tick={{ fill: chartAxisColor, fontSize: 11 }} />
              <Tooltip content={<CustomTooltip t={t} />} />
              <Bar dataKey="xp" name="Total XP" radius={[6, 6, 0, 0]}>
                {xpByCountry.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Country Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: t.surface, borderColor: t.border }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: t.border }}>
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2" style={{ color: t.textPrimary }}>
            <Globe className="w-4 h-4" style={{ color: t.accent }} /> Country Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: t.border }}>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider font-bold" style={{ color: t.textMuted }}>#</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider font-bold" style={{ color: t.textMuted }}>Country</th>
                <th className="text-right px-5 py-3 text-xs uppercase tracking-wider font-bold" style={{ color: t.textMuted }}>Members</th>
                <th className="text-right px-5 py-3 text-xs uppercase tracking-wider font-bold" style={{ color: t.textMuted }}>Total XP</th>
                <th className="text-right px-5 py-3 text-xs uppercase tracking-wider font-bold" style={{ color: t.textMuted }}>Avg XP</th>
              </tr>
            </thead>
            <tbody>
              {countryData.map((row, i) => {
                const totalXpForCountry = users.filter(u => getUserCountry(u) === row.country).reduce((s, u) => s + (u.glow_score || 0), 0);
                const avgXpForCountry = row.count > 0 ? Math.round(totalXpForCountry / row.count) : 0;
                return (
                  <tr key={row.country} className="border-b transition hover:opacity-80" style={{ borderColor: t.border, background: isDark ? "rgba(255,255,255,0.02)" : "transparent" }}>
                    <td className="px-5 py-3 font-bold" style={{ color: t.textSecondary }}>{i + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="font-semibold" style={{ color: t.textPrimary }}>{row.country}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-bold" style={{ color: isDark ? "#00CFFF" : "#0B3FD9" }}>{row.count}</td>
                    <td className="px-5 py-3 text-right font-bold" style={{ color: isDark ? "#FFD000" : "#d97706" }}>{totalXpForCountry.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right font-semibold" style={{ color: t.textSecondary }}>{avgXpForCountry}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}