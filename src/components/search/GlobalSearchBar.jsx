import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, Users, Hash, Globe, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const FILTERS = [
  { id: "all", label: "All", icon: Search },
  { id: "users", label: "Users", icon: Users },
  { id: "drops", label: "Drops", icon: Hash },
  { id: "groups", label: "Groups", icon: Globe },
];

export default function GlobalSearchBar({ onClose }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const { data: users = [] } = useQuery({
    queryKey: ["searchUsers"],
    queryFn: async () => { const res = await base44.functions.invoke("listPublicUsers", {}); return res.data; },
    staleTime: 1000 * 60 * 5,
  });

  const { data: drops = [] } = useQuery({
    queryKey: ["searchDrops"],
    queryFn: () => base44.entities.GlowDrop.filter({ status: "approved" }, "-created_date", 200),
    staleTime: 1000 * 60 * 2,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["searchGroups"],
    queryFn: () => base44.entities.GlowGroup.list("-created_date", 100),
    staleTime: 1000 * 60 * 5,
  });

  const q = query.toLowerCase().trim();

  const results = useMemo(() => {
    if (!q) return { users: [], drops: [], groups: [] };

    const matchedUsers = (filter === "all" || filter === "users")
      ? users.filter(u => u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.country?.toLowerCase().includes(q)).slice(0, 8)
      : [];

    const matchedDrops = (filter === "all" || filter === "drops")
      ? drops.filter(d => d.verse?.toLowerCase().includes(q) || d.reflection?.toLowerCase().includes(q) || d.hashtags?.toLowerCase().includes(q) || d.category?.toLowerCase().includes(q)).slice(0, 8)
      : [];

    const matchedGroups = (filter === "all" || filter === "groups")
      ? groups.filter(g => g.name?.toLowerCase().includes(q) || g.country?.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q)).slice(0, 8)
      : [];

    return { users: matchedUsers, drops: matchedDrops, groups: matchedGroups };
  }, [q, filter, users, drops, groups]);

  const totalResults = results.users.length + results.drops.length + results.groups.length;

  return (
    <div className="fixed inset-0 z-[9998] bg-[rgba(10,26,61,0.28)] backdrop-blur-sm" onClick={onClose}>
      <div className="max-w-2xl mx-auto mt-4 sm:mt-16 mx-3 sm:mx-auto" onClick={e => e.stopPropagation()}>
        {/* Search Input */}
        <div className="bg-white border rounded-2xl overflow-hidden shadow-2xl" style={{ borderColor: "#E0EAF5", boxShadow: "0 20px 50px rgba(11, 63, 217, 0.14)" }}>
          <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "#E0EAF5" }}>
            <Search className="w-5 h-5 shrink-0" style={{ color: "#1FB8FF" }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search people, verses, hashtags, groups..."
              className="flex-1 bg-transparent text-[#0B1B3D] text-base outline-none placeholder:text-[#8A97B5]"
            />
            {query && (
              <button onClick={() => setQuery("")} className="transition" style={{ color: "#8A97B5" }}>
                <X className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="transition text-sm font-bold ml-2" style={{ color: "#4A5878" }}>
              Cancel
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-1 px-3 py-2 border-b" style={{ borderColor: "#E0EAF5" }}>
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                  filter === f.id ? "bg-[#E8F7FF] text-[#0B3FD9]" : "text-[#6B7FA0] hover:text-[#0B1B3D] hover:bg-[#F6F8FC]"
                }`}
              >
                <f.icon className="w-3 h-3" /> {f.label}
              </button>
            ))}
          </div>

          {/* Results */}
          {q && (
            <div className="max-h-[60vh] overflow-y-auto">
              {totalResults === 0 ? (
                <div className="text-center py-12" style={{ color: "#8A97B5" }}>
                  <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No results for "{query}"</p>
                </div>
              ) : (
                <div className="py-2">
                  {/* Users */}
                  {results.users.length > 0 && (
                    <div className="px-3 py-1">
                      <div className="text-[10px] font-black uppercase tracking-widest px-2 py-2" style={{ color: "#8A97B5" }}>People</div>
                      {results.users.map(u => (
                        <Link
                          key={u.id}
                          to={createPageUrl("Profile") + `?user=${encodeURIComponent(u.email)}`}
                          onClick={onClose}
                          className="flex items-center gap-3 px-2 py-2.5 rounded-xl transition no-underline hover:bg-[#F6F8FC]"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00CFFF] to-[#8A5CFF] p-[2px] shrink-0">
                            <div className="w-full h-full rounded-full bg-white overflow-hidden">
                              <img src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[#0B1B3D] text-sm font-bold truncate">{u.full_name}</div>
                            <div className="text-[#8A97B5] text-xs truncate">{u.country || u.email}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Drops */}
                  {results.drops.length > 0 && (
                    <div className="px-3 py-1">
                      <div className="text-[10px] font-black uppercase tracking-widest px-2 py-2" style={{ color: "#8A97B5" }}>Glow Drops</div>
                      {results.drops.map(d => (
                        <Link
                          key={d.id}
                          to={`${createPageUrl("Post")}?id=${encodeURIComponent(d.id)}&user=${encodeURIComponent(d.user_email)}`}
                          onClick={onClose}
                          className="flex items-center gap-3 px-2 py-2.5 rounded-xl transition no-underline hover:bg-[#F6F8FC]"
                        >
                          <div className="w-10 h-10 rounded-lg bg-[#F6F8FC] border flex items-center justify-center shrink-0 overflow-hidden" style={{ borderColor: "#E0EAF5" }}>
                            {d.media_url ? (
                              <img src={d.media_url} className="w-full h-full object-cover" />
                            ) : (
                              <Hash className="w-4 h-4 text-[#1FB8FF]" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[#0B1B3D] text-sm font-medium truncate">{d.verse || d.reflection?.slice(0, 60) || "Glow Drop"}</div>
                            <div className="text-[#8A97B5] text-xs truncate">{d.hashtags || d.category || ""}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Groups */}
                  {results.groups.length > 0 && (
                    <div className="px-3 py-1">
                      <div className="text-[10px] font-black uppercase tracking-widest px-2 py-2" style={{ color: "#8A97B5" }}>GlowGroups</div>
                      {results.groups.map(g => (
                        <Link
                          key={g.id}
                          to={createPageUrl("GlowGroups")}
                          onClick={onClose}
                          className="flex items-center gap-3 px-2 py-2.5 rounded-xl transition no-underline hover:bg-[#F6F8FC]"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD000]/20 to-[#00CFFF]/20 border flex items-center justify-center shrink-0" style={{ borderColor: "#E0EAF5" }}>
                            <Globe className="w-4 h-4 text-[#CC7A00]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[#0B1B3D] text-sm font-bold truncate">{g.name}</div>
                            <div className="text-[#8A97B5] text-xs truncate">{g.country}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick suggestions when empty */}
          {!q && (
            <div className="px-5 py-6 text-center">
              <p className="text-sm" style={{ color: "#6B7FA0" }}>Try searching for a name, #hashtag, verse, or group</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}