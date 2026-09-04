import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';

const PAGE = 500;
const MAX_RECORDS = 60000;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const METRICS = new Set(['glow', 'likes', 'drops', 'followers']);

async function fetchAll(entity, sort) {
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

function publicEntry(user, verifiedXp) {
  const picture = user.profile_picture || user.profile_picture_url || '';
  return {
    id: user.id,
    username: user.username || '',
    display_name: user.display_name || '',
    full_name: user.full_name || '',
    profile_picture: picture,
    profile_picture_url: picture,
    country: user.country || '',
    city: user.city || '',
    glow_score: verifiedXp,
    xp_points: verifiedXp,
    faith_streak_count: user.faith_streak_count || 0,
  };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const rateLimited = await enforceApiRateLimit(base44, req, me);
    if (rateLimited) return rateLimited;

    const validated = await readValidatedJson(req, {
      metric: { type: 'string', maxLength: 20 },
      country: { type: 'string', maxLength: 100 },
      city: { type: 'string', maxLength: 100 },
      limit: { type: 'number', integer: true, min: 1, max: MAX_LIMIT },
    });
    if (validated.response) return validated.response;
    const payload = validated.data;

    const metric = METRICS.has(payload.metric) ? payload.metric : 'glow';
    const limit = Math.max(1, Math.min(Number.parseInt(payload.limit, 10) || DEFAULT_LIMIT, MAX_LIMIT));
    const country = typeof payload.country === 'string' ? payload.country.trim().toLowerCase() : '';
    const city = typeof payload.city === 'string' ? payload.city.trim().toLowerCase() : '';

    // Full user base — leaderboards must rank everyone, not a recent slice.
    // XP comes from the server-verified ledger totals (XpTotal), never from the
    // client-writable profile field, so tampered scores cannot reach the rankings.
    const [allUsers, xpTotals] = await Promise.all([
      fetchAll(base44.asServiceRole.entities.User, '-created_date'),
      fetchAll(base44.asServiceRole.entities.XpTotal, '-created_date'),
    ]);
    const verifiedByEmail = new Map(xpTotals.map((t) => [String(t.user_email || '').toLowerCase(), Number(t.total) || 0]));
    const verifiedXp = (u) => verifiedByEmail.get(String(u.email || '').toLowerCase()) || 0;

    let scoped = allUsers;
    if (country) scoped = scoped.filter((u) => String(u.country || '').toLowerCase() === country);
    if (city) scoped = scoped.filter((u) => String(u.city || '').toLowerCase() === city);

    let valueByEmail = new Map();
    if (metric === 'likes' || metric === 'drops') {
      const drops = await fetchAll(base44.asServiceRole.entities.GlowDrop, '-created_date');
      drops.forEach((d) => {
        const email = String(d.user_email || '').toLowerCase();
        if (!email) return;
        const add = metric === 'likes' ? ((d.likes_count || 0) + (d.bonus_likes_count || 0)) : 1;
        valueByEmail.set(email, (valueByEmail.get(email) || 0) + add);
      });
    } else if (metric === 'followers') {
      const follows = await fetchAll(base44.asServiceRole.entities.Follow, '-created_date');
      const emailById = new Map(allUsers.map((u) => [u.id, String(u.email || '').toLowerCase()]));
      follows.forEach((f) => {
        const email = emailById.get(f.following_id) || String(f.following_email || '').toLowerCase();
        if (!email) return;
        valueByEmail.set(email, (valueByEmail.get(email) || 0) + 1);
      });
    }

    const ranked = scoped
      .map((u) => {
        const email = String(u.email || '').toLowerCase();
        const value = metric === 'glow' ? verifiedXp(u) : (valueByEmail.get(email) || 0);
        return { ...publicEntry(u, verifiedXp(u)), value };
      })
      .sort((a, b) => b.value - a.value || (b.glow_score || 0) - (a.glow_score || 0));

    const myIndex = ranked.findIndex((entry) => entry.id === me.id);
    const tierCounts = { Seed: 0, Spark: 0, Flame: 0, Beacon: 0, Radiance: 0 };
    allUsers.forEach((u) => {
      const score = verifiedXp(u);
      const tier = score >= 5000 ? 'Radiance' : score >= 1000 ? 'Beacon' : score >= 500 ? 'Flame' : score >= 100 ? 'Spark' : 'Seed';
      tierCounts[tier] += 1;
    });

    return Response.json({
      metric,
      entries: ranked.slice(0, limit),
      total_ranked: ranked.length,
      my_rank: myIndex >= 0 ? myIndex + 1 : null,
      my_value: myIndex >= 0 ? ranked[myIndex].value : 0,
      tier_counts: tierCounts,
    });
  } catch (error) {
    console.error('getLeaderboard failed:', error?.message);
    return Response.json({ error: 'Unable to build leaderboard' }, { status: 500 });
  }
}