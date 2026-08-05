// Supabase persistence for reposts via PostgREST (service role key held server-side).
// The `reposts` table enforces UNIQUE (reposter_user_id, original_post_id) — a duplicate
// insert fails with Postgres code 23505, which is how repost races are rejected.
import { getSupabaseUrl, getSupabaseServiceKey } from './supabase.ts';

const headers = () => {
  const key = getSupabaseServiceKey();
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
};

export const isRepostStoreConfigured = (): boolean => Boolean(getSupabaseServiceKey() && getSupabaseUrl());

export async function insertRepostRow(row: Record<string, any>): Promise<{ ok: boolean; duplicate: boolean }> {
  const res = await fetch(`${getSupabaseUrl()}/rest/v1/reposts`, {
    method: 'POST',
    headers: { ...headers(), Prefer: 'return=minimal' },
    body: JSON.stringify(row),
  });
  if (res.ok) return { ok: true, duplicate: false };
  let code = '';
  try { code = (await res.json())?.code || ''; } catch { code = ''; }
  return { ok: false, duplicate: code === '23505' };
}

export async function deleteRepostRow(id: string, reposterUserId: string): Promise<boolean> {
  const query = `id=eq.${encodeURIComponent(id)}&reposter_user_id=eq.${encodeURIComponent(reposterUserId)}`;
  const res = await fetch(`${getSupabaseUrl()}/rest/v1/reposts?${query}`, { method: 'DELETE', headers: headers() });
  return res.ok;
}