import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';
import { logAdminAction, logPermissionDenied } from '../../shared/securityEvents.ts';

// Admin-only endpoint that returns the full user list including real roles + status.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();

    if (!caller) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimited = await enforceApiRateLimit(base44, req, caller);
    if (rateLimited) return rateLimited;

    const ADMIN_ROLES = [
      'admin', 'super_admin', 'ecd_admin', 'country_admin',
      'union_admin', 'conference_field_admin', 'church_admin', 'moderator'
    ];
    if (!ADMIN_ROLES.includes(caller.role)) {
      await logPermissionDenied(base44, req, caller, 'users', 'list');
      return Response.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    // Admin-only function (403-gated above). Supports optional pagination but
    // defaults to a full load so the admin dashboard's search/stats/heatmaps work.
    const validated = await readValidatedJson(req, {
      limit: { type: 'number', integer: true, min: 1, max: 10000 },
      skip: { type: 'number', integer: true, min: 0, max: 1000000 },
    }, { allowEmpty: true });
    if (validated.response) return validated.response;
    const payload = validated.data;
    const requestedLimit = Number.parseInt(payload.limit, 10);
    const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(requestedLimit, 10000)) : 10000;
    const skip = Math.max(0, Number.parseInt(payload.skip, 10) || 0);

    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', limit, skip);

    const adminUsers = allUsers.map(u => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      role: u.role || 'user',
      status: u.status || 'active',
      suspended_reason: u.suspended_reason,
      suspended_at: u.suspended_at,
      profile_picture_url: u.profile_picture_url,
      country: u.country,
      city: u.city,
      gender: u.gender,
      date_of_birth: u.date_of_birth,
      bio: u.bio,
      glow_score: u.glow_score || 0,
      faith_streak_count: u.faith_streak_count || 0,
      pledge_signed: u.pledge_signed,
      pledge_signed_at: u.pledge_signed_at,
      created_date: u.created_date,
      updated_date: u.updated_date,
      territory_name: u.territory_name,
      territory_countries: u.territory_countries,
      territory_status: u.territory_status,
      territory_level: u.territory_level,
    }));

    await logAdminAction(base44, req, caller, 'users', 'list', `Returned ${adminUsers.length} users`);
    return Response.json(adminUsers);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});