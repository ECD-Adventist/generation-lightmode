import DOMPurify from "dompurify";

// Safe config for rendering rich post content.
// Allows formatting + embedded iframes (YouTube/Vimeo) but strips scripts/event handlers.
const CONFIG = {
  ALLOWED_TAGS: [
    "p", "br", "strong", "b", "em", "i", "u", "s", "strike",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "blockquote",
    "a", "span", "div", "img",
  ],
  ALLOWED_ATTR: [
    "href", "target", "rel",
    "src", "alt", "title", "width", "height",
  ],
  // No "iframe" tag and no inline "style"/"class" — these are common XSS / clickjacking
  // vectors. Only safe formatting + links + images remain.
  FORBID_TAGS: ["style", "iframe", "script", "object", "embed", "form"],
  FORBID_ATTR: ["style", "onerror", "onload", "onclick"],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/|#)/i,
  ADD_ATTR: ["target"],
};

// Images may only come from our own media host or this origin — blocks tracking pixels
// and off-site content hidden inside rich posts. Links are also forced to open safely.
const ALLOWED_IMAGE_HOSTS = ["media.base44.com"];
DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
  if (node.tagName === "IMG" && data.attrName === "src") {
    try {
      const url = new URL(data.attrValue, window.location.origin);
      const sameOrigin = url.origin === window.location.origin;
      const allowedHost = ALLOWED_IMAGE_HOSTS.includes(url.hostname);
      if (!(url.protocol === "https:" && (sameOrigin || allowedHost))) data.keepAttr = false;
    } catch {
      data.keepAttr = false;
    }
  }
});
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A" && node.getAttribute("target") === "_blank") {
    node.setAttribute("rel", "noopener noreferrer");
  }
});

export function sanitizeRichHtml(dirty) {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, CONFIG);
}

// Detects if a string contains HTML tags (so we know to render rich vs plain text).
export function containsHtml(str) {
  if (!str) return false;
  return /<\/?[a-z][\s\S]*>/i.test(str);
}