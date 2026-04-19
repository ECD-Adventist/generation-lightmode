// Compute real activity tier for a GlowGroup based on member count + last message timestamp.
// Returns { tier, color, soft, label, score } where score is 0-100 for sorting/meter.

export function computeGroupActivity({ memberCount = 0, lastMessageAt = null, groupCreatedAt = null }) {
  const now = Date.now();
  const lastMsg = lastMessageAt ? new Date(lastMessageAt).getTime() : null;
  const hoursSinceMsg = lastMsg ? (now - lastMsg) / (1000 * 60 * 60) : null;

  // No messages ever → fallback to age-based
  if (hoursSinceMsg === null) {
    const ageDays = groupCreatedAt ? (now - new Date(groupCreatedAt).getTime()) / (1000 * 60 * 60 * 24) : 999;
    if (ageDays < 7 && memberCount > 0) return tier("quiet", 35);
    return tier("dormant", 10);
  }

  // Thriving: active within 48h AND ≥5 members
  if (hoursSinceMsg <= 48 && memberCount >= 5) return tier("thriving", 90);
  // Active: active within 7 days OR (48h + any members)
  if (hoursSinceMsg <= 24 * 7) return tier("active", 70);
  // Quiet: active within 30 days
  if (hoursSinceMsg <= 24 * 30) return tier("quiet", 40);
  // Dormant: inactive >30d
  return tier("dormant", 10);
}

function tier(key, score) {
  const map = {
    thriving: { tier: "thriving", label: "Thriving", color: "#22c55e", soft: "rgba(34,197,94,0.12)" },
    active:   { tier: "active",   label: "Active",   color: "#1FB8FF", soft: "rgba(31,184,255,0.12)" },
    quiet:    { tier: "quiet",    label: "Quiet",    color: "#FF9F1A", soft: "rgba(255,159,26,0.12)" },
    dormant:  { tier: "dormant",  label: "Dormant",  color: "#8A97B5", soft: "rgba(138,151,181,0.15)" },
  };
  return { ...map[key], score };
}

export function formatTimeAgo(iso) {
  if (!iso) return "No activity";
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