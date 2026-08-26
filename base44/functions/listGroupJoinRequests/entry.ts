import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const actor = await base44.auth.me();
    if (!actor) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const rateLimited = await enforceApiRateLimit(base44, req, actor);
    if (rateLimited) return rateLimited;

    const validated = await readValidatedJson(req, {
      group_ids: { type: 'array', required: true, maxItems: 100, items: { type: 'string', maxLength: 64 } },
      include_details: { type: 'boolean' },
    });
    if (validated.response) return validated.response;
    const groupIds = [...new Set(validated.data.group_ids || [])];
    const isAdmin = actor.role === 'admin' || actor.role === 'super_admin';
    const groups = (await Promise.all(groupIds.map((id) => base44.asServiceRole.entities.GlowGroup.filter({ id })))).flat();
    const allowedIds = groups
      .filter((group) => isAdmin || normalizeEmail(group.leader_email) === normalizeEmail(actor.email))
      .map((group) => group.id);
    if (allowedIds.length === 0) return Response.json({ counts: {}, requests: [] });

    const pages = await Promise.all(allowedIds.map((groupId) =>
      base44.asServiceRole.entities.GlowGroupJoinRequest.filter({ group_id: groupId, status: 'pending' }, '-created_date', 500)
    ));
    const requests = pages.flat();
    const counts = {};
    requests.forEach((request) => { counts[request.group_id] = (counts[request.group_id] || 0) + 1; });
    return Response.json({
      counts,
      requests: validated.data.include_details ? requests.map((request) => ({
        id: request.id,
        group_id: request.group_id,
        user_email: normalizeEmail(request.user_email),
        message: request.message || '',
        status: request.status,
        created_date: request.created_date,
      })) : [],
    });
  } catch (error) {
    console.error('listGroupJoinRequests error:', error?.message);
    return Response.json({ error: 'Unable to load group requests' }, { status: 500 });
  }
}