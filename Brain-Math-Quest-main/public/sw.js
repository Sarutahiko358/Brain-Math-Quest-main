/* Minimal PWA Service Worker with stale-while-revalidate for app shell */
// Bump version to invalidate old caches that may hold stale HTML/JS
const CACHE_NAME = 'dq-numtrain-v3';
const APP_SHELL = [
  // Note: We no longer pre-cache '/' to avoid serving stale HTML that points
  // to outdated chunk names. The HTML will still be cached on first
  // successful navigation by the handler below.
  '/favicon.ico',
  '/manifest.webmanifest',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => k === CACHE_NAME ? null : caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// メッセージで即時更新
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);
  // ページ遷移（document）リクエストはネットワーク優先、失敗時にルートへフォールバック
  if (request.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = await fetch(request);
        // 最新のHTMLをキャッシュにも保存（オフライン時のフォールバック用）
        try {
          const cache = await caches.open(CACHE_NAME);
          // ルートに正規化して保存（/path も index として扱う場合は要拡張）
          await cache.put('/', res.clone());
        } catch {}
        return res;
      } catch {
        // オフライン等で取得できない場合はキャッシュ済みのルートへフォールバック
        const cached = await caches.match('/');
        return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })());
    return;
  }
  // 画像や静的アセットはキャッシュ優先
  if (request.method === 'GET' && (
      url.pathname.startsWith('/_next/') ||
      url.pathname.startsWith('/images/') ||
      url.pathname.startsWith('/public/') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.jpeg') ||
      url.pathname.endsWith('.svg')
    )) {
    e.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request).then((res) => {
          cache.put(request, res.clone());
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // それ以外はネットワーク優先 + フォールバック
  e.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
