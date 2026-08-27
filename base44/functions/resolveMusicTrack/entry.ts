import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const APPROVED_MUSIC_DRIVE_ID = "0ABkm6ojo6LD0Uk9PVA";

// Google Drive download links can't be streamed by an <audio> tag (they redirect and
// require cookies). This copies the Drive file into app storage once, caches the
// resulting permanent URL, and returns it for playback.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    let user = null;
    try { user = await base44.auth.me(); } catch (_e) { user = null; }
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    let payload = {};
    try { payload = await req.json(); } catch (_e) { payload = {}; }

    const fileId = String(payload.file_id || "").trim();
    const name = String(payload.name || "Track").slice(0, 200);
    if (!fileId) return Response.json({ error: "file_id is required" }, { status: 400 });

    const existing = await base44.asServiceRole.entities.MusicTrack.filter({ drive_file_id: fileId });
    if (existing.length > 0 && existing[0].file_url) {
      return Response.json({ file_url: existing[0].file_url, name: existing[0].name || name });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googledrive");
    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!driveRes.ok) {
      const detail = await driveRes.text();
      return Response.json({ error: "Could not download track", detail: detail.slice(0, 300) }, { status: 502 });
    }

    const blob = await driveRes.blob();
    const file = new File([blob], `${name}.mp3`, { type: blob.type || "audio/mpeg" });
    const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });

    await base44.asServiceRole.entities.MusicTrack.create({ drive_file_id: fileId, name, file_url });

    return Response.json({ file_url, name });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}