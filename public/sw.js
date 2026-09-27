/* MOJATECH: a deliberately small service worker.
 * Pages are always fetched fresh; the cache is only a fallback for when the phone
 * is offline, so nobody ever sees an out-of-date price. */
const CACHE = "mojatech-v1";
const OFFLINE = ["/", "/products", "/icon-192.png"];   /* never the admin */

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(OFFLINE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  /* The admin is never cached: signed-in pages must not sit on the device. */
  if (url.pathname.startsWith("/admin")) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((hit) => hit || caches.match("/"))),
  );
});
