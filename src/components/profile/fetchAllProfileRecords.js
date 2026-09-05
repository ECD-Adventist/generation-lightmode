export default async function fetchAllProfileRecords(entity, query = {}, sort = null) {
  const records = [];
  const limit = 100;
  for (let skip = 0; ; skip += limit) {
    const page = await entity.filter(query, sort, limit, skip);
    records.push(...page);
    if (page.length < limit) return records;
  }
}