import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ACCOUNT_EMAIL = 'system@lightmode.com';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function ensureFollow(base44, followerEmail) {
  const normalizedFollower = normalizeEmail(followerEmail);
  if (!normalizedFollower || normalizedFollower === ACCOUNT_EMAIL) {
    return { checked: 0, created: 0, skipped: 1 };
  }

  const existing = await base44.asServiceRole.entities.Follow.filter({
    follower_email: normalizedFollower,
    following_email: ACCOUNT_EMAIL
  }, '-created_date', 1);

  if (existing.length > 0) {
    return { checked: 1, created: 0, skipped: 1 };
  }

  await base44.asServiceRole.entities.Follow.create({
    follower_email: normalizedFollower,
    following_email: ACCOUNT_EMAIL
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

    const eventUserEmail = payload?.data?.email || payload?.email || payload?.user_email;
    if (eventUserEmail) {
      const result = await ensureFollow(base44, eventUserEmail);
      return Response.json({ mode: 'single_user', following_email: ACCOUNT_EMAIL, ...result });
    }

    const users = await base44.asServiceRole.entities.User.list('-created_date', 10000);
    const userEmails = users
      .map(user => normalizeEmail(user.email))
      .filter(email => email && email !== ACCOUNT_EMAIL);

    const existingFollows = await base44.asServiceRole.entities.Follow.filter({ following_email: ACCOUNT_EMAIL }, '-created_date', 10000);
    const existingFollowerEmails = new Set(existingFollows.map(follow => normalizeEmail(follow.follower_email)));

    const newFollows = userEmails
      .filter(email => !existingFollowerEmails.has(email))
      .map(email => ({ follower_email: email, following_email: ACCOUNT_EMAIL }));

    for (let i = 0; i < newFollows.length; i += 100) {
      await base44.asServiceRole.entities.Follow.bulkCreate(newFollows.slice(i, i + 100));
    }

    return Response.json({
      mode: 'full_sync',
      following_email: ACCOUNT_EMAIL,
      total_users_checked: userEmails.length,
      already_following: userEmails.length - newFollows.length,
      created: newFollows.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});