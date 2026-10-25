var CACHE_VERSION = 'v1';
var CACHE_NAME = 'fccquote-' + CACHE_VERSION;
var SHELL = [
  '/',
  '/style.css',
  '/client.js',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];
var CDN_ASSETS = ['https://code.jquery.com/jquery-2.2.1.min.js'];
var CDN_HOSTS = ['code.jquery.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
    return cache.addAll(SHELL).then(function () {
      return Promise.all(CDN_ASSETS.map(function (url) {
        return cache.add(new Request(url, { mode: 'cors' })).catch(function () {});
      }));
    });
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) {
      return key.indexOf('fccquote-') === 0 && key !== CACHE_NAME;
    }).map(function (key) { return caches.delete(key); }));
  }).then(function () { return self.clients.claim(); }));
});

function networkFirst(request, fallbackKey) {
  return fetch(request).then(function (response) {
    if (response && response.ok) {
      var copy = response.clone();
      caches.open(CACHE_NAME).then(function (cache) { cache.put(fallbackKey || request, copy); });
    }
    return response;
  }).catch(function () {
    return caches.match(fallbackKey || request).then(function (cached) {
      return cached || Response.error();
    });
  });
}

function cacheFirst(request) {
  return caches.match(request).then(function (cached) {
    if (cached) return cached;
    return fetch(request).then(function (response) {
      if (response && (response.ok || response.type === 'opaque')) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
      }
      return response;
    });
  });
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  var url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    if (CDN_HOSTS.indexOf(url.hostname) !== -1) event.respondWith(cacheFirst(request));
    return;
  }
  if (url.pathname === '/generate') return;
  if (request.mode === 'navigate' && url.pathname === '/') {
    event.respondWith(networkFirst(request, '/'));
  } else if (url.pathname === '/responses' || SHELL.indexOf(url.pathname) !== -1) {
    event.respondWith(networkFirst(request));
  }
});
