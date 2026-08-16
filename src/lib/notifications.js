export function isNotificationEnabled(targetUser, preferenceType) {
  if (!targetUser) return true;
  if (preferenceType === "likes") return targetUser.notify_likes !== false;
  if (preferenceType === "follows") return targetUser.notify_follows !== false;
  if (preferenceType === "comments") return targetUser.notify_comments !== false;
  if (preferenceType === "messages") return targetUser.notify_messages !== false;
  return true;
}

export function getNotificationCategory(type) {
  if (["like", "follow", "repost"].includes(type)) return "social";
  if (["comment", "reply", "milestone", "message", "dm", "prayer"].includes(type)) return "community";
  return "system";
}

export const notificationCategoryLabels = {
  all: "All",
  social: "Social",
  community: "Community",
  system: "System",
};