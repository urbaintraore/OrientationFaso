// OrientationBF Service Worker - Kill-Switch to clear stale caches and restore normal network behavior
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      // Reload all open pages to apply the update immediately
      return self.clients.matchAll({ type: 'window' });
    }).then((clients) => {
      clients.forEach((client) => {
        try {
          client.navigate(client.url);
        } catch (err) {
          console.error('[Service Worker] Failed to auto-reload client:', err);
        }
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Pass-through directly to the network without caching anything
  event.respondWith(fetch(event.request));
});

