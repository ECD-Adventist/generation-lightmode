import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const users = await base44.asServiceRole.entities.User.list();
    const admins = users.filter(u => u.role === 'admin');
    
    let count = 0;
    for (const admin of admins) {
      await base44.asServiceRole.entities.User.update(admin.id, { role: 'super_admin' });
      count++;
    }
    
    return Response.json({ success: true, updatedCount: count });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});