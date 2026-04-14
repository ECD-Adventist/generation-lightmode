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

        // Explicitly whitelist ONLY allowed fields — never spread raw body
        const full_name = (body.full_name || '').trim();
        const country = (body.country || '').trim();
        const bio = (body.bio || '').slice(0, 150).trim();
        // Validate website_url — must be a real http(s) URL, not javascript: or data: etc.
        const rawWebsiteUrl = (body.website_url || '').trim();
        let website_url = '';
        if (rawWebsiteUrl) {
          try {
            const parsed = new URL(rawWebsiteUrl.startsWith('http') ? rawWebsiteUrl : 'https://' + rawWebsiteUrl);
            if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
              website_url = parsed.href;
            }
          } catch { /* invalid URL — clear it */ }
        }
        const profile_picture_url = (body.profile_picture_url || '').trim();
        const cover_picture_url = (body.cover_picture_url || '').trim();
        const gender = (body.gender || '').trim();
        const date_of_birth = (body.date_of_birth || '').trim();
        const phone = (body.phone || '').trim();
        const city = (body.city || '').trim();
        const address = (body.address || '').trim();
        const postal_code = (body.postal_code || '').trim();

        if (!full_name) {
            return Response.json({ error: 'Full name is required' }, { status: 400 });
        }

        const updateData = {
            full_name,
            country,
            bio,
            website_url,
            profile_picture_url,
            cover_picture_url,
            gender,
            date_of_birth,
            phone,
            city,
            address,
            postal_code,
        };

        // Use updateMe — correctly updates built-in fields (full_name) and custom fields
        await base44.auth.updateMe(updateData);

        return Response.json({ success: true, data: updateData });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});