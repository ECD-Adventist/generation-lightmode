import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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

    if (!ADMIN_ROLES.has(caller.role)) {
      return Response.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const payload = await req.json();
    const leaderEmail = normalizeEmail(payload.leader_email);
    const dryRun = payload.dry_run === true;

    if (!leaderEmail) {
      return Response.json({ error: 'leader_email is required' }, { status: 400 });
    }

    const leaderAccounts = await base44.asServiceRole.entities.ManagedLeaderAccount.filter({ leader_email: leaderEmail }, '-created_date', 1);
    if (leaderAccounts.length === 0) {
      return Response.json({ error: 'Leader account not found' }, { status: 404 });
    }

    const users = await base44.asServiceRole.entities.User.list('-created_date', 10000);
    const activeUserEmails = users
      .map(user => normalizeEmail(user.email))
      .filter(email => email && email !== leaderEmail);

    const existingFollows = await base44.asServiceRole.entities.Follow.filter({ following_email: leaderEmail }, '-created_date', 10000);
    const existingFollowerEmails = new Set(existingFollows.map(follow => normalizeEmail(follow.follower_email)));

    const newFollows = activeUserEmails
      .filter(email => !existingFollowerEmails.has(email))
      .map(email => ({ follower_email: email, following_email: leaderEmail }));

    if (!dryRun && newFollows.length > 0) {
      for (let i = 0; i < newFollows.length; i += 100) {
        await base44.asServiceRole.entities.Follow.bulkCreate(newFollows.slice(i, i + 100));
      }
    }

    return Response.json({
      leader_email: leaderEmail,
      dry_run: dryRun,
      total_users_checked: activeUserEmails.length,
      already_following: activeUserEmails.length - newFollows.length,
      created: dryRun ? 0 : newFollows.length,
      would_create: newFollows.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});