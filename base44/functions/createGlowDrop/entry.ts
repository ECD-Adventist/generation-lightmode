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
    const { verse, reflection, hashtags, category, media_url } = body;

    // Server-side rate limit: max 10 posts per 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentDrops = await base44.entities.GlowDrop.filter({ user_email: user.email });
    const postsInLast24h = recentDrops.filter(d => {
      const created = d.created_date ? new Date(d.created_date.endsWith('Z') ? d.created_date : d.created_date + 'Z') : null;
      return created && created > new Date(oneDayAgo);
    });

    if (postsInLast24h.length >= 10) {
      return Response.json({ error: 'Rate limit: maximum 10 posts per 24 hours reached.' }, { status: 429 });
    }

    const drop = await base44.entities.GlowDrop.create({
      user_email: user.email,
      verse: (verse || '').slice(0, 500),
      reflection: (reflection || '').slice(0, 2000),
      hashtags: (hashtags || '').slice(0, 200),
      category: category || 'Devotional',
      media_url: media_url || null,
    });

    return Response.json({ success: true, drop });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});