import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    // Process a bounded number of unread notifications per call to stay within
    // the per-request rate limit. Returns `remaining: true` when more are left,
    // so the client can call again until everything is cleared. Strictly scoped
    // to the calling user's own notifications.
    const perCall = 60;
    const batch = await base44.asServiceRole.entities.Notification.filter(
      { user_id: user.id, read: false },
      '-created_date',
      perCall
    );

    let updated = 0;
    let hitLimit = false;
    for (let i = 0; i < batch.length; i += 5) {
      const slice = batch.slice(i, i + 5);
      try {
        await Promise.all(slice.map(n => base44.asServiceRole.entities.Notification.update(n.id, { read: true })));
        updated += slice.length;
      } catch (e) {
        // If we hit the rate limit mid-batch, stop gracefully and let the client
        // retry — report success for what we managed so far.
        if (String(e?.message || e).toLowerCase().includes('rate limit')) { hitLimit = true; break; }
        throw e;
      }
      await sleep(150);
    }

    // More remain if the page was full, or we stopped early due to a rate limit.
    const remaining = hitLimit || batch.length === perCall;
    return Response.json({ success: true, updated, remaining });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});