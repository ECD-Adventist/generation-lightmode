import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';
import { logAdminAction, logPermissionDenied } from '../../shared/securityEvents.ts';

const PIN_ALLOWED_ROLES = new Set(['ecd_admin', 'super_admin']);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const rateLimited = await enforceApiRateLimit(base44, req, user);
    if (rateLimited) return rateLimited;
    if (!PIN_ALLOWED_ROLES.has(user.role)) {
      await logPermissionDenied(base44, req, user, 'glow_drop_pin', 'update');
      return Response.json({ error: 'Only ECD Admins and super admins can pin feed posts.' }, { status: 403 });
    }

    const validated = await readValidatedJson(req, {
      drop_id: { type: 'string', required: true, format: 'uuid' },
      pinned: { type: 'boolean', required: true },
    });
    if (validated.response) return validated.response;
    const dropId = validated.data.drop_id;
    const pinned = validated.data.pinned;

    await base44.asServiceRole.entities.GlowDrop.update(dropId, { pinned });
    await logAdminAction(base44, req, user, `glow_drop:${dropId}`, pinned ? 'pin' : 'unpin');

    await base44.asServiceRole.entities.AdminLog.create({
      admin_email: user.email,
      admin_name: user.full_name || user.email,
      action: pinned ? 'pin_feed_post' : 'unpin_feed_post',
      target: dropId,
      details: `${pinned ? 'Pinned' : 'Unpinned'} Glow Drop in feed`,
      category: 'content',
    });

    return Response.json({ success: true, drop_id: dropId, pinned });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});