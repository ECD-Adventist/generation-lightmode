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

// Canonical Base44 entity → Supabase table mapping. Supabase tables are snake_case;
// never pass a PascalCase entity name to PostgREST (it 404s: "Could not find the table").
export const SUPABASE_TABLE_MAP: Record<string, string> = {
  GlowDrop: 'glow_drops',
  Follow: 'follows',
  Notification: 'notifications',
  DirectMessage: 'direct_messages',
  PrayerRequest: 'prayer_requests',
};

// Fire-and-forget mirror of a Base44 record into Supabase. Never throws.
// Uses the service role key + Prefer: resolution=merge-duplicates to prevent dupes.
// FAILURES ARE NEVER SILENT: both network errors AND non-2xx HTTP responses
// (e.g. 404 wrong table, 400 bad column) are logged with table, id, and timestamp.
export const mirrorToSupabase = (table: string, row: Record<string, any>): void => {
  const key = getSupabaseServiceKey();
  const url = getSupabaseUrl();
  // Accept a PascalCase entity name defensively and normalize it.
  const tableName = SUPABASE_TABLE_MAP[table] || table;
  if (!key || !row?.id) return;
  fetch(`${url}/rest/v1/${tableName}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(row),
  }).then(async (res) => {
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[supabase-mirror] FAILED table=${tableName} id=${row.id} status=${res.status} at=${new Date().toISOString()} body=${body.slice(0, 300)}`);
    }
  }).catch((e) => {
    console.error(`[supabase-mirror] FAILED table=${tableName} id=${row?.id} at=${new Date().toISOString()} error=${e?.message}`);
  });
};