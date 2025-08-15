// Minimal service worker: no caching logic
self.addEventListener('install', (event) => {
  // Activate worker immediately after installation
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Become available to all pages
  self.clients.claim();
});

// Optional no-op fetch handler to satisfy some audit tools
self.addEventListener('fetch', (event) => {
  // Intentionally left blank – no caching or response manipulation
});
