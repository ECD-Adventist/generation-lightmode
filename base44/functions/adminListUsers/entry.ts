import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Admin-only endpoint that returns the full user list including real roles.
// Used by the Admin Center → Users tab where admins need to see/manage everyone.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();

    if (!caller) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ADMIN_ROLES = [
      'admin', 'super_admin', 'ecd_admin', 'country_admin',
      'union_admin', 'conference_field_admin', 'church_admin', 'moderator'
    ];
    if (!ADMIN_ROLES.includes(caller.role)) {
      return Response.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list('-created_date');

    // Return everything admin panels typically need (id + real role included)
    const adminUsers = allUsers.map(u => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      role: u.role || 'user',
      profile_picture_url: u.profile_picture_url,
      country: u.country,
      city: u.city,
      gender: u.gender,
      date_of_birth: u.date_of_birth,
      bio: u.bio,
      glow_score: u.glow_score || 0,
      faith_streak_count: u.faith_streak_count || 0,
      pledge_signed: u.pledge_signed,
      pledge_signed_at: u.pledge_signed_at,
      created_date: u.created_date,
      territory_name: u.territory_name,
      territory_countries: u.territory_countries,
      territory_status: u.territory_status,
      territory_level: u.territory_level,
    }));

    return Response.json(adminUsers);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});