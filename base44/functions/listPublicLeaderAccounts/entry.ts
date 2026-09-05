import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';

function safeLeader(account, includeEmail = false) {
  return {
    id: account.id,
    ...(includeEmail ? { leader_email: String(account.leader_email || '').trim().toLowerCase() } : {}),
    leader_name: account.leader_name || '',
    leader_title: account.leader_title || '',
    leader_country: account.leader_country || '',
    leader_bio: account.leader_bio || '',
    leader_profile_picture_url: account.leader_profile_picture_url || '',
    leader_cover_picture_url: account.leader_cover_picture_url || '',
    active: account.active !== false,
  };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const rateLimited = await enforceApiRateLimit(base44, req, user);
    if (rateLimited) return rateLimited;

    const validated = await readValidatedJson(req, {
      limit: { type: 'number', integer: true, min: 1, max: 200 },
      search: { type: 'string', maxLength: 100 },
      emails: { type: 'array', maxItems: 100, items: { type: 'string', maxLength: 254 } },
      ids: { type: 'array', maxItems: 100, items: { type: 'string', maxLength: 64 } },
    });
    if (validated.response) return validated.response;
    const body = validated.data;
    const limit = Math.max(1, Math.min(Number.parseInt(body.limit, 10) || 100, 200));
    const search = String(body.search || '').trim().toLowerCase().slice(0, 100);
    const emails = Array.isArray(body.emails)
      ? new Set(body.emails.map((email) => String(email || '').trim().toLowerCase()).filter(Boolean).slice(0, 100))
      : null;

    const ids = Array.isArray(body.ids)
      ? new Set(body.ids.map((id) => String(id || '').trim()).filter(Boolean).slice(0, 100))
      : null;

    // Leader profiles are publicly readable; use the caller's permitted read access.
    const query = { active: true };
    if (ids) query.id = { $in: [...ids] };
    if (emails) query.leader_email = { $in: [...emails] };
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = ['leader_name', 'leader_title', 'leader_country'].map(field => ({ [field]: { $regex: escaped, $options: 'i' } }));
    }
    const accounts = await base44.entities.ManagedLeaderAccount.filter(query, '-created_date', limit);
    const filtered = accounts.map(account => safeLeader(account, Boolean(user || emails || ids)));

    return Response.json(filtered);
  } catch (error) {
    console.error('listPublicLeaderAccounts failed:', error?.message);
    if ((error?.status || error?.response?.status) === 429 || /rate limit exceeded/i.test(error?.message || '')) {
      return Response.json({ error: 'Leader details are temporarily busy. Please retry shortly.' }, { status: 429, headers: { 'Retry-After': '60' } });
    }
    return Response.json({ error: 'Unable to list leader accounts' }, { status: 500 });
  }
}