import fs from "node:fs";
import { getDisplayName, updateCachedUserIdentity } from "../src/lib/displayName.js";

const read = path => fs.readFileSync(path, "utf8");
const checks = [
  ["profile save synchronizes full_name", read("base44/functions/updateProfile/entry.ts").includes("customUpdate.full_name = canonicalName")],
  ["public users project canonical name", read("base44/functions/listPublicUsers/entry.ts").includes("full_name: canonicalName")],
  ["admin users project canonical name", read("base44/functions/adminListUsers/entry.ts").includes("full_name: canonicalName")],
  ["profile save patches identity caches", read("src/components/profile/EditProfileModal.jsx").includes("updateCachedUserIdentity(queryClient, updated)")],
  ["Explore guards initial empty state", read("src/pages/GlowGroups.jsx").includes("!usersInitialLoading && !usersError && filteredUsers.length === 0")],
  ["mobile Explore guards initial empty state", read("src/components/groups/MobileGlowGroups.jsx").includes("usersInitialLoading ?")],
  ["Post uses exact get", read("src/pages/Post.jsx").includes("GlowDrop.get(dropId)")],
  ["Post rejects stale Feed placeholders", !read("src/pages/Post.jsx").includes('getQueryData(["allGlowDrops"])') && read("src/pages/Post.jsx").includes('refetchOnMount: "always"')],
  ["Post fetches exact public author", read("src/pages/Post.jsx").includes("emails: [authorEmail]")],
  ["Post fetches exact leader in parallel", read("src/pages/Post.jsx").includes('["postLeaderAccount", authorEmail]') && read("src/pages/Post.jsx").includes("emails: [authorEmail]")],
  ["Post blocks stale generic render", read("src/pages/Post.jsx").includes("postFetching || identityResolving")],
  ["Post uses shared AuthContext", read("src/pages/Post.jsx").includes("const { user: currentUser } = useAuth()") && !read("src/pages/Post.jsx").includes("auth.isAuthenticated().then" )],
  ["profile save refreshes AuthContext", read("src/components/profile/EditProfileModal.jsx").includes("await refreshUser()")],
  ["modal identities are email-scoped", read("src/components/feed/DropViewerModal.jsx").includes("emails: visibleIdentityEmails")],
  ["online Feed does not force stale cached posts", read("src/hooks/useOfflineSync.js").includes("isOnline ? (liveDrops || cachedDrops) : cachedDrops")],
  ["leader identity query follows paginated authors", read("src/pages/Feed.jsx").includes('queryKey: ["allLeaderAccounts", authorEmails.slice(0, 100).join("|")]')],
  ["avatar initials use canonical resolver", read("src/components/common/UserAvatar.jsx").includes("const source = getDisplayName(user)")],
];
for (const path of ["src/components/feed/DropCard.jsx", "src/components/feed/MobileDropCard.jsx", "src/components/feed/GlowFeedCard.jsx"]) {
  const source = read(path);
  checks.push([`${path} prefers live profile name`, source.indexOf("dropUser?.display_name") !== -1 && source.indexOf("dropUser?.display_name") < source.indexOf("drop.author_name")]);
}
const failed = checks.filter(([, passed]) => !passed);
console.table(checks.map(([name, passed]) => ({ check: name, result: passed ? "PASS" : "FAIL" })));
if (failed.length) process.exit(1);


const resolverCases = [
  [{ display_name: "Chosen Name", username: "handle", full_name: "Signup Name" }, "Chosen Name"],
  [{ username: "handle", full_name: "Signup Name" }, "handle"],
  [{ full_name: "Signup Name" }, "Signup Name"],
  [{ email: "member@example.org" }, "member"],
];
for (const [user, expected] of resolverCases) {
  if (getDisplayName(user) !== expected) throw new Error(`resolver returned ${getDisplayName(user)} instead of ${expected}`);
}
let cached = [{ id: "u1", email: "member@example.org", display_name: "Old Name", untouched: true }];
const fakeQueryClient = {
  setQueriesData: ({ predicate }, updater) => {
    if (predicate({ queryKey: ["feedVisibleUsers", "member@example.org"] })) cached = updater(cached);
  },
};
updateCachedUserIdentity(fakeQueryClient, { id: "u1", email: "member@example.org", display_name: "New Name", full_name: "New Name" });
if (cached[0].display_name !== "New Name" || cached[0].full_name !== "New Name" || cached[0].untouched !== true) {
  throw new Error("identity cache patch failed");
}
console.log("runtime resolver/cache tests: PASS");
