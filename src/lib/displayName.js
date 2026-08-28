// Centralized helper so the whole app shows a user's changeable display name,
// falling back to the immutable built-in full_name, then to the email prefix.
export function getDisplayName(user) {
  if (!user) return "Glow Believer";
  const dn = (user.display_name || "").trim();
  if (dn) return dn;
  const username = (user.username || user.author_username || "").trim();
  if (username) return username;
  const fn = (user.full_name || user.author_name || "").trim();
  if (fn) return fn;
  return user.email?.split("@")[0] || "Glow Believer";
}

export function getPublicHandle(user) {
  return getDisplayName(user);
}

const IDENTITY_FIELDS = [
  "display_name", "full_name", "username", "profile_picture", "profile_picture_url",
  "cover_image", "cover_picture_url", "country", "city", "location", "bio",
];

// Make a saved profile identity visible in existing directory/feed/profile caches in
// the same frame; network invalidation can then revalidate without a stale-name flash.
export function updateCachedUserIdentity(queryClient, updatedUser) {
  if (!queryClient || !updatedUser) return;
  const identity = Object.fromEntries(
    IDENTITY_FIELDS.filter(field => updatedUser[field] !== undefined).map(field => [field, updatedUser[field]])
  );
  const sameUser = value => value && typeof value === "object" && (
    (updatedUser.id && value.id === updatedUser.id) ||
    (updatedUser.email && value.email?.toLowerCase() === updatedUser.email.toLowerCase())
  );
  const patch = value => {
    if (Array.isArray(value)) return value.map(patch);
    if (!value || typeof value !== "object") return value;
    if (sameUser(value)) return { ...value, ...identity };
    if (Array.isArray(value.pages)) return { ...value, pages: value.pages.map(patch) };
    return value;
  };
  queryClient.setQueriesData({
    predicate: query => query.queryKey.some(part => typeof part === "string" && /user|profile|author/i.test(part)),
  }, patch);
}
