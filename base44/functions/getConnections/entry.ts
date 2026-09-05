import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';

/**
 * Follower / following summary for a profile — replaces the client-side `fetchAllFollowers`
 * / `fetchAllFollowing` loops that shipped every Follow row to the phone.
 *
 * Returns:
 *   followers_count, following_count — cached on the target record (User or ManagedLeaderAccount),
 *                                       recounted server-side when missing or older than COUNT_TTL_MS
 *                                       and written back (fire-and-forget) so later calls are O(1).
 *                                       Counts are capped at COUNT_CAP; `counts_exact` says whether
 *                                       the cap was hit.
 *   followers, following             — the first page (50) of rows, plus `has_more` flags.
 *   viewer_following                 — the caller's Follow rows for the target and the people on
 *                                       the two pages (one `$in` query, never the whole set).
 *   is_following                     — whether the caller follows `target_id`.
 *
 * `target_id` may be a User id, a ManagedLeaderAccount id (the auto-follow automation writes leader
 * account ids into Follow.following_id) or the official account id 'official-generation-lightmode'.
 */

const PAGE = 50;
const COUNT_PAGE = 500;
const COUNT_CAP = 20_000;
const COUNT_TTL_MS = 6 * 60 * 60 * 1000; // recount at most every 6 hours so counters self-heal

async function countRows(entity: any, query: Record<string, unknown>) {
  let total = 0;
  let skip = 0;
  while (skip < COUNT_CAP) {
    const page = await entity.filter(query, '-created_date', COUNT_PAGE, skip);
    total += page.length;
    if (page.length < COUNT_PAGE) return { total, exact: true };
    skip += COUNT_PAGE;
  }
  return { total, exact: false };
}

async function listRows(entity: any, query: Record<string, unknown>, limit: number, skip: number) {
  const page = await entity.filter(query, '-created_date', limit + 1, skip);
  return { rows: page.slice(0, limit), has_more: page.length > limit };
}

function isFresh(record: any) {
  const at = Date.parse(record?.counts_updated_at || '');
  return Number.isFinite(at) && Date.now() - at < COUNT_TTL_MS;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // auth.me() throws for anonymous callers on this SDK version; treat that as 401, not 500.
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const limited = await enforceApiRateLimit(base44, req, user);
    if (limited) return limited;

    const validated = await readValidatedJson(req, {
      target_id: { type: 'string', required: true, maxLength: 64, format: 'record-id' },
      followers_skip: { type: 'number', integer: true, min: 0, max: 100_000 },
      following_skip: { type: 'number', integer: true, min: 0, max: 100_000 },
      include_viewer: { type: 'boolean' },
    });
    if (validated.response) return validated.response;
    const { target_id, followers_skip = 0, following_skip = 0, include_viewer = true } = validated.data;

    const service = base44.asServiceRole;
    const follows = service.entities.Follow;

    // Everything that does not depend on anything else runs in parallel.
    const [targetUser, leaderAccount, followersPage, followingPage] = await Promise.all([
      service.entities.User.get(target_id).catch(() => null),
      service.entities.ManagedLeaderAccount.get(target_id).catch(() => null),
      listRows(follows, { following_id: target_id }, PAGE, followers_skip),
      listRows(follows, { follower_id: target_id }, PAGE, following_skip),
    ]);
    const record = targetUser || leaderAccount;
    const entityName = targetUser ? 'User' : leaderAccount ? 'ManagedLeaderAccount' : null;

    // Counts: cached on the record when present and fresh; otherwise recounted (both directions
    // in parallel) and written back without blocking the response.
    let followers_count = typeof record?.followers_count === 'number' ? record.followers_count : null;
    let following_count = typeof record?.following_count === 'number' ? record.following_count : null;
    let counts_exact = true;
    const stale = !isFresh(record);
    if (followers_count === null || following_count === null || stale) {
      const [f, g] = await Promise.all([
        countRows(follows, { following_id: target_id }),
        countRows(follows, { follower_id: target_id }),
      ]);
      followers_count = f.total; following_count = g.total; counts_exact = f.exact && g.exact;
      if (record && entityName && counts_exact) {
        service.entities[entityName].update(target_id, {
          followers_count, following_count, counts_updated_at: new Date().toISOString(),
        }).catch(() => {});
      }
    }

    // The viewer's follow rows for the target and the people shown on these pages — one query.
    let viewer_following: Array<{ id: string; following_id: string }> = [];
    if (include_viewer) {
      const ids = new Set<string>([target_id]);
      for (const f of followersPage.rows) if (f.follower_id) ids.add(f.follower_id);
      for (const f of followingPage.rows) if (f.following_id) ids.add(f.following_id);
      const rows = await follows.filter({ follower_id: user.id, following_id: { $in: [...ids] } }, '-created_date', ids.size + 50).catch(() => []);
      viewer_following = rows.map((f: any) => ({ id: f.id, following_id: f.following_id }));
    }
    const is_following = viewer_following.some((f) => f.following_id === target_id);

    return Response.json({
      target_id,
      followers_count,
      following_count,
      counts_exact,
      followers: followersPage.rows.map((f: any) => ({ id: f.id, follower_id: f.follower_id, created_date: f.created_date })),
      followers_has_more: followersPage.has_more,
      following: followingPage.rows.map((f: any) => ({ id: f.id, following_id: f.following_id, created_date: f.created_date })),
      following_has_more: followingPage.has_more,
      viewer_following,
      is_following,
    });
  } catch (error) {
    console.error('getConnections failed:', error?.message);
    return Response.json({ error: 'Unable to load connections' }, { status: 500 });
  }
});
