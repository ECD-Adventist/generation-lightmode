import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { authorizeSchedulerOrAdmin } from '../../shared/schedulerAuth.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    if (!await authorizeSchedulerOrAdmin(base44, req)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await req.json();

    // Called by entity automations on GlowDrop create or GlowGroup create.
    // SECURITY: never trust payload data — validate the event and re-fetch
    // the authoritative record by id before writing any alerts.
    const { event } = body;
    const entityName = event?.entity_name;
    const entityId = event?.entity_id;

    if (!entityId || !["GlowDrop", "GlowGroup"].includes(entityName)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    if (event.type !== "create") {
      return Response.json({ skipped: true, reason: "Not a create event" });
    }

    let data = null;
    try {
      data = await base44.asServiceRole.entities[entityName].get(entityId);
    } catch { data = null; }
    if (!data) {
      return Response.json({ error: "Record not found" }, { status: 404 });
    }

    // Replay protection: only alert once per entity.
    const existingAlerts = await base44.asServiceRole.entities.TerritoryAlert.filter({ entity_id: entityId });
    if (existingAlerts.length > 0) {
      return Response.json({ skipped: true, reason: "Alerts already created for this entity" });
    }

    // Determine alert type and country
    let alertType, country, summary, actorEmail;

    if (entityName === "GlowDrop") {
      alertType = "new_drop";
      actorEmail = data.user_email;
      // Need to look up the user's country
      const users = await base44.asServiceRole.entities.User.list();
      const dropUser = users.find(u => u.email === data.user_email);
      country = dropUser?.country;
      summary = `New drop by ${dropUser?.full_name || data.user_email?.split("@")[0]}: "${(data.verse || "").substring(0, 60)}"`;
    } else if (entityName === "GlowGroup") {
      alertType = "new_group";
      country = data.country;
      actorEmail = data.leader_email;
      summary = `New group "${data.name}" created in ${data.country || "unknown location"}`;
    } else {
      return Response.json({ skipped: true, reason: "Unsupported entity" });
    }

    if (!country) {
      return Response.json({ skipped: true, reason: "No country found" });
    }

    // Find all regional admins whose territory includes this country
    const allUsers = await base44.asServiceRole.entities.User.list();
    const REGIONAL_ROLES = ["church_admin", "conference_field_admin", "union_admin", "country_admin", "ecd_admin"];
    
    const regionalAdmins = allUsers.filter(u => {
      if (!REGIONAL_ROLES.includes(u.role)) return false;
      const countries = (u.territory_countries || "").split(",").map(c => c.trim()).filter(Boolean);
      return countries.includes(country);
    });

    if (regionalAdmins.length === 0) {
      return Response.json({ skipped: true, reason: "No regional admins for this country" });
    }

    // Create alerts for each regional admin
    const alerts = regionalAdmins.map(admin => ({
      admin_email: admin.email,
      alert_type: alertType,
      entity_id: event.entity_id,
      country,
      summary,
      actor_email: actorEmail,
      read: false,
      flagged: false,
      action_taken: "none",
    }));

    await base44.asServiceRole.entities.TerritoryAlert.bulkCreate(alerts);

    return Response.json({ success: true, alerts_created: alerts.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});