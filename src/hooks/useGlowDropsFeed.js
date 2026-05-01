import { useInfiniteQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export const glowDropsFeedQueryKey = ["allGlowDrops"];
export const GLOW_DROPS_PAGE_SIZE = 20;

export default function useGlowDropsFeed() {
  const query = useInfiniteQuery({
    queryKey: glowDropsFeedQueryKey,
    queryFn: ({ pageParam = 0 }) => base44.entities.GlowDrop.list("-created_date", GLOW_DROPS_PAGE_SIZE, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < GLOW_DROPS_PAGE_SIZE) return undefined;
      return allPages.length * GLOW_DROPS_PAGE_SIZE;
    },
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const seen = new Set();
  const data = (query.data?.pages || [])
    .flat()
    .filter(drop => {
      if (!drop?.id || seen.has(drop.id)) return false;
      seen.add(drop.id);
      return true;
    });

  return { ...query, data };
}