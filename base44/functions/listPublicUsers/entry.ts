import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ADMIN_ROLES = new Set([
  'admin',
  'super_admin',
  'ecd_admin',
  'country_admin',
  'union_admin',
  'conference_field_admin',
  'church_admin',
  'moderator',
]);

const PUBLIC_MAX = 1000;
const SEARCH_MAX = 100;
const ADMIN_MAX = 2000;

function cleanString(value, max = 500) {
  // Strip anything that isn't a plain string and trim — blocks objects carrying
  // MongoDB operators ($regex, $ne, etc.) from ever reaching an entity query.
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return '';
  return String(value).trim().slice(0, max);
}

function publicUserShape(user, { includeEmail = false, isAdmin = false } = {}) {
  const data = {
    id: user.id,
    full_name: user.full_name || '',
    display_name: user.display_name || '',
    profile_picture_url: user.profile_picture_url || '',
    cover_picture_url: user.cover_picture_url || '',
    website_url: user.website_url || '',
    country: user.country || '',
    city: user.city || '',
    bio: user.bio || '',
    glow_score: user.glow_score || 0,
    faith_streak_count: user.faith_streak_count || 0,
    created_date: user.created_date || null,
    role: ADMIN_ROLES.has(user.role) ? undefined : (user.role || 'user'),
  };

  if (includeEmail || isAdmin) data.email = user.email;

  if (isAdmin) {
    data.status = user.status || 'active';
    data.role = user.role || 'user';
    data.territory_name = user.territory_name || '';
    data.territory_countries = user.territory_countries || '';
    data.territory_status = user.territory_status || '';
  }

  return data;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const isAdmin = ADMIN_ROLES.has(user.role);

    const requestedEmails = Array.isArray(payload.emails)
      ? [...new Set(payload.emails.map((email) => cleanString(email, 200).toLowerCase()).filter(Boolean))].slice(0, isAdmin ? ADMIN_MAX : PUBLIC_MAX)
      : [];

    const search = cleanString(payload.search || payload.q || '', 100).toLowerCase();
    const includeCount = payload.include_count === true;
    const requestedLimit = Number.parseInt(payload.limit, 10);
    const maxLimit = isAdmin ? ADMIN_MAX : (search ? SEARCH_MAX : PUBLIC_MAX);
    const limit = Math.max(1, Math.min(Number.isFinite(requestedLimit) ? requestedLimit : maxLimit, maxLimit));

    let users = [];

    if (requestedEmails.length > 0) {
      const batches = await Promise.all(
        requestedEmails.map((email) => base44.asServiceRole.entities.User.filter({ email }).catch(() => []))
      );
      users = batches.flat().slice(0, limit);
    } else if (search.length >= 2) {
      const candidates = await base44.asServiceRole.entities.User.list('-created_date', isAdmin ? ADMIN_MAX : 5000);
      users = candidates
        .filter((item) => {
          const name = `${item.full_name || ''} ${item.display_name || ''}`.toLowerCase();
          const place = `${item.country || ''} ${item.city || ''}`.toLowerCase();
          const email = String(item.email || '').toLowerCase();
          const bio = String(item.bio || '').toLowerCase();
          return name.includes(search) || place.includes(search) || email.includes(search) || bio.includes(search);
        })
        .slice(0, limit);
    } else if (isAdmin) {
      users = await base44.asServiceRole.entities.User.list('-created_date', limit);
    } else {
      users = await base44.asServiceRole.entities.User.list('-created_date', limit);
    }

    // Explore/profile links and follow actions use email as the public profile key.
    const includeEmail = true;
    const publicUsers = users.map((item) => publicUserShape(item, { includeEmail, isAdmin }));

    if (includeCount) {
      return Response.json({ users: publicUsers, visibleUsers: publicUsers.length });
    }

    return Response.json(publicUsers);
  } catch (error) {
    console.error('listPublicUsers failed:', error?.message);
    return Response.json({ error: 'Unable to list users' }, { status: 500 });
  }
});