const CACHE_NAME = "evergreen-trade-journal-v54";
const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css?v=54",
  "./supabase-config.js?v=54",
  "./supabase-sync.js?v=51",
  "./app.js?v=54",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/instruments/eurusd.svg",
  "./icons/instruments/gbpusd.svg",
  "./icons/instruments/xauusd.svg",
  "./icons/instruments/usdjpy.svg",
  "./icons/instruments/gbpjpy.svg",
  "./icons/instruments/nas100.svg",
  "./icons/instruments/default.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const isLiveCode =
    event.request.mode === "navigate" ||
    event.request.destination === "style" ||
    event.request.destination === "script";

  if (isLiveCode) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }))
  );
});
