import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';
import { logAdminAction, logPermissionDenied } from '../../shared/securityEvents.ts';
import { XP_RULES, MILESTONE_REWARDS, QUIZ_MAX_XP, fetchAllRows } from '../../shared/xp.ts';

// Admin-only. Rebuilds every user's XP ledger from VERIFIED activity records and
// overwrites glow_score with the ledger total. Defaults to dry_run so nothing is
// written until an admin explicitly confirms.
//
// Verified sources: original Glow Drops (+5), daily challenges (share_verse +10,
// like_drops +5, comment +5), completed devotion days (+10), challenge submissions
// (challenge reward), milestones (server reward table), Faith Quiz personal best
// (capped at the game's real maximum). Follows are NOT credited retroactively —
// most historical follows were created automatically at signup, not by the user.

const DAILY = { share_verse: XP_RULES.daily_share_verse, like_drops: XP_RULES.daily_like_drops, comment: XP_RULES.daily_comment };

function buildEvents(user, data) {
  const email = user.email;
  const events = [];
  // Field lengths must respect the XpEvent schema, or the batch write is rejected.
  const push = (source, reference_id, amount, note) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    events.push({
      user_email: email,
      user_id: user.id,
      source: String(source).slice(0, 60),
      reference_id: String(reference_id).slice(0, 200),
      amount,
      note: String(note || '').slice(0, 300),
    });
  };
  (data.drops.get(email) || []).forEach((drop) => {
    if (!drop.original_drop_id) push('post_drop', `post_${drop.id}`, XP_RULES.post_drop, 'Posted a Glow Drop');
  });
  const seenDaily = new Set();
  (data.daily.get(email) || []).forEach((row) => {
    const amount = DAILY[row.challenge_id];
    const ref = `daily_${row.challenge_id}_${row.date_string}`;
    if (amount && !seenDaily.has(ref)) { seenDaily.add(ref); push(`daily_${row.challenge_id}`, ref, amount, `Daily challenge: ${row.challenge_id}`); }
  });
  const seenDevotion = new Set();
  (data.devotions.get(email) || []).forEach((entry) => {
    const ref = `devotion_${entry.plan_id}_${entry.day_number}`;
    if (entry.completed && !seenDevotion.has(ref)) { seenDevotion.add(ref); push('devotion_day', ref, XP_RULES.devotion_day, `Devotion ${entry.plan_id} day ${entry.day_number}`); }
  });
  const seenChallenge = new Set();
  (data.submissions.get(email) || []).forEach((sub) => {
    const challenge = data.challenges.get(sub.challenge_id);
    if (challenge && !seenChallenge.has(sub.challenge_id)) { seenChallenge.add(sub.challenge_id); push('challenge', `challenge_${sub.challenge_id}`, Number(challenge.points_reward) || 0, `Challenge: ${challenge.title || ''}`); }
  });
  const seenMilestone = new Set();
  (data.milestones.get(email) || []).forEach((m) => {
    const reward = MILESTONE_REWARDS[m.milestone_key];
    if (reward && !seenMilestone.has(m.milestone_key)) { seenMilestone.add(m.milestone_key); push('milestone', `milestone_${m.milestone_key}`, reward.xp, reward.title); }
  });
  const quiz = Math.min(Math.max(Number(user.quiz_score) || 0, 0), QUIZ_MAX_XP);
  push('quiz_legacy', 'quiz_legacy', quiz, 'Faith Quiz personal best (pre-ledger)');
  return events;
}

function groupBy(rows, keyField) {
  const map = new Map();
  rows.forEach((row) => {
    const key = row[keyField];
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  });
  return map;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const rateLimited = await enforceApiRateLimit(base44, req, caller);
    if (rateLimited) return rateLimited;
    if (!['admin', 'super_admin'].includes(caller.role)) {
      await logPermissionDenied(base44, req, caller, 'xp', 'recompute_ledger');
      return Response.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const validated = await readValidatedJson(req, {
      dry_run: { type: 'boolean' },
      skip: { type: 'number', integer: true, min: 0, max: 100000 },
      limit: { type: 'number', integer: true, min: 1, max: 100 },
      user_email: { type: 'string', maxLength: 320 },
    }, { allowEmpty: true });
    if (validated.response) return validated.response;
    const dryRun = validated.data.dry_run !== false;
    const skip = validated.data.skip || 0;
    const limit = validated.data.limit || 50;
    const svc = base44.asServiceRole.entities;

    const rawUsers = validated.data.user_email
      ? await svc.User.filter({ email: validated.data.user_email }, '-created_date', 1)
      : await svc.User.list('created_date', limit, skip);
    // A record without an email or id must never reach deleteMany — an undefined
    // filter value would match far more than the intended user.
    const users = rawUsers.filter((u) => u?.email && u?.id);
    if (!users.length) return Response.json({ success: true, dry_run: dryRun, processed: 0, has_more: false, changes: [] });

    const emails = new Set(users.map((u) => u.email));
    const [drops, daily, devotions, submissions, milestones, challenges, existingEvents, existingTotals] = await Promise.all([
      fetchAllRows(svc.GlowDrop, {}, 60000),
      fetchAllRows(svc.UserDailyChallenge, {}, 60000),
      fetchAllRows(svc.DevotionEntry, {}, 20000),
      fetchAllRows(svc.ChallengeSubmission, {}, 20000),
      fetchAllRows(svc.UserMilestone, {}, 20000),
      fetchAllRows(svc.Challenge, {}, 5000),
      dryRun ? Promise.resolve([]) : fetchAllRows(svc.XpEvent, {}, 60000),
      dryRun ? Promise.resolve([]) : fetchAllRows(svc.XpTotal, {}, 60000),
    ]);
    const hadEvents = new Set(existingEvents.filter((e) => emails.has(e.user_email)).map((e) => e.user_email));
    const totalIdByEmail = new Map(existingTotals.map((t) => [t.user_email, t.id]));
    const data = {
      drops: groupBy(drops.filter((d) => emails.has(d.user_email)), 'user_email'),
      daily: groupBy(daily.filter((d) => emails.has(d.user_email)), 'user_email'),
      devotions: groupBy(devotions.filter((d) => emails.has(d.user_email)), 'user_email'),
      submissions: groupBy(submissions.filter((d) => emails.has(d.user_email)), 'user_email'),
      milestones: groupBy(milestones.filter((d) => emails.has(d.user_email)), 'user_email'),
      challenges: new Map(challenges.map((c) => [c.id, c])),
    };

    const changes = [];
    const now = new Date().toISOString();
    const allEvents = [];
    const totalCreates = [];
    const totalUpdates = [];
    const userUpdates = [];
    for (const user of users) {
      const events = buildEvents(user, data);
      const verified = events.reduce((sum, e) => sum + e.amount, 0);
      const before = Number(user.glow_score) || 0;
      changes.push({ user_id: user.id, name: user.display_name || user.full_name || user.username || '', country: user.country || '', before, after: verified, delta: verified - before, events: events.length });
      if (dryRun) continue;
      // Clear only where a ledger already exists, then rebuild it from verified activity.
      if (hadEvents.has(user.email)) await svc.XpEvent.deleteMany({ user_email: user.email });
      allEvents.push(...events);
      const totalId = totalIdByEmail.get(user.email);
      // Only track a total row when there is something to track, or one already exists.
      if (verified > 0 || totalId) {
        const totalPayload = { user_email: user.email, user_id: user.id || '', total: verified, synced_at: now };
        if (totalId) totalUpdates.push({ id: totalId, payload: totalPayload });
        else totalCreates.push(totalPayload);
      }
      if (before !== verified) userUpdates.push({ id: user.id, glow_score: verified });
    }

    if (!dryRun) {
      // Ledger rows are safe to bulk-write; totals and user scores are written
      // individually because the bulk endpoints reject these payloads.
      for (let i = 0; i < allEvents.length; i += 500) await svc.XpEvent.bulkCreate(allEvents.slice(i, i + 500));
      for (const payload of totalCreates) await svc.XpTotal.create(payload);
      for (const row of totalUpdates) await svc.XpTotal.update(row.id, row.payload);
      for (const row of userUpdates) await svc.User.update(row.id, { glow_score: row.glow_score });
    }

    if (!dryRun) {
      const reset = changes.filter((c) => c.delta !== 0).length;
      await logAdminAction(base44, req, caller, 'xp', 'recompute_ledger', `Rebuilt XP ledger for ${users.length} users (skip ${skip}); ${reset} scores changed`);
    }

    return Response.json({
      success: true,
      dry_run: dryRun,
      processed: users.length,
      skip,
      has_more: !validated.data.user_email && rawUsers.length === limit,
      skipped_invalid: rawUsers.length - users.length,
      changed: changes.filter((c) => c.delta !== 0).length,
      largest_reductions: [...changes].sort((a, b) => a.delta - b.delta).slice(0, 10),
      changes: changes.length <= 50 ? changes : undefined,
    });
  } catch (error) {
    let detail;
    try {
      detail = JSON.stringify(error, Object.getOwnPropertyNames(error || {})).slice(0, 1500);
    } catch {
      detail = error?.message || 'unknown error';
    }
    console.error('recomputeXpLedger failed:', detail);
    return Response.json({ error: 'Unable to recompute XP ledger', detail }, { status: 500 });
  }
}