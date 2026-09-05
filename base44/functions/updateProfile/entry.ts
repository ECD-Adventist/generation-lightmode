import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';
import { validatedRegistrationCountry, REGISTRATION_COUNTRIES } from '../../shared/registrationCountries.ts';
import { resolveUnassignedLocation } from '../../shared/unassignedLocationEvidence.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const validated = await readValidatedJson(req, {
      location_options: { type: 'boolean' },
      confirm_location: { type: 'boolean' },
      display_name: { type: 'string', maxLength: 120 },
      username: { type: 'string', maxLength: 40 },
      website_url: { type: 'string', maxLength: 2048 },
      country: { type: 'string', maxLength: 100 },
      location: { type: 'string', maxLength: 200 },
      bio: { type: 'string', maxLength: 1200 },
      profile_picture: { type: 'string', maxLength: 2048 },
      profile_picture_url: { type: 'string', maxLength: 2048 },
      cover_image: { type: 'string', maxLength: 2048 },
      cover_picture_url: { type: 'string', maxLength: 2048 },
      gender: { type: 'string', maxLength: 50 },
      date_of_birth: { type: 'string', maxLength: 10 },
      phone: { type: 'string', maxLength: 40 },
      city: { type: 'string', maxLength: 120 },
      address: { type: 'string', maxLength: 300 },
      postal_code: { type: 'string', maxLength: 30 },
      social_links: { type: 'string', maxLength: 2000 },
      privacy_consent_given: { type: 'boolean' },
    });
    if (validated.response) return validated.response;
    const body = validated.data;
    if (body.location_options === true) {
      const country = validatedRegistrationCountry(user.country);
      const city = String(user.city || '').trim();
      return Response.json({ complete: Boolean(country && city), country, city, countries: REGISTRATION_COUNTRIES });
    }

    // Profile reads above use only the authenticated user; reserve the rate-limit
    // ledger for mutations so checking location does not write records.
    const rateLimited = await enforceApiRateLimit(base44, req, user);
    if (rateLimited) return rateLimited;

    const has = (key) => Object.prototype.hasOwnProperty.call(body, key);
    const clean = (value) => (typeof value === 'string' ? value.trim() : value);
    const isAtLeast13 = (dateString) => {
      if (!dateString) return false;
      const birthDate = new Date(`${dateString}T00:00:00`);
      if (Number.isNaN(birthDate.getTime())) return false;
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 13);
      return birthDate <= cutoff;
    };

    if (has('city') && !clean(body.city)) {
      return Response.json({ error: 'City / Town is required' }, { status: 400 });
    }
    if (body.confirm_location === true || body.privacy_consent_given === true) {
      const country = validatedRegistrationCountry(has('country') ? body.country : user.country);
      const city = clean(has('city') ? body.city : user.city);
      if (!country || !city) {
        return Response.json({ error: 'Select your country and enter your city / town before finishing setup' }, { status: 400 });
      }
    }

    const display_name = has('display_name') ? clean(body.display_name) : null;
    const username = has('username') ? clean(body.username) : null;
    if (display_name !== null && !display_name && !username) {
      return Response.json({ error: 'Display name or username is required' }, { status: 400 });
    }

    let website_url = null;
    if (has('website_url')) {
      const raw = clean(body.website_url) || '';
      if (!raw) {
        website_url = '';
      } else {
        try {
          const parsed = new URL(raw.startsWith('http') ? raw : 'https://' + raw);
          website_url = (parsed.protocol === 'https:' || parsed.protocol === 'http:') ? parsed.href : '';
        } catch {
          website_url = '';
        }
      }
    }

    const customUpdate = {};
    if (username !== null) customUpdate.username = username.replace(/^@+/, '').slice(0, 40);
    if (display_name !== null) {
      const canonicalName = display_name.slice(0, 120);
      customUpdate.display_name = canonicalName;
    }
    if (has('country')) {
      const country = validatedRegistrationCountry(clean(body.country));
      if (!country) return Response.json({ error: 'Select a supported registration country' }, { status: 400 });
      customUpdate.country = country;
      customUpdate.provisional_country = '';
      customUpdate.assignment_status = 'confirmed';
      customUpdate.assignment_source = user.country ? 'profile_update' : 'registration';
      customUpdate.assignment_confidence = 'high';
      customUpdate.confirmed_at = new Date().toISOString();
    }
    if (has('location')) customUpdate.location = clean(body.location) || '';
    if (has('bio')) customUpdate.bio = (clean(body.bio) || '').slice(0, 1200);
    if (website_url !== null) customUpdate.website_url = website_url;
    if (has('profile_picture') || has('profile_picture_url')) {
      const profilePicture = clean(body.profile_picture || body.profile_picture_url) || '';
      customUpdate.profile_picture = profilePicture;
      customUpdate.profile_picture_url = profilePicture;
    }
    if (has('cover_image') || has('cover_picture_url')) {
      const coverImage = clean(body.cover_image || body.cover_picture_url) || '';
      customUpdate.cover_image = coverImage;
      customUpdate.cover_picture_url = coverImage;
    }
    if (has('gender')) customUpdate.gender = clean(body.gender) || '';
    if (has('date_of_birth')) {
      const dateOfBirth = clean(body.date_of_birth) || '';
      if (dateOfBirth && !isAtLeast13(dateOfBirth)) {
        return Response.json({ error: 'Generation LightMode is intended for users aged 13 and above. For users under 18, parental oversight is encouraged. Please contact lightmode@ecd.adventist.org if a child under 13 has provided personal data.' }, { status: 400 });
      }
      customUpdate.date_of_birth = dateOfBirth;
    }
    if (has('phone')) customUpdate.phone = clean(body.phone) || '';
    if (has('city')) customUpdate.city = clean(body.city) || '';
    if (has('address')) customUpdate.address = clean(body.address) || '';
    if (has('postal_code')) customUpdate.postal_code = clean(body.postal_code) || '';
    if (has('social_links')) customUpdate.social_links = clean(body.social_links) || '';
    if (has('privacy_consent_given')) customUpdate.privacy_consent_given = body.privacy_consent_given;

    if (Object.keys(customUpdate).length > 0) await base44.auth.updateMe(customUpdate);

    if (has('country') || has('city') || has('location') || has('address')) {
      const current = { ...user, ...customUpdate };
      const country = validatedRegistrationCountry(current.country);
      const city = String(current.city || '').trim();
      const [review] = await base44.asServiceRole.entities.UnassignedCountryReview.filter({ user_id: user.id }, '-created_date', 1);
      if (country && city) {
        if (review) await base44.asServiceRole.entities.UnassignedCountryReview.update(review.id, {
          stored_country: country, stored_city: city, missing_country: false, missing_city: false,
          status: 'assigned', notify_pending: false, review_reason: 'Country and city completed by the member.',
          last_scanned_at: new Date().toISOString(),
        });
      } else {
        const evidence = resolveUnassignedLocation(current);
        const record = {
          user_id: user.id, user_email: user.email || '',
          display_name: current.display_name || current.username || current.full_name || '',
          stored_country: String(current.country || ''), stored_city: city,
          missing_country: !country, missing_city: !city,
          registration_evidence: evidence.evidence, evidence_origin: evidence.evidence ? 'saved_profile' : 'none',
          review_reason: evidence.reason, suggested_country: !country ? evidence.suggestion : '',
          suggestion_source: !country ? evidence.source : '', confidence: !country ? evidence.confidence : 'none',
          status: 'pending_review', notify_pending: true,
          user_registered_at: user.created_date, last_scanned_at: new Date().toISOString(),
        };
        if (review) await base44.asServiceRole.entities.UnassignedCountryReview.update(review.id, record);
        else await base44.asServiceRole.entities.UnassignedCountryReview.create(record);
      }
    }

    return Response.json({ success: true, location_review_synced: has('country') || has('city') || has('location') || has('address') });
  } catch (error) {
    const status = error?.status || error?.response?.status;
    console.error('updateProfile failed', { name: error?.name, message: error?.message, status });
    if (status === 429) {
      return Response.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429, headers: { 'Retry-After': '60' } });
    }
    return Response.json({ error: 'Unable to update profile' }, { status: 500 });
  }
}