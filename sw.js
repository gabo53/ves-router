// Service worker — network-first for the app shell.
// Always loads the newest version when online; cache is only an offline fallback.
// Bump CACHE on every change so old caches are cleared on activate.
const CACHE = 'ves-router-v6';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // live rate APIs: never touch, always go to network
  if (url.hostname.endsWith('usdt.com.ve') || url.hostname.endsWith('saldo.com.ar')) return;
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  // network-first: fetch fresh, update cache, fall back to cache only when offline
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return resp;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
