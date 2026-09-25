const CACHE = 'mahjong-v8';   // v8: 自動保存・打ち方の設定・ルール（途中流局・流し満貫・パオ・西入・東風戦）
const ASSETS = [
  './', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png', './icon-512-maskable.png',
  './apple-touch-icon.png', './favicon-32.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // 別ドメイン（CDNの通信部品・接続の仲介サーバー）はキャッシュせず、そのまま通す
  if (url.origin !== self.location.origin) return;
  const isHTML = e.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
  if (isHTML) {
    // HTMLは常に最新をサーバーから（オフライン時のみキャッシュ）
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' }).then(resp => {
        if (resp.ok) { const cp = resp.clone(); caches.open(CACHE).then(c => c.put('./index.html', cp)); }
        return resp;
      }).catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }
  // その他アセットはキャッシュ優先＋裏で更新
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      if (!resp.ok) return resp;
      const cp = resp.clone();
      caches.open(CACHE).then(c => c.put(e.request, cp));
      return resp;
    }))
  );
});
