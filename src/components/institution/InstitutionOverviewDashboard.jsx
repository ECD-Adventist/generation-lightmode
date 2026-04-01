import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, MapPin, Zap, Heart, CheckCircle, Clock, TrendingUp, Globe } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div className="bg-[#111827] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
          {React.cloneElement(icon, { className: "w-4 h-4", style: { color } })}
        </div>
      </div>
      <div className="text-3xl font-black text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{value}</div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

export default function InstitutionOverviewDashboard({ institutionApps, ownerEmail }) {
  const activeApp = institutionApps[0];

  const { data: claims = [] } = useQuery({
    queryKey: ["territoryClaims", ownerEmail],
    queryFn: () => base44.entities.TerritoryMemberClaim.filter({ institution_owner_email: ownerEmail }),
    enabled: !!ownerEmail,
  });

  const { data: drops = [] } = useQuery({
    queryKey: ["allGlowDrops"],
    queryFn: () => base44.entities.GlowDrop.list("-created_date", 500),
  });

  const extractedTerritories = useMemo(() => {
    try { return activeApp?.extracted_territories ? JSON.parse(activeApp.extracted_territories) : []; }
    catch { return []; }
  }, [activeApp]);

  const approvedClaims = claims.filter(c => c.status === "approved");
  const pendingClaims = claims.filter(c => c.status === "pending");
  const approvedEmails = new Set(approvedClaims.map(c => c.member_email));
  const memberDrops = drops.filter(d => approvedEmails.has(d.user_email));
  const totalLikes = memberDrops.reduce((sum, d) => sum + (d.likes_count || 0), 0);
  const activeCountriesSet = new Set(approvedClaims.map(c => c.member_country).filter(Boolean));

  const growthData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const day = subDays(new Date(), 6 - i);
    const dayStr = format(day, "yyyy-MM-dd");
    return { date: format(day, "EEE"), members: approvedClaims.filter(c => c.created_date?.startsWith(dayStr)).length };
  }), [approvedClaims]);

  const dropsData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const day = subDays(new Date(), 6 - i);
    const dayStr = format(day, "yyyy-MM-dd");
    return { date: format(day, "EEE"), drops: memberDrops.filter(d => d.created_date?.startsWith(dayStr)).length };
  }), [memberDrops]);

  const orgMapUrl = institutionApps.find(a => a.organization_map_url)?.organization_map_url;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"></span>
          <span className="text-[10px] font-black uppercase tracking-widest text-green-400">Live Dashboard</span>
        </div>
        <h1 className="text-2xl font-black text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
          {activeApp?.institution_name || "Institution"} Overview
        </h1>
        <p className="text-sm text-gray-400 mt-1">Real-time activity and key metrics across your institution.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Members" value={approvedClaims.length} icon={<Users />} color="#00CFFF" sub="Verified in territories" />
        <StatCard label="Pending Approvals" value={pendingClaims.length} icon={<Clock />} color="#FFD000" sub="Awaiting review" />
        <StatCard label="Territory Drops" value={memberDrops.length} icon={<Zap />} color="#8A5CFF" sub="Posts by members" />
        <StatCard label="Countries" value={activeCountriesSet.size} icon={<Globe />} color="#10B981" sub="Active regions" />
        <StatCard label="Territories" value={extractedTerritories.length} icon={<MapPin />} color="#F59E0B" sub="From org map" />
        <StatCard label="Total Likes" value={totalLikes} icon={<Heart />} color="#EF4444" sub="On member drops" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Member Growth</h3>
              <p className="text-xs text-gray-500">New verified members (last 7 days)</p>
            </div>
            <span className="text-xs font-black text-[#00CFFF] bg-[#00CFFF]/10 px-2 py-1 rounded-lg">+{approvedClaims.length} total</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="memberGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00CFFF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00CFFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="date" tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 8 }} labelStyle={{ color: "#fff" }} />
              <Area type="monotone" dataKey="members" stroke="#00CFFF" strokeWidth={2} fill="url(#memberGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Territory Glow Drops</h3>
              <p className="text-xs text-gray-500">Posts by members (last 7 days)</p>
            </div>
            <span className="text-xs font-black text-[#FFD000] bg-[#FFD000]/10 px-2 py-1 rounded-lg">{memberDrops.length} total</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={dropsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="date" tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #1F2937", borderRadius: 8 }} labelStyle={{ color: "#fff" }} />
              <Bar dataKey="drops" fill="#FFD000" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#00CFFF]" /> Organization Map
          </h3>
          {orgMapUrl ? (
            <img src={orgMapUrl} alt="Org Map" className="w-full h-48 object-contain rounded-xl bg-white p-2" />
          ) : (
            <div className="w-full h-48 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center text-gray-500 text-sm">No map uploaded yet</div>
          )}
          {extractedTerritories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {extractedTerritories.slice(0, 6).map((t, i) => (
                <span key={i} className="px-2 py-0.5 bg-[#00CFFF]/10 border border-[#00CFFF]/20 rounded text-[10px] font-semibold text-[#00CFFF]">{t.name}</span>
              ))}
              {extractedTerritories.length > 6 && <span className="text-[10px] text-gray-500">+{extractedTerritories.length - 6} more</span>}
            </div>
          )}
        </div>

        <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" /> Recent Membership Claims
          </h3>
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {claims.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No membership claims yet.</p>
            ) : (
              [...claims].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 8).map(claim => (
                <div key={claim.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{claim.member_name || claim.member_email}</p>
                    <p className="text-[10px] text-gray-500">{claim.claimed_territory}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${claim.status === "approved" ? "bg-green-500/20 text-green-400" : claim.status === "rejected" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>{claim.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#111827] to-[#0c1020] border border-[#FFD000]/10 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#FFD000]/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[#FFD000]" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Movement Status</div>
            <div className="text-sm font-black text-[#FFD000]">⚡ Faith. Always On.</div>
          </div>
        </div>
        <div className="flex gap-6 text-center">
          <div><div className="text-xl font-black text-white">{approvedClaims.length}</div><div className="text-[9px] text-gray-500 uppercase">Active Members</div></div>
          <div><div className="text-xl font-black text-white">{pendingClaims.length}</div><div className="text-[9px] text-gray-500 uppercase">Pending</div></div>
          <div><div className="text-xl font-black text-white">{memberDrops.length}</div><div className="text-[9px] text-gray-500 uppercase">Drops</div></div>
        </div>
      </div>
    </div>
  );
}