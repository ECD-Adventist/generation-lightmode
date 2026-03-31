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
      return Response.json({ error: 'Missing drop_id or author_email' }, { status: 400 });
    }

    // Check if like exists
    const existingLike = await base44.entities.GlowDropLike.filter({
      drop_id: drop_id,
      user_email: user.email
    });

    // Get current drop to get accurate like count
    const drops = await base44.entities.GlowDrop.filter({ id: drop_id }, '-created_date', 1);
    if (!drops || drops.length === 0) {
      return Response.json({ error: 'Drop not found' }, { status: 404 });
    }

    const currentDrop = drops[0];

    if (action === 'toggle') {
      if (existingLike.length > 0) {
        await base44.entities.GlowDropLike.delete(existingLike[0].id);
        const newLikeCount = Math.max(0, (currentDrop.likes_count || 0) - 1);

        await base44.entities.GlowDrop.update(drop_id, {
          likes_count: newLikeCount
        });

        return Response.json({
          success: true,
          action: 'unlike',
          likes_count: newLikeCount,
          message: 'Drop unliked successfully'
        });
      }

      const newLikeCount = (currentDrop.likes_count || 0) + 1;

      await base44.entities.GlowDropLike.create({
        drop_id: drop_id,
        user_email: user.email
      });

      await base44.entities.GlowDrop.update(drop_id, {
        likes_count: newLikeCount
      });

      if (author_email && author_email !== user.email) {
        const authorUsers = await base44.entities.User.filter({ email: author_email });
        const authorUser = authorUsers?.[0];
        const shouldNotify = !authorUser || authorUser.notify_likes !== false;

        if (shouldNotify) {
          base44.entities.Notification.create({
            user_email: author_email,
            type: 'like',
            message: `${user.full_name || 'Someone'} liked your Glow Drop!`,
            link: `/Post?id=${encodeURIComponent(drop_id)}&user=${encodeURIComponent(author_email)}`
          }).catch(() => {});
        }
      }

      return Response.json({
        success: true,
        action: 'like',
        likes_count: newLikeCount,
        message: 'Drop liked successfully'
      });
    }

    if (action === 'unlike') {
      // Remove like
      if (existingLike.length === 0) {
        return Response.json({ error: 'Not liked' }, { status: 409 });
      }

      await base44.entities.GlowDropLike.delete(existingLike[0].id);
      const newLikeCount = Math.max(0, (currentDrop.likes_count || 0) - 1);
      
      await base44.entities.GlowDrop.update(drop_id, {
        likes_count: newLikeCount
      });

      return Response.json({
        success: true,
        action: 'unlike',
        likes_count: newLikeCount,
        message: 'Drop unliked successfully'
      });
    } else {
      // Add like
      if (existingLike.length > 0) {
        return Response.json({ error: 'Already liked' }, { status: 409 });
      }

      const newLikeCount = (currentDrop.likes_count || 0) + 1;

      // Create like record
      await base44.entities.GlowDropLike.create({
        drop_id: drop_id,
        user_email: user.email
      });

      // Update likes count
      await base44.entities.GlowDrop.update(drop_id, {
        likes_count: newLikeCount
      });

      // Send notification (fire and forget)
      if (author_email && author_email !== user.email) {
        const authorUsers = await base44.entities.User.filter({ email: author_email });
        const authorUser = authorUsers?.[0];
        
        // Check notification preference
        const shouldNotify = !authorUser || authorUser.notify_likes !== false;
        
        if (shouldNotify) {
          base44.entities.Notification.create({
            user_email: author_email,
            type: 'like',
            message: `${user.full_name || 'Someone'} liked your Glow Drop!`,
            link: `/Post?id=${encodeURIComponent(drop_id)}&user=${encodeURIComponent(author_email)}`
          }).catch(() => {});
        }
      }

      return Response.json({
        success: true,
        likes_count: newLikeCount,
        message: 'Drop liked successfully'
      });
    }

  } catch (error) {
    console.error('Like error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});