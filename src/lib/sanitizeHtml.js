import DOMPurify from "dompurify";

// Safe config for rendering rich post content.
// Allows formatting + embedded iframes (YouTube/Vimeo) but strips scripts/event handlers.
const CONFIG = {
  ALLOWED_TAGS: [
    "p", "br", "strong", "b", "em", "i", "u", "s", "strike",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "blockquote",
    "a", "span", "div",
    "iframe", "img",
  ],
  ALLOWED_ATTR: [
    "href", "target", "rel",
    "src", "alt", "title", "width", "height",
    "class", "style",
    "frameborder", "allow", "allowfullscreen",
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/|#)/i,
  ADD_ATTR: ["target"],
};

export function sanitizeRichHtml(dirty) {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, CONFIG);
}

// Detects if a string contains HTML tags (so we know to render rich vs plain text).
export function containsHtml(str) {
  if (!str) return false;
  return /<\/?[a-z][\s\S]*>/i.test(str);
}