import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';
import { logAdminAction, logPermissionDenied } from '../../shared/securityEvents.ts';

const ADMIN_ROLES = new Set(['admin', 'super_admin']);
const ADMIN_FIELDS = new Set([
  'leader_name',
  'leader_title',
  'leader_country',
  'leader_bio',
  'leader_profile_picture_url',
  'leader_cover_picture_url',
  'manager_emails',
  'active',
  'notes',
]);
const MANAGER_FIELDS = new Set([
  'leader_name',
  'leader_title',
  'leader_country',
  'leader_bio',
  'leader_profile_picture_url',
  'leader_cover_picture_url',
]);

const clean = (value, max = 2000) => typeof value === 'string' ? value.trim().slice(0, max) : value;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const rateLimited = await enforceApiRateLimit(base44, req, user);
    if (rateLimited) return rateLimited;
    if (!ADMIN_ROLES.has(user.role)) {
      await logPermissionDenied(base44, req, user, 'managed_leader_account', 'update');
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const validated = await readValidatedJson(req, {
      account_id: { type: 'string', required: true, format: 'uuid' },
      updates: { type: 'object', required: true, properties: {
        leader_name: { type: 'string', maxLength: 300 },
        leader_title: { type: 'string', maxLength: 300 },
        leader_country: { type: 'string', maxLength: 300 },
        leader_bio: { type: 'string', maxLength: 2000 },
        leader_profile_picture_url: { type: 'string', maxLength: 2048 },
        leader_cover_picture_url: { type: 'string', maxLength: 2048 },
        manager_emails: { type: 'array', maxItems: 3, items: { type: 'string', maxLength: 254 } },
        active: { type: 'boolean' },
        notes: { type: 'string', maxLength: 2000 },
      } },
    });
    if (validated.response) return validated.response;
    const body = validated.data;
    const accountId = body.account_id.trim();
    const updates = body.updates;
    if (!accountId) return Response.json({ error: 'Account id is required' }, { status: 400 });

    const accounts = await base44.asServiceRole.entities.ManagedLeaderAccount.list('-created_date', 200);
    const account = accounts.find((item) => item.id === accountId);
    if (!account) return Response.json({ error: 'Leader account not found' }, { status: 404 });

    const allowed = ADMIN_FIELDS;
    const payload = {};
    for (const [key, value] of Object.entries(updates)) {
      if (!allowed.has(key)) continue;
      if (key === 'manager_emails') {
        payload.manager_emails = Array.isArray(value)
          ? value.map((email) => String(email || '').trim().toLowerCase()).filter(Boolean).slice(0, 3)
          : [];
      } else if (key === 'active') {
        payload.active = value !== false;
      } else if (key === 'leader_bio' || key === 'notes') {
        payload[key] = clean(value, 2000) || '';
      } else {
        payload[key] = clean(value, 300) || '';
      }
    }

    if (Object.keys(payload).length === 0) return Response.json({ success: true, updated_fields: [] });

    await base44.asServiceRole.entities.ManagedLeaderAccount.update(account.id, payload);
    await logAdminAction(base44, req, user, `managed_leader:${account.id}`, 'update', `Fields: ${Object.keys(payload).join(', ')}`);
    return Response.json({ success: true, updated_fields: Object.keys(payload) });
  } catch (error) {
    console.error('updateManagedLeaderAccount failed:', error?.message);
    return Response.json({ error: 'Unable to update leader account' }, { status: 500 });
  }
});