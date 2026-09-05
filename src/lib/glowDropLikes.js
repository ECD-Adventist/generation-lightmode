// Loads a user's likes newest-first, bounded. The feed no longer calls this (it gets likes from
// the getFeedViewerState function); profile and discover pages use it with an explicit cap.
export async function fetchAllUserGlowDropLikes(entity, email, maxRecords = 1000) {
  if (!email) return [];
  const pageSize = 500;
  const records = [];
  for (let skip = 0; skip < maxRecords; skip += pageSize) {
    const page = await entity.filter({ user_email: email }, "-created_date", Math.min(pageSize, maxRecords - skip), skip);
    records.push(...page);
    if (page.length < pageSize) break;
  }
  return records;
}
