export async function authorizeSchedulerOrAdmin(base44, req) {
  const authorization = req.headers.get("Authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  const schedulerToken = Deno.env.get("SCHEDULER_TOKEN") || "";

  if (schedulerToken && token === schedulerToken) return true;

  try {
    const user = await base44.auth.me();
    return ["admin", "super_admin"].includes(user?.role);
  } catch {
    return false;
  }
}