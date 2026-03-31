import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { Users, Zap, Globe, MessageSquare, Heart, Target, TrendingUp, TrendingDown, Activity, UserCheck } from "lucide-react";

const CYAN = "#00CFFF";
const VIOLET = "#8A5CFF";
const GOLD = "#FFD000";
const GREEN = "#4ade80";
const PINK = "#f472b6";

function StatCard({ label, value, sub, icon, color, trend, trendValue }) {
  const isUp = trend === "up";
  return (
    <div className="bg-[#121826] border border-white/5 rounded-2xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          {React.cloneElement(icon, { className: "w-4 h-4", style: { color } })}
        </div>
      </div>
      <div className="text-3xl font-black text-white font-['Space_Grotesk']">{value}</div>
      {(sub || trendValue) && (
        <div className="flex items-center gap-2">
          {trendValue && (
            <span className={`flex items-center gap-1 text-xs font-bold ${isUp ? "text-green-400" : "text-red-400"}`}>
              {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trendValue}
            </span>
          )}
          {sub && <span className="text-xs text-gray-500">{sub}</span>}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-black uppercase tracking-widest text-white">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0B0F1A] border border-white/10 rounded-xl px-4 py-2.5 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function AdminAnalyticsTab({ user, territoryRestricted, territoryCountries, territoryApproved }) {
  const [dateRange, setDateRange] = useState("30d");

  const { data: users = [] } = useQuery({
    queryKey: ["analytics_users"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {});
      return res.data || [];
    }
  });

  const { data: drops = [] } = useQuery({
    queryKey: ["analytics_drops"],
    queryFn: () => base44.entities.GlowDrop.list("-created_date", 500),
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["analytics_groups"],
    queryFn: () => base44.entities.GlowGroup.list(),
  });

  const { data: prayers = [] } = useQuery({
    queryKey: ["analytics_prayers"],
    queryFn: () => base44.entities.PrayerRequest.list("-created_date", 200),
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ["analytics_challenges"],
    queryFn: () => base44.entities.ChallengeSubmission.list("-created_date", 200),
  });

  const { data: follows = [] } = useQuery({
    queryKey: ["analytics_follows"],
    queryFn: () => base44.entities.Follow.list("-created_date", 500),
  });

  const allowedCountries = (territoryCountries || "").split(",").map(item => item.trim()).filter(Boolean);

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

  // ── Registrations over time (bucketed by day) ──
  const registrationsChart = useMemo(() => {
    const days = dateRange === "7d" ? 7 : dateRange === "14d" ? 14 : 30;
    const buckets = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      buckets[key] = 0;
    }
    scopedUsers.forEach(u => {
      if (!u.created_date) return;
      const d = new Date(u.created_date);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (key in buckets) buckets[key]++;
    });
    return Object.entries(buckets).map(([date, count]) => ({ date, count }));
  }, [scopedUsers, dateRange]);

  // ── Drops over time ──
  const dropsChart = useMemo(() => {
    const days = dateRange === "7d" ? 7 : dateRange === "14d" ? 14 : 30;
    const buckets = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      buckets[key] = 0;
    }
    scopedDrops.forEach(dr => {
      if (!dr.created_date) return;
      const d = new Date(dr.created_date);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (key in buckets) buckets[key]++;
    });
    return Object.entries(buckets).map(([date, count]) => ({ date, count }));
  }, [scopedDrops, dateRange]);

  // ── Top Countries ──
  const topCountries = useMemo(() => {
    const map = {};
    scopedUsers.forEach(u => {
      if (u.country) map[u.country] = (map[u.country] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([country, count]) => ({ country, count }));
  }, [scopedUsers]);

  // ── Gender breakdown ──
  const genderData = useMemo(() => {
    const male = scopedUsers.filter(u => u.gender === "male").length;
    const female = scopedUsers.filter(u => u.gender === "female").length;
    const other = scopedUsers.filter(u => u.gender === "prefer_not_to_say").length;
    const unknown = scopedUsers.filter(u => !u.gender).length;
    return [
      { name: "Male", value: male, color: CYAN },
      { name: "Female", value: female, color: PINK },
      { name: "Not specified", value: other, color: VIOLET },
      { name: "Unknown", value: unknown, color: "#374151" },
    ].filter(d => d.value > 0);
  }, [scopedUsers]);

  // ── Drop status ──
  const dropStatus = useMemo(() => {
    const approved = scopedDrops.filter(d => d.status === "approved").length;
    const pending = scopedDrops.filter(d => d.status === "pending").length;
    const rejected = scopedDrops.filter(d => d.status === "rejected").length;
    return [
      { name: "Approved", value: approved, color: GREEN },
      { name: "Pending", value: pending, color: GOLD },
      { name: "Rejected", value: rejected, color: "#ef4444" },
    ];
  }, [scopedDrops]);

  // ── Prayer categories ──
  const prayerCategories = useMemo(() => {
    const map = {};
    prayers.forEach(p => { const k = p.category || "Other"; map[k] = (map[k] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [prayers]);

  // ── Age distribution ──
  const ageGroups = useMemo(() => {
    const groups = { "Under 13": 0, "13–17": 0, "18–25": 0, "26–35": 0, "36–45": 0, "46+": 0, "Unknown": 0 };
    scopedUsers.forEach(u => {
      if (!u.date_of_birth) { groups["Unknown"]++; return; }
      const age = Math.floor((new Date() - new Date(u.date_of_birth)) / (365.25 * 24 * 3600 * 1000));
      if (age < 13) groups["Under 13"]++;
      else if (age <= 17) groups["13–17"]++;
      else if (age <= 25) groups["18–25"]++;
      else if (age <= 35) groups["26–35"]++;
      else if (age <= 45) groups["36–45"]++;
      else groups["46+"]++;
    });
    return Object.entries(groups).filter(([, v]) => v > 0).map(([name, count]) => ({ name, count }));
  }, [scopedUsers]);

  // ── Engagement activity combo chart ──
  const engagementChart = useMemo(() => {
    const days = dateRange === "7d" ? 7 : dateRange === "14d" ? 14 : 30;
    const buckets = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      buckets[key] = { date: key, drops: 0, prayers: 0, follows: 0 };
    }
    scopedDrops.forEach(dr => {
      const key = new Date(dr.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (buckets[key]) buckets[key].drops++;
    });
    prayers.forEach(p => {
      const key = new Date(p.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (buckets[key]) buckets[key].prayers++;
    });
    follows.forEach(f => {
      const key = new Date(f.created_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (buckets[key]) buckets[key].follows++;
    });
    return Object.values(buckets);
  }, [scopedDrops, prayers, follows, dateRange]);

  // ── Summary stats ──
  const now = new Date();
  const last7 = (arr) => arr.filter(x => x.created_date && (now - new Date(x.created_date)) / (1000 * 60 * 60 * 24) <= 7).length;
  const prev7 = (arr) => arr.filter(x => x.created_date && (now - new Date(x.created_date)) / (1000 * 60 * 60 * 24) > 7 && (now - new Date(x.created_date)) / (1000 * 60 * 60 * 24) <= 14).length;
  const trendCalc = (curr, prev) => {
    if (!prev) return { dir: "up", label: "+100%" };
    const pct = Math.round(((curr - prev) / prev) * 100);
    return { dir: pct >= 0 ? "up" : "down", label: `${pct >= 0 ? "+" : ""}${pct}% vs last week` };
  };

  const userTrend = trendCalc(last7(scopedUsers), prev7(scopedUsers));
  const dropTrend = trendCalc(last7(scopedDrops), prev7(scopedDrops));

  const totalLikes = scopedDrops.reduce((s, d) => s + (d.likes_count || 0), 0);
  const approvedDrops = scopedDrops.filter(d => d.status === "approved").length;

  if (territoryRestricted && !territoryApproved) {
    return <div className="bg-[#121826] border border-[#FFD000]/30 rounded-2xl p-6 text-sm text-gray-300">Please confirm your territory map first to unlock analytics for your region.</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] text-white">Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">Platform-wide insights and engagement metrics.</p>
        </div>
        {/* Date range selector */}
        <div className="flex items-center gap-1 bg-[#121826] border border-white/10 rounded-xl p-1">
          {[["7d","Last 7 days"],["14d","14 days"],["30d","30 days"]].map(([val, label]) => (
            <button key={val} onClick={() => setDateRange(val)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${dateRange === val ? "bg-[#00CFFF] text-black" : "text-gray-400 hover:text-white"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={scopedUsers.length.toLocaleString()} icon={<Users />} color={CYAN} trend={userTrend.dir} trendValue={userTrend.label} sub="registered users" />
        <StatCard label="Glow Drops" value={scopedDrops.length.toLocaleString()} icon={<Zap />} color={GOLD} trend={dropTrend.dir} trendValue={dropTrend.label} sub={`${approvedDrops} approved`} />
        <StatCard label="GlowGroups" value={scopedGroups.length.toLocaleString()} icon={<Globe />} color={VIOLET} sub={`${topCountries.length} countries`} />
        <StatCard label="Total Likes" value={totalLikes.toLocaleString()} icon={<Heart />} color={PINK} sub="across all drops" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Prayer Requests" value={prayers.length.toLocaleString()} icon={<MessageSquare />} color={GREEN} sub={`${prayers.filter(p => p.answered).length} answered`} />
        <StatCard label="Challenge Subs" value={challenges.length.toLocaleString()} icon={<Target />} color={CYAN} sub="total submissions" />
        <StatCard label="Connections" value={follows.length.toLocaleString()} icon={<UserCheck />} color={GOLD} sub="total follows" />
        <StatCard label="Active This Week" value={last7(scopedUsers).toLocaleString()} icon={<Activity />} color={VIOLET} sub="new registrations" />
      </div>

      {/* Registrations Over Time */}
      <div className="bg-[#121826] border border-white/5 rounded-2xl p-6">
        <SectionTitle title="New Member Registrations" subtitle="Daily signups over selected period" />
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={registrationsChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CYAN} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CYAN} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="count" name="Registrations" stroke={CYAN} strokeWidth={2} fill="url(#regGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Engagement combo chart */}
      <div className="bg-[#121826] border border-white/5 rounded-2xl p-6">
        <SectionTitle title="Engagement Activity" subtitle="Drops, prayers, and follows per day" />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={engagementChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barCategoryGap="30%">
            <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
            <Bar dataKey="drops" name="Glow Drops" fill={GOLD} radius={[3,3,0,0]} />
            <Bar dataKey="prayers" name="Prayer Requests" fill={VIOLET} radius={[3,3,0,0]} />
            <Bar dataKey="follows" name="New Follows" fill={CYAN} radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Drops Over Time */}
      <div className="bg-[#121826] border border-white/5 rounded-2xl p-6">
        <SectionTitle title="Glow Drop Activity" subtitle="Drops submitted per day" />
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={dropsChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="dropGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="count" name="Drops" stroke={GOLD} strokeWidth={2} fill="url(#dropGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom 4-grid */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Top Countries */}
        <div className="bg-[#121826] border border-white/5 rounded-2xl p-6">
          <SectionTitle title="Members by Country" subtitle="Where your community lives" />
          <div className="space-y-2">
            {topCountries.length === 0 && <p className="text-xs text-gray-500">No country data yet.</p>}
            {topCountries.map(({ country, count }, i) => (
              <div key={country} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-4 shrink-0">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-white font-medium">{country}</span>
                    <span className="text-sm font-bold text-white">{count}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(count / topCountries[0].count) * 100}%`, background: `linear-gradient(90deg, ${CYAN}, ${VIOLET})` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gender */}
        <div className="bg-[#121826] border border-white/5 rounded-2xl p-6">
          <SectionTitle title="Gender Distribution" />
          <div className="flex items-center justify-between gap-4">
            <ResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {genderData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {genderData.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-xs text-gray-400 flex-1">{d.name}</span>
                  <span className="text-xs font-bold text-white">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Age Groups */}
        <div className="bg-[#121826] border border-white/5 rounded-2xl p-6">
          <SectionTitle title="Age Groups" subtitle="Based on date of birth" />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ageGroups} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Members" radius={[4,4,0,0]}>
                {ageGroups.map((_, i) => <Cell key={i} fill={[CYAN, VIOLET, GOLD, GREEN, PINK, CYAN, "#374151"][i % 7]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Drop Status + Prayer categories */}
        <div className="bg-[#121826] border border-white/5 rounded-2xl p-6">
          <SectionTitle title="Drop Status" subtitle="Approval breakdown" />
          <div className="flex items-center gap-4 mb-6">
            {dropStatus.map(d => (
              <div key={d.name} className="flex-1 bg-white/5 rounded-xl p-3 text-center">
                <div className="text-2xl font-black font-['Space_Grotesk']" style={{ color: d.color }}>{d.value}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">{d.name}</div>
              </div>
            ))}
          </div>
          <SectionTitle title="Prayer Categories" />
          <div className="space-y-2">
            {prayerCategories.slice(0, 5).map(({ name, count }) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{name}</span>
                <span className="font-bold text-white">{count}</span>
              </div>
            ))}
            {prayerCategories.length === 0 && <p className="text-xs text-gray-500">No prayer requests yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}