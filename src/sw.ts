/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute, setCatchHandler, setDefaultHandler } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate, CacheFirst, NetworkOnly } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any };

clientsClaim();
self.skipWaiting();

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

const apiBgSync = new BackgroundSyncPlugin('syncServiceQueue', {
  maxRetentionTime: 24 * 60
});

// Cache API requests with network-first strategy
registerRoute(
  ({ url, request }) => request.method === 'GET' && url.pathname.startsWith('/api'),
  new NetworkFirst({
    cacheName: 'api-runtime-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      apiBgSync,
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60 // 24 hours
      })
    ]
  })
);

// Cache external CDN resources (fonts, scripts, etc.)
registerRoute(
  ({ url }) => 
    url.origin === 'https://cdn.tailwindcss.com' ||
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com' ||
    url.origin === 'https://aistudiocdn.com' ||
    url.origin === 'https://cdnjs.buymeacoffee.com',
  new StaleWhileRevalidate({
    cacheName: 'external-resources',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      })
    ]
  })
);

// Cache images with cache-first strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      })
    ]
  })
);

// Cache app shell with stale-while-revalidate
registerRoute(
  ({ request }) => request.destination === 'document' || request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'shell-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
);

// Cache locale files with stale-while-revalidate for instant language switching
// Only caches files that are actually requested (lazy loading)
registerRoute(
  ({ url }) => url.pathname.startsWith('/locales/'),
  new StaleWhileRevalidate({
    cacheName: 'locale-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 10, // 5 languages × 2 namespaces
        maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
      })
    ]
  })
);

// Fallback handler for offline scenarios
setCatchHandler(async ({ event }) => {
  // For navigation requests, return the cached index page
  if (event.request.destination === 'document') {
    const cache = await caches.open('shell-cache');
    const cachedResponse = await cache.match('/index.html');
    return cachedResponse || Response.error();
  }

  // For other requests, return a network error
  return Response.error();
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data === 'syncService' && 'sync' in self.registration) {
    event.waitUntil(self.registration.sync.register('syncService'));
  }
});

self.addEventListener('sync', event => {
  if (event.tag === 'syncService') {
    event.waitUntil(apiBgSync.replayRequests());
  }
});

// Install event - cache essential resources immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('shell-cache').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html'
      ]);
    })
  );
});

export {};
