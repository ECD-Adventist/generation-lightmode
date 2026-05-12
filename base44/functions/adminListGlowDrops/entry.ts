import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ALLOWED_ROLES = new Set([
  'admin',
  'super_admin',
  'moderator',
  'ecd_admin',
  'country_admin',
  'union_admin',
  'conference_field_admin',
  'church_admin'
]);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ALLOWED_ROLES.has(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const drops = await base44.asServiceRole.entities.GlowDrop.list('-created_date', 1000);

    return Response.json({ drops, total: drops.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});