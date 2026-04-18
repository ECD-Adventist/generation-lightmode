import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

async function sendInboxMessage(base44, senderEmail, recipientEmail, content) {
  if (senderEmail === recipientEmail) return;
  // Find or create the conversation
  const [a, b] = [senderEmail, recipientEmail].sort();
  let convs = await base44.asServiceRole.entities.DirectConversation.filter({
    participant_a_email: a,
    participant_b_email: b,
  });
  let conv = convs[0];
  if (!conv) {
    conv = await base44.asServiceRole.entities.DirectConversation.create({
      participant_a_email: a,
      participant_b_email: b,
      last_message_at: new Date().toISOString(),
      last_message: content,
    });
  } else {
    await base44.asServiceRole.entities.DirectConversation.update(conv.id, {
      last_message_at: new Date().toISOString(),
      last_message: content,
    });
  }
  await base44.asServiceRole.entities.DirectMessage.create({
    conversation_id: conv.id,
    sender_email: senderEmail,
    recipient_email: recipientEmail,
    content,
    status: 'delivered',
    read: false,
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { request_id, action } = await req.json();
    if (!request_id || !['approve', 'reject'].includes(action)) {
      return Response.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const requests = await base44.asServiceRole.entities.GlowGroupJoinRequest.filter({ id: request_id });
    const request = requests[0];
    if (!request) return Response.json({ error: 'Request not found' }, { status: 404 });

    const groups = await base44.asServiceRole.entities.GlowGroup.filter({ id: request.group_id });
    const group = groups[0];
    if (!group) return Response.json({ error: 'Group not found' }, { status: 404 });

    const isLeader = group.leader_email === user.email;
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    if (!isLeader && !isAdmin) {
      return Response.json({ error: 'Only the group leader can decide on join requests' }, { status: 403 });
    }

    if (request.status !== 'pending') {
      return Response.json({ error: 'Request already decided' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    await base44.asServiceRole.entities.GlowGroupJoinRequest.update(request_id, {
      status: newStatus,
      decided_at: new Date().toISOString(),
      decided_by: user.email,
    });

    if (action === 'approve') {
      const existing = await base44.asServiceRole.entities.GlowGroupMember.filter({
        group_id: request.group_id,
        user_email: request.user_email,
      });
      if (existing.length === 0) {
        await base44.asServiceRole.entities.GlowGroupMember.create({
          user_email: request.user_email,
          group_id: request.group_id,
          joined_at: new Date().toISOString(),
        });
      }
    }

    // 1. Notification (bell)
    await base44.asServiceRole.entities.Notification.create({
      user_email: request.user_email,
      type: 'system',
      message: action === 'approve'
        ? `Your request to join "${group.name}" was approved! ⚡`
        : `Your request to join "${group.name}" was declined.`,
      link: action === 'approve' ? `/GroupChat?id=${group.id}` : `/GlowGroups`,
    });

    // 2. Inbox message from the leader
    const inboxContent = action === 'approve'
      ? `🎉 Welcome to "${group.name}"! Your request has been approved. Tap here to jump into the group: /GroupChat?id=${group.id}`
      : `Hi, your request to join "${group.name}" was not approved at this time.`;
    await sendInboxMessage(base44, user.email, request.user_email, inboxContent);

    return Response.json({ success: true, status: newStatus });
  } catch (error) {
    console.error('handleGroupJoinRequest error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});