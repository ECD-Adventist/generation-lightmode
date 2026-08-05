export function logShareError(stage, error, context = {}) {
  if (import.meta.env.DEV) {
    console.error("[share_error]", { stage, name: error?.name, message: error?.message, error, ...context });
  }
}

export async function tryNativeShare({ title, text, url, files }, context = {}) {
  if (typeof navigator.share !== "function") return { status: "unavailable" };
  try {
    const shareData = { title: title || "Generation LightMode", text: (text || "").replace(url, "").trim() };
    if (url) shareData.url = url;
    if (files && files.length) shareData.files = files;
    await navigator.share(shareData);
    return { status: "shared" };
  } catch (error) {
    if (error?.name === "AbortError") return { status: "cancelled", error };
    logShareError("native_share", error, context);
    return { status: "failed", error };
  }
}

export async function copyShareLink(url) {
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
    else throw new Error("Clipboard API unavailable");
  } catch (error) {
    const input = document.createElement("textarea");
    input.value = url;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    if (!copied) throw error;
  }
}

export function openShareWindow(url, context = {}) {
  const popup = window.open(url, "_blank");
  if (popup) popup.opener = null;
  else logShareError("popup_blocked", new Error("Share popup was blocked"), context);
  return Boolean(popup);
}

export const whatsappShareUrl = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`;

export const twitterShareUrl = (text, url) => {
  const base = "https://twitter.com/intent/tweet";
  const params = new URLSearchParams();
  params.set("text", text || "");
  if (url) params.set("url", url);
  return `${base}?${params.toString()}`;
};

export const facebookShareUrl = (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

export const linkedinShareUrl = (url, title) => {
  const params = new URLSearchParams();
  params.set("url", url);
  if (title) params.set("title", title);
  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
};

export const telegramShareUrl = (url, text) => {
  const params = new URLSearchParams();
  params.set("url", url);
  if (text) params.set("text", text);
  return `https://t.me/share/url?${params.toString()}`;
};

export const emailShareUrl = (subject, body) => {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  params.set("body", body || "");
  return `mailto:?${params.toString()}`;
};

/**
 * Platforms that support direct web share URLs (open in a new window).
 */
export const DIRECT_SHARE_PLATFORMS = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "facebook", label: "Facebook" },
  { id: "x", label: "X" },
  { id: "telegram", label: "Telegram" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "email", label: "Email" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
];

/**
 * Platforms that only work via the native device share API (mobile only).
 */
export const NATIVE_ONLY_PLATFORMS = [];

/**
 * Full ordered list of all share platforms for consistent arrangement.
 */
export const ALL_SHARE_PLATFORMS = [
  ...DIRECT_SHARE_PLATFORMS,
  ...NATIVE_ONLY_PLATFORMS,
];

/**
 * Platforms that open an upload/create page rather than pre-filling a post.
 * The share link is copied to the clipboard first so the user can paste it
 * as a caption when uploading their media.
 */
export const UPLOAD_SHARE_PLATFORMS = ["instagram", "tiktok", "youtube"];

export function isUploadPlatform(platformId) {
  return UPLOAD_SHARE_PLATFORMS.includes(platformId);
}

export function buildDirectShareUrl(platformId, url, text, title) {
  switch (platformId) {
    case "whatsapp": return whatsappShareUrl(text);
    case "facebook": return facebookShareUrl(url);
    case "x": return twitterShareUrl(text, url);
    case "telegram": return telegramShareUrl(url, text);
    case "linkedin": return linkedinShareUrl(url, title);
    case "email": return emailShareUrl(title, text);
    case "instagram": return "https://www.instagram.com/";
    case "tiktok": return "https://www.tiktok.com/upload";
    case "youtube": return "https://www.youtube.com/upload";
    default: return null;
  }
}