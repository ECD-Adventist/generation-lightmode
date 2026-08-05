import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';
import { connectSupabaseDatabase } from '../../shared/supabaseDatabase.ts';
import { enforceApiRateLimit, readValidatedJson } from '../../shared/apiSecurity.ts';
import { createNotificationIdempotent } from '../../shared/notifications.ts';

export default async function(req) {
  let database = null;
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Authentication required' }, { status: 401 });
    const limited = await enforceApiRateLimit(base44, req, user);
    if (limited) return limited;
    const validated = await readValidatedJson(req, {
      action: { type: 'string', enum: ['create', 'undo'] },
      original_post_id: { type: 'string', maxLength: 64 },
      caption: { type: 'string', maxLength: 500 },
    });
    if (validated.response) return validated.response;
    const { action, original_post_id: requestedId, caption = '' } = validated.data;
    if (!requestedId) return Response.json({ error: 'Post ID is required' }, { status: 400 });

    let canonicalId = requestedId;
    const referencedRepost = await base44.asServiceRole.entities.Repost.filter({ id: requestedId }, '-created_at', 1);
    if (referencedRepost[0]) canonicalId = referencedRepost[0].original_post_id;
    for (let depth = 0; depth < 5; depth += 1) {
      const candidate = await base44.asServiceRole.entities.GlowDrop.get(canonicalId).catch(() => null);
      if (!candidate) return Response.json({ error: 'Post not found or deleted' }, { status: 404 });
      if (!candidate.original_drop_id) break;
      if (candidate.original_drop_id === canonicalId) return Response.json({ error: 'Invalid repost loop' }, { status: 400 });
      canonicalId = candidate.original_drop_id;
    }
    const original = await base44.asServiceRole.entities.GlowDrop.get(canonicalId).catch(() => null);
    if (!original) return Response.json({ error: 'Original post not found or deleted' }, { status: 404 });
    if (original.hidden || original.is_flagged || original.status !== 'approved') return Response.json({ error: 'This post is restricted and cannot be reposted' }, { status: 403 });
    if (original.created_by_id === user.id || original.user_email === user.email) return Response.json({ error: 'You cannot repost your own post' }, { status: 400 });
    const blocks = await base44.asServiceRole.entities.BlockedUser.filter({ blocker_email: user.email, blocked_email: original.user_email });
    const reverseBlocks = await base44.asServiceRole.entities.BlockedUser.filter({ blocker_email: original.user_email, blocked_email: user.email });
    if (blocks.length || reverseBlocks.length) return Response.json({ error: 'This post is not available to repost' }, { status: 403 });

    const dbUrl = secrets.get('SUPABASE_DATABASE_URL');
    if (!dbUrl) return Response.json({ error: 'Repost storage is not configured' }, { status: 503 });
    database = await connectSupabaseDatabase(base44, dbUrl);
    await database.query(`CREATE TABLE IF NOT EXISTS public.reposts (
      id text PRIMARY KEY,
      original_post_id text NOT NULL,
      reposter_user_id text NOT NULL,
      reposter_email text,
      reposter_name text,
      caption text,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (reposter_user_id, original_post_id)
    )`);

    const existing = await base44.asServiceRole.entities.Repost.filter({ reposter_user_id: user.id, original_post_id: canonicalId }, '-created_at', 1);
    if (action === 'undo') {
      const repost = existing[0];
      if (!repost) return Response.json({ error: 'You have not reposted this post' }, { status: 404 });
      await database.query('DELETE FROM public.reposts WHERE id = $1 AND reposter_user_id = $2', [repost.id, user.id]);
      try {
        await base44.asServiceRole.entities.Repost.delete(repost.id);
      } catch (error) {
        await database.query('INSERT INTO public.reposts (id, original_post_id, reposter_user_id, reposter_email, reposter_name, caption, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING', [repost.id, canonicalId, user.id, repost.reposter_email || user.email, repost.reposter_name || user.full_name || '', repost.caption || '', repost.created_at]);
        throw error;
      }
      await base44.asServiceRole.entities.GlowDrop.update(original.id, { reposts_count: Math.max(0, (original.reposts_count || 0) - 1) });
      return Response.json({ success: true, action: 'undone', original_post_id: canonicalId });
    }

    if (existing[0]) return Response.json({ error: 'You already reposted this post', repost_id: existing[0].id }, { status: 409 });
    const now = new Date().toISOString();
    const repost = await base44.asServiceRole.entities.Repost.create({
      original_post_id: canonicalId,
      reposter_user_id: user.id,
      reposter_email: user.email,
      reposter_name: user.full_name || user.display_name || user.email?.split('@')[0] || 'Member',
      caption: String(caption || '').slice(0, 500),
      created_at: now,
    });
    try {
      await database.query('INSERT INTO public.reposts (id, original_post_id, reposter_user_id, reposter_email, reposter_name, caption, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)', [repost.id, canonicalId, user.id, repost.reposter_email, repost.reposter_name, repost.caption || '', now]);
    } catch (error) {
      await base44.asServiceRole.entities.Repost.delete(repost.id).catch(() => null);
      if (String(error?.code) === '23505') return Response.json({ error: 'You already reposted this post' }, { status: 409 });
      return Response.json({ error: 'Repost could not be saved to all storage systems' }, { status: 502 });
    }
    await base44.asServiceRole.entities.GlowDrop.update(original.id, { reposts_count: (original.reposts_count || 0) + 1 });

    const authors = await base44.asServiceRole.entities.User.filter({ email: original.user_email }, '-created_date', 1);
    const author = authors[0];
    if (author && author.id !== user.id && author.notify_reposts !== false) {
      await createNotificationIdempotent(base44, {
        user_id: author.id,
        actor_user_id: user.id,
        type: 'repost',
        reference_id: `repost_${user.id}_${canonicalId}`,
        message: `${repost.reposter_name} reposted your GlowDrop.`,
        link: `/Post?id=${encodeURIComponent(canonicalId)}`,
      });
    }
    return Response.json({ success: true, action: 'created', repost });
  } catch (error) {
    console.error('manageRepost failed', { message: error?.message, code: error?.code });
    return Response.json({ error: error?.message || 'Unable to manage repost' }, { status: 500 });
  } finally {
    if (database) await database.end().catch(() => null);
  }
}