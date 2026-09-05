import React, { useMemo, useState } from "react";
import useAdminDirectory from "@/components/admin/data/useAdminDirectory";
import { Users, MapPin, Building2, ChevronDown, ChevronRight, Search, Zap } from "lucide-react";
import { useAdminTheme, getAdminTokens } from "./AdminThemeContext";
import { getUserCountry } from "@/lib/countryUtils";
import { buildTerritoryScope, scopeUsers } from "@/lib/territoryScope";

const ROLE_LABELS = {
  church_admin: "Church",
  conference_field_admin: "Conference / Field",
  union_admin: "Union",
  country_admin: "Country",
  ecd_admin: "ECD Division",
  admin: "Global Admin",
  super_admin: "Super Admin",
};

const getLevelColors = (isDark) => ({
  church_admin: isDark ? "#8A5CFF" : "#7e22ce",
  conference_field_admin: isDark ? "#00CFFF" : "#0B3FD9",
  union_admin: isDark ? "#FFD000" : "#d97706",
  country_admin: isDark ? "#22c55e" : "#16a34a",
  ecd_admin: isDark ? "#f97316" : "#ea580c",
});

export default function AdminTerritoryMapTab({ currentUser, territoryRestricted, territoryCountries, territoryRegions, territoryApproved }) {
  const { theme } = useAdminTheme();
  const t = getAdminTokens(theme);
  const isDark = theme === "dark";
  const LEVEL_COLORS = getLevelColors(isDark);

  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState("country");
  const [expanded, setExpanded] = useState({});

  const directory = useAdminDirectory(currentUser);
  const allUsers = directory.users;
  const isLoading = !directory.complete;

  // Only show the countries/regions this admin selected in Territory Setup.
  const scope = useMemo(
    () => buildTerritoryScope({ territoryRestricted, territoryApproved, territoryCountries, territoryRegions }),
    [territoryRestricted, territoryApproved, territoryCountries, territoryRegions]
  );
  const users = useMemo(() => scopeUsers(scope, allUsers), [scope, allUsers]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u =>
      !q ||
      u.full_name?.toLowerCase().includes(q) ||
      u.country?.toLowerCase().includes(q) ||
      u.city?.toLowerCase().includes(q) ||
      u.postal_code?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(u => {
      const key = (groupBy === "country" ? getUserCountry(u) : groupBy === "city" ? u.city : u.postal_code) || "Unassigned";
      if (!map[key]) map[key] = [];
      map[key].push(u);
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [filtered, groupBy]);

  const totalWithAddress = users.filter(u => getUserCountry(u) && String(u.city || "").trim()).length;
  const totalUsers = users.length;

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  if (territoryRestricted && !territoryApproved) {
    return (
      <div className="border rounded-2xl p-6 text-sm" style={{ background: t.surface, borderColor: t.border, color: t.textSecondary }}>
        Please confirm your territory first (Territory Setup — select your countries and regions) to see your territory map.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-['Space_Grotesk']" style={{ color: t.textPrimary }}>🗺️ Territory Distribution Map</h1>
        <p className="mt-1 text-sm" style={{ color: t.textSecondary }}>User density across territories based on city, country & postal code data.</p>
        {scope.active && (
          <p className="mt-2 text-xs inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border" style={{ background: t.accentSoft, borderColor: t.borderStrong, color: t.accent }}>
            <MapPin size={11} /> Your territory: {scope.summary || "not set"}
          </p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Members", value: totalUsers, color: isDark ? "#00CFFF" : "#0B3FD9", icon: Users },
          { label: "Location Complete", value: totalWithAddress, color: isDark ? "#22c55e" : "#16a34a", icon: MapPin },
          { label: "Missing Location", value: totalUsers - totalWithAddress, color: isDark ? "#f97316" : "#ea580c", icon: MapPin },
          { label: "Unique Cities", value: new Set(users.map(u => u.city).filter(Boolean)).size, color: isDark ? "#8A5CFF" : "#7e22ce", icon: Building2 },
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

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: t.textMuted }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, country, city or postal code…"
            className="w-full border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none transition-colors"
            style={{ background: t.surface, borderColor: t.border, color: t.textPrimary }}
          />
        </div>
        <div className="flex gap-2">
          {[["country", "Country"], ["city", "City"], ["postal_code", "Postal Code"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setGroupBy(val)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition`}
              style={groupBy === val ? { background: t.accentSoft, borderColor: t.borderStrong, color: t.accent } : { borderColor: t.border, color: t.textSecondary, background: "transparent" }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Territory Groups */}
      {isLoading ? (
        <div className="text-center py-20 text-sm" style={{ color: t.textMuted }}>Loading territory data…</div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-20 text-sm rounded-2xl border" style={{ background: t.surface, borderColor: t.border, color: t.textMuted }}>No data found.</div>
      ) : (
        <div className="space-y-3">
          {grouped.map(([key, members]) => {
            const isOpen = expanded[key];
            const pct = Math.round((members.length / totalUsers) * 100);
            const admins = members.filter(u => Object.keys(ROLE_LABELS).includes(u.role));
            return (
              <div key={key} className="border rounded-2xl overflow-hidden" style={{ background: t.surface, borderColor: t.border }}>
                <button
                  onClick={() => toggle(key)}
                  className="w-full flex items-center gap-4 px-5 py-4 transition text-left hover:opacity-80"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm truncate" style={{ color: t.textPrimary }}>{key}</span>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        {admins.length > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{ background: "rgba(255,208,0,0.15)", color: isDark ? "#FFD000" : "#d97706", borderColor: "rgba(255,208,0,0.2)" }}>
                            {admins.length} admin{admins.length > 1 ? "s" : ""}
                          </span>
                        )}
                        <span className="text-xs font-bold" style={{ color: t.textSecondary }}>{members.length} member{members.length !== 1 ? "s" : ""}</span>
                        <span className="text-xs" style={{ color: t.textMuted }}>{pct}%</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: t.surfaceMuted }}>
                      <div className="h-full rounded-full transition-all" style={{ background: t.gradient, width: `${pct}%` }} />
                    </div>
                  </div>
                  {isOpen ? <ChevronDown size={16} className="shrink-0" style={{ color: t.textMuted }} /> : <ChevronRight size={16} className="shrink-0" style={{ color: t.textMuted }} />}
                </button>

                {isOpen && (
                  <div className="border-t divide-y" style={{ borderColor: t.border }}>
                    {members.map(u => (
                      <div key={u.id} className="flex items-center gap-3 px-5 py-3 transition hover:opacity-80" style={{ background: isDark ? "rgba(255,255,255,0.02)" : "rgba(11,27,61,0.02)" }}>
                        <img
                          src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                          className="w-8 h-8 rounded-full object-cover border shrink-0" style={{ borderColor: t.border }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: t.textPrimary }}>{u.full_name || u.email}</p>
                          <p className="text-[11px] truncate" style={{ color: t.textMuted }}>{[u.address, u.city, u.postal_code, u.country].filter(Boolean).join(", ")}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: isDark ? "#FFD000" : "#d97706" }}>
                            <Zap size={10} />{u.glow_score || 0}
                          </span>
                          {ROLE_LABELS[u.role] && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
                              style={{ color: LEVEL_COLORS[u.role] || t.textSecondary, borderColor: `${LEVEL_COLORS[u.role] || "#444"}40`, background: `${LEVEL_COLORS[u.role] || "#444"}10` }}>
                              {ROLE_LABELS[u.role]}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}