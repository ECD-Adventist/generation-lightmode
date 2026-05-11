import React, { memo, useEffect, useRef } from "react";
import MobileDropCard from "@/components/feed/MobileDropCard";

/**
 * Chunked, lightweight mobile feed list.
 * - Smaller initial chunk than the desktop list (handled by parent's displayCount).
 * - Smaller IntersectionObserver rootMargin (200px) so we don't pre-render
 *   far-away cards on low-end mobile devices.
 * - Renders MobileDropCard (lightweight) instead of the full DropCard.
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
      { rootMargin: "200px 0px" }
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
        />
      ))}
      <div ref={sentinelRef} className={footerClassName} style={footerStyle}>
        {hasMore || isLoadingMore ? "Loading more..." : drops.length === 0 ? "" : `Showing ${drops.length} posts`}
      </div>
    </>
  );
}

export default memo(MobileFeedDropList);