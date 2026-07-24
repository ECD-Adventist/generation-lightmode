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

// Fire-and-forget mirror of a Base44 record into Supabase. Never throws.
// Uses the service role key + Prefer: resolution=merge-duplicates to prevent dupes.
export const mirrorToSupabase = (table: string, row: Record<string, any>): void => {
  const key = getSupabaseServiceKey();
  const url = getSupabaseUrl();
  if (!key || !row?.id) return;
  fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(row),
  }).catch((e) => console.error(`Supabase mirror ${table} failed:`, e?.message));
};