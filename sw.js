// FamilyOS — Service Worker v3
const CACHE_NAME = 'familyos-v3';
const ASSETS = [
  './FamilyOS.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Installation — mise en cache des ressources
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activation — nettoyer les anciens caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch — stratégie Cache-first avec fallback réseau
self.addEventListener('fetch', function(e) {
  // Ignorer les requêtes non-GET et les requêtes vers d'autres origines
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        // Mettre en cache les nouvelles ressources locales
        if (response.ok && url.origin === location.origin) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function() {
        // Hors ligne — retourner l'app principale
        return caches.match('./FamilyOS.html');
      });
    })
  );
});

// Message pour forcer la mise à jour
self.addEventListener('message', function(e) {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
