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
}) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore?.();
      },
      { rootMargin: "120px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  const visibleDrops = drops.slice(0, displayCount);

  return (
    <>
      {visibleDrops.map(drop => (
        <MobileDropCard
          key={drop.id}
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
      ))}
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