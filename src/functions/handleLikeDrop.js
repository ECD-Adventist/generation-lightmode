/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { drop_id, author_email, author_name, action } = await req.json();

    if (!drop_id || !author_email) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already liked this drop
    const existingLikes = await base44.entities.GlowDropLike.filter({
      drop_id,
      user_email: user.email
    });

    const hasLiked = existingLikes.length > 0;
    const drop = await base44.entities.GlowDrop.get(drop_id);

    if (!drop) {
      return Response.json({ error: 'Drop not found' }, { status: 404 });
    }

    let likeAction = 'like';

    // Toggle: if already liked, remove it; otherwise add it
    if (hasLiked) {
      // Unlike
      await base44.entities.GlowDropLike.delete(existingLikes[0].id);
      await base44.asServiceRole.entities.GlowDrop.update(drop_id, {
        likes_count: Math.max(0, (drop.likes_count || 1) - 1)
      });
      likeAction = 'unlike';
    } else {
      // Like
      await base44.entities.GlowDropLike.create({
        drop_id,
        user_email: user.email
      });
      await base44.asServiceRole.entities.GlowDrop.update(drop_id, {
        likes_count: (drop.likes_count || 0) + 1
      });
      likeAction = 'like';

      // Notify drop author if they have notifications enabled
      if (author_email && author_email !== user.email) {
        const authorUser = await base44.entities.User.get(author_email).catch(() => null);
        const notificationsEnabled = authorUser?.notification_likes !== false;
        
        if (notificationsEnabled) {
          await base44.entities.Notification.create({
            user_email: author_email,
            type: 'like',
            message: `${user.full_name || 'Someone'} liked your Glow Drop.`,
            link: `/Post?id=${encodeURIComponent(drop_id)}&user=${encodeURIComponent(author_email)}`
          }).catch(() => {});
        }
      }
    }

    return Response.json({
      success: true,
      action: likeAction,
      likes_count: likeAction === 'like' 
        ? (drop.likes_count || 0) + 1 
        : Math.max(0, (drop.likes_count || 1) - 1)
    });
  } catch (error) {
    console.error('Like error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});