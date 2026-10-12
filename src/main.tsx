import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for standalone PWA capabilities and home screen badging
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !window.location.host.includes('localhost:3000')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.debug('[IDEMO PWA] Service worker registration ignored:', err);
    });
  });
}

