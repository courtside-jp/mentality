const CACHE = 'courtside-v1';
const STATIC = [
  '/mentality/',
  '/mentality/index.html',
  '/mentality/js/articles.js',
  '/mentality/js/sneakers.js',
  '/mentality/js/home.js',
  '/mentality/js/stats.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});