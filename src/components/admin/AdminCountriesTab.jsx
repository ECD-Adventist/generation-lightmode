import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Globe, Zap, Users, TrendingUp, Award, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import CountriesWorldMap from "./CountriesWorldMap";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";
import { getUserCountry, normalizeCountryName } from "@/lib/countryUtils";
import { buildTerritoryScope, scopeUsers, scopeGroups, scopeDropsByAuthor } from "@/lib/territoryScope";

const MEDAL = ["🥇", "🥈", "🥉"];

export default function AdminCountriesTab({ user, territoryRestricted, territoryCountries, territoryRegions, territoryApproved }) {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";
  const COLORS = isDark ? ["#FFD000", "#C8D0E0", "#C77A2B"] : ["#d97706", "#6B7FA0", "#b45309"];

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
        queryClient.invalidateQueries({ queryKey: ["admin_users_countries"] });
        queryClient.invalidateQueries({ queryKey: ["territory_map_users"] });
        queryClient.invalidateQueries({ queryKey: ["assign_tab_users"] });
        queryClient.invalidateQueries({ queryKey: ["admin_users_full"] });
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
    queryFn: () => base44.functions.invoke("adminListUsers", {}).then(r => r.data || []),
  });
  const { data: drops = [] } = useQuery({
    queryKey: ["admin_drops_countries"],
    queryFn: () => base44.entities.GlowDrop.list("-created_date", 10000),
  });
  const { data: groups = [] } = useQuery({
    queryKey: ["admin_groups_countries"],
    queryFn: () => base44.entities.GlowGroup.list("-created_date", 10000),
  });

  const scope = buildTerritoryScope({ territoryRestricted, territoryApproved, territoryCountries, territoryRegions });
  const scopedUsers = scopeUsers(scope, users);
  const scopedGroups = scopeGroups(scope, groups, new Map(users.map(u => [u.email, u])));

  const scopedDrops = scopeDropsByAuthor(scope, drops, users);

  const countryStats = useMemo(() => {
    const map = {};
    scopedUsers.forEach(u => {
      const country = getUserCountry(u);
      if (!country) return;
      if (!map[country]) map[country] = { country, users: 0, totalXP: 0, drops: 0, groups: 0 };
      map[country].users++;
      map[country].totalXP += u.glow_score || 0;
    });
    scopedDrops.forEach(d => {
      if (!d.user_email) return;
      const u = scopedUsers.find(u => u.email === d.user_email);
      const country = getUserCountry(u);
      if (country && map[country]) map[country].drops++;
    });
    scopedGroups.forEach(g => {
      const country = normalizeCountryName(g.country);
      if (country && map[country]) map[country].groups++;
    });
    return Object.values(map)
      .map(c => ({ ...c, score: c.users * 10 + c.totalXP + c.drops * 2 + c.groups * 5 }))
      .sort((a, b) => b.score - a.score);
  }, [scopedUsers, scopedDrops, scopedGroups]);

  const maxScore = countryStats[0]?.score || 1;
  const totalUsers = scopedUsers.length;
  const totalXP = scopedUsers.reduce((s, u) => s + (u.glow_score || 0), 0);

  if (territoryRestricted && !territoryApproved) {
    return <div className="border rounded-2xl p-6 text-sm" style={{ background: t.surface, borderColor: t.border, color: t.textSecondary }}>Please confirm your territory first (Territory Setup — select your countries) to unlock country rankings.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>🌍 Countries Lighting Up</h1>
          <p className="mt-1 text-sm" style={{ color: t.textSecondary }}>Nations ranked by total members and aggregate Glow Score XP.</p>
        </div>
        <button
          onClick={handleMerge}
          disabled={merging}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50 shrink-0"
          style={{ background: t.accentSoft, border: `1px solid ${t.borderStrong}`, color: t.accent }}
        >
          {merging ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          {merging ? "Merging..." : "Merge Duplicates"}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Nations Active", value: countryStats.length, icon: Globe, color: isDark ? "#22c55e" : "#16a34a" },
          { label: "Total Members", value: totalUsers, icon: Users, color: isDark ? "#00CFFF" : "#0B3FD9" },
          { label: "Total XP Earned", value: totalXP.toLocaleString(), icon: Zap, color: isDark ? "#FFD000" : "#d97706" },
          { label: "Glow Drops", value: scopedDrops.length, icon: TrendingUp, color: isDark ? "#8A5CFF" : "#7e22ce" },
        ].map((s, i) => (
          <div key={i} className="border rounded-2xl p-4 flex items-center gap-3" style={{ background: t.surface, borderColor: t.border }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: t.textMuted }}>{s.label}</p>
              <p className="text-xl font-black font-['Space_Grotesk']" style={{ color: t.textPrimary }}>{s.value}</p>
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
              <h3 className="font-black text-lg font-['Space_Grotesk'] truncate" style={{ color: t.textPrimary }}>{c.country}</h3>
              <p className="text-xs mt-1" style={{ color: t.textSecondary }}>{c.users} members</p>
              <div className="flex items-center justify-center gap-1 mt-2">
                <Zap size={12} style={{ color: COLORS[i] }} />
                <span className="font-bold text-sm" style={{ color: COLORS[i] }}>{c.totalXP.toLocaleString()} XP</span>
              </div>
              <div className="mt-3 text-[10px]" style={{ color: t.textMuted }}>{c.drops} drops · {c.groups} groups</div>
            </div>
          ))}
        </div>
      )}

      {/* Full Rankings */}
      <div className="border rounded-2xl overflow-hidden" style={{ background: t.surface, borderColor: t.border }}>
        <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: t.border }}>
          <Award size={16} style={{ color: isDark ? "#FFD000" : "#d97706" }} />
          <h3 className="font-bold text-sm" style={{ color: t.textPrimary }}>Full Country Rankings</h3>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-sm" style={{ color: t.textMuted }}>Loading...</div>
        ) : countryStats.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: t.textMuted }}>No country data yet. Encourage members to set their country!</div>
        ) : (
          <div className="divide-y" style={{ borderColor: t.border }}>
            {countryStats.map((c, i) => {
              const pct = Math.round((c.score / maxScore) * 100);
              return (
                <div key={c.country} className="flex items-center gap-4 px-5 py-4 transition hover:opacity-80">
                  <span className="w-7 text-center font-black text-sm shrink-0" style={{ color: i < 3 ? COLORS[i] : t.textMuted }}>
                    {i < 3 ? MEDAL[i] : `#${i + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm truncate" style={{ color: t.textPrimary }}>{c.country}</span>
                      <div className="flex items-center gap-3 text-xs shrink-0 ml-4" style={{ color: t.textSecondary }}>
                        <span className="flex items-center gap-1"><Users size={10} /> {c.users}</span>
                        <span className="flex items-center gap-1 font-bold" style={{ color: isDark ? "#FFD000" : "#d97706" }}><Zap size={10} /> {c.totalXP.toLocaleString()}</span>
                        <span className="flex items-center gap-1">{c.drops} drops</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ background: t.surfaceMuted }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: i < 3 ? COLORS[i] : t.accent }} />
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