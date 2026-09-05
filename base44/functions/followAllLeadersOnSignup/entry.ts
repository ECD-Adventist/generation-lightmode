import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

/**
 * Signup hook — intentionally a no-op since 3 Sep 2026.
 *
 * It used to create one Follow row per active leader for every new user
 * (1,000,000 users × 50 leaders = 50,000,000 rows whose only purpose was
 * "everyone follows the leaders"). Leader posts are now shown implicitly in
 * every member's "Following" feed (see Feed.jsx: leader authors always pass
 * the Following filter), so no rows are needed. Members can still follow a
 * leader explicitly, which just adds a normal Follow row.
 *
 * The workflow "Follow All Leaders on Signup" still calls this on every
 * signup; keeping the endpoint (and its response shape) means the workflow
 * keeps succeeding without a platform change. Delete both together later.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let caller = null;
    try { caller = await base44.auth.me(); } catch (_error) { caller = null; }
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const userId = String(payload?.user_id || '').trim();
    return Response.json({
      user_id: userId,
      leaders_checked: 0,
      already_following: 0,
      created: 0,
      would_create: 0,
      dry_run: payload?.dry_run === true,
      skipped: true,
      reason: 'Leader posts are implicit in the Following feed; no Follow rows are created on signup.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
