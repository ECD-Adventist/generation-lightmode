import { base44 } from "@/api/base44Client";

// All XP is awarded server-side after the backend verifies the underlying activity.
// Returns { awarded, total } — `awarded` is 0 when the action was already credited.
export async function awardXp(action, details = {}) {
  const res = await base44.functions.invoke("awardXp", { action, ...details });
  return res.data || { awarded: 0, total: null };
}