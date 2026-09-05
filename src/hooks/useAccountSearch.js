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

  const { data = [], isFetching } = useQuery({
    queryKey: ["exploreAccountSearch", debounced],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", {
        search: debounced,
        include_email: true,
        limit: 50,
      });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: debounced.length >= 2,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  return { accounts: data, isSearching: isFetching };
}