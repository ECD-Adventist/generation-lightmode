import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();

    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const ADMIN_ROLES = ['admin', 'super_admin'];
    if (!ADMIN_ROLES.includes(caller.role)) {
      return Response.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const { targetUserId } = await req.json();
    if (!targetUserId) return Response.json({ error: 'targetUserId is required' }, { status: 400 });

    if (targetUserId === caller.id) {
      return Response.json({ error: 'Cannot delete your own account' }, { status: 403 });
    }

    // Prevent deleting other super_admins unless you are super_admin
    const target = await base44.asServiceRole.entities.User.get(targetUserId).catch(() => null);
    if (!target) return Response.json({ error: 'User not found' }, { status: 404 });

    if (target.role === 'super_admin' && caller.role !== 'super_admin') {
      return Response.json({ error: 'Cannot delete a super admin' }, { status: 403 });
    }

    await base44.asServiceRole.entities.User.delete(targetUserId);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});