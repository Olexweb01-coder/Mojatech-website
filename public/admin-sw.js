/* MOJATECH Admin service worker. Scope: /admin.
 *
 * What it does, and deliberately no more:
 *   - The app's code files (/_next/static, which never change once built) are kept
 *     on the phone, so the app opens instantly after the first visit.
 *   - Pages and data always come fresh from the server. Nothing signed-in is ever
 *     stored on the device.
 *   - With no connection, a branded offline screen is shown instead of the
 *     browser's error page.
 *   - Phone alerts (push): new enquiries, reminders, nudges, the morning briefing.
 */
const VERSION = "mj-admin-v2";
const SHELL = ["/admin-offline.html", "/admin-icon-192.png", "/admin-badge.png", "/brand/mojatech-mark.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("mj-admin-") && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.registration.navigationPreload?.enable())
      .then(() => self.clients.claim()),
  );
});

/* While developing (npm run dev), code files change constantly: nothing is cached. */
const DEV = new URL(self.location.href).searchParams.has("dev");

self.addEventListener("fetch", (e) => {
  if (DEV) return;
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  /* Built code: cache first. File names change with every deploy, so a cached
     file is never out of date. */
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/admin-icon") || url.pathname.startsWith("/brand/")) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      })),
    );
    return;
  }

  /* Opening a page: always the network (with navigation preload so it is not
     slowed down by this worker), and the offline screen only if that fails. */
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      try {
        const preloaded = await e.preloadResponse;
        if (preloaded) return preloaded;
        return await fetch(req);
      } catch {
        return (await caches.match("/admin-offline.html")) || Response.error();
      }
    })());
  }
});

/* ---------- Alerts ---------- */

self.addEventListener("push", (e) => {
  let n = {};
  try { n = e.data ? e.data.json() : {}; } catch { n = { title: "MOJATECH Admin", body: e.data ? e.data.text() : "" }; }
  const title = n.title || "MOJATECH Admin";
  const options = {
    body: n.body || "",
    icon: "/admin-icon-192.png",
    badge: "/admin-badge.png",
    tag: n.tag || undefined,
    renotify: Boolean(n.tag),
    data: { url: n.url || "/admin" },
    /* Alarms stay on screen until dismissed and vibrate longer. */
    requireInteraction: Boolean(n.alarm),
    vibrate: n.alarm ? [400, 200, 400, 200, 400, 200, 800] : [120, 60, 120],
    silent: false,
    timestamp: Date.now(),
  };
  e.waitUntil(Promise.all([
    self.registration.showNotification(title, options),
    typeof n.badge === "number" && self.navigator.setAppBadge ? self.navigator.setAppBadge(n.badge).catch(() => {}) : Promise.resolve(),
  ]));
});

/* Tapping an alert opens the right screen, reusing the app if it is already open. */
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "/admin", self.location.origin).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of wins) {
      if (new URL(w.url).pathname.startsWith("/admin")) {
        await w.focus();
        if ("navigate" in w) await w.navigate(url).catch(() => {});
        return;
      }
    }
    await self.clients.openWindow(url);
  })());
});

/* If the phone renews the subscription, save the new one. */
self.addEventListener("pushsubscriptionchange", (e) => {
  e.waitUntil((async () => {
    try {
      const r = await fetch("/admin/api/push", { credentials: "include" });
      const { publicKey } = await r.json();
      const key = Uint8Array.from(atob(publicKey.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((publicKey.length + 3) % 4)), (c) => c.charCodeAt(0));
      const sub = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      await fetch("/admin/api/push", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription: sub.toJSON() }) });
    } catch { /* the person can switch alerts on again from the app */ }
  })());
});
