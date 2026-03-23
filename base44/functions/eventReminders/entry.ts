import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Use service role for scheduled jobs to bypass user-level auth rules
        const events = await base44.asServiceRole.entities.GlowGroupEvent.list();
        const rsvps = await base44.asServiceRole.entities.GlowGroupEventRSVP.list();
        const now = new Date();
        
        let sentCount = 0;
        
        for (const event of events) {
            if (!event.date) continue;
            const eventDate = new Date(event.date);
            const diffHours = (eventDate - now) / (1000 * 60 * 60);
            
            let message = null;
            if (diffHours > 23 && diffHours <= 24) {
                message = `Reminder: ${event.title} is happening tomorrow!`;
            } else if (diffHours > 0 && diffHours <= 1) {
                message = `Starting soon! ${event.title} begins in 1 hour.`;
            }
            
            if (message) {
                // Find users who RSVP'd "going"
                const going = rsvps.filter(r => r.event_id === event.id && r.status === 'going');
                const link = event.location?.startsWith('http') ? event.location : `/Dashboard`;
                
                const notifications = going.map(g => ({
                    user_email: g.user_email,
                    type: "system",
                    message: `${message} ${event.location?.startsWith('http') ? 'Click to join.' : ''}`,
                    link: link
                }));
                
                if (notifications.length > 0) {
                    await base44.asServiceRole.entities.Notification.bulkCreate(notifications);
                    sentCount += notifications.length;
                }
            }
        }
        
        return Response.json({ success: true, notifications_sent: sentCount });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});