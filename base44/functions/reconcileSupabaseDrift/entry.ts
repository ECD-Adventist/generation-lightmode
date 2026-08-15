import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';
import { authorizeSchedulerOrAdmin } from '../../shared/schedulerAuth.ts';
import { mirrorToSupabase, deleteFromSupabase, fetchSupabaseIds, SUPABASE_TABLE_MAP } from '../../shared/supabase.ts';

/**
 * Two-way reconciliation between Base44 (source of truth) and the Supabase mirror.
 *
 *   in Base44, not in Supabase  → insert  (backfill missed dual-writes)
 *   in Supabase, not in Base44  → delete  (purge orphans left by missed dual-deletes)
 *
 * Safe to run repeatedly; designed to be scheduled (e.g. every 6 hours).
 * Returns a per-table report: base44_count, supabase_count, inserted, deleted, remaining_drift.
 */
const ENTITIES: Array<{ entity: string; table: string }> = [
  { entity: 'GlowDrop', table: 'glow_drops' },
  { entity: 'PrayerRequest', table: 'prayer_requests' },
  { entity: 'DirectMessage', table: 'direct_messages' },
  { entity: 'Follow', table: 'follows' },
  { entity: 'Notification', table: 'notifications' },
];

const MAX_WRITES_PER_TABLE = 500;

async function listAllRecords(entity: any) {
  const all: any[] = [];
  const limit = 500;
  for (let skip = 0; ; skip += limit) {
    const rows = await entity.list('-created_date', limit, skip);
    all.push(...rows);
    if (rows.length < limit) break;
  }
  return all;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    if (!await authorizeSchedulerOrAdmin(base44, req)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const dryRun = payload?.dry_run === true;
    const onlyTable = typeof payload?.table === 'string' ? (SUPABASE_TABLE_MAP[payload.table] || payload.table) : null;

    const report: any[] = [];

    for (const { entity, table } of ENTITIES) {
      if (onlyTable && table !== onlyTable) continue;

      const records = await listAllRecords(base44.asServiceRole.entities[entity]).catch((e) => {
        console.error(`[reconcile] base44 read FAILED entity=${entity} error=${e?.message}`);
        return null;
      });
      if (!records) {
        report.push({ table, error: 'Base44 read failed' });
        continue;
      }

      const supabaseIds = await fetchSupabaseIds(table);
      const base44Ids = new Set(records.map((r) => String(r.id)));

      const missing = records.filter((r) => !supabaseIds.has(String(r.id))).slice(0, MAX_WRITES_PER_TABLE);
      const orphans = [...supabaseIds].filter((id) => !base44Ids.has(id)).slice(0, MAX_WRITES_PER_TABLE);

      let inserted = 0;
      let deleted = 0;

      if (!dryRun) {
        for (const record of missing) {
          if (await mirrorToSupabase(table, record)) inserted += 1;
        }
        for (const id of orphans) {
          if (await deleteFromSupabase(table, id)) deleted += 1;
        }
      }

      const remainingDrift = (missing.length - inserted) + (orphans.length - deleted);
      console.log(`[reconcile] table=${table} base44=${base44Ids.size} supabase=${supabaseIds.size} missing=${missing.length} orphans=${orphans.length} inserted=${inserted} deleted=${deleted} remaining_drift=${remainingDrift}`);

      report.push({
        table,
        base44_count: base44Ids.size,
        supabase_count: supabaseIds.size,
        missing_in_supabase: missing.length,
        orphans_in_supabase: orphans.length,
        inserted,
        deleted,
        remaining_drift: remainingDrift,
      });
    }

    const totalDrift = report.reduce((sum, r) => sum + (r.remaining_drift || 0), 0);
    console.log(`[reconcile] complete dry_run=${dryRun} total_remaining_drift=${totalDrift} at=${new Date().toISOString()}`);

    return Response.json({ success: true, dry_run: dryRun, total_remaining_drift: totalDrift, report });
  } catch (error) {
    console.error('[reconcile] reconcileSupabaseDrift failed:', error?.message);
    return Response.json({ error: error?.message || 'Reconciliation failed' }, { status: 500 });
  }
});