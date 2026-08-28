import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { createNotificationIdempotent } from '../../shared/notifications.ts';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    const rateLimited = await enforceApiRateLimit(base44, req, user);
    if (rateLimited) return rateLimited;

    const validated = await readValidatedJson(req, {
      drop_id: { type: 'string', required: true, maxLength: 64 },
      author_email: { type: 'string', maxLength: 254 },
      author_name: { type: 'string', maxLength: 120 },
      action: { type: 'string', enum: ['like', 'unlike', 'toggle'] },
      visitor_token: { type: 'string', minLength: 32, maxLength: 128 },
    });
    if (validated.response) return validated.response;
    const { drop_id, visitor_token } = validated.data;
    const requestedAction = validated.data.action || 'toggle';
    if (!user && !visitor_token) return Response.json({ error: 'Visitor token required' }, { status: 400 });
    const visitorHash = !user ? await crypto.subtle.digest('SHA-256', new TextEncoder().encode(visitor_token)).then(b => Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join('')) : '';
    const likeEntity = user ? base44.entities.GlowDropLike : base44.asServiceRole.entities.AnonymousGlowDropLike;
    const existingLikes = await likeEntity.filter(user ? { drop_id, user_email: user.email } : { drop_id, visitor_hash: visitorHash });

    const hasLiked = existingLikes.length > 0;
    // Legacy queued `toggle` requests are treated as idempotent Likes so a retry can never remove a Like.
    const shouldLike = requestedAction !== 'unlike';

    // Use service role to read/update the drop
    const drop = await base44.asServiceRole.entities.GlowDrop.get(drop_id).catch(() => null);

    if (!drop) {
      return Response.json({ error: 'Drop not found' }, { status: 404 });
    }

    // Fetch the real author from the drop record — never trust client-supplied author
    const authorEmail = drop.user_email;

    if (!shouldLike) {
      if (hasLiked) {
        await Promise.all(existingLikes.map((like) => likeEntity.delete(like.id).catch(() => {})));
        const newCount = Math.max(0, Number(drop.likes_count || 0) - 1);
        await base44.asServiceRole.entities.GlowDrop.update(drop_id, { likes_count: newCount });
        return Response.json({ success: true, action: 'unlike', likes_count: newCount });
      }
      return Response.json({ success: true, action: 'unlike', likes_count: Number(drop.likes_count || 0) });
    }

    if (hasLiked) {
      // Explicit Like is idempotent. Clean up any legacy duplicate rows without
      // toggling the user's intended state or changing the public count.
      await Promise.all(existingLikes.slice(1).map((like) => likeEntity.delete(like.id).catch(() => {})));
      return Response.json({ success: true, action: 'like', likes_count: Number(drop.likes_count || 0) });
    }

    await likeEntity.create(user ? { drop_id, user_email: user.email } : { drop_id, visitor_hash: visitorHash });
    const duplicateCheck = await likeEntity.filter(user ? { drop_id, user_email: user.email } : { drop_id, visitor_hash: visitorHash });
    await Promise.all(duplicateCheck.slice(1).map((like) => likeEntity.delete(like.id).catch(() => {})));
    const newCount = Number(drop.likes_count || 0) + 1;
    await base44.asServiceRole.entities.GlowDrop.update(drop_id, { likes_count: newCount });

    if (!user) return Response.json({ success: true, action: 'like', likes_count: newCount });

      // Update Daily Challenge: Spread the Light
      const todayStr = new Date().toISOString().split('T')[0];
      const todayChallenges = await base44.asServiceRole.entities.UserDailyChallenge.filter({ user_email: user.email, date_string: todayStr });
      if (!todayChallenges.some(c => c.challenge_id === 'like_drops')) {
        await base44.asServiceRole.entities.UserDailyChallenge.create({ user_email: user.email, date_string: todayStr, challenge_id: 'like_drops' });
        await base44.auth.updateMe({ glow_score: (user.glow_score || 0) + 5 });
      }

      // Notify the real author and await the dual-write so serverless completion cannot cancel it.
      if (authorEmail && authorEmail !== user.email) {
        const author = (await base44.asServiceRole.entities.User.filter({ email: authorEmail }, '-created_date', 1))[0];
        if (author?.id) {
          try {
            await createNotificationIdempotent(base44, {
              user_id: author.id,
              actor_user_id: user.id,
              type: 'like',
              reference_id: `like_${user.id}_${drop_id}`,
              message: `${user.full_name || 'Someone'} liked your post.`,
              link: `/Post?id=${encodeURIComponent(drop_id)}&user=${encodeURIComponent(authorEmail)}`,
            });
          } catch (notificationError) {
            console.error('[notification:error]', { type: 'like', recipient: author.id, action: 'like_glowdrop', error: notificationError?.message });
          }
        }
      }

      return Response.json({ success: true, action: 'like', likes_count: newCount });
  } catch (error) {
    console.error('Like error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}