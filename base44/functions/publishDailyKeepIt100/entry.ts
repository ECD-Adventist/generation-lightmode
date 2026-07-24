import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';
import { authorizeSchedulerOrAdmin } from '../../shared/schedulerAuth.ts';

const BOOST_MARKER = 'daily_keep_it_100_boosted';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    if (!await authorizeSchedulerOrAdmin(base44, req)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    let body = {};
    try { body = await req.json(); } catch { body = {}; }

    const today = new Date().toISOString().split('T')[0];
    const drops = await base44.asServiceRole.entities.GlowDrop.filter({
      category: 'Keep It 100',
      status: 'approved',
      hidden: false,
      is_flagged: false,
    });

    const alreadyBoostedToday = drops.find((drop) => drop.description === `${BOOST_MARKER}:${today}`);
    if (alreadyBoostedToday) {
      return Response.json({ success: true, skipped: true, reason: 'Already boosted today', drop_id: alreadyBoostedToday.id });
    }

    const boostedPinnedDrops = drops.filter((drop) => drop.pinned === true && String(drop.description || '').startsWith(BOOST_MARKER));
    if (!body.dry_run) {
      for (const drop of boostedPinnedDrops) {
        await base44.asServiceRole.entities.GlowDrop.update(drop.id, { pinned: false });
      }
    }

    const unposted = drops
      .filter((drop) => !String(drop.description || '').startsWith(BOOST_MARKER))
      .sort((a, b) => new Date(a.created_date || 0) - new Date(b.created_date || 0));

    if (unposted.length === 0) {
      return Response.json({ success: true, skipped: true, reason: 'No unposted Keep It 100 drops remain' });
    }

    const selected = unposted[0];
    const updateData = {
      bonus_likes_enabled: true,
      bonus_likes_count: Math.max(Number(selected.bonus_likes_count || 0), 24),
      description: `${BOOST_MARKER}:${today}`,
    };

    if (body.dry_run) {
      return Response.json({ success: true, dry_run: true, drop_id: selected.id, reflection: selected.reflection, verse: selected.verse, remaining_unposted: unposted.length });
    }

    await base44.asServiceRole.entities.GlowDrop.update(selected.id, updateData);
    return Response.json({ success: true, type: 'keeping_it_100_boost', drop_id: selected.id, remaining_unposted: unposted.length - 1 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});