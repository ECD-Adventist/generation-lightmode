import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';
import { createNotificationIdempotent } from '../../shared/notifications.ts';
import { isRepostStoreConfigured, insertRepostRow, deleteRepostRow } from '../../shared/repostStore.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });
    const limited = await enforceApiRateLimit(base44, req, user);
    if (limited) return limited;

    const validated = await readValidatedJson(req, {
      action: { type: 'string', enum: ['create', 'undo'] },
      original_post_id: { type: 'string', maxLength: 64 },
      caption: { type: 'string', maxLength: 500 },
    });
    if (validated.response) return validated.response;
    const { action, original_post_id: requestedId, caption = '' } = validated.data;
    if (!requestedId) return Response.json({ error: 'Post ID is required' }, { status: 400 });
    if (!isRepostStoreConfigured()) return Response.json({ error: 'Repost storage is not configured' }, { status: 503 });

    // Resolve to the canonical original: a repost of a repost always points at the root post.
    let canonicalId = requestedId;
    const referenced = await base44.asServiceRole.entities.Repost.filter({ id: requestedId }, '-created_at', 1);
    if (referenced[0]) canonicalId = referenced[0].original_post_id;
    for (let depth = 0; depth < 5; depth += 1) {
      const candidate = await base44.asServiceRole.entities.GlowDrop.get(canonicalId).catch(() => null);
      if (!candidate) return Response.json({ error: 'Post not found or deleted' }, { status: 404 });
      if (!candidate.original_drop_id || candidate.original_drop_id === canonicalId) break;
      canonicalId = candidate.original_drop_id;
    }

    const original = await base44.asServiceRole.entities.GlowDrop.get(canonicalId).catch(() => null);
    if (!original) return Response.json({ error: 'Original post not found or deleted' }, { status: 404 });
    if (original.hidden || original.is_flagged || original.status !== 'approved') {
      return Response.json({ error: 'This post is restricted and cannot be reposted' }, { status: 403 });
    }
    if (original.created_by_id === user.id || original.user_email === user.email) {
      return Response.json({ error: 'You cannot repost your own post' }, { status: 400 });
    }
    const blocked = await base44.asServiceRole.entities.BlockedUser.filter({ blocker_email: user.email, blocked_email: original.user_email });
    const blockedBy = await base44.asServiceRole.entities.BlockedUser.filter({ blocker_email: original.user_email, blocked_email: user.email });
    if (blocked.length || blockedBy.length) return Response.json({ error: 'This post is not available to repost' }, { status: 403 });

    const existing = await base44.asServiceRole.entities.Repost.filter({ reposter_user_id: user.id, original_post_id: canonicalId }, '-created_at', 1);

    if (action === 'undo') {
      const repost = existing[0];
      if (!repost) return Response.json({ error: 'You have not reposted this post' }, { status: 404 });
      // Ownership is derived from the authenticated user, never from the request body — a
      // user can only ever reach their own repost record here.
      const removed = await deleteRepostRow(repost.id, user.id);
      if (!removed) return Response.json({ error: 'Repost could not be removed from all storage systems' }, { status: 502 });
      await base44.asServiceRole.entities.Repost.delete(repost.id);
      await base44.asServiceRole.entities.GlowDrop.update(original.id, { reposts_count: Math.max(0, (original.reposts_count || 0) - 1) });
      return Response.json({ success: true, action: 'undone', original_post_id: canonicalId });
    }

    if (existing[0]) return Response.json({ error: 'You already reposted this post' }, { status: 409 });

    const now = new Date().toISOString();
    const repost = await base44.asServiceRole.entities.Repost.create({
      original_post_id: canonicalId,
      reposter_user_id: user.id,
      reposter_email: user.email,
      reposter_name: user.display_name || user.full_name || user.email?.split('@')[0] || 'Member',
      caption: String(caption || '').slice(0, 500),
      created_at: now,
    });

    const stored = await insertRepostRow({
      id: repost.id,
      original_post_id: canonicalId,
      reposter_user_id: user.id,
      reposter_email: repost.reposter_email,
      reposter_name: repost.reposter_name,
      caption: repost.caption || '',
      created_at: now,
    });
    if (!stored.ok) {
      // Roll the Base44 record back so the UI never confirms a half-persisted repost.
      await base44.asServiceRole.entities.Repost.delete(repost.id).catch(() => null);
      if (stored.duplicate) return Response.json({ error: 'You already reposted this post' }, { status: 409 });
      return Response.json({ error: 'Repost could not be saved to all storage systems' }, { status: 502 });
    }

    await base44.asServiceRole.entities.GlowDrop.update(original.id, { reposts_count: (original.reposts_count || 0) + 1 });

    const authors = await base44.asServiceRole.entities.User.filter({ email: original.user_email }, '-created_date', 1);
    const author = authors[0];
    if (author && author.id !== user.id && author.notify_reposts !== false) {
      try {
        await createNotificationIdempotent(base44, {
          user_id: author.id,
          actor_user_id: user.id,
          type: 'repost',
          reference_id: `repost_${user.id}_${canonicalId}`,
          message: `${repost.reposter_name} reposted your GlowDrop.`,
          link: `/Post?id=${encodeURIComponent(canonicalId)}`,
        });
      } catch (notificationError) {
        console.error('[notification:error]', { type: 'repost', recipient: author.id, action: 'repost_glowdrop', error: notificationError?.message });
      }
    }

    return Response.json({ success: true, action: 'created', repost });
  } catch (error) {
    console.error('manageRepost failed:', error?.message);
    return Response.json({ error: error?.message || 'Unable to manage repost' }, { status: 500 });
  }
}