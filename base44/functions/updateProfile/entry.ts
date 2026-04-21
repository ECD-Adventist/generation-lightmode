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

        // Build custom-fields update (everything except full_name, which is built-in)
        const customUpdate = {};
        if (has('country')) customUpdate.country = clean(body.country) || '';
        if (has('bio')) customUpdate.bio = (clean(body.bio) || '').slice(0, 1200);
        if (website_url !== null) customUpdate.website_url = website_url;
        if (has('profile_picture_url')) customUpdate.profile_picture_url = clean(body.profile_picture_url) || '';
        if (has('cover_picture_url')) customUpdate.cover_picture_url = clean(body.cover_picture_url) || '';
        if (has('gender')) customUpdate.gender = clean(body.gender) || '';
        if (has('date_of_birth')) customUpdate.date_of_birth = clean(body.date_of_birth) || '';
        if (has('phone')) customUpdate.phone = clean(body.phone) || '';
        if (has('city')) customUpdate.city = clean(body.city) || '';
        if (has('address')) customUpdate.address = clean(body.address) || '';
        if (has('postal_code')) customUpdate.postal_code = clean(body.postal_code) || '';

        // Update built-in full_name via service-role entity update (same pattern as updateMyName)
        if (full_name) {
            await base44.asServiceRole.entities.User.update(user.id, { full_name });
        }

        // Update custom fields via updateMe (correct path for non-built-in fields)
        if (Object.keys(customUpdate).length > 0) {
            await base44.auth.updateMe(customUpdate);
        }

        return Response.json({
            success: true,
            data: { ...customUpdate, ...(full_name ? { full_name } : {}) }
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});