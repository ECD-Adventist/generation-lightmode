import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { readValidatedJson } from '../../shared/apiSecurity.ts';
import { validatedRegistrationCountry } from '../../shared/registrationCountries.ts';
import { resolveReportingCountry } from '../../shared/countryResolution.ts';

const PAGE = 500;
const USER_PAGE = 2000;

// Registration evidence, strongest first. Names, email domains, languages and IPs are
// deliberately excluded — they are not proof of where a member lives.
const EVIDENCE_FIELDS = ['city', 'location', 'region', 'address', 'postal_code', 'phone', 'phone_number'];

function resolveEvidence(account) {
  const notes = [];
  let suggestion = '';
  let source = '';
  for (const field of EVIDENCE_FIELDS) {
    const value = String(account[field] || '').trim();
    if (!value) continue;
    notes.push(`${field}: ${value}`);
    const resolved = resolveReportingCountry(value);
    if (resolved && !suggestion) { suggestion = resolved; source = field; }
  }
  const stored = String(account.country || '').trim();
  if (stored) notes.push(`stored country: ${stored}`);
  const provisional = validatedRegistrationCountry(account.provisional_country);
  if (provisional) notes.push(`provisional: ${provisional}`);
  if (!suggestion && provisional && account.assignment_confidence === 'high') {
    suggestion = provisional;
    source = 'provisional_country';
  }
  const confidence = !suggestion ? 'none' : ['city', 'location', 'address'].includes(source) ? 'high' : 'medium';
  return { suggestion, source, confidence, evidence: notes.join(' | ').slice(0, 1000), stored };
}

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
    let unassigned = 0;
    const byConfidence = { high: 0, medium: 0, none: 0 };

    for (let skip = 0; skip < maxUsers; skip += USER_PAGE) {
      const batch = await service.User.list('-created_date', USER_PAGE, skip);
      scanned += batch.length;
      for (const account of batch) {
        if (validatedRegistrationCountry(account.country)) continue;
        unassigned += 1;
        const { suggestion, source, confidence, evidence, stored } = resolveEvidence(account);
        byConfidence[confidence] += 1;
        const payload = {
          user_id: account.id,
          user_email: account.email || '',
          display_name: account.display_name || account.username || account.full_name || '',
          stored_country: stored,
          registration_evidence: evidence,
          suggested_country: suggestion,
          suggestion_source: source,
          confidence,
          user_registered_at: account.created_date,
          last_scanned_at: now,
        };
        const prior = existing.get(account.id);
        if (!prior) toCreate.push({ ...payload, status: 'pending_review', notify_pending: true });
        else toUpdate.push({ id: prior.id, ...payload });
      }
      if (batch.length < USER_PAGE) break;
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
      by_confidence: byConfidence,
      note: 'Country suggestions come only from registration location text (city, location, region, address, postal code, phone). Names, email domains and IP addresses are never used. Nothing is written to user accounts here — an admin still confirms each assignment, and every remembered row stays flagged for the reminder notification campaign.',
    });
  } catch (error) {
    console.error('recordUnassignedCountryReviews failed:', error?.message);
    return Response.json({ error: 'Unable to record unassigned country reviews' }, { status: 500 });
  }
}