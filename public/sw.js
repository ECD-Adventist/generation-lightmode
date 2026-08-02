// Generation LightMode PWA Service Worker
// Brand Colors: Gold #FFD000, Cyan #00CFFF, Violet #8A5CFF, Dark #0A0A0A
// Supports offline access with network-first page strategy & cache-first assets.
const CACHE = "lightmode-v2";
const OFFLINE_URL = "/";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never cache cross-origin/API calls

  // Navigations: network-first so content/stats stay fresh, cached shell as offline fallback.
  // Note: fetch(event.request) throws in WebKit for mode "navigate" requests — refetch by URL instead.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request.url, { credentials: "same-origin" })
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(OFFLINE_URL, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(OFFLINE_URL);
          return cached || new Response("Offline", { status: 503, statusText: "Offline" });
        })
    );
    return;
  }

  // Static assets (css/js/images/icons): cache-first, refresh in background.
  if (/\.(?:css|js|png|jpg|jpeg|svg|webp|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request)
            .then((response) => {
              cache.put(request, response.clone());
              return response;
            })
            .catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
  }
});
