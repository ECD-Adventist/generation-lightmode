import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const PAGE_SIZE = 500;
const DELETE_CHUNK = 200;
const TIME_BUDGET_MS = 50000;

function groupKey(n) {
  return `${n.user_id || ''}|${n.type || ''}|${n.message || ''}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Scheduled automation runs have no user session. When a user IS present,
    // require admin. The operation is safe/idempotent (only removes exact
    // duplicate notifications, always keeping the oldest per group).
    let user = null;
    try { user = await base44.auth.me(); } catch (_e) { user = null; }
    if (user && user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });
    }

    const startedAt = Date.now();
    const seenKeys = new Set();
    let kept = 0;
    let deleted = 0;
    let hasMore = false;

    // Scan ascending by created_date so the FIRST record seen per group is the oldest (kept).
    // Duplicates are deleted page-by-page; since deleted records vanish from the list,
    // the next page offset is simply the number of records kept so far.
    let skip = 0;
    while (true) {
      if (Date.now() - startedAt > TIME_BUDGET_MS) {
        hasMore = true;
        break;
      }

      const rows = await base44.asServiceRole.entities.Notification.list('created_date', PAGE_SIZE, skip);
      if (rows.length === 0) break;

      const toDelete = [];
      for (const row of rows) {
        const key = groupKey(row);
        if (seenKeys.has(key)) {
          toDelete.push(row.id);
        } else {
          seenKeys.add(key);
          kept += 1;
        }
      }

      if (toDelete.length > 0) {
        for (let i = 0; i < toDelete.length; i += DELETE_CHUNK) {
          const chunk = toDelete.slice(i, i + DELETE_CHUNK);
          try {
            await base44.asServiceRole.entities.Notification.deleteMany({ id: { $in: chunk } });
          } catch (_e) {
            // Fallback if $in on id is not supported: delete individually.
            for (const id of chunk) {
              await base44.asServiceRole.entities.Notification.delete(id);
            }
          }
          deleted += chunk.length;
        }
      }

      // Deleted rows are gone from the collection, so continue after the kept ones.
      skip = kept;

      if (rows.length < PAGE_SIZE && toDelete.length === 0) break;
      if (rows.length < PAGE_SIZE) {
        // Last page — re-check from the same offset in case deletions pulled new rows in.
        continue;
      }
    }

    return Response.json({ kept, deleted, has_more: hasMore });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});