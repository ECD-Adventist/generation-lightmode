import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getLanguage } from "../LanguageSelector";

/**
 * AutoTranslator
 * --------------
 * Walks the DOM, collects visible English text nodes + key attributes
 * (placeholder, title, aria-label, alt, value on buttons), batches them,
 * sends to the LLM, caches results in localStorage, and swaps the text
 * in place. Re-runs on route change, language change, and DOM mutations.
 *
 * Languages other than "en" trigger translation. "en" restores originals.
 */

const LANG_NAMES = {
  en: "English",
  sw: "Kiswahili (Swahili)",
  fr: "French",
  ln: "Lingala",
  rw: "Kinyarwanda",
  ar: "Arabic",
  am: "Amharic",
  rn: "Kirundi",
  pt: "Portuguese",
  so: "Somali",
  ti: "Tigrinya",
  nus: "Nuer (Thok Naath)",
  lg: "Luganda",
};

const CACHE_PREFIX = "glm_tr_cache_v1_";
const ORIGINAL_ATTR = "data-glm-original";
const TRANSLATED_ATTR = "data-glm-translated-lang";
const SKIP_SELECTOR = "[data-no-translate], code, pre, script, style, textarea, input";

// Skip text shorter than this (single chars, numbers, emojis only) and pure numbers/symbols.
function shouldTranslate(text) {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length < 2) return false;
  // Skip if no letter characters at all (numbers, symbols, emojis only).
  if (!/[a-zA-Z]/.test(trimmed)) return false;
  return true;
}

function getCache(lang) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + lang);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCache(lang, cache) {
  try {
    localStorage.setItem(CACHE_PREFIX + lang, JSON.stringify(cache));
  } catch {
    // Quota exceeded — ignore.
  }
}

function collectTextNodes(root) {
  const items = []; // { node, original, kind: 'text' | 'attr', attr? }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest(SKIP_SELECTOR)) return NodeFilter.FILTER_REJECT;
      if (!shouldTranslate(node.nodeValue)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n;
  while ((n = walker.nextNode())) {
    const original = n.parentElement.getAttribute(ORIGINAL_ATTR + "-text") || n.nodeValue;
    items.push({ node: n, original, kind: "text" });
  }

  // Attributes: placeholder, title, aria-label, alt
  const attrEls = root.querySelectorAll("[placeholder], [title], [aria-label], [alt]");
  attrEls.forEach((el) => {
    if (el.closest(SKIP_SELECTOR)) return;
    ["placeholder", "title", "aria-label", "alt"].forEach((attr) => {
      const val = el.getAttribute(attr);
      if (!shouldTranslate(val)) return;
      const storeKey = `${ORIGINAL_ATTR}-${attr}`;
      const original = el.getAttribute(storeKey) || val;
      items.push({ node: el, original, kind: "attr", attr, storeKey });
    });
  });

  return items;
}

async function translateBatch(texts, targetLang) {
  if (texts.length === 0) return {};
  const targetName = LANG_NAMES[targetLang] || targetLang;

  // Build a stable numbered list so the model returns aligned indexes.
  const numbered = texts.map((t, i) => `${i}: ${t}`).join("\n");

  const prompt = `Translate the following UI strings from English to ${targetName}.
Return a JSON object with key "translations" — an array where each item has "i" (index) and "t" (translated text).
Keep emojis, numbers, brand names ("LightMode", "GlowGroup", "Generation LightMode", "ECD"), URLs, and hashtags intact.
Preserve punctuation, leading/trailing whitespace, and arrows like → unchanged.
Translate naturally — do not add explanations.

STRINGS:
${numbered}`;

  const res = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        translations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              i: { type: "number" },
              t: { type: "string" },
            },
            required: ["i", "t"],
          },
        },
      },
      required: ["translations"],
    },
  });

  const map = {};
  (res?.translations || []).forEach((entry) => {
    if (typeof entry.i === "number" && typeof entry.t === "string") {
      map[texts[entry.i]] = entry.t;
    }
  });
  return map;
}

export default function AutoTranslator() {
  const location = useLocation();
  const [language, setLanguage] = useState(() => getLanguage());
  const runIdRef = useRef(0);
  const inFlightRef = useRef(false);

  // Listen to language changes
  useEffect(() => {
    const onLang = (e) => setLanguage(e.detail || getLanguage());
    const onStorage = () => setLanguage(getLanguage());
    window.addEventListener("languageChange", onLang);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("languageChange", onLang);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const myRun = ++runIdRef.current;

    // Restore originals first if present
    const restoreAll = () => {
      // Restore text nodes — find elements that stored originals
      document.querySelectorAll(`[${ORIGINAL_ATTR}-text]`).forEach((el) => {
        const orig = el.getAttribute(`${ORIGINAL_ATTR}-text`);
        // Only restore if element has a single text node — best-effort
        if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
          el.childNodes[0].nodeValue = orig;
        }
      });
      ["placeholder", "title", "aria-label", "alt"].forEach((attr) => {
        document.querySelectorAll(`[${ORIGINAL_ATTR}-${attr}]`).forEach((el) => {
          const orig = el.getAttribute(`${ORIGINAL_ATTR}-${attr}`);
          el.setAttribute(attr, orig);
        });
      });
      document.documentElement.removeAttribute(TRANSLATED_ATTR);
    };

    if (language === "en") {
      restoreAll();
      return;
    }

    // Already translated to this lang? Just re-apply from cache for new DOM.
    const run = async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        // small delay to let route render
        await new Promise((r) => setTimeout(r, 350));
        if (myRun !== runIdRef.current) return;

        const items = collectTextNodes(document.body);
        if (items.length === 0) return;

        const cache = getCache(language);
        const uniqueOriginals = Array.from(new Set(items.map((it) => it.original)));
        const missing = uniqueOriginals.filter((t) => !cache[t]);

        if (missing.length > 0) {
          // Batch into chunks of ~60 strings to keep prompts manageable.
          const CHUNK = 60;
          for (let i = 0; i < missing.length; i += CHUNK) {
            if (myRun !== runIdRef.current) return;
            const chunk = missing.slice(i, i + CHUNK);
            try {
              const result = await translateBatch(chunk, language);
              Object.assign(cache, result);
              saveCache(language, cache);
            } catch (err) {
              // If LLM fails, skip this chunk silently.
              console.warn("AutoTranslator chunk failed:", err);
            }
          }
        }

        if (myRun !== runIdRef.current) return;

        // Apply translations
        items.forEach((it) => {
          const translated = cache[it.original];
          if (!translated) return;
          if (it.kind === "text") {
            const el = it.node.parentElement;
            if (!el) return;
            // Store original on parent for restore
            if (!el.hasAttribute(`${ORIGINAL_ATTR}-text`)) {
              el.setAttribute(`${ORIGINAL_ATTR}-text`, it.original);
            }
            it.node.nodeValue = translated;
          } else if (it.kind === "attr") {
            if (!it.node.hasAttribute(it.storeKey)) {
              it.node.setAttribute(it.storeKey, it.original);
            }
            it.node.setAttribute(it.attr, translated);
          }
        });

        document.documentElement.setAttribute(TRANSLATED_ATTR, language);
      } finally {
        inFlightRef.current = false;
      }
    };

    run();

    // Re-run on DOM mutations (debounced) to catch lazy-loaded content
    let mutationTimer = null;
    const observer = new MutationObserver(() => {
      if (mutationTimer) clearTimeout(mutationTimer);
      mutationTimer = setTimeout(() => {
        if (myRun === runIdRef.current && language !== "en") {
          run();
        }
      }, 800);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: false });

    return () => {
      observer.disconnect();
      if (mutationTimer) clearTimeout(mutationTimer);
    };
  }, [language, location.pathname]);

  return null;
}