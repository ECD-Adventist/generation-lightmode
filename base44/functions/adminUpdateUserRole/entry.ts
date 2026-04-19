import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Role hierarchy — higher index = more privileged
const ROLE_HIERARCHY = [
  "user", "missionary", "GlowGroup Leader", "moderator",
  "church_admin", "conference_field_admin", "union_admin",
  "country_admin", "ecd_admin", "admin", "super_admin"
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();

    if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const ADMIN_ROLES = ["admin", "super_admin"];
    if (!ADMIN_ROLES.includes(caller.role)) {
      return Response.json({ error: "Forbidden: admin access required" }, { status: 403 });
    }

    const { targetUserId, newRole } = await req.json();

    if (!targetUserId || !newRole) {
      return Response.json({ error: "targetUserId and newRole are required" }, { status: 400 });
    }

    // Prevent self-modification
    if (targetUserId === caller.id) {
      return Response.json({ error: "Cannot change your own role" }, { status: 403 });
    }

    // Only super_admin can grant super_admin or admin roles
    const callerIdx = ROLE_HIERARCHY.indexOf(caller.role);
    const newRoleIdx = ROLE_HIERARCHY.indexOf(newRole);

    if (newRoleIdx === -1) {
      return Response.json({ error: "Invalid role" }, { status: 400 });
    }

    if (newRoleIdx >= callerIdx && caller.role !== "super_admin") {
      return Response.json({ error: "Cannot grant a role equal to or higher than your own" }, { status: 403 });
    }

    const target = await base44.asServiceRole.entities.User.get(targetUserId).catch(() => null);
    if (!target) return Response.json({ error: "User not found" }, { status: 404 });

    const oldRole = target.role || "user";

    await base44.asServiceRole.entities.User.update(targetUserId, { role: newRole });

    // Audit log
    await base44.asServiceRole.entities.AdminLog.create({
      admin_email: caller.email,
      admin_name: caller.full_name || caller.email,
      action: "role_changed",
      target: target.email,
      details: `Changed role of ${target.full_name || target.email} from "${oldRole}" to "${newRole}"`,
      category: "users",
    }).catch(e => console.error("Audit log failed:", e.message));

    return Response.json({ success: true, targetUserId, newRole });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});