import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { toDirectDownloadUrl } from '../../shared/driveLinks.ts';

const VALID_ACTIONS = ["download", "share"];
const VALID_PLATFORMS = ["whatsapp", "facebook", "youtube", "instagram", "tiktok", "x", "telegram", "copy_link", "native", ""];

// Records a download or share for a content item and returns the direct
// download URL (downloads only). Enforces the scheduled unlock time.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    let payload = {};
    try { payload = await req.json(); } catch (_e) { payload = {}; }

    const contentId = String(payload.content_id || "").slice(0, 64);
    const action = String(payload.action || "");
    const platform = String(payload.platform || "").slice(0, 30);

    if (!contentId || !VALID_ACTIONS.includes(action)) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }
    if (action === "share" && !VALID_PLATFORMS.includes(platform)) {
      return Response.json({ error: "Invalid platform" }, { status: 400 });
    }

    const item = await base44.asServiceRole.entities.DigitalContent.get(contentId);
    if (!item) return Response.json({ error: "Content not found" }, { status: 404 });

    const unlockTime = new Date(item.scheduled_at).getTime();
    if (Number.isNaN(unlockTime) || unlockTime > Date.now()) {
      return Response.json({ error: "This content is not unlocked yet" }, { status: 403 });
    }

    let user = null;
    try { user = await base44.auth.me(); } catch (_e) { user = null; }

    await base44.asServiceRole.entities.ContentEngagement.create({
      content_id: item.id,
      content_title: item.title,
      user_email: user?.email || "guest",
      user_name: user?.full_name || "",
      action,
      platform: action === "share" ? platform : ""
    });

    const countField = action === "download" ? "download_count" : "share_count";
    await base44.asServiceRole.entities.DigitalContent.update(item.id, {
      [countField]: (item[countField] || 0) + 1
    });

    return Response.json({
      ok: true,
      download_url: action === "download" ? toDirectDownloadUrl(item.drive_link) : null
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}