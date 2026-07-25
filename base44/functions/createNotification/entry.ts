import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { mirrorToSupabase } from '../../shared/supabase.ts';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const actor = await base44.auth.me();
    if (!actor) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const rateLimited = await enforceApiRateLimit(base44, req, actor);
    if (rateLimited) return rateLimited;

    const validated = await readValidatedJson(req, {
      user_id: { type: 'string', required: true, format: 'uuid' },
      type: { type: 'string', required: true, enum: ['like', 'reply', 'milestone', 'system', 'follow', 'message'] },
      message: { type: 'string', required: true, minLength: 1, maxLength: 500 },
      description: { type: 'string', maxLength: 500 },
      link: { type: 'string', maxLength: 2048 },
      reference_id: { type: 'string', maxLength: 200 },
    });
    if (validated.response) return validated.response;
    const { user_id, type, message, description, link, reference_id } = validated.data;
    const normalizedLink = typeof link === 'string' ? link.trim() : '';
    const hasSuspiciousScheme = /^(javascript|data|vbscript):/i.test(normalizedLink);
    const hasValidLink = !normalizedLink || normalizedLink.startsWith('/') || normalizedLink.startsWith('https://');
    if (!hasValidLink) {
      if (hasSuspiciousScheme) console.warn('Blocked suspicious notification link scheme');
      return Response.json({ error: 'link must be relative or use HTTPS' }, { status: 400 });
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
      actor_user_id: actor.id,
      type,
      reference_id: reference_id || '',
      message,
      description: description || '',
      link: normalizedLink,
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