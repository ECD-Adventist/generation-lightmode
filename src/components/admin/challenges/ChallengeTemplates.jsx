// Preset challenge templates for the empty state / quick-start
export const CHALLENGE_TEMPLATES = [
  {
    id: "scripture-streak",
    icon: "📖",
    title: "7-Day Scripture Streak",
    description: "Read and reflect on a Bible passage every day for 7 days. Share your reflection as a Glow Drop each day.",
    points_reward: 700,
    duration_days: 7,
    territory_metric: "drops",
    color: "#FFD000",
  },
  {
    id: "invite-friends",
    icon: "🫂",
    title: "Invite 5 Friends",
    description: "Grow the movement! Invite 5 friends to join Generation LightMode and help them sign the pledge.",
    points_reward: 500,
    duration_days: 14,
    territory_metric: "followers",
    color: "#8A5CFF",
  },
  {
    id: "share-testimony",
    icon: "✨",
    title: "Share Your Testimony",
    description: "Share your story of faith — a moment God showed up for you. Post as a Glow Drop with a photo or video.",
    points_reward: 300,
    duration_days: 30,
    territory_metric: "glow_score",
    color: "#1FB8FF",
  },
];

export function templateToChallenge(template) {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + template.duration_days);
  return {
    title: template.title,
    description: template.description,
    start_date: now.toISOString().slice(0, 10),
    end_date: end.toISOString().slice(0, 10),
    points_reward: template.points_reward,
    active: true,
    territory_scope: "",
    territory_metric: template.territory_metric,
  };
}