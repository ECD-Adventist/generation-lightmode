import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, X, Heart, Sparkles, TrendingUp, Flame, Compass } from "lucide-react";
import { getDisplayName } from "@/lib/displayName";
import KeepIt100Poster from "@/components/keep-it-100/KeepIt100Poster";
import CodesOfTruthPoster from "@/components/codes-of-truth/CodesOfTruthPoster";
import MusicLibraryCard from "@/components/discover/MusicLibraryCard";

const PROFILE_POST_BG = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/6a1c1025d_Gemini_Generated_Image_s3fvlrs3fvlrs3fv.png?v=2";

/**
 * Mobile-only Discover — LightMode branded Explore.
 * Palette: cyan #1FB8FF, royal blue #0B3FD9, gold #FFD000, navy #0B1B3D.
 */
export default function MobileDiscover({
  user,
  drops,
  allUsers,
  trendingTags,
  topLikedDrops,
  onOpenMusicLibrary,
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

  const topCreators = useMemo(() => {
    const map = new Map();
    drops.forEach(d => {
      const cur = map.get(d.user_email) || { email: d.user_email, likes: 0, drops: 0 };
      cur.likes += d.likes_count || 0;
      cur.drops += 1;
      map.set(d.user_email, cur);
    });
    return Array.from(map.values())
      .map(c => ({ ...c, ...(allUsers.find(u => u.email === c.email) || {}) }))
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 6);
  }, [drops, allUsers]);

  return (
    <div className="min-h-screen font-['Inter'] relative overflow-hidden" style={{ background: "linear-gradient(180deg, #F6F8FC 0%, #EEF3FF 60%, #E2EBFF 100%)", color: "#0B1B3D" }}>
      <style>{`
        @keyframes md-float-light { 0%,100% { transform: translateY(0) scale(1); opacity: 0.18 } 50% { transform: translateY(-20px) scale(1.08); opacity: 0.32 } }
        .md-hide-scrollbar::-webkit-scrollbar { display: none; }
        .md-hide-scrollbar { scrollbar-width: none; }
      `}</style>

      {/* Ambient light orbs */}
      <div className="absolute top-[30%] -left-10 w-48 h-48 rounded-full blur-[80px] pointer-events-none" style={{ background: "#1FB8FF", animation: "md-float-light 10s ease-in-out infinite" }} />
      <div className="absolute top-[60%] -right-10 w-56 h-56 rounded-full blur-[90px] pointer-events-none" style={{ background: "#FFD000", opacity: 0.15, animation: "md-float-light 14s ease-in-out infinite 2s" }} />

      {/* HERO — extends under the status bar / camera notch */}
      <div className="relative overflow-hidden safe-pt pb-5 px-4" style={{ background: "linear-gradient(135deg, #0B3FD9 0%, #1FB8FF 100%)" }}>
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full blur-3xl opacity-40" style={{ background: "#FFD000" }} />
        <div className="absolute -bottom-12 -left-10 w-48 h-48 rounded-full blur-3xl opacity-30" style={{ background: "#7FE0FF" }} />

        <div className="relative flex items-center gap-2 mb-3 pt-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Discover</div>
            <h1 className="text-xl font-black font-['Space_Grotesk'] text-white leading-tight">Explore the Light</h1>
          </div>
        </div>

        {/* Search pill */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#0B3FD9" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search drops, people, hashtags…"
            className="w-full rounded-full py-3 pl-11 pr-10 text-[14px] font-medium focus:outline-none"
            style={{ background: "#FFFFFF", color: "#0B1B3D", boxShadow: "0 8px 24px rgba(11, 27, 61, 0.18)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#EEF3FF", color: "#0B3FD9" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs (only when searching) */}
      {q && (
        <div className="sticky top-0 z-30 px-3 py-2 backdrop-blur-xl" style={{ background: "rgba(246, 248, 252, 0.92)", borderBottom: "1px solid #E2E8F0" }}>
          <div className="flex items-center gap-2">
            {[
              { key: "top", label: "Top" },
              { key: "accounts", label: "Accounts" },
              { key: "tags", label: "Tags" },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex-1 py-2 rounded-full text-[12px] font-bold transition"
                style={tab === t.key
                  ? { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 4px 12px rgba(11, 63, 217, 0.3)" }
                  : { background: "#FFFFFF", color: "#4A5878", border: "1px solid #E6ECF5" }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative z-10 px-3 pb-10">
        <div className="pt-4"><MusicLibraryCard onOpen={onOpenMusicLibrary} /></div>
        {!q ? (
          <IdleView
            topCreators={topCreators}
            topLikedDrops={topLikedDrops}
          />
        ) : (
          <div className="pt-3">
            {tab === "top" && (
              <div className="space-y-4">
                {filteredAccounts.slice(0, 3).length > 0 && (
                  <Section title="People" icon={<Sparkles className="w-3.5 h-3.5" />}>
                    {filteredAccounts.slice(0, 3).map(u => <AccountRow key={u.email} u={u} />)}
                  </Section>
                )}
                {filteredTags.slice(0, 3).length > 0 && (
                  <Section title="Hashtags" icon={<TrendingUp className="w-3.5 h-3.5" />}>
                    {filteredTags.slice(0, 3).map(t => <TagRow key={t.tag} t={t} />)}
                  </Section>
                )}
                {filteredDrops.length > 0 && (
                  <Section title="Drops" icon={<Heart className="w-3.5 h-3.5" />}>
                    <DropGrid drops={filteredDrops.slice(0, 30)} />
                  </Section>
                )}
                {filteredAccounts.length === 0 && filteredTags.length === 0 && filteredDrops.length === 0 && (
                  <EmptyState q={search} />
                )}
              </div>
            )}

            {tab === "accounts" && (
              <div className="space-y-1 pt-1">
                {filteredAccounts.length === 0 ? <EmptyState q={search} type="accounts" /> : filteredAccounts.map(u => <AccountRow key={u.email} u={u} />)}
              </div>
            )}

            {tab === "tags" && (
              <div className="space-y-1 pt-1">
                {filteredTags.length === 0 ? <EmptyState q={search} type="tags" /> : filteredTags.map(t => <TagRow key={t.tag} t={t} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function IdleView({ topCreators, topLikedDrops }) {
  return (
    <div className="pt-5 space-y-6">
      {/* Top Creators — branded horizontal scroll */}
      {topCreators.length > 0 && (
        <div>
          <SectionHeader title="Top Glow Creators" icon={<Flame className="w-3.5 h-3.5" />} accent="#0B3FD9" />
          <div className="relative -mx-3 px-3">
            <div className="flex gap-2.5 overflow-x-auto md-hide-scrollbar pb-2 snap-x snap-mandatory">
              {topCreators.map((c, i) => (
                <Link
                  key={c.email}
                  to={createPageUrl("Profile") + `?user=${encodeURIComponent(c.email)}`}
                  className="shrink-0 snap-start no-underline relative overflow-hidden rounded-2xl p-3 flex flex-col items-center gap-2 transition active:scale-[0.97]"
                  style={{
                    width: 112,
                    background: i === 0
                      ? "linear-gradient(145deg, #0B3FD9 0%, #1FB8FF 100%)"
                      : "linear-gradient(145deg, #FFFFFF 0%, #F4F7FE 100%)",
                    border: i === 0 ? "none" : "1px solid #E0EAF5",
                    boxShadow: i === 0
                      ? "0 8px 20px rgba(11, 63, 217, 0.3)"
                      : "0 4px 14px rgba(11, 63, 217, 0.06)",
                  }}
                >
                  {/* Gold accent glow for #1 */}
                  {i === 0 && (
                    <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full blur-xl" style={{ background: "#FFD000", opacity: 0.5 }} />
                  )}

                  <div className="relative">
                    <div className="w-14 h-14 rounded-full p-[2px]" style={{ background: i === 0 ? "linear-gradient(135deg, #FFD000, #FF9F1A)" : "linear-gradient(135deg, #1FB8FF, #0B3FD9)" }}>
                      <div className="w-full h-full rounded-full overflow-hidden" style={{ background: "#FFFFFF", border: "2px solid #FFFFFF" }}>
                        <img src={c.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
                      </div>
                    </div>
                    {i < 3 && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: "#FFFFFF", boxShadow: "0 2px 6px rgba(0,0,0,0.18)" }}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                      </div>
                    )}
                  </div>

                  <div className="relative text-[11px] font-black text-center truncate w-full font-['Space_Grotesk']" style={{ color: i === 0 ? "#FFFFFF" : "#0B1B3D" }}>
                    {getDisplayName(c)?.split(" ")[0]}
                  </div>
                  <div className="relative flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: i === 0 ? "rgba(255,255,255,0.22)" : "#EEF3FF" }}>
                    <Heart className="w-2.5 h-2.5 fill-red-400 text-red-400" />
                    <span className="text-[9px] font-black" style={{ color: i === 0 ? "#FFFFFF" : "#0B3FD9" }}>{c.likes}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Featured Drops grid */}
      <div>
        <SectionHeader title="Top Drops" icon={<Sparkles className="w-3.5 h-3.5" />} accent="#0B3FD9" />
        <DropGrid drops={topLikedDrops} />
      </div>
    </div>
  );
}

function SectionHeader({ title, icon, accent }) {
  return (
    <div className="flex items-center gap-2 mb-2.5 px-1">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${accent}15`, color: accent }}>
        {icon}
      </div>
      <h2 className="text-[11px] font-black uppercase tracking-[0.15em]" style={{ color: accent }}>{title}</h2>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, #E6ECF5, transparent)" }} />
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div>
      <SectionHeader title={title} icon={icon} accent="#0B3FD9" />
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function DropGrid({ drops }) {
  if (!drops || drops.length === 0) {
    return (
      <div className="py-12 text-center rounded-2xl" style={{ background: "#FFFFFF", border: "1px dashed #D6E4FF", color: "#8A97B5" }}>
        <p className="text-sm">No drops yet.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {drops.map(drop => {
        const hasMedia = !!drop.media_url;
        const isKeepIt100 = !hasMedia && (drop.category === "Keep It 100" || /keepit100/i.test(drop.hashtags || ""));
        const isCodeOfTruth = !hasMedia && drop.category === "Code of Truth";
        const text = (drop.verse || drop.reflection || "").replace(/^(\[Reposted from .+?\]\s*)+/i, "").trim();
        return (
          <Link
            key={drop.id}
            to={createPageUrl("Post") + `?id=${encodeURIComponent(drop.id)}&user=${encodeURIComponent(drop.user_email)}`}
            className="relative aspect-[4/5] block overflow-hidden rounded-2xl group"
            style={{
              background: hasMedia ? "#0B1B3D" : "#070B18",
              border: "1px solid #E6ECF5",
              boxShadow: "0 4px 14px rgba(11, 63, 217, 0.08)",
            }}
          >
            {hasMedia ? (
              <>
                <img src={drop.media_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/20" />
              </>
            ) : isKeepIt100 ? (
              <KeepIt100Poster text={drop.reflection} verse={drop.verse} className="absolute inset-0 w-full h-full" />
            ) : isCodeOfTruth ? (
              <CodesOfTruthPoster text={drop.reflection} verse={drop.verse} className="absolute inset-0 w-full h-full" />
            ) : (
              <>
                <img src={PROFILE_POST_BG} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" style={{ filter: "grayscale(100%) contrast(1.08) brightness(0.5)" }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(8,12,28,0.45) 0%, rgba(8,12,28,0.20) 40%, rgba(8,12,28,0.92) 100%)" }} />
                <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 25%, rgba(8,12,28,0.65) 100%)" }} />
                <div className="relative z-10 w-full h-full flex items-center justify-center p-4 text-center">
                  <span className="text-[12px] font-black line-clamp-6 leading-tight font-['Space_Grotesk'] text-white drop-shadow-md">
                    {text}
                  </span>
                </div>
              </>
            )}
            {(drop.likes_count || 0) > 0 && (
              <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-md" style={{ background: "rgba(255,255,255,0.92)" }}>
                <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                <span className="text-[10px] font-black" style={{ color: "#0B1B3D" }}>{drop.likes_count}</span>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}

function AccountRow({ u }) {
  return (
    <Link
      to={createPageUrl("Profile") + `?user=${encodeURIComponent(u.email)}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-2xl no-underline active:scale-[0.98] transition"
      style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.04)" }}
    >
      <div className="w-11 h-11 rounded-full p-[2px] shrink-0" style={{ background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)" }}>
        <div className="w-full h-full rounded-full overflow-hidden" style={{ background: "#FFFFFF", border: "2px solid #FFFFFF" }}>
          <img src={u.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold truncate" style={{ color: "#0B1B3D" }}>{getDisplayName(u)}</div>
        <div className="text-xs truncate" style={{ color: "#6B7FA0" }}>
          {u.country || "LightMode Member"}
        </div>
      </div>
      <div className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "#EEF3FF", color: "#0B3FD9" }}>View</div>
    </Link>
  );
}

function TagRow({ t }) {
  return (
    <Link
      to={createPageUrl("Feed") + `?tag=${encodeURIComponent(t.tag)}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-2xl no-underline active:scale-[0.98] transition"
      style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 2px 8px rgba(11, 63, 217, 0.04)" }}
    >
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #FFD000, #FF9F1A)", color: "#0B1B3D" }}>
        <span className="text-xl font-black">#</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold truncate" style={{ color: "#0B1B3D" }}>{t.tag}</div>
        <div className="text-xs" style={{ color: "#6B7FA0" }}>{t.count} post{t.count === 1 ? "" : "s"}</div>
      </div>
      <TrendingUp className="w-4 h-4" style={{ color: "#CC7A00" }} />
    </Link>
  );
}

function EmptyState({ q, type }) {
  return (
    <div className="py-16 text-center rounded-2xl" style={{ background: "#FFFFFF", border: "1px dashed #D6E4FF" }}>
      <div className="text-3xl mb-2">✨</div>
      <div className="text-sm font-bold mb-1" style={{ color: "#0B1B3D" }}>
        No {type || "results"} for "{q}"
      </div>
      <div className="text-xs" style={{ color: "#8A97B5" }}>Try a different search.</div>
    </div>
  );
}