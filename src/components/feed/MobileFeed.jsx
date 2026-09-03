import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Bell, Plus, Sparkles, Flame, Zap, Search, X, LayoutGrid, Users, Heart, BookOpen, Megaphone, HandHeart, Radio, Trophy, ChevronRight, TrendingUp, UserPlus } from "lucide-react";
import CountryFlag from "@/components/common/CountryFlag";
import MobileFeedDropList from "@/components/feed/MobileFeedDropList";
import MobileDropCardSkeleton from "@/components/feed/MobileDropCardSkeleton";
import PullToRefreshIndicator from "@/components/mobile/PullToRefreshIndicator";
import UserAvatar from "@/components/common/UserAvatar";
import { getDisplayName } from "@/lib/displayName";

/**
 * Mobile-only Feed shell — LightMode brand (dark navy + gold).
 *
 * Layout follows the patterns Mobbin documents for social feeds on iOS:
 *  - compact glass top bar (logo + 2–3 icon actions, unread dot on Bell)
 *  - greeting hero with a single accent colour (gold) on a dark canvas
 *  - compose prompt as a filled card, one primary action
 *  - stories row with gradient rings, "Your Story" first
 *  - filled filter chips with leading icons; selected chip uses the accent colour
 *  - image-filled post cards (see MobileDropCard)
 *
 * All mutations/state come from parent (Feed.jsx). Props are unchanged.
 */

const LOGO_GOLD = "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png";

export const MF = {
  canvas: "#0B0F1A",
  surface: "#121A2B",
  surface2: "#18223A",
  line: "rgba(255,255,255,0.08)",
  text: "#F4F7FB",
  muted: "#8A9BB0",
  gold: "#FFD000",
  orange: "#FF9F1A",
  cyan: "#00CFFF",
  violet: "#8A5CFF",
  goldGrad: "linear-gradient(135deg, #FFD000 0%, #FF9F1A 100%)",
  ringGrad: "linear-gradient(135deg, #FFD000 0%, #FF9F1A 45%, #00CFFF 100%)",
};

const FILTERS = [
  { key: "All", icon: LayoutGrid },
  { key: "Following", icon: Users },
  { key: "Most Liked", icon: Heart },
  { key: "Devotional", icon: BookOpen },
  { key: "Testimony", icon: Megaphone },
];

const QUICK_ACTIONS = [
  { key: "daily", label: "Daily Drops", icon: Flame, page: "DailyTruthFeed", tint: "#FF9F1A" },
  { key: "prayer", label: "Prayer Wall", icon: HandHeart, page: "PrayerWall", tint: "#FFD000" },
  { key: "live", label: "Live", icon: Radio, page: "Live", tint: "#00CFFF" },
  { key: "challenges", label: "Challenges", icon: Trophy, page: "Challenges", tint: "#8A5CFF" },
];

function SuggestedPeopleRail({ people, user, following, followMutation }) {
  const candidates = people.filter(u => u.id && u.id !== user?.id && !following.some(f => f.following_id === u.id || f.following_email === u.email));
  if (candidates.length === 0) return null;
  return (
    <section className="rounded-[22px] py-4" style={{ background: MF.surface, border: `1px solid ${MF.line}` }} aria-label="People to connect">
      <div className="flex items-center justify-between mb-3 px-4">
        <div className="flex items-center gap-1.5">
          <UserPlus className="w-3.5 h-3.5" style={{ color: MF.gold }} />
          <h3 className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: MF.text }}>People to connect</h3>
        </div>
        <Link to={createPageUrl("Discover")} className="flex items-center gap-0.5 text-[11px] font-bold no-underline" style={{ color: MF.muted }}>
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
              className="mt-2.5 h-8 w-full rounded-full text-[11px] font-black active:scale-95 transition disabled:opacity-60"
              style={{ background: MF.gold, color: MF.canvas }}
            >
              Connect
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function IconAction({ to, label, children, dot = false }) {
  return (
    <Link
      to={to}
      aria-label={label}
      title={label}
      className="relative w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
      style={{ background: "rgba(255,255,255,0.06)", color: MF.text, border: `1px solid ${MF.line}` }}
    >
      {children}
      {dot && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: MF.gold, boxShadow: `0 0 0 2px ${MF.canvas}, 0 0 10px ${MF.gold}` }} />
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
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user ? (getDisplayName(user).split(" ")[0] || "Friend") : "Friend";
  const [searchOpen, setSearchOpen] = React.useState(Boolean(searchQuery));
  const liveStories = Array.isArray(stories) ? stories : [];

  return (
    <div className="relative min-h-full font-['Inter']" style={{ background: MF.canvas, color: MF.text, overflowX: "clip" }}>
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} threshold={pullThreshold} />
      <style>{`
        .mf-hide-sb::-webkit-scrollbar { display: none; }
        .mf-hide-sb { scrollbar-width: none; }
        @keyframes mf-pulse-dot { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.5); opacity: .55 } }
      `}</style>

      {/* TOP BAR — compact glass, logo left, icon actions right */}
      <div
        className="sticky top-0 z-40 safe-pt px-4"
        style={{ background: "rgba(11,15,26,0.86)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderBottom: `1px solid ${MF.line}` }}
      >
        <div className="flex items-center gap-2 h-14">
          {searchOpen ? (
            <div className="flex-1 flex items-center gap-2 h-10 px-3 rounded-full" style={{ background: MF.surface, border: `1px solid ${MF.line}` }}>
              <Search className="w-4 h-4 shrink-0" style={{ color: MF.muted }} />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => onSearch?.(e.target.value)}
                placeholder="Search people, verses, drops"
                className="flex-1 min-w-0 bg-transparent outline-none text-[14px] placeholder:text-[#5C6B82]"
                style={{ color: MF.text }}
              />
              <button
                type="button"
                aria-label="Close search"
                onClick={() => { onSearch?.(""); setSearchOpen(false); }}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.08)", color: MF.text }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <Link to={createPageUrl("Home")} className="shrink-0 flex items-center" aria-label="Generation LightMode home">
                <img src={LOGO_GOLD} alt="Generation LightMode" className="h-7 w-auto object-contain" />
              </Link>
              <div className="flex-1" />
              <button
                type="button"
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
                style={{ background: "rgba(255,255,255,0.06)", color: MF.text, border: `1px solid ${MF.line}` }}
              >
                <Search className="w-[18px] h-[18px]" />
              </button>
              <IconAction to={createPageUrl("DailyTruthFeed")} label="Daily Truth"><Flame className="w-[18px] h-[18px]" /></IconAction>
              <IconAction to={createPageUrl("Notifications")} label="Notifications" dot={notifications?.length > 0}><Bell className="w-[18px] h-[18px]" /></IconAction>
            </>
          )}
        </div>
      </div>

      {/* HERO — greeting, single gold accent */}
      <div className="relative px-4 pt-5 pb-4">
        <div className="relative">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: MF.muted }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: MF.gold, animation: "mf-pulse-dot 2.2s ease-in-out infinite" }} />
            {greeting}
          </div>
          <h1 className="mt-1 text-[28px] leading-[1.1] font-black font-['Space_Grotesk'] truncate" style={{ color: MF.text }}>
            Hey, <span style={{ background: MF.goldGrad, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{firstName}</span>
            <Zap className="inline-block w-5 h-5 ml-1.5 -mt-1" style={{ color: MF.gold, fill: MF.gold }} />
          </h1>
          <p className="mt-1 text-[14px] font-medium" style={{ color: MF.muted }}>Your light is needed today.</p>
        </div>
      </div>

      {/* COMPOSE PROMPT — filled card, one primary action */}
      <div className="px-4 mb-5">
        <button
          type="button"
          onClick={onOpenDropModal}
          className="w-full rounded-[22px] p-2.5 pl-3 flex items-center gap-3 active:scale-[0.99] transition text-left"
          style={{ background: MF.surface, border: `1px solid ${MF.line}`, boxShadow: "0 12px 32px rgba(0,0,0,0.35)" }}
        >
          <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden" style={{ border: `2px solid ${MF.surface2}` }}>
            <UserAvatar user={user} className="w-full h-full" />
          </div>
          <div className="flex-1 min-w-0 text-[14px] font-semibold truncate" style={{ color: MF.muted }}>
            {isGuest ? "Sign in to share your light…" : `Share a light drop, ${firstName}…`}
          </div>
          <div
            className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: MF.goldGrad, color: MF.canvas, boxShadow: "0 8px 20px rgba(255,208,0,0.35)" }}
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
          </div>
        </button>
      </div>

      {/* QUICK ACTIONS — round icon + label row (pattern: Depop / Zip "top brands" rows on Mobbin) */}
      <div className="px-4 mb-5">
        <div className="grid grid-cols-4 gap-2">
          {QUICK_ACTIONS.map(({ key, label, icon: Icon, page, tint }) => (
            <Link
              key={key}
              to={createPageUrl(page)}
              className="flex flex-col items-center gap-1.5 py-2.5 rounded-2xl active:scale-95 transition no-underline"
              style={{ background: MF.surface, border: `1px solid ${MF.line}` }}
            >
              <span className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${tint}1F`, color: tint }}>
                <Icon className="w-[18px] h-[18px]" strokeWidth={2.25} />
              </span>
              <span className="text-[11px] font-bold" style={{ color: MF.text }}>{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* TRENDING — horizontal rail with heading + chevron (pattern: Tubi "Recommended" rail on Mobbin) */}
      {trendingTopics.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2.5 px-4">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: MF.cyan }} />
              <h3 className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: MF.text }}>Trending vibes</h3>
            </div>
            <button type="button" onClick={() => onOpenTopic?.(trendingTopics[0].tag)} className="flex items-center gap-0.5 text-[11px] font-bold" style={{ color: MF.muted }} aria-label="See trending drops">
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto mf-hide-sb px-4 pb-1">
            {trendingTopics.map((topic, idx) => (
              <button
                key={topic.tag}
                type="button"
                onClick={() => onOpenTopic?.(topic.tag)}
                className="shrink-0 h-10 pl-1.5 pr-3.5 rounded-full inline-flex items-center gap-2 active:scale-95 transition"
                style={{ background: MF.surface, border: `1px solid ${MF.line}` }}
              >
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black" style={idx === 0 ? { background: MF.goldGrad, color: MF.canvas } : { background: MF.surface2, color: MF.cyan }}>{idx + 1}</span>
                <span className="text-[12.5px] font-bold" style={{ color: MF.cyan }}>{topic.tag}</span>
                <span className="text-[11px] font-semibold" style={{ color: MF.muted }}>{topic.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STORIES */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3 px-4">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" style={{ color: MF.gold }} />
            <h3 className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: MF.text }}>Statuses</h3>
          </div>
          <span className="text-[11px] font-bold" style={{ color: MF.muted }}>{liveStories.length} live</span>
        </div>
        <div className="flex gap-3.5 overflow-x-auto mf-hide-sb px-4 pb-1">
          {/* Add status */}
          <button type="button" onClick={onOpenStatusComposer} className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition">
            <div className="relative w-[68px] h-[68px] rounded-full p-[2px]" style={{ background: "rgba(255,255,255,0.10)" }}>
              <div className="w-full h-full rounded-full overflow-hidden" style={{ background: MF.surface, border: `3px solid ${MF.canvas}` }}>
                <UserAvatar user={user} className="w-full h-full" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: MF.gold, border: `2.5px solid ${MF.canvas}` }}>
                <Plus className="w-3.5 h-3.5" style={{ color: MF.canvas }} strokeWidth={3} />
              </div>
            </div>
            <span className="text-[10px] font-bold" style={{ color: MF.text }}>Your Story</span>
          </button>

          {liveStories.slice(0, 10).map(story => {
            const storyUser = getUserInfo(story.user_email);
            const theme = story.background_theme === "violet" ? "linear-gradient(135deg,#8A5CFF,#3B1E70)"
              : story.background_theme === "sunrise" ? "linear-gradient(135deg,#FFD60A,#F97316)"
              : story.background_theme === "midnight" ? "linear-gradient(135deg,#1F2A44,#0B0F1A)"
              : "linear-gradient(135deg,#00CFFF,#1DA1FF)";
            const isMine = storyUser?.email === user?.email;
            return (
              <button key={story.id} type="button" onClick={() => onOpenStatus(story)} className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition">
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
                <span className="text-[10px] font-bold truncate w-[68px] text-center" style={{ color: isMine ? MF.gold : MF.text }}>
                  {isMine ? "You" : getDisplayName(storyUser).split(" ")[0] || "User"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTER CHIPS — filled, leading icon, gold selected state; sticky under the top bar */}
      <div
        className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-30 py-2.5 mb-2"
        style={{ background: "rgba(11,15,26,0.92)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderBottom: `1px solid ${MF.line}` }}
      >
        <div className="flex items-center gap-2 overflow-x-auto mf-hide-sb px-4" role="tablist" aria-label="Feed filters">
          {FILTERS.map(({ key, icon: Icon }) => {
            const isActive = activeFilter === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onFilterChange(key)}
                className="h-9 pl-3 pr-3.5 rounded-full inline-flex items-center gap-1.5 text-[12px] font-bold whitespace-nowrap transition active:scale-95"
                style={isActive
                  ? { background: MF.gold, color: MF.canvas, boxShadow: "0 6px 18px rgba(255,208,0,0.30)" }
                  : { background: MF.surface, color: MF.text, border: `1px solid ${MF.line}` }}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={2.5} style={isActive && key === "Most Liked" ? { fill: MF.canvas } : undefined} />
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
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(255,208,0,0.12)", color: MF.gold }}>
              <Zap className="w-5 h-5" />
            </div>
            <p className="text-[15px] font-black font-['Space_Grotesk']" style={{ color: MF.text }}>Feed took a breath</p>
            <p className="text-[13px] mt-1" style={{ color: MF.muted }}>We couldn't load new drops just now.</p>
            <button type="button" onClick={onRefetch} className="mt-4 h-11 px-6 rounded-full text-[13px] font-black active:scale-95 transition" style={{ background: MF.goldGrad, color: MF.canvas }}>
              Try again
            </button>
          </div>
        ) : filteredDrops.length === 0 ? (
          <div className="py-14 px-6 text-center rounded-[22px] relative overflow-hidden" style={{ background: MF.surface, border: `1px dashed ${MF.line}` }}>
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,208,0,0.25), rgba(255,208,0,0) 70%)" }} />
            <div className="relative">
              <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(255,208,0,0.12)", color: MF.gold }}>
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-[15px] font-black font-['Space_Grotesk']" style={{ color: MF.text }}>No drops here yet</p>
              <p className="text-[13px] mt-1" style={{ color: MF.muted }}>
                {activeFilter === "Following" ? "Follow a few believers to fill this space." : "Be the first to share your light."}
              </p>
              <button type="button" onClick={onOpenDropModal} className="mt-4 h-11 px-6 rounded-full inline-flex items-center gap-2 text-[13px] font-black active:scale-95 transition" style={{ background: MF.goldGrad, color: MF.canvas, boxShadow: "0 8px 22px rgba(255,208,0,0.35)" }}>
                <Zap className="w-4 h-4" style={{ fill: MF.canvas }} /> Share your Drop
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
