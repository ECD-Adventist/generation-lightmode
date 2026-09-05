import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import resolveProfileIdentity from "@/components/profile/resolveProfileIdentity";
const EMPTY = [];
export default function useProfileIdentity(currentUser) {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const read = key => { const value = params.get(key)?.trim(); return !value || ["undefined", "null"].includes(value) ? null : value; };
  const rawId = read("id");
  const viewLeaderId = read("leader") || (rawId?.startsWith("leader_") ? rawId.slice(7) : null);
  const viewUserId = viewLeaderId ? null : rawId;
  const viewUserEmail = viewLeaderId ? null : read("user")?.toLowerCase() || null;
  const hasProfileTarget = !!(viewUserEmail || viewUserId || viewLeaderId);
  const broken = !hasProfileTarget && ["user", "id", "leader"].some(key => params.has(key));
  const userEnabled = !!currentUser && !!(viewUserEmail || viewUserId);
  const leaderEnabled = !!currentUser && !!(viewLeaderId || viewUserEmail);
  const people = useQuery({
    queryKey: ["publicUserProfileIdentity", currentUser?.id, viewUserEmail, viewUserId],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicUsers", { ...(viewUserId ? { ids: [viewUserId] } : { emails: [viewUserEmail] }), include_email: true });
      if (!Array.isArray(res.data)) throw new Error("Unable to load profile");
      return res.data;
    }, enabled: userEnabled, staleTime: 300_000,
  });
  const leaders = useQuery({
    queryKey: ["publicLeaderAccountsForProfile", currentUser?.id, viewUserEmail, viewLeaderId],
    queryFn: async () => {
      const res = await base44.functions.invoke("listPublicLeaderAccounts", { ...(viewLeaderId ? { ids: [viewLeaderId] } : { emails: [viewUserEmail] }), limit: 1 });
      if (!Array.isArray(res.data)) throw new Error("Unable to load leader");
      return res.data;
    }, enabled: leaderEnabled, staleTime: 300_000,
  });
  const allUsersForProfile = people.data || EMPTY;
  const publicLeaderAccounts = leaders.data || EMPTY;
  const ready = (!userEnabled || people.isFetched) && (!leaderEnabled || leaders.isFetched);
  const resolvedProfile = useMemo(() => resolveProfileIdentity(currentUser, { email: viewUserEmail, id: viewUserId, leaderId: viewLeaderId, broken }, allUsersForProfile, publicLeaderAccounts, ready), [currentUser, viewUserEmail, viewUserId, viewLeaderId, broken, allUsersForProfile, publicLeaderAccounts, ready]);
  return { resolvedProfile, allUsersForProfile, publicLeaderAccounts, viewUserEmail, viewUserId, viewLeaderId, hasProfileTarget, broken };
}