import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';
import { createNotificationIdempotent } from '../../shared/notifications.ts';
import { deleteFromSupabase, mirrorToSupabase } from '../../shared/supabase.ts';

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const actor = await base44.auth.me();
    if (!actor) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const rateLimited = await enforceApiRateLimit(base44, req, actor);
    if (rateLimited) return rateLimited;

    const validated = await readValidatedJson(req, {
      group_id: { type: 'string', required: true, maxLength: 64 },
      message: { type: 'string', maxLength: 500 },
    });
    if (validated.response) return validated.response;
    const groupId = validated.data.group_id;
    const requesterEmail = normalizeEmail(actor.email);

    const groups = await base44.asServiceRole.entities.GlowGroup.filter({ id: groupId });
    const group = groups[0];
    if (!group) return Response.json({ error: 'Group not found' }, { status: 404 });

    const existingMembers = await base44.asServiceRole.entities.GlowGroupMember.filter({ group_id: groupId, user_email: requesterEmail });
    if (existingMembers.length > 0 || normalizeEmail(group.leader_email) === requesterEmail) {
      return Response.json({ success: true, status: 'already_member', group_id: groupId });
    }

    const pending = await base44.asServiceRole.entities.GlowGroupJoinRequest.filter({ group_id: groupId, user_email: requesterEmail, status: 'pending' });
    if (pending.length > 0) {
      return Response.json({ success: true, status: 'already_pending', request_id: pending[0].id, group_id: groupId });
    }

    const created = await base44.asServiceRole.entities.GlowGroupJoinRequest.create({
      group_id: groupId,
      user_email: requesterEmail,
      status: 'pending',
      message: String(validated.data.message || '').trim().slice(0, 500),
    });
    const pendingAfterCreate = await base44.asServiceRole.entities.GlowGroupJoinRequest.filter({ group_id: groupId, user_email: requesterEmail, status: 'pending' }, 'created_date', 100);
    const canonicalRequest = pendingAfterCreate[0] || created;
    const duplicates = pendingAfterCreate.filter((item) => item.id !== canonicalRequest.id);
    await Promise.all(duplicates.map(async (item) => {
      await base44.asServiceRole.entities.GlowGroupJoinRequest.delete(item.id).catch(() => null);
      await deleteFromSupabase('GlowGroupJoinRequest', item.id);
    }));
    const mirrored = await mirrorToSupabase('GlowGroupJoinRequest', canonicalRequest);
    if (!mirrored) console.error(`[group-join] request mirror failed request=${canonicalRequest.id}`);

    const leaders = await base44.asServiceRole.entities.User.filter({ email: normalizeEmail(group.leader_email) });
    if (leaders[0]?.id) {
      await createNotificationIdempotent(base44, {
        user_id: leaders[0].id,
        actor_user_id: actor.id,
        type: 'system',
        reference_id: `group_join_request_${canonicalRequest.id}`,
        message: `${actor.full_name || 'Someone'} requested to join your group “${group.name}”.`,
        link: `/GroupChat?id=${encodeURIComponent(groupId)}&requests=true`,
      });
    }

    return Response.json({ success: true, status: duplicates.length > 0 ? 'already_pending' : 'success', request_id: canonicalRequest.id, group_id: groupId });
  } catch (error) {
    console.error('requestGroupJoin error:', error?.message);
    return Response.json({ error: error?.message || 'Unable to request group access' }, { status: 500 });
  }
}