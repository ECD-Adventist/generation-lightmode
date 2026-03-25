import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export const glowDropsFeedQueryKey = ["allGlowDrops"];

export default function useGlowDropsFeed() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: glowDropsFeedQueryKey,
    queryFn: () => base44.entities.GlowDrop.list("-created_date", 50),
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: (previousData) => previousData ?? queryClient.getQueryData(glowDropsFeedQueryKey),
    retry: 1,
  });
}