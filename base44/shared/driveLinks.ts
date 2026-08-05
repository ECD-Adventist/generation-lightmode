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