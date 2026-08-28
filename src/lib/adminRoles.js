// Officer roles are observers: they see admin data for their own territory but
// must never modify it. The matching backend functions (adminUpdateUserRole,
// adminSuspendUser, adminDeleteUser) already reject these roles server-side —
// this helper keeps the UI honest so officers aren't shown controls that would fail.
export const OFFICER_ROLES = [
  "ecd_officer",
  "union_officer",
  "conference_field_officer",
  "church_officer",
];

export function isReadOnlyAdminRole(role) {
  return OFFICER_ROLES.includes(role);
}