import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { drop_id } = await req.json();

    if (!drop_id) {
      return Response.json({ error: 'Missing drop_id' }, { status: 400 });
    }

    // Check if user already liked this drop
    const existingLikes = await base44.entities.GlowDropLike.filter({
      drop_id,
      user_email: user.email
    });

    const hasLiked = existingLikes.length > 0;

    // Use service role to read/update the drop
    const drop = await base44.asServiceRole.entities.GlowDrop.get(drop_id);

    if (!drop) {
      return Response.json({ error: 'Drop not found' }, { status: 404 });
    }

    // Fetch the real author from the drop record — never trust client-supplied author
    const authorEmail = drop.user_email;

    if (hasLiked) {
      await base44.entities.GlowDropLike.delete(existingLikes[0].id);
      const newCount = Math.max(0, (drop.likes_count || 1) - 1);
      await base44.asServiceRole.entities.GlowDrop.update(drop_id, { likes_count: newCount });

      return Response.json({ success: true, action: 'unlike', likes_count: newCount });
    } else {
      await base44.entities.GlowDropLike.create({ drop_id, user_email: user.email });
      const newCount = (drop.likes_count || 0) + 1;
      await base44.asServiceRole.entities.GlowDrop.update(drop_id, { likes_count: newCount });

      // Notify real drop author (server-side lookup — not from client)
      if (authorEmail && authorEmail !== user.email) {
        base44.asServiceRole.entities.Notification.create({
          user_email: authorEmail,
          type: 'like',
          message: `${user.full_name || 'Someone'} liked your Glow Drop.`,
          link: `/Post?id=${encodeURIComponent(drop_id)}&user=${encodeURIComponent(authorEmail)}`
        }).catch(() => {});
      }

      return Response.json({ success: true, action: 'like', likes_count: newCount });
    }
  } catch (error) {
    console.error('Like error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});