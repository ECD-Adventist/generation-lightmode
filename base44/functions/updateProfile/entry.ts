import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';
import { normalizeCountryName } from '../../shared/territoryNames.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const rateLimited = await enforceApiRateLimit(base44, req, user);
    if (rateLimited) return rateLimited;

    const validated = await readValidatedJson(req, {
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
    });
    if (validated.response) return validated.response;
    const body = validated.data;

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
      // Keep the built-in name synchronized so legacy and third-party surfaces
      // that only understand full_name show the user's chosen name immediately.
      customUpdate.full_name = canonicalName;
    }
    if (has('country')) customUpdate.country = normalizeCountryName(clean(body.country));
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

    if (Object.keys(customUpdate).length > 0) await base44.auth.updateMe(customUpdate);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Unable to update profile' }, { status: 500 });
  }
});