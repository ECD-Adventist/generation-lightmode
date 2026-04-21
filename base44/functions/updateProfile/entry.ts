import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        const cloned = req.clone();
        const body = await cloned.json();

        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only include fields that were actually sent in the request — never overwrite with empty strings
        const has = (key) => Object.prototype.hasOwnProperty.call(body, key);
        const clean = (v) => (typeof v === 'string' ? v.trim() : v);

        // Full name — required, and must use service-role entity update (built-in User field)
        const full_name = has('full_name') ? clean(body.full_name) : null;
        if (full_name !== null && !full_name) {
            return Response.json({ error: 'Full name is required' }, { status: 400 });
        }

        // Validate website_url — must be http(s), not javascript: or data:
        let website_url = null;
        if (has('website_url')) {
            const raw = clean(body.website_url) || '';
            if (!raw) {
                website_url = '';
            } else {
                try {
                    const parsed = new URL(raw.startsWith('http') ? raw : 'https://' + raw);
                    website_url = (parsed.protocol === 'https:' || parsed.protocol === 'http:') ? parsed.href : '';
                } catch { website_url = ''; }
            }
        }

        // Build a single update payload — auth.updateMe handles both built-in (full_name)
        // and custom fields in one atomic call (per Base44 docs, Option 1).
        const update = {};
        if (full_name) update.full_name = full_name;
        if (has('country')) update.country = clean(body.country) || '';
        if (has('bio')) update.bio = (clean(body.bio) || '').slice(0, 1200);
        if (website_url !== null) update.website_url = website_url;
        if (has('profile_picture_url')) update.profile_picture_url = clean(body.profile_picture_url) || '';
        if (has('cover_picture_url')) update.cover_picture_url = clean(body.cover_picture_url) || '';
        if (has('gender')) update.gender = clean(body.gender) || '';
        if (has('date_of_birth')) update.date_of_birth = clean(body.date_of_birth) || '';
        if (has('phone')) update.phone = clean(body.phone) || '';
        if (has('city')) update.city = clean(body.city) || '';
        if (has('address')) update.address = clean(body.address) || '';
        if (has('postal_code')) update.postal_code = clean(body.postal_code) || '';

        if (Object.keys(update).length > 0) {
            await base44.auth.updateMe(update);
        }

        return Response.json({ success: true, data: update });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});