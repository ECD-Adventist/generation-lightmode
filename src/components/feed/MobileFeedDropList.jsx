import React, { memo, useEffect, useRef } from "react";
import MobileDropCard from "@/components/feed/MobileDropCard";
import MobileDropCardSkeleton from "@/components/feed/MobileDropCardSkeleton";

/**
 * Virtualized mobile feed list.
 * - Renders ONLY the cards within `displayCount` (parent starts at 4 on mobile).
 * - IntersectionObserver rootMargin reduced to 120px → barely pre-renders.
 * - Skeleton placeholder shown while initial load (or "loading more") is in flight.
 */
function MobileFeedDropList({
  drops,
  displayCount,
  getUserInfo,
  user,
  likeMutation,
  handleShare,
  userLikes,
  savedDropRecords,
  leaderAccounts,
  following,
  followMutation,
  onLoadMore,
  hasMore,
  isLoadingMore,
  footerClassName = "py-4 text-center text-[11px] font-black uppercase tracking-wider",
  footerStyle = { color: "#8A97B5" },
  midFeedSlot = null,
  midFeedIndex = 2,
}) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoadingMore) onLoadMore?.();
      },
      { rootMargin: "300px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
    // Re-observing after each batch re-fires immediately when the sentinel is
    // still on screen, so scrolling keeps loading instead of stalling.
  }, [hasMore, onLoadMore, isLoadingMore, displayCount, drops.length]);

  const visibleDrops = drops.slice(0, displayCount);

  return (
    <>
      {visibleDrops.map((drop, index) => (
        <React.Fragment key={drop.feed_item_id || drop.id}>
        {midFeedSlot && index === midFeedIndex && visibleDrops.length > midFeedIndex && midFeedSlot}
        <MobileDropCard
          drop={drop}
          user={user}
          dropUser={getUserInfo(drop.user_email)}
          likeMutation={likeMutation}
          handleShare={handleShare}
          userLikes={userLikes}
          savedDropRecords={savedDropRecords}
          leaderAccounts={leaderAccounts}
          following={following}
          followMutation={followMutation}
        />
        </React.Fragment>
      ))}
      {midFeedSlot && visibleDrops.length > 0 && visibleDrops.length <= midFeedIndex && midFeedSlot}
      {isLoadingMore && (
        <>
          <MobileDropCardSkeleton />
          <MobileDropCardSkeleton />
        </>
      )}
      <div ref={sentinelRef} className={footerClassName} style={footerStyle}>
        {hasMore || isLoadingMore ? "Loading more..." : drops.length === 0 ? "" : `Showing ${drops.length} posts`}
      </div>
    </>
  );
}

export default memo(MobileFeedDropList);