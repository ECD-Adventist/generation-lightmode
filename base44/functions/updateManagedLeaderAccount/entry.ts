import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

    const body = await req.json().catch(() => ({}));
    const accountId = String(body.account_id || '').trim();
    const updates = body.updates && typeof body.updates === 'object' ? body.updates : {};
    if (!accountId) return Response.json({ error: 'Account id is required' }, { status: 400 });

    const accounts = await base44.asServiceRole.entities.ManagedLeaderAccount.list('-created_date', 200);
    const account = accounts.find((item) => item.id === accountId);
    if (!account) return Response.json({ error: 'Leader account not found' }, { status: 404 });

    const isAdmin = ADMIN_ROLES.has(user.role);
    const isManager = Array.isArray(account.manager_emails) && account.manager_emails.includes(user.email);
    if (!isAdmin && !isManager) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const allowed = isAdmin ? ADMIN_FIELDS : MANAGER_FIELDS;
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
    return Response.json({ success: true, updated_fields: Object.keys(payload) });
  } catch (error) {
    console.error('updateManagedLeaderAccount failed:', error?.message);
    return Response.json({ error: 'Unable to update leader account' }, { status: 500 });
  }
});