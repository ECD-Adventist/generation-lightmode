import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { verse, reflection, hashtags, category, media_url: rawMediaUrl, post_as_leader_id } = body;

    const ALLOWED_CDN_HOSTS = ['media.base44.com', 'base44.app', 'images.unsplash.com', 'res.cloudinary.com'];
    let media_url = null;
    if (rawMediaUrl) {
      try {
        const parsed = new URL(rawMediaUrl);
        if (ALLOWED_CDN_HOSTS.some((host) => parsed.hostname === host || parsed.hostname.endsWith('.' + host))) {
          media_url = rawMediaUrl;
        }
      } catch {
        media_url = null;
      }
    }

    let postAsLeader = null;
    if (post_as_leader_id) {
      const accounts = await base44.asServiceRole.entities.ManagedLeaderAccount.filter({ id: post_as_leader_id });
      const account = accounts[0];
      if (!account) return Response.json({ error: 'Leader account not found' }, { status: 404 });

      const isManager = Array.isArray(account.manager_emails) && account.manager_emails.includes(user.email);
      const isAdmin = ['admin', 'super_admin'].includes(user.role);
      if (!isManager && !isAdmin) {
        return Response.json({ error: 'You are not authorized to post on behalf of this leader' }, { status: 403 });
      }
      if (account.active === false) return Response.json({ error: 'This leader account is inactive' }, { status: 400 });
      postAsLeader = account;
    }

    const effectiveEmail = postAsLeader ? postAsLeader.leader_email : user.email;
    const RATE_LIMIT = 30;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentDrops = await base44.asServiceRole.entities.GlowDrop.filter({ user_email: effectiveEmail });
    const postsInLast24h = recentDrops.filter((drop) => {
      const created = drop.created_date ? new Date(drop.created_date.endsWith('Z') ? drop.created_date : drop.created_date + 'Z') : null;
      return created && created > oneDayAgo;
    });

    if (postsInLast24h.length >= RATE_LIMIT) {
      const sorted = postsInLast24h
        .map((drop) => new Date(drop.created_date.endsWith('Z') ? drop.created_date : drop.created_date + 'Z'))
        .sort((a, b) => a - b);
      const resetAt = new Date(sorted[0].getTime() + 24 * 60 * 60 * 1000);
      const hoursUntilReset = Math.max(1, Math.ceil((resetAt.getTime() - Date.now()) / (60 * 60 * 1000)));
      return Response.json({
        error: `Daily post limit reached (${RATE_LIMIT} posts per 24h). Try again in about ${hoursUntilReset} hour${hoursUntilReset === 1 ? '' : 's'}.`,
        rate_limited: true,
        limit: RATE_LIMIT,
        reset_at: resetAt.toISOString(),
        hours_until_reset: hoursUntilReset,
      }, { status: 429 });
    }

    const dropPayload = {
      user_email: effectiveEmail,
      verse: (verse || '').slice(0, 500),
      reflection: (reflection || '').slice(0, 2000),
      hashtags: (hashtags || '').slice(0, 200),
      category: category || 'Devotional',
      media_url: media_url || null,
      status: 'approved',
      hidden: false,
      likes_count: 0,
      bonus_likes_count: 0,
      bonus_likes_enabled: true,
    };

    const drop = postAsLeader
      ? await base44.asServiceRole.entities.GlowDrop.create(dropPayload)
      : await base44.entities.GlowDrop.create(dropPayload);

    if (postAsLeader) {
      try {
        await base44.asServiceRole.entities.AdminLog.create({
          admin_email: user.email,
          admin_name: user.full_name || user.email,
          action: 'post_as_leader',
          target: drop.id,
          details: `Posted Glow Drop on behalf of ${postAsLeader.leader_name}`,
          category: 'content',
        });
      } catch (error) {
        console.warn('Audit log failed:', error?.message);
      }
    }

    return Response.json({ success: true, drop_id: drop.id, posted_as_leader: !!postAsLeader });
  } catch (error) {
    return Response.json({ error: 'Unable to create drop' }, { status: 500 });
  }
});