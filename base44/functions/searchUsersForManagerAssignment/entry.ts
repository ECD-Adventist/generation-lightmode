import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Search registered users by name or email for manager assignment in
// ManagedLeaderAccount. Returns minimal fields (no PII). Restricted to admins.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (me.role !== 'admin' && me.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { query = '' } = await req.json().catch(() => ({}));
    const q = (query || '').toString().trim().toLowerCase();
    if (!q || q.length < 2) {
      return Response.json({ users: [] });
    }

    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 1000);

    const matches = allUsers
      .filter(u => {
        const email = (u.email || '').toLowerCase();
        const name = (u.full_name || '').toLowerCase();
        return email.includes(q) || name.includes(q);
      })
      .slice(0, 12)
      .map(u => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        profile_picture_url: u.profile_picture_url,
        role: u.role || 'user',
        country: u.country,
      }));

    return Response.json({ users: matches });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});