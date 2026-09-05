import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { readCommunitySnapshot, saveCommunitySnapshot } from "@/components/dashboard/communitySnapshotCache";

export default function usePublicCommunitySnapshot() {
  return useQuery({
    queryKey: ["publicCommunitySnapshot"],
    queryFn: async () => {
      const response = await base44.functions.invoke("getPublicCommunitySnapshot", {});
      const data = response?.data;
      if (!data || data.error || typeof data.totalUsers !== "number" || !Array.isArray(data.countryStats)) {
        throw new Error(data?.error || "Invalid community snapshot response");
      }
      saveCommunitySnapshot(data);
      return data;
    },
    initialData: readCommunitySnapshot,
    initialDataUpdatedAt: () => Date.parse(readCommunitySnapshot()?.generated_at || '') || 0,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60_000,
    refetchIntervalInBackground: false,
    retry: 1,
    retryDelay: (attempt, error) => error?.response?.status === 429 ? 60_000 : 1000,
    placeholderData: {
      totalUsers: 0,
      totalGroups: 0,
      totalDrops: 0,
      totalCountries: 0,
      totalLocatedUsers: 0,
      totalMissingCountry: 0,
      totalMissingCity: 0,
      totalLocationComplete: 0,
      uniqueCities: 0,
      totalChallenges: 0,
      countryStats: [],
      topGroups: [],
      recentDrops: [],
      challenges: [],
    },
  });
}