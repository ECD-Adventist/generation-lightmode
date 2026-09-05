import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';

function safeLeader(account, includeEmail = false) {
  return {
    id: account.id,
    ...(includeEmail ? { leader_email: account.leader_email || '' } : {}),
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
    // Public leader lookup: if the rate-limit ledger itself errors, still return the
    // leader details instead of failing, so cards don't fall back to generic names.
    try {
      const rateLimited = await enforceApiRateLimit(base44, req, user);
      if (rateLimited) return rateLimited;
    } catch (rateLimitError) {
      console.error('listPublicLeaderAccounts: rate limit ledger unavailable:', rateLimitError?.message);
    }

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

    const accounts = await base44.asServiceRole.entities.ManagedLeaderAccount.filter({ active: true });
    const filtered = accounts
      .filter((account) => {
        if (emails && !emails.has(String(account.leader_email || '').toLowerCase())) return false;
        if (ids && !ids.has(String(account.id || ''))) return false;
        if (!search) return true;
        const text = `${account.leader_name || ''} ${account.leader_title || ''} ${account.leader_country || ''}`.toLowerCase();
        return text.includes(search);
      })
      .slice(0, limit)
      .map((account) => safeLeader(account, Boolean(emails || ids)));

    return Response.json(filtered);
  } catch (error) {
    console.error('listPublicLeaderAccounts failed:', error?.message);
    return Response.json({ error: 'Unable to list leader accounts' }, { status: 500 });
  }
}