import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Server-side member search for Explore.
 * Debounced, runs only for queries of 2+ characters, and asks the backend to
 * include emails so each result can link to a real profile.
 */
export default function useAccountSearch(rawQuery) {
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const trimmed = (rawQuery || "").trim();
    if (trimmed.length < 2) { setDebounced(""); return; }
    const timer = setTimeout(() => setDebounced(trimmed), 350);
    return () => clearTimeout(timer);
  }, [rawQuery]);

  const { data = [], isFetching, isError, refetch } = useQuery({
    queryKey: ["exploreAccountSearch", debounced],
    queryFn: async () => {
      const [res, leaders] = await Promise.all([
        base44.functions.invoke("listPublicUsers", { search: debounced, include_email: true, limit: 50 }),
        base44.functions.invoke("listPublicLeaderAccounts", { search: debounced, limit: 50 }),
      ]);
      return [
        ...(Array.isArray(res.data) ? res.data : []),
        ...(Array.isArray(leaders.data) ? leaders.data : []).map(a => ({
          id: `leader_${a.id}`, leader_id: a.id, is_managed_leader: true,
          email: a.leader_email, full_name: a.leader_name, display_name: a.leader_name,
          country: a.leader_country, bio: a.leader_bio, profile_picture_url: a.leader_profile_picture_url,
        })),
      ];
    },
    enabled: debounced.length >= 2,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  return { accounts: data, isSearching: isFetching || ((rawQuery || "").trim().length >= 2 && debounced !== (rawQuery || "").trim()), isError, refetch };
}