import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

const BOOST_MARKER = 'daily_keep_it_100_boosted';

// One-time cleanup: move every Keep It 100 slogan into the hidden "queue" so the
// feed isn't flooded. They are then released one-per-day by publishDailyKeepIt100.
// Releases exactly one today so the feed still shows a current slogan.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try { body = await req.json(); } catch { body = {}; }

    const today = new Date().toISOString().split('T')[0];
    const drops = await base44.asServiceRole.entities.GlowDrop.filter({ category: 'Keep It 100' }, '-created_date', 10000);

    const sorted = [...drops].sort((a, b) => new Date(a.created_date || 0) - new Date(b.created_date || 0));
    // The first (oldest) slogan is the one released today; everything else gets queued.
    const todayReleasedId = sorted[0]?.id;
    const releasedToday = drops.find((d) => d.description === `${BOOST_MARKER}:${today}`);

    // Slogans still needing to be queued (hidden), excluding today's released one.
    const toHide = drops.filter((d) => d.id !== todayReleasedId && (d.hidden !== true || d.pinned === true || (d.description && !String(d.description).startsWith(BOOST_MARKER))));

    if (body.dry_run) {
      return Response.json({ success: true, dry_run: true, total: drops.length, remaining_to_hide: toHide.length });
    }

    const batchLimit = Math.max(1, Math.min(Number(body.limit || 80), 80));
    let hidden = 0;
    for (const drop of toHide.slice(0, batchLimit)) {
      await base44.asServiceRole.entities.GlowDrop.update(drop.id, { hidden: true, pinned: false, description: null });
      hidden += 1;
    }

    // Once all are queued, release exactly one today (the oldest) if not already released.
    let released = 0;
    const remaining = toHide.length - hidden;
    if (remaining === 0 && todayReleasedId && !releasedToday) {
      const first = sorted[0];
      await base44.asServiceRole.entities.GlowDrop.update(first.id, {
        hidden: false,
        pinned: true,
        bonus_likes_enabled: true,
        bonus_likes_count: Math.max(Number(first.bonus_likes_count || 0), 24),
        description: `${BOOST_MARKER}:${today}`,
      });
      released = 1;
    }

    return Response.json({ success: true, total: drops.length, hidden_this_run: hidden, remaining_to_hide: remaining, released_today: released });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});