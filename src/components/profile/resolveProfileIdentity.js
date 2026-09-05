const unavailable = { not_found: true, full_name: "Profile unavailable" };
export default function resolveProfileIdentity(currentUser, target, users, leaders, resolved) {
  if (!currentUser) return null;
  const { email, id, leaderId, broken } = target;
  if (broken) return unavailable;
  if (!leaderId && ((!email && !id) || email === currentUser.email || id === currentUser.id)) return currentUser;
  const person = !leaderId && users.find(user => id ? user.id === id : user.email === email);
  if (person) return person;
  const leader = leaders.find(account => leaderId ? account.id === leaderId : account.leader_email === email);
  if (leader) return {
    id: leader.id, email: leader.leader_email, full_name: leader.leader_name,
    display_name: leader.leader_name, username: leader.leader_name,
    profile_picture: leader.leader_profile_picture_url,
    profile_picture_url: leader.leader_profile_picture_url,
    cover_image: leader.leader_cover_picture_url,
    cover_picture_url: leader.leader_cover_picture_url,
    country: leader.leader_country, bio: leader.leader_bio,
    glow_score: 0, is_managed_leader: true,
  };
  return resolved ? unavailable : null;
}