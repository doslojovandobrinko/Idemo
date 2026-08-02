const CACHE_VERSION = "v2";
const STATIC_CACHE = `idemo-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `idemo-images-${CACHE_VERSION}`;
const FONT_CACHE = `idemo-fonts-${CACHE_VERSION}`;

// Shell assets to cache immediately upon installation
const PRECACHE_ASSETS = [
  "./",
  "index.html",
  "manifest.json",
  "idemo_app_store_icon.svg",
];

// Helper to determine if a request qualifies for the font cache
const isFontRequest = (url, request) => {
  return (
    request.destination === "font" ||
    url.host.includes("fonts.googleapis.com") ||
    url.host.includes("fonts.gstatic.com") ||
    url.pathname.match(/\.(woff|woff2|ttf|otf|eot)/i)
  );
};

// Helper to determine if a request qualifies for the image cache
const isImageRequest = (url, request) => {
  return (
    request.destination === "image" ||
    url.pathname.includes("/assets/images/") ||
    url.pathname.includes("/src/assets/images/") ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)/i)
  );
};

// Helper to check if asset name contains a build hash (immutable assets)
const isImmutableAsset = (url) => {
  return url.pathname.match(
    /-[a-f0-9]{8,}\.(js|css|woff2|png|jpg|jpeg|webp)$/i,
  );
};

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log(
          "[IDEMO Service Worker] Pre-caching core application shell...",
        );
        return cache
          .addAll(PRECACHE_ASSETS)
          .catch((err) =>
            console.error("[IDEMO Service Worker] Core precache failed:", err),
          );
      })
      .then(() => self.skipWaiting()),
  );
});

// Activate Event: Clean up old caches from older versions
self.addEventListener("activate", (event) => {
  const allowedCaches = [STATIC_CACHE, IMAGE_CACHE, FONT_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!allowedCaches.includes(cacheName)) {
              console.log(
                "[IDEMO Service Worker] Removing obsolete cache:",
                cacheName,
              );
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);

  // Bypass chrome-extension or other non-http schemes
  if (!requestUrl.protocol.startsWith("http")) return;

  // 1. FONTS: Cache-First Strategy (Fonts never change)
  if (isFontRequest(requestUrl, event.request)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const cacheCopy = networkResponse.clone();
              caches.open(FONT_CACHE).then((cache) => {
                cache.put(event.request, cacheCopy);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            return new Response("", {
              status: 404,
              statusText: "Font unavailable",
            });
          });
      }),
    );
    return;
  }

  // 2. IMAGES: Cache-First with Stale-while-revalidate for local assets/images and external covers
  if (isImageRequest(requestUrl, event.request)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Asynchronously fetch fresh copy in background to keep cache healthy
            fetch(event.request)
              .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  cache.put(event.request, networkResponse);
                }
              })
              .catch(() => {
                /* Silent fallback when offline */
              });
            return cachedResponse;
          }

          // Fetch from network and cache
          return fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => {
              // Fallback vector for missing offline image
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="#F6F5F2"/><text x="50%" y="50%" font-family="system-ui" font-size="8" fill="#8C8A7D" dominant-baseline="middle" text-anchor="middle">Media Offline</text></svg>',
                { headers: { "Content-Type": "image/svg+xml" } },
              );
            });
        });
      }),
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
      }),
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
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response(
            "Internet connection lost. Offline fallback active.",
            {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            },
          );
        });
      }),
  );
});
