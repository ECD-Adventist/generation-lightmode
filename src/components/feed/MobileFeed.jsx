import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Bell, Plus, Sparkles, Flame, Zap, Search, X, LayoutGrid, LayoutDashboard, Users, Heart, BookOpen, Megaphone, HandHeart, Radio, Trophy, ChevronRight, TrendingUp, UserPlus } from "lucide-react";
import CountryFlag from "@/components/common/CountryFlag";
import MobileFeedDropList from "@/components/feed/MobileFeedDropList";
import MobileDropCardSkeleton from "@/components/feed/MobileDropCardSkeleton";
import PullToRefreshIndicator from "@/components/mobile/PullToRefreshIndicator";
import UserAvatar from "@/components/common/UserAvatar";
import { getDisplayName } from "@/lib/displayName";

/**
 * Mobile-only Feed shell — LightMode brand (light canvas + gold).
 *
 * Layout follows the patterns Mobbin documents for social feeds on iOS:
 *  - compact glass top bar (logo + 2–3 icon actions, unread dot on Bell)
 *  - greeting hero with a single accent colour (gold) on a light canvas
 *  - compose prompt as a filled card, one primary action
 *  - stories row with gradient rings, "Your Story" first
 *  - filled filter chips with leading icons; selected chip uses the accent colour
 *  - image-filled post cards (see MobileDropCard)
 *
 * All mutations/state come from parent (Feed.jsx). Props are unchanged.
 */

const LOGO_GOLD = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png";
// Same artwork as the Home hero — used as the background of the feed's top section.
const HERO_IMAGE = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/6a1c1025d_Gemini_Generated_Image_s3fvlrs3fvlrs3fv.png?v=2";

// Light theme — the app keeps "light mode"; the marketing site may use dark.
export const MF = {
  canvas: "#F6F8FC",
  surface: "#FFFFFF",
  surface2: "#EEF3FF",
  line: "#E2EAF5",
  text: "#0B1B3D",
  ink: "#0B1B3D",
  muted: "#6B7FA0",
  gold: "#FFD000",
  goldDeep: "#B88A00",
  orange: "#FF9F1A",
  blue: "#0B3FD9",
  blueDeep: "#0A2E9F",
  blueGrad: "linear-gradient(135deg, #0A2E9F 0%, #0B3FD9 60%, #1563E8 100%)",
  blueGradTab: "linear-gradient(90deg, #1FB8FF 0%, #0B3FD9 100%)",
  cyan: "#0B3FD9",
  violet: "#8A5CFF",
  goldGrad: "linear-gradient(135deg, #FFD000 0%, #FF9F1A 100%)",
  goldTextGrad: "linear-gradient(135deg, #D99A00 0%, #FF9F1A 100%)",
  ringGrad: "linear-gradient(135deg, #FFD000 0%, #FF9F1A 45%, #1FB8FF 100%)",
};

const FILTERS = [
  { key: "All", icon: LayoutGrid },
  { key: "Following", icon: Users },
  { key: "Most Liked", icon: Heart },
  { key: "Devotional", icon: BookOpen },
  { key: "Testimony", icon: Megaphone },
];

const QUICK_ACTIONS = [
  { key: "daily", label: "Daily Drops", icon: Flame, page: "DailyTruthFeed", tint: "#E07B00" },
  { key: "prayer", label: "Prayer Wall", icon: HandHeart, page: "PrayerWall", tint: "#B88A00" },
  { key: "live", label: "Live", icon: Radio, page: "Live", tint: "#0B3FD9" },
  { key: "challenges", label: "Challenges", icon: Trophy, page: "Challenges", tint: "#7A4DE0" },
];

function SuggestedPeopleRail({ people, user, following, followMutation }) {
  const candidates = people.filter(u => u.id && u.id !== user?.id && !following.some(f => f.following_id === u.id || f.following_email === u.email));
  if (candidates.length === 0) return null;
  return (
    <section className="rounded-[22px] py-4" style={{ background: MF.surface, border: `1px solid ${MF.line}` }} aria-label="People to connect">
      <div className="flex items-center justify-between mb-3 px-4">
        <div className="flex items-center gap-1.5">
          <UserPlus className="w-3.5 h-3.5" style={{ color: MF.blue }} />
          <h3 className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: MF.blue }}>People to connect</h3>
        </div>
        <Link to={createPageUrl("Discover")} className="flex items-center gap-0.5 text-[11px] font-bold no-underline" style={{ color: MF.blue }}>
          See all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="flex gap-2.5 overflow-x-auto mf-hide-sb px-4">
        {candidates.slice(0, 8).map(u => (
          <div key={u.id} className="shrink-0 w-[132px] rounded-2xl p-3 flex flex-col items-center text-center" style={{ background: MF.surface2, border: `1px solid ${MF.line}` }}>
            <Link to={createPageUrl("Profile") + `?id=${encodeURIComponent(u.id)}`} className="no-underline flex flex-col items-center">
              <div className="w-14 h-14 rounded-full p-[2px]" style={{ background: MF.ringGrad }}>
                <div className="w-full h-full rounded-full overflow-hidden" style={{ border: `2px solid ${MF.surface2}` }}>
                  <UserAvatar user={u} className="w-full h-full" />
                </div>
              </div>
              <div className="mt-2 w-full text-[12px] font-bold truncate flex items-center justify-center gap-1" style={{ color: MF.text }}>
                <span className="truncate">{getDisplayName(u)}</span>
                <CountryFlag country={u.country} size="xs" />
              </div>
              <div className="text-[10px] truncate w-full" style={{ color: MF.muted }}>{u.country || "Global Believer"}</div>
            </Link>
            <button
              type="button"
              onClick={() => (user ? followMutation?.mutate(u) : null)}
              disabled={followMutation?.isPending}
              className="mf-press mt-2.5 h-8 w-full rounded-full text-[11px] font-black disabled:opacity-60"
              style={{ background: MF.blueGradTab, color: "#FFFFFF", boxShadow: "0 4px 12px rgba(11,63,217,0.28)" }}
            >
              Connect
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Time-of-day greeting in the user's own time zone.
 * Uses the profile's time zone when the account has one, otherwise the device's zone
 * (Intl resolvedOptions), and re-evaluates every minute so a long-lived session never
 * gets stuck on "Good morning".
 */
function useGreeting(user) {
  const compute = React.useCallback(() => {
    const zone = user?.timezone || user?.time_zone || undefined;
    let hour = new Date().getHours();
    try {
      const parts = new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: zone }).formatToParts(new Date());
      const h = Number(parts.find(part => part.type === "hour")?.value);
      if (!Number.isNaN(h)) hour = h % 24;
    } catch { /* unknown zone string → device time */ }
    return hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  }, [user?.timezone, user?.time_zone]);
  const [greeting, setGreeting] = React.useState(compute);
  React.useEffect(() => {
    setGreeting(compute());
    const id = setInterval(() => setGreeting(compute()), 60 * 1000);
    const onVisible = () => { if (document.visibilityState === "visible") setGreeting(compute()); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVisible); };
  }, [compute]);
  return greeting;
}

function IconAction({ to, label, children, dot = false }) {
  return (
    <Link
      to={to}
      aria-label={label}
      title={label}
      className="mf-press relative w-10 h-10 rounded-full flex items-center justify-center"
      style={{ background: "rgba(255,255,255,0.18)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.30)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
    >
      {children}
      {dot && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: MF.gold, boxShadow: "0 0 0 2px rgba(10,46,159,0.7)" }} />
      )}
    </Link>
  );
}

export default function MobileFeed({
  user,
  isGuest = false,
  notifications,
  searchQuery = "",
  onSearch,
  activeFilter,
  onFilterChange,
  stories,
  getUserInfo,
  onOpenStatus,
  onOpenStatusComposer,
  onOpenDropModal,
  trendingTopics = [],
  onOpenTopic,
  suggestedUsers = [],
  filteredDrops,
  displayCount,
  drops,
  likeMutation,
  handleShare,
  userLikes,
  allUsers,
  savedDropRecords,
  isLoading,
  isError,
  onRefetch,
  leaderAccounts = [],
  following = [],
  followMutation,
  hasMore,
  isLoadingMore,
  onLoadMore,
  pullDistance = 0,
  isRefreshing = false,
  pullThreshold = 70,
}) {
  const greeting = useGreeting(user);
  const firstName = user ? (getDisplayName(user).split(" ")[0] || "Friend") : "Friend";
  const liveStories = Array.isArray(stories) ? stories : [];

  // Top bar is transparent over the hero artwork and turns into the same light glass
  // the Explore / Messages / Profile tabs use once the feed scrolls.
  const sentinelRef = React.useRef(null);
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    // The sentinel sits 28px into the hero; once it slides under the 56px bar the bar turns solid.
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), { rootMargin: "-60px 0px 0px 0px", threshold: 0 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative min-h-full font-['Inter']" style={{ background: MF.canvas, color: MF.text, overflowX: "clip" }}>
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} threshold={pullThreshold} />
      <style>{`
        .mf-hide-sb::-webkit-scrollbar { display: none; }
        .mf-hide-sb { scrollbar-width: none; }
        @keyframes mf-pulse-dot { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.5); opacity: .55 } }
        @keyframes mf-pop { 0% { transform: scale(0.92) } 60% { transform: scale(1.04) } 100% { transform: scale(1) } }
        .mf-pop { animation: mf-pop 260ms cubic-bezier(0.22,1,0.36,1); }
        .mf-press { transition: transform 160ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 160ms ease, background-color 160ms ease; -webkit-tap-highlight-color: transparent; }
        .mf-press:active { transform: scale(0.94); }
        @media (prefers-reduced-motion: reduce) { .mf-pop { animation: none; } .mf-press:active { transform: none; } }
      `}</style>

      {/* HERO ARTWORK — starts at the very top of the screen, behind the status bar and the
          navigation bar, treated like the Control Center dashboard (monochrome, navy tint),
          and fades smoothly into the light canvas just above the quick actions. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{ height: "calc(env(safe-area-inset-top, 0px) + 336px)", background: "#0A2E9F", zIndex: 0 }}
      >
        <img
          src={HERO_IMAGE}
          alt=""
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "center 30%", filter: "grayscale(70%) contrast(1.1) brightness(0.95)" }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(10,46,159,0.62) 0%, rgba(11,63,217,0.32) 45%, rgba(11,63,217,0.08) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,46,159,0.66) 0%, rgba(11,63,217,0.38) 40%, rgba(246,248,252,0.30) 66%, rgba(246,248,252,0.90) 84%, #F6F8FC 96%)" }} />
      </div>

      {/* TOP BAR — transparent over the artwork at rest. Once scrolled it carries the very same top
          slice of the artwork (same crop and position as at rest) under the brand-blue wash, so the
          bar reads as a continuation of the hero rather than a flat colour. */}
      <div
        className="sticky top-0 z-40 safe-pt px-4"
        style={scrolled
          ? {
              backgroundImage: `linear-gradient(180deg, rgba(10,46,159,0.78) 0%, rgba(11,63,217,0.86) 100%), url(${HERO_IMAGE})`,
              backgroundSize: "auto, cover",
              backgroundPosition: "center, center 30%",
              backgroundRepeat: "no-repeat",
              borderBottom: "1px solid rgba(255,255,255,0.14)",
              boxShadow: "0 4px 16px rgba(11,63,217,0.22)",
              transition: "box-shadow 220ms ease, border-color 220ms ease",
            }
          : { background: "transparent", borderBottom: "1px solid transparent", transition: "box-shadow 220ms ease, border-color 220ms ease" }}
      >
        <div className="flex items-center gap-2 h-14">
          <Link to={createPageUrl("Home")} className="shrink-0 flex items-center" aria-label="Generation LightMode home">
            <img src={LOGO_GOLD} alt="Generation LightMode" className="h-7 w-auto object-contain" />
          </Link>
          <div className="flex-1" />
          <IconAction to={createPageUrl("Dashboard")} label="Dashboard"><LayoutDashboard className="w-[18px] h-[18px]" /></IconAction>
          <IconAction to={createPageUrl("Notifications")} label="Notifications" dot={notifications?.length > 0}><Bell className="w-[18px] h-[18px]" /></IconAction>
        </div>
      </div>

      {/* HERO — greeting over the artwork */}
      <div className="relative px-4 pt-7 pb-14">
        <div ref={sentinelRef} aria-hidden="true" className="absolute top-7 left-0 w-px h-px" />
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.82)" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: MF.gold, animation: "mf-pulse-dot 2.2s ease-in-out infinite" }} />
          {greeting}
        </div>
        <h1 className="mt-1 text-[28px] leading-[1.1] font-black font-['Space_Grotesk'] truncate" style={{ color: "#FFFFFF", textShadow: "0 2px 14px rgba(10,46,159,0.55)" }}>
          Hey, <span style={{ color: MF.gold }}>{firstName}</span>
          <Zap className="inline-block w-5 h-5 ml-1.5 -mt-1" style={{ color: MF.gold, fill: MF.gold }} />
        </h1>
        <p className="mt-1 text-[14px] font-semibold" style={{ color: "rgba(255,255,255,0.88)", textShadow: "0 1px 10px rgba(10,46,159,0.55)" }}>Your light is needed today.</p>
      </div>

      {/* COMPOSE PROMPT — sits on the fade between artwork and canvas */}
      <div className="px-4 -mt-6 relative z-10 mb-5">
        <button
          type="button"
          onClick={onOpenDropModal}
          className="mf-press w-full rounded-[22px] p-2.5 pl-3 flex items-center gap-3 text-left"
          style={{ background: MF.surface, border: `1px solid ${MF.line}`, boxShadow: "0 12px 32px rgba(11,63,217,0.16)" }}
        >
          <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden" style={{ border: `2px solid ${MF.surface2}` }}>
            <UserAvatar user={user} className="w-full h-full" />
          </div>
          <div className="flex-1 min-w-0 text-[14px] font-semibold truncate" style={{ color: MF.muted }}>
            {isGuest ? "Sign in to share your light…" : `Share a light drop, ${firstName}…`}
          </div>
          <div
            className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: MF.goldGrad, color: MF.ink, boxShadow: "0 8px 20px rgba(255,159,26,0.35)" }}
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
          </div>
        </button>
      </div>

      {/* QUICK ACTIONS — round icon + label row (pattern: Depop / Zip "top brands" rows on Mobbin) */}
      <div className="relative z-[1] px-4 mb-5">
        <div className="grid grid-cols-4 gap-2">
          {QUICK_ACTIONS.map(({ key, label, icon: Icon, page, tint }) => (
            <Link
              key={key}
              to={createPageUrl(page)}
              className="mf-press flex flex-col items-center gap-1.5 py-2.5 rounded-2xl no-underline"
              style={{ background: MF.surface, border: `1px solid ${MF.line}`, boxShadow: "0 2px 8px rgba(11,63,217,0.05)" }}
            >
              <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${tint}1F`, color: tint }}>
                <Icon className="w-[18px] h-[18px]" strokeWidth={2.25} />
              </span>
              <span className="text-[11px] font-bold" style={{ color: MF.blueDeep }}>{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* TRENDING — horizontal rail with heading + chevron (pattern: Tubi "Recommended" rail on Mobbin) */}
      {trendingTopics.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2.5 px-4">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: MF.blue }} />
              <h3 className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: MF.blue }}>Trending vibes</h3>
            </div>
            <button type="button" onClick={() => onOpenTopic?.(trendingTopics[0].tag)} className="flex items-center gap-0.5 text-[11px] font-bold" style={{ color: MF.blue }} aria-label="See trending drops">
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto mf-hide-sb px-4 pb-1">
            {trendingTopics.map((topic, idx) => (
              <button
                key={topic.tag}
                type="button"
                onClick={() => onOpenTopic?.(topic.tag)}
                className="mf-press shrink-0 h-10 pl-1.5 pr-3.5 rounded-full inline-flex items-center gap-2"
                style={{ background: MF.surface, border: "1px solid #D6E4FF" }}
              >
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black" style={idx === 0 ? { background: MF.blueGradTab, color: "#FFFFFF" } : { background: "rgba(31,184,255,0.10)", color: MF.blue }}>{idx + 1}</span>
                <span className="text-[12.5px] font-bold" style={{ color: MF.cyan }}>{topic.tag}</span>
                <span className="text-[11px] font-semibold" style={{ color: MF.muted }}>{topic.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STORIES — no heading; the ring row is self-explanatory and the space stays free */}
      <div className="mb-4">
        <div className="flex gap-3.5 overflow-x-auto mf-hide-sb px-4 pb-1">
          {/* Add status */}
          <button type="button" onClick={onOpenStatusComposer} className="mf-press flex flex-col items-center gap-1.5 shrink-0">
            <div className="relative w-[68px] h-[68px] rounded-full p-[2px]" style={{ background: "#D6E4FF" }}>
              <div className="w-full h-full rounded-full overflow-hidden" style={{ background: MF.surface, border: `3px solid ${MF.canvas}` }}>
                <UserAvatar user={user} className="w-full h-full" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: MF.gold, border: `2.5px solid ${MF.canvas}` }}>
                <Plus className="w-3.5 h-3.5" style={{ color: MF.ink }} strokeWidth={3} />
              </div>
            </div>
            <span className="text-[10px] font-bold" style={{ color: MF.blue }}>Your Story</span>
          </button>

          {liveStories.slice(0, 10).map(story => {
            const storyUser = getUserInfo(story.user_email);
            const theme = story.background_theme === "violet" ? "linear-gradient(135deg,#8A5CFF,#3B1E70)"
              : story.background_theme === "sunrise" ? "linear-gradient(135deg,#FFD60A,#F97316)"
              : story.background_theme === "midnight" ? "linear-gradient(135deg,#1F2A44,#0B0F1A)"
              : "linear-gradient(135deg,#00CFFF,#1DA1FF)";
            const isMine = storyUser?.email === user?.email;
            return (
              <button key={story.id} type="button" onClick={() => onOpenStatus(story)} className="mf-press flex flex-col items-center gap-1.5 shrink-0">
                <div className="relative w-[68px] h-[68px] rounded-full p-[2px]" style={{ background: MF.ringGrad }}>
                  <div className="w-full h-full rounded-full overflow-hidden" style={{ background: MF.surface, border: `3px solid ${MF.canvas}` }}>
                    {story.story_type === "image" && story.media_url ? (
                      <img src={story.media_url} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-black text-lg" style={{ background: theme }}>Aa</div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full overflow-hidden" style={{ border: `2.5px solid ${MF.canvas}`, background: MF.surface }}>
                    <UserAvatar user={storyUser} className="w-full h-full" />
                  </div>
                </div>
                <span className="text-[10px] font-bold truncate w-[68px] text-center" style={{ color: isMine ? MF.goldDeep : MF.text }}>
                  {isMine ? "You" : getDisplayName(storyUser).split(" ")[0] || "User"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE SEARCH — set from a trending chip; search itself lives on the Explore tab */}
      {searchQuery && (
        <div className="px-4 mb-2">
          <div className="inline-flex items-center gap-2 h-9 pl-3 pr-1.5 rounded-full" style={{ background: "rgba(31,184,255,0.08)", border: "1px solid #B8E5FF" }}>
            <Search className="w-3.5 h-3.5" style={{ color: MF.blue }} />
            <span className="text-[12px] font-bold" style={{ color: MF.blue }}>{searchQuery}</span>
            <button type="button" aria-label="Clear search" onClick={() => onSearch?.("")} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#FFFFFF", color: MF.blue, border: "1px solid #B8E5FF" }}>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* FILTER CHIPS — segmented pills with an icon well; the selected pill pops in with the brand
          gradient. Sticky under the top bar. */}
      <div
        className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-30 py-2.5 mb-2"
        style={{ background: "rgba(246,248,252,0.94)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderBottom: `1px solid ${MF.line}` }}
      >
        <div className="flex items-center gap-2 overflow-x-auto mf-hide-sb px-4 py-0.5" role="tablist" aria-label="Feed filters">
          {FILTERS.map(({ key, icon: Icon }) => {
            const isActive = activeFilter === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onFilterChange(key)}
                className={`mf-press h-10 pl-1.5 pr-4 rounded-full inline-flex items-center gap-2 text-[13px] font-bold whitespace-nowrap ${isActive ? "mf-pop" : ""}`}
                style={isActive
                  ? { background: MF.blueGradTab, color: "#FFFFFF", boxShadow: "0 6px 16px rgba(11,63,217,0.32)", border: "1px solid transparent" }
                  : { background: MF.surface, color: MF.blue, border: "1px solid #D6E4FF", boxShadow: "0 1px 3px rgba(11,63,217,0.06)" }}
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={isActive ? { background: "rgba(255,255,255,0.22)" } : { background: "rgba(31,184,255,0.12)" }}
                >
                  <Icon className="w-[15px] h-[15px]" strokeWidth={2.5} style={isActive && key === "Most Liked" ? { fill: "#FFFFFF" } : undefined} />
                </span>
                {key}
              </button>
            );
          })}
        </div>
      </div>

      {/* FEED */}
      <div className="px-3 pb-28 pt-2 space-y-4">
        {isLoading && drops.length === 0 ? (
          <>
            <MobileDropCardSkeleton />
            <MobileDropCardSkeleton />
            <MobileDropCardSkeleton />
          </>
        ) : isError && filteredDrops.length === 0 ? (
          <div className="py-14 px-6 text-center rounded-[22px]" style={{ background: MF.surface, border: `1px dashed ${MF.line}` }}>
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(255,208,0,0.18)", color: MF.goldDeep }}>
              <Zap className="w-5 h-5" />
            </div>
            <p className="text-[15px] font-black font-['Space_Grotesk']" style={{ color: MF.text }}>Feed took a breath</p>
            <p className="text-[13px] mt-1" style={{ color: MF.muted }}>We couldn't load new drops just now.</p>
            <button type="button" onClick={onRefetch} className="mf-press mt-4 h-11 px-6 rounded-full text-[13px] font-black" style={{ background: MF.goldGrad, color: MF.ink }}>
              Try again
            </button>
          </div>
        ) : filteredDrops.length === 0 ? (
          <div className="py-14 px-6 text-center rounded-[22px] relative overflow-hidden" style={{ background: MF.surface, border: `1px dashed ${MF.line}` }}>
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,208,0,0.25), rgba(255,208,0,0) 70%)" }} />
            <div className="relative">
              <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(255,208,0,0.18)", color: MF.goldDeep }}>
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-[15px] font-black font-['Space_Grotesk']" style={{ color: MF.text }}>No drops here yet</p>
              <p className="text-[13px] mt-1" style={{ color: MF.muted }}>
                {activeFilter === "Following" ? "Follow a few believers to fill this space." : "Be the first to share your light."}
              </p>
              <button type="button" onClick={onOpenDropModal} className="mf-press mt-4 h-11 px-6 rounded-full inline-flex items-center gap-2 text-[13px] font-black" style={{ background: MF.goldGrad, color: MF.ink, boxShadow: "0 8px 22px rgba(255,208,0,0.35)" }}>
                <Zap className="w-4 h-4" style={{ fill: MF.ink }} /> Share your Drop
              </button>
            </div>
          </div>
        ) : (
          <MobileFeedDropList
            drops={filteredDrops}
            displayCount={displayCount}
            getUserInfo={getUserInfo}
            user={user}
            likeMutation={likeMutation}
            handleShare={handleShare}
            userLikes={userLikes}
            savedDropRecords={savedDropRecords}
            leaderAccounts={leaderAccounts}
            following={following}
            followMutation={followMutation}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={onLoadMore}
            footerClassName="pt-5 pb-2 text-center text-[11px] font-black uppercase tracking-wider"
            footerStyle={{ color: MF.muted }}
            midFeedSlot={<SuggestedPeopleRail people={suggestedUsers} user={user} following={following} followMutation={followMutation} />}
            midFeedIndex={2}
          />
        )}
      </div>
    </div>
  );
}
