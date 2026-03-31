import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { emails } = body; // optional: specific emails to remind

    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 2000);
    const incomplete = allUsers.filter(u =>
      !emails
        ? (!u.country || !u.bio || !u.profile_picture_url)
        : emails.includes(u.email)
    );

    let sent = 0;
    for (const u of incomplete) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: u.email,
          from_name: "Generation LightMode",
          subject: "Complete Your Profile — Join the Global Map! 🌍",
          body: `Hi ${u.full_name || 'Glow Believer'},

We noticed your Generation LightMode profile is incomplete. To show up on our Global Light Map and help us track our movement's reach, please take a moment to complete:

${[!u.country && '✅ Your Country', !u.bio && '✅ Your Bio', !u.profile_picture_url && '✅ Your Profile Picture'].filter(Boolean).join('\n')}

👉 Update your profile here: https://generationlightmode.base44.app/Profile

Together, we're lighting up the world — one country at a time!

Faith. Always On. ⚡
Generation LightMode Team`.trim()
        });
        sent++;
      } catch (_) {
        // skip failed sends, continue
      }
      // small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 300));
    }

    // Also notify admin
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: "wayogai@ecd.adventist.org",
      from_name: "Generation LightMode",
      subject: `Profile Completion Reminders Sent — ${sent} users notified`,
      body: `
Hi Admin,

A profile completion reminder was just sent to ${sent} members who have incomplete profiles (missing country, bio, or profile picture).

Here is the list of users notified:
${incomplete.map(u => `- ${u.full_name || 'Unknown'} (${u.email}) — Missing: ${[!u.country && 'country', !u.bio && 'bio', !u.profile_picture_url && 'photo'].filter(Boolean).join(', ')}`).join('\n')}

Total members with incomplete profiles: ${sent}

— Generation LightMode System
      `.trim()
    });

    return Response.json({ success: true, sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});