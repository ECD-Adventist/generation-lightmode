export async function authorizeSchedulerOrAdmin(base44, req) {
  const schedulerToken = Deno.env.get("SCHEDULER_TOKEN") || "";

  const authorization = req.headers.get("Authorization") || "";
  const headerToken = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (schedulerToken && headerToken === schedulerToken) return true;

  // Scheduled workflows can't set headers — they pass the token in the request body.
  if (schedulerToken) {
    try {
      const body = await req.clone().json();
      if (body?.scheduler_token === schedulerToken) return true;
    } catch {
      // no/invalid JSON body
    }
  }

  try {
    const user = await base44.auth.me();
    if (!user) return false;
    return ["admin", "super_admin"].includes(user.role);
  } catch {
    return false;
  }
}