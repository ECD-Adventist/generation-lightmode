/**
 * Image proxy / thumbnail helper.
 *
 * Base44 media URLs support on-the-fly resizing via query params (w, q).
 * Serving 600px-wide thumbnails for the feed dramatically reduces mobile
 * bandwidth + decode cost vs. shipping the original (often 1–3MB) files.
 *
 * Originals are still used in full-post / detail views.
 */
const BASE44_MEDIA_HOST = "media.base44.com";

/**
 * Return a resized variant of a Base44 media URL.
 * For non-Base44 URLs (or invalid input), the original URL is returned unchanged.
 *
 * @param {string} url       Original image URL
 * @param {number} width     Target width in px (default 600)
 * @param {number} quality   JPEG/WEBP quality 1-100 (default 75)
 */
export function thumb(url, width = 600, quality = 75) {
  if (!url || typeof url !== "string") return url;
  try {
    const u = new URL(url);
    if (!u.hostname.includes(BASE44_MEDIA_HOST)) return url;
    u.searchParams.set("w", String(width));
    u.searchParams.set("q", String(quality));
    return u.toString();
  } catch {
    return url;
  }
}

/** Convenience: small avatar (~120px). */
export function avatarThumb(url) {
  return thumb(url, 120, 70);
}

/** Convenience: feed card image (~600px wide). */
export function feedThumb(url) {
  return thumb(url, 600, 75);
}