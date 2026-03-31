import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Globe, Zap, Users, TrendingUp, Award, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import CountriesWorldMap from "./CountriesWorldMap";

const MEDAL = ["🥇", "🥈", "🥉"];
const COLORS = ["#FFD000", "#C8D0E0", "#C77A2B"];

export default function AdminCountriesTab({ user, territoryRestricted, territoryCountries, territoryApproved }) {
  const [merging, setMerging] = useState(false);
  const queryClient = useQueryClient();

  const handleMerge = async () => {
    setMerging(true);
    try {
      const res = await base44.functions.invoke("normalizeCountries", {});
      const { updated, changes } = res.data;
      if (updated === 0) {
        toast.success("No duplicates found — all countries are already clean!");
      } else {
        toast.success(`Merged ${updated} user record(s). Refreshing...`);
        changes.forEach(c => console.log(`  ${c.email}: "${c.from}" → "${c.to}"`));
        queryClient.invalidateQueries({ queryKey: ["admin_users_countries"] });
        queryClient.invalidateQueries({ queryKey: ["admin_users"] });
        queryClient.invalidateQueries({ queryKey: ["analytics_users"] });
      }
    } catch (err) {
      toast.error("Failed to run country merge: " + err.message);
    } finally {
      setMerging(false);
    }
  };

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin_users_countries"],
    queryFn: () => base44.functions.invoke("listPublicUsers", {}).then(r => r.data || []),
  });
  const { data: drops = [] } = useQuery({
    queryKey: ["admin_drops_countries"],
    queryFn: () => base44.entities.GlowDrop.list(),
  });
  const { data: groups = [] } = useQuery({
    queryKey: ["admin_groups_countries"],
    queryFn: () => base44.entities.GlowGroup.list(),
  });

  const allowedCountries = (territoryCountries || "").split(",").map(item => item.trim()).filter(Boolean);

  const scopedUsers = territoryRestricted && territoryApproved
    ? users.filter(entry => allowedCountries.includes(entry.country))
    : users;

  const scopedGroups = territoryRestricted && territoryApproved
    ? groups.filter(group => allowedCountries.includes(group.country))
    : groups;

  const countryStats = useMemo(() => {
    const map = {};
    scopedUsers.forEach(u => {
      if (!u.country) return;
      if (!map[u.country]) map[u.country] = { country: u.country, users: 0, totalXP: 0, drops: 0, groups: 0 };
      map[u.country].users++;
      map[u.country].totalXP += u.glow_score || 0;
    });
    drops.forEach(d => {
      if (!d.user_email) return;
      const u = scopedUsers.find(u => u.email === d.user_email);
      if (u?.country && map[u.country]) map[u.country].drops++;
    });
    scopedGroups.forEach(g => {
      if (g.country && map[g.country]) map[g.country].groups++;
    });
    return Object.values(map)
      .map(c => ({ ...c, score: c.users * 10 + c.totalXP + c.drops * 2 + c.groups * 5 }))
      .sort((a, b) => b.score - a.score);
  }, [scopedUsers, drops, scopedGroups]);

  const maxScore = countryStats[0]?.score || 1;
  const totalUsers = scopedUsers.length;
  const totalXP = scopedUsers.reduce((s, u) => s + (u.glow_score || 0), 0);

  if (territoryRestricted && !territoryApproved) {
    return <div className="bg-[#121826] border border-[#FFD000]/30 rounded-2xl p-6 text-sm text-gray-300">Please confirm your territory map first to unlock country rankings.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] text-white">🌍 Countries Lighting Up</h1>
          <p className="text-gray-400 mt-1 text-sm">Nations ranked by total members and aggregate Glow Score XP.</p>
        </div>
        <button
          onClick={handleMerge}
          disabled={merging}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00CFFF]/10 border border-[#00CFFF]/20 text-[#00CFFF] text-sm font-bold hover:bg-[#00CFFF]/20 transition disabled:opacity-50 shrink-0"
        >
          {merging ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          {merging ? "Merging..." : "Merge Duplicates"}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Nations Active", value: countryStats.length, icon: Globe, color: "#22c55e" },
          { label: "Total Members", value: totalUsers, icon: Users, color: "#00CFFF" },
          { label: "Total XP Earned", value: totalXP.toLocaleString(), icon: Zap, color: "#FFD000" },
          { label: "Glow Drops", value: drops.length, icon: TrendingUp, color: "#8A5CFF" },
        ].map((s, i) => (
          <div key={i} className="bg-[#121826] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{s.label}</p>
              <p className="text-xl font-black text-white font-['Space_Grotesk']">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* World Map */}
      <CountriesWorldMap countryStats={countryStats} />

      {/* Top 3 Podium */}
      {countryStats.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {countryStats.slice(0, 3).map((c, i) => (
            <div key={c.country} className="relative rounded-2xl p-5 border text-center overflow-hidden"
              style={{ background: `${COLORS[i]}08`, borderColor: `${COLORS[i]}25` }}>
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: COLORS[i] }} />
              <div className="text-4xl mb-2">{MEDAL[i]}</div>
              <h3 className="font-black text-white text-lg font-['Space_Grotesk'] truncate">{c.country}</h3>
              <p className="text-xs text-gray-400 mt-1">{c.users} members</p>
              <div className="flex items-center justify-center gap-1 mt-2">
                <Zap size={12} style={{ color: COLORS[i] }} />
                <span className="font-bold text-sm" style={{ color: COLORS[i] }}>{c.totalXP.toLocaleString()} XP</span>
              </div>
              <div className="mt-3 text-[10px] text-gray-500">{c.drops} drops · {c.groups} groups</div>
            </div>
          ))}
        </div>
      )}

      {/* Full Rankings */}
      <div className="bg-[#121826] border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <Award size={16} className="text-[#FFD000]" />
          <h3 className="font-bold text-white text-sm">Full Country Rankings</h3>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading...</div>
        ) : countryStats.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No country data yet. Encourage members to set their country!</div>
        ) : (
          <div className="divide-y divide-white/5">
            {countryStats.map((c, i) => {
              const pct = Math.round((c.score / maxScore) * 100);
              return (
                <div key={c.country} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition">
                  <span className="w-7 text-center font-black text-sm shrink-0" style={{ color: i < 3 ? COLORS[i] : "#4B5563" }}>
                    {i < 3 ? MEDAL[i] : `#${i + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-white text-sm truncate">{c.country}</span>
                      <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0 ml-4">
                        <span className="flex items-center gap-1"><Users size={10} /> {c.users}</span>
                        <span className="flex items-center gap-1 font-bold text-[#FFD000]"><Zap size={10} /> {c.totalXP.toLocaleString()}</span>
                        <span className="flex items-center gap-1">{c.drops} drops</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: i < 3 ? COLORS[i] : "#00CFFF" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}