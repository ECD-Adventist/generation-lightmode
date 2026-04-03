import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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

    const { event_type, user_email, user_country, user_city, user_territory_name } = body;

    if (!user_email || !event_type) {
      return Response.json({ error: "Missing required fields: user_email, event_type" }, { status: 400 });
    }

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
      let message = "";

      // Super admins always get notified
      if (admin.role === "super_admin" || admin.role === "admin") {
        shouldNotify = true;
      } else {
        // Regional admins: notify if new user is in their territory
        const adminCountries = (admin.territory_countries || "").split(",").map(s => s.trim()).filter(Boolean);
        const adminApproved = admin.territory_status === "approved";

        if (adminApproved && adminCountries.length > 0) {
          // Match by country, city, or territory name
          const matchCountry = user_country && adminCountries.includes(user_country);
          const matchTerritory = user_territory_name && admin.territory_name === user_territory_name;
          shouldNotify = matchCountry || matchTerritory;
        }
      }

      if (!shouldNotify) continue;

      if (event_type === "new_user") {
        message = `🆕 New member "${displayName}" joined your territory${user_city ? ` (${user_city})` : ""}${user_country ? `, ${user_country}` : ""}.`;
      } else if (event_type === "location_updated") {
        message = `📍 Member "${displayName}" updated their location to ${[user_city, user_country].filter(Boolean).join(", ")}.`;
      } else {
        message = `ℹ️ Territory update: "${displayName}" (${event_type}).`;
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