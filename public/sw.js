// Cleanup Service Worker - removes old Workbox caches from VitePWA
// and acts as a simple pass-through SW.

self.addEventListener('install', (event) => {
  // Immediately take over from old Workbox SW
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Delete ALL caches left by the old Workbox/VitePWA service worker
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Do NOT intercept any fetch requests - let the browser/server handle everything
// This is critical for SSR apps where HTML must always come from the server
self.addEventListener('fetch', (event) => {
  // Pass through - do nothing, let the browser handle it normally
  return;
});
