import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { enforceApiRateLimit } from '../../shared/apiSecurity.ts';
import { normalizeTerritoryName } from '../../shared/territoryNames.ts';

const PAGE = 500;
const MAX_RECORDS = 60000;

async function fetchAll(entity, sort = '-created_date') {
  const out = [];
  let skip = 0;
  while (skip < MAX_RECORDS) {
    const batch = await entity.list(sort, PAGE, skip);
    out.push(...batch);
    if (batch.length < PAGE) break;
    skip += PAGE;
  }
  return out;
}

function blank(name) {
  return {
    territory_name: name,
    total_glow_score: 0,
    total_users: 0,
    total_drops: 0,
    total_likes: 0,
    total_challenges_completed: 0,
    total_prayer_supports: 0,
    active_groups: 0,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const rateLimited = await enforceApiRateLimit(base44, req, me);
    if (rateLimited) return rateLimited;

    const svc = base44.asServiceRole.entities;
    const [users, drops, challenges, groups, prayers] = await Promise.all([
      fetchAll(svc.User),
      fetchAll(svc.GlowDrop),
      fetchAll(svc.ChallengeSubmission),
      fetchAll(svc.GlowGroup),
      fetchAll(svc.PrayerSupport),
    ]);

    const stats = {};
    const territoryByEmail = new Map();
    const ensure = (name) => (stats[name] ||= blank(name));

    users.forEach((u) => {
      const territory = normalizeTerritoryName(u.country);
      const email = String(u.email || '').toLowerCase();
      if (email) territoryByEmail.set(email, territory);
      const entry = ensure(territory);
      entry.total_users += 1;
      entry.total_glow_score += u.glow_score ?? u.xp_points ?? 0;
    });

    const territoryFor = (email) => territoryByEmail.get(String(email || '').toLowerCase()) || 'Unspecified';

    drops.forEach((d) => {
      const entry = ensure(territoryFor(d.user_email));
      entry.total_drops += 1;
      entry.total_likes += (d.likes_count || 0) + (d.bonus_likes_count || 0);
    });
    challenges.forEach((c) => { ensure(territoryFor(c.user_email)).total_challenges_completed += 1; });
    prayers.forEach((p) => { ensure(territoryFor(p.user_email)).total_prayer_supports += 1; });
    groups.forEach((g) => { ensure(normalizeTerritoryName(g.country)).active_groups += 1; });

    return Response.json({ territories: Object.values(stats), total_users: users.length });
  } catch (error) {
    console.error('getTerritoryLeaderboard failed:', error?.message);
    return Response.json({ error: 'Unable to build territory leaderboard' }, { status: 500 });
  }
});