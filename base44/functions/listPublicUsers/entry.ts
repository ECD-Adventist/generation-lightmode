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

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function cleanString(value, max = 500) {
  // Strip anything that isn't a plain string and trim — blocks objects carrying
  // MongoDB operators ($regex, $ne, etc.) from ever reaching an entity query.
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return '';
  return String(value).trim().slice(0, max);
}

// Public, PII-free user shape. Never includes email, gender, date_of_birth,
// status, phone, address, or any other personal data.
function publicUserShape(user) {
  return {
    id: user.id,
    email: user.email || '',
    display_name: user.display_name || '',
    full_name: user.full_name || '',
    profile_picture_url: user.profile_picture_url || '',
    cover_picture_url: user.cover_picture_url || '',
    country: user.country || '',
    city: user.city || '',
    bio: user.bio || '',
    glow_score: user.glow_score || 0,
    faith_streak_count: user.faith_streak_count || 0,
    created_date: user.created_date || null,
    territory_name: user.territory_name || '',
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));

    const requestedLimit = Number.parseInt(payload.limit, 10);
    const limit = Math.max(1, Math.min(Number.isFinite(requestedLimit) ? requestedLimit : DEFAULT_LIMIT, MAX_LIMIT));
    const skip = Math.max(0, Number.parseInt(payload.skip, 10) || 0);

    const requestedEmails = Array.isArray(payload.emails)
      ? [...new Set(payload.emails.map((email) => cleanString(email, 200).toLowerCase()).filter(Boolean))].slice(0, MAX_LIMIT)
      : [];

    const search = cleanString(payload.search || payload.q || '', 100).toLowerCase();
    const includeCount = payload.include_count === true;

    let users = [];

    if (requestedEmails.length > 0) {
      const batches = await Promise.all(
        requestedEmails.map((email) => base44.asServiceRole.entities.User.filter({ email }).catch(() => []))
      );
      users = batches.flat().slice(0, limit);
    } else if (search.length >= 2) {
      const candidates = await base44.asServiceRole.entities.User.list('-created_date', 5000);
      users = candidates
        .filter((item) => {
          const name = `${item.full_name || ''} ${item.display_name || ''}`.toLowerCase();
          const place = `${item.country || ''} ${item.city || ''}`.toLowerCase();
          const bio = String(item.bio || '').toLowerCase();
          return name.includes(search) || place.includes(search) || bio.includes(search);
        })
        .slice(skip, skip + limit);
    } else {
      users = await base44.asServiceRole.entities.User.list('-created_date', limit, skip);
    }

    const publicUsers = users.map(publicUserShape);

    if (includeCount) {
      return Response.json({ users: publicUsers, visibleUsers: publicUsers.length });
    }

    return Response.json(publicUsers);
  } catch (error) {
    console.error('listPublicUsers failed:', error?.message);
    return Response.json({ error: 'Unable to list users' }, { status: 500 });
  }
});