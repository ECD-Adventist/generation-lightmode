import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { readValidatedJson } from '../../shared/apiSecurity.ts';
import { validatedRegistrationCountry } from '../../shared/registrationCountries.ts';
import { resolveUnassignedLocation } from '../../shared/unassignedLocationEvidence.ts';

const PAGE = 500;
const USER_PAGE = 2000;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'super_admin'].includes(caller.role)) {
      return Response.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const validated = await readValidatedJson(req, {
      dry_run: { type: 'boolean' },
      apply_country_assignments: { type: 'boolean' },
      max_users: { type: 'number', integer: true, min: PAGE, max: 50000 },
    }, { allowEmpty: true });
    if (validated.response) return validated.response;

    // Default is a read-only preview so a scan can never write by accident.
    const dryRun = validated.data.dry_run !== false;
    const maxUsers = validated.data.max_users || 50000;
    const now = new Date().toISOString();

    const service = base44.asServiceRole.entities;
    const existing = new Map();
    for (let skip = 0; ; skip += PAGE) {
      const rows = await service.UnassignedCountryReview.list('-created_date', PAGE, skip);
      rows.forEach(row => existing.set(row.user_id, row));
      if (rows.length < PAGE) break;
    }

    const toCreate = [];
    const toUpdate = [];
    let scanned = 0;
    let unassigned = 0, missingCityCount = 0, missingBoth = 0, reviewed = 0;
    let eligible = 0, assigned = 0, resolved = 0, withoutEvidence = 0;
    const assignmentsByCountry = {};
    const byConfidence = { high: 0, medium: 0, none: 0 };
    const snapshotAt = now;

    for (let skip = 0; skip < maxUsers; skip += USER_PAGE) {
      const limit = Math.min(USER_PAGE, maxUsers - skip);
      const batch = await service.User.filter({ created_date: { $lte: snapshotAt } }, '-created_date', limit, skip);
      scanned += batch.length;
      for (const account of batch) {
        const prior = existing.get(account.id);
        const missingCountry = !validatedRegistrationCountry(account.country);
        const missingCity = !String(account.city || '').trim();
        if (!missingCountry && !missingCity) {
          if (prior && (prior.missing_country || prior.missing_city || prior.status === 'pending_review')) {
            toUpdate.push({ id: prior.id, stored_country: account.country, stored_city: account.city,
              missing_country: false, missing_city: false, status: 'assigned',
              notify_pending: prior.assigned_at ? prior.notify_pending : false,
              review_reason: 'Country and city are now complete.', last_scanned_at: now });
            resolved++;
          }
          continue;
        }
        reviewed++;
        if (missingCountry) unassigned++;
        if (missingCity) missingCityCount++;
        if (missingCountry && missingCity) missingBoth++;
        const match = resolveUnassignedLocation(account);
        if (!match.evidence) withoutEvidence++;
        const suggestion = missingCountry ? match.suggestion : '';
        const confidence = suggestion ? match.confidence : 'none';
        byConfidence[confidence]++;
        const payload = {
          user_id: account.id, user_email: account.email || '',
          display_name: account.display_name || account.username || account.full_name || '',
          stored_country: match.stored, stored_city: match.city,
          missing_country: missingCountry, missing_city: missingCity,
          registration_evidence: match.evidence, evidence_origin: match.evidence ? 'saved_profile' : 'none',
          review_reason: missingCountry ? match.reason : 'Country is known; city is missing and requires member confirmation.',
          suggested_country: suggestion, suggestion_source: suggestion ? match.source : '', confidence,
          user_registered_at: account.created_date, last_scanned_at: now,
        };
        if (suggestion && prior?.status !== 'dismissed') {
          eligible++;
          assignmentsByCountry[suggestion] = (assignmentsByCountry[suggestion] || 0) + 1;
          if (!dryRun && validated.data.apply_country_assignments === true) {
            const current = await service.User.get(account.id);
            const fresh = resolveUnassignedLocation(current);
            if (!validatedRegistrationCountry(current.country) && fresh.suggestion === suggestion) {
              await service.User.update(account.id, {
                country: suggestion, provisional_country: '', assignment_status: 'confirmed',
                assignment_source: 'admin_assignment', assignment_confidence: 'high', confirmed_at: now,
              });
              Object.assign(payload, { assigned_country: suggestion, previous_country: match.stored,
                assigned_at: now, stored_country: suggestion, missing_country: false,
                status: 'assigned', notify_pending: true,
                review_reason: 'Country allocated from saved location evidence by administrator request; notify member to review.' });
              assigned++;
            }
          }
        }
        if (!prior) toCreate.push({ status: 'pending_review', notify_pending: true, ...payload });
        else toUpdate.push({ id: prior.id, ...payload });
      }
      if (batch.length < limit) break;
    }

    if (!dryRun) {
      for (let i = 0; i < toCreate.length; i += 200) {
        await service.UnassignedCountryReview.bulkCreate(toCreate.slice(i, i + 200));
      }
      for (let i = 0; i < toUpdate.length; i += 200) {
        await service.UnassignedCountryReview.bulkUpdate(toUpdate.slice(i, i + 200));
      }
    }

    return Response.json({
      dry_run: dryRun,
      scanned_users: scanned,
      without_valid_country: unassigned,
      remembered_new: toCreate.length,
      remembered_updated: toUpdate.length,
      without_city: missingCityCount,
      missing_both: missingBoth,
      incomplete_users: reviewed,
      without_location_evidence: withoutEvidence,
      eligible_country_assignments: eligible,
      assignments_by_country: assignmentsByCountry,
      countries_assigned: assigned,
      completed_reviews: resolved,
      by_confidence: byConfidence,
      notifications_sent: 0,
      reached_scan_limit: scanned === maxUsers,
      note: dryRun ? 'Read-only preview; remembered counts are proposed writes, not saved records.' : 'Review records saved for missing countries OR cities. Assignment requires explicit opt-in and exact saved location evidence. No name, phone or IP inference; physical signup origin is unknown. No notifications sent.',
    });
  } catch (error) {
    const status = error?.status || error?.response?.status;
    console.error('recordUnassignedCountryReviews failed:', error?.message, status);
    if (status === 429 || /rate limit|too many requests/i.test(error?.message || '')) {
      return Response.json({ error: 'Read limit reached. Wait a minute before running another scan.' }, { status: 429, headers: { 'Retry-After': '60' } });
    }
    return Response.json({ error: 'Unable to record unassigned country reviews' }, { status: 500 });
  }
}