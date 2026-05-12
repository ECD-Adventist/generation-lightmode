import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MAX_BONUS_LIKES = 24;
const BATCH_LIMIT = 100;

function parseDate(value) {
  if (!value) return null;
  return new Date(value.endsWith('Z') ? value : `${value}Z`);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let caller = null;
    try { caller = await base44.auth.me(); } catch { /* scheduled automation */ }

    if (caller && !['admin', 'super_admin'].includes(caller.role)) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const now = new Date();
    const oneHourMs = 60 * 60 * 1000;
    const drops = await base44.asServiceRole.entities.GlowDrop.filter({ bonus_likes_enabled: true }, '-created_date', BATCH_LIMIT);

    let boosted = 0;
    let completed = 0;

    for (const drop of drops) {
      const bonusCount = Number(drop.bonus_likes_count || 0);
      if (bonusCount >= MAX_BONUS_LIKES) {
        await base44.asServiceRole.entities.GlowDrop.update(drop.id, { bonus_likes_enabled: false });
        completed += 1;
        continue;
      }

      const createdAt = parseDate(drop.created_date);
      const lastAppliedAt = parseDate(drop.bonus_likes_last_applied_at) || createdAt;
      if (!lastAppliedAt || now.getTime() - lastAppliedAt.getTime() < oneHourMs) continue;

      const newBonusCount = bonusCount + 1;
      await base44.asServiceRole.entities.GlowDrop.update(drop.id, {
        likes_count: Number(drop.likes_count || 0) + 1,
        bonus_likes_count: newBonusCount,
        bonus_likes_last_applied_at: now.toISOString(),
        bonus_likes_enabled: newBonusCount < MAX_BONUS_LIKES,
      });

      boosted += 1;
      if (newBonusCount >= MAX_BONUS_LIKES) completed += 1;
    }

    return Response.json({ success: true, checked: drops.length, boosted, completed });
  } catch (error) {
    console.error('Bonus likes error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});