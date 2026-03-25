export function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function isYesterday(dateString, todayString = getTodayString()) {
  const date = new Date(`${dateString}T00:00:00`);
  const today = new Date(`${todayString}T00:00:00`);
  const diffDays = Math.round((today - date) / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

export function getLevelInfo(score = 0) {
  const safeScore = Math.max(0, score || 0);
  const level = Math.floor(safeScore / 50) + 1;
  const currentLevelFloor = (level - 1) * 50;
  const nextLevelTarget = level * 50;
  const currentInLevel = safeScore - currentLevelFloor;
  const progressPercent = Math.min(100, (currentInLevel / 50) * 100);

  return {
    level,
    currentLevelFloor,
    nextLevelTarget,
    currentInLevel,
    progressPercent,
    remainingToNext: nextLevelTarget - safeScore,
  };
}

export async function applyDailyCheckIn(base44, user) {
  if (!user) return user;

  const today = getTodayString();
  if (user.last_checkin_date === today) return user;

  const nextStreak = isYesterday(user.last_checkin_date, today)
    ? (user.daily_checkin_streak || 0) + 1
    : 1;

  const updates = {
    last_checkin_date: today,
    daily_checkin_streak: nextStreak,
    longest_checkin_streak: Math.max(nextStreak, user.longest_checkin_streak || 0),
    streak_count: nextStreak,
  };

  await base44.auth.updateMe(updates);
  return { ...user, ...updates };
}

export async function updatePostingStreak(base44, user) {
  if (!user) return user;

  const today = getTodayString();
  if (user.last_post_date === today) return user;

  const nextStreak = isYesterday(user.last_post_date, today)
    ? (user.posting_streak_count || 0) + 1
    : 1;

  const updates = {
    last_post_date: today,
    posting_streak_count: nextStreak,
    longest_posting_streak: Math.max(nextStreak, user.longest_posting_streak || 0),
  };

  await base44.auth.updateMe(updates);
  return { ...user, ...updates };
}