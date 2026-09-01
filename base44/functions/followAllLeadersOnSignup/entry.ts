import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { mirrorToSupabase } from '../../shared/supabase.ts';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let caller = null;
    try { caller = await base44.auth.me(); } catch (_error) { caller = null; }
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const userId = String(payload?.user_id || '').trim();
    const email = normalizeEmail(payload?.email);
    const dryRun = payload?.dry_run === true;

    if (!userId) return Response.json({ error: 'user_id is required' }, { status: 400 });
    const isAdmin = caller.role === 'admin' || caller.role === 'super_admin';
    if (caller.id !== userId && !isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const signupUser = await base44.asServiceRole.entities.User.get(userId);
    if (!signupUser || (email && normalizeEmail(signupUser.email) !== email)) {
      return Response.json({ error: 'Signup user not found' }, { status: 404 });
    }

    const leaders = [];
    let skip = 0;
    while (true) {
      const page = await base44.asServiceRole.entities.ManagedLeaderAccount.filter({ active: true }, '-created_date', 100, skip);
      leaders.push(...page);
      if (page.length < 100) break;
      skip += 100;
    }

    const eligibleLeaders = leaders.filter(leader => leader.id && normalizeEmail(leader.leader_email) !== normalizeEmail(signupUser.email));
    const existing = await base44.asServiceRole.entities.Follow.filter({ follower_id: signupUser.id }, '-created_date', 5000);
    const followedIds = new Set(existing.map(follow => follow.following_id).filter(Boolean));
    const missing = eligibleLeaders
      .filter(leader => !followedIds.has(leader.id))
      .map(leader => ({ follower_id: signupUser.id, following_id: leader.id }));

    if (!dryRun && missing.length > 0) {
      for (let index = 0; index < missing.length; index += 100) {
        const created = await base44.asServiceRole.entities.Follow.bulkCreate(missing.slice(index, index + 100));
        for (const follow of created) await mirrorToSupabase('follows', follow);
      }
    }

    return Response.json({
      user_id: signupUser.id,
      leaders_checked: eligibleLeaders.length,
      already_following: eligibleLeaders.length - missing.length,
      created: dryRun ? 0 : missing.length,
      would_create: missing.length,
      dry_run: dryRun
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}