import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';

const ALLOWED_ROLES = new Set([
  'admin',
  'super_admin',
  'moderator',
  'ecd_admin',
  'country_admin',
  'union_admin',
  'conference_field_admin',
  'church_admin',
  // Officers may view moderation data; all mutation endpoints remain admin-only.
  'ecd_officer',
  'union_officer',
  'conference_field_officer',
  'church_officer'
]);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimited = await enforceApiRateLimit(base44, req, user);
    if (rateLimited) return rateLimited;
    const validated = await readValidatedJson(req, {}, { allowEmpty: true });
    if (validated.response) return validated.response;

    if (!ALLOWED_ROLES.has(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Paginate through all drops — entity list() caps each call, so loop until exhausted.
    const PAGE_SIZE = 1000;
    const drops = [];
    let skip = 0;
    while (true) {
      const batch = await base44.asServiceRole.entities.GlowDrop.list('-created_date', PAGE_SIZE, skip);
      if (!batch || batch.length === 0) break;
      drops.push(...batch);
      if (batch.length < PAGE_SIZE) break;
      skip += PAGE_SIZE;
    }

    return Response.json({ drops, total: drops.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});