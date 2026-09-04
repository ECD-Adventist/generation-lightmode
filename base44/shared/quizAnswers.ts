// Server-side answer key for the Faith Quiz. Mirrors src/components/faith-quiz/quizLevels.js —
// keep both in sync when questions change. XP is only ever awarded from this file.

export const QUIZ_KEY = {
  1: { xpPerQuestion: 5, passScore: 6, correct: [1, 2, 1, 2, 1, 1, 1, 2, 1, 1] },
  2: { xpPerQuestion: 8, passScore: 6, correct: [0, 1, 1, 0, 1, 0, 1, 0, 0, 1] },
  3: { xpPerQuestion: 10, passScore: 7, correct: [1, 1, 2, 1, 1, 0, 0, 1, 1, 0] },
  4: { xpPerQuestion: 13, passScore: 7, correct: [0, 1, 0, 1, 1, 0, 1, 0, 0, 0] },
  5: { xpPerQuestion: 15, passScore: 8, correct: [1, 1, 0, 1, 0, 0, 0, 0, 1, 0] },
  6: { xpPerQuestion: 20, passScore: 9, correct: [2, 0, 1, 2, 2, 1, 1, 0, 1, 2] },
};

export const TOTAL_QUIZ_LEVELS = 6;

export function scoreLevel(level, answers) {
  const key = QUIZ_KEY[level];
  if (!key) return null;
  const score = key.correct.reduce((sum, correct, index) => sum + (answers[index] === correct ? 1 : 0), 0);
  const stars = score === key.correct.length ? 3 : score >= key.passScore + 1 ? 2 : score >= key.passScore ? 1 : 0;
  return { score, stars, passed: score >= key.passScore, xp: score * key.xpPerQuestion, questionCount: key.correct.length };
}