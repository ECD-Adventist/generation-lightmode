import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

const ACCOUNT_EMAIL = 'system@lightmode.com';
const ACCOUNT_ID = 'official:generation-lightmode';
const DEFAULT_BATCH_LIMIT = 25;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function followPayload(user) {
  const followerEmail = normalizeEmail(user?.email);
  return {
    follower_id: user.id,
    following_id: ACCOUNT_ID,
    follower_email: followerEmail,
    following_email: ACCOUNT_EMAIL,
    description: 'Auto-follow official Generation LightMode page'
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let payload = {};

    try {
      payload = await req.json();
    } catch (_error) {
      payload = {};
    }

    const users = await base44.asServiceRole.entities.User.list('-created_date', 10000);
    const validUsers = users.filter(user => user?.id && normalizeEmail(user.email) && normalizeEmail(user.email) !== ACCOUNT_EMAIL);
    const eventUserEmail = normalizeEmail(payload?.data?.email || payload?.email || payload?.user_email);

    if (eventUserEmail) {
      const eventUser = validUsers.find(user => normalizeEmail(user.email) === eventUserEmail);
      if (!eventUser) {
        return Response.json({ mode: 'single_user', following_email: ACCOUNT_EMAIL, following_id: ACCOUNT_ID, checked: 0, created: 0, skipped: 1, reason: 'User not found' });
      }

      const existing = await base44.asServiceRole.entities.Follow.filter({ follower_id: eventUser.id, following_id: ACCOUNT_ID }, '-created_date', 1);
      if (existing.length > 0) {
        return Response.json({ mode: 'single_user', following_email: ACCOUNT_EMAIL, following_id: ACCOUNT_ID, checked: 1, created: 0, skipped: 1 });
      }

      await base44.asServiceRole.entities.Follow.create(followPayload(eventUser));
      return Response.json({ mode: 'single_user', following_email: ACCOUNT_EMAIL, following_id: ACCOUNT_ID, checked: 1, created: 1, skipped: 0 });
    }

    const existingFollows = await base44.asServiceRole.entities.Follow.filter({ following_id: ACCOUNT_ID }, '-created_date', 10000);
    const existingFollowerIds = new Set(existingFollows.map(follow => follow.follower_id).filter(Boolean));
    const missingUsers = validUsers.filter(user => !existingFollowerIds.has(user.id));
    const batchLimit = Math.max(1, Math.min(Number(payload?.limit || DEFAULT_BATCH_LIMIT), DEFAULT_BATCH_LIMIT));
    const batch = missingUsers.slice(0, batchLimit).map(followPayload);

    if (payload?.dry_run) {
      return Response.json({
        mode: 'full_sync',
        dry_run: true,
        following_email: ACCOUNT_EMAIL,
        following_id: ACCOUNT_ID,
        total_users_checked: validUsers.length,
        already_following: validUsers.length - missingUsers.length,
        pending_to_create: missingUsers.length,
        batch_size: batch.length
      });
    }

    if (batch.length > 0) {
      await base44.asServiceRole.entities.Follow.bulkCreate(batch);
    }

    return Response.json({
      mode: 'full_sync',
      following_email: ACCOUNT_EMAIL,
      following_id: ACCOUNT_ID,
      total_users_checked: validUsers.length,
      already_following: validUsers.length - missingUsers.length,
      created: batch.length,
      remaining: Math.max(0, missingUsers.length - batch.length)
    });
  } catch (error) {
    const message = error?.message || 'Unknown error';
    if (message.toLowerCase().includes('rate limit')) {
      return Response.json({ success: true, skipped: true, reason: 'Rate limited; will continue on the next scheduled run' });
    }
    return Response.json({ error: message }, { status: 500 });
  }
});