import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";
import { Globe, Users, TrendingUp, Zap, MapPin, CheckCircle, Activity } from "lucide-react";

const COLORS = ["#00CFFF", "#8A5CFF", "#FFD000", "#10B981", "#F43F5E", "#F97316", "#EC4899", "#6366F1", "#14B8A6", "#EAB308"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#121826] border border-white/10 rounded-xl px-4 py-3 text-sm shadow-xl">
      <p className="text-gray-400 mb-1 font-semibold">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div className="bg-[#121826] border border-white/5 rounded-2xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
          {React.cloneElement(icon, { className: "w-4 h-4", style: { color } })}
        </div>
      </div>
      <div className="text-3xl font-black font-['Space_Grotesk']" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

export default function AdminGrowthAnalyticsTab({ territoryRestricted, territoryCountries }) {
  const { data: allUsers = [] } = useQuery({
    queryKey: ["adminAllUsersGrowth"],
    queryFn: async () => { const r = await base44.functions.invoke("listPublicUsers", {}); return r.data; },
  });

  const { data: drops = [] } = useQuery({
    queryKey: ["adminDropsGrowth"],
    queryFn: () => base44.entities.GlowDrop.list("-created_date", 500),
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["adminGroupsGrowth"],
    queryFn: () => base44.entities.GlowGroup.filter({}),
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ["adminChallengesGrowth"],
    queryFn: () => base44.entities.Challenge.list(),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["adminSubmissionsGrowth"],
    queryFn: () => base44.entities.ChallengeSubmission.list(),
  });

  const users = useMemo(() => {
    if (!territoryRestricted || !territoryCountries) return allUsers;
    const allowed = territoryCountries.split(",").map(c => c.trim().toLowerCase());
    return allUsers.filter(u => allowed.includes((u.country || "").toLowerCase()));
  }, [allUsers, territoryRestricted, territoryCountries]);

  // Profile completion score
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

  // Monthly registration growth
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

  // Top countries
  const countryData = useMemo(() => {
    const map = {};
    users.forEach(u => {
      if (!u.country) return;
      map[u.country] = (map[u.country] || 0) + 1;
    });
    return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 10).map(([country, count]) => ({ country, count }));
  }, [users]);

  // Engagement: XP per country
  const xpByCountry = useMemo(() => {
    const map = {};
    users.forEach(u => {
      if (!u.country) return;
      map[u.country] = (map[u.country] || 0) + (u.glow_score || 0);
    });
    return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 10).map(([country, xp]) => ({ country, xp }));
  }, [users]);

  // Drops per month
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

  // Profile completion pie data
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
        <h2 className="text-2xl font-black font-['Space_Grotesk'] text-white mb-1">Growth Analytics</h2>
        <p className="text-gray-500 text-sm">User activity, movement growth, and engagement across the network.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={users.length} icon={<Users />} color="#00CFFF" sub={`${countryData.length} countries`} />
        <StatCard label="Profile Complete" value={`${profileStats.pct}%`} icon={<CheckCircle />} color="#10B981" sub={`${profileStats.complete} fully filled`} />
        <StatCard label="Total XP Earned" value={totalXP.toLocaleString()} icon={<Zap />} color="#FFD000" sub={`Avg ${avgXP} XP/member`} />
        <StatCard label="Total Glow Drops" value={drops.length} icon={<Activity />} color="#8A5CFF" sub={`${groups.length} active groups`} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Growth */}
        <div className="bg-[#121826] rounded-2xl p-5 border border-white/5">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#00CFFF] mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Member Registration Growth
          </h3>
          {registrationByMonth.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No registration data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={registrationByMonth}>
                <defs>
                  <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00CFFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00CFFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="users" stroke="#00CFFF" fill="url(#usersGrad)" strokeWidth={2} name="New Members" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Drops per Month */}
        <div className="bg-[#121826] rounded-2xl p-5 border border-white/5">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#8A5CFF] mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Glow Drops per Month
          </h3>
          {dropsByMonth.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No drop data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dropsByMonth}>
                <defs>
                  <linearGradient id="dropsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8A5CFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8A5CFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="drops" stroke="#8A5CFF" fill="url(#dropsGrad)" strokeWidth={2} name="Drops" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Countries by Members */}
        <div className="lg:col-span-2 bg-[#121826] rounded-2xl p-5 border border-white/5">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#FFD000] mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Top Countries by Members
          </h3>
          {countryData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No country data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={countryData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} />
                <YAxis type="category" dataKey="country" tick={{ fill: "#C8D0E0", fontSize: 11 }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Members" radius={[0, 6, 6, 0]}>
                  {countryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Profile Completion Pie */}
        <div className="bg-[#121826] rounded-2xl p-5 border border-white/5">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#10B981] mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Profile Completion
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={profilePieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {profilePieData.map((_, i) => <Cell key={i} fill={["#10B981", "#FFD000", "#6b7280"][i]} />)}
              </Pie>
              <Legend formatter={(v) => <span style={{ color: "#C8D0E0", fontSize: 12 }}>{v}</span>} />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center mt-2">
            <span className="text-2xl font-black text-[#10B981]">{profileStats.pct}%</span>
            <span className="text-xs text-gray-500 ml-2">fully complete</span>
          </div>
        </div>
      </div>

      {/* XP Engagement by Country */}
      <div className="bg-[#121826] rounded-2xl p-5 border border-white/5">
        <h3 className="text-sm font-black uppercase tracking-widest text-[#00CFFF] mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4" /> Total XP Engagement by Country
        </h3>
        {xpByCountry.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No XP data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={xpByCountry}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="country" tick={{ fill: "#6b7280", fontSize: 11 }} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="xp" name="Total XP" radius={[6, 6, 0, 0]}>
                {xpByCountry.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Country Table */}
      <div className="bg-[#121826] rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#00CFFF]" /> Country Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-gray-500 text-xs uppercase tracking-wider font-bold">#</th>
                <th className="text-left px-5 py-3 text-gray-500 text-xs uppercase tracking-wider font-bold">Country</th>
                <th className="text-right px-5 py-3 text-gray-500 text-xs uppercase tracking-wider font-bold">Members</th>
                <th className="text-right px-5 py-3 text-gray-500 text-xs uppercase tracking-wider font-bold">Total XP</th>
                <th className="text-right px-5 py-3 text-gray-500 text-xs uppercase tracking-wider font-bold">Avg XP</th>
              </tr>
            </thead>
            <tbody>
              {countryData.map((row, i) => {
                const totalXpForCountry = users.filter(u => u.country === row.country).reduce((s, u) => s + (u.glow_score || 0), 0);
                const avgXpForCountry = row.count > 0 ? Math.round(totalXpForCountry / row.count) : 0;
                return (
                  <tr key={row.country} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                    <td className="px-5 py-3 text-gray-600 font-bold">{i + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-white font-semibold">{row.country}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-[#00CFFF] font-bold">{row.count}</td>
                    <td className="px-5 py-3 text-right text-[#FFD000] font-bold">{totalXpForCountry.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-gray-400 font-semibold">{avgXpForCountry}</td>
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