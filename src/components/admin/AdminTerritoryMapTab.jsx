import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, MapPin, Building2, ChevronDown, ChevronRight, Search, Zap } from "lucide-react";

const ROLE_LABELS = {
  church_admin: "Church",
  conference_field_admin: "Conference / Field",
  union_admin: "Union",
  country_admin: "Country",
  ecd_admin: "ECD Division",
  admin: "Global Admin",
  super_admin: "Super Admin",
};

const LEVEL_COLORS = {
  church_admin: "#8A5CFF",
  conference_field_admin: "#00CFFF",
  union_admin: "#FFD000",
  country_admin: "#22c55e",
  ecd_admin: "#f97316",
};

export default function AdminTerritoryMapTab({ currentUser }) {
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState("country"); // country | city | postal_code
  const [expanded, setExpanded] = useState({});

  const { data: rawUsers = [], isLoading } = useQuery({
    queryKey: ["territory_map_users"],
    queryFn: () => base44.functions.invoke("listAllUsersAdmin", {}).then(r => r.data || []),
  });

  // Fallback to listPublicUsers if admin endpoint unavailable
  const { data: pubUsers = [] } = useQuery({
    queryKey: ["pub_users_territory"],
    queryFn: () => base44.functions.invoke("listPublicUsers", {}).then(r => r.data || []),
    enabled: rawUsers.length === 0,
  });

  const users = rawUsers.length > 0 ? rawUsers : pubUsers;

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
      const key = (groupBy === "country" ? u.country : groupBy === "city" ? u.city : u.postal_code) || "Unassigned";
      if (!map[key]) map[key] = [];
      map[key].push(u);
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [filtered, groupBy]);

  const totalWithAddress = users.filter(u => u.city && u.postal_code).length;
  const totalUsers = users.length;

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-['Space_Grotesk'] text-white">🗺️ Territory Distribution Map</h1>
        <p className="text-gray-400 text-sm mt-1">User density across territories based on city, country & postal code data.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Members", value: totalUsers, color: "#00CFFF", icon: Users },
          { label: "Location Complete", value: totalWithAddress, color: "#22c55e", icon: MapPin },
          { label: "Missing Location", value: totalUsers - totalWithAddress, color: "#f97316", icon: MapPin },
          { label: "Unique Cities", value: new Set(users.map(u => u.city).filter(Boolean)).size, color: "#8A5CFF", icon: Building2 },
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

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, country, city or postal code…"
            className="w-full bg-[#121826] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00CFFF]/40"
          />
        </div>
        <div className="flex gap-2">
          {[["country", "Country"], ["city", "City"], ["postal_code", "Postal Code"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setGroupBy(val)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition ${groupBy === val ? "bg-[#00CFFF]/15 border-[#00CFFF]/40 text-[#00CFFF]" : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Territory Groups */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-500 text-sm">Loading territory data…</div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-20 text-gray-500 text-sm bg-[#121826] rounded-2xl border border-white/5">No data found.</div>
      ) : (
        <div className="space-y-3">
          {grouped.map(([key, members]) => {
            const isOpen = expanded[key];
            const pct = Math.round((members.length / totalUsers) * 100);
            const admins = members.filter(u => Object.keys(ROLE_LABELS).includes(u.role));
            return (
              <div key={key} className="bg-[#121826] border border-white/5 rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggle(key)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-white text-sm truncate">{key}</span>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        {admins.length > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFD000]/15 text-[#FFD000] border border-[#FFD000]/20">
                            {admins.length} admin{admins.length > 1 ? "s" : ""}
                          </span>
                        )}
                        <span className="text-xs font-bold text-gray-400">{members.length} member{members.length !== 1 ? "s" : ""}</span>
                        <span className="text-xs text-gray-600">{pct}%</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  {isOpen ? <ChevronDown size={16} className="text-gray-500 shrink-0" /> : <ChevronRight size={16} className="text-gray-500 shrink-0" />}
                </button>

                {isOpen && (
                  <div className="border-t border-white/5 divide-y divide-white/5">
                    {members.map(u => (
                      <div key={u.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition">
                        <img
                          src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"}
                          className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{u.full_name || u.email}</p>
                          <p className="text-[11px] text-gray-500 truncate">{[u.address, u.city, u.postal_code, u.country].filter(Boolean).join(", ")}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-[#FFD000]">
                            <Zap size={10} />{u.glow_score || 0}
                          </span>
                          {ROLE_LABELS[u.role] && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
                              style={{ color: LEVEL_COLORS[u.role] || "#C8D0E0", borderColor: `${LEVEL_COLORS[u.role] || "#444"}40`, background: `${LEVEL_COLORS[u.role] || "#444"}10` }}>
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