import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list();

    const publicUsers = allUsers.map(u => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      profile_picture_url: u.profile_picture_url,
      country: u.country,
      glow_score: u.glow_score || 0,
      role: u.role,
      created_date: u.created_date
    }));

    return Response.json(publicUsers);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});