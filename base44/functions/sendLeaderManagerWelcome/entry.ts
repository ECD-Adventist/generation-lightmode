import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Sends a branded welcome email to a newly assigned manager of a
// ManagedLeaderAccount. Admin-only.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (me.role !== 'admin' && me.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { manager_email, manager_name, leader_name, leader_title, leader_email } =
      await req.json();

    if (!manager_email || !leader_name) {
      return Response.json({ error: 'manager_email and leader_name are required' }, { status: 400 });
    }

    const greetingName = manager_name?.split(' ')?.[0] || 'Friend';
    const titleLine = leader_title ? `${leader_name} — ${leader_title}` : leader_name;

    const subject = `You've been authorized to post on behalf of ${leader_name}`;

    const body = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0B0F1A;font-family:'Inter','Segoe UI',sans-serif;color:#E0E8F0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B0F1A;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#121826;border:1px solid rgba(0,207,255,0.15);border-radius:20px;overflow:hidden;">
        <tr><td style="padding:32px 32px 16px;text-align:center;background:linear-gradient(135deg, rgba(0,207,255,0.08), rgba(255,208,0,0.08));">
          <img src="https://media.base44.com/images/public/69a6fca6155ae283f1b55144/2e403078b_LOGO-LANDSCAPE-GOLD_WEB.png" alt="Generation LightMode" style="height:56px;width:auto;" />
        </td></tr>

        <tr><td style="padding:24px 32px 8px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#FFD000;">Authorization Granted</p>
          <h1 style="margin:0 0 16px;font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:26px;line-height:1.2;color:#FFFFFF;letter-spacing:-0.01em;">
            Welcome, ${greetingName}.
          </h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#C8D0E0;">
            You have been added as an authorized manager for the LightMode account of:
          </p>

          <div style="background:rgba(0,207,255,0.06);border:1px solid rgba(0,207,255,0.2);border-radius:14px;padding:16px 20px;margin:0 0 20px;">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#00CFFF;">Leader</p>
            <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#FFFFFF;">${titleLine}</p>
            ${leader_email ? `<p style="margin:4px 0 0;font-size:12px;color:#8A9BB0;">${leader_email}</p>` : ''}
          </div>

          <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#C8D0E0;">
            From now on, when you create a Glow Drop in the LightMode app, you'll see a <strong style="color:#FFD000;">"Post As"</strong> selector at the top of the composer. You can choose to post under your own identity or under this leader's identity.
          </p>
        </td></tr>

        <tr><td style="padding:0 32px 8px;">
          <h2 style="margin:0 0 12px;font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:16px;color:#00CFFF;letter-spacing:0.01em;">How to engage with this authority</h2>
          <ol style="margin:0 0 8px;padding-left:18px;color:#C8D0E0;font-size:14px;line-height:1.8;">
            <li><strong style="color:#FFFFFF;">Represent faithfully.</strong> Every post you publish as the leader appears under their name and photo. Speak in their voice and tone.</li>
            <li><strong style="color:#FFFFFF;">Stay on-mission.</strong> Share content aligned with Generation LightMode's values: faith, light, truth, and unity.</li>
            <li><strong style="color:#FFFFFF;">All actions are logged.</strong> An audit trail records who actually published each post for transparency and accountability.</li>
            <li><strong style="color:#FFFFFF;">When in doubt, post as yourself.</strong> Personal reflections should go on your own profile — only use the leader identity for official content.</li>
          </ol>
        </td></tr>

        <tr><td style="padding:24px 32px;text-align:center;">
          <a href="https://generationlightmode.org/Feed" style="display:inline-block;background:linear-gradient(135deg,#00CFFF,#0080FE);color:#0B0F1A;font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:14px;text-decoration:none;padding:13px 28px;border-radius:999px;">
            Open LightMode →
          </a>
        </td></tr>

        <tr><td style="padding:20px 32px 32px;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="margin:0 0 6px;font-size:12px;color:#8A9BB0;line-height:1.6;">
            If you weren't expecting this, please reply to this email and let us know.
          </p>
          <p style="margin:0;font-size:11px;color:#5A6A85;letter-spacing:0.04em;">
            Generation LightMode · Faith. Always On.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Generation LightMode',
      to: manager_email,
      subject,
      body,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});