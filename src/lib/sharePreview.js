const APP_ORIGIN = "https://lightmode.ecd.adventist.org";

const stripText = (value = "") => value
  .replace(/<[^>]*>/g, " ")
  .replace(/\s+/g, " ")
  .trim();

export function getSharePreviewUrl(type, id) {
  return `${APP_ORIGIN}/functions/getSharePreview?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`;
}

export function buildShareText(title, excerpt, url) {
  const cleanTitle = stripText(title) || "Generation LightMode";
  const cleanExcerpt = stripText(excerpt).slice(0, 180);
  return `${cleanTitle}${cleanExcerpt ? ` — ${cleanExcerpt}` : ""}\n${url}`;
}