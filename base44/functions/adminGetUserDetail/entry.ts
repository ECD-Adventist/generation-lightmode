import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';
import { logAdminAction, logPermissionDenied } from '../../shared/securityEvents.ts';

// Returns a rich profile bundle for the admin detail drawer:
//   user, activity counts, recent drops, audit log, orphan warnings
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();
    if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const rateLimited = await enforceApiRateLimit(base44, req, caller);
    if (rateLimited) return rateLimited;

    const ADMIN_ROLES = [
      'admin', 'super_admin', 'ecd_admin', 'country_admin',
      'union_admin', 'conference_field_admin', 'church_admin', 'moderator'
    ];
    if (!ADMIN_ROLES.includes(caller.role)) {
      await logPermissionDenied(base44, req, caller, 'user_detail', 'read');
      return Response.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const validated = await readValidatedJson(req, {
      targetUserId: { type: 'string', required: true, format: 'uuid' },
    });
    if (validated.response) return validated.response;
    const { targetUserId } = validated.data;

    const user = await base44.asServiceRole.entities.User.get(targetUserId).catch(() => null);
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    // Parallel fetch of all activity data
    const [
      drops,
      ownedGroups,
      groupMemberships,
      prayerRequests,
      challengeSubs,
      auditLog,
    ] = await Promise.all([
      base44.asServiceRole.entities.GlowDrop.filter({ user_email: user.email }).catch(() => []),
      base44.asServiceRole.entities.GlowGroup.filter({ leader_email: user.email }).catch(() => []),
      base44.asServiceRole.entities.GlowGroupMember.filter({ user_email: user.email }).catch(() => []),
      base44.asServiceRole.entities.PrayerRequest.filter({ user_email: user.email }).catch(() => []),
      base44.asServiceRole.entities.ChallengeSubmission.filter({ user_email: user.email }).catch(() => []),
      base44.asServiceRole.entities.AdminLog.filter({ target: user.email }, '-created_date', 50).catch(() => []),
    ]);

    const totalLikes = drops.reduce((sum, d) => sum + (d.likes_count || 0), 0);
    const approvedDrops = drops.filter(d => d.status === 'approved').length;
    const pendingDrops = drops.filter(d => d.status === 'pending').length;

    // Orphan warnings — what breaks if we delete this user
    const orphans = {
      owned_groups: ownedGroups.length,
      owned_groups_list: ownedGroups.slice(0, 5).map(g => ({ id: g.id, name: g.name })),
      group_memberships: groupMemberships.length,
      pending_prayers: prayerRequests.filter(p => !p.answered).length,
      total_drops: drops.length,
    };

    // Recent drops preview (last 10)
    const recentDrops = [...drops]
      .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))
      .slice(0, 10)
      .map(d => ({
        id: d.id,
        verse: d.verse,
        reflection: d.reflection?.slice(0, 200),
        status: d.status,
        likes_count: d.likes_count || 0,
        category: d.category,
        created_date: d.created_date,
      }));

    await logAdminAction(base44, req, caller, `user:${targetUserId}`, 'detail_read');
    return Response.json({
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role || 'user',
        status: user.status || 'active',
        suspended_reason: user.suspended_reason,
        suspended_at: user.suspended_at,
        suspended_by: user.suspended_by,
        profile_picture_url: user.profile_picture_url,
        cover_picture_url: user.cover_picture_url,
        country: user.country,
        city: user.city,
        address: user.address,
        postal_code: user.postal_code,
        phone: user.phone,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        bio: user.bio,
        website_url: user.website_url,
        glow_score: user.glow_score || 0,
        faith_streak_count: user.faith_streak_count || 0,
        longest_faith_streak: user.longest_faith_streak || 0,
        daily_checkin_streak: user.daily_checkin_streak || 0,
        last_checkin_date: user.last_checkin_date,
        posting_streak_count: user.posting_streak_count || 0,
        pledge_signed: user.pledge_signed,
        pledge_signed_at: user.pledge_signed_at,
        privacy_consent_given: user.privacy_consent_given,
        territory_name: user.territory_name,
        territory_status: user.territory_status,
        territory_level: user.territory_level,
        territory_countries: user.territory_countries,
        created_date: user.created_date,
        updated_date: user.updated_date,
      },
      stats: {
        total_drops: drops.length,
        approved_drops: approvedDrops,
        pending_drops: pendingDrops,
        total_likes_received: totalLikes,
        owned_groups: ownedGroups.length,
        group_memberships: groupMemberships.length,
        prayer_requests: prayerRequests.length,
        challenge_submissions: challengeSubs.length,
      },
      recentDrops,
      auditLog: auditLog.map(a => ({
        id: a.id,
        admin_email: a.admin_email,
        admin_name: a.admin_name,
        action: a.action,
        details: a.details,
        category: a.category,
        created_date: a.created_date,
      })),
      orphans,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});