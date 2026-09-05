import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { readValidatedJson } from '../../shared/apiSecurity.ts';
import { validatedRegistrationCountry } from '../../shared/registrationCountries.ts';
import { resolveUnassignedLocation } from '../../shared/unassignedLocationEvidence.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const validated = await readValidatedJson(req, {
      user_id: { type: 'string', minLength: 1, maxLength: 64 },
      email: { type: 'string', maxLength: 320 },
      auth_method: { type: 'string', maxLength: 40 },
    });
    if (validated.response) return validated.response;

    const userId = validated.data.user_id;
    const isAdmin = caller.role === 'admin' || caller.role === 'super_admin';
    if (caller.id !== userId && !isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const account = await base44.asServiceRole.entities.User.get(userId);
    if (!account || (validated.data.email && String(account.email || '').toLowerCase() !== validated.data.email.toLowerCase())) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const country = validatedRegistrationCountry(account.country);
    const city = String(account.city || '').trim();
    if (country && city) return Response.json({ remembered: false, complete: true });

    const evidence = resolveUnassignedLocation(account);
    const record = {
      user_id: account.id,
      user_email: account.email || '',
      display_name: account.display_name || account.username || account.full_name || '',
      stored_country: String(account.country || ''),
      stored_city: city,
      missing_country: !country,
      missing_city: !city,
      registration_evidence: evidence.evidence,
      evidence_origin: evidence.evidence ? 'saved_profile' : 'none',
      review_reason: evidence.reason,
      suggested_country: !country ? evidence.suggestion : '',
      suggestion_source: !country ? evidence.source : '',
      confidence: !country ? evidence.confidence : 'none',
      status: 'pending_review',
      notify_pending: true,
      user_registered_at: account.created_date,
      last_scanned_at: new Date().toISOString(),
    };
    const [existing] = await base44.asServiceRole.entities.UnassignedCountryReview.filter({ user_id: account.id }, '-created_date', 1);
    if (existing) await base44.asServiceRole.entities.UnassignedCountryReview.update(existing.id, record);
    else await base44.asServiceRole.entities.UnassignedCountryReview.create(record);

    return Response.json({ remembered: true, complete: false, missing_country: !country, missing_city: !city });
  } catch (error) {
    console.error('trackIncompleteLocationSignup failed:', error?.message);
    return Response.json({ error: 'Unable to record signup location review' }, { status: 500 });
  }
}