import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Bell, MessageCircle, Search as SearchIcon, X, Plus, Sparkles, Flame, Compass, Globe, Zap } from "lucide-react";
import DropCard from "@/components/feed/DropCard";

/**
 * Mobile-only Feed shell — LightMode branded.
 * Renders hero, stories row, filter pills, and the drops list.
 * All mutations/state come from parent (Feed.jsx).
 */
export default function MobileFeed({
  user,
  notifications,
  searchQuery,
  onSearch,
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
}) {
  const filters = ["All", "Following", "Most Liked", "Devotional", "Testimony"];

  return (
    <div className="min-h-screen font-['Inter']" style={{ background: "linear-gradient(180deg, #F6F8FC 0%, #EEF3FF 50%, #E2EBFF 100%)", color: "#0B1B3D" }}>
      <style>{`
        @keyframes mf-float { 0%,100% { transform: translateY(0) scale(1); opacity: 0.2 } 50% { transform: translateY(-16px) scale(1.08); opacity: 0.38 } }
        .mf-hide-sb::-webkit-scrollbar { display: none; }
        .mf-hide-sb { scrollbar-width: none; }
      `}</style>

      {/* HERO HEADER */}
      <div className="relative overflow-hidden pt-5 pb-4 px-4" style={{ background: "linear-gradient(135deg, #0B3FD9 0%, #1FB8FF 100%)" }}>
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full blur-3xl opacity-40 pointer-events-none" style={{ background: "#FFD000", animation: "mf-float 9s ease-in-out infinite" }} />
        <div className="absolute -bottom-12 -left-10 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ background: "#7FE0FF", animation: "mf-float 12s ease-in-out infinite 2s" }} />

        <div className="relative flex items-center gap-2.5">
          <Link to={createPageUrl("Home")} className="shrink-0">
            <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/b1d36c3f0_LOGO-LANDSCAPE-BLUE.png" alt="" className="h-9 w-auto object-contain" style={{ filter: "brightness(0) invert(1)" }} />
          </Link>
          <div className="flex-1" />
          <Link to={createPageUrl("Notifications")} className="relative w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md active:scale-95 transition" style={{ background: "rgba(255,255,255,0.22)", color: "#FFFFFF" }}>
            <Bell className="w-4 h-4" />
            {notifications?.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: "#FFD000" }} />
            )}
          </Link>
          <Link to={createPageUrl("Messages")} className="w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md active:scale-95 transition" style={{ background: "rgba(255,255,255,0.22)", color: "#FFFFFF" }}>
            <MessageCircle className="w-4 h-4" />
          </Link>
        </div>

        {/* Greeting */}
        <div className="relative mt-3 mb-3">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
            {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening"}
          </div>
          <h1 className="text-xl font-black font-['Space_Grotesk'] text-white leading-tight truncate">
            Hey, {user?.full_name?.split(" ")[0] || "Friend"} ⚡
          </h1>
        </div>

        {/* Search pill */}
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#0B3FD9" }} />
          <input
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search drops, people, verses…"
            className="w-full rounded-full py-2.5 pl-11 pr-10 text-[14px] font-medium focus:outline-none"
            style={{ background: "#FFFFFF", color: "#0B1B3D", boxShadow: "0 8px 24px rgba(11, 27, 61, 0.18)" }}
          />
          {searchQuery && (
            <button onClick={() => onSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#EEF3FF", color: "#0B3FD9" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* QUICK NAV */}
      <div className="px-3 -mt-2 relative z-10 mb-3">
        <div className="grid grid-cols-4 gap-2 rounded-2xl p-2" style={{ background: "#FFFFFF", border: "1px solid #E6ECF5", boxShadow: "0 4px 14px rgba(11, 63, 217, 0.08)" }}>
          {[
            { to: "GlowGroups", icon: Globe, label: "Groups", color: "#0B3FD9" },
            { to: "Discover", icon: Compass, label: "Discover", color: "#1FB8FF" },
            { to: "DailyTruthFeed", icon: Flame, label: "Daily", color: "#FF9F1A" },
            { to: "Dashboard", icon: Zap, label: "Me", color: "#FFD000" },
          ].map(item => {
            const Icon = item.icon;
            return (
              <Link key={item.to} to={createPageUrl(item.to)} className="flex flex-col items-center gap-1 py-2 rounded-xl active:scale-95 transition no-underline">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${item.color}15` }}>
                  <Icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <span className="text-[10px] font-black" style={{ color: "#0B1B3D" }}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* STORIES */}
      <div className="px-3 mb-3">
        <div className="flex items-center gap-2 mb-2 px-1">
          <Sparkles className="w-3.5 h-3.5" style={{ color: "#0B3FD9" }} />
          <h3 className="text-[11px] font-black uppercase tracking-[0.15em]" style={{ color: "#0B3FD9" }}>Statuses</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto mf-hide-sb pb-1">
          {/* Add status */}
          <button onClick={onOpenStatusComposer} className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition">
            <div className="relative w-16 h-16 rounded-full p-[2px]" style={{ background: "linear-gradient(135deg, #1FB8FF, #0B3FD9, #FFD000)" }}>
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center" style={{ background: "#FFFFFF", border: "2px solid #FFFFFF" }}>
                <img src={user?.profile_picture_url || "https://media.base44.com/images/public/69a6fca6155ae283f1b55144/c5b1f7d62_DefaultProfilePicture.png"} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#FFD000", border: "2px solid #F6F8FC" }}>
                <Plus className="w-3 h-3" style={{ color: "#0B1B3D" }} strokeWidth={3} />
              </div>
            </div>
            <span className="text-[10px] font-black" style={{ color: "#0B3FD9" }}>Your Story</span>
          </button>

          {stories.slice(0, 20).map(story => {
            const storyUser = getUserInfo(story.user_email);
            const theme = story.background_theme === "violet" ? "from-[#8A5CFF] to-[#3B1E70]"
              : story.background_theme === "sunrise" ? "from-[#FFD60A] to-[#F97316]"
              : story.background_theme === "midnight" ? "from-[#121826] to-[#0B0F1A]"
              : "from-[#00CFFF] to-[#1DA1FF]";
            return (
              <button key={story.id} onClick={() => onOpenStatus(story)} className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition">
                <div className="w-16 h-16 rounded-full p-[2px]" style={{ background: "linear-gradient(135deg, #1FB8FF, #0B3FD9)" }}>
                  <div className="w-full h-full rounded-full overflow-hidden" style={{ background: "#FFFFFF", border: "2px solid #FFFFFF" }}>
                    {story.story_type === "image" && story.media_url ? (
                      <img src={story.media_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${theme} flex items-center justify-center text-white font-black`}>Aa</div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-bold truncate w-16 text-center" style={{ color: "#0B1B3D" }}>
                  {storyUser?.email === user?.email ? "You" : storyUser?.full_name?.split(" ")[0] || "User"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTER PILLS */}
      <div className="sticky top-0 z-20 px-3 py-2.5 backdrop-blur-xl mb-2" style={{ background: "rgba(246, 248, 252, 0.92)", borderBottom: "1px solid #E2E8F0" }}>
        <div className="flex items-center gap-1.5 overflow-x-auto mf-hide-sb">
          {filters.map(f => {
            const isActive = activeFilter === f;
            return (
              <button
                key={f}
                onClick={() => onFilterChange(f)}
                className="px-3.5 py-1.5 rounded-full text-[11px] font-black whitespace-nowrap transition active:scale-95"
                style={isActive
                  ? { background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF", boxShadow: "0 3px 10px rgba(11, 63, 217, 0.3)" }
                  : { background: "#FFFFFF", color: "#4A5878", border: "1px solid #E6ECF5" }}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* FEED */}
      <div className="px-3 pb-24">
        {isLoading && drops.length === 0 ? (
          <div className="py-16 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : isError && filteredDrops.length === 0 ? (
          <div className="py-16 text-center rounded-2xl" style={{ background: "#FFFFFF", border: "1px dashed #D6E4FF" }}>
            <div className="text-3xl mb-2">↻</div>
            <p className="text-sm" style={{ color: "#4A5878" }}>We're refreshing the feed.</p>
            <button onClick={onRefetch} className="mt-3 px-5 py-2 rounded-full text-xs font-black" style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#FFFFFF" }}>
              Refresh
            </button>
          </div>
        ) : filteredDrops.length === 0 ? (
          <div className="py-16 text-center rounded-2xl" style={{ background: "#FFFFFF", border: "1px dashed #D6E4FF" }}>
            <div className="text-3xl mb-2">✨</div>
            <p className="text-sm font-bold" style={{ color: "#0B1B3D" }}>No Drops yet</p>
            <p className="text-xs mt-1" style={{ color: "#8A97B5" }}>Be the first to share your light!</p>
            <button onClick={onOpenDropModal} className="mt-4 px-5 py-2 rounded-full text-xs font-black" style={{ background: "linear-gradient(90deg, #FFD000, #FF9F1A)", color: "#0B1B3D", boxShadow: "0 4px 12px rgba(255, 208, 0, 0.4)" }}>
              Share a Drop
            </button>
          </div>
        ) : (
          <>
            {filteredDrops.slice(0, displayCount).map(drop => {
              const dropUser = getUserInfo(drop.user_email);
              return (
                <DropCard
                  key={drop.id}
                  drop={drop}
                  user={user}
                  dropUser={dropUser}
                  likeMutation={likeMutation}
                  handleShare={handleShare}
                  userLikes={userLikes}
                  allUsers={allUsers}
                  savedDropRecords={savedDropRecords}
                />
              );
            })}
            <div className="py-4 text-center text-xs" style={{ color: "#8A97B5" }}>
              {displayCount < filteredDrops.length ? "Loading more..." : `${filteredDrops.length} posts`}
            </div>
          </>
        )}
      </div>

      {/* Floating Compose FAB */}
      <button
        onClick={onOpenDropModal}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center active:scale-90 transition"
        style={{
          background: "linear-gradient(135deg, #FFD000, #FF9F1A)",
          color: "#0B1B3D",
          boxShadow: "0 8px 24px rgba(255, 159, 26, 0.5), 0 0 0 4px rgba(255, 208, 0, 0.18)",
        }}
      >
        <Plus className="w-6 h-6" strokeWidth={3} />
      </button>
    </div>
  );
}