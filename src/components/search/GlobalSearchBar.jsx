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
    <div className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="max-w-2xl mx-auto mt-4 sm:mt-16 mx-4 sm:mx-auto" onClick={e => e.stopPropagation()}>
        {/* Search Input */}
        <div className="bg-[#121826] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
            <Search className="w-5 h-5 text-gray-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search people, verses, hashtags, groups..."
              className="flex-1 bg-transparent text-white text-base outline-none placeholder:text-gray-600"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-gray-500 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="text-gray-500 hover:text-white transition text-sm font-bold ml-2">
              Cancel
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-1 px-3 py-2 border-b border-white/5">
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                  filter === f.id ? "bg-[#00CFFF]/20 text-[#00CFFF]" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
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
                <div className="text-center py-12 text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No results for "{query}"</p>
                </div>
              ) : (
                <div className="py-2">
                  {/* Users */}
                  {results.users.length > 0 && (
                    <div className="px-3 py-1">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-2 py-2">People</div>
                      {results.users.map(u => (
                        <Link
                          key={u.id}
                          to={createPageUrl("Profile") + `?user=${encodeURIComponent(u.email)}`}
                          onClick={onClose}
                          className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/5 transition no-underline"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00CFFF] to-[#8A5CFF] p-[2px] shrink-0">
                            <div className="w-full h-full rounded-full bg-[#0B0F1A] overflow-hidden">
                              <img src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-white text-sm font-bold truncate">{u.full_name}</div>
                            <div className="text-gray-500 text-xs truncate">{u.country || u.email}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Drops */}
                  {results.drops.length > 0 && (
                    <div className="px-3 py-1">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-2 py-2">Glow Drops</div>
                      {results.drops.map(d => (
                        <Link
                          key={d.id}
                          to={`${createPageUrl("Post")}?id=${encodeURIComponent(d.id)}&user=${encodeURIComponent(d.user_email)}`}
                          onClick={onClose}
                          className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/5 transition no-underline"
                        >
                          <div className="w-10 h-10 rounded-lg bg-[#0B0F1A] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                            {d.media_url ? (
                              <img src={d.media_url} className="w-full h-full object-cover" />
                            ) : (
                              <Hash className="w-4 h-4 text-[#00CFFF]" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-white text-sm font-medium truncate">{d.verse || d.reflection?.slice(0, 60) || "Glow Drop"}</div>
                            <div className="text-gray-500 text-xs truncate">{d.hashtags || d.category || ""}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Groups */}
                  {results.groups.length > 0 && (
                    <div className="px-3 py-1">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-2 py-2">GlowGroups</div>
                      {results.groups.map(g => (
                        <Link
                          key={g.id}
                          to={createPageUrl("GlowGroups")}
                          onClick={onClose}
                          className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/5 transition no-underline"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD000]/20 to-[#00CFFF]/20 border border-white/10 flex items-center justify-center shrink-0">
                            <Globe className="w-4 h-4 text-[#FFD000]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-white text-sm font-bold truncate">{g.name}</div>
                            <div className="text-gray-500 text-xs truncate">{g.country}</div>
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
              <p className="text-gray-600 text-sm">Try searching for a name, #hashtag, verse, or group</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}