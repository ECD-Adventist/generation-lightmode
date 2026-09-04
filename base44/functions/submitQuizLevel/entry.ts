import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';
import { awardXp, fetchAllRows } from '../../shared/xp.ts';
import { QUIZ_KEY, TOTAL_QUIZ_LEVELS, scoreLevel } from '../../shared/quizAnswers.ts';

function parseStars(raw) {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const rateLimited = await enforceApiRateLimit(base44, req, user);
    if (rateLimited) return rateLimited;

    const validated = await readValidatedJson(req, {
      level: { type: 'number', required: true, integer: true, min: 1, max: TOTAL_QUIZ_LEVELS },
      answers: { type: 'array', required: true, maxItems: 20, items: { type: 'number', integer: true, min: -1, max: 3 } },
    });
    if (validated.response) return validated.response;
    const { level, answers } = validated.data;

    const key = QUIZ_KEY[level];
    if (answers.length !== key.correct.length) return Response.json({ error: 'Answer count does not match this level' }, { status: 400 });

    // The server decides which levels are unlocked — never the client.
    const account = await base44.asServiceRole.entities.User.get(user.id);
    const unlockedLevel = Math.min(Math.max(Number(account?.quiz_level) || 1, 1), TOTAL_QUIZ_LEVELS);
    if (level > unlockedLevel) return Response.json({ error: 'This level is still locked' }, { status: 403 });

    const result = scoreLevel(level, answers);
    const source = `quiz_l${level}`;

    // XP for a level only grows on a genuine personal best; retries never pay again.
    const previous = await fetchAllRows(base44.asServiceRole.entities.XpEvent, { user_email: user.email, source });
    const previousBestXp = previous.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const delta = result.xp - previousBestXp;
    let awarded = 0;
    let total = null;
    if (delta > 0) {
      const award = await awardXp(base44, user, { source, reference_id: `${source}_s${result.score}`, amount: delta, note: `Faith Quiz level ${level}: ${result.score}/${result.questionCount}` });
      awarded = award.awarded;
      total = award.total;
    }

    const stars = parseStars(account?.quiz_stars);
    const previousStars = Number(stars[String(level)] || 0);
    if (result.stars > previousStars) stars[String(level)] = result.stars;
    const nextLevel = result.passed && level === unlockedLevel && level < TOTAL_QUIZ_LEVELS ? level + 1 : unlockedLevel;

    // Champions score = verified quiz XP only (per-level bests + any pre-ledger legacy credit).
    let quizScore = 0;
    for (let lvl = 1; lvl <= TOTAL_QUIZ_LEVELS; lvl += 1) {
      const rows = lvl === level && delta > 0
        ? [...previous, { amount: delta }]
        : await fetchAllRows(base44.asServiceRole.entities.XpEvent, { user_email: user.email, source: `quiz_l${lvl}` });
      quizScore += rows.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    }
    const legacy = await base44.asServiceRole.entities.XpEvent.filter({ user_email: user.email, source: 'quiz_legacy' }, '-created_date', 1);
    quizScore += legacy.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    await base44.asServiceRole.entities.User.update(user.id, {
      quiz_level: nextLevel,
      quiz_stars: JSON.stringify(stars),
      quiz_score: quizScore,
    });

    return Response.json({
      success: true,
      score: result.score,
      stars: result.stars,
      passed: result.passed,
      xp_earned: awarded,
      level_xp: result.xp,
      unlocked_level: nextLevel,
      just_unlocked: nextLevel > unlockedLevel,
      quiz_stars: stars,
      quiz_score: quizScore,
      glow_score: total,
    });
  } catch (error) {
    console.error('submitQuizLevel failed:', error?.message);
    return Response.json({ error: 'Unable to submit quiz' }, { status: 500 });
  }
}