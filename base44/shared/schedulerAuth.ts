export async function authorizeSchedulerOrAdmin(base44, req) {
  const authorization = req.headers.get("Authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  const schedulerToken = Deno.env.get("SCHEDULER_TOKEN") || "";

  if (schedulerToken && token === schedulerToken) return true;

  try {
    const user = await base44.auth.me();
    // Scheduled automations invoke functions with no user context (auth.me() returns null).
    if (!user) return true;
    return ["admin", "super_admin"].includes(user.role);
  } catch {
    // No authenticated user context — treat as a scheduler invocation.
    return true;
  }
}