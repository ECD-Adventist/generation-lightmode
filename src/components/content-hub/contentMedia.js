import { base44 } from "@/api/base44Client";

export async function fetchContentFile(item, action, platform = "") {
  const response = await base44.functions.fetch("/trackContentEngagement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content_id: item.id, action, platform, stream: true }),
  });
  if (!response.ok) throw new Error("Media request failed");

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plainName = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  const fileName = encodedName ? decodeURIComponent(encodedName) : plainName || item.title;
  return new File([blob], fileName, { type: blob.type || "application/octet-stream" });
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