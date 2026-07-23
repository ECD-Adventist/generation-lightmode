import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createNotificationIdempotent } from '../../shared/notifications.ts';

// Send an admin notification (and optional email) to a specific user
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const ADMIN_ROLES = ['admin', 'super_admin'];
    if (!ADMIN_ROLES.includes(caller.role)) {
      return Response.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const { targetUserId, message, sendEmail, subject } = await req.json();
    if (!targetUserId || !message) {
      return Response.json({ error: 'targetUserId and message are required' }, { status: 400 });
    }

    const target = await base44.asServiceRole.entities.User.get(targetUserId).catch(() => null);
    if (!target) return Response.json({ error: 'User not found' }, { status: 404 });

    // Idempotent: dedup on admin + target + message hash
    await createNotificationIdempotent(base44, {
      user_id: target.id,
      actor_user_id: caller.id,
      type: 'system',
      reference_id: `admin_${target.id}_${String(message).slice(0, 50)}`,
      message: message.slice(0, 500),
    });

    let emailSent = false;
    if (sendEmail) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: target.email,
          subject: subject || 'Message from Generation LightMode',
          body: message,
        });
        emailSent = true;
      } catch (e) {
        console.error('SendEmail failed:', e.message);
      }
    }

    await base44.asServiceRole.entities.AdminLog.create({
      admin_email: caller.email,
      admin_name: caller.full_name || caller.email,
      action: 'user_notified',
      target: target.email,
      details: `Sent ${emailSent ? 'in-app + email' : 'in-app'} notification: "${message.slice(0, 100)}"`,
      category: 'users',
    });

    return Response.json({ success: true, emailSent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});