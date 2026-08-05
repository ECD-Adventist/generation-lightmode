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
  // confirm=t skips the "can't scan for viruses" interstitial on large files.
  return id ? `https://drive.google.com/uc?export=download&id=${id}&confirm=t` : link;
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