import { base44 } from "@/api/base44Client";
const fields = {
  User: ['id', 'email', 'full_name', 'display_name', 'username', 'country', 'provisional_country', 'assignment_status', 'location', 'region', 'city', 'address', 'postal_code', 'territory_status', 'created_date', 'profile_picture_url'],
  GlowDrop: ['id', 'created_date', 'user_email', 'status', 'likes_count', 'verse', 'category'],
  GlowGroup: ['id', 'name', 'country', 'region', 'leader_email', 'profile_picture_url'],
  Challenge: ['id', 'title', 'active'],
  ChallengeSubmission: ['id', 'challenge_id', 'user_email', 'points_awarded'],
  PrayerRequest: ['id', 'answered', 'category'],
  GlowGroupMember: ['id', 'group_id'],
};
export default async function readAdminRecords(entity, { signal, user } = {}) {
  const records = new Map();
  const size = entity === 'User' ? 5000 : 2000;
  for (let skip = 0; ; skip += size) {
    signal?.throwIfAborted();
    // Built-in admins read the database directly; custom admin roles use the
    // existing authenticated backend rather than bypassing User permissions.
    const page = entity === 'User' && user?.role !== 'admin'
      ? (await base44.functions.invoke('adminListUsers', { view: 'dashboard', limit: size, skip })).data
      : await base44.entities[entity].list('-created_date', size, skip, fields[entity]);
    if (!Array.isArray(page)) throw new Error(`Unable to read ${entity}`);
    page.forEach(record => records.set(record.id, entity === 'User' ? { ...record, full_name: record.display_name || record.username || record.full_name || '' } : record));
    if (page.length < size) return [...records.values()];
  }
}