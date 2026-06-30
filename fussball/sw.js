/* GBO Trainingsportal – Service Worker
   Macht das Portal offline nutzbar. Eigener Cache-Name, damit es sich
   NICHT mit anderen Apps (z. B. Sıla Yolu) überschneidet. */
const CACHE = 'gbo-portal-2026-v2';

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
  // Jede Datei einzeln cachen: schlägt eine fehl, bricht NICHT der ganze
  // Vorgang ab – die wichtige index.html landet trotzdem im Cache.
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(
      ASSETS.map((u) => cache.add(new Request(u, { cache: 'reload' })))
    );
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith('gbo-portal-') && k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Netz zuerst (frische Inhalte), bei Offline aus dem Cache.
// Navigations-Anfragen fallen auf index.html zurück.
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
