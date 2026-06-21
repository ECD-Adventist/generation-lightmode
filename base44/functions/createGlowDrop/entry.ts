import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

// Fire-and-forget mirror of a Base44 record into Supabase. Never awaited by the
// caller, never throws — the Base44 write stays the primary source of truth.
const SUPABASE_URL = 'https://asnsthgubpeptoiexajf.supabase.co';
function mirrorToSupabase(table, row) {
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!key || !row?.id) return;
  fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(row),
  }).catch((e) => console.error(`Supabase mirror ${table} failed:`, e?.message));
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

    // Dual-write Step 1: mirror into Supabase (fire-and-forget, never blocks).
    mirrorToSupabase('glow_drops', {
      id: drop.id,
      user_email: drop.user_email,
      verse: drop.verse,
      reflection: drop.reflection,
      media_url: drop.media_url,
      category: drop.category,
      hashtags: drop.hashtags,
      status: drop.status,
      hidden: drop.hidden,
      likes_count: drop.likes_count,
      created_date: drop.created_date,
    });

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
    console.error('createGlowDrop failed:', error?.message, error?.stack);
    return Response.json({ error: error?.message || 'Unable to create drop' }, { status: 500 });
  }
});