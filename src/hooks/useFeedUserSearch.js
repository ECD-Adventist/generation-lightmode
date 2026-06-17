import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Global Feed search across BOTH regular users and managed leader accounts.
 *
 * - Debounced (400ms), only runs when query.length >= 2
 * - Step 1: matches by name/email across `listPublicUsers` AND `ManagedLeaderAccount`
 * - Step 2: fetches recent drops for each matched email
 *   (leader posts use `leader_email` as `user_email` on GlowDrop, so the same
 *   GlowDrop.filter({ user_email }) query works for both).
 * - React-Query cached so repeated searches don't re-fetch.
 */
export default function useFeedUserSearch(rawQuery, { enabled = true } = {}) {
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const trimmed = (rawQuery || "").trim();
    if (trimmed.length < 2) { setDebounced(""); return; }
    const t = setTimeout(() => setDebounced(trimmed.toLowerCase()), 400);
    return () => clearTimeout(t);
  }, [rawQuery]);

  const isActive = enabled && debounced.length >= 2;

  // Pull only a small server-filtered set of public users.
  const { data: allPublicUsers = [] } = useQuery({
    queryKey: ["feedUserSearch:allUsers", debounced],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", { search: debounced, limit: 20 });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: isActive,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  // Pull all active leader accounts.
  const { data: allLeaderAccounts = [] } = useQuery({
    queryKey: ["feedUserSearch:allLeaderAccounts"],
    queryFn: () => base44.entities.ManagedLeaderAccount.filter({ active: true }),
    enabled: isActive,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  // Filter both pools by name/email substring and merge into one user-shape.
  const matchedUsers = useMemo(() => {
    if (!isActive) return [];
    const q = debounced;

    const fromUsers = allPublicUsers.filter(u => {
      const name = (u.full_name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });

    const fromLeaders = allLeaderAccounts
      .filter(a => {
        const name = (a.leader_name || "").toLowerCase();
        const email = (a.leader_email || "").toLowerCase();
        const title = (a.leader_title || "").toLowerCase();
        return name.includes(q) || email.includes(q) || title.includes(q);
      })
      .map(a => ({
        id: `leader_${a.id}`,
        email: a.leader_email,
        full_name: a.leader_name,
        profile_picture_url: a.leader_profile_picture_url,
        cover_picture_url: a.leader_cover_picture_url,
        bio: a.leader_bio,
        country: a.leader_country,
        is_managed_leader: true,
        leader_title: a.leader_title,
      }));

    // Merge — leaders win over a same-email user (so the verified leader
    // identity always renders on author chips).
    const byEmail = new Map();
    fromUsers.forEach(u => { if (u.email) byEmail.set(u.email, u); });
    fromLeaders.forEach(u => { if (u.email) byEmail.set(u.email, u); });
    return Array.from(byEmail.values()).slice(0, 8);
  }, [isActive, debounced, allPublicUsers, allLeaderAccounts]);

  const matchedEmails = matchedUsers.map(u => u.email).filter(Boolean);

  // Fetch recent drops for each matched email (works for users AND leaders,
  // since leader posts are stored with leader_email as user_email).
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
    enabled: isActive && matchedEmails.length > 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  return {
    isActive,
    matchedUsers,
    matchedDrops,
    isLoading: dropsLoading,
  };
}