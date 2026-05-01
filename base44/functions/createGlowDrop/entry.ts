import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Server-side enforced Glow Drop creation with rate limiting (30 posts per 24h)
// Supports posting on behalf of a Managed Leader Account when the caller is
// listed as a manager on that account.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Whitelist only allowed fields
    const { verse, reflection, hashtags, category, media_url: rawMediaUrl, post_as_leader_id } = body;

    // Validate media_url — only allow known CDN domains
    const ALLOWED_CDN_HOSTS = ["media.base44.com", "base44.app", "images.unsplash.com", "res.cloudinary.com"];
    let media_url = null;
    if (rawMediaUrl) {
      try {
        const parsed = new URL(rawMediaUrl);
        if (ALLOWED_CDN_HOSTS.some(host => parsed.hostname === host || parsed.hostname.endsWith("." + host))) {
          media_url = rawMediaUrl;
        }
      } catch { /* invalid URL — ignore */ }
    }

    // Resolve "post as" leader (if requested)
    let postAsLeader = null;
    if (post_as_leader_id) {
      const accounts = await base44.asServiceRole.entities.ManagedLeaderAccount.filter({ id: post_as_leader_id });
      const account = accounts[0];
      if (!account) {
        return Response.json({ error: 'Leader account not found' }, { status: 404 });
      }
      const isManager = Array.isArray(account.manager_emails) && account.manager_emails.includes(user.email);
      const isAdmin = ['admin', 'super_admin'].includes(user.role);
      if (!isManager && !isAdmin) {
        return Response.json({ error: 'You are not authorized to post on behalf of this leader' }, { status: 403 });
      }
      if (account.active === false) {
        return Response.json({ error: 'This leader account is inactive' }, { status: 400 });
      }
      postAsLeader = account;
    }

    // Effective owner of the drop (leader if posting-as, otherwise self)
    const effectiveEmail = postAsLeader ? postAsLeader.leader_email : user.email;

    // Server-side rate limit: max 30 posts per 24 hours per effective owner
    const RATE_LIMIT = 30;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentDrops = await base44.asServiceRole.entities.GlowDrop.filter({ user_email: effectiveEmail });
    const postsInLast24h = recentDrops.filter(d => {
      const created = d.created_date ? new Date(d.created_date.endsWith('Z') ? d.created_date : d.created_date + 'Z') : null;
      return created && created > oneDayAgo;
    });

    if (postsInLast24h.length >= RATE_LIMIT) {
      const sorted = postsInLast24h
        .map(d => new Date(d.created_date.endsWith('Z') ? d.created_date : d.created_date + 'Z'))
        .sort((a, b) => a - b);
      const oldest = sorted[0];
      const resetAt = new Date(oldest.getTime() + 24 * 60 * 60 * 1000);
      const msUntilReset = resetAt.getTime() - Date.now();
      const hoursUntilReset = Math.max(1, Math.ceil(msUntilReset / (60 * 60 * 1000)));
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
    };

    // Create as service role when posting on behalf of a leader (so RLS passes)
    const drop = postAsLeader
      ? await base44.asServiceRole.entities.GlowDrop.create(dropPayload)
      : await base44.entities.GlowDrop.create(dropPayload);

    // Audit trail: log who actually posted on behalf of the leader
    if (postAsLeader) {
      try {
        await base44.asServiceRole.entities.AdminLog.create({
          admin_email: user.email,
          admin_name: user.full_name || user.email,
          action: 'post_as_leader',
          target: drop.id,
          details: `Posted Glow Drop on behalf of ${postAsLeader.leader_name} (${postAsLeader.leader_email})`,
          category: 'content',
        });
      } catch (e) {
        // Non-fatal — audit log creation should not block the post
        console.warn('Audit log failed:', e?.message);
      }
    }

    return Response.json({ success: true, drop, posted_as_leader: !!postAsLeader });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});