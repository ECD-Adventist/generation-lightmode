import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';

// Officers may view administrator accounts read-only; updates go through
// updateManagedLeaderAccount, which stays restricted to admins.
const ADMIN_ROLES = new Set([
  'admin',
  'super_admin',
  'ecd_officer',
  'union_officer',
  'conference_field_officer',
  'church_officer',
]);

function privateLeader(account) {
  return {
    id: account.id,
    leader_name: account.leader_name || '',
    leader_email: account.leader_email || '',
    leader_title: account.leader_title || '',
    leader_country: account.leader_country || '',
    leader_bio: account.leader_bio || '',
    leader_profile_picture_url: account.leader_profile_picture_url || '',
    leader_cover_picture_url: account.leader_cover_picture_url || '',
    active: account.active !== false,
    notes: account.notes || '',
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
      leader_email: { type: 'string', maxLength: 254 },
    }, { allowEmpty: true });
    if (validated.response) return validated.response;
    const body = validated.data;
    const leaderEmail = String(body.leader_email || '').trim().toLowerCase();
    const isAdmin = ADMIN_ROLES.has(user.role);
    const accounts = await base44.asServiceRole.entities.ManagedLeaderAccount.filter({ active: true });

    const visible = accounts.filter((account) => {
      if (leaderEmail && String(account.leader_email || '').toLowerCase() !== leaderEmail) return false;
      if (isAdmin) return true;
      return Array.isArray(account.manager_emails) && account.manager_emails.includes(user.email);
    }).map(privateLeader);

    return Response.json(visible);
  } catch (error) {
    console.error('listManagedLeaderAccounts failed:', error?.message);
    return Response.json({ error: 'Unable to list managed leader accounts' }, { status: 500 });
  }
});