import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

/**
 * Deletes a Glow Drop after verifying the requester is authorized:
 *   - The author (matched by user_email, since "Post as leader" drops are
 *     created with user_email = leader_email and a created_by_id that may not
 *     match the current user — so RLS-based client deletes silently fail).
 *   - A manager of the leader account whose email owns the drop.
 *   - An admin / super_admin / moderator.
 *
 * Uses asServiceRole so the delete actually succeeds regardless of who created
 * the record. Also cascades likes + comments for the drop.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { drop_id } = await req.json();
    if (!drop_id) return Response.json({ error: 'drop_id is required' }, { status: 400 });

    const service = base44.asServiceRole;
    let drop = null;
    try {
      drop = await service.entities.GlowDrop.get(drop_id);
    } catch {
      drop = null;
    }
    if (!drop) return Response.json({ error: 'Post not found' }, { status: 404 });

    const isAuthor = drop.user_email && drop.user_email === user.email;
    const isAdmin = ['admin', 'super_admin', 'moderator'].includes(user.role);

    let isManagerOfLeader = false;
    if (drop.user_email) {
      const accounts = await service.entities.ManagedLeaderAccount.filter({ leader_email: drop.user_email });
      isManagerOfLeader = accounts.some(
        (a) => Array.isArray(a.manager_emails) && a.manager_emails.includes(user.email)
      );
    }

    if (!isAuthor && !isAdmin && !isManagerOfLeader) {
      return Response.json({ error: 'You are not allowed to delete this post' }, { status: 403 });
    }

    // Cascade likes + comments, then the drop itself.
    try {
      const likes = await service.entities.GlowDropLike.filter({ drop_id });
      await Promise.all(likes.map((l) => service.entities.GlowDropLike.delete(l.id).catch(() => {})));
    } catch { /* non-fatal */ }
    try {
      const comments = await service.entities.GlowDropComment.filter({ drop_id });
      await Promise.all(comments.map((c) => service.entities.GlowDropComment.delete(c.id).catch(() => {})));
    } catch { /* non-fatal */ }

    await service.entities.GlowDrop.delete(drop_id);

    // If this drop was a repost of a Code/Slogan, decrement that code's reposts_count
    // so the counter stays accurate. Floored at 0. Each repost is tracked independently,
    // so deleting one only removes one — multiple reposts by the same person still count.
    if (drop.source_code_id) {
      try {
        const engagementList = await service.entities.CodeEngagement.filter({ code_id: drop.source_code_id });
        const engagement = engagementList[0];
        if (engagement) {
          const next = Math.max(0, (engagement.reposts_count || 0) - 1);
          await service.entities.CodeEngagement.update(engagement.id, { reposts_count: next });
        }
      } catch { /* non-fatal */ }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to delete post' }, { status: 500 });
  }
});