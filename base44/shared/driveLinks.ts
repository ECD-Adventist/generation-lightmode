// Google Drive link utilities — convert share links to direct-download URLs.

export function extractDriveFileId(link) {
  const str = String(link || "");
  const m =
    str.match(/\/file\/d\/([\w-]+)/) ||
    str.match(/[?&]id=([\w-]+)/) ||
    str.match(/\/d\/([\w-]+)/);
  return m ? m[1] : null;
}

export function toDirectDownloadUrl(link) {
  const id = extractDriveFileId(link);
  // The usercontent host serves the file response directly instead of the Drive viewer.
  return id ? `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t` : link;
}

// Renderable image URL for <img> tags (the uc?export=download URL is blocked as an image source).
export function toDriveImageUrl(link) {
  const id = extractDriveFileId(link);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w2000` : link;
}

export function toDrivePreviewUrl(link) {
  const id = extractDriveFileId(link);
  return id ? `https://drive.google.com/file/d/${id}/preview` : null;
}