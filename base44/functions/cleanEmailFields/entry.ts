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

    // 1. DirectMessage: clear sender_email & recipient_email
    let skip = 0;
    let hasMore = true;
    while (hasMore) {
      const { records, has_more } = await db.DirectMessage.list({ limit: 100, skip });
      hasMore = has_more;
      skip += records.length;
      for (const record of records) {
        results.directMessages.processed++;
        if ((record.sender_email && record.sender_email !== '') || (record.recipient_email && record.recipient_email !== '')) {
          try {
            await db.DirectMessage.update(record.id, { sender_email: null, recipient_email: null });
            results.directMessages.cleared++;
          } catch (e) { results.directMessages.errors++; }
        }
      }
    }

    // 2. Follow: clear follower_email & following_email
    skip = 0; hasMore = true;
    while (hasMore) {
      const { records, has_more } = await db.Follow.list({ limit: 100, skip });
      hasMore = has_more;
      skip += records.length;
      for (const record of records) {
        results.follow.processed++;
        if ((record.follower_email && record.follower_email !== '') || (record.following_email && record.following_email !== '')) {
          try {
            await db.Follow.update(record.id, { follower_email: null, following_email: null });
            results.follow.cleared++;
          } catch (e) { results.follow.errors++; }
        }
      }
    }

    // 3. GlowDrop: clear user_email
    skip = 0; hasMore = true;
    while (hasMore) {
      const { records, has_more } = await db.GlowDrop.list({ limit: 100, skip });
      hasMore = has_more;
      skip += records.length;
      for (const record of records) {
        results.glowDrop.processed++;
        if (record.user_email && record.user_email !== '') {
          try {
            await db.GlowDrop.update(record.id, { user_email: null });
            results.glowDrop.cleared++;
          } catch (e) { results.glowDrop.errors++; }
        }
      }
    }

    return Response.json({ ok: true, message: 'Email field migration complete', results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});