import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';
import { mirrorToSupabase } from '../../shared/supabase.ts';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const rateLimited = await enforceApiRateLimit(base44, req, user);
    if (rateLimited) return rateLimited;

    const validated = await readValidatedJson(req, {
      verse: { type: 'string', maxLength: 500 },
      reflection: { type: 'string', maxLength: 2000 },
      hashtags: { type: 'string', maxLength: 200 },
      category: { type: 'string', maxLength: 100 },
      media_url: { type: 'string', maxLength: 2048 },
      audio_url: { type: 'string', maxLength: 2048 },
      audio_title: { type: 'string', maxLength: 200 },
      post_as_leader_id: { type: 'string', format: 'uuid' },
    });
    if (validated.response) return validated.response;
    const { verse, reflection, hashtags, category, media_url: rawMediaUrl, audio_url: rawAudioUrl, audio_title, post_as_leader_id } = validated.data;

    // Audio must be an app-hosted file (music library tracks are copied into app storage).
    let audio_url = null;
    if (rawAudioUrl) {
      let parsedAudio;
      try {
        parsedAudio = new URL(rawAudioUrl);
      } catch {
        return Response.json({ error: 'Invalid audio URL.' }, { status: 400 });
      }
      const audioHostOk = ['media.base44.com', 'base44.app'].some(
        (host) => parsedAudio.hostname === host || parsedAudio.hostname.endsWith('.' + host)
      );
      if (!audioHostOk) return Response.json({ error: 'Audio must come from the app music library.' }, { status: 400 });
      audio_url = rawAudioUrl;
    }

    const ALLOWED_CDN_HOSTS = ['media.base44.com', 'base44.app', 'images.unsplash.com', 'res.cloudinary.com'];
    const ALLOWED_MIME = new Set([
      'image/jpeg', 'image/png', 'image/gif',
      'video/mp4', 'application/pdf',
    ]);
    const MAX_BYTES = 10 * 1024 * 1024; // 10MB

    let media_url = null;
    if (rawMediaUrl) {
      let decodedMediaUrl = rawMediaUrl;
      try { decodedMediaUrl = decodeURIComponent(rawMediaUrl); } catch { /* URL parser reports the error below */ }
      if (decodedMediaUrl.includes('../') || decodedMediaUrl.includes('..\\') || decodedMediaUrl.includes('\\')) {
        return Response.json({ error: 'Invalid media path.' }, { status: 400 });
      }
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

        if (!head.ok) {
          return Response.json({ error: 'Unable to verify uploaded file.' }, { status: 400 });
        }
        if (!contentType || !ALLOWED_MIME.has(contentType)) {
          return Response.json({ error: 'Unsupported file type. Allowed: JPEG, PNG, GIF, MP4, and PDF.' }, { status: 400 });
        }
        if (!Number.isFinite(contentLength) || contentLength <= 0) {
          return Response.json({ error: 'Unable to verify uploaded file size.' }, { status: 400 });
        }
        if (contentLength > MAX_BYTES) {
          return Response.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
        }
      } catch {
        return Response.json({ error: 'Unable to verify uploaded file.' }, { status: 400 });
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
    const fallbackHandle = (effectiveEmail || '').split('@')[0] || 'Glow Believer';
    const authorName = postAsLeader
      ? (postAsLeader.leader_name || fallbackHandle)
      : (user.full_name || user.username || fallbackHandle);
    const authorUsername = postAsLeader
      ? (postAsLeader.leader_name || fallbackHandle)
      : (user.username || fallbackHandle);
    const authorAvatar = postAsLeader
      ? (postAsLeader.leader_profile_picture_url || null)
      : (user.profile_picture || user.profile_picture_url || null);
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
      author_name: authorName,
      author_username: authorUsername,
      author_avatar: authorAvatar,
      verse: (verse || '').slice(0, 500),
      reflection: (reflection || '').slice(0, 2000),
      hashtags: (hashtags || '').slice(0, 200),
      category: category || 'Devotional',
      media_url: media_url || null,
      audio_url: audio_url,
      audio_title: audio_url ? (audio_title || '').slice(0, 200) : null,
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

    // Dual-write: mirror into Supabase via service role key. Awaited — an un-awaited
    // fetch is cancelled when the function returns, silently losing the write.
    await mirrorToSupabase('glow_drops', {
      id: drop.id,
      user_email: drop.user_email,
      author_name: drop.author_name,
      author_username: drop.author_username,
      author_avatar: drop.author_avatar,
      verse: drop.verse,
      reflection: drop.reflection,
      hashtags: drop.hashtags,
      category: drop.category,
      media_url: drop.media_url,
      status: drop.status,
      hidden: drop.hidden,
      likes_count: drop.likes_count,
      bonus_likes_count: drop.bonus_likes_count,
      bonus_likes_enabled: drop.bonus_likes_enabled,
      pinned: drop.pinned,
      is_flagged: drop.is_flagged,
      created_date: drop.created_date,
      updated_date: drop.updated_date,
      created_by_id: drop.created_by_id,
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

    return Response.json({ success: true, id: drop.id });
  } catch (error) {
    console.error('createGlowDrop failed:', error?.message, error?.stack);
    return Response.json({ error: error?.message || 'Unable to create drop' }, { status: 500 });
  }
});