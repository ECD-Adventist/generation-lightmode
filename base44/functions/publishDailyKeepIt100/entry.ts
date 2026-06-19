import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

const BOOST_MARKER = 'daily_keep_it_100_boosted';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try { body = await req.json(); } catch { body = {}; }

    const today = new Date().toISOString().split('T')[0];
    // Load ALL Keep It 100 slogans (including hidden/queued ones).
    const drops = await base44.asServiceRole.entities.GlowDrop.filter({
      category: 'Keep It 100',
      status: 'approved',
      is_flagged: false,
    });

    const alreadyBoostedToday = drops.find((drop) => drop.description === `${BOOST_MARKER}:${today}`);
    if (alreadyBoostedToday) {
      return Response.json({ success: true, skipped: true, reason: 'Already released today', drop_id: alreadyBoostedToday.id });
    }

    // Un-pin yesterday's released slogan (it stays visible in the feed, just no longer pinned to top).
    const boostedPinnedDrops = drops.filter((drop) => drop.pinned === true && String(drop.description || '').startsWith(BOOST_MARKER));
    if (!body.dry_run) {
      for (const drop of boostedPinnedDrops) {
        await base44.asServiceRole.entities.GlowDrop.update(drop.id, { pinned: false });
      }
    }

    // The daily queue: slogans that are still hidden and haven't been released yet.
    const queued = drops
      .filter((drop) => drop.hidden === true && !String(drop.description || '').startsWith(BOOST_MARKER))
      .sort((a, b) => new Date(a.created_date || 0) - new Date(b.created_date || 0));

    if (queued.length === 0) {
      return Response.json({ success: true, skipped: true, reason: 'No queued Keep It 100 drops remain' });
    }

    const selected = queued[0];
    const updateData = {
      hidden: false, // release it to the public feed
      pinned: true,
      bonus_likes_enabled: true,
      bonus_likes_count: Math.max(Number(selected.bonus_likes_count || 0), 24),
      description: `${BOOST_MARKER}:${today}`,
    };

    if (body.dry_run) {
      return Response.json({ success: true, dry_run: true, drop_id: selected.id, reflection: selected.reflection, verse: selected.verse, remaining_queued: queued.length });
    }

    await base44.asServiceRole.entities.GlowDrop.update(selected.id, updateData);
    return Response.json({ success: true, type: 'keeping_it_100_release', drop_id: selected.id, remaining_queued: queued.length - 1 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});