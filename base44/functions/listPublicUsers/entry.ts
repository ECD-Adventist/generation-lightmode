import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const requestedEmails = Array.isArray(payload.emails) ? new Set(payload.emails.filter(Boolean)) : null;
    const limit = Math.min(Number(payload.limit) || 10000, 10000);
    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 10000);
    const HIDDEN_EMAILS = (Deno.env.get('PUBLIC_USER_HIDDEN_EMAILS') || '')
      .split(',')
      .map(email => email.trim())
      .filter(Boolean);

    // Only expose safe public fields — NO PII (no address, phone, DOB, gender, postal_code)
    // Admin roles are hidden from public — only non-privileged roles are exposed
    const ADMIN_ROLES = ['admin', 'super_admin', 'ecd_admin', 'country_admin', 'union_admin', 'conference_field_admin', 'church_admin', 'moderator'];
    const publicUsers = allUsers
      .filter(u => !HIDDEN_EMAILS.includes(u.email))
      .filter(u => !requestedEmails || requestedEmails.has(u.email))
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