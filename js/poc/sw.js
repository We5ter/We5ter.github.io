self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('fox-store').then((cache) => cache.addAll([
      'https://mdn.github.io/pwa-examples/a2hs/',
      'https://mdn.github.io/pwa-examples/a2hs/index.html',
      'https://mdn.github.io/pwa-examples/a2hs/index.js',
      'https://mdn.github.io/pwa-examples/a2hs/style.css',
      'https://mdn.github.io/pwa-examples/a2hs/images/fox1.jpg',
      'https://mdn.github.io/pwa-examples/a2hs/images/fox2.jpg',
      'https://mdn.github.io/pwa-examples/a2hs/images/fox3.jpg',
      'https://mdn.github.io/pwa-examples/a2hs/images/fox4.jpg',
    ])),
  );
});

self.addEventListener('fetch', (e) => {
  console.log(e.request.url);
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request)),
  );
});
