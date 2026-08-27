import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function usePublicCommunitySnapshot() {
  return useQuery({
    queryKey: ["publicCommunitySnapshot"],
    queryFn: async () => {
      const response = await base44.functions.invoke("getPublicCommunitySnapshot", {});
      const data = response?.data;
      if (!data || data.error || typeof data.totalUsers !== "number" || !Array.isArray(data.countryStats)) {
        throw new Error(data?.error || "Invalid community snapshot response");
      }
      return data;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: {
      totalUsers: 0,
      totalGroups: 0,
      totalDrops: 0,
      totalCountries: 0,
      totalChallenges: 0,
      countryStats: [],
      topGroups: [],
      recentDrops: [],
      challenges: [],
    },
  });
}