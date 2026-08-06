import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { extractDriveFileId, toDirectDownloadUrl } from '../../shared/driveLinks.ts';

const VALID_ACTIONS = ["view", "download", "share"];
const VALID_PLATFORMS = ["whatsapp", "facebook", "youtube", "instagram", "tiktok", "x", "telegram", "copy_link", "native", "Base 1_feed", ""];

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
    const streamMedia = payload.stream === true && VALID_ACTIONS.includes(action);
    const recordEngagement = payload.record !== false;

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

    let driveResponse = null;
    if (streamMedia) {
      const fileId = extractDriveFileId(item.drive_link);
      if (!fileId) return Response.json({ error: "Invalid Drive file" }, { status: 400 });

      const { accessToken } = await base44.asServiceRole.connectors.getConnection("googledrive");
      driveResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!driveResponse.ok) {
        return Response.json({ error: "The file could not be downloaded" }, { status: driveResponse.status });
      }
    }

    if (recordEngagement) {
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

      const countField = action === "view" ? "view_count" : action === "download" ? "download_count" : "share_count";
      await base44.asServiceRole.entities.DigitalContent.update(item.id, {
        [countField]: (item[countField] || 0) + 1
      });
    }

    if (streamMedia && driveResponse) {
      const headers = new Headers();
      headers.set("Content-Type", driveResponse.headers.get("Content-Type") || "application/octet-stream");
      headers.set("Content-Disposition", driveResponse.headers.get("Content-Disposition") || `attachment; filename="${item.title.replace(/["\\]/g, "_")}"`);
      headers.set("Cache-Control", "private, no-store");
      return new Response(driveResponse.body, { status: 200, headers });
    }

    return Response.json({
      ok: true,
      download_url: action === "download" ? toDirectDownloadUrl(item.drive_link) : null
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}