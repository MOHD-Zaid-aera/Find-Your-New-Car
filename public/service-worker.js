var CACHE = "carbuy-v18";
var STATIC_ASSETS = [
  "/",
  "/index.html",
  "/product.html",
  "/compare.html",
  "/styles.css",
  "/app.js",
  "/admin.js",
  "/product.js",
  "/compare.js",
  "/auth-modal.js",
  "/images/car-placeholder.svg",
  "/images/logo.svg",
  "/images/pwa-icon.svg"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
          .map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(e.request).catch(function () { return caches.match(e.request); })
    );
    return;
  }
  if (["/admin", "/admin.html", "/login.html"].indexOf(url.pathname) !== -1) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      if (hit) return hit;
      return fetch(e.request).then(function (res) {
        if (res.ok && !res.redirected) {
          var copy = res.clone();
          caches.open(CACHE).then(function (cache) { cache.put(e.request, copy); });
        }
        return res;
      });
    })
  );
});