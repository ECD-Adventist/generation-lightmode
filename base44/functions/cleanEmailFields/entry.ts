import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = base44.asServiceRole.entities;

    const results = {
      directMessages: { processed: 0, cleared: 0, errors: 0 },
      follow: { processed: 0, cleared: 0, errors: 0 },
      glowDrop: { processed: 0, cleared: 0, errors: 0 },
    };

    function getRecords(res) {
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.records)) return res.records;
      return [];
    }

    // 1. DirectMessage
    let skip = 0;
    while (true) {
      const records = getRecords(await db.DirectMessage.list({ limit: 100, skip }));
      if (records.length === 0) break;
      skip += records.length;
      for (const r of records) {
        results.directMessages.processed++;
        if (r.sender_email || r.recipient_email) {
          try {
            await db.DirectMessage.update(r.id, { sender_email: null, recipient_email: null });
            results.directMessages.cleared++;
          } catch (_) { results.directMessages.errors++; }
        }
      }
    }

    // 2. Follow
    skip = 0;
    while (true) {
      const records = getRecords(await db.Follow.list({ limit: 100, skip }));
      if (records.length === 0) break;
      skip += records.length;
      for (const r of records) {
        results.follow.processed++;
        if (r.follower_email || r.following_email) {
          try {
            await db.Follow.update(r.id, { follower_email: null, following_email: null });
            results.follow.cleared++;
          } catch (_) { results.follow.errors++; }
        }
      }
    }

    // 3. GlowDrop
    skip = 0;
    while (true) {
      const records = getRecords(await db.GlowDrop.list({ limit: 100, skip }));
      if (records.length === 0) break;
      skip += records.length;
      for (const r of records) {
        results.glowDrop.processed++;
        if (r.user_email) {
          try {
            await db.GlowDrop.update(r.id, { user_email: null });
            results.glowDrop.cleared++;
          } catch (_) { results.glowDrop.errors++; }
        }
      }
    }

    return Response.json({ ok: true, message: 'Email field migration complete', results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});