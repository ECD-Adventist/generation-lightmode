import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';

const ADMIN_ROLES = new Set([
  'admin',
  'super_admin',
  'ecd_admin',
  'country_admin',
  'union_admin',
  'conference_field_admin',
  'church_admin',
  'moderator'
]);

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();

    if (!caller) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimited = await enforceApiRateLimit(base44, req, caller);
    if (rateLimited) return rateLimited;

    if (!ADMIN_ROLES.has(caller.role)) {
      return Response.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const validated = await readValidatedJson(req, {
      leader_email: { type: 'string', required: true, minLength: 3, maxLength: 254 },
      dry_run: { type: 'boolean' },
    });
    if (validated.response) return validated.response;
    const payload = validated.data;
    const leaderEmail = normalizeEmail(payload.leader_email);
    const dryRun = payload.dry_run === true;

    if (!leaderEmail) {
      return Response.json({ error: 'leader_email is required' }, { status: 400 });
    }

    const leaderAccounts = await base44.asServiceRole.entities.ManagedLeaderAccount.filter({ leader_email: leaderEmail }, '-created_date', 1);
    if (leaderAccounts.length === 0) {
      return Response.json({ error: 'Leader account not found' }, { status: 404 });
    }

    // Leaders have no User record — use the ManagedLeaderAccount id as following_id
    // (Follow entity requires both follower_id and following_id).
    const leaderAccountId = leaderAccounts[0].id;

    const users = await base44.asServiceRole.entities.User.list('-created_date', 10000);
    const activeUsers = users
      .map(user => ({ id: user.id, email: normalizeEmail(user.email) }))
      .filter(user => user.id && user.email && user.email !== leaderEmail);

    const existingFollows = await base44.asServiceRole.entities.Follow.filter({ following_id: leaderAccountId }, '-created_date', 10000);
    const existingFollowerIds = new Set(existingFollows.map(follow => follow.follower_id));

    const newFollows = activeUsers
      .filter(user => !existingFollowerIds.has(user.id))
      .map(user => ({
        follower_id: user.id,
        following_id: leaderAccountId
      }));

    if (!dryRun && newFollows.length > 0) {
      for (let i = 0; i < newFollows.length; i += 100) {
        await base44.asServiceRole.entities.Follow.bulkCreate(newFollows.slice(i, i + 100));
      }
    }

    return Response.json({
      leader_email: leaderEmail,
      dry_run: dryRun,
      total_users_checked: activeUsers.length,
      already_following: activeUsers.length - newFollows.length,
      created: dryRun ? 0 : newFollows.length,
      would_create: newFollows.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});