// OrientationBF Service Worker for local offline consultation
const CACHE_NAME = 'orientationbf-cache-v1';

// Assets to cache immediately on installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
  '/favicon.ico',
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets...');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Intercept networks
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests (e.g., Firestore POST/socket calls, analytics)
  if (request.method !== 'GET') {
    return;
  }

  // Handle caching strategy: Stale-While-Revalidate for app assets and static files
  // This ensures quick load while fetching updates in the background.
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch a fresh version in the background and update the cache
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse);
            });
          }
        }).catch(() => {
          /* Ignore background fetch failures e.g., when offline */
        });
        
        return cachedResponse;
      }

      // If not in cache, fallback to normal network request
      return fetch(request).then((networkResponse) => {
        // Cache successful static responses (e.g., images from unsplash or assets)
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (url.origin === self.location.origin || url.hostname.includes('unsplash.com') || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((error) => {
        // If network fails and request is for index/HTML navigation, fallback to root cached index.html
        if (request.mode === 'navigate') {
          return caches.match('/index.html') || caches.match('/');
        }
        
        // Return blank or let failure happen for non-essential queries
        throw error;
      });
    })
  );
});

// Listener for skipWaiting/update messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
