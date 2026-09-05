import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';
import { createNotificationIdempotent } from '../../shared/notifications.ts';
import { mirrorToSupabase, deleteFromSupabase } from '../../shared/supabase.ts';

/**
 * Follow / unfollow in one server call. Replaces the client-side Follow.create / Follow.delete
 * paths so that the follower and following counters stay consistent, the Supabase mirror is
 * updated with the service key, duplicate rows are collapsed, and the "started following you"
 * notification is created idempotently.
 *
 * Body: { target_id: string, action: 'follow' | 'unfollow' | 'toggle' }
 * `target_id` is a User id, a ManagedLeaderAccount id or the official account id. Clients should
 * send an explicit 'follow' / 'unfollow' (their local follow list may be capped); 'toggle' is
 * kept for callers that have no local state.
 *
 * Counters: a cached counter is only adjusted when it already exists and is fresh; a missing or
 * stale counter is left for getConnections to recount (every 6 hours), which also bounds drift
 * from the remaining bulk paths (admin tools, repair jobs) and from concurrent follows.
 */

const COUNT_TTL_MS = 6 * 60 * 60 * 1000;

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
      action: { type: 'string', required: true, enum: ['follow', 'unfollow', 'toggle'] },
    });
    if (validated.response) return validated.response;
    const { target_id, action } = validated.data;
    if (target_id === user.id) return Response.json({ error: 'You cannot follow yourself' }, { status: 400 });

    const service = base44.asServiceRole;
    const [existing, targetUser, leaderAccount] = await Promise.all([
      service.entities.Follow.filter({ follower_id: user.id, following_id: target_id }, '-created_date', 50),
      service.entities.User.get(target_id).catch(() => null),
      service.entities.ManagedLeaderAccount.get(target_id).catch(() => null),
    ]);
    const currentlyFollowing = existing.length > 0;
    const wantFollow = action === 'follow' ? true : action === 'unfollow' ? false : !currentlyFollowing;

    // Adjust cached counters by `delta` where a fresh counter exists; otherwise leave them for
    // getConnections to recount. `user` is the caller's own User record from auth.me().
    const bumpCounters = async (delta: number) => {
      const tasks: Promise<unknown>[] = [];
      if (typeof user.following_count === 'number' && isFresh(user)) {
        tasks.push(service.entities.User.update(user.id, { following_count: Math.max(0, user.following_count + delta) }).catch(() => {}));
      }
      const target = targetUser || leaderAccount;
      const targetEntity = targetUser ? 'User' : leaderAccount ? 'ManagedLeaderAccount' : null;
      if (target && targetEntity && typeof target.followers_count === 'number' && isFresh(target)) {
        tasks.push(service.entities[targetEntity].update(target_id, { followers_count: Math.max(0, target.followers_count + delta) }).catch(() => {}));
      }
      await Promise.all(tasks);
    };

    if (wantFollow) {
      if (currentlyFollowing) {
        // Collapse duplicate rows but keep one; each removed duplicate is one row fewer.
        const extras = existing.slice(1);
        if (extras.length) {
          await Promise.all(extras.map((f: any) => service.entities.Follow.delete(f.id).then(() => deleteFromSupabase('follows', f.id)).catch(() => {})));
          await bumpCounters(-extras.length);
        }
        return Response.json({ following: true, record: existing[0], changed: false });
      }
      const record = await service.entities.Follow.create({ follower_id: user.id, following_id: target_id });
      await Promise.all([bumpCounters(1), mirrorToSupabase('follows', record).catch(() => false)]);
      if (targetUser?.id && targetUser.notify_follows !== false) {
        try {
          await createNotificationIdempotent(base44, {
            user_id: targetUser.id,
            actor_user_id: user.id,
            type: 'follow',
            reference_id: `follow_${user.id}`,
            message: `${user.display_name || user.username || user.full_name || 'Someone'} started following you.`,
            link: `/Profile?user=${encodeURIComponent(user.email)}`,
          });
        } catch (error) {
          console.error('[notification:error]', { type: 'follow', recipient: targetUser.id, error: error?.message });
        }
      }
      return Response.json({ following: true, record, changed: true });
    }

    if (!currentlyFollowing) return Response.json({ following: false, changed: false });
    await Promise.all(existing.map((f: any) => service.entities.Follow.delete(f.id).then(() => deleteFromSupabase('follows', f.id)).catch(() => {})));
    await bumpCounters(-existing.length);
    return Response.json({ following: false, changed: true });
  } catch (error) {
    console.error('manageFollow failed:', error?.message);
    return Response.json({ error: 'Unable to update follow' }, { status: 500 });
  }
});
