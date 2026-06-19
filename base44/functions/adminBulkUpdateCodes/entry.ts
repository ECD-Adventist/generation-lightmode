import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

const ALLOWED_ROLES = new Set([
  'admin',
  'super_admin',
  'moderator',
  'ecd_admin',
  'country_admin',
  'union_admin',
  'conference_field_admin',
  'church_admin'
]);

// Run an async op over items in small throttled batches to stay under rate limits.
async function runInBatches(items, fn, batchSize, pauseMs) {
  let processed = 0;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(fn));
    processed += batch.length;
    if (i + batchSize < items.length) await new Promise(r => setTimeout(r, pauseMs));
  }
  return processed;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!ALLOWED_ROLES.has(user.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });

    let body = {};
    try { body = await req.json(); } catch { body = {}; }

    const action = body?.action;            // "approve" | "reject" | "pending" | "delete"
    const ids = Array.isArray(body?.ids) ? body.ids : null;        // explicit id list, or
    const sourceFilter = body?.sourceFilter || null;               // operate on a whole source
    const statusFilter = body?.statusFilter || null;               // optionally limit by status

    if (!['approve', 'reject', 'pending', 'delete'].includes(action)) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Resolve target ids.
    let targetIds = ids;
    if (!targetIds) {
      const query = {};
      if (sourceFilter) query.source_document = sourceFilter;
      if (statusFilter && statusFilter !== 'all') query.status = statusFilter;
      const PAGE_SIZE = 1000;
      const found = [];
      let skip = 0;
      while (true) {
        const batch = await base44.asServiceRole.entities.CodeOfTruth.filter(query, '-created_date', PAGE_SIZE, skip);
        if (!batch || batch.length === 0) break;
        found.push(...batch.map(c => c.id));
        if (batch.length < PAGE_SIZE) break;
        skip += PAGE_SIZE;
      }
      targetIds = found;
    }

    if (!targetIds || targetIds.length === 0) {
      return Response.json({ processed: 0 });
    }

    const statusMap = { approve: 'approved', reject: 'rejected', pending: 'pending' };

    const processed = await runInBatches(
      targetIds,
      action === 'delete'
        ? id => base44.asServiceRole.entities.CodeOfTruth.delete(id)
        : id => base44.asServiceRole.entities.CodeOfTruth.update(id, { status: statusMap[action] }),
      25,   // 25 per batch
      150   // short pause between batches
    );

    return Response.json({ processed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});