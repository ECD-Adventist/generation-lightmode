import { base44 } from "@/api/base44Client";

/**
 * Dual-write Step 2: remove a record's Supabase mirror after it was deleted in Base44.
 *
 * Call this AFTER the Base44 delete resolves — the backend refuses to touch Supabase
 * while the record still exists in Base44, so Base44 always stays the source of truth.
 *
 * Fire-and-forget: never blocks or throws into the UI. Failures are logged (never
 * silent), and the scheduled reconcileSupabaseDrift sweep is the safety net.
 *
 * @param {"glow_drops"|"follows"|"prayer_requests"|"direct_messages"|"notifications"} table
 * @param {string} id - the deleted Base44 record id
 */
export function dualDeleteSupabase(table, id) {
  if (!id) return;
  base44.functions
    .invoke("mirrorSupabaseDelete", { table, id })
    .catch((err) => {
      console.error(
        `[supabase-delete] FAILED table=${table} id=${id} at=${new Date().toISOString()}`,
        err?.message || err
      );
    });
}