import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  const ADMIN_ROLES = ["admin", "super_admin", "ecd_admin", "country_admin", "union_admin", "conference_field_admin", "church_admin"];
  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body = {};
  try { body = await req.json(); } catch { /* empty body */ }
  const { userId, status, territory_name, territory_level, territory_countries } = body;

  if (!userId) return Response.json({ error: "userId required" }, { status: 400 });

  // Prevent self-escalation
  if (userId === user.id) {
    return Response.json({ error: "Cannot modify your own territory assignment" }, { status: 403 });
  }

  // Non-super admins can only set territory_status to "approved" or "rejected" —
  // they cannot change territory_level to a level higher than their own
  const levelHierarchy = ["church", "conference_field", "union", "country", "ecd", "global"];
  const callerLevel = user.territory_level || "church";
  const callerLevelIdx = levelHierarchy.indexOf(callerLevel);

  if (territory_level) {
    const targetLevelIdx = levelHierarchy.indexOf(territory_level);
    // Only super_admin/admin can assign levels equal to or above their own
    if (!["admin", "super_admin"].includes(user.role) && targetLevelIdx >= callerLevelIdx) {
      return Response.json({ error: "Cannot assign a territory level equal to or above your own" }, { status: 403 });
    }
  }

  // Only super_admin and admin can change roles or assign high-level territories
  const updates = {};
  if (status) updates.territory_status = status;
  if (territory_name !== undefined) updates.territory_name = territory_name;
  if (territory_level !== undefined) updates.territory_level = territory_level;
  if (territory_countries !== undefined) updates.territory_countries = territory_countries;

  try {
    await base44.asServiceRole.entities.User.update(userId, updates);
  } catch (err) {
    return Response.json({ error: "User not found or update failed: " + err.message }, { status: 404 });
  }

  return Response.json({ success: true, userId, updates });
});