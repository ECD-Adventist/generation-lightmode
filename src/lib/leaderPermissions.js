export function isEcdOfficerLeader(account) {
  if (!account) return false;
  const text = [account.leader_title, account.leader_name, account.notes]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /\becd\b/.test(text);
}

export function canManageEcdOfficer(account, user) {
  if (!account || !user?.email) return false;
  const managers = Array.isArray(account.manager_emails) ? account.manager_emails : [];
  return isEcdOfficerLeader(account) && managers.includes(user.email);
}

export function canPinEcdOfficerPost(account, user) {
  if (!account || !user?.email) return false;
  return isEcdOfficerLeader(account) && (user.role === "super_admin" || canManageEcdOfficer(account, user));
}

export function isPinnedEcdOfficerDrop(drop, leaderAccounts = []) {
  if (!drop?.pinned) return false;
  const leader = leaderAccounts.find(account => account.leader_email === drop.user_email);
  return isEcdOfficerLeader(leader);
}