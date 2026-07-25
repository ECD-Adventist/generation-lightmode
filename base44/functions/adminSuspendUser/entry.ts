import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';
import { logAdminAction, logPermissionDenied } from '../../shared/securityEvents.ts';

// Suspend or reactivate a user + write audit log
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const rateLimited = await enforceApiRateLimit(base44, req, caller);
    if (rateLimited) return rateLimited;

    const ADMIN_ROLES = ['admin', 'super_admin'];
    if (!ADMIN_ROLES.includes(caller.role)) {
      await logPermissionDenied(base44, req, caller, 'user_status', 'update');
      return Response.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const validated = await readValidatedJson(req, {
      targetUserId: { type: 'string', required: true, format: 'uuid' },
      action: { type: 'string', required: true, enum: ['suspend', 'activate'] },
      reason: { type: 'string', maxLength: 500 },
    });
    if (validated.response) return validated.response;
    const { targetUserId, action, reason } = validated.data;
    if (targetUserId === caller.id) {
      return Response.json({ error: 'Cannot change your own status' }, { status: 403 });
    }

    const target = await base44.asServiceRole.entities.User.get(targetUserId).catch(() => null);
    if (!target) return Response.json({ error: 'User not found' }, { status: 404 });

    // Don't allow suspending super admins unless caller is super_admin
    if (target.role === 'super_admin' && caller.role !== 'super_admin') {
      return Response.json({ error: 'Cannot suspend a super admin' }, { status: 403 });
    }

    const updates = action === 'suspend'
      ? {
          status: 'suspended',
          suspended_reason: reason || 'No reason provided',
          suspended_at: new Date().toISOString(),
          suspended_by: caller.email,
        }
      : {
          status: 'active',
          suspended_reason: '',
          suspended_at: '',
          suspended_by: '',
        };

    await base44.asServiceRole.entities.User.update(targetUserId, updates);
    await logAdminAction(base44, req, caller, `user:${targetUserId}`, action === 'suspend' ? 'user_suspended' : 'user_activated');

    // Audit log
    await base44.asServiceRole.entities.AdminLog.create({
      admin_email: caller.email,
      admin_name: caller.full_name || caller.email,
      action: action === 'suspend' ? 'user_suspended' : 'user_activated',
      target: target.email,
      details: action === 'suspend'
        ? `Suspended ${target.full_name || target.email}. Reason: ${reason || 'N/A'}`
        : `Reactivated ${target.full_name || target.email}`,
      category: 'users',
    });

    return Response.json({ success: true, status: updates.status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});