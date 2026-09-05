import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';
import { logAdminAction, logPermissionDenied } from '../../shared/securityEvents.ts';
import { waitUntil } from 'base44:runtime';

// Admin-only endpoint that returns the full user list including real roles + status.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();

    if (!caller) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimited = await enforceApiRateLimit(base44, req, caller);
    if (rateLimited) return rateLimited;

    const ADMIN_ROLES = [
      'admin', 'super_admin', 'ecd_admin', 'ecd_officer', 'country_admin',
      'union_admin', 'union_officer', 'conference_field_admin', 'conference_field_officer',
      'church_admin', 'church_officer', 'moderator'
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
      view: { type: 'string', enum: ['directory', 'dashboard'] },
      snapshot_at: { type: 'string', maxLength: 40 },
    }, { allowEmpty: true });
    if (validated.response) return validated.response;
    const payload = validated.data;
    const requestedLimit = Number.parseInt(payload.limit, 10);
    const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(requestedLimit, 10000)) : 10000;
    const skip = Math.max(0, Number.parseInt(payload.skip, 10) || 0);

    // Administrators already have direct User read access: avoid unnecessary
    // service-role reads. Custom admin roles retain the existing authorized path.
    const reader = caller.role === 'admin' ? base44 : base44.asServiceRole;
    const dashboardFields = ['id', 'email', 'full_name', 'display_name', 'username', 'country', 'provisional_country', 'assignment_status', 'location', 'region', 'city', 'address', 'postal_code', 'territory_status', 'created_date', 'profile_picture_url'];
    const directoryFields = [...dashboardFields, 'role', 'status', 'suspended_reason', 'suspended_at', 'assignment_source', 'assignment_confidence', 'confirmed_at', 'gender', 'date_of_birth', 'bio', 'glow_score', 'faith_streak_count', 'pledge_signed', 'pledge_signed_at', 'updated_date', 'territory_name', 'territory_countries', 'territory_level'];
    const fields = payload.view === 'dashboard' ? dashboardFields : payload.view === 'directory' ? directoryFields : undefined;
    const snapshotAt = payload.snapshot_at || new Date().toISOString();
    if (!Number.isFinite(Date.parse(snapshotAt))) return Response.json({ error: 'Invalid snapshot timestamp' }, { status: 400 });
    const allUsers = payload.view === 'directory'
      ? await reader.entities.User.filter({ created_date: { $lte: snapshotAt } }, '-created_date', limit, skip, fields)
      : await reader.entities.User.list('-created_date', limit, skip, fields);
    if (payload.view === 'dashboard') {
      waitUntil(logAdminAction(base44, req, caller, 'users', 'list', `Dashboard read: ${allUsers.length} users`));
      return Response.json(allUsers.map(u => ({ ...u, full_name: u.display_name || u.username || u.full_name || '' })), { headers: { 'Cache-Control': 'no-store', 'X-Data-Source': 'database' } });
    }

    const adminUsers = allUsers.map(u => {
      const canonicalName = u.display_name || u.username || u.full_name || '';
      return {
      id: u.id,
      full_name: canonicalName,
      // Users can change display_name / username after signing up — return both so
      // the Admin Center shows their current chosen name, not just the signup name.
      display_name: u.display_name,
      username: u.username,
      email: u.email,
      role: u.role || 'user',
      status: u.status || 'active',
      suspended_reason: u.suspended_reason,
      suspended_at: u.suspended_at,
      profile_picture_url: u.profile_picture_url,
      country: u.country,
      provisional_country: u.provisional_country,
      assignment_status: u.assignment_status || 'unassigned',
      assignment_source: u.assignment_source,
      assignment_confidence: u.assignment_confidence,
      confirmed_at: u.confirmed_at,
      location: u.location,
      city: u.city,
      address: u.address,
      postal_code: u.postal_code,
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
      };
    });

    waitUntil(logAdminAction(base44, req, caller, 'users', 'list', `Returned ${adminUsers.length} users`));
    const body = payload.view === 'directory' ? {
      items: adminUsers,
      next_offset: allUsers.length === limit ? skip + allUsers.length : null,
      snapshot_at: snapshotAt,
      read_at: new Date().toISOString(),
      source: 'database',
    } : adminUsers;
    return Response.json(body, { headers: { 'Cache-Control': 'no-store', 'X-Data-Source': 'database' } });
  } catch (error) {
    const limited = (error?.status || error?.response?.status) === 429 || /rate limit/i.test(error?.message || '');
    return Response.json({ error: limited ? 'The directory is busy. Please retry shortly.' : error.message }, { status: limited ? 429 : 500, headers: limited ? { 'Retry-After': '30' } : {} });
  }
}