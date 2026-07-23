import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { mirrorToSupabase } from '../../shared/supabase.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const actor = await base44.auth.me();
    if (!actor) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { user_id, type, message, link, actor_user_id, reference_id } = await req.json();
    if (!user_id || !type || !message) {
      return Response.json({ error: 'user_id, type and message are required' }, { status: 400 });
    }

    const allowedTypes = ['like', 'reply', 'milestone', 'system', 'follow', 'message'];
    if (!allowedTypes.includes(type)) {
      return Response.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    const target = await base44.asServiceRole.entities.User.get(user_id).catch(() => null);
    if (!target) return Response.json({ error: 'Recipient not found' }, { status: 404 });

    // Idempotency: if a reference_id is provided, skip if a notification already
    // exists for the same (user_id, type, reference_id) combination. This prevents
    // the duplicate fan-out problem from growing.
    if (reference_id) {
      const existing = await base44.asServiceRole.entities.Notification.filter({
        user_id,
        type,
        reference_id,
      }).catch(() => []);
      if (existing && existing.length > 0) {
        return Response.json({ success: true, id: existing[0].id, deduplicated: true });
      }
    }

    const created = await base44.asServiceRole.entities.Notification.create({
      user_id,
      actor_user_id: actor_user_id || actor.id,
      type,
      reference_id: reference_id || '',
      message: String(message).slice(0, 500),
      link: link || '',
      read: false,
    });

    // Dual-write: mirror into Supabase (fire-and-forget, never blocks).
    mirrorToSupabase('notifications', {
      id: created.id,
      user_id: created.user_id,
      actor_user_id: created.actor_user_id,
      type: created.type,
      reference_id: created.reference_id,
      message: created.message,
      link: created.link,
      read: created.read,
      created_date: created.created_date,
    });

    return Response.json({ success: true, id: created.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});