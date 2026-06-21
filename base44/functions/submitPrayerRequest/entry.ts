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

// Owns PrayerRequest create/update so anonymity is enforced server-side:
// when is_anonymous is true, user_email is NEVER persisted (privacy / GDPR).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { request_id, content, category, is_anonymous, answered } = body;

    const anonymous = is_anonymous === true;

    if (request_id) {
      // UPDATE — only owner or moderators/admins may edit.
      const existing = await base44.asServiceRole.entities.PrayerRequest.filter({ id: request_id });
      const record = existing[0];
      if (!record) return Response.json({ error: 'Prayer request not found' }, { status: 404 });

      const isOwner = record.user_email && record.user_email === user.email || record.created_by === user.email;
      const isPrivileged = ['admin', 'super_admin', 'moderator'].includes(user.role);
      if (!isOwner && !isPrivileged) {
        return Response.json({ error: 'Not authorized to edit this prayer request' }, { status: 403 });
      }

      const updates = {};
      if (content !== undefined) updates.content = (content || '').slice(0, 2000);
      if (category !== undefined) updates.category = category;
      if (answered !== undefined) updates.answered = !!answered;
      if (is_anonymous !== undefined) {
        updates.is_anonymous = anonymous;
        // If switching to anonymous, scrub the stored email.
        updates.user_email = anonymous ? '' : (record.user_email || user.email);
      }
      const updated = await base44.asServiceRole.entities.PrayerRequest.update(request_id, updates);
      return Response.json({ success: true, id: updated.id });
    }

    // CREATE
    if (!content || !content.trim()) {
      return Response.json({ error: 'Prayer content is required' }, { status: 400 });
    }

    const created = await base44.asServiceRole.entities.PrayerRequest.create({
      user_email: anonymous ? '' : user.email,
      content: content.slice(0, 2000),
      category: category || 'Other',
      is_anonymous: anonymous,
      answered: false,
    });

    // Dual-write Step 1: mirror into Supabase (fire-and-forget, never blocks).
    mirrorToSupabase('prayer_requests', {
      id: created.id,
      user_email: created.user_email,
      content: created.content,
      category: created.category,
      is_anonymous: created.is_anonymous,
      answered: created.answered,
      created_date: created.created_date,
    });

    return Response.json({ success: true, id: created.id });
  } catch (error) {
    return Response.json({ error: 'Unable to save prayer request' }, { status: 500 });
  }
});