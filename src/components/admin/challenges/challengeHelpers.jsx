// Pure utilities for challenges admin. No UI imports.

export function getChallengeStatus(c) {
  const now = new Date();
  const start = c.start_date ? new Date(c.start_date) : null;
  const end = c.end_date ? new Date(c.end_date) : null;

  if (c.active === false) return "draft";
  if (start && start > now) return "upcoming";
  if (end && end < now) return "ended";
  if (c.active === true) return "active";
  return "draft";
}

export function statusTheme(status) {
  switch (status) {
    case "active":   return { label: "Active",   color: "#22c55e", bg: "rgba(34,197,94,0.15)"  };
    case "upcoming": return { label: "Upcoming", color: "#FFD000", bg: "rgba(255,208,0,0.15)"  };
    case "ended":    return { label: "Ended",    color: "#94a3b8", bg: "rgba(148,163,184,0.15)" };
    case "draft":    return { label: "Draft",    color: "#8A5CFF", bg: "rgba(138,92,255,0.15)"  };
    default:         return { label: status,     color: "#94a3b8", bg: "rgba(148,163,184,0.15)" };
  }
}

export function timeUntil(dateStr) {
  if (!dateStr) return "";
  const diff = new Date(dateStr).getTime() - Date.now();
  const abs = Math.abs(diff);
  const days = Math.floor(abs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((abs / (1000 * 60 * 60)) % 24);

  const prefix = diff < 0 ? "" : "in ";
  const suffix = diff < 0 ? " ago" : "";
  if (days > 0) return `${prefix}${days}d ${hours}h${suffix}`;
  if (hours > 0) return `${prefix}${hours}h${suffix}`;
  return diff < 0 ? "just ended" : "now";
}

export function computeChallengeStats(challenges, submissions) {
  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  let active = 0, upcoming = 0;
  const uniqueSubmitters = new Set();
  let submissionsThisWeek = 0;

  challenges.forEach(c => {
    const s = getChallengeStatus(c);
    if (s === "active") active++;
    if (s === "upcoming") upcoming++;
  });

  submissions.forEach(s => {
    if (s.user_email) uniqueSubmitters.add(s.user_email);
    if (s.created_date && new Date(s.created_date) >= weekAgo) submissionsThisWeek++;
  });

  return {
    total: challenges.length,
    active,
    upcoming,
    participants: uniqueSubmitters.size,
    submissionsThisWeek,
  };
}

export function countParticipants(challengeId, submissions) {
  const set = new Set();
  submissions.forEach(s => {
    if (s.challenge_id === challengeId && s.user_email) set.add(s.user_email);
  });
  return set.size;
}

export function countSubmissions(challengeId, submissions) {
  return submissions.filter(s => s.challenge_id === challengeId).length;
}