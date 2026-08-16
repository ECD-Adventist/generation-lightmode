import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';
import { createNotificationIdempotent } from '../../shared/notifications.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const limited = await enforceApiRateLimit(base44, req, user);
    if (limited) return limited;

    const validated = await readValidatedJson(req, {
      drop_id: { type: 'string', required: true, maxLength: 64 },
      content: { type: 'string', required: true, minLength: 1, maxLength: 1000 },
      parent_comment_id: { type: 'string', maxLength: 64 },
    });
    if (validated.response) return validated.response;
    const { drop_id, parent_comment_id } = validated.data;
    const content = validated.data.content.trim();

    const drop = await base44.asServiceRole.entities.GlowDrop.get(drop_id).catch(() => null);
    if (!drop) return Response.json({ error: 'Post not found' }, { status: 404 });

    let recipientEmail = drop.user_email || '';
    if (parent_comment_id) {
      const parent = await base44.asServiceRole.entities.GlowDropComment.get(parent_comment_id).catch(() => null);
      if (!parent || parent.drop_id !== drop_id) return Response.json({ error: 'Parent comment not found' }, { status: 404 });
      recipientEmail = parent.user_email || '';
    }

    const created = await base44.entities.GlowDropComment.create({
      drop_id,
      user_email: user.email,
      content,
      parent_comment_id: parent_comment_id || '',
    });

    if (recipientEmail && recipientEmail !== user.email) {
      const recipient = (await base44.asServiceRole.entities.User.filter({ email: recipientEmail }, '-created_date', 1))[0];
      if (recipient?.id) {
        try {
          await createNotificationIdempotent(base44, {
            user_id: recipient.id,
            actor_user_id: user.id,
            type: 'comment',
            reference_id: `comment_${created.id}`,
            message: `${user.full_name || user.email?.split('@')[0] || 'Someone'} ${parent_comment_id ? 'replied to your comment' : 'commented on your post'}.`,
            link: `/Post?id=${encodeURIComponent(drop_id)}&user=${encodeURIComponent(drop.user_email || '')}`,
          });
        } catch (error) {
          console.error('[notification:error]', { type: 'comment', recipient: recipient.id, action: parent_comment_id ? 'reply_to_comment' : 'comment_on_glowdrop', error: error?.message });
        }
      }
    }

    return Response.json({ success: true, comment: created });
  } catch (error) {
    console.error('createGlowDropComment failed:', error?.message);
    return Response.json({ error: error?.message || 'Unable to create comment' }, { status: 500 });
  }
}