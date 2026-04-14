import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Authenticate caller
    const caller = await base44.auth.me();
    if (!caller) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body = {};
    try { body = await req.json(); } catch { /* empty */ }

    const { event_type, user_country, user_city, user_territory_name } = body;

    // Only allow notifying about the caller's own profile changes — prevent impersonation
    const user_email = caller.email;

    if (!event_type) {
      return Response.json({ error: "Missing required field: event_type" }, { status: 400 });
    }

    // Sanitize event_type to a known set — prevent injection into notification messages
    const ALLOWED_EVENT_TYPES = ["new_user", "location_updated"];
    if (!ALLOWED_EVENT_TYPES.includes(event_type)) {
      return Response.json({ error: "Invalid event_type" }, { status: 400 });
    }

    // Sanitize text inputs — strip to plain strings with length limit
    const safeCity = (user_city || "").replace(/[^\w\s,.-]/g, "").slice(0, 80);
    const safeCountry = (user_country || "").replace(/[^\w\s,.-]/g, "").slice(0, 80);
    const safeTerritory = (user_territory_name || "").replace(/[^\w\s,.-]/g, "").slice(0, 100);

    // Fetch all regional admin users
    const allUsers = await base44.asServiceRole.entities.User.list();
    const REGIONAL_ROLES = ["church_admin", "conference_field_admin", "union_admin", "country_admin", "ecd_admin", "admin", "super_admin"];
    const admins = allUsers.filter(u => REGIONAL_ROLES.includes(u.role));

    const newUser = allUsers.find(u => u.email === user_email);
    const displayName = newUser?.full_name || user_email.split("@")[0];

    let notified = 0;
    const notifications = [];

    for (const admin of admins) {
      let shouldNotify = false;

      if (admin.role === "super_admin" || admin.role === "admin") {
        shouldNotify = true;
      } else {
        const adminCountries = (admin.territory_countries || "").split(",").map(s => s.trim()).filter(Boolean);
        const adminApproved = admin.territory_status === "approved";

        if (adminApproved && adminCountries.length > 0) {
          const matchCountry = safeCountry && adminCountries.includes(safeCountry);
          const matchTerritory = safeTerritory && admin.territory_name === safeTerritory;
          shouldNotify = matchCountry || matchTerritory;
        }
      }

      if (!shouldNotify) continue;

      let message = "";
      if (event_type === "new_user") {
        message = `New member "${displayName}" joined your territory${safeCity ? ` (${safeCity})` : ""}${safeCountry ? `, ${safeCountry}` : ""}.`;
      } else if (event_type === "location_updated") {
        message = `Member "${displayName}" updated their location to ${[safeCity, safeCountry].filter(Boolean).join(", ")}.`;
      }

      notifications.push({
        user_email: admin.email,
        type: "system",
        message,
        read: false,
        link: `/AdminCenter?tab=users`,
      });
      notified++;
    }

    if (notifications.length > 0) {
      await Promise.all(notifications.map(n => base44.asServiceRole.entities.Notification.create(n)));
    }

    return Response.json({ success: true, notified });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});