import { base44 } from "@/api/base44Client";

const fetchAll = async (entity, query = {}) => {
  let allRecords = [];
  let skip = 0;
  const limit = 100;
  while (true) {
    const result = await entity.filter(query, null, limit, skip);
    allRecords = [...allRecords, ...result];
    if (result.length < limit) break;
    skip += limit;
  }
  return allRecords;
};

// Follow records are ID-based only (email fields were removed as PII).
// The second (email) argument is accepted for backward compatibility but ignored.
export const fetchAllFollowers = async (userId) => {
  if (!userId) return [];
  const rows = await fetchAll(base44.entities.Follow, { following_id: userId });
  const seen = new Set();
  return rows.filter(f => {
    const key = f.follower_id || f.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const fetchAllFollowing = async (userId) => {
  if (!userId) return [];
  const rows = await fetchAll(base44.entities.Follow, { follower_id: userId });
  const seen = new Set();
  return rows.filter(f => {
    const key = f.following_id || f.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};