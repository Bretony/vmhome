const cacheName = 'sparky-vmhome-v10';;
const assets = [
  './',
  'index.html',
  'style.css',
  'script.js',
  'playlist.json',
  'manifest.json',
  '768.jpg',
  'background.jpg',
  'icon-192.png',
  'icon-512.png'
];

// 1. Instalare și forțare activare imediată
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(assets);
    })
  );
});

// 2. Șterge automat versiunile vechi de cache (ex: sparky-v11)
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== cacheName).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Strategia "Network First": ia mereu ultima versiune de pe GitHub, iar dacă nu ai net, folosește cache-ul
self.addEventListener('fetch', e => {
  // Ignorăm cererile către alte domenii sau videoclipuri mari streaming
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then(networkResponse => {
        // Salvăm copia nouă în cache pentru data viitoare
        const responseClone = networkResponse.clone();
        caches.open(cacheName).then(cache => {
          cache.put(e.request, responseClone);
        });
        return networkResponse;
      })
      .catch(() => {
        // Dacă telefonul este offline, servim din cache
        return caches.match(e.request);
      })
  );
});
