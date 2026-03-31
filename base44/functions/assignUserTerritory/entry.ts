import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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