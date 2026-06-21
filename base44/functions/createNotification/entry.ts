import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Fire-and-forget mirror of a Base44 record into Supabase. Never awaited by the
// caller, never throws — the Base44 write stays the primary source of truth.
const SUPABASE_URL = 'https://asnsthgubpeptoiexajf.supabase.co';
function mirrorToSupabase(table, row) {
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!key || !row?.id) return;
  fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(row),
  }).catch((e) => console.error(`Supabase mirror ${table} failed:`, e?.message));
}

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

    // Dual-write Step 1: mirror into Supabase (fire-and-forget, never blocks).
    mirrorToSupabase('notifications', {
      id: created.id,
      user_id: created.user_id,
      actor_user_id: created.actor_user_id,
      type: created.type,
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