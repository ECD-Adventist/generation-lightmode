import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';

/**
 * Everything the Feed needs to know about the viewer, in ONE call, with hard caps.
 * Replaces four separate client queries on every feed open:
 *   - all of the viewer's likes (was unbounded, up to 10,000 rows)
 *   - saved drops (500)
 *   - all follows (was unbounded)
 *   - unread notifications
 *
 * Shapes are kept compatible with what the feed already consumes:
 *   likes:         [{ id, drop_id }]       (most recent 1,000)
 *   saved:         [{ id, drop_id }]       (most recent 500)
 *   following:     [{ id, following_id }]  (most recent 1,000)
 *   notifications: [{ id, message, link, type, created_date }] (unread, most recent 20)
 *   unread_count:  number (capped at 99)
 */

const LIKES_CAP = 1_000;
const SAVED_CAP = 500;
const FOLLOWING_CAP = 1_000;
const NOTIF_PAGE = 20;
const PAGE = 500;

async function pageAll(entity: any, query: Record<string, unknown>, cap: number, sort = '-created_date') {
  const rows: any[] = [];
  let skip = 0;
  while (rows.length < cap) {
    const size = Math.min(PAGE, cap - rows.length);
    const page = await entity.filter(query, sort, size, skip);
    rows.push(...page);
    if (page.length < size) break;
    skip += size;
  }
  return rows;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // auth.me() throws for anonymous callers on this SDK version; treat that as 401, not 500.
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const limited = await enforceApiRateLimit(base44, req, user);
    if (limited) return limited;

    const validated = await readValidatedJson(req, {}, { allowEmpty: true });
    if (validated.response) return validated.response;

    const service = base44.asServiceRole;
    const [likes, saved, following, unread] = await Promise.all([
      pageAll(service.entities.GlowDropLike, { user_email: user.email }, LIKES_CAP),
      pageAll(service.entities.SavedDrop, { user_email: user.email }, SAVED_CAP),
      pageAll(service.entities.Follow, { follower_id: user.id }, FOLLOWING_CAP),
      service.entities.Notification.filter({ user_id: user.id, read: false }, '-created_date', 100),
    ]);

    return Response.json({
      likes: likes.map((r: any) => ({ id: r.id, drop_id: r.drop_id })),
      saved: saved.map((r: any) => ({ id: r.id, drop_id: r.drop_id })),
      following: following.map((r: any) => ({ id: r.id, following_id: r.following_id })),
      notifications: unread.slice(0, NOTIF_PAGE).map((n: any) => ({
        id: n.id, message: n.message, link: n.link, type: n.type, created_date: n.created_date, read: false,
      })),
      unread_count: Math.min(99, unread.length),
      caps: { likes: LIKES_CAP, saved: SAVED_CAP, following: FOLLOWING_CAP },
    });
  } catch (error) {
    console.error('getFeedViewerState failed:', error?.message);
    return Response.json({ error: 'Unable to load viewer state' }, { status: 500 });
  }
});
