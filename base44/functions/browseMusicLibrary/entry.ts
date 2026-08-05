import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// The "ALL THINGS NEW" shared drive — royalty-free music lives here.
const SHARED_DRIVE_ID = "0ABkm6ojo6LD0Uk9PVA";

// Dedicated music folder inside the shared drive.
const MUSIC_FOLDER_ID = "13TMHi_OJSm3g1S_RwG42O-YmO0qI0xnN";

// Lets signed-in users browse/search audio tracks from the shared drive
// so they can attach music to their Glow Drops.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    let user = null;
    try { user = await base44.auth.me(); } catch (_e) { user = null; }
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    let payload = {};
    try { payload = await req.json(); } catch (_e) { payload = {}; }

    const search = String(payload.search || "").trim().slice(0, 100).replace(/'/g, "");

    const clauses = ["trashed = false", "mimeType contains 'audio/'", `'${MUSIC_FOLDER_ID}' in parents`];
    if (search) clauses.push(`name contains '${search}'`);

    const params = new URLSearchParams({
      q: clauses.join(" and "),
      fields: "files(id,name,mimeType,size,modifiedTime)",
      orderBy: "name",
      pageSize: "60",
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
    const tracks = (data.files || []).map((f) => ({
      id: f.id,
      name: f.name.replace(/\.[^.]+$/, ""),
      mime_type: f.mimeType,
      size: f.size ? Number(f.size) : null,
      audio_url: `https://drive.google.com/uc?export=download&id=${f.id}`,
    }));

    return Response.json({ tracks });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}