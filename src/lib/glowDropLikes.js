export async function fetchAllUserGlowDropLikes(entity, email) {
  if (!email) return [];
  const pageSize = 500;
  const maxRecords = 10000;
  const records = [];
  for (let skip = 0; skip < maxRecords; skip += pageSize) {
    const page = await entity.filter({ user_email: email }, "-created_date", pageSize, skip);
    records.push(...page);
    if (page.length < pageSize) break;
  }
  return records;
}
