import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SUPABASE_URL = "https://asnsthgubpeptoiexajf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzbnN0aGd1YnBlcHRvaWV4YWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MzM5NDgsImV4cCI6MjA2MzQwOTk0OH0.r3WDFbJQgPuVnakMUJQa_cEWBUBbnT3hbDbT5GiZoNA";
function mirrorGlowDropToSupabase(newDrop, createdBy) {
  if (!newDrop?.id) return;
  fetch(`${SUPABASE_URL}/rest/v1/glow_drops`, {
    method: "POST",
    headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([{ id: newDrop.id, reflection: newDrop.reflection || "", verse: newDrop.verse || "", category: newDrop.category || "", description: newDrop.description || null, media_url: newDrop.media_url || null, hashtags: newDrop.hashtags || "", status: newDrop.status || "approved", likes_count: newDrop.likes_count || 0, bonus_likes_count: newDrop.bonus_likes_count || 0, pinned: newDrop.pinned || false, hidden: newDrop.hidden || false, hidden_reason: newDrop.hidden_reason || null, is_flagged: newDrop.is_flagged || false, moderation_note: newDrop.moderation_note || null, created_by: createdBy || "", created_date: newDrop.created_date || new Date().toISOString(), updated_date: newDrop.updated_date || newDrop.created_date || new Date().toISOString() }])
  }).catch(err => console.warn("Supabase dual-write failed silently:", err));
}

// Runs on schedule. Finds all ScheduledPost records with scheduled_for <= now
// and status = "scheduled", publishes them as GlowDrops from the official brand account.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow both scheduled automation (no user auth) and manual admin invocation.
    // For manual invocation via frontend, verify super_admin.
    let user = null;
    try { user = await base44.auth.me(); } catch { /* scheduled automation has no user */ }

    if (user && user.role !== 'super_admin') {
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
        mirrorGlowDropToSupabase(drop, 'system@lightmode.com');
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