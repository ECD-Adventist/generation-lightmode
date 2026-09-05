import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { toDirectDownloadUrl, toDrivePreviewUrl, toDriveImageUrl, toDriveViewUrl } from '../../shared/driveLinks.ts';
import { enforceApiRateLimit } from '../../shared/apiSecurity.ts';

// Public listing of scheduled digital content.
// Locked items (scheduled in the future) have their download links stripped —
// the system unlocks them automatically once their scheduled time passes.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const rateLimited = await enforceApiRateLimit(base44, req);
    if (rateLimited) return rateLimited;
    const items = await base44.asServiceRole.entities.DigitalContent.list('-scheduled_at', 500);
    const now = Date.now();

    const result = items.map((item) => {
      const unlockTime = new Date(item.scheduled_at).getTime();
      const unlocked = !Number.isNaN(unlockTime) && unlockTime <= now;
      return {
        id: item.id,
        title: item.title,
        description: item.description || "",
        content_type: item.content_type,
        category: item.category || "",
        language: item.language,
        thumbnail_url: item.thumbnail_url || "",
        scheduled_at: item.scheduled_at,
        view_count: item.view_count || 0,
        download_count: item.download_count || 0,
        share_count: item.share_count || 0,
        repost_count: item.repost_count || 0,
        unlocked,
        preview_url: unlocked ? toDrivePreviewUrl(item.drive_link) : null,
        drive_view_url: unlocked ? toDriveViewUrl(item.drive_link) : null,
        image_url: unlocked ? toDriveImageUrl(item.drive_link) : null,
        download_url: unlocked ? toDirectDownloadUrl(item.drive_link) : null
      };
    });

    return Response.json({ items: result }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}