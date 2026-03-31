import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Simple heuristic: group users by country → assign territory_name = "country territory"
// and set territory_status = "pending" if unset, so admins can review and approve.
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  const ADMIN_ROLES = ["admin", "super_admin", "ecd_admin", "country_admin", "union_admin", "conference_field_admin", "church_admin"];
  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const allUsers = await base44.asServiceRole.entities.User.list();
  let assigned = 0;

  for (const u of allUsers) {
    // Only auto-assign users who have location data but no territory_name yet
    if (!u.territory_name && u.city && u.postal_code && u.country) {
      const territoryName = `${u.city}, ${u.country}`;
      await base44.asServiceRole.entities.User.update(u.id, {
        territory_name: territoryName,
        territory_level: "church", // default lowest level — admins can update
        territory_countries: u.country,
        territory_status: "pending",
      });
      assigned++;
    }
  }

  return Response.json({ success: true, assigned });
});