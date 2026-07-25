import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';

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
    const rateLimited = await enforceApiRateLimit(base44, req, user);
    if (rateLimited) return rateLimited;
    if (!ALLOWED_ROLES.has(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const validated = await readValidatedJson(req, {
      sourceFilter: { type: 'string', enum: ['keeping_it_100', 'codes_of_truth'] },
    }, { allowEmpty: true });
    if (validated.response) return validated.response;
    const sourceFilter = validated.data.sourceFilter || null;

    // Read via service role so an admin always sees the full library,
    // independent of user-level RLS timing. Paginate to avoid per-call caps.
    const PAGE_SIZE = 1000;
    const codes = [];
    let skip = 0;
    while (true) {
      const batch = sourceFilter
        ? await base44.asServiceRole.entities.CodeOfTruth.filter({ source_document: sourceFilter }, '-created_date', PAGE_SIZE, skip)
        : await base44.asServiceRole.entities.CodeOfTruth.list('-created_date', PAGE_SIZE, skip);
      if (!batch || batch.length === 0) break;
      codes.push(...batch);
      if (batch.length < PAGE_SIZE) break;
      skip += PAGE_SIZE;
    }

    return Response.json({ codes, total: codes.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});