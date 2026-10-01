/* Service worker : l'app s'ouvre même sans réseau (dans l'arena, le réseau sature).
   - fichiers de l'app : mis en cache à l'installation
   - pages du site (API) : réseau d'abord, dernière version en cache si pas de réseau */
var VERSION = "gp-aura-v6";
var SHELL = ["./", "index.html", "app.js", "config.js", "manifest.webmanifest",
  "logo_white.png", "stripes.png", "arena.jpg",
  "icon-192.png", "icon-512.png", "guide-partenaires.html"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.searchParams.has("password")) return;               // jamais de cache pour la vérification du code
  var network = fetch(req).then(function (res) {
    if (res.ok && (url.origin === location.origin || url.pathname.indexOf("/wp-json/") > -1 || /\.(png|jpe?g|webp|svg|woff2?)$/.test(url.pathname))) {
      var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); });
    }
    return res;
  });
  e.respondWith(network.catch(function () { return caches.match(req, { ignoreSearch: url.origin === location.origin }); }));
});
