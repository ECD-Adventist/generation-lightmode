import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Bell, Plus, Sparkles, Flame, Zap } from "lucide-react";
import MobileFeedDropList from "@/components/feed/MobileFeedDropList";
import MobileDropCardSkeleton from "@/components/feed/MobileDropCardSkeleton";
import PullToRefreshIndicator from "@/components/mobile/PullToRefreshIndicator";

/**
 * Mobile-only Feed shell — LightMode branded (premium redesign).
 * Renders hero, compose prompt, stories row, filter pills, and the drops list.
 * All mutations/state come from parent (Feed.jsx).
 */
export default function MobileFeed({
  user,
  notifications,
  activeFilter,
  onFilterChange,
  stories,
  getUserInfo,
  onOpenStatus,
  onOpenStatusComposer,
  onOpenDropModal,
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
  const filters = ["All", "Following", "Most Liked", "Devotional", "Testimony"];
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";
  const firstName = (user?.display_name || user?.full_name || "Friend").split(" ")[0] || "Friend";

  return (
    <div className="min-h-full font-['Inter']" style={{ background: "linear-gradient(180deg, #F6F8FC 0%, #EEF3FF 40%, #E2EBFF 100%)", color: "#0B1B3D" }}>
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} threshold={pullThreshold} />
      <style>{`
        @keyframes mf-float { 0%,100% { transform: translateY(0) scale(1); opacity: 0.22 } 50% { transform: translateY(-18px) scale(1.08); opacity: 0.42 } }
        @keyframes mf-shimmer {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(260%) skewX(-20deg); }
        }
        @keyframes mf-pulse-dot { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.4); opacity: 0.6 } }
        .mf-hide-sb::-webkit-scrollbar { display: none; }
        .mf-hide-sb { scrollbar-width: none; }
      `}</style>

      {/* HERO HEADER — extends under the status bar / camera notch */}
      <div className="relative overflow-hidden safe-pt pb-14 px-4" style={{
        background: "linear-gradient(135deg, #0A2E9F 0%, #0B3FD9 55%, #1563E8 100%)"
      }}>

        {/* Top bar: logo + actions */}
        <div className="relative flex items-center gap-2 pt-3">
          <Link to={createPageUrl("Home")} className="shrink-0">
            <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b1d36c3f0_LOGO-LANDSCAPE-BLUE.png" alt="" className="h-9 w-auto object-contain" style={{ filter: "brightness(0) invert(1)" }} />
          </Link>
          <div className="flex-1" />
          <Link to={createPageUrl("DailyTruthFeed")} className="w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md active:scale-95 transition" style={{ background: "rgba(255,255,255,0.18)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.22)" }} title="Daily">
            <Flame className="w-4 h-4" />
          </Link>
          <Link to={createPageUrl("Dashboard")} className="w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md active:scale-95 transition" style={{ background: "rgba(255,255,255,0.18)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.22)" }} title="Me">
            <Zap className="w-4 h-4" />
          </Link>
          <Link to={createPageUrl("Notifications")} className="relative w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md active:scale-95 transition" style={{ background: "rgba(255,255,255,0.18)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.22)" }}>
            <Bell className="w-4 h-4" />
            {notifications?.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: "#FFD000", boxShadow: "0 0 8px #FFD000" }} />
            )}
          </Link>
        </div>

        {/* Greeting */}
        <div className="relative mt-5">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-white/75">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#FFD000", animation: "mf-pulse-dot 2s ease-in-out infinite" }} />
            {greeting}
          </div>
          <h1 className="text-[26px] font-black font-['Space_Grotesk'] text-white leading-tight truncate mt-1">
            Hey, {firstName} <span style={{ color: "#FFD000" }}>⚡</span>
          </h1>
          <div className="text-sm text-white/80 mt-1 font-semibold">Your light is needed today.</div>
        </div>
      </div>

      {/* COMPOSE PROMPT — floating card over hero */}
      <div className="px-3 -mt-9 relative z-10 mb-4">
        <button
          onClick={onOpenDropModal}
          className="w-full rounded-[1.25rem] p-3 flex items-center gap-2.5 active:scale-[0.99] transition text-left"
          style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 10px 28px rgba(11, 63, 217, 0.15)" }}
        >
          <div className="flex-1 text-sm font-semibold py-2.5 px-4 rounded-full truncate" style={{ background: "#F6F8FC", color: "#6B7FA0", border: "1px solid #E6ECF5" }}>
            Share a light drop, {firstName}…
          </div>
          <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FFD000, #FF9F1A)", color: "#0B1B3D", boxShadow: "0 4px 12px rgba(255, 159, 26, 0.4)" }}>
            <Plus className="w-5 h-5" strokeWidth={3} />
          </div>
        </button>
      </div>

      {/* STORIES */}
      <div className="px-3 mb-4">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" style={{ color: "#0B3FD9" }} />
            <h3 className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: "#0B3FD9" }}>Statuses</h3>
          </div>
          <span className="text-[10px] font-bold" style={{ color: "#8A97B5" }}>{stories.length} live</span>
        </div>
        <div className="flex gap-3 overflow-x-auto mf-hide-sb pb-1">
          {/* Add status */}
          <button onClick={onOpenStatusComposer} className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition">
            <div className="relative w-[68px] h-[68px] rounded-full p-[2.5px]" style={{ background: "linear-gradient(135deg, #1FB8FF, #0B3FD9, #FFD000)" }}>
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center" style={{ background: "#FFFFFF", border: "2.5px solid #FFFFFF" }}>
                <img src={user?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#FFD000", border: "2.5px solid #F6F8FC", boxShadow: "0 2px 6px rgba(255, 159, 26, 0.5)" }}>
                <Plus className="w-3.5 h-3.5" style={{ color: "#0B1B3D" }} strokeWidth={3} />
              </div>
            </div>
            <span className="text-[10px] font-black" style={{ color: "#0B3FD9" }}>Your Story</span>
          </button>

          {stories.slice(0, 8).map(story => {
            const storyUser = getUserInfo(story.user_email);
            const theme = story.background_theme === "violet" ? "from-[#8A5CFF] to-[#3B1E70]"
              : story.background_theme === "sunrise" ? "from-[#FFD60A] to-[#F97316]"
              : story.background_theme === "midnight" ? "from-[#121826] to-[#0B0F1A]"
              : "from-[#00CFFF] to-[#1DA1FF]";
            return (
              <button key={story.id} onClick={() => onOpenStatus(story)} className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition">
                <div className="relative w-[68px] h-[68px] rounded-full p-[2.5px]" style={{ background: "linear-gradient(135deg, #1FB8FF, #0B3FD9, #FFD000)" }}>
                  <div className="w-full h-full rounded-full overflow-hidden" style={{ background: "#FFFFFF", border: "2.5px solid #FFFFFF" }}>
                    {story.story_type === "image" && story.media_url ? (
                      <img src={story.media_url} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${theme} flex items-center justify-center text-white font-black text-lg`}>Aa</div>
                    )}
                  </div>
                  {/* mini avatar badge for author */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full overflow-hidden" style={{ border: "2.5px solid #F6F8FC", background: "#FFFFFF" }}>
                    <img src={storyUser?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                </div>
                <span className="text-[10px] font-bold truncate w-[68px] text-center" style={{ color: "#0B1B3D" }}>
                  {storyUser?.email === user?.email ? "You" : (storyUser?.display_name || storyUser?.full_name || "User").split(" ")[0] || "User"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTER PILLS — refined glass sticky (no blur for perf) */}
      <div className="sticky top-0 z-30 px-3 py-2.5 mb-3" style={{ background: "#F6F8FC", borderBottom: "1px solid rgba(214, 228, 255, 0.7)" }}>
        <div className="flex items-center gap-1.5 overflow-x-auto mf-hide-sb">
          {filters.map(f => {
            const isActive = activeFilter === f;
            return (
              <button
                key={f}
                onClick={() => onFilterChange(f)}
                className="px-4 py-2 rounded-full text-[11px] font-black whitespace-nowrap transition active:scale-95"
                style={isActive
                  ? { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 4px 12px rgba(11, 63, 217, 0.35)" }
                  : { background: "#FFFFFF", color: "#4A5878", border: "1px solid #E6ECF5", boxShadow: "0 2px 6px rgba(11, 63, 217, 0.04)" }}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* FEED */}
      <div className="px-3 pb-24 space-y-4">
        {isLoading && drops.length === 0 ? (
          <>
            <MobileDropCardSkeleton />
            <MobileDropCardSkeleton />
            <MobileDropCardSkeleton />
          </>
        ) : isError && filteredDrops.length === 0 ? (
          <div className="py-16 text-center rounded-[1.5rem]" style={{ background: "#FFFFFF", border: "1px dashed #D6E4FF" }}>
            <div className="text-3xl mb-2">↻</div>
            <p className="text-sm" style={{ color: "#4A5878" }}>We're refreshing the feed.</p>
            <button onClick={onRefetch} className="mt-3 px-5 py-2 rounded-full text-xs font-black" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 4px 12px rgba(11, 63, 217, 0.3)" }}>
              Refresh
            </button>
          </div>
        ) : filteredDrops.length === 0 ? (
          <div className="py-16 text-center rounded-[1.5rem] relative overflow-hidden" style={{ background: "#FFFFFF", border: "1px dashed #D6E4FF" }}>
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl opacity-30" style={{ background: "#FFD000" }} />
            <div className="relative">
              <div className="text-4xl mb-2">✨</div>
              <p className="text-sm font-black font-['Space_Grotesk']" style={{ color: "#0B1B3D" }}>No Drops yet</p>
              <p className="text-xs mt-1 px-6" style={{ color: "#8A97B5" }}>Be the first to share your light!</p>
              <button onClick={onOpenDropModal} className="mt-4 px-6 py-2.5 rounded-full text-xs font-black active:scale-95 transition" style={{ background: "linear-gradient(90deg, #FFD000, #FF9F1A)", color: "#0B1B3D", boxShadow: "0 6px 16px rgba(255, 208, 0, 0.45)" }}>
                ⚡ Share your Drop
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
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={onLoadMore}
            footerClassName="pt-5 pb-2 text-center text-[11px] font-black uppercase tracking-wider"
            footerStyle={{ color: "#8A97B5" }}
          />
        )}
      </div>

    </div>
  );
}