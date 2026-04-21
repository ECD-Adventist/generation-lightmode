import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, X, Heart, MessageCircle } from "lucide-react";
import { getDisplayName } from "@/lib/displayName";

/**
 * Mobile-only Discover/Search page styled like Instagram's Explore tab:
 * - Top sticky search bar
 * - When idle: responsive grid of posts (square tiles)
 * - When typing: segmented tabs (Top, Accounts, Tags) with result rows
 */
export default function MobileDiscover({
  user,
  drops,
  allUsers,
  trendingTags,
  topLikedDrops,
  getUserInfo,
}) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("top"); // top | accounts | tags
  const q = search.trim().toLowerCase();

  const filteredDrops = useMemo(() => {
    if (!q) return topLikedDrops;
    return drops.filter(d =>
      (d.verse || "").toLowerCase().includes(q) ||
      (d.reflection || "").toLowerCase().includes(q) ||
      (d.hashtags || "").toLowerCase().includes(q)
    );
  }, [drops, topLikedDrops, q]);

  const filteredAccounts = useMemo(() => {
    if (!q) return [];
    return allUsers
      .filter(u =>
        (u.display_name || "").toLowerCase().includes(q) ||
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.country || "").toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [allUsers, q]);

  const filteredTags = useMemo(() => {
    if (!q) return trendingTags;
    const needle = q.startsWith("#") ? q : `#${q}`;
    return trendingTags.filter(t => t.tag.toLowerCase().includes(needle.toLowerCase()));
  }, [trendingTags, q]);

  return (
    <div className="min-h-screen font-['Inter']" style={{ background: "#FFFFFF", color: "#0B1B3D" }}>
      {/* Top sticky search */}
      <div className="sticky top-0 z-40" style={{ background: "#FFFFFF", borderBottom: "1px solid #EFEFEF" }}>
        <div className="px-3 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8E8E8E" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full rounded-xl py-2.5 pl-10 pr-9 text-[15px] focus:outline-none"
              style={{ background: "#EFEFEF", color: "#0B1B3D", border: "none" }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#C7C7C7", color: "#FFFFFF" }}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs shown only when searching */}
        {q && (
          <div className="flex items-center justify-around text-[13px] font-semibold" style={{ color: "#8E8E8E" }}>
            {[
              { key: "top", label: "Top" },
              { key: "accounts", label: "Accounts" },
              { key: "tags", label: "Tags" },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex-1 py-2.5 transition relative"
                style={{ color: tab === t.key ? "#0B1B3D" : "#8E8E8E" }}
              >
                {t.label}
                {tab === t.key && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[2px] rounded-full" style={{ background: "#0B1B3D" }} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      {!q ? (
        // Explore grid
        <div className="grid grid-cols-3 gap-[2px]">
          {filteredDrops.length === 0 ? (
            <div className="col-span-3 py-20 text-center text-sm" style={{ color: "#8E8E8E" }}>
              No posts yet.
            </div>
          ) : filteredDrops.map((drop, i) => {
            // Vary tile sizes like Instagram (every 7th tile is 2x2)
            const isBig = i % 7 === 2;
            return (
              <Link
                key={drop.id}
                to={createPageUrl("Post") + `?id=${encodeURIComponent(drop.id)}&user=${encodeURIComponent(drop.user_email)}`}
                className={`relative block overflow-hidden ${isBig ? "row-span-2 col-span-2 aspect-square" : "aspect-square"}`}
                style={{ background: drop.media_url ? "#000" : "linear-gradient(135deg, #EEF3FF, #DDE7FB)" }}
              >
                {drop.media_url ? (
                  <img src={drop.media_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-2 text-center">
                    <span className="text-[11px] sm:text-xs font-bold line-clamp-5 leading-tight" style={{ color: "#0B3FD9" }}>
                      {drop.verse || drop.reflection?.slice(0, 60)}
                    </span>
                  </div>
                )}
                {(drop.likes_count || 0) > 0 && (
                  <div className="absolute bottom-1 right-1 flex items-center gap-0.5 px-1 py-0.5 rounded" style={{ background: "rgba(0,0,0,0.45)" }}>
                    <Heart className="w-3 h-3 fill-white text-white" />
                    <span className="text-[10px] font-bold text-white">{drop.likes_count}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        // Search results
        <div>
          {tab === "top" && (
            <div>
              {filteredAccounts.slice(0, 3).map(u => (
                <AccountRow key={u.email} u={u} />
              ))}
              {filteredTags.slice(0, 3).map(t => (
                <TagRow key={t.tag} t={t} />
              ))}
              <div className="grid grid-cols-3 gap-[2px] mt-1">
                {filteredDrops.slice(0, 30).map(drop => (
                  <Link
                    key={drop.id}
                    to={createPageUrl("Post") + `?id=${encodeURIComponent(drop.id)}&user=${encodeURIComponent(drop.user_email)}`}
                    className="relative block aspect-square overflow-hidden"
                    style={{ background: drop.media_url ? "#000" : "linear-gradient(135deg, #EEF3FF, #DDE7FB)" }}
                  >
                    {drop.media_url ? (
                      <img src={drop.media_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-2 text-center">
                        <span className="text-[11px] font-bold line-clamp-4 leading-tight" style={{ color: "#0B3FD9" }}>
                          {drop.verse || drop.reflection?.slice(0, 60)}
                        </span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
              {filteredAccounts.length === 0 && filteredTags.length === 0 && filteredDrops.length === 0 && (
                <EmptyState q={search} />
              )}
            </div>
          )}

          {tab === "accounts" && (
            <div>
              {filteredAccounts.length === 0 ? (
                <EmptyState q={search} type="accounts" />
              ) : filteredAccounts.map(u => <AccountRow key={u.email} u={u} />)}
            </div>
          )}

          {tab === "tags" && (
            <div>
              {filteredTags.length === 0 ? (
                <EmptyState q={search} type="tags" />
              ) : filteredTags.map(t => <TagRow key={t.tag} t={t} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AccountRow({ u }) {
  return (
    <Link
      to={createPageUrl("Profile") + `?user=${encodeURIComponent(u.email)}`}
      className="flex items-center gap-3 px-4 py-2.5 no-underline active:bg-[#FAFAFA]"
    >
      <div className="w-11 h-11 rounded-full overflow-hidden shrink-0" style={{ border: "1px solid #EFEFEF" }}>
        <img src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate" style={{ color: "#0B1B3D" }}>{getDisplayName(u)}</div>
        <div className="text-xs truncate" style={{ color: "#8E8E8E" }}>
          {u.full_name && u.full_name !== getDisplayName(u) ? u.full_name : (u.country || "LightMode Member")}
        </div>
      </div>
    </Link>
  );
}

function TagRow({ t }) {
  return (
    <Link
      to={createPageUrl("Feed") + `?tag=${encodeURIComponent(t.tag)}`}
      className="flex items-center gap-3 px-4 py-2.5 no-underline active:bg-[#FAFAFA]"
    >
      <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "#EFEFEF", color: "#0B1B3D" }}>
        <span className="text-lg font-bold">#</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate" style={{ color: "#0B1B3D" }}>{t.tag}</div>
        <div className="text-xs" style={{ color: "#8E8E8E" }}>{t.count} post{t.count === 1 ? "" : "s"}</div>
      </div>
    </Link>
  );
}

function EmptyState({ q, type }) {
  return (
    <div className="py-20 text-center">
      <div className="text-sm font-semibold mb-1" style={{ color: "#0B1B3D" }}>
        No {type || "results"} for "{q}"
      </div>
      <div className="text-xs" style={{ color: "#8E8E8E" }}>Try a different search.</div>
    </div>
  );
}