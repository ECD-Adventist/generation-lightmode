import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';
import { XP_RULES, MILESTONE_REWARDS, awardXp, fetchAllRows, isRecent, todayString } from '../../shared/xp.ts';

const ACTIONS = ['post_drop', 'comment', 'follow', 'devotion_day', 'challenge', 'milestone'];

async function milestoneReached(svc, user, key) {
  if (key === '100_prayers_prayed') {
    return (await fetchAllRows(svc.PrayerSupport, { user_email: user.email })).length >= 100;
  }
  if (key === '25_people_followed') {
    return (await fetchAllRows(svc.Follow, { follower_id: user.id })).length >= 25;
  }
  const drops = await fetchAllRows(svc.GlowDrop, { user_email: user.email });
  if (key === '10_drops_shared') return drops.length >= 10;
  if (key === '10_days_consistent_posting') {
    return new Set(drops.map((d) => String(d.created_date || '').slice(0, 10)).filter(Boolean)).size >= 10;
  }
  return false;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.status === 'suspended') return Response.json({ error: 'Account suspended' }, { status: 403 });
    const rateLimited = await enforceApiRateLimit(base44, req, user);
    if (rateLimited) return rateLimited;

    const validated = await readValidatedJson(req, {
      action: { type: 'string', required: true, enum: ACTIONS },
      drop_id: { type: 'string', maxLength: 64 },
      following_id: { type: 'string', maxLength: 64 },
      plan_id: { type: 'string', maxLength: 100 },
      day_number: { type: 'number', integer: true, min: 1, max: 400 },
      challenge_id: { type: 'string', maxLength: 64 },
      milestone_key: { type: 'string', maxLength: 80 },
    });
    if (validated.response) return validated.response;
    const { action, drop_id, following_id, plan_id, day_number, challenge_id, milestone_key } = validated.data;
    const svc = base44.asServiceRole.entities;
    const today = todayString();
    const awards = [];

    if (action === 'post_drop') {
      if (!drop_id) return Response.json({ error: 'drop_id is required' }, { status: 400 });
      const drop = await svc.GlowDrop.get(drop_id).catch(() => null);
      if (!drop || drop.user_email !== user.email) return Response.json({ error: 'Post not found' }, { status: 404 });
      if (drop.original_drop_id) return Response.json({ error: 'Reposts do not earn XP' }, { status: 400 });
      if (!isRecent(drop.created_date)) return Response.json({ error: 'This post is too old to claim XP for' }, { status: 400 });
      awards.push(await awardXp(base44, user, { source: 'post_drop', reference_id: `post_${drop.id}`, amount: XP_RULES.post_drop, note: 'Posted a Glow Drop' }));
      awards.push(await awardXp(base44, user, { source: 'daily_share_verse', reference_id: `daily_share_verse_${today}`, amount: XP_RULES.daily_share_verse, note: 'Daily challenge: share a verse' }));
    } else if (action === 'comment') {
      if (!drop_id) return Response.json({ error: 'drop_id is required' }, { status: 400 });
      const comments = await svc.GlowDropComment.filter({ drop_id, user_email: user.email }, '-created_date', 1);
      if (!comments.length) return Response.json({ error: 'Comment not found' }, { status: 404 });
      awards.push(await awardXp(base44, user, { source: 'daily_comment', reference_id: `daily_comment_${today}`, amount: XP_RULES.daily_comment, note: 'Daily challenge: comment' }));
    } else if (action === 'follow') {
      if (!following_id) return Response.json({ error: 'following_id is required' }, { status: 400 });
      const follows = await svc.Follow.filter({ follower_id: user.id, following_id }, '-created_date', 1);
      if (!follows.length || !isRecent(follows[0].created_date)) return Response.json({ error: 'Follow not found' }, { status: 404 });
      awards.push(await awardXp(base44, user, { source: 'follow', reference_id: `follow_${following_id}`, amount: XP_RULES.follow, note: 'Followed a believer' }));
    } else if (action === 'devotion_day') {
      if (!plan_id || !day_number) return Response.json({ error: 'plan_id and day_number are required' }, { status: 400 });
      const entries = await svc.DevotionEntry.filter({ user_email: user.email, plan_id, day_number }, '-created_date', 1);
      if (!entries.length || !entries[0].completed) return Response.json({ error: 'Devotion day not completed' }, { status: 404 });
      awards.push(await awardXp(base44, user, { source: 'devotion_day', reference_id: `devotion_${plan_id}_${day_number}`, amount: XP_RULES.devotion_day, note: `Devotion ${plan_id} day ${day_number}` }));
    } else if (action === 'challenge') {
      if (!challenge_id) return Response.json({ error: 'challenge_id is required' }, { status: 400 });
      const [challenge, submissions] = await Promise.all([
        svc.Challenge.get(challenge_id).catch(() => null),
        svc.ChallengeSubmission.filter({ challenge_id, user_email: user.email }, '-created_date', 1),
      ]);
      if (!challenge || !submissions.length) return Response.json({ error: 'Challenge submission not found' }, { status: 404 });
      awards.push(await awardXp(base44, user, { source: 'challenge', reference_id: `challenge_${challenge_id}`, amount: Number(challenge.points_reward) || 0, note: `Challenge: ${challenge.title || challenge_id}` }));
    } else if (action === 'milestone') {
      const reward = MILESTONE_REWARDS[milestone_key || ''];
      if (!reward) return Response.json({ error: 'Unknown milestone' }, { status: 400 });
      if (!(await milestoneReached(svc, user, milestone_key))) return Response.json({ error: 'Milestone not reached yet' }, { status: 400 });
      const result = await awardXp(base44, user, { source: 'milestone', reference_id: `milestone_${milestone_key}`, amount: reward.xp, note: reward.title });
      if (!result.duplicate) {
        const existing = await svc.UserMilestone.filter({ user_email: user.email, milestone_key }, '-created_date', 1);
        if (!existing.length) await svc.UserMilestone.create({ user_email: user.email, milestone_key, title: reward.title, reward_xp: reward.xp });
      }
      awards.push(result);
    }

    const awarded = awards.reduce((sum, a) => sum + (a.awarded || 0), 0);
    const total = awards.length ? awards[awards.length - 1].total : null;
    return Response.json({ success: true, action, awarded, total });
  } catch (error) {
    console.error('awardXp failed:', error?.message);
    return Response.json({ error: 'Unable to award XP' }, { status: 500 });
  }
}