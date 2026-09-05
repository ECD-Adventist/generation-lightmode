import { extractDriveFileId } from './driveLinks.ts';

const metadataCache = new Map();
export async function driveMeta(fileId, accessToken) {
  const cached = metadataCache.get(fileId);
  if (cached?.expires > Date.now()) return cached.data;
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=size,mimeType,name,thumbnailLink,videoMediaMetadata(width,height),imageMediaMetadata(width,height)&supportsAllDrives=true`, {
    headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (metadataCache.size >= 200) metadataCache.delete(metadataCache.keys().next().value);
  metadataCache.set(fileId, { data, expires: Date.now() + 300000 });
  return data;
}

export function mediaResolution(meta) {
  const dimensions = meta?.videoMediaMetadata || meta?.imageMediaMetadata;
  return dimensions?.width && dimensions?.height ? `${dimensions.width} × ${dimensions.height}` : null;
}

// Copy only the provider's small thumbnail, never the original video/image.
export async function fetchContentThumbnail(base44, driveLink) {
  const fileId = extractDriveFileId(driveLink);
  if (!fileId) return null;
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
  const meta = await driveMeta(fileId, accessToken);
  if (!meta?.thumbnailLink) return null;
  const url = new URL(meta.thumbnailLink);
  if (url.protocol !== 'https:' || !['googleusercontent.com', 'google.com'].some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))) return null;
  const response = await fetch(url.toString().replace(/=[sw]\d+(-[a-z]+)?$/i, '=s800'), { signal: AbortSignal.timeout(10000) });
  if (!response.ok || !response.headers.get('Content-Type')?.startsWith('image/')) return null;
  const blob = await response.blob();
  if (blob.size > 5 * 1024 * 1024) return null;
  const extension = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
  const uploaded = await base44.asServiceRole.integrations.Core.UploadFile({ file: new File([blob], `thumbnail-${fileId}.${extension}`, { type: blob.type }) });
  return uploaded.file_url || null;
}