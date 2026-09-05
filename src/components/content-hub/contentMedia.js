import { base44 } from "@/api/base44Client";

// Real byte size of the underlying Drive file. Used to size progress bars so the
// user sees a true percentage instead of an indefinite spinner.
export async function fetchContentMeta(item) {
  const res = await base44.functions.invoke("trackContentEngagement", { content_id: item.id, meta: true });
  return res.data || {};
}

export function formatBytes(bytes) {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Streams the media through the backend. When onProgress is supplied the body is
// read chunk by chunk so real transfer progress can be reported while it loads.
export async function fetchContentFile(item, action, platform = "", record = true, onProgress = null) {
  // Ask for the file size alongside the transfer so a percentage is available
  // even when the response carries no Content-Length header.
  const metaPromise = onProgress ? fetchContentMeta(item).catch(() => ({})) : null;

  const response = await base44.functions.fetch("/trackContentEngagement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content_id: item.id, action, platform, stream: true, record }),
  });
  if (!response.ok) throw new Error("Media request failed");

  const disposition = response.headers.get("Content-Disposition") || "";
  const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plainName = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  const fileName = encodedName ? decodeURIComponent(encodedName) : plainName || item.title;
  const type = response.headers.get("Content-Type") || "application/octet-stream";

  if (!onProgress || !response.body?.getReader) {
    const blob = await response.blob();
    return new File([blob], fileName, { type: blob.type || type });
  }

  const headerLength = Number(response.headers.get("Content-Length")) || 0;
  const total = headerLength || Number((await metaPromise)?.size) || 0;
  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;

  onProgress({ received: 0, total });
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    onProgress({ received, total });
  }

  const blob = new Blob(chunks, { type });
  return new File([blob], fileName, { type });
}

export function saveContentFile(file) {
  const objectUrl = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}