import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';

/**
 * Follower / following summary for a profile — replaces the client-side `fetchAllFollowers`
 * / `fetchAllFollowing` loops that shipped every Follow row to the phone.
 *
 * Returns:
 *   followers_count, following_count   — from the cached counters on the User record when
 *                                         present, otherwise counted server-side (capped) and
 *                                         written back so the next call is O(1).
 *   followers, following               — the first page (50) of rows: { id, follower_id } /
 *                                         { id, following_id }, plus `has_more`.
 *   viewer_following                   — the caller's own following rows (up to 1,000),
 *                                         needed for "is following" checks in the UI.
 *   is_following                       — whether the caller follows `target_id`.
 *
 * `target_id` may be a User id or a ManagedLeaderAccount id (the auto-follow automation writes
 * leader account ids into Follow.following_id). Counters are only cached on User records.
 */

const PAGE = 50;
const COUNT_PAGE = 500;
const COUNT_CAP = 20_000;
const VIEWER_CAP = 1_000;

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // auth.me() throws for anonymous callers on this SDK version; treat that as 401, not 500.
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const limited = await enforceApiRateLimit(base44, req, user);
    if (limited) return limited;

    const validated = await readValidatedJson(req, {
      target_id: { type: 'string', required: true, maxLength: 64, format: 'uuid' },
      followers_skip: { type: 'number', integer: true, min: 0, max: 100_000 },
      following_skip: { type: 'number', integer: true, min: 0, max: 100_000 },
      include_viewer: { type: 'boolean' },
    });
    if (validated.response) return validated.response;
    const { target_id, followers_skip = 0, following_skip = 0, include_viewer = true } = validated.data;

    const service = base44.asServiceRole;
    const follows = service.entities.Follow;

    const targetUser = await service.entities.User.get(target_id).catch(() => null);

    // Counts: cached on the User record when available, otherwise counted once and cached.
    let followers_count = typeof targetUser?.followers_count === 'number' ? targetUser.followers_count : null;
    let following_count = typeof targetUser?.following_count === 'number' ? targetUser.following_count : null;
    let counts_exact = true;
    if (followers_count === null) {
      const c = await countRows(follows, { following_id: target_id });
      followers_count = c.total; counts_exact = counts_exact && c.exact;
    }
    if (following_count === null) {
      const c = await countRows(follows, { follower_id: target_id });
      following_count = c.total; counts_exact = counts_exact && c.exact;
    }
    if (targetUser && counts_exact && (typeof targetUser.followers_count !== 'number' || typeof targetUser.following_count !== 'number')) {
      await service.entities.User.update(target_id, { followers_count, following_count }).catch(() => {});
    }

    const [followersPage, followingPage] = await Promise.all([
      listRows(follows, { following_id: target_id }, PAGE, followers_skip),
      listRows(follows, { follower_id: target_id }, PAGE, following_skip),
    ]);

    let viewer_following: Array<{ id: string; following_id: string }> = [];
    if (include_viewer) {
      let skip = 0;
      while (skip < VIEWER_CAP) {
        const page = await follows.filter({ follower_id: user.id }, '-created_date', COUNT_PAGE, skip);
        viewer_following.push(...page.map((f: any) => ({ id: f.id, following_id: f.following_id })));
        if (page.length < COUNT_PAGE) break;
        skip += COUNT_PAGE;
      }
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
