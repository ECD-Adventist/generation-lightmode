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
      await logPermissionDenied(base44, req, caller, 'users', 'assign_country');
      return Response.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const validated = await readValidatedJson(req, {
      user_id: { type: 'string', required: true, format: 'uuid' },
      country: { type: 'string', required: true, maxLength: 100 },
      reason: { type: 'string', maxLength: 300 },
    });
    if (validated.response) return validated.response;

    const country = validatedRegistrationCountry(validated.data.country);
    if (!country) return Response.json({ error: 'Select a supported registration country' }, { status: 400 });

    const account = await base44.asServiceRole.entities.User.get(validated.data.user_id);
    if (!account) return Response.json({ error: 'User not found' }, { status: 404 });

    const confirmedAt = new Date().toISOString();
    await base44.asServiceRole.entities.User.update(account.id, {
      country,
      provisional_country: '',
      assignment_status: 'confirmed',
      assignment_source: 'admin_assignment',
      assignment_confidence: 'high',
      confirmed_at: confirmedAt,
    });
    await logAdminAction(base44, req, caller, 'users', 'assign_country', `Assigned ${account.id} to ${country}. ${validated.data.reason || ''}`);

    return Response.json({ success: true, user_id: account.id, country, confirmed_at: confirmedAt });
  } catch (error) {
    console.error('adminAssignUserCountry failed:', error?.message);
    return Response.json({ error: 'Unable to assign user country' }, { status: 500 });
  }
}