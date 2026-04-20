import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Server-side enforced Glow Drop creation with rate limiting (10 posts per 24h)
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Whitelist only allowed fields
    const { verse, reflection, hashtags, category, media_url: rawMediaUrl } = body;

    // Validate media_url — only allow known CDN domains
    const ALLOWED_CDN_HOSTS = ["media.base44.com", "base44.app", "images.unsplash.com", "res.cloudinary.com"];
    let media_url = null;
    if (rawMediaUrl) {
      try {
        const parsed = new URL(rawMediaUrl);
        if (ALLOWED_CDN_HOSTS.some(host => parsed.hostname === host || parsed.hostname.endsWith("." + host))) {
          media_url = rawMediaUrl;
        }
        // Silently drop disallowed URLs — don't expose error to attacker
      } catch { /* invalid URL — ignore */ }
    }

    // Server-side rate limit: max 30 posts per 24 hours
    const RATE_LIMIT = 30;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentDrops = await base44.entities.GlowDrop.filter({ user_email: user.email });
    const postsInLast24h = recentDrops.filter(d => {
      const created = d.created_date ? new Date(d.created_date.endsWith('Z') ? d.created_date : d.created_date + 'Z') : null;
      return created && created > oneDayAgo;
    });

    if (postsInLast24h.length >= RATE_LIMIT) {
      // Compute when the oldest of the 24h posts will "expire" — that's when the user can post again
      const sorted = postsInLast24h
        .map(d => new Date(d.created_date.endsWith('Z') ? d.created_date : d.created_date + 'Z'))
        .sort((a, b) => a - b);
      const oldest = sorted[0];
      const resetAt = new Date(oldest.getTime() + 24 * 60 * 60 * 1000);
      const msUntilReset = resetAt.getTime() - Date.now();
      const hoursUntilReset = Math.max(1, Math.ceil(msUntilReset / (60 * 60 * 1000)));
      return Response.json({
        error: `You've reached the daily post limit (${RATE_LIMIT} posts per 24h). Please try again in about ${hoursUntilReset} hour${hoursUntilReset === 1 ? '' : 's'}.`,
        rate_limited: true,
        limit: RATE_LIMIT,
        reset_at: resetAt.toISOString(),
        hours_until_reset: hoursUntilReset,
      }, { status: 429 });
    }

    const drop = await base44.entities.GlowDrop.create({
      user_email: user.email,
      verse: (verse || '').slice(0, 500),
      reflection: (reflection || '').slice(0, 2000),
      hashtags: (hashtags || '').slice(0, 200),
      category: category || 'Devotional',
      media_url: media_url || null,
      status: 'approved',
      hidden: false,
    });

    return Response.json({ success: true, drop });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});