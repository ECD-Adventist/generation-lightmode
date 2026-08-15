import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { authorizeSchedulerOrAdmin } from '../../shared/schedulerAuth.ts';
import { mirrorToSupabase } from '../../shared/supabase.ts';

// Runs on schedule. Finds all ScheduledPost records with scheduled_for <= now
// and status = "scheduled", publishes them as GlowDrops from the official brand account.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    if (!await authorizeSchedulerOrAdmin(base44, req)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const nowIso = new Date().toISOString();
    const due = await base44.asServiceRole.entities.ScheduledPost.filter({ status: 'scheduled' });
    const toPublish = due.filter(p => p.scheduled_for && p.scheduled_for <= nowIso);

    const results = [];
    for (const post of toPublish) {
      try {
        const drop = await base44.asServiceRole.entities.GlowDrop.create({
          user_email: 'system@lightmode.com',
          verse: post.verse || undefined,
          reflection: post.reflection || undefined,
          hashtags: post.hashtags || undefined,
          category: post.category || 'Announcement',
          media_url: post.media_url || undefined,
          status: 'approved',
          likes_count: 0,
          bonus_likes_count: 0,
          bonus_likes_enabled: true,
        });
        await mirrorToSupabase('glow_drops', drop);
        await base44.asServiceRole.entities.ScheduledPost.update(post.id, {
          status: 'published',
          published_drop_id: drop.id,
        });
        results.push({ id: post.id, published: true, drop_id: drop.id });
      } catch (err) {
        await base44.asServiceRole.entities.ScheduledPost.update(post.id, {
          status: 'failed',
          error_message: err.message || 'Unknown error',
        });
        results.push({ id: post.id, published: false, error: err.message });
      }
    }

    return Response.json({ success: true, processed: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});