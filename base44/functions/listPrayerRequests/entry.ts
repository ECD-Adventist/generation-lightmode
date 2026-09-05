import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';

/**
 * Public prayer wall feed, served through the backend so that:
 *   - `created_by` / `created_by_id` (Base44 auto-fields that name the author even on
 *     anonymous prayers) never leave the server;
 *   - anonymous prayers and anonymous comments carry no email at all;
 *   - non-anonymous prayers keep `user_email` (the requester chose to be identifiable,
 *     and the prayer-room chat needs it) plus a display name resolved server-side.
 *
 * Entity-level reads of PrayerRequest / PrayerComment are restricted to the owner and
 * moderators, so this function is the only way members see other people's prayers.
 */

const MAX_REQUESTS = 300;
const MAX_COMMENTS = 1000;

function displayName(user: Record<string, unknown> | undefined, email: string): string {
  const pick = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : '');
  return pick(user?.display_name) || pick(user?.username) || pick(user?.full_name) || (email ? email.split('@')[0] : 'Glow Believer');
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
      limit: { type: 'number', required: false },
      include_comments: { type: 'boolean', required: false },
    }, { allowEmpty: true });
    if (validated.response) return validated.response;
    const limit = Math.min(MAX_REQUESTS, Math.max(1, Number(validated.data?.limit) || 50));
    const includeComments = validated.data?.include_comments !== false;

    const service = base44.asServiceRole;
    const [requests, comments] = await Promise.all([
      service.entities.PrayerRequest.list('-created_date', limit),
      includeComments ? service.entities.PrayerComment.list('-created_date', MAX_COMMENTS) : Promise.resolve([]),
    ]);

    // Resolve display names for every non-anonymous author in one pass.
    const emails = new Set<string>();
    for (const r of requests) if (!r.is_anonymous && r.user_email) emails.add(String(r.user_email).toLowerCase());
    for (const c of comments) if (!c.is_anonymous && c.user_email) emails.add(String(c.user_email).toLowerCase());
    // One batched `$in` lookup per 100 authors instead of one query per author.
    const users = new Map<string, Record<string, unknown>>();
    const emailList = [...emails].slice(0, 300);
    const batches: string[][] = [];
    for (let i = 0; i < emailList.length; i += 100) batches.push(emailList.slice(i, i + 100));
    await Promise.all(batches.map(async (batch) => {
      const found = await service.entities.User.filter({ email: { $in: batch } }, '-created_date', batch.length).catch(() => []);
      for (const u of found) if (u?.email) users.set(String(u.email).toLowerCase(), u);
    }));

    const me = String(user.email || '').toLowerCase();
    const isMineRow = (row: Record<string, unknown>) =>
      String(row.user_email || '').toLowerCase() === me || row.created_by_id === user.id || String(row.created_by || '').toLowerCase() === me;

    const shapedRequests = requests.map((r) => {
      const anonymous = r.is_anonymous === true;
      const email = anonymous ? '' : String(r.user_email || '');
      const mine = isMineRow(r);
      return {
        id: r.id,
        content: r.content || '',
        category: r.category || 'Other',
        is_anonymous: anonymous,
        answered: r.answered === true,
        created_date: r.created_date || null,
        updated_date: r.updated_date || null,
        user_email: mine ? String(r.user_email || user.email) : email,
        requester_name: anonymous ? 'Anonymous' : displayName(users.get(email.toLowerCase()), email),
        is_mine: mine,
      };
    });

    const shapedComments = comments.map((c) => {
      const anonymous = c.is_anonymous === true;
      const email = anonymous ? '' : String(c.user_email || '');
      const mine = isMineRow(c);
      return {
        id: c.id,
        request_id: c.request_id,
        content: c.content || '',
        is_anonymous: anonymous,
        created_date: c.created_date || null,
        user_email: mine ? String(c.user_email || user.email) : email,
        author_name: anonymous ? 'Anonymous' : displayName(users.get(email.toLowerCase()), email),
        is_mine: mine,
      };
    });

    return Response.json({ requests: shapedRequests, comments: shapedComments });
  } catch (error) {
    console.error('listPrayerRequests failed:', error?.message);
    return Response.json({ error: 'Unable to load prayer requests' }, { status: 500 });
  }
});
