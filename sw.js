// Minimal Service Worker to satisfy PWA installability requirements
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Pass through all requests. 
  // In a full production app, you would cache assets here.
  event.respondWith(fetch(event.request));
});