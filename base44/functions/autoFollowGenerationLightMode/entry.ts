import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ACCOUNT_EMAIL = 'system@lightmode.com';
const ACCOUNT_ID = 'official-generation-lightmode';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

// Follow records are ID-based only (email fields were removed as PII).
async function ensureFollow(base44, followerUser) {
  const followerId = followerUser?.id || followerUser?.user_id || followerUser?.created_by_id;
  const followerEmail = normalizeEmail(followerUser?.email || followerUser?.user_email);

  if (!followerId || followerEmail === ACCOUNT_EMAIL) {
    return { checked: 0, created: 0, skipped: 1 };
  }

  const existing = await base44.asServiceRole.entities.Follow.filter({
    follower_id: followerId,
    following_id: ACCOUNT_ID
  }, '-created_date', 1);

  if (existing.length > 0) {
    return { checked: 1, created: 0, skipped: 1 };
  }

  await base44.asServiceRole.entities.Follow.create({
    follower_id: followerId,
    following_id: ACCOUNT_ID
  });

  return { checked: 1, created: 1, skipped: 0 };
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

    const eventUserEmail = normalizeEmail(payload?.data?.email || payload?.email || payload?.user_email);
    const eventUserId = payload?.data?.id || payload?.id || payload?.user_id;

    if (eventUserEmail || eventUserId) {
      let eventUser = eventUserId ? { id: eventUserId, email: eventUserEmail } : null;

      if (!eventUser?.id && eventUserEmail) {
        const matches = await base44.asServiceRole.entities.User.filter({ email: eventUserEmail }, '-created_date', 1);
        eventUser = matches[0] || null;
      }

      const result = await ensureFollow(base44, eventUser);
      return Response.json({ mode: 'single_user', following_id: ACCOUNT_ID, ...result });
    }

    const users = await base44.asServiceRole.entities.User.list('-created_date', 10000);
    const eligibleUsers = users.filter(user => user.id && normalizeEmail(user.email) !== ACCOUNT_EMAIL);

    const existingFollows = await base44.asServiceRole.entities.Follow.filter({ following_id: ACCOUNT_ID }, '-created_date', 10000);
    const existingFollowerIds = new Set(existingFollows.map(follow => follow.follower_id).filter(Boolean));

    const newFollows = eligibleUsers
      .filter(user => !existingFollowerIds.has(user.id))
      .map(user => ({
        follower_id: user.id,
        following_id: ACCOUNT_ID
      }));

    for (let i = 0; i < newFollows.length; i += 100) {
      await base44.asServiceRole.entities.Follow.bulkCreate(newFollows.slice(i, i + 100));
    }

    return Response.json({
      mode: 'full_sync',
      following_id: ACCOUNT_ID,
      total_users_checked: eligibleUsers.length,
      already_following: eligibleUsers.length - newFollows.length,
      created: newFollows.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});