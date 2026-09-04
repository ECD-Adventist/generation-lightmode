// Server-owned XP ledger. Every XP award is a verified XpEvent row; the user's
// glow_score and XpTotal are derived from the ledger, never trusted from the client.

export const XP_RULES = {
  post_drop: 5,
  daily_share_verse: 10,
  daily_like_drops: 5,
  daily_comment: 5,
  follow: 5,
  devotion_day: 10,
};

export const MILESTONE_REWARDS = {
  '100_prayers_prayed': { title: '100 Prayers Prayed', xp: 120 },
  '10_days_consistent_posting': { title: '10 Days of Consistent Posting', xp: 100 },
  '10_drops_shared': { title: '10 Public Drops Shared', xp: 80 },
  '25_people_followed': { title: '25 People Followed', xp: 60 },
};

// Theoretical maximum XP the Faith Quiz can ever pay (all 6 levels perfect).
export const QUIZ_MAX_XP = 710;

export function todayString() {
  return new Date().toISOString().split('T')[0];
}

export function toDate(value) {
  if (!value) return null;
  const iso = String(value);
  return new Date(/Z$|[+-]\d{2}:\d{2}$/.test(iso) ? iso : iso + 'Z');
}

export function isRecent(value, minutes = 15) {
  const date = toDate(value);
  return !!date && Date.now() - date.getTime() <= minutes * 60_000;
}

export async function fetchAllRows(entity, query, maxRecords = 20000) {
  const out = [];
  for (let skip = 0; skip < maxRecords; skip += 500) {
    const page = await entity.filter(query, '-created_date', 500, skip);
    out.push(...page);
    if (page.length < 500) break;
  }
  return out;
}

export async function ledgerTotal(base44, email) {
  const events = await fetchAllRows(base44.asServiceRole.entities.XpEvent, { user_email: email });
  return events.reduce((sum, event) => sum + (Number(event.amount) || 0), 0);
}

export async function writeTotal(base44, user, total) {
  const svc = base44.asServiceRole.entities;
  const existing = await svc.XpTotal.filter({ user_email: user.email }, '-created_date', 1);
  const payload = { user_email: user.email, user_id: user.id || '', total, synced_at: new Date().toISOString() };
  if (existing[0]) await svc.XpTotal.update(existing[0].id, payload);
  else await svc.XpTotal.create(payload);
  if (user.id) await svc.User.update(user.id, { glow_score: total });
  return total;
}

export async function syncUserXp(base44, user) {
  const total = await ledgerTotal(base44, user.email);
  return writeTotal(base44, user, total);
}

// Idempotent award: one XpEvent per (user, reference_id). Returns the new verified total.
export async function awardXp(base44, user, { source, reference_id, amount, note = '' }) {
  const value = Number(amount) || 0;
  if (value <= 0) return { awarded: 0, duplicate: false, total: await ledgerTotal(base44, user.email) };
  const svc = base44.asServiceRole.entities;
  const existing = await svc.XpEvent.filter({ user_email: user.email, reference_id }, '-created_date', 1);
  if (existing.length) return { awarded: 0, duplicate: true, total: await ledgerTotal(base44, user.email) };
  await svc.XpEvent.create({ user_email: user.email, user_id: user.id || '', source, reference_id, amount: value, note: String(note).slice(0, 300) });
  const total = await syncUserXp(base44, user);
  return { awarded: value, duplicate: false, total };
}