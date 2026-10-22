import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker only in standalone production builds (never in Vite dev or preview iframes)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const isPreviewOrDev =
    import.meta.env.DEV ||
    window.self !== window.top ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('ais-dev-') ||
    window.location.hostname.includes('ais-pre-');

  if (isPreviewOrDev) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        registration.unregister().catch(() => {});
      }
    }).catch(() => {});
    if ('caches' in window) {
      caches.keys().then(keys => {
        for (const key of keys) {
          if (key.startsWith('idemo-')) {
            caches.delete(key).catch(() => {});
          }
        }
      }).catch(() => {});
    }
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then(reg => {
          reg.update().catch(() => {});
        })
        .catch(err => {
          console.debug('[IDEMO PWA] Service worker registration ignored:', err);
        });
    });
  }
}


