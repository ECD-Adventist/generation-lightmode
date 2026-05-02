import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Global user-by-name/email search for the Feed.
 *
 * When the user types into the Feed search box, we:
 *   1) Debounce the input (400ms).
 *   2) Look up matching users globally via `listPublicUsers` (name OR email contains).
 *   3) For the top matches, fetch their recent drops via GlowDrop.filter.
 *
 * This lets users find a creator's posts even when those posts haven't been
 * loaded into the local feed cache yet.
 *
 * Cheap by design:
 * - Debounced so we don't fire on every keystroke
 * - Only runs when query.length >= 2
 * - React Query caches results (typing the same name twice = 0 extra calls)
 * - We cap to top 5 matched users and 30 drops per user
 */
export default function useFeedUserSearch(rawQuery, { enabled = true } = {}) {
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const trimmed = (rawQuery || "").trim();
    if (trimmed.length < 2) {
      setDebounced("");
      return;
    }
    const t = setTimeout(() => setDebounced(trimmed.toLowerCase()), 400);
    return () => clearTimeout(t);
  }, [rawQuery]);

  // Step 1 — find matching users globally.
  const { data: matchedUsers = [] } = useQuery({
    queryKey: ["feedUserSearch:users", debounced],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", { limit: 500 });
      const all = Array.isArray(res.data) ? res.data : [];
      const q = debounced;
      return all
        .filter(u => {
          const name = (u.full_name || "").toLowerCase();
          const email = (u.email || "").toLowerCase();
          return name.includes(q) || email.includes(q);
        })
        .slice(0, 5);
    },
    enabled: enabled && debounced.length >= 2,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const matchedEmails = matchedUsers.map(u => u.email).filter(Boolean);

  // Step 2 — fetch recent drops for each matched user.
  const { data: matchedDrops = [], isFetching: dropsLoading } = useQuery({
    queryKey: ["feedUserSearch:drops", matchedEmails.join("|")],
    queryFn: async () => {
      if (matchedEmails.length === 0) return [];
      const results = await Promise.all(
        matchedEmails.map(email =>
          base44.entities.GlowDrop.filter({ user_email: email }, "-created_date", 30).catch(() => [])
        )
      );
      return results.flat();
    },
    enabled: enabled && matchedEmails.length > 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  return {
    isActive: debounced.length >= 2,
    matchedUsers,
    matchedDrops,
    isLoading: dropsLoading,
  };
}