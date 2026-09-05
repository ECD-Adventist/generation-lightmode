import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { extractDriveFileId, toDirectDownloadUrl } from '../../shared/driveLinks.ts';

const VALID_ACTIONS = ["view", "download", "share"];
const VALID_PLATFORMS = ["whatsapp", "facebook", "youtube", "instagram", "tiktok", "x", "telegram", "copy_link", "native", "Base 1_feed", ""];

// Longest edge, in pixels, of the automatically generated phone-sized image.
const MOBILE_IMAGE_PX = 1280;

const isImageItem = (item) => item.content_type === "poster";

async function driveMeta(fileId, accessToken) {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=size,mimeType,name,thumbnailLink&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return null;
  return await res.json();
}

// Google serves resized copies of an image through its thumbnail URL, which lets
// posters offer a light mobile download without anyone uploading a second file.
function resizedImageUrl(thumbnailLink, px) {
  if (!thumbnailLink) return null;
  return thumbnailLink.replace(/=[sw]\d+(-[a-z]+)?$/i, `=s${px}`);
}

async function urlByteSize(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok) return 0;
    return Number(res.headers.get("Content-Length")) || 0;
  } catch (_e) {
    return 0;
  }
}

// Records a download or share for a content item and returns the direct
// download URL (downloads only). Enforces the scheduled unlock time.
//
// Supports { meta: true } — a Drive metadata lookup returning the real byte size
// of every download option so the app can show accurate sizes and progress.
//
// Supports { variant: "mobile" } — serves the lighter copy: an admin-uploaded
// compressed file when one exists, or a Google-resized image for posters.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    let payload = {};
    try { payload = await req.json(); } catch (_e) { payload = {}; }

    const contentId = String(payload.content_id || "").slice(0, 64);
    const action = String(payload.action || "");
    const platform = String(payload.platform || "").slice(0, 30);
    const wantsMobile = payload.variant === "mobile";
    const streamMedia = payload.stream === true && VALID_ACTIONS.includes(action);
    const metaOnly = payload.meta === true;
    const recordEngagement = payload.record !== false && !metaOnly;

    if (!contentId || (!metaOnly && !VALID_ACTIONS.includes(action))) {
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

    const originalId = extractDriveFileId(item.drive_link);
    if (!originalId) return Response.json({ error: "Invalid Drive file" }, { status: 400 });
    const mobileId = item.mobile_drive_link ? extractDriveFileId(item.mobile_drive_link) : null;

    // Metadata lookup — lists every available download option with its true size.
    // No engagement is recorded.
    if (metaOnly) {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection("googledrive");
      const [original, mobile] = await Promise.all([
        driveMeta(originalId, accessToken),
        mobileId ? driveMeta(mobileId, accessToken) : Promise.resolve(null)
      ]);
      if (!original) return Response.json({ error: "File details unavailable" }, { status: 502 });

      const variants = [];
      if (mobile) {
        // An admin uploaded a compressed copy — only offer it when it is genuinely smaller.
        const mobileSize = Number(mobile.size) || 0;
        const originalSize = Number(original.size) || 0;
        if (mobileSize > 0 && (originalSize === 0 || mobileSize < originalSize)) {
          variants.push({ id: "mobile", label: "Mobile", size: mobileSize, source: "compressed_upload", available: true });
        }
      } else if (isImageItem(item)) {
        const resized = resizedImageUrl(original.thumbnailLink, MOBILE_IMAGE_PX);
        const size = resized ? await urlByteSize(resized) : 0;
        if (size > 0 && size < (Number(original.size) || Infinity)) {
          variants.push({ id: "mobile", label: "Phone size", size, source: "auto_resized", available: true });
        }
      }
      variants.push({
        id: "original",
        label: "Original",
        size: Number(original.size) || 0,
        source: "original",
        available: true
      });

      return Response.json({
        ok: true,
        size: Number(original.size) || 0,
        mime_type: original.mimeType || "",
        file_name: original.name || item.title || "",
        variants
      });
    }

    let driveResponse = null;
    let mobileFileName = "";
    if (streamMedia) {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection("googledrive");

      if (wantsMobile && mobileId) {
        // Admin-supplied compressed file.
        driveResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${mobileId}?alt=media&supportsAllDrives=true`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      } else if (wantsMobile && isImageItem(item)) {
        // Google-resized copy of the poster.
        const original = await driveMeta(originalId, accessToken);
        const resized = resizedImageUrl(original?.thumbnailLink, MOBILE_IMAGE_PX);
        if (resized) {
          driveResponse = await fetch(resized);
          const base = (original?.name || item.title || "poster").replace(/\.[^.]+$/, "");
          mobileFileName = `${base} (mobile).jpg`;
        }
      }

      // No lighter copy available (or it failed) — fall back to the original file.
      if (!driveResponse || !driveResponse.ok) {
        driveResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${originalId}?alt=media&supportsAllDrives=true`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        mobileFileName = "";
      }
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

        const isFeedRepost = action === "share" && platform === "Base 1_feed";
      const countField = action === "view" ? "view_count" : action === "download" ? "download_count" : isFeedRepost ? "repost_count" : "share_count";
      await base44.asServiceRole.entities.DigitalContent.update(item.id, {
        [countField]: (item[countField] || 0) + 1
      });
    }

    if (streamMedia && driveResponse) {
      const headers = new Headers();
      headers.set("Content-Type", driveResponse.headers.get("Content-Type") || "application/octet-stream");
      const fallbackName = mobileFileName || item.title.replace(/["\\]/g, "_");
      headers.set(
        "Content-Disposition",
        mobileFileName
          ? `attachment; filename="${mobileFileName.replace(/["\\]/g, "_")}"`
          : driveResponse.headers.get("Content-Disposition") || `attachment; filename="${fallbackName}"`
      );
      const length = driveResponse.headers.get("Content-Length");
      if (length) headers.set("Content-Length", length);
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