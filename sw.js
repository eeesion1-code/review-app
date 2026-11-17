// 只缓存网页外壳（断网也能打开）；数据每次都从网上读，读不到时网页显示上次的数据（同 空桌一览 的做法）
const V = 'qrreview-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;   // 数据接口不经过缓存
  if (u.pathname.endsWith('/sw.js')) return;
  const net = fetch(e.request, { cache: 'no-cache' }).then(r => {
    if (r && r.ok) { const copy = r.clone(); caches.open(V).then(c => c.put(e.request, copy)); }
    return r;
  });
  e.waitUntil(net.then(() => {}, () => {}));
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => {
    if (!hit) return net.catch(() => caches.match('./index.html'));
    return Promise.race([net.catch(() => hit), new Promise(res => setTimeout(() => res(hit), 1500))]);
  }));
});
