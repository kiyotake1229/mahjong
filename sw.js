const CACHE = 'mahjong-v9';   // v9: アプリ以外のページ（サポート・紹介）を開くと、アプリ本体の控えをそのページで上書きしていた不具合の修正。上書きされた古い控えを捨てるため名前を更新
const ASSETS = [
  './', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png', './icon-512-maskable.png',
  './apple-touch-icon.png', './favicon-32.png'
];
// アプリ本体の場所（公開先では /mahjong/ と /mahjong/index.html）。ほかのHTML（support.html・about/ など）は、そのページのURLで別に控える
const SCOPE = new URL('./', self.location).pathname;
const isAppPage = p => p === SCOPE || p === SCOPE + 'index.html';
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
  const isHTML = e.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');
  if (isHTML) {
    // HTMLは常に最新をサーバーから（オフライン時のみキャッシュ）。アプリ本体は './index.html'、ほかのページはそれぞれのURLで控える
    const app = isAppPage(url.pathname);
    const key = app ? './index.html' : url.origin + url.pathname;
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' }).then(resp => {
        if (resp.ok) { const cp = resp.clone(); caches.open(CACHE).then(c => c.put(key, cp)); }
        return resp;
      }).catch(() => caches.match(key).then(r => r || (app ? caches.match('./') : undefined)).then(r => r || Response.error()))
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
