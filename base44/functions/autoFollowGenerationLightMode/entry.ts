import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ACCOUNT_EMAIL = 'system@lightmode.com';
const ACCOUNT_ID = 'official-generation-lightmode';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function ensureFollow(base44, followerUser) {
  const normalizedFollower = normalizeEmail(followerUser?.email || followerUser?.user_email);
  const followerId = followerUser?.id || followerUser?.user_id || followerUser?.created_by_id;

  if (!normalizedFollower || normalizedFollower === ACCOUNT_EMAIL || !followerId) {
    return { checked: 0, created: 0, repaired: 0, skipped: 1 };
  }

  const existing = await base44.asServiceRole.entities.Follow.filter({
    follower_email: normalizedFollower,
    following_email: ACCOUNT_EMAIL
  }, '-created_date', 10);

  if (existing.length > 0) {
    let repaired = 0;
    for (const follow of existing) {
      const updates = {};
      if (!follow.follower_id) updates.follower_id = followerId;
      if (!follow.following_id) updates.following_id = ACCOUNT_ID;
      if (Object.keys(updates).length > 0) {
        await base44.asServiceRole.entities.Follow.update(follow.id, updates);
        repaired += 1;
      }
    }
    return { checked: 1, created: 0, repaired, skipped: 1 };
  }

  await base44.asServiceRole.entities.Follow.create({
    follower_id: followerId,
    following_id: ACCOUNT_ID,
    follower_email: normalizedFollower,
    following_email: ACCOUNT_EMAIL
  });

  return { checked: 1, created: 1, repaired: 0, skipped: 0 };
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
    if (eventUserEmail) {
      const eventUserId = payload?.data?.id || payload?.id || payload?.user_id;
      let eventUser = eventUserId ? { id: eventUserId, email: eventUserEmail } : null;

      if (!eventUser?.id) {
        const matches = await base44.asServiceRole.entities.User.filter({ email: eventUserEmail }, '-created_date', 1);
        eventUser = matches[0] || null;
      }

      const result = await ensureFollow(base44, eventUser);
      return Response.json({ mode: 'single_user', following_email: ACCOUNT_EMAIL, ...result });
    }

    const users = await base44.asServiceRole.entities.User.list('-created_date', 10000);
    const eligibleUsers = users
      .map(user => ({ ...user, email: normalizeEmail(user.email) }))
      .filter(user => user.id && user.email && user.email !== ACCOUNT_EMAIL);

    const existingFollows = await base44.asServiceRole.entities.Follow.filter({ following_email: ACCOUNT_EMAIL }, '-created_date', 10000);
    const existingByFollowerEmail = new Map();
    existingFollows.forEach(follow => {
      const email = normalizeEmail(follow.follower_email);
      if (email && !existingByFollowerEmail.has(email)) existingByFollowerEmail.set(email, follow);
    });

    const userByEmail = new Map(eligibleUsers.map(user => [user.email, user]));
    const repairUpdates = existingFollows
      .map(follow => {
        const user = userByEmail.get(normalizeEmail(follow.follower_email));
        if (!user) return null;
        const updates = { id: follow.id };
        if (!follow.follower_id) updates.follower_id = user.id;
        if (!follow.following_id) updates.following_id = ACCOUNT_ID;
        return Object.keys(updates).length > 1 ? updates : null;
      })
      .filter(Boolean);

    const newFollows = eligibleUsers
      .filter(user => !existingByFollowerEmail.has(user.email))
      .map(user => ({
        follower_id: user.id,
        following_id: ACCOUNT_ID,
        follower_email: user.email,
        following_email: ACCOUNT_EMAIL
      }));

    for (let i = 0; i < repairUpdates.length; i += 100) {
      await base44.asServiceRole.entities.Follow.bulkUpdate(repairUpdates.slice(i, i + 100));
    }

    for (let i = 0; i < newFollows.length; i += 100) {
      await base44.asServiceRole.entities.Follow.bulkCreate(newFollows.slice(i, i + 100));
    }

    return Response.json({
      mode: 'full_sync',
      following_email: ACCOUNT_EMAIL,
      total_users_checked: eligibleUsers.length,
      already_following: eligibleUsers.length - newFollows.length,
      repaired: repairUpdates.length,
      created: newFollows.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});