import React, { memo, useEffect, useRef } from "react";
import DropCard from "@/components/feed/DropCard";

function FeedDropList({
  drops,
  displayCount,
  getUserInfo,
  user,
  isGuest,
  likeMutation,
  handleShare,
  userLikes,
  allUsers,
  savedDropRecords,
  leaderAccounts,
  following,
  followMutation,
  onLoadMore,
  hasMore,
  isLoadingMore,
  footerClassName = "py-6 text-center text-sm",
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
      { rootMargin: "700px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  const visibleDrops = drops.slice(0, displayCount);

  return (
    <>
      {visibleDrops.map(drop => (
        <DropCard
          key={drop.id}
          drop={drop}
          user={user}
          isGuest={isGuest}
          dropUser={getUserInfo(drop.user_email)}
          likeMutation={likeMutation}
          handleShare={handleShare}
          userLikes={userLikes}
          allUsers={allUsers}
          savedDropRecords={savedDropRecords}
          leaderAccounts={leaderAccounts}
          following={following}
          followMutation={followMutation}
        />
      ))}
      <div ref={sentinelRef} className={footerClassName} style={footerStyle}>
        {hasMore || isLoadingMore ? "Loading more..." : drops.length === 0 ? "" : `Showing ${drops.length} posts`}
      </div>
    </>
  );
}

export default memo(FeedDropList);