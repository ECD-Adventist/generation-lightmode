import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { createNotificationIdempotent } from '../../shared/notifications.ts';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';
import { deleteFromSupabase, mirrorToSupabase } from '../../shared/supabase.ts';

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

async function sendInboxMessageOnce(base44, senderEmail, recipientEmail, content, requestId) {
  if (senderEmail === recipientEmail) return;
  const [participantA, participantB] = [senderEmail, recipientEmail].sort();
  let conversations = await base44.asServiceRole.entities.DirectConversation.filter({ participant_a_email: participantA, participant_b_email: participantB });
  let conversation = conversations[0];
  if (!conversation) {
    conversation = await base44.asServiceRole.entities.DirectConversation.create({ participant_a_email: participantA, participant_b_email: participantB, last_message_at: new Date().toISOString(), last_message: content });
  }
  const marker = `[join:${requestId}]`;
  const existing = await base44.asServiceRole.entities.DirectMessage.filter({ conversation_id: conversation.id, content: `${marker} ${content}` });
  if (existing.length > 0) return;
  await base44.asServiceRole.entities.DirectMessage.create({ conversation_id: conversation.id, sender_id: senderEmail, recipient_id: recipientEmail, content: `${marker} ${content}`, status: 'delivered', read: false });
  await base44.asServiceRole.entities.DirectConversation.update(conversation.id, { last_message_at: new Date().toISOString(), last_message: content });
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const actor = await base44.auth.me();
    if (!actor) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const rateLimited = await enforceApiRateLimit(base44, req, actor);
    if (rateLimited) return rateLimited;

    const validated = await readValidatedJson(req, {
      request_id: { type: 'string', required: true, maxLength: 64 },
      action: { type: 'string', required: true, enum: ['approve', 'reject'] },
    });
    if (validated.response) return validated.response;
    const { request_id: requestId, action } = validated.data;

    const requests = await base44.asServiceRole.entities.GlowGroupJoinRequest.filter({ id: requestId });
    const joinRequest = requests[0];
    if (!joinRequest) return Response.json({ error: 'Request not found' }, { status: 404 });
    const groups = await base44.asServiceRole.entities.GlowGroup.filter({ id: joinRequest.group_id });
    const group = groups[0];
    if (!group) return Response.json({ error: 'Group not found' }, { status: 404 });

    const isLeader = normalizeEmail(group.leader_email) === normalizeEmail(actor.email);
    const isAdmin = actor.role === 'admin' || actor.role === 'super_admin';
    if (!isLeader && !isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const desiredStatus = action === 'approve' ? 'approved' : 'rejected';
    if (joinRequest.status !== 'pending') {
      return Response.json({ success: true, status: joinRequest.status, already_decided: true, request_id: requestId });
    }

    const updatedRequest = await base44.asServiceRole.entities.GlowGroupJoinRequest.update(requestId, {
      status: desiredStatus,
      decided_at: new Date().toISOString(),
      decided_by: normalizeEmail(actor.email),
    });
    await mirrorToSupabase('GlowGroupJoinRequest', updatedRequest);

    let member = null;
    if (action === 'approve') {
      const requesterEmail = normalizeEmail(joinRequest.user_email);
      const existingMembers = await base44.asServiceRole.entities.GlowGroupMember.filter({ group_id: joinRequest.group_id, user_email: requesterEmail });
      member = existingMembers[0] || await base44.asServiceRole.entities.GlowGroupMember.create({ user_email: requesterEmail, group_id: joinRequest.group_id, joined_at: new Date().toISOString(), role: 'member' });
      const membersAfterCreate = await base44.asServiceRole.entities.GlowGroupMember.filter({ group_id: joinRequest.group_id, user_email: requesterEmail }, 'created_date', 100);
      member = membersAfterCreate[0] || member;
      const duplicateMembers = membersAfterCreate.filter((item) => item.id !== member.id);
      await Promise.all(duplicateMembers.map(async (item) => {
        await base44.asServiceRole.entities.GlowGroupMember.delete(item.id).catch(() => null);
        await deleteFromSupabase('GlowGroupMember', item.id);
      }));
      await mirrorToSupabase('GlowGroupMember', member);
    }

    const recipients = await base44.asServiceRole.entities.User.filter({ email: normalizeEmail(joinRequest.user_email) });
    if (recipients[0]?.id) {
      await createNotificationIdempotent(base44, {
        user_id: recipients[0].id,
        actor_user_id: actor.id,
        type: 'system',
        reference_id: `join_request_decision_${requestId}`,
        message: action === 'approve' ? `Your request to join “${group.name}” was approved.` : `Your request to join “${group.name}” was declined.`,
        link: action === 'approve' ? `/GroupChat?id=${group.id}` : '/GlowGroups',
      });
    }

    const inboxContent = action === 'approve' ? `Welcome to “${group.name}”. Your request was approved.` : `Your request to join “${group.name}” was not approved at this time.`;
    await sendInboxMessageOnce(base44, normalizeEmail(actor.email), normalizeEmail(joinRequest.user_email), inboxContent, requestId);

    return Response.json({ success: true, status: desiredStatus, request_id: requestId, member_id: member?.id || null });
  } catch (error) {
    console.error('handleGroupJoinRequest error:', error?.message);
    return Response.json({ error: error?.message || 'Unable to decide request' }, { status: 500 });
  }
}