import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';
import { deleteFromSupabase, SUPABASE_TABLE_MAP } from '../../shared/supabase.ts';
import { enforceApiRateLimit } from '../../shared/apiSecurity.ts';

/**
 * Dual-DELETE endpoint. Called fire-and-forget from the frontend (src/lib/dualDeleteSupabase.js)
 * right after a client-side entity delete, so the mirrored Supabase row is removed too.
 *
 * SAFETY: the record MUST already be gone from Base44 before this will delete anything.
 * That makes the endpoint incapable of destroying live data — it can only ever clean up a
 * row that is already an orphan, which is exactly what reconciliation would do anyway.
 */
const TABLE_TO_ENTITY: Record<string, string> = {
  glow_drops: 'GlowDrop',
  follows: 'Follow',
  notifications: 'Notification',
  direct_messages: 'DirectMessage',
  prayer_requests: 'PrayerRequest',
};

const ID_PATTERN = /^(?:[0-9a-f]{24}|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });
    const limited = await enforceApiRateLimit(base44, req, user);
    if (limited) return limited;

    const payload = await req.json().catch(() => null);
    const rawTable = typeof payload?.table === 'string' ? payload.table : '';
    const recordId = typeof payload?.id === 'string' ? payload.id : '';
    const tableName = TABLE_TO_ENTITY[rawTable] ? rawTable : SUPABASE_TABLE_MAP[rawTable];
    if (!tableName) return Response.json({ error: 'Unsupported table' }, { status: 400 });
    if (!ID_PATTERN.test(recordId)) return Response.json({ error: 'id must be a valid identifier' }, { status: 400 });

    // Refuse while the record still exists in Base44 — Base44 stays the source of truth.
    const entityName = TABLE_TO_ENTITY[tableName];
    const stillExists = await base44.asServiceRole.entities[entityName].get(recordId).catch(() => null);
    if (stillExists) {
      return Response.json({ error: 'Record still exists in Base44; refusing to delete the mirror' }, { status: 409 });
    }

    const deleted = await deleteFromSupabase(tableName, recordId);
    if (!deleted) return Response.json({ error: 'Supabase delete failed' }, { status: 502 });
    return Response.json({ success: true, table: tableName, id: recordId });
  } catch (error) {
    console.error(`[supabase-delete] mirrorSupabaseDelete error at=${new Date().toISOString()}:`, error?.message);
    return Response.json({ error: error?.message || 'Mirror delete failed' }, { status: 500 });
  }
});