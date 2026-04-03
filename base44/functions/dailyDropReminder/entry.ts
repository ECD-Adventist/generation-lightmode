import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access for scheduled task
    const caller = await base44.auth.me();
    if (!caller || (caller.role !== 'admin' && caller.role !== 'super_admin')) {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    const users = await base44.asServiceRole.entities.User.list('-created_date', 500);
    
    const notifications = users.map(user => ({
      user_email: user.email,
      type: "system",
      message: "🌅 Your Daily Drop is ready! Start your day with today's truth.",
      link: "/DailyTruthFeed",
      read: false
    }));

    // Create in batches of 25
    for (let i = 0; i < notifications.length; i += 25) {
      const batch = notifications.slice(i, i + 25);
      await base44.asServiceRole.entities.Notification.bulkCreate(batch);
    }

    return Response.json({ success: true, notified: notifications.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});