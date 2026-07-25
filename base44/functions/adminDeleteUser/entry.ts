import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';
import { logAdminAction, logPermissionDenied } from '../../shared/securityEvents.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();

    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const rateLimited = await enforceApiRateLimit(base44, req, caller);
    if (rateLimited) return rateLimited;

    const ADMIN_ROLES = ['admin', 'super_admin'];
    if (!ADMIN_ROLES.includes(caller.role)) {
      await logPermissionDenied(base44, req, caller, 'user_account', 'delete');
      return Response.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const validated = await readValidatedJson(req, {
      targetUserId: { type: 'string', required: true, format: 'uuid' },
    });
    if (validated.response) return validated.response;
    const { targetUserId } = validated.data;

    if (targetUserId === caller.id) {
      return Response.json({ error: 'Cannot delete your own account' }, { status: 403 });
    }

    const target = await base44.asServiceRole.entities.User.get(targetUserId).catch(() => null);
    if (!target) return Response.json({ error: 'User not found' }, { status: 404 });

    if (target.role === 'super_admin' && caller.role !== 'super_admin') {
      return Response.json({ error: 'Cannot delete a super admin' }, { status: 403 });
    }

    await base44.asServiceRole.entities.User.delete(targetUserId);
    await logAdminAction(base44, req, caller, `user:${targetUserId}`, 'user_deleted');

    // Audit log
    await base44.asServiceRole.entities.AdminLog.create({
      admin_email: caller.email,
      admin_name: caller.full_name || caller.email,
      action: 'user_deleted',
      target: target.email,
      details: `Deleted user ${target.full_name || target.email} (role: ${target.role || 'user'})`,
      category: 'users',
    }).catch(e => console.error('Audit log failed:', e.message));

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});