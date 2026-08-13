import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { mirrorToSupabase } from '../../shared/supabase.ts';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';

// Owns PrayerRequest create/update so anonymity is enforced server-side:
// when is_anonymous is true, user_email is NEVER persisted (privacy / GDPR).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const rateLimited = await enforceApiRateLimit(base44, req, user);
    if (rateLimited) return rateLimited;

    const validated = await readValidatedJson(req, {
      request_id: { type: 'string', format: 'uuid' },
      content: { type: 'string', maxLength: 2000 },
      category: { type: 'string', maxLength: 100 },
      is_anonymous: { type: 'boolean' },
      answered: { type: 'boolean' },
    });
    if (validated.response) return validated.response;
    const { request_id, content, category, is_anonymous, answered } = validated.data;

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

    // Dual-write: mirror into Supabase via service role key. Awaited so the write
    // isn't cancelled when the function returns.
    await mirrorToSupabase('prayer_requests', {
      id: created.id,
      user_email: created.user_email,
      content: created.content,
      category: created.category,
      is_anonymous: created.is_anonymous,
      answered: created.answered,
      created_date: created.created_date,
      created_by_id: created.created_by_id,
    });

    return Response.json({ success: true, id: created.id });
  } catch (error) {
    return Response.json({ error: 'Unable to save prayer request' }, { status: 500 });
  }
});