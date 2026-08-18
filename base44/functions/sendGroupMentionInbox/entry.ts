import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createNotificationIdempotent } from '../../shared/notifications.ts';

async function sendInboxMessage(base44, senderEmail, recipientEmail, content) {
  if (senderEmail === recipientEmail) return;
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

    const { group_id, mentioned_emails, message_preview } = await req.json();
    if (!group_id || !Array.isArray(mentioned_emails) || mentioned_emails.length === 0) {
      return Response.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const groups = await base44.asServiceRole.entities.GlowGroup.filter({ id: group_id });
    const group = groups[0];
    if (!group) return Response.json({ error: 'Group not found' }, { status: 404 });

    // Only tag members — verify each email is an accepted member (or the leader)
    const members = await base44.asServiceRole.entities.GlowGroupMember.filter({ group_id });
    const memberEmails = new Set(members.map(m => m.user_email));
    if (group.leader_email) memberEmails.add(group.leader_email);

    // Sender identity always comes from the authenticated caller — never from the payload
    const actualSenderEmail = user.email;
    const actualSenderName = user.full_name || user.email?.split('@')[0] || 'Someone';

    // Prevent non-members from sending mentions
    if (!memberEmails.has(actualSenderEmail)) {
      return Response.json({ error: 'Sender is not a member of this group' }, { status: 403 });
    }

    const validMentions = mentioned_emails.filter(e => memberEmails.has(e) && e !== actualSenderEmail);
    if (validMentions.length === 0) {
      return Response.json({ success: true, notified: 0 });
    }

    const preview = (message_preview || '').slice(0, 120);

    const mentionedUsers = await base44.asServiceRole.entities.User.list(undefined, 10000);
    const userIdByEmail = new Map(mentionedUsers.filter((item) => item.email).map((item) => [item.email, item.id]));

    // Fire bell notification + inbox message for each valid mention
    for (const email of validMentions) {
      const recipientId = userIdByEmail.get(email);
      if (recipientId) {
        // Idempotent: dedup on group + recipient
        await createNotificationIdempotent(base44, {
          user_id: recipientId,
          actor_user_id: user.id,
          type: 'message',
          reference_id: `mention_${group_id}_${recipientId}`,
          message: `${actualSenderName} mentioned you in "${group.name}": "${preview}${preview.length >= 120 ? '...' : ''}"`,
          link: `/GroupChat?id=${group_id}`,
        }).catch(() => {});
      }

      // Inbox message — send FROM the actual human sender, not the service account
      const inboxContent = `${actualSenderName} tagged you in "${group.name}": "${preview}${preview.length >= 120 ? '...' : ''}" — Open group: /GroupChat?id=${group_id}`;
      try {
        await sendInboxMessage(base44, actualSenderEmail, email, inboxContent);
      } catch (err) {
        console.error('Failed to send inbox message to', email, err.message);
      }
    }

    return Response.json({ success: true, notified: validMentions.length });
  } catch (error) {
    console.error('sendGroupMentionInbox error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});