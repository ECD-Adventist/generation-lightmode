import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

const PIN_ALLOWED_ROLES = new Set(['ecd_admin', 'super_admin']);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!PIN_ALLOWED_ROLES.has(user.role)) {
      return Response.json({ error: 'Only ECD Admins and super admins can pin feed posts.' }, { status: 403 });
    }

    const body = await req.json();
    const dropId = body.drop_id;
    const pinned = body.pinned === true;
    if (!dropId) return Response.json({ error: 'Missing drop_id' }, { status: 400 });

    await base44.asServiceRole.entities.GlowDrop.update(dropId, { pinned });

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