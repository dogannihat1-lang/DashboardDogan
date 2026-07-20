/* Agentur-Cockpit – Service Worker
   Eigenständig: eigener Cache-Name, Geltungsbereich nur /agentur/.
   Berührt Sıla Yolu oder GBO-Trainer-Tool NICHT. */
const CACHE = 'agentur-cockpit-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        // Nur eigene alte Caches aufräumen – fremde Apps unangetastet lassen.
        keys.filter((k) => k.startsWith('agentur-cockpit-') && k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Netz zuerst (frische Inhalte), bei Offline aus dem Cache.
// Fallback nur auf DIESE App (./index.html) – nie auf eine fremde App.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || caches.match('./index.html'))
      )
  );
});
