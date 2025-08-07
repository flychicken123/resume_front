const CACHE_NAME = 'hihired-v2';
const urlsToCache = [
  '/',
  '/static/js/main.bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // Skip service worker for API calls
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // If it's a navigation request, always try network first
        if (event.request.mode === 'navigate') {
          return fetch(event.request)
            .then(response => {
              // If the fetch fails, return the cached version
              if (!response || response.status !== 200) {
                return caches.match('/');
              }
              return response;
            })
            .catch(() => {
              // If network fails, return the cached home page
              return caches.match('/');
            });
        }
        
        // For other requests, return cached version or fetch from network
        return response || fetch(event.request);
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