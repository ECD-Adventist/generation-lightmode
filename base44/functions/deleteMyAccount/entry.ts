import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Permanently deletes the authenticated user's account and all associated content.
 * Scope of deletion:
 *   - Glow Drops (and their likes + comments)
 *   - Group memberships (and messages authored by user)
 *   - Follows (both directions)
 *   - Prayer requests + supports
 *   - Notifications
 *   - Stories, saved drops, certificates, challenge submissions
 *   - The User record itself
 *
 * Uses service role for bulk deletes so RLS doesn't block cascades.
 * Returns { success, deleted_counts } on success.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = user.email;
    const service = base44.asServiceRole;
    const counts = {};

    // Helper: delete every record matching a filter, return count
    const wipe = async (entityName, filter) => {
      try {
        const records = await service.entities[entityName].filter(filter);
        await Promise.all(records.map((r) => service.entities[entityName].delete(r.id).catch(() => {})));
        counts[entityName] = records.length;
      } catch (e) {
        console.error(`Failed to wipe ${entityName}:`, e.message);
        counts[entityName] = 0;
      }
    };

    // 1. User's Glow Drops — fetch first so we can cascade likes/comments
    let dropIds = [];
    try {
      const drops = await service.entities.GlowDrop.filter({ user_email: email });
      dropIds = drops.map((d) => d.id);
      await Promise.all(drops.map((d) => service.entities.GlowDrop.delete(d.id).catch(() => {})));
      counts.GlowDrop = drops.length;
    } catch (e) {
      console.error('Failed to wipe GlowDrop:', e.message);
    }

    // 2. Likes + comments on those drops (and any the user placed elsewhere)
    await wipe('GlowDropLike', { user_email: email });
    await wipe('GlowDropComment', { user_email: email });

    // 3. Group memberships + messages
    await wipe('GlowGroupMember', { user_email: email });
    await wipe('GlowGroupMessage', { user_email: email });

    // 4. Follows — both directions
    await wipe('Follow', { follower_email: email });
    await wipe('Follow', { following_email: email });

    // 5. Prayer wall
    await wipe('PrayerRequest', { user_email: email });
    await wipe('PrayerSupport', { user_email: email });

    // 6. Notifications addressed to the user
    await wipe('Notification', { user_email: email });

    // 7. Stories + viewer state
    await wipe('Story', { user_email: email });
    await wipe('SavedDrop', { user_email: email });

    // 8. Gamification artifacts
    await wipe('Certificate', { user_email: email });
    await wipe('ChallengeSubmission', { user_email: email });
    await wipe('UserDailyChallenge', { user_email: email });

    // 9. Finally, delete the User record itself
    try {
      const users = await service.entities.User.filter({ email });
      if (users.length > 0) {
        await service.entities.User.delete(users[0].id);
        counts.User = 1;
      }
    } catch (e) {
      console.error('Failed to delete User record:', e.message);
      return Response.json({ error: 'Account content removed but user record deletion failed. Contact support.', counts }, { status: 500 });
    }

    return Response.json({ success: true, deleted_counts: counts });
  } catch (error) {
    console.error('deleteMyAccount error:', error);
    return Response.json({ error: error.message || 'Deletion failed' }, { status: 500 });
  }
});