import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

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
    if (display_name !== null && !display_name) {
      return Response.json({ error: 'Display name is required' }, { status: 400 });
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
    if (display_name !== null) customUpdate.display_name = display_name.slice(0, 120);
    if (has('country')) customUpdate.country = clean(body.country) || '';
    if (has('bio')) customUpdate.bio = (clean(body.bio) || '').slice(0, 1200);
    if (website_url !== null) customUpdate.website_url = website_url;
    if (has('profile_picture_url')) customUpdate.profile_picture_url = clean(body.profile_picture_url) || '';
    if (has('cover_picture_url')) customUpdate.cover_picture_url = clean(body.cover_picture_url) || '';
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