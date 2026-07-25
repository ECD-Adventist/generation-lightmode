import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';
import { logAdminAction, logPermissionDenied } from '../../shared/securityEvents.ts';

// Admin-initiated user invite + audit log
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const rateLimited = await enforceApiRateLimit(base44, req, caller);
    if (rateLimited) return rateLimited;

    const ADMIN_ROLES = ['admin', 'super_admin'];
    if (!ADMIN_ROLES.includes(caller.role)) {
      await logPermissionDenied(base44, req, caller, 'user_invitation', 'create');
      return Response.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const validated = await readValidatedJson(req, {
      email: { type: 'string', required: true, minLength: 3, maxLength: 254 },
      role: { type: 'string', required: true, maxLength: 50 },
    });
    if (validated.response) return validated.response;
    const { email, role } = validated.data;

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Role hierarchy — only super_admin can invite admins or super_admins
    const ELEVATED = ['admin', 'super_admin'];
    if (ELEVATED.includes(role) && caller.role !== 'super_admin') {
      return Response.json({ error: 'Only super admins can invite admins' }, { status: 403 });
    }

    // base44.users.inviteUser only supports "user" or "admin" roles.
    // For custom roles, invite as "user" first and then update their role server-side.
    const baseInviteRole = role === 'admin' || role === 'super_admin' ? 'admin' : 'user';

    try {
      await base44.asServiceRole.users.inviteUser(normalizedEmail, baseInviteRole);
    } catch (inviteErr) {
      // If already exists, try to look them up and update their role (idempotent behavior)
      const msg = inviteErr?.message || String(inviteErr);
      if (!/exists|already/i.test(msg)) {
        return Response.json({ error: `Invite failed: ${msg}` }, { status: 500 });
      }
    }

    // If role is a custom one (missionary, moderator, etc), find the user and update.
    if (role !== 'user' && role !== 'admin') {
      // Small delay to let the invite record settle
      await new Promise(r => setTimeout(r, 500));
      const [existing] = await base44.asServiceRole.entities.User.filter({ email: normalizedEmail });
      if (existing) {
        await base44.asServiceRole.entities.User.update(existing.id, { role });
      }
    } else if (role === 'super_admin') {
      await new Promise(r => setTimeout(r, 500));
      const [existing] = await base44.asServiceRole.entities.User.filter({ email: normalizedEmail });
      if (existing) {
        await base44.asServiceRole.entities.User.update(existing.id, { role: 'super_admin' });
      }
    }

    await logAdminAction(base44, req, caller, 'user_invitation', 'user_invited', `Role: ${role}`);

    // Audit log
    await base44.asServiceRole.entities.AdminLog.create({
      admin_email: caller.email,
      admin_name: caller.full_name || caller.email,
      action: 'user_invited',
      target: normalizedEmail,
      details: `Invited ${normalizedEmail} as ${role}`,
      category: 'users',
    });

    return Response.json({ success: true, email: normalizedEmail, role });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});