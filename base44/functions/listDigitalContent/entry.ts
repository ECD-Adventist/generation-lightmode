import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { toDirectDownloadUrl, toDrivePreviewUrl, toDriveImageUrl, toDriveViewUrl } from '../../shared/driveLinks.ts';
import { enforceApiRateLimit } from '../../shared/apiSecurity.ts';

let publicListing = null;
let listingExpiresAt = 0;

// Public listing of scheduled digital content.
// Locked items (scheduled in the future) have their download links stripped —
// the system unlocks them automatically once their scheduled time passes.
export default async function(req) {
  try {
    if (publicListing && Date.now() < listingExpiresAt) {
      return Response.json({ items: publicListing }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
    }
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const rateLimited = await enforceApiRateLimit(base44, req, user);
    if (rateLimited) return rateLimited;
    const client = user?.role === 'admin' ? base44 : base44.asServiceRole;
    const items = await client.entities.DigitalContent.list('-scheduled_at', 500);
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

    // Cache only the sanitized public response, never future download links.
    // Expire at the next release so caching cannot delay scheduled unlocks.
    publicListing = result;
    listingExpiresAt = Math.min(now + 60_000, ...items.map(item => Date.parse(item.scheduled_at)).filter(time => time > now));
    return Response.json({ items: result }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('listDigitalContent failed:', error?.message);
    const limited = (error?.status || error?.response?.status) === 429 || /rate limit exceeded/i.test(error?.message || '');
    return Response.json({ error: limited ? 'Content is temporarily busy. Please retry shortly.' : 'Unable to load content' }, {
      status: limited ? 429 : 500,
      headers: limited ? { 'Retry-After': '60' } : {},
    });
  }
}