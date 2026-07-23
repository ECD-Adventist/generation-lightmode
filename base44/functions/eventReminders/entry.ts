import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createNotificationIdempotent } from '../../shared/notifications.ts';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const events = await base44.asServiceRole.entities.GlowGroupEvent.filter({});
        const rsvps = await base44.asServiceRole.entities.GlowGroupEventRSVP.filter({});
        const now = new Date();

        // Pre-load all users to resolve user_id from email
        const allUsers = await base44.asServiceRole.entities.User.list(undefined, 10000);
        const userIdByEmail = new Map(allUsers.filter((u) => u.email).map((u) => [u.email, u.id]));

        let sentCount = 0;

        for (const event of events) {
            if (!event.date) continue;
            const eventDate = new Date(event.date);
            const diffHours = (eventDate - now) / (1000 * 60 * 60);

            let message = null;
            let reminderType = null;
            if (diffHours > 23 && diffHours <= 24) {
                message = `Reminder: ${event.title} is happening tomorrow!`;
                reminderType = 'tomorrow';
            } else if (diffHours > 0 && diffHours <= 1) {
                message = `Starting soon! ${event.title} begins in 1 hour.`;
                reminderType = 'soon';
            }

            if (message && reminderType) {
                const going = rsvps.filter(r => r.event_id === event.id && r.status === 'going');
                const link = event.location?.startsWith('http') ? event.location : `/Dashboard`;

                for (const g of going) {
                    const recipientId = userIdByEmail.get(g.user_email);
                    if (!recipientId) continue;

                    // Idempotent: dedup on event + reminder type (prevents duplicate reminders)
                    const id = await createNotificationIdempotent(base44, {
                        user_id: recipientId,
                        type: "system",
                        reference_id: `event_reminder_${event.id}_${reminderType}`,
                        message: `${message}${event.location?.startsWith('http') ? ' Click to join.' : ''}`,
                        link: link
                    }).catch(() => null);

                    if (id) sentCount++;
                }
            }
        }

        return Response.json({ success: true, notifications_sent: sentCount });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});