import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ADMIN_ROLES = [
  'admin', 'super_admin', 'ecd_admin', 'country_admin',
  'union_admin', 'conference_field_admin', 'church_admin', 'moderator'
];

const safeDisplayName = (user) => {
  const display = (user.display_name || '').trim();
  if (display) return display;
  const name = (user.full_name || '').trim();
  if (!name) return 'LightMode User';
  return name.split(/\s+/).slice(0, 2).join(' ');
};

const publicUser = (user) => ({
  id: user.id,
  display_name: safeDisplayName(user),
  profile_picture_url: user.profile_picture_url,
  country: user.country,
  city: user.city,
  bio: user.bio,
  glow_score: user.glow_score || 0,
  faith_streak_count: user.faith_streak_count || 0,
  created_date: user.created_date
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const includeCount = payload.include_count === true;
    const requestedLimit = Number(payload.limit) || 20;
    const limit = Math.min(Math.max(requestedLimit, 1), 50);
    const search = String(payload.search || payload.q || '').trim().toLowerCase().slice(0, 80);

    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 10000);
    const nonAdminUsers = allUsers.filter((u) => !ADMIN_ROLES.includes(u.role));

    const filteredUsers = search
      ? nonAdminUsers.filter((u) => {
          const display = safeDisplayName(u).toLowerCase();
          const country = String(u.country || '').toLowerCase();
          const city = String(u.city || '').toLowerCase();
          return display.includes(search) || country.includes(search) || city.includes(search);
        })
      : nonAdminUsers;

    const users = filteredUsers.slice(0, limit).map(publicUser);

    if (includeCount) {
      return Response.json({
        users,
        totalUsers: nonAdminUsers.length,
        visibleUsers: users.length,
        hiddenUsers: allUsers.length - nonAdminUsers.length
      });
    }

    return Response.json(users);
  } catch (error) {
    console.error('Error listing public users:', error.message);
    return Response.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
});