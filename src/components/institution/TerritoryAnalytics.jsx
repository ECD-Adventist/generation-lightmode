import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MapPin, Users, CheckCircle, Clock, XCircle, Globe, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#00CFFF", "#FFD000", "#8A5CFF", "#00E676", "#FF6B6B", "#FF9800", "#E91E63", "#4DD0E1"];

function StatCard({ icon: Icon, label, value, color = "#00CFFF" }) {
  return (
    <div className="bg-[#121826] rounded-2xl p-5 border border-white/5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
      </div>
      <div className="text-2xl font-black font-['Space_Grotesk']" style={{ color }}>{value}</div>
    </div>
  );
}

export default function TerritoryAnalytics({ page, institutionApps = [] }) {
  // Get extracted territories from apps
  const territories = useMemo(() => {
    for (const app of institutionApps) {
      if (app.extracted_territories) {
        try { return JSON.parse(app.extracted_territories); } catch { /* ignore */ }
      }
    }
    return [];
  }, [institutionApps]);

  // Fetch member claims
  const ownerEmail = page?.owner_email || institutionApps[0]?.user_email;
  const { data: claims = [] } = useQuery({
    queryKey: ["territoryClaims", ownerEmail],
    queryFn: () => base44.entities.TerritoryMemberClaim.filter({ institution_owner_email: ownerEmail }),
    enabled: !!ownerEmail,
  });

  const approvedClaims = claims.filter(c => c.status === "approved");
  const pendingClaims = claims.filter(c => c.status === "pending");

  // Group approved claims by territory
  const territoryMemberCounts = useMemo(() => {
    const counts = {};
    approvedClaims.forEach(c => {
      counts[c.claimed_territory] = (counts[c.claimed_territory] || 0) + 1;
    });
    return territories.map((t, i) => ({
      name: t.name || `Territory ${i + 1}`,
      region: t.region || "",
      country: t.country || "",
      members: counts[t.name] || 0,
    }));
  }, [territories, approvedClaims]);

  // Group by country for pie chart
  const countryBreakdown = useMemo(() => {
    const counts = {};
    approvedClaims.forEach(c => {
      const country = c.member_country || "Unknown";
      counts[country] = (counts[country] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [approvedClaims]);

  if (territories.length === 0) {
    return (
      <div className="text-center py-16 bg-[#121826] rounded-2xl border border-white/5">
        <Globe className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">No Territory Data Yet</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Upload an organization map on your profile page. Our AI will extract territory data automatically, and analytics will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={MapPin} label="Territories" value={territories.length} color="#FFD000" />
        <StatCard icon={Users} label="Verified Members" value={approvedClaims.length} color="#00CFFF" />
        <StatCard icon={Clock} label="Pending Verification" value={pendingClaims.length} color="#FF9800" />
        <StatCard icon={TrendingUp} label="Coverage Rate" value={`${territories.length > 0 ? Math.round((territoryMemberCounts.filter(t => t.members > 0).length / territories.length) * 100) : 0}%`} color="#8A5CFF" />
      </div>

      {/* Territory Members Bar Chart */}
      <div className="bg-[#121826] rounded-2xl p-6 border border-white/5">
        <h3 className="text-sm font-black uppercase tracking-widest text-[#00CFFF] mb-6 flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Members by Territory
        </h3>
        {territoryMemberCounts.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={territoryMemberCounts} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                <XAxis dataKey="name" tick={{ fill: '#8A9BB0', fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: '#8A9BB0', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#121826', border: '1px solid rgba(0,207,255,0.2)', borderRadius: 12, color: '#fff', fontSize: 12 }}
                  formatter={(value) => [`${value} members`, 'Members']}
                />
                <Bar dataKey="members" radius={[6, 6, 0, 0]}>
                  {territoryMemberCounts.map((entry, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-8">No member data to display yet.</p>
        )}
      </div>

      {/* Country Distribution Pie Chart */}
      {countryBreakdown.length > 0 && (
        <div className="bg-[#121826] rounded-2xl p-6 border border-white/5">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#FFD000] mb-6 flex items-center gap-2">
            <Globe className="w-4 h-4" /> Members by Country
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="h-48 w-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={countryBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" stroke="none">
                    {countryBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#121826', border: '1px solid rgba(255,208,0,0.2)', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3">
              {countryBreakdown.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-gray-300">{item.name}</span>
                  <span className="text-xs font-bold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Territory List */}
      <div className="bg-[#121826] rounded-2xl p-6 border border-white/5">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">All Territories</h3>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {territoryMemberCounts.map((t, i) => (
            <div key={i} className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{t.name}</p>
                  <p className="text-[10px] text-gray-500">{[t.region, t.country].filter(Boolean).join(", ")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Users className="w-3 h-3 text-gray-500" />
                <span className="text-sm font-bold text-[#00CFFF]">{t.members}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}