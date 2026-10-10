/* NeuroDrive PWA. Authenticated screens and user data are deliberately never cached. */
const CACHE_NAME = "neurodrive-static-v1";
const OFFLINE_URL = "/offline.html";
const STATIC_SUPPORT = [OFFLINE_URL, "/neurodrive-login-brand.svg", "/enat-logo.png"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_SUPPORT)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("neurodrive-static-") && key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  // Never cache API/auth responses, HTML navigations, or app state.
  if (url.pathname.startsWith("/api/") || /auth|supabase/i.test(url.pathname)) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => (await caches.match(OFFLINE_URL)) || Response.error()));
    return;
  }
  if (STATIC_SUPPORT.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
  }
});
