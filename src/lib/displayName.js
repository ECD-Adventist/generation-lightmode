// Centralized helper so the whole app shows a user's changeable display name,
// falling back to the immutable built-in full_name, then to the email prefix.
export function getDisplayName(user) {
  if (!user) return "Glow Believer";
  const username = (user.username || user.author_username || "").trim();
  if (username) return username;
  const dn = (user.display_name || "").trim();
  if (dn) return dn;
  const fn = (user.full_name || user.author_name || "").trim();
  if (fn) return fn;
  return user.email?.split("@")[0] || "Glow Believer";
}

export function getPublicHandle(user) {
  return getDisplayName(user);
}