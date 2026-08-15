import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { logSecurityEvent } from '../../shared/securityEvents.ts';

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}

function applicationEmailBody(app) {
  const name = escapeHtml(app.institution_name || 'Institution');
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0B0F1A;font-family:Inter,Segoe UI,sans-serif;color:#E0E8F0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0F1A;padding:36px 16px;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;background:#121826;border:1px solid rgba(0,207,255,0.18);border-radius:22px;overflow:hidden;">
        <tr><td style="padding:28px;text-align:center;background:linear-gradient(135deg,rgba(0,207,255,0.10),rgba(255,208,0,0.08));">
          <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png" alt="Generation LightMode" style="height:54px;width:auto;" />
        </td></tr>
        <tr><td style="padding:28px;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#00CFFF;">New Institution Application</p>
          <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;color:#FFFFFF;">${name}</h1>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#C8D0E0;">A new institution dashboard application has been submitted and is ready for admin review.</p>
          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:18px;line-height:1.8;font-size:14px;color:#C8D0E0;">
            <strong style="color:#FFFFFF;">Applicant:</strong> ${escapeHtml(app.contact_person)}<br />
            <strong style="color:#FFFFFF;">Email:</strong> ${escapeHtml(app.contact_email || app.user_email)}<br />
            <strong style="color:#FFFFFF;">Type:</strong> ${escapeHtml(app.institution_type)}<br />
            <strong style="color:#FFFFFF;">Country:</strong> ${escapeHtml(app.country)}
          </div>
          <div style="text-align:center;margin-top:24px;">
            <a href="https://generationlightmode.org/AdminCenter?tab=institutions" style="display:inline-block;background:linear-gradient(135deg,#00CFFF,#0080FE);color:#0B0F1A;text-decoration:none;font-weight:800;padding:13px 26px;border-radius:999px;">Review Application</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me().catch(() => null);
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Tolerant parsing: the workflow runtime may attach extra metadata (e.g. `automation`),
    // so only the fields we need are validated — never trusted beyond the entity re-fetch below.
    const payload = await req.json().catch(() => ({}));
    const applicationId = payload?.event?.entity_id;
    if (typeof applicationId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(applicationId)) {
      return Response.json({ error: 'event.entity_id must be a valid identifier' }, { status: 400 });
    }
    const app = await base44.asServiceRole.entities.InstitutionApplication.get(applicationId).catch(() => null);
    if (!app) return Response.json({ error: 'Application not found' }, { status: 404 });
    if (!['admin', 'super_admin'].includes(caller.role) && caller.email !== app.user_email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const resource = `institution_application:${applicationId}`;
    const existingNotifications = await base44.asServiceRole.entities.SecurityEvent.filter({
      event_type: 'institution_application_admin_notification',
      resource,
    }, '-created_date', 1);
    if (existingNotifications.length > 0) {
      return Response.json({ success: true, skipped: true, reason: 'Already notified' });
    }

    const admins = await base44.asServiceRole.entities.User.list('-created_date', 1000);
    const recipients = admins
      .filter((user) => ['admin', 'super_admin'].includes(user.role))
      .map((user) => user.email)
      .filter(Boolean);

    await Promise.all(recipients.map((to) => base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Generation LightMode',
      to,
      subject: `New Institution Application: ${app.institution_name}`,
      body: applicationEmailBody(app),
    })));
    await logSecurityEvent(base44, req, {
      event_type: 'institution_application_admin_notification',
      severity: 'info',
      user_id: caller.id,
      resource,
      action: 'admins_notified',
      details: `Recipients: ${recipients.length}`,
    });

    return Response.json({ success: true, notified: recipients.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});