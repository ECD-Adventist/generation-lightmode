import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } catch (e) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const allUsers = await base44.asServiceRole.entities.User.list();
    // Hide the app owner account from public user lists
    const HIDDEN_EMAILS = ["nottainnovation@gmail.com"];

    const publicUsers = allUsers
      .filter(u => !HIDDEN_EMAILS.includes(u.email))
      .map(u => ({
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
    console.error("Error listing users:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});