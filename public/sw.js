// Generation LightMode service worker.
//
// IMPORTANT: /auth/* is served by the Base44 platform, NOT by this SPA.
// The service worker must never intercept, cache, or shell-fallback those
// requests — doing so serves the cached SPA index.html at /auth/login, which
// renders a blank page (the app has no /auth/login route, and a stale asset
// hash leaves #root empty). Same applies to /api/*.

const CACHE_NAME = "lightmode-shell-v5";
const SHELL_URL = "/";

// Paths the service worker must stay completely out of.
const BYPASS_PREFIXES = ["/auth", "/api", "/login", "/logout", "/oauth"];
const DEV_PREFIXES = ["/src", "/node_modules/.vite", "/@vite", "/@react-refresh"];

function shouldBypass(url) {
  return BYPASS_PREFIXES.some(
    (prefix) => url.pathname === prefix || url.pathname.startsWith(prefix + "/")
  );
}

function shouldUseNetworkOnly(request, url) {
  return DEV_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
    || request.destination === "script"
    || request.destination === "style"
    || url.pathname.endsWith(".js")
    || url.pathname.endsWith(".css");
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(SHELL_URL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Only same-origin requests, and never auth/api routes.
  if (url.origin !== self.location.origin) return;
  if (shouldBypass(url)) return;

  // Never cache development modules or executable/style bundles. This prevents
  // mixed React runtimes after deployments and during Vite hot reloads.
  if (shouldUseNetworkOnly(request, url)) {
    event.respondWith(fetch(request));
    return;
  }

  // Page navigations: network-first, fall back to the cached shell only offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(SHELL_URL, copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(SHELL_URL).then((cached) => cached || Response.error()))
    );
    return;
  }

  // Non-executable static assets: cache-first, refresh in the background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
