/* sw.js — FIT Booker service worker.
 * NETWORK-FIRST for every same-origin GET: each launch tries the network so the newest
 * deploy always wins, caches what it got, and only falls back to cache when offline.
 * Deliberately not cache-first — that is what pins a home-screen app to a stale shell
 * forever, and this app changes often.
 * Modelled on the NRL Tips worker, which keeps that app auto-updating and offline-capable.
 */
const CACHE = 'fit-booker-v7';   // v7: four-week planning, rolling date strip, states not stopwatches
const CORE = ['./', './index.html', './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE).catch(() => {})));
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // never touch the GitHub API
  const key = url.origin + url.pathname;
  e.respondWith((async () => {
    try {
      const fresh = await fetch(req, { cache: 'no-store' });
      if (fresh && fresh.ok) (await caches.open(CACHE)).put(key, fresh.clone());
      return fresh;
    } catch (err) {
      const cached = (await caches.match(key)) ||
                     (await caches.match(req, { ignoreSearch: true }));
      if (cached) return cached;
      if (req.mode === 'navigate') {
        const shell = await caches.match(url.origin + url.pathname.replace(/[^/]*$/, 'index.html'));
        if (shell) return shell;
      }
      throw err;
    }
  })());
});
