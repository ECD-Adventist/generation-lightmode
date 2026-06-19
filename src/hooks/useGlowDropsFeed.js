import { useInfiniteQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export const glowDropsFeedQueryKey = ["allGlowDrops"];
export const GLOW_DROPS_PAGE_SIZE = 15;

export default function useGlowDropsFeed() {
  const query = useInfiniteQuery({
    queryKey: glowDropsFeedQueryKey,
    queryFn: ({ pageParam = 0 }) => base44.entities.GlowDrop.list("-created_date", GLOW_DROPS_PAGE_SIZE, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!Array.isArray(lastPage) || lastPage.length < GLOW_DROPS_PAGE_SIZE) return undefined;
      return (allPages?.length || 0) * GLOW_DROPS_PAGE_SIZE;
    },
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    // Rate-limit errors are transient — retry more persistently with a longer
    // backoff so the feed self-heals instead of getting stuck on the error screen.
    retry: (failureCount, error) => {
      const isRateLimit = /rate limit/i.test(error?.message || "");
      return failureCount < (isRateLimit ? 6 : 3);
    },
    retryDelay: (attempt, error) => {
      const isRateLimit = /rate limit/i.test(error?.message || "");
      const base = isRateLimit ? 3000 : 1000;
      return Math.min(base * 2 ** attempt, isRateLimit ? 20000 : 8000);
    },
  });

  const seen = new Set();
  const data = (query.data?.pages || [])
    .flat()
    .filter(drop => {
      if (!drop?.id || seen.has(drop.id)) return false;
      seen.add(drop.id);
      return true;
    })
    // Author email lives in the built-in `created_by` field — backfill `user_email`
    // so author name/picture resolution works across the feed.
    .map(drop => drop.user_email ? drop : { ...drop, user_email: drop.created_by });

  return { ...query, data };
}