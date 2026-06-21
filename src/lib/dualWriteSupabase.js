import { base44 } from "@/api/base44Client";

/**
 * Dual-write Step 1: mirror a freshly created Base44 record into Supabase.
 *
 * Fire-and-forget by design — the Base44 write is always the primary source of
 * truth. This never blocks or throws into the UI: a slow or failing Supabase
 * write is swallowed so the user experience is unaffected.
 *
 * The Supabase service_role key is NOT used here. This helper only calls a
 * backend function (dualWriteSupabase) which holds the key as a server secret.
 *
 * @param {"glow_drops"|"follows"|"prayer_requests"|"direct_messages"|"notifications"} table
 * @param {object} record - the Base44 record (must include its id)
 */
export function dualWriteSupabase(table, record) {
  if (!record || !record.id) return;
  // Intentionally not awaited — fire-and-forget.
  base44.functions
    .invoke("dualWriteSupabase", { table, record })
    .catch(() => {
      /* swallow: primary Base44 write already succeeded */
    });
}