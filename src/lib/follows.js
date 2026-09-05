import { base44 } from "@/api/base44Client";

// Bounded page loader. The previous `fetchAll` looped until the table ran out, which for a
// leader with tens of thousands of followers shipped every row to the phone. Profile
// follower/following counts and lists now come from the `getConnections` backend function;
// this file only serves the viewer's OWN following set (used for "is following" checks),
// capped at MAX_FOLLOWING rows.
const PAGE = 100;
const MAX_FOLLOWING = 1000;

const fetchPages = async (entity, query, cap) => {
  const rows = [];
  let skip = 0;
  while (rows.length < cap) {
    const size = Math.min(PAGE, cap - rows.length);
    const page = await entity.filter(query, null, size, skip);
    rows.push(...page);
    if (page.length < size) break;
    skip += size;
  }
  return rows;
};

const dedupeBy = (rows, key) => {
  const seen = new Set();
  return rows.filter((row) => {
    const value = row[key] || row.id;
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

// Follow records are ID-based only (email fields were removed as PII).
// The second (email) argument is accepted for backward compatibility but ignored.
export const fetchAllFollowing = async (userId) => {
  if (!userId) return [];
  return dedupeBy(await fetchPages(base44.entities.Follow, { follower_id: userId }, MAX_FOLLOWING), "following_id");
};

/**
 * Follower/following summary for a profile: counts, first pages and the viewer's own following.
 * See base44/functions/getConnections.
 */
export const fetchConnections = async (targetId, options = {}) => {
  if (!targetId) return null;
  const res = await base44.functions.invoke("getConnections", { target_id: targetId, ...options });
  return res?.data || null;
};

/** Follow or unfollow through the backend (keeps counters, mirror and notification consistent). */
export const manageFollow = async (targetId, action = "toggle") => {
  const res = await base44.functions.invoke("manageFollow", { target_id: targetId, action });
  return res?.data || null;
};
