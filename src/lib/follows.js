import { base44 } from "@/api/base44Client";

// Follow data now comes from the backend:
//   - getConnections   → counts, first pages, and the viewer's rows for the people on screen
//   - getFeedViewerState → the viewer's own following (capped) for the feed
//   - manageFollow     → follow / unfollow with counters, mirror and notification kept consistent
// The old page-everything loops (`fetchAllFollowers` / `fetchAllFollowing`) are gone: a leader with
// tens of thousands of followers used to ship every row to the phone.

export const OFFICIAL_ACCOUNT_EMAIL = "system@lightmode.com";

/**
 * Leader accounts and the official Generation LightMode account are followed by everyone
 * implicitly — no Follow row is written per member any more (that was 50M rows at 1M users).
 * Use this wherever the UI decides between "Follow" and "Following" for a post author.
 */
export const isImplicitlyFollowed = (authorEmail, leaderAccounts = []) =>
  !!authorEmail && (authorEmail === OFFICIAL_ACCOUNT_EMAIL || leaderAccounts.some((a) => a.leader_email === authorEmail));

/**
 * Follower/following summary for a profile: counts, first pages and the viewer's own rows for
 * the people shown. See base44/functions/getConnections.
 */
export const fetchConnections = async (targetId, options = {}) => {
  if (!targetId) return null;
  const res = await base44.functions.invoke("getConnections", { target_id: targetId, ...options });
  return res?.data || null;
};

/**
 * Follow or unfollow through the backend. Pass an explicit "follow" / "unfollow" whenever the
 * caller knows the current state: local follow lists are capped, so "toggle" could unfollow
 * someone the viewer meant to follow.
 */
export const manageFollow = async (targetId, action = "toggle") => {
  const res = await base44.functions.invoke("manageFollow", { target_id: targetId, action });
  return res?.data || null;
};
