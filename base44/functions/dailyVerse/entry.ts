import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // This is a scheduled task, so we use service role
        const users = await base44.asServiceRole.entities.User.list();
        
        const verses = [
            "I can do all things through Christ who strengthens me. - Philippians 4:13",
            "The Lord is my shepherd; I shall not want. - Psalm 23:1",
            "For I know the plans I have for you, declares the Lord... - Jeremiah 29:11",
            "Trust in the Lord with all your heart... - Proverbs 3:5",
            "Be strong and courageous. Do not be afraid; do not be discouraged... - Joshua 1:9"
        ];
        const verse = verses[Math.floor(Math.random() * verses.length)];
        
        const notifications = users.map(u => ({
            user_email: u.email,
            type: "system",
            message: `Daily Glow Verse: ${verse}. Open the app to share your reflection!`,
            link: "/Feed"
        }));
        
        if (notifications.length > 0) {
            await base44.asServiceRole.entities.Notification.bulkCreate(notifications);
        }

        return Response.json({ success: true, notifications_sent: notifications.length });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});