import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { authorizeSchedulerOrAdmin } from '../../shared/schedulerAuth.ts';

const DEFAULT_RECOVERY_CAP = 50;
const MIN_RECOVERY_SCORE = 4;

// Follow records are ID-based only (email fields were removed as PII).
// Emails from other entities are mapped to user/leader IDs for scoring.

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function addScore(scoreMap, followerId, followingId, points) {
  if (!followerId || !followingId || followerId === followingId) return;
  if (!scoreMap.has(followerId)) scoreMap.set(followerId, new Map());
  const userScores = scoreMap.get(followerId);
  userScores.set(followingId, (userScores.get(followingId) || 0) + points);
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

async function bulkCreate(entity, rows) {
  for (let i = 0; i < rows.length; i += 100) {
    await entity.bulkCreate(rows.slice(i, i + 100));
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const authorized = await authorizeSchedulerOrAdmin(base44, req);
    if (!authorized) return Response.json({ error: 'Forbidden' }, { status: 403 });

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
    const usersByEmail = new Map(users.filter(u => u.email).map(u => [normalizeEmail(u.email), u]));
    const leadersByEmail = new Map(leaders.filter(l => l.leader_email).map(l => [normalizeEmail(l.leader_email), l]));
    const idByEmail = (email) => usersByEmail.get(email)?.id || leadersByEmail.get(email)?.id || null;
    const validIds = new Set([...users.map(u => u.id), ...leaders.map(l => l.id)]);

    const follows = await listAll(base44.asServiceRole.entities.Follow);

    // Group by (follower_id -> following_id) to find duplicates; track existing pairs.
    const grouped = new Map();
    const existingPairs = new Set();
    const currentFollowingByUser = new Map();
    let invalidRecords = 0;

    for (const follow of follows) {
      if (!follow.follower_id || !follow.following_id) {
        invalidRecords += 1;
        continue;
      }
      const pairKey = `${follow.follower_id}->${follow.following_id}`;
      existingPairs.add(pairKey);
      if (!currentFollowingByUser.has(follow.follower_id)) currentFollowingByUser.set(follow.follower_id, new Set());
      currentFollowingByUser.get(follow.follower_id).add(follow.following_id);
      if (!grouped.has(pairKey)) grouped.set(pairKey, []);
      grouped.get(pairKey).push({ id: follow.id, created_date: follow.created_date });
    }

    const duplicateIds = [];
    for (const rows of grouped.values()) {
      if (rows.length <= 1) continue;
      rows.sort((a, b) => String(b.created_date || '').localeCompare(String(a.created_date || '')));
      duplicateIds.push(...rows.slice(1).map(row => row.id));
    }

    if (!dryRun) {
      for (const id of duplicateIds) {
        await base44.asServiceRole.entities.Follow.delete(id);
      }
    }

    const recoveryCandidates = [];
    if (recoverOldUsers) {
      const scoreMap = new Map();
      const drops = await listAll(base44.asServiceRole.entities.GlowDrop).catch(() => []);
      const dropAuthorIdByDropId = new Map(drops.map(drop => [drop.id, idByEmail(normalizeEmail(drop.user_email))]));
      const likes = await listAll(base44.asServiceRole.entities.GlowDropLike).catch(() => []);
      const comments = await listAll(base44.asServiceRole.entities.GlowDropComment).catch(() => []);
      const conversations = await listAll(base44.asServiceRole.entities.DirectConversation).catch(() => []);
      const memberships = await listAll(base44.asServiceRole.entities.GlowGroupMember).catch(() => []);

      for (const like of likes) {
        addScore(scoreMap, idByEmail(normalizeEmail(like.user_email)), dropAuthorIdByDropId.get(like.drop_id), 4);
      }

      for (const comment of comments) {
        addScore(scoreMap, idByEmail(normalizeEmail(comment.user_email)), dropAuthorIdByDropId.get(comment.drop_id), 5);
      }

      for (const conversation of conversations) {
        const idA = idByEmail(normalizeEmail(conversation.participant_a_email));
        const idB = idByEmail(normalizeEmail(conversation.participant_b_email));
        addScore(scoreMap, idA, idB, 8);
        addScore(scoreMap, idB, idA, 8);
      }

      const membersByGroup = new Map();
      for (const member of memberships) {
        const groupId = member.group_id;
        const memberId = idByEmail(normalizeEmail(member.user_email));
        if (!groupId || !memberId) continue;
        if (!membersByGroup.has(groupId)) membersByGroup.set(groupId, []);
        membersByGroup.get(groupId).push(memberId);
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
        addScore(scoreMap, follow.following_id, follow.follower_id, 3);
      }

      for (const user of users) {
        if (!user.id) continue;
        const currentFollowing = currentFollowingByUser.get(user.id) || new Set();
        const slots = Math.max(0, recoveryCap - currentFollowing.size);
        if (slots === 0) continue;

        const scored = [...(scoreMap.get(user.id) || new Map()).entries()]
          .filter(([followingId, score]) => followingId !== user.id && validIds.has(followingId) && !currentFollowing.has(followingId) && !existingPairs.has(`${user.id}->${followingId}`) && score >= MIN_RECOVERY_SCORE)
          .sort((a, b) => b[1] - a[1])
          .slice(0, slots);

        for (const [followingId, score] of scored) {
          recoveryCandidates.push({
            follower_id: user.id,
            following_id: followingId,
            description: `Recovered by high-confidence activity score ${score}`
          });
          currentFollowing.add(followingId);
          existingPairs.add(`${user.id}->${followingId}`);
        }
      }

      if (!dryRun) {
        await bulkCreate(base44.asServiceRole.entities.Follow, recoveryCandidates);
      }
    }

    return Response.json({
      dry_run: dryRun,
      repair: {
        users_checked: users.length,
        leaders_checked: leaders.length,
        follow_records_checked: follows.length,
        invalid_records_missing_ids: invalidRecords,
        duplicates_deleted: dryRun ? 0 : duplicateIds.length,
        duplicates_would_delete: duplicateIds.length
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