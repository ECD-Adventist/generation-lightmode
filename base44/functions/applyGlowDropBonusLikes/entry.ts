import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { authorizeSchedulerOrAdmin } from '../../shared/schedulerAuth.ts';

const MAX_BONUS_LIKES = 24;
const BATCH_LIMIT = 500;
const BOOSTER_POOL_LIMIT = 500;
const MAX_DROPS_PER_RUN = 25;

function parseDate(value) {
  if (!value) return null;
  return new Date(value.endsWith('Z') ? value : `${value}Z`);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const authorized = await authorizeSchedulerOrAdmin(base44, req);
    if (!authorized) {
      return Response.json({ error: 'Forbidden: Admin or scheduler access required' }, { status: 403 });
    }

    const now = new Date();
    const oneHourMs = 60 * 60 * 1000;
    const drops = await base44.asServiceRole.entities.GlowDrop.filter({ status: 'approved', hidden: false }, '-created_date', BATCH_LIMIT);
    const boosters = await base44.asServiceRole.entities.User.filter({
      light_booster_opt_in: true,
      light_booster_approved: true,
      status: 'active'
    }, '-updated_date', BOOSTER_POOL_LIMIT);

    let boosted = 0;
    let completed = 0;
    let skippedNoBooster = 0;

    let processedDrops = 0;

    for (const drop of drops) {
      if (processedDrops >= MAX_DROPS_PER_RUN) break;
      const bonusCount = Number(drop.bonus_likes_count || 0);
      if (bonusCount >= MAX_BONUS_LIKES) {
        if (drop.bonus_likes_enabled) {
          await base44.asServiceRole.entities.GlowDrop.update(drop.id, { bonus_likes_enabled: false });
        }
        completed += 1;
        continue;
      }

      const createdAt = parseDate(drop.created_date);
      const lastAppliedAt = parseDate(drop.bonus_likes_last_applied_at) || createdAt;
      if (!lastAppliedAt) continue;

      const postAgeHours = Math.floor((now.getTime() - createdAt.getTime()) / oneHourMs);
      const expectedBonusCount = Math.min(MAX_BONUS_LIKES, postAgeHours);
      const boostsToApply = Math.min(MAX_BONUS_LIKES - bonusCount, expectedBonusCount - bonusCount);
      if (boostsToApply <= 0) continue;

      let recordedBoosterLikes = 0;

      if (boosters.length > 0) {
        const existingLikes = await base44.asServiceRole.entities.GlowDropLike.filter({ drop_id: drop.id }, '-created_date', 1000);
        const alreadyLikedEmails = new Set(existingLikes.map((like) => like.user_email));
        const eligibleBoosters = boosters.filter((booster) =>
          booster.email &&
          booster.email !== drop.user_email &&
          !alreadyLikedEmails.has(booster.email)
        );

        recordedBoosterLikes = Math.min(boostsToApply, eligibleBoosters.length);
        for (let i = 0; i < recordedBoosterLikes; i += 1) {
          const booster = eligibleBoosters[(bonusCount + existingLikes.length + i) % eligibleBoosters.length];
          await base44.asServiceRole.entities.GlowDropLike.create({
            drop_id: drop.id,
            user_email: booster.email
          });
        }
      }

      const syntheticBoosts = boostsToApply - recordedBoosterLikes;
      if (syntheticBoosts > 0) skippedNoBooster += 1;

      const newBonusCount = bonusCount + boostsToApply;
      await base44.asServiceRole.entities.GlowDrop.update(drop.id, {
        likes_count: Number(drop.likes_count || 0) + boostsToApply,
        bonus_likes_count: newBonusCount,
        bonus_likes_last_applied_at: now.toISOString(),
        bonus_likes_enabled: newBonusCount < MAX_BONUS_LIKES,
      });

      boosted += boostsToApply;
      processedDrops += 1;
      if (newBonusCount >= MAX_BONUS_LIKES) completed += 1;
    }

    return Response.json({ success: true, checked: drops.length, processedDrops, boosters: boosters.length, boosted, completed, skippedNoBooster });
  } catch (error) {
    console.error('Bonus likes error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});