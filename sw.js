// FamilyOS — Service Worker v4 (version app: 2.1.0)
const APP_VERSION  = '2.1.0';
const CACHE_NAME   = 'familyos-v4-' + APP_VERSION;
const ASSETS = [
  './FamilyOS.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(e) {
  console.log('[SW] Install v' + APP_VERSION);
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) { return cache.addAll(ASSETS); })
      .then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e) {
  console.log('[SW] Activate v' + APP_VERSION);
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.hostname !== location.hostname &&
      !url.hostname.includes('localhost') &&
      !url.hostname.includes('github.io')) return;
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        if (response.ok && url.origin === location.origin) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
        }
        return response;
      }).catch(function() { return caches.match('./FamilyOS.html'); });
    })
  );
});

self.addEventListener('message', function(e) {
  if (e.data === 'skipWaiting') self.skipWaiting();
  if (e.data === 'getVersion') e.source.postMessage({type:'version', version:APP_VERSION});
});
