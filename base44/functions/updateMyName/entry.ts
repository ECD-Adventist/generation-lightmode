import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const cloned = req.clone();
        const body = await cloned.json();
        const { full_name } = body;

        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!full_name || !full_name.trim()) {
            return Response.json({ error: 'Full name is required' }, { status: 400 });
        }

        await base44.asServiceRole.entities.User.update(user.id, { full_name: full_name.trim() });

        return Response.json({ success: true, full_name: full_name.trim() });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});