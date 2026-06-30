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

export const fetchAllFollowers = async (userId, userEmail) => {
  let allFollowers = [];
  
  if (userId) {
    const byId = await fetchAll(base44.entities.Follow, { following_id: userId });
    allFollowers = [...allFollowers, ...byId];
  }
  
  if (userEmail) {
    const byEmail = await fetchAll(base44.entities.Follow, { following_email: userEmail });
    const existingIds = new Set(allFollowers.map(f => f.id));
    const newOnes = byEmail.filter(f => !existingIds.has(f.id));
    allFollowers = [...allFollowers, ...newOnes];
  }
  
  return allFollowers;
};

export const fetchAllFollowing = async (userId, userEmail) => {
  let allFollowing = [];
  
  if (userId) {
    const byId = await fetchAll(base44.entities.Follow, { follower_id: userId });
    allFollowing = [...allFollowing, ...byId];
  }
  
  if (userEmail) {
    const byEmail = await fetchAll(base44.entities.Follow, { follower_email: userEmail });
    const existingIds = new Set(allFollowing.map(f => f.id));
    const newOnes = byEmail.filter(f => !existingIds.has(f.id));
    allFollowing = [...allFollowing, ...newOnes];
  }
  
  return allFollowing;
};