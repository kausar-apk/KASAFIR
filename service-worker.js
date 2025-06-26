const CACHE_NAME = "kasafir-v1";
const urlsToCache = [
  "index.html",
  "style.css",
  "main.js",
  "manifest.json",
  "img/icon-mangga.png",
  "img/icon-mangga-192.png", 
  "img/icon-mangga-512.png"  
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    )
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(
      response => response || fetch(event.request)
    )
  );
});
