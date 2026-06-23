import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

const SUPABASE_URL = "https://asnsthgubpeptoiexajf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzbnN0aGd1YnBlcHRvaWV4YWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MzM5NDgsImV4cCI6MjA2MzQwOTk0OH0.r3WDFbJQgPuVnakMUJQa_cEWBUBbnT3hbDbT5GiZoNA";

function mirrorGlowDropToSupabase(newDrop, createdBy) {
  if (!newDrop?.id) return;
  fetch(`${SUPABASE_URL}/rest/v1/glow_drops`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify([{
      id: newDrop.id,
      reflection: newDrop.reflection || "",
      verse: newDrop.verse || "",
      category: newDrop.category || "",
      description: newDrop.description || null,
      media_url: newDrop.media_url || null,
      hashtags: newDrop.hashtags || "",
      status: newDrop.status || "approved",
      likes_count: newDrop.likes_count || 0,
      bonus_likes_count: newDrop.bonus_likes_count || 0,
      pinned: newDrop.pinned || false,
      hidden: newDrop.hidden || false,
      hidden_reason: newDrop.hidden_reason || null,
      is_flagged: newDrop.is_flagged || false,
      moderation_note: newDrop.moderation_note || null,
      created_by: createdBy || "",
      created_date: newDrop.created_date || new Date().toISOString(),
      updated_date: newDrop.updated_date || newDrop.created_date || new Date().toISOString()
    }])
  }).catch(err => console.warn("Supabase dual-write failed silently:", err));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { verse, reflection, hashtags, category, media_url: rawMediaUrl, post_as_leader_id } = body;

    const ALLOWED_CDN_HOSTS = ['media.base44.com', 'base44.app', 'images.unsplash.com', 'res.cloudinary.com'];
    const ALLOWED_MIME = new Set([
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm',
    ]);
    const MAX_BYTES = 10 * 1024 * 1024; // 10MB

    let media_url = null;
    if (rawMediaUrl) {
      let parsed;
      try {
        parsed = new URL(rawMediaUrl);
      } catch {
        return Response.json({ error: 'Invalid media URL.' }, { status: 400 });
      }
      const hostOk = ALLOWED_CDN_HOSTS.some((host) => parsed.hostname === host || parsed.hostname.endsWith('.' + host));
      if (!hostOk) {
        return Response.json({ error: 'Media must be uploaded through the app.' }, { status: 400 });
      }

      // Server-side MIME + size validation — verify the actual stored file, not just the URL.
      try {
        const head = await fetch(rawMediaUrl, { method: 'HEAD' });
        const contentType = (head.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
        const contentLength = Number.parseInt(head.headers.get('content-length') || '0', 10);

        if (contentType && !ALLOWED_MIME.has(contentType)) {
          return Response.json({ error: 'Unsupported file type. Allowed: JPEG, PNG, GIF, WebP images and MP4/WebM video.' }, { status: 400 });
        }
        if (Number.isFinite(contentLength) && contentLength > MAX_BYTES) {
          return Response.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
        }
      } catch {
        // If the HEAD check fails (e.g. CDN blocks HEAD), fall through — host is already allowlisted.
      }
      media_url = rawMediaUrl;
    }

    let postAsLeader = null;
    if (post_as_leader_id) {
      const accounts = await base44.asServiceRole.entities.ManagedLeaderAccount.list('-created_date', 200);
      const account = accounts.find((item) => item.id === post_as_leader_id);
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

    // Always create via service role. The user is already authenticated and rate-limited
    // above; user-scoped creates were being rejected by RLS for some roles, causing the
    // post to silently fail.
    const drop = await base44.asServiceRole.entities.GlowDrop.create(dropPayload);

    mirrorGlowDropToSupabase(drop, effectiveEmail);

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

    return Response.json({ success: true, id: drop.id });
  } catch (error) {
    console.error('createGlowDrop failed:', error?.message, error?.stack);
    return Response.json({ error: error?.message || 'Unable to create drop' }, { status: 500 });
  }
});