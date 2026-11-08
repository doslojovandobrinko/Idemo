const CACHE_VERSION = 'v7';
const STATIC_CACHE = `idemo-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `idemo-images-${CACHE_VERSION}`;
const FONT_CACHE = `idemo-fonts-${CACHE_VERSION}`;

const IS_DEV_OR_PREVIEW =
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1' ||
  self.location.hostname.includes('ais-dev-') ||
  self.location.hostname.includes('ais-pre-');

// Shell assets to cache immediately upon installation
const PRECACHE_ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'idemo_app_store_icon.svg'
];

// Helper to determine if a request qualifies for the font cache
const isFontRequest = (url, request) => {
  return (
    request.destination === 'font' ||
    url.host.includes('fonts.googleapis.com') ||
    url.host.includes('fonts.gstatic.com') ||
    url.pathname.match(/\.(woff|woff2|ttf|otf|eot)/i)
  );
};

// Helper to determine if a request qualifies for the image cache
const isImageRequest = (url, request) => {
  if (url.searchParams.has('import') || request.destination === 'script' || url.pathname.startsWith('/src/')) {
    return false;
  }
  return (
    request.destination === 'image' ||
    url.pathname.includes('/assets/images/') ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i)
  );
};

// Verify that a response actually contains image bytes and not an SPA HTML fallback
const isValidImageResponse = (response) => {
  if (!response || response.status !== 200) return false;
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  return contentType.startsWith('image/');
};

// Helper to check if asset name contains a build hash (Vite base64url / alphanumeric hashes)
const isImmutableAsset = (url) => {
  return url.pathname.match(/-[a-zA-Z0-9_-]{8,}\.(js|css|woff2|png|jpg|jpeg|webp)$/i);
};

// Install Event
self.addEventListener('install', (event) => {
  if (IS_DEV_OR_PREVIEW) {
    self.skipWaiting();
    return;
  }
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[IDEMO Service Worker] Pre-caching core application shell...');
      return cache.addAll(PRECACHE_ASSETS)
        .catch(err => console.error('[IDEMO Service Worker] Core precache failed:', err));
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up old caches from older versions
self.addEventListener('activate', (event) => {
  if (IS_DEV_OR_PREVIEW) {
    event.waitUntil(
      caches.keys()
        .then((cacheNames) => Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName))))
        .then(() => self.registration.unregister())
    );
    return;
  }
  const allowedCaches = [STATIC_CACHE, IMAGE_CACHE, FONT_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!allowedCaches.includes(cacheName)) {
            console.log('[IDEMO Service Worker] Removing obsolete cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  if (IS_DEV_OR_PREVIEW) return;

  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);

  // Bypass chrome-extension or other non-http schemes
  if (!requestUrl.protocol.startsWith('http')) return;

  // Bypass Vite dev paths, auth endpoints, and cross-origin API calls
  if (
    requestUrl.pathname.startsWith('/src/') ||
    requestUrl.pathname.startsWith('/@') ||
    requestUrl.pathname.startsWith('/node_modules/') ||
    requestUrl.pathname.startsWith('/__')
  ) {
    return;
  }

  // 1. FONTS: Cache-First Strategy (Fonts never change)
  if (isFontRequest(requestUrl, event.request)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(FONT_CACHE).then((cache) => {
              cache.put(event.request, cacheCopy);
            });
          }
          return networkResponse;
        }).catch(() => {
          return new Response('', { status: 404, statusText: 'Font unavailable' });
        });
      })
    );
    return;
  }

  // 2. IMAGES: Cache-First with Content-Type guard and Stale-while-revalidate
  if (isImageRequest(requestUrl, event.request)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse && isValidImageResponse(cachedResponse)) {
            // Asynchronously fetch fresh copy in background to keep cache healthy
            fetch(event.request)
              .then((networkResponse) => {
                if (isValidImageResponse(networkResponse)) {
                  cache.put(event.request, networkResponse);
                }
              })
              .catch(() => { /* Silent fallback when offline */ });
            return cachedResponse;
          }

          if (cachedResponse) {
            // Evict poisoned non-image response (e.g. cached SPA index.html fallback)
            cache.delete(event.request).catch(() => {});
          }

          // Fetch from network and cache only verified image responses
          return fetch(event.request).then((networkResponse) => {
            if (isValidImageResponse(networkResponse)) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Fallback vector for missing offline image
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="#F6F5F2"/><text x="50%" y="50%" font-family="system-ui" font-size="8" fill="#8C8A7D" dominant-baseline="middle" text-anchor="middle">Media Offline</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          });
        });
      })
    );
    return;
  }

  // 3. IMMUTABLE BUNDLED ASSETS (Vite bundles with hash in the filename): Cache-first
  if (isImmutableAsset(requestUrl)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, cacheCopy);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 4. MAIN NAVIGATION / SHELL (index.html, /): Network-First, Falling back to Cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;

        if (event.request.mode === 'navigate' || requestUrl.pathname === '/' || requestUrl.pathname.endsWith('.html')) {
          const shellFallback = 
            (await caches.match('/')) || 
            (await caches.match('index.html')) || 
            (await caches.match('./')) || 
            (await caches.match('/index.html'));
          if (shellFallback) return shellFallback;

          return new Response(
            `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>IDEMO Offline</title><style>body{background:#F5F4EE;color:#23251E;font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:24px;text-align:center}.box{max-width:320px;padding:32px 24px;border-radius:20px;background:#FFFFFF;box-shadow:0 12px 30px rgba(0,0,0,0.06)}.tag{font-size:10px;font-weight:900;letter-spacing:2px;color:#800020;text-transform:uppercase;margin-bottom:8px}.title{font-size:20px;font-weight:800;margin:0 0 10px}.desc{font-size:13px;line-height:1.5;color:#666;margin:0 0 20px}.btn{display:inline-block;background:#800020;color:#FFF;padding:10px 24px;border-radius:12px;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase}</style></head><body><div class="box"><div class="tag">IDEMO CONCIERGE</div><h1 class="title">Connection Paused</h1><p class="desc">Please check your internet or cellular signal to resume discovering Serbia.</p><a href="/" class="btn" onclick="window.location.reload();return false;">Retry Connection</a></div></body></html>`,
            {
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            }
          );
        }

        return new Response('Internet connection lost. Offline fallback active.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

// 5. WEB APP BADGING API & NOTIFICATIONS SUPPORT
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SET_BADGE') {
    const count = Number(event.data.count) || 0;
    if ('setAppBadge' in self.navigator) {
      if (count > 0) {
        self.navigator.setAppBadge(count).catch(() => {});
      } else {
        self.navigator.clearAppBadge().catch(() => {});
      }
    }
  } else if (event.data.type === 'CLEAR_BADGE') {
    if ('clearAppBadge' in self.navigator) {
      self.navigator.clearAppBadge().catch(() => {});
    }
  }
});

// Background Push Notification Payload Badge Handling
self.addEventListener('push', (event) => {
  try {
    const payload = event.data ? event.data.json() : {};
    const count = Number(payload.badge || payload.unseenCount || 1);
    if ('setAppBadge' in self.navigator) {
      if (count > 0) {
        self.navigator.setAppBadge(count).catch(() => {});
      } else {
        self.navigator.clearAppBadge().catch(() => {});
      }
    }
  } catch (err) {
    if ('setAppBadge' in self.navigator) {
      self.navigator.setAppBadge(1).catch(() => {});
    }
  }
});

