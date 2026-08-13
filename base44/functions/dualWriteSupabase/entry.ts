import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';
import { getSupabaseUrl, getSupabaseServiceKey, SUPABASE_TABLE_MAP } from '../../shared/supabase.ts';
import { enforceApiRateLimit } from '../../shared/apiSecurity.ts';

// Mirrors one Base44 record into its snake_case Supabase table.
// Called fire-and-forget from the frontend (src/lib/dualWriteSupabase.js) after a
// client-side entity create. The record is RE-READ from Base44 by id — the client
// payload is never trusted for content, only for the id + table routing.
const TABLE_TO_ENTITY: Record<string, string> = {
  glow_drops: 'GlowDrop',
  follows: 'Follow',
  notifications: 'Notification',
  direct_messages: 'DirectMessage',
  prayer_requests: 'PrayerRequest',
};

const ID_PATTERN = /^(?:[0-9a-f]{24}|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

const fetchTableColumns = async (supabaseUrl: string, key: string, tableName: string): Promise<string[]> => {
  const res = await fetch(`${supabaseUrl}/rest/v1/`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!res.ok) throw new Error(`Schema fetch failed: ${res.status}`);
  const spec = await res.json();
  const schemas = spec?.definitions || spec?.components?.schemas || {};
  return Object.keys(schemas?.[tableName]?.properties || {});
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });
    const limited = await enforceApiRateLimit(base44, req, user);
    if (limited) return limited;

    const payload = await req.json().catch(() => null);
    const rawTable = typeof payload?.table === 'string' ? payload.table : '';
    const recordId = typeof payload?.record?.id === 'string' ? payload.record.id : '';
    // Accept snake_case table names or PascalCase entity names; normalize to snake_case.
    const tableName = TABLE_TO_ENTITY[rawTable] ? rawTable : SUPABASE_TABLE_MAP[rawTable];
    if (!tableName) return Response.json({ error: 'Unsupported table' }, { status: 400 });
    if (!ID_PATTERN.test(recordId)) return Response.json({ error: 'record.id must be a valid identifier' }, { status: 400 });

    const entityName = TABLE_TO_ENTITY[tableName];
    const record = await base44.asServiceRole.entities[entityName].get(recordId).catch(() => null);
    if (!record) return Response.json({ error: 'Record not found' }, { status: 404 });

    // Only the record's owner (or an admin) may trigger a mirror of it.
    const isAdmin = ['admin', 'super_admin'].includes(user.role);
    const isOwner = record.created_by_id === user.id
      || record.user_email === user.email
      || record.sender_id === user.id
      || record.follower_id === user.id
      || record.actor_user_id === user.id;
    if (!isOwner && !isAdmin) return Response.json({ error: 'Not allowed' }, { status: 403 });

    const key = getSupabaseServiceKey();
    const supabaseUrl = getSupabaseUrl();
    if (!key || !supabaseUrl) return Response.json({ error: 'Supabase is not configured' }, { status: 503 });

    // Only send columns that exist in the Supabase table (Base44 records can carry extra fields).
    const allowedColumns = await fetchTableColumns(supabaseUrl, key, tableName);
    if (allowedColumns.length === 0) return Response.json({ error: `Table ${tableName} is missing in Supabase` }, { status: 500 });
    const row: Record<string, unknown> = {};
    for (const col of allowedColumns) {
      const value = record[col];
      row[col] = value === undefined ? null : (value && typeof value === 'object' ? JSON.stringify(value) : value);
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/${tableName}`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(row),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[supabase-mirror] FAILED table=${tableName} id=${recordId} status=${res.status} at=${new Date().toISOString()} body=${body.slice(0, 300)}`);
      return Response.json({ error: `Supabase write failed (${res.status})` }, { status: 502 });
    }
    return Response.json({ success: true, table: tableName, id: recordId });
  } catch (error) {
    console.error(`[supabase-mirror] dualWriteSupabase error at=${new Date().toISOString()}:`, error?.message);
    return Response.json({ error: error?.message || 'Dual-write failed' }, { status: 500 });
  }
});