const CACHE_NAME = 'hihired-v6-2026-02-14';
const urlsToCache = [
  '/',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // Skip service worker for API calls, navigation, POST requests, and JS/CSS files
  if (event.request.url.includes('/api/') ||
      event.request.mode === 'navigate' ||
      event.request.method !== 'GET' ||
      event.request.url.includes('.js') ||
      event.request.url.includes('.css')) {
    return;
  }

  event.respondWith(
    // Network first, fallback to cache strategy
    fetch(event.request)
      .then(response => {
        // Clone the response before caching
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        // If network fails, try cache; return network error if no cache match
        return caches.match(event.request).then(cached => {
          return cached || new Response('Offline', { status: 503 });
        });
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 