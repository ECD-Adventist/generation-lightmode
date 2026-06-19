import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const actor = await base44.auth.me();
    if (!actor) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { user_id, type, message, link, actor_user_id } = await req.json();
    if (!user_id || !type || !message) {
      return Response.json({ error: 'user_id, type and message are required' }, { status: 400 });
    }

    const allowedTypes = ['like', 'reply', 'milestone', 'system', 'follow', 'message'];
    if (!allowedTypes.includes(type)) {
      return Response.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    const target = await base44.asServiceRole.entities.User.get(user_id).catch(() => null);
    if (!target) return Response.json({ error: 'Recipient not found' }, { status: 404 });

    const created = await base44.asServiceRole.entities.Notification.create({
      user_id,
      actor_user_id: actor_user_id || actor.id,
      type,
      message: String(message).slice(0, 500),
      link: link || '',
      read: false,
    });

    return Response.json({ success: true, id: created.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});