import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// One-off maintenance: restore GlowDrop.user_email from created_by for records
// where a previous migration left user_email empty. Admin-only.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const MAX_PER_RUN = 60; // keep each run under the rate-limit ceiling
    let fixed = 0;

    // Fetch only a batch of broken rows (user_email is empty). We fix from the
    // top each run; the set shrinks until none remain. Call repeatedly until remaining = 0.
    const batch = await base44.asServiceRole.entities.GlowDrop.filter({ user_email: null }, '-created_date', MAX_PER_RUN);
    const toFix = (batch || []).filter((d) => d.created_by && !d.created_by.includes('@no-reply.base44.com'));

    for (const d of toFix) {
      await base44.asServiceRole.entities.GlowDrop.update(d.id, { user_email: d.created_by });
      fixed++;
      await sleep(600);
    }

    return Response.json({ fixed, hadMoreInBatch: (batch || []).length === MAX_PER_RUN });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});