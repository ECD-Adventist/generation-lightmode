import { useInfiniteQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export const glowDropsFeedQueryKey = ["allGlowDrops"];
export const GLOW_DROPS_PAGE_SIZE = 15;

// Skip/limit pagination. The previous cursor approach filtered with
// `created_date: { $lt: cursor }`, which matches ZERO records against the
// built-in created_date field — page 2 always came back empty and the feed
// capped at one page (~26 items). Offset pagination is verified to work at
// any depth (tested past 3,600 records).
export default function useGlowDropsFeed() {
  const query = useInfiniteQuery({
    queryKey: glowDropsFeedQueryKey,
    queryFn: async ({ pageParam = { dropSkip: 0, repostSkip: 0 } }) => {
      const { dropSkip, repostSkip } = pageParam;
      const [drops, reposts] = await Promise.all([
        base44.entities.GlowDrop.filter({}, "-created_date", GLOW_DROPS_PAGE_SIZE, dropSkip),
        base44.entities.Repost.filter({}, "-created_at", GLOW_DROPS_PAGE_SIZE, repostSkip),
      ]);
      const ids = [...new Set(reposts.map(item => item.original_post_id).filter(Boolean))];
      const originals = ids.length ? await base44.entities.GlowDrop.filter({ id: { $in: ids } }, "-created_date", GLOW_DROPS_PAGE_SIZE) : [];
      const originalsById = new Map(originals.map(item => [item.id, item]));
      // Base44 returns created_date without a trailing Z (naive UTC) while Repost.created_at is
      // a full ISO string — normalize before sorting so new posts aren't pushed below reposts.
      const toUtc = (value) => (value && !value.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(value) ? `${value}Z` : value);
      const items = [
        ...drops.map(drop => ({ ...drop, feed_item_id: `post:${drop.id}`, feed_date: toUtc(drop.created_date) })),
        ...reposts.map(repost => {
          const original = originalsById.get(repost.original_post_id);
          return original ? { ...original, feed_item_id: `repost:${repost.id}`, feed_date: toUtc(repost.created_at), repost } : null;
        }).filter(Boolean),
      ].sort((a, b) => new Date(b.feed_date || 0) - new Date(a.feed_date || 0));
      return {
        items,
        hasMore: drops.length === GLOW_DROPS_PAGE_SIZE || reposts.length === GLOW_DROPS_PAGE_SIZE,
        nextSkip: { dropSkip: dropSkip + drops.length, repostSkip: repostSkip + reposts.length },
      };
    },
    initialPageParam: { dropSkip: 0, repostSkip: 0 },
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextSkip : undefined,
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 3,
  });

  const seen = new Set();
  const data = (query.data?.pages || [])
    .flatMap(page => page.items || [])
    .filter(drop => {
      const key = drop?.feed_item_id || drop?.id;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(drop => drop.user_email ? drop : { ...drop, user_email: drop.created_by });

  return { ...query, data };
}