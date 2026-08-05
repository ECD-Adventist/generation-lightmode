import { useInfiniteQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export const glowDropsFeedQueryKey = ["allGlowDrops"];
export const GLOW_DROPS_PAGE_SIZE = 15;

export default function useGlowDropsFeed() {
  const query = useInfiniteQuery({
    queryKey: glowDropsFeedQueryKey,
    queryFn: async ({ pageParam = null }) => {
      const cursor = pageParam ? { $lt: pageParam } : undefined;
      const [drops, reposts] = await Promise.all([
        base44.entities.GlowDrop.filter(cursor ? { created_date: cursor } : {}, "-created_date", GLOW_DROPS_PAGE_SIZE),
        base44.entities.Repost.filter(cursor ? { created_at: cursor } : {}, "-created_at", GLOW_DROPS_PAGE_SIZE),
      ]);
      const ids = [...new Set(reposts.map(item => item.original_post_id).filter(Boolean))];
      const originals = ids.length ? await base44.entities.GlowDrop.filter({ id: { $in: ids } }, "-created_date", GLOW_DROPS_PAGE_SIZE) : [];
      const originalsById = new Map(originals.map(item => [item.id, item]));
      // Base44 returns created_date without a trailing Z (naive UTC) while Repost.created_at is
      // a full ISO string — normalize before sorting so new posts aren't pushed below reposts.
      const toUtc = (value) => (value && !value.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(value) ? `${value}Z` : value);
      const items = [
        ...drops.map(drop => ({ ...drop, feed_item_id: `post:${drop.id}`, feed_date: toUtc(drop.created_date), feed_cursor: drop.created_date })),
        ...reposts.map(repost => {
          const original = originalsById.get(repost.original_post_id);
          return original ? { ...original, feed_item_id: `repost:${repost.id}`, feed_date: toUtc(repost.created_at), feed_cursor: repost.created_at, repost } : null;
        }).filter(Boolean),
      ].sort((a, b) => new Date(b.feed_date || 0) - new Date(a.feed_date || 0)).slice(0, GLOW_DROPS_PAGE_SIZE);
      return { items, hasMore: drops.length === GLOW_DROPS_PAGE_SIZE || reposts.length === GLOW_DROPS_PAGE_SIZE, nextCursor: items.at(-1)?.feed_cursor };
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
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