// Shared Supabase utilities for backend functions.
// Centralizes URL resolution + service key access so every function uses the same logic.

export const getSupabaseUrl = (): string => {
  const databaseUrl = Deno.env.get('SUPABASE_DATABASE_URL') || '';
  const match = databaseUrl.match(/postgres\.([a-z0-9]+)@|\/\/[^@]*@(?:db\.)?([a-z0-9]+)\.supabase\.co/i);
  const projectRef = match?.[1] || match?.[2];
  if (projectRef) return `https://${projectRef}.supabase.co`;
  return Deno.env.get('SUPABASE_URL') || '';
};

export const getSupabaseServiceKey = (): string => {
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
};

// Per-isolate cache of table → column set (from the PostgREST OpenAPI schema).
let schemaCache: Map<string, Set<string>> | null = null;
export const getTableColumns = async (url: string, key: string, tableName: string): Promise<Set<string> | null> => {
  if (!schemaCache) {
    try {
      const res = await fetch(`${url}/rest/v1/`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
      if (!res.ok) return null;
      const spec = await res.json();
      const defs = spec?.definitions || spec?.components?.schemas || {};
      schemaCache = new Map();
      for (const [table, schema] of Object.entries(defs)) {
        schemaCache.set(table, new Set(Object.keys((schema as any)?.properties || {})));
      }
    } catch {
      return null;
    }
  }
  return schemaCache.get(tableName) || null;
};

// Canonical Base44 entity → Supabase table mapping. Supabase tables are snake_case;
// never pass a PascalCase entity name to PostgREST (it 404s: "Could not find the table").
export const SUPABASE_TABLE_MAP: Record<string, string> = {
  GlowDrop: 'glow_drops',
  Follow: 'follows',
  Notification: 'notifications',
  DirectMessage: 'direct_messages',
  PrayerRequest: 'prayer_requests',
  GlowGroupJoinRequest: 'glow_group_join_requests',
  GlowGroupMember: 'glow_group_members',
};

// Mirror of a Base44 record into Supabase. Never throws — MUST be awaited by callers:
// un-awaited fetches are cancelled when the serverless function returns, which is
// exactly how writes were silently lost. Uses the service role key +
// Prefer: resolution=merge-duplicates to prevent dupes.
// FAILURES ARE NEVER SILENT: both network errors AND non-2xx HTTP responses
// (e.g. 404 wrong table, 400 bad column) are logged with table, id, and timestamp.
export const mirrorToSupabase = async (table: string, row: Record<string, any>): Promise<boolean> => {
  const key = getSupabaseServiceKey();
  const url = getSupabaseUrl();
  // Accept a PascalCase entity name defensively and normalize it.
  const tableName = SUPABASE_TABLE_MAP[table] || table;
  if (!key || !row?.id) return false;
  try {
    // Only send columns that actually exist in the Supabase table — Base44 records
    // carry extra fields (e.g. author_avatar) that make PostgREST reject the whole
    // insert with 400 PGRST204. Schema is cached per isolate.
    const columns = await getTableColumns(url, key, tableName);
    let payload = row;
    if (columns && columns.size > 0) {
      payload = {};
      for (const [k, v] of Object.entries(row)) {
        if (columns.has(k)) payload[k] = v === undefined ? null : (v && typeof v === 'object' ? JSON.stringify(v) : v);
      }
    }
    const res = await fetch(`${url}/rest/v1/${tableName}`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[supabase-mirror] FAILED table=${tableName} id=${row.id} status=${res.status} at=${new Date().toISOString()} body=${body.slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[supabase-mirror] FAILED table=${tableName} id=${row?.id} at=${new Date().toISOString()} error=${e?.message}`);
    return false;
  }
};

// Dual-DELETE counterpart of mirrorToSupabase. Removes the mirrored row so a record
// deleted in Base44 never lingers in Supabase (reverse drift). Never throws, always
// logs failures. MUST be awaited (an un-awaited fetch is cancelled on return).
export const deleteFromSupabase = async (table: string, id: string): Promise<boolean> => {
  const key = getSupabaseServiceKey();
  const url = getSupabaseUrl();
  const tableName = SUPABASE_TABLE_MAP[table] || table;
  if (!key || !url || !id) return false;
  try {
    const res = await fetch(`${url}/rest/v1/${tableName}?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'return=minimal' },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[supabase-delete] FAILED table=${tableName} id=${id} status=${res.status} at=${new Date().toISOString()} body=${body.slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[supabase-delete] FAILED table=${tableName} id=${id} at=${new Date().toISOString()} error=${e?.message}`);
    return false;
  }
};

// Every row id currently stored in a Supabase table (paginated — PostgREST caps page size).
export const fetchSupabaseIds = async (tableName: string): Promise<Set<string>> => {
  const key = getSupabaseServiceKey();
  const url = getSupabaseUrl();
  const ids = new Set<string>();
  if (!key || !url) return ids;
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const res = await fetch(`${url}/rest/v1/${tableName}?select=id&limit=${pageSize}&offset=${offset}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[supabase-read] FAILED table=${tableName} status=${res.status} body=${body.slice(0, 300)}`);
      break;
    }
    const rows = await res.json();
    if (!Array.isArray(rows)) break;
    rows.forEach((r: any) => r?.id && ids.add(String(r.id)));
    if (rows.length < pageSize) break;
  }
  return ids;
};