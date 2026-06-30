import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DEFAULT_RECOVERY_CAP = 50;
const MIN_RECOVERY_SCORE = 4;

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function addScore(scoreMap, followerEmail, followingEmail, points) {
  const follower = normalizeEmail(followerEmail);
  const following = normalizeEmail(followingEmail);
  if (!follower || !following || follower === following) return;
  if (!scoreMap.has(follower)) scoreMap.set(follower, new Map());
  const userScores = scoreMap.get(follower);
  userScores.set(following, (userScores.get(following) || 0) + points);
}

async function listAll(entity, sort = '-created_date') {
  const all = [];
  let skip = 0;
  const limit = 500;
  while (true) {
    const rows = await entity.list(sort, limit, skip);
    all.push(...rows);
    if (rows.length < limit) break;
    skip += limit;
  }
  return all;
}

async function bulkUpdate(entity, rows) {
  for (let i = 0; i < rows.length; i += 500) {
    await entity.bulkUpdate(rows.slice(i, i + 500));
  }
}

async function bulkCreate(entity, rows) {
  for (let i = 0; i < rows.length; i += 100) {
    await entity.bulkCreate(rows.slice(i, i + 100));
  }
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

    const dryRun = payload.dry_run === true;
    const recoverOldUsers = payload.recover_old_users === true;
    const recoveryCap = Math.max(1, Math.min(Number(payload.recovery_cap || DEFAULT_RECOVERY_CAP), 50));

    const users = await listAll(base44.asServiceRole.entities.User);
    const leaders = await listAll(base44.asServiceRole.entities.ManagedLeaderAccount).catch(() => []);
    const usersById = new Map(users.map(user => [user.id, user]));
    const usersByEmail = new Map(users.map(user => [normalizeEmail(user.email), user]).filter(([email]) => email));
    const leadersByEmail = new Map(leaders.map(leader => [normalizeEmail(leader.leader_email), leader]).filter(([email]) => email));
    const leaderEmails = new Set(leadersByEmail.keys());
    const validEmails = new Set([...usersByEmail.keys(), ...leaderEmails]);

    const follows = await listAll(base44.asServiceRole.entities.Follow);
    const followUpdates = [];
    const groupedFollowIds = new Map();
    const existingPairs = new Set();
    const currentFollowingByUser = new Map();

    for (const follow of follows) {
      const patch = { id: follow.id };
      let changed = false;
      let followerEmail = normalizeEmail(follow.follower_email);
      let followingEmail = normalizeEmail(follow.following_email);

      if (!followerEmail && follow.follower_id && usersById.get(follow.follower_id)?.email) {
        followerEmail = normalizeEmail(usersById.get(follow.follower_id).email);
        patch.follower_email = followerEmail;
        changed = true;
      }

      if (!followingEmail && follow.following_id && usersById.get(follow.following_id)?.email) {
        followingEmail = normalizeEmail(usersById.get(follow.following_id).email);
        patch.following_email = followingEmail;
        changed = true;
      }

      if (!follow.follower_id && usersByEmail.get(followerEmail)?.id) {
        patch.follower_id = usersByEmail.get(followerEmail).id;
        changed = true;
      }

      if (!follow.following_id && usersByEmail.get(followingEmail)?.id) {
        patch.following_id = usersByEmail.get(followingEmail).id;
        changed = true;
      }

      if (changed) followUpdates.push(patch);

      if (followerEmail && followingEmail) {
        const pairKey = `${followerEmail}->${followingEmail}`;
        existingPairs.add(pairKey);
        if (!currentFollowingByUser.has(followerEmail)) currentFollowingByUser.set(followerEmail, new Set());
        currentFollowingByUser.get(followerEmail).add(followingEmail);
        if (!groupedFollowIds.has(pairKey)) groupedFollowIds.set(pairKey, []);
        groupedFollowIds.get(pairKey).push({ id: follow.id, created_date: follow.created_date });
      }
    }

    const duplicateIds = [];
    for (const rows of groupedFollowIds.values()) {
      if (rows.length <= 1) continue;
      rows.sort((a, b) => String(b.created_date || '').localeCompare(String(a.created_date || '')));
      duplicateIds.push(...rows.slice(1).map(row => row.id));
    }

    if (!dryRun) {
      await bulkUpdate(base44.asServiceRole.entities.Follow, followUpdates);
      for (const id of duplicateIds) {
        await base44.asServiceRole.entities.Follow.delete(id);
      }
    }

    const recoveryCandidates = [];
    if (recoverOldUsers) {
      const scoreMap = new Map();
      const drops = await listAll(base44.asServiceRole.entities.GlowDrop).catch(() => []);
      const dropAuthorById = new Map(drops.map(drop => [drop.id, normalizeEmail(drop.user_email)]));
      const likes = await listAll(base44.asServiceRole.entities.GlowDropLike).catch(() => []);
      const comments = await listAll(base44.asServiceRole.entities.GlowDropComment).catch(() => []);
      const conversations = await listAll(base44.asServiceRole.entities.DirectConversation).catch(() => []);
      const memberships = await listAll(base44.asServiceRole.entities.GlowGroupMember).catch(() => []);

      for (const like of likes) {
        addScore(scoreMap, like.user_email, dropAuthorById.get(like.drop_id), 4);
      }

      for (const comment of comments) {
        addScore(scoreMap, comment.user_email, dropAuthorById.get(comment.drop_id), 5);
      }

      for (const conversation of conversations) {
        addScore(scoreMap, conversation.participant_a_email, conversation.participant_b_email, 8);
        addScore(scoreMap, conversation.participant_b_email, conversation.participant_a_email, 8);
      }

      const membersByGroup = new Map();
      for (const member of memberships) {
        const groupId = member.group_id;
        const email = normalizeEmail(member.user_email);
        if (!groupId || !email) continue;
        if (!membersByGroup.has(groupId)) membersByGroup.set(groupId, []);
        membersByGroup.get(groupId).push(email);
      }

      for (const members of membersByGroup.values()) {
        const uniqueMembers = [...new Set(members)].slice(0, 100);
        for (const follower of uniqueMembers) {
          for (const following of uniqueMembers) {
            addScore(scoreMap, follower, following, 2);
          }
        }
      }

      for (const follow of follows) {
        const followerEmail = normalizeEmail(follow.follower_email);
        const followingEmail = normalizeEmail(follow.following_email);
        addScore(scoreMap, followingEmail, followerEmail, 3);
      }

      for (const user of users) {
        const userEmail = normalizeEmail(user.email);
        if (!userEmail) continue;
        const currentFollowing = currentFollowingByUser.get(userEmail) || new Set();
        const slots = Math.max(0, recoveryCap - currentFollowing.size);
        if (slots === 0) continue;

        const scored = [...(scoreMap.get(userEmail) || new Map()).entries()]
          .filter(([email, score]) => email !== userEmail && validEmails.has(email) && !currentFollowing.has(email) && !existingPairs.has(`${userEmail}->${email}`) && score >= MIN_RECOVERY_SCORE)
          .sort((a, b) => b[1] - a[1])
          .slice(0, slots);

        for (const [followingEmail, score] of scored) {
          const followerId = usersByEmail.get(userEmail)?.id;
          const followingId = usersByEmail.get(followingEmail)?.id || leadersByEmail.get(followingEmail)?.id;
          if (!followerId || !followingId) continue;
          recoveryCandidates.push({
            follower_email: userEmail,
            following_email: followingEmail,
            follower_id: followerId,
            following_id: followingId,
            description: `Recovered by high-confidence activity score ${score}`
          });
          currentFollowing.add(followingEmail);
          existingPairs.add(`${userEmail}->${followingEmail}`);
        }
      }

      if (!dryRun) {
        await bulkCreate(base44.asServiceRole.entities.Follow, recoveryCandidates);
      }
    }

    const followsAfter = dryRun ? follows : await listAll(base44.asServiceRole.entities.Follow);
    const missingEmailAfter = followsAfter.filter(follow => !normalizeEmail(follow.follower_email) || !normalizeEmail(follow.following_email)).length;

    return Response.json({
      dry_run: dryRun,
      repair: {
        users_checked: users.length,
        leaders_checked: leaders.length,
        follow_records_checked: follows.length,
        records_repaired: dryRun ? 0 : followUpdates.length,
        records_would_repair: followUpdates.length,
        duplicates_deleted: dryRun ? 0 : duplicateIds.length,
        duplicates_would_delete: duplicateIds.length,
        missing_email_after: missingEmailAfter
      },
      recovery: {
        enabled: recoverOldUsers,
        cap_per_user: recoveryCap,
        min_score: MIN_RECOVERY_SCORE,
        follows_created: dryRun ? 0 : recoveryCandidates.length,
        follows_would_create: recoveryCandidates.length
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});