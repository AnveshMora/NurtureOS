import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

// Register service worker on production origins only (not localhost)
if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  registerSW({
    onNeedRefresh() {
      if (confirm('New version available. Reload?')) {
        location.reload();
      }
    },
    onOfflineReady() {
      console.log('[SW] App ready for offline use');
    },
  });
} else {
  // Auto-unregister SW on localhost to avoid stale cache issues
  navigator.serviceWorker?.getRegistrations().then((registrations) => {
    for (const reg of registrations) {
      reg.unregister();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
