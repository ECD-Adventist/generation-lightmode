import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        // Find the user "nottainnovation@gmail.com"
        const users = await base44.asServiceRole.entities.User.list();
        const user = users.find(u => u.email === "nottainnovation@gmail.com");
        if (user) {
            await base44.asServiceRole.entities.User.update(user.id, { full_name: "LightMode Champion" });
            return Response.json({ success: true, user });
        }
        return Response.json({ success: false, message: "User not found" });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});