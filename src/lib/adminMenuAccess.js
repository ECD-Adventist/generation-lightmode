// Panels hidden from read-only officer accounts. These are technical/system-level
// tools where a mistaken change would be costly, so officers don't see them at all.
export const OFFICER_HIDDEN_TABS = [
  "assistant-training",
  "settings",
  "custom-posts",
  "permissions",
  "audit-logs",
  "supabase-export",
  "storage-dashboard",
];