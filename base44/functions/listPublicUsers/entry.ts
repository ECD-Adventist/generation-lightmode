import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const payload = await req.json().catch(() => ({}));
    const requestedEmails = Array.isArray(payload.emails) ? payload.emails.filter(Boolean) : null;
    const limit = Math.min(Number(payload.limit) || 200, 500);

    // When specific emails are requested, fetch them individually to avoid
    // missing users that fall outside the default list limit.
    let allUsers;
    if (requestedEmails && requestedEmails.length > 0 && requestedEmails.length <= 20) {
      // Fetch each requested user by email, plus the general list for broader context
      const emailResults = await Promise.all(
        requestedEmails.map(email =>
          base44.asServiceRole.entities.User.filter({ email }).catch(() => [])
        )
      );
      const specificUsers = emailResults.flat();
      const generalUsers = await base44.asServiceRole.entities.User.list('-created_date', limit);
      // Merge: specific users first, then general, deduplicated
      const seen = new Set();
      allUsers = [];
      for (const u of [...specificUsers, ...generalUsers]) {
        if (u.email && !seen.has(u.email)) {
          seen.add(u.email);
          allUsers.push(u);
        }
      }
    } else {
      allUsers = await base44.asServiceRole.entities.User.list('-created_date', limit);
    }

    const HIDDEN_EMAILS = (Deno.env.get('PUBLIC_USER_HIDDEN_EMAILS') || '')
      .split(',')
      .map(email => email.trim())
      .filter(Boolean);

    const requestedEmailSet = requestedEmails ? new Set(requestedEmails) : null;

    // Only expose safe public fields — NO PII (no address, phone, DOB, gender, postal_code)
    // Admin roles are hidden from public — only non-privileged roles are exposed
    const ADMIN_ROLES = ['admin', 'super_admin', 'ecd_admin', 'country_admin', 'union_admin', 'conference_field_admin', 'church_admin', 'moderator'];
    const publicUsers = allUsers
      .filter(u => !HIDDEN_EMAILS.includes(u.email))
      .filter(u => !requestedEmailSet || requestedEmailSet.has(u.email))
      .slice(0, limit)
      .map(u => ({
        id: u.id,
        full_name: u.full_name,
        display_name: u.display_name,
        email: u.email,
        profile_picture_url: u.profile_picture_url,
        cover_picture_url: u.cover_picture_url,
        website_url: u.website_url,
        country: u.country,
        city: u.city,
        bio: u.bio,
        glow_score: u.glow_score || 0,
        faith_streak_count: u.faith_streak_count || 0,
        pledge_signed: u.pledge_signed,
        pledge_signed_at: u.pledge_signed_at,
        created_date: u.created_date,
        notify_likes: u.notify_likes,
        notify_follows: u.notify_follows,
        notify_comments: u.notify_comments,
        territory_name: u.territory_name,
        territory_countries: u.territory_countries,
        territory_status: u.territory_status,
        // Hide privileged roles from public — show only safe non-admin roles
        role: ADMIN_ROLES.includes(u.role) ? undefined : (u.role || 'user'),
      }));

    return Response.json(publicUsers);
  } catch (error) {
    console.error("Error listing users:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});