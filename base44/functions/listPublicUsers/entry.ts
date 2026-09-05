import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';

const DEFAULT_LIMIT = 40;
const MAX_PAGE_LIMIT = 50;
const MAX_EXPLICIT_EMAILS = 200;

function cleanString(value, max = 500) {
  if (value === null || value === undefined || typeof value === 'object') return '';
  return String(value).trim().slice(0, max);
}

function publicUserShape(user, includeEmail = false) {
  const profilePicture = user.profile_picture || user.profile_picture_url || '';
  const coverImage = user.cover_image || user.cover_picture_url || '';
  const xpPoints = user.xp_points ?? user.glow_score ?? 0;
  const canonicalName = user.display_name || user.username || user.full_name || '';
  return {
    id: user.id,
    ...(includeEmail ? { email: user.email || '' } : {}),
    username: user.username || '',
    display_name: canonicalName,
    full_name: canonicalName,
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

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const actor = await base44.auth.me().catch(() => null);
    const rateLimited = await enforceApiRateLimit(base44, req, actor);
    if (rateLimited) return rateLimited;

    const validated = await readValidatedJson(req, {
      limit: { type: 'number', integer: true, min: 1, max: MAX_PAGE_LIMIT },
      skip: { type: 'number', integer: true, min: 0, max: 100000 },
      emails: { type: 'array', maxItems: MAX_EXPLICIT_EMAILS, items: { type: 'string', maxLength: 254 } },
      ids: { type: 'array', maxItems: MAX_EXPLICIT_EMAILS, items: { type: 'string', maxLength: 64 } },
      search: { type: 'string', maxLength: 100 },
      q: { type: 'string', maxLength: 100 },
      // Signed-in members may request emails so the app can link people to their
      // profiles and match post authors. Guests never receive emails.
      include_email: { type: 'boolean' },
    });
    if (validated.response) return validated.response;
    const payload = validated.data;
    const limit = Math.min(Math.max(Number(payload.limit) || DEFAULT_LIMIT, 1), MAX_PAGE_LIMIT);
    const skip = Math.max(Number(payload.skip) || 0, 0);
    let requestedEmails = Array.isArray(payload.emails)
      ? [...new Set(payload.emails.map((value) => cleanString(value, 254).toLowerCase()).filter(Boolean))]
      : [];
    const requestedIds = Array.isArray(payload.ids)
      ? [...new Set(payload.ids.map((value) => cleanString(value, 64)).filter(Boolean))]
      : [];
    const search = cleanString(payload.search || payload.q || '', 100).toLowerCase();

    if (!actor && requestedEmails.length > 0) {
      const publicAuthorChecks = await Promise.all(requestedEmails.map(async (email) => {
        const [drops, stories] = await Promise.all([
          base44.asServiceRole.entities.GlowDrop.filter({ user_email: email }, '-created_date', 1).catch(() => []),
          base44.asServiceRole.entities.Story.filter({ user_email: email }, '-created_date', 1).catch(() => []),
        ]);
        return drops.length > 0 || stories.length > 0 ? email : null;
      }));
      requestedEmails = publicAuthorChecks.filter(Boolean);
    }

    let users = [];
    let includeEmail = payload.include_email === true && !!actor;
    if (requestedEmails.length > 0) {
      includeEmail = true;
      const batches = await Promise.all(requestedEmails.map((email) =>
        base44.asServiceRole.entities.User.filter({ email }).catch(() => [])
      ));
      users = batches.flat().slice(0, MAX_EXPLICIT_EMAILS);
    } else if (requestedIds.length > 0) {
      const batches = await Promise.all(requestedIds.map((id) =>
        base44.asServiceRole.entities.User.filter({ id }).catch(() => [])
      ));
      users = batches.flat().slice(0, MAX_EXPLICIT_EMAILS);
    } else if (search.length >= 2) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      users = await base44.asServiceRole.entities.User.filter({
        $or: [
          { full_name: { $regex: escaped, $options: 'i' } },
          { display_name: { $regex: escaped, $options: 'i' } },
          { username: { $regex: escaped, $options: 'i' } },
          { country: { $regex: escaped, $options: 'i' } },
          { city: { $regex: escaped, $options: 'i' } },
        ],
      }, '-created_date', limit, skip);
    } else {
      users = await base44.asServiceRole.entities.User.list('-created_date', limit, skip);
    }

    return Response.json(users.map((item) => publicUserShape(item, includeEmail)));
  } catch (error) {
    console.error('listPublicUsers failed:', error?.message);
    return Response.json({ error: 'Unable to list users' }, { status: 500 });
  }
}