import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}

function congratulationsBody(app) {
  const institutionName = escapeHtml(app.institution_name || 'your institution');
  const firstName = escapeHtml((app.contact_person || 'Friend').split(' ')[0]);
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0B0F1A;font-family:Inter,Segoe UI,sans-serif;color:#E0E8F0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0B0F1A;padding:40px 16px;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;background:#121826;border:1px solid rgba(255,208,0,0.22);border-radius:24px;overflow:hidden;">
        <tr><td style="padding:32px 28px;text-align:center;background:linear-gradient(135deg,rgba(255,208,0,0.16),rgba(0,207,255,0.10));">
          <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png" alt="Generation LightMode" style="height:56px;width:auto;" />
        </td></tr>
        <tr><td style="padding:32px 30px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#FFD000;">Application Approved</p>
          <h1 style="margin:0 0 16px;font-size:30px;line-height:1.15;color:#FFFFFF;">Congratulations, ${firstName}!</h1>
          <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#C8D0E0;">Your institution dashboard application for <strong style="color:#FFD000;">${institutionName}</strong> has been approved.</p>
          <div style="background:rgba(0,207,255,0.06);border:1px solid rgba(0,207,255,0.2);border-radius:16px;padding:18px;margin-bottom:22px;">
            <p style="margin:0;font-size:14px;line-height:1.8;color:#C8D0E0;">You can now access your institution tools, manage your public institution profile, and represent your community inside Generation LightMode.</p>
          </div>
          <div style="text-align:center;">
            <a href="https://generationlightmode.org/Profile" style="display:inline-block;background:linear-gradient(135deg,#FFD000,#00CFFF);color:#0B0F1A;text-decoration:none;font-weight:900;padding:14px 30px;border-radius:999px;">Open Your Profile</a>
          </div>
        </td></tr>
        <tr><td style="padding:20px 30px 30px;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="margin:0;font-size:12px;color:#8A9BB0;line-height:1.6;">Generation LightMode · Faith. Always On.</p>
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
    const payload = await req.json().catch(() => ({}));
    const app = payload.data;

    if (!app?.institution_name || app.status !== 'approved') {
      return Response.json({ success: true, skipped: true, reason: 'Application is not approved' });
    }

    const recipient = app.contact_email || app.user_email;
    if (!recipient) {
      return Response.json({ success: true, skipped: true, reason: 'No recipient email' });
    }

    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Generation LightMode',
      to: recipient,
      subject: `Congratulations — ${app.institution_name} has been approved`,
      body: congratulationsBody(app),
    });

    return Response.json({ success: true, to: recipient });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});