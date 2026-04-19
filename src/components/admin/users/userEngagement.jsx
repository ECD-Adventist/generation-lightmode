// Compute engagement score + verification badges from a user record.
// Score is 0–100, composite of: glow_score, faith_streak, pledge, profile completeness.

export function computeEngagementScore(u) {
  if (!u) return 0;
  const glow = Math.min(60, (u.glow_score || 0) / 20);           // up to 60 pts (1200 glow = max)
  const streak = Math.min(20, (u.faith_streak_count || 0) * 2);  // up to 20 pts (10-day streak = max)
  const pledge = u.pledge_signed ? 10 : 0;                        // 10 pts
  const profile =
    (u.country ? 3 : 0) +
    (u.bio ? 3 : 0) +
    (u.profile_picture_url ? 4 : 0);                              // up to 10 pts
  return Math.round(glow + streak + pledge + profile);
}

export function engagementTier(score) {
  if (score >= 75) return { label: "Champion",   color: "#16a34a", soft: "rgba(34,197,94,0.15)" };
  if (score >= 50) return { label: "Engaged",    color: "#0B3FD9", soft: "rgba(11,63,217,0.12)" };
  if (score >= 25) return { label: "Active",     color: "#1FB8FF", soft: "rgba(31,184,255,0.15)" };
  if (score >= 10) return { label: "New",        color: "#FF9F1A", soft: "rgba(255,159,26,0.15)" };
  return             { label: "Dormant",    color: "#8A97B5", soft: "rgba(138,151,181,0.15)" };
}

// Activity status based on updated_date (Option A: proxy for "last active")
export function computeActivityStatus(u) {
  if (!u?.updated_date) return { status: "unknown", color: "#8A97B5", label: "No activity" };
  const hoursAgo = (Date.now() - new Date(u.updated_date).getTime()) / (1000 * 60 * 60);
  if (hoursAgo <= 24)    return { status: "online",   color: "#22c55e", label: "Active today" };
  if (hoursAgo <= 24 * 7)  return { status: "recent",   color: "#1FB8FF", label: "Active this week" };
  if (hoursAgo <= 24 * 30) return { status: "monthly",  color: "#FF9F1A", label: "Active this month" };
  return                       { status: "dormant",  color: "#8A97B5", label: "Dormant" };
}

// Verification badges — derived strictly from existing user fields.
export function computeVerificationBadges(u) {
  if (!u) return [];
  const badges = [];
  if (u.email) badges.push({ key: "email", label: "Email verified", icon: "✉️", color: "#22c55e" });
  if (u.pledge_signed) badges.push({ key: "pledge", label: "Pledge signed", icon: "🤝", color: "#FFD60A" });
  if (u.territory_status === "approved") badges.push({ key: "territory", label: "Territory approved", icon: "🗺️", color: "#1FB8FF" });
  if (u.profile_picture_url && u.bio && u.country) badges.push({ key: "complete", label: "Complete profile", icon: "⭐", color: "#0B3FD9" });
  if (u.glow_score >= 500) badges.push({ key: "leader", label: "High glow score", icon: "🏆", color: "#FF9F1A" });
  return badges;
}

// Format "time ago" for activity display
export function formatTimeAgo(iso) {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}