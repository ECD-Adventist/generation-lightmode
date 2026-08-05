import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const ALLOWED_ROLES = ["admin", "super_admin", "ecd_admin"];

// The "ALL THINGS NEW" shared drive — the only drive admins browse for resources.
const SHARED_DRIVE_ID = "0ABkm6ojo6LD0Uk9PVA";

// Admin-only browser for the connected (shared) Google Drive account.
// Lists folders + media files so admins can pick a file instead of pasting links.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    let user = null;
    try { user = await base44.auth.me(); } catch (_e) { user = null; }
    if (!user || !ALLOWED_ROLES.includes(user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    let payload = {};
    try { payload = await req.json(); } catch (_e) { payload = {}; }

    const folderId = String(payload.folder_id || SHARED_DRIVE_ID).slice(0, 100);
    const search = String(payload.search || "").trim().slice(0, 100).replace(/'/g, "");

    const clauses = ["trashed = false"];
    if (search) clauses.push(`name contains '${search}'`);
    else clauses.push(`'${folderId}' in parents`);

    const params = new URLSearchParams({
      q: clauses.join(" and "),
      fields: "files(id,name,description,mimeType,size,modifiedTime,iconLink,hasThumbnail,thumbnailLink)",
      orderBy: "folder,name",
      pageSize: "100",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
      corpora: "drive",
      driveId: SHARED_DRIVE_ID,
    });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googledrive");
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const detail = await res.text();
      return Response.json({ error: "Google Drive request failed", detail: detail.slice(0, 300) }, { status: 502 });
    }

    const data = await res.json();
    const files = (data.files || []).map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description || "",
      mime_type: f.mimeType,
      is_folder: f.mimeType === "application/vnd.google-apps.folder",
      size: f.size ? Number(f.size) : null,
      modified_time: f.modifiedTime,
      has_thumbnail: Boolean(f.hasThumbnail),
      thumbnail_link: f.thumbnailLink ? f.thumbnailLink.replace(/=s\d+$/, "=s800") : "",
      link: `https://drive.google.com/file/d/${f.id}/view`,
    }));

    return Response.json({ files });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}