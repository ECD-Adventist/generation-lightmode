import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';
import { logAdminAction, logPermissionDenied } from '../../shared/securityEvents.ts';
import { validatedRegistrationCountry } from '../../shared/registrationCountries.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const rateLimited = await enforceApiRateLimit(base44, req, caller);
    if (rateLimited) return rateLimited;
    if (!['admin', 'super_admin'].includes(caller.role)) {
      await logPermissionDenied(base44, req, caller, 'users', 'auto_assign_country');
      return Response.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const validated = await readValidatedJson(req, {
      dry_run: { type: 'boolean' },
      limit: { type: 'number', integer: true, min: 1, max: 500 },
      skip: { type: 'number', integer: true, min: 0, max: 1000000 },
    }, { allowEmpty: true });
    if (validated.response) return validated.response;

    const dryRun = validated.data.dry_run !== false;
    const limit = validated.data.limit || 100;
    const skip = validated.data.skip || 0;
    const users = await base44.asServiceRole.entities.User.list('-created_date', limit, skip);
    const confirmedAt = new Date().toISOString();
    const updates = [];

    for (const account of users) {
      const existingCountry = validatedRegistrationCountry(account.country);
      const provisionalCountry = validatedRegistrationCountry(account.provisional_country);
      if (existingCountry && account.assignment_status !== 'confirmed') {
        updates.push({
          id: account.id,
          country: existingCountry,
          assignment_status: 'confirmed',
          assignment_source: account.assignment_source || 'legacy_profile',
          assignment_confidence: 'high',
          confirmed_at: account.confirmed_at || confirmedAt,
        });
      } else if (!existingCountry && provisionalCountry && account.assignment_confidence === 'high') {
        updates.push({
          id: account.id,
          country: provisionalCountry,
          provisional_country: '',
          assignment_status: 'confirmed',
          assignment_source: account.assignment_source || 'verified_provisional',
          assignment_confidence: 'high',
          confirmed_at: confirmedAt,
        });
      }
    }

    if (!dryRun && updates.length) {
      await base44.asServiceRole.entities.User.bulkUpdate(updates);
      await logAdminAction(base44, req, caller, 'users', 'auto_assign_country', `Confirmed ${updates.length} strong-evidence assignments`);
    }

    return Response.json({
      success: true,
      dry_run: dryRun,
      scanned: users.length,
      eligible: updates.length,
      assigned: dryRun ? 0 : updates.length,
      candidates: updates.map(({ id, country, assignment_source }) => ({ id, country, assignment_source })),
      next_skip: users.length === limit ? skip + limit : null,
    });
  } catch (error) {
    console.error('autoAssignTerritories failed:', error?.message);
    return Response.json({ error: 'Unable to auto-assign territories' }, { status: 500 });
  }
}