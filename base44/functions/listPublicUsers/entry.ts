import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';

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

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 2000;

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
  const profilePicture = user.profile_picture || user.profile_picture_url || '';
  const coverImage = user.cover_image || user.cover_picture_url || '';
  const xpPoints = user.xp_points ?? user.glow_score ?? 0;
  return {
    id: user.id,
    email: user.email || '',
    username: user.username || '',
    display_name: user.display_name || '',
    full_name: user.full_name || '',
    profile_picture: profilePicture,
    profile_picture_url: profilePicture,
    cover_image: coverImage,
    cover_picture_url: coverImage,
    location: user.location || user.city || user.country || '',
    country: user.country || '',
    city: user.city || '',
    bio: user.bio || '',
    xp_points: xpPoints,
    glow_score: xpPoints,
    badge: user.badge || '',
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
    const rateLimited = await enforceApiRateLimit(base44, req, user);
    if (rateLimited) return rateLimited;

    const validated = await readValidatedJson(req, {
      limit: { type: 'number', integer: true, min: 1, max: MAX_LIMIT },
      skip: { type: 'number', integer: true, min: 0, max: 100000 },
      emails: { type: 'array', maxItems: MAX_LIMIT, items: { type: 'string', maxLength: 254 } },
      search: { type: 'string', maxLength: 100 },
      q: { type: 'string', maxLength: 100 },
      include_count: { type: 'boolean' },
    });
    if (validated.response) return validated.response;
    const payload = validated.data;

    const requestedLimit = Number.parseInt(payload.limit, 10);
    const limit = Math.max(1, Math.min(Number.isFinite(requestedLimit) ? requestedLimit : DEFAULT_LIMIT, MAX_LIMIT));
    const skip = Math.max(0, Number.parseInt(payload.skip, 10) || 0);

    const requestedEmails = Array.isArray(payload.emails)
      ? [...new Set(payload.emails.map((email) => cleanString(email, 200).toLowerCase()).filter(Boolean))].slice(0, MAX_LIMIT)
      : [];

    const search = cleanString(payload.search || payload.q || '', 100).toLowerCase();
    const includeCount = payload.include_count === true;

    let users = [];
    let totalUsers = null;

    if (requestedEmails.length > 0) {
      const batches = await Promise.all(
        requestedEmails.map((email) => base44.asServiceRole.entities.User.filter({ email }).catch(() => []))
      );
      users = batches.flat();

      // Managed leader accounts have no User record — resolve any still-missing
      // emails from ManagedLeaderAccount so their names and photos display.
      const foundEmails = new Set(users.map((u) => String(u.email || '').toLowerCase()));
      const missing = requestedEmails.filter((email) => !foundEmails.has(email));
      if (missing.length > 0) {
        const leaderAccounts = await base44.asServiceRole.entities.ManagedLeaderAccount.filter({ active: true }).catch(() => []);
        const missingSet = new Set(missing);
        leaderAccounts
          .filter((a) => missingSet.has(String(a.leader_email || '').toLowerCase()))
          .forEach((a) => {
            users.push({
              id: a.id,
              email: String(a.leader_email || '').toLowerCase(),
              full_name: a.leader_name || '',
              display_name: a.leader_name || '',
              profile_picture: a.leader_profile_picture_url || '',
              profile_picture_url: a.leader_profile_picture_url || '',
              cover_image: a.leader_cover_picture_url || '',
              country: a.leader_country || '',
              bio: a.leader_bio || '',
              badge: a.leader_title || '',
            });
          });
      }

      users = users.slice(0, limit);
      totalUsers = users.length;
    } else if (search.length >= 2) {
      const candidates = await base44.asServiceRole.entities.User.list('-created_date', 5000);
      const filtered = candidates.filter((item) => {
        const name = `${item.full_name || ''} ${item.display_name || ''}`.toLowerCase();
        const place = `${item.country || ''} ${item.city || ''}`.toLowerCase();
        const bio = String(item.bio || '').toLowerCase();
        return name.includes(search) || place.includes(search) || bio.includes(search);
      });
      totalUsers = filtered.length;
      users = filtered.slice(skip, skip + limit);
    } else if (includeCount) {
      const candidates = await base44.asServiceRole.entities.User.list('-created_date', 5000);
      totalUsers = candidates.length;
      users = candidates.slice(skip, skip + limit);
    } else {
      users = await base44.asServiceRole.entities.User.list('-created_date', limit, skip);
    }

    const publicUsers = users.map(publicUserShape);

    if (includeCount) {
      return Response.json({ users: publicUsers, totalUsers: totalUsers ?? publicUsers.length, visibleUsers: publicUsers.length });
    }

    return Response.json(publicUsers);
  } catch (error) {
    console.error('listPublicUsers failed:', error?.message);
    return Response.json({ error: 'Unable to list users' }, { status: 500 });
  }
});