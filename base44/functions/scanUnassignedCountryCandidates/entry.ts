import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { readValidatedJson } from '../../shared/apiSecurity.ts';
import { validatedRegistrationCountry } from '../../shared/registrationCountries.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'super_admin'].includes(caller.role)) {
      return Response.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const validated = await readValidatedJson(req, {
      limit: { type: 'number', integer: true, min: 1, max: 100 },
      skip: { type: 'number', integer: true, min: 0, max: 1000000 },
    }, { allowEmpty: true });
    if (validated.response) return validated.response;

    const limit = validated.data.limit || 50;
    const skip = validated.data.skip || 0;
    const batch = await base44.asServiceRole.entities.User.list('-created_date', limit, skip);
    const candidates = batch
      .filter((account) => !validatedRegistrationCountry(account.country))
      .map((account) => {
        const provisionalCountry = validatedRegistrationCountry(account.provisional_country);
        const strongProvisional = provisionalCountry && account.assignment_confidence === 'high';
        return {
          id: account.id,
          display_name: account.display_name || account.username || account.full_name || '',
          country: account.country || '',
          provisional_country: provisionalCountry,
          assignment_status: account.assignment_status || 'unassigned',
          assignment_source: account.assignment_source || '',
          assignment_confidence: account.assignment_confidence || '',
          suggested_country: strongProvisional ? provisionalCountry : '',
          review_reason: strongProvisional ? 'High-confidence provisional country requires admin confirmation' : 'No strong country evidence available',
          created_date: account.created_date,
        };
      });

    return Response.json({
      candidates,
      scanned: batch.length,
      next_skip: batch.length === limit ? skip + limit : null,
      read_only: true,
    });
  } catch (error) {
    console.error('scanUnassignedCountryCandidates failed:', error?.message);
    return Response.json({ error: 'Unable to scan unassigned users' }, { status: 500 });
  }
}