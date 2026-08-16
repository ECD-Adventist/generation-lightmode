import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';
import { createNotificationIdempotent } from '../../shared/notifications.ts';
import { mirrorToSupabase, deleteFromSupabase } from '../../shared/supabase.ts';
import { deleteRepostRow } from '../../shared/repostStore.ts';

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
    const blocked = await base44.asServiceRole.entities.BlockedUser.filter({ blocker_email: user.email, blocked_email: original.user_email });
    const blockedBy = await base44.asServiceRole.entities.BlockedUser.filter({ blocker_email: original.user_email, blocked_email: user.email });
    if (blocked.length || blockedBy.length) return Response.json({ error: 'This post is not available to repost' }, { status: 403 });

    const [legacyReposts, repostDrops] = await Promise.all([
      base44.asServiceRole.entities.Repost.filter({ reposter_user_id: user.id, original_post_id: canonicalId }, '-created_at', 1),
      base44.asServiceRole.entities.GlowDrop.filter({ user_email: user.email, original_drop_id: canonicalId }, '-created_date', 1),
    ]);

    if (action === 'undo') {
      const repostDrop = repostDrops[0];
      const legacyRepost = legacyReposts[0];
      if (!repostDrop && !legacyRepost) return Response.json({ error: 'You have not reposted this post' }, { status: 404 });

      if (repostDrop) {
        const removed = await deleteFromSupabase('glow_drops', repostDrop.id);
        if (!removed) {
          console.error('manageRepost failed: repost GlowDrop could not be removed from Supabase', { repost_id: repostDrop.id, user_id: user.id });
          return Response.json({ error: 'Repost could not be removed from all storage systems' }, { status: 502 });
        }
        await base44.asServiceRole.entities.GlowDrop.delete(repostDrop.id);
      } else {
        const removed = await deleteRepostRow(legacyRepost.id, user.id);
        if (!removed) return Response.json({ error: 'Repost could not be removed from all storage systems' }, { status: 502 });
        await base44.asServiceRole.entities.Repost.delete(legacyRepost.id);
      }

      const newCount = Math.max(0, (original.reposts_count || 0) - 1);
      const updatedOriginal = await base44.asServiceRole.entities.GlowDrop.update(original.id, { reposts_count: newCount });
      await mirrorToSupabase('glow_drops', updatedOriginal);
      return Response.json({ success: true, action: 'undone', original_post_id: canonicalId });
    }

    if (repostDrops[0] || legacyReposts[0]) return Response.json({ error: 'You already reposted this post' }, { status: 409 });

    const reposterName = user.display_name || user.full_name || user.email?.split('@')[0] || 'Member';
    const originalAuthorName = original.author_name || original.author_username || original.user_email?.split('@')[0] || 'the original author';
    const originalReflection = String(original.reflection || '').trim();
    const repostReflection = `[Reposted from ${originalAuthorName}] ${caption ? `${String(caption).slice(0, 500)}\n\n` : ''}${originalReflection}`.trim();

    const repost = await base44.asServiceRole.entities.GlowDrop.create({
      user_email: user.email,
      author_name: reposterName,
      author_username: user.username || user.email?.split('@')[0] || reposterName,
      author_avatar: user.profile_picture || user.profile_picture_url || '',
      verse: original.verse || '',
      reflection: repostReflection,
      description: original.description || '',
      media_url: original.media_url || '',
      audio_url: original.audio_url || '',
      audio_title: original.audio_title || '',
      status: 'approved',
      hidden: false,
      is_flagged: false,
      pinned: false,
      likes_count: 0,
      bonus_likes_count: 0,
      bonus_likes_enabled: false,
      category: original.category || '',
      hashtags: original.hashtags || '',
      reposts_count: 0,
      original_drop_id: canonicalId,
    });

    const mirrored = await mirrorToSupabase('glow_drops', repost);
    if (!mirrored) {
      await base44.asServiceRole.entities.GlowDrop.delete(repost.id).catch(() => null);
      console.error('manageRepost failed: repost GlowDrop could not be mirrored to Supabase', { repost_id: repost.id, original_post_id: canonicalId, user_id: user.id });
      return Response.json({ error: 'Repost could not be saved to all storage systems' }, { status: 502 });
    }

    const newCount = (original.reposts_count || 0) + 1;
    const updatedOriginal = await base44.asServiceRole.entities.GlowDrop.update(original.id, { reposts_count: newCount });
    await mirrorToSupabase('glow_drops', updatedOriginal);

    const authors = await base44.asServiceRole.entities.User.filter({ email: original.user_email }, '-created_date', 1);
    const author = authors[0];
    if (author && author.id !== user.id && author.notify_reposts !== false) {
      try {
        const notificationId = await createNotificationIdempotent(base44, {
          user_id: author.id,
          actor_user_id: user.id,
          type: 'repost',
          reference_id: `repost_${user.id}_${canonicalId}`,
          message: `${reposterName} reposted your GlowDrop.`,
          link: `/Post?id=${encodeURIComponent(canonicalId)}`,
        });
        if (notificationId) {
          const notification = await base44.asServiceRole.entities.Notification.get(notificationId);
          const notificationMirrored = await mirrorToSupabase('notifications', notification);
          if (!notificationMirrored) throw new Error('Repost notification could not be mirrored to Supabase');
        }
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