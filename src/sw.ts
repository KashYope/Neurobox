/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any };

clientsClaim();
self.skipWaiting();

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

const apiBgSync = new BackgroundSyncPlugin('syncServiceQueue', {
  maxRetentionTime: 24 * 60
});

registerRoute(
  ({ url, request }) => request.method === 'GET' && url.pathname.startsWith('/api'),
  new NetworkFirst({
    cacheName: 'api-runtime-cache',
    networkTimeoutSeconds: 10,
    plugins: [apiBgSync]
  })
);

registerRoute(
  ({ request }) => request.destination === 'document' || request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'shell-cache'
  })
);

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

export {};
