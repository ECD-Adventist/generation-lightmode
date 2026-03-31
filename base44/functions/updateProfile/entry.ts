import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const cloned = req.clone();
        const body = await cloned.json();

        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Extract all profile fields
        const {
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
            postal_code
        } = body;

        if (!full_name || !full_name.trim()) {
            return Response.json({ error: 'Full name is required' }, { status: 400 });
        }

        // Prepare update data for all editable fields
        const updateData = {
            full_name: full_name.trim(),
            country: country || '',
            bio: bio || '',
            website_url: website_url || '',
            profile_picture_url: profile_picture_url || '',
            cover_picture_url: cover_picture_url || '',
            gender: gender || '',
            date_of_birth: date_of_birth || '',
            phone: phone || '',
            city: city || '',
            address: address || '',
            postal_code: postal_code || ''
        };

        // Update user with all profile data
        await base44.asServiceRole.entities.User.update(user.id, updateData);

        return Response.json({ success: true, data: updateData });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});