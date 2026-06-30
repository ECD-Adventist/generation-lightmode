import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));

    const users = await base44.asServiceRole.entities.User.list('-created_date', 10000);
    const leaders = await base44.asServiceRole.entities.ManagedLeaderAccount.list('-created_date', 1000).catch(() => []);
    const usersById = new Map(users.map((user) => [user.id, user]));
    const usersByEmail = new Map(users.filter((user) => user.email).map((user) => [String(user.email).toLowerCase(), user]));
    const leadersByEmail = new Map(leaders.filter((leader) => leader.leader_email).map((leader) => [String(leader.leader_email).toLowerCase(), leader]));

    const records = await base44.asServiceRole.entities.Follow.list('-created_date', 10000);

    const updates = [];
    const pairMap = new Map();
    const duplicateIds = [];

    for (const follow of records) {
      const patch = { id: follow.id };
      let changed = false;
      const followerById = follow.follower_id ? usersById.get(follow.follower_id) : null;
      const followingById = follow.following_id ? usersById.get(follow.following_id) : null;
      const followerByEmail = follow.follower_email ? usersByEmail.get(String(follow.follower_email).toLowerCase()) : null;
      const followingByEmail = follow.following_email
        ? usersByEmail.get(String(follow.following_email).toLowerCase()) || leadersByEmail.get(String(follow.following_email).toLowerCase())
        : null;

      if (!follow.follower_email && followerById?.email) {
        patch.follower_email = followerById.email;
        changed = true;
      }
      if (!follow.following_email && followingById?.email) {
        patch.following_email = followingById.email;
        changed = true;
      }
      if (!follow.follower_id && followerByEmail?.id) {
        patch.follower_id = followerByEmail.id;
        changed = true;
      }
      if (!follow.following_id && followingByEmail?.id) {
        patch.following_id = followingByEmail.id;
        changed = true;
      }

      const followerKey = String(patch.follower_email || follow.follower_email || follow.follower_id || '').toLowerCase();
      const followingKey = String(patch.following_email || follow.following_email || follow.following_id || '').toLowerCase();
      const pairKey = `${followerKey}->${followingKey}`;

      if (followerKey && followingKey) {
        if (pairMap.has(pairKey)) duplicateIds.push(follow.id);
        else pairMap.set(pairKey, follow.id);
      }

      if (changed) updates.push(patch);
    }

    for (let i = 0; i < updates.length; i += 500) {
      await base44.asServiceRole.entities.Follow.bulkUpdate(updates.slice(i, i + 500));
    }

    for (const id of duplicateIds) {
      await base44.asServiceRole.entities.Follow.delete(id);
    }

    return Response.json({
      success: true,
      checked: records.length,
      updated: updates.length,
      duplicates_removed: duplicateIds.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});