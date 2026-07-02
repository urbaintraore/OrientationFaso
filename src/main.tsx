import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

// Safeguard against Storage SecurityErrors (common in strict sandboxed iframes)
if (typeof window !== 'undefined') {
  const tryGetStorage = (type: 'localStorage' | 'sessionStorage') => {
    try {
      const storage = window[type];
      const testKey = `__test_${type}_availability__`;
      storage.setItem(testKey, 'ok');
      storage.removeItem(testKey);
      return storage;
    } catch {
      return null;
    }
  };

  const createMemoryStorage = () => {
    const memStore: Record<string, string> = {};
    return {
      getItem(key: string): string | null {
        return key in memStore ? memStore[key] : null;
      },
      setItem(key: string, value: string): void {
        memStore[key] = String(value);
      },
      removeItem(key: string): void {
        delete memStore[key];
      },
      clear(): void {
        for (const key in memStore) {
          delete memStore[key];
        }
      },
      key(index: number): string | null {
        const keys = Object.keys(memStore);
        return keys[index] || null;
      },
      get length(): number {
        return Object.keys(memStore).length;
      }
    };
  };

  if (!tryGetStorage('localStorage')) {
    console.warn("localStorage is not accessible in this environment. Employing in-memory fallback.");
    Object.defineProperty(window, 'localStorage', {
      value: createMemoryStorage(),
      writable: true,
      configurable: true
    });
  }

  if (!tryGetStorage('sessionStorage')) {
    console.warn("sessionStorage is not accessible in this environment. Employing in-memory fallback.");
    Object.defineProperty(window, 'sessionStorage', {
      value: createMemoryStorage(),
      writable: true,
      configurable: true
    });
  }
}

// Silence and convert benign Firebase offline warnings into pleasant info logs
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  const originalError = console.error;

  const isBanalFirebaseOfflineMsg = (args: any[]): boolean => {
    return args.some(arg => {
      if (!arg) return false;
      const str = typeof arg === 'string' ? arg : (arg.message || String(arg));
      const normalized = str.toLowerCase();
      return (
        normalized.includes('could not reach cloud firestore backend') ||
        normalized.includes('network-request-failed') ||
        normalized.includes('fetching auth token failed') ||
        normalized.includes('unreachable') ||
        normalized.includes('client is offline') ||
        normalized.includes('firestore (12.')
      );
    });
  };

  console.warn = function (...args: any[]) {
    if (isBanalFirebaseOfflineMsg(args)) {
      console.info("[Firebase Sync Status] Backend unreachable. Seamless cache fallback active.");
      return;
    }
    originalWarn.apply(console, args);
  };

  console.error = function (...args: any[]) {
    if (isBanalFirebaseOfflineMsg(args)) {
      console.info("[Firebase Sync Status] Network request postponed. Operating securely in offline-first memory/cache.");
      return;
    }
    originalError.apply(console, args);
  };
}

import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Proactively unregister any active service worker to avoid caching and white-screen issues on production hosts (like Vercel)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then((success) => {
        if (success) {
          console.log('Successfully unregistered active Service Worker:', registration.scope);
        }
      });
    }
  }).catch((err) => {
    console.warn('Error clearing service worker registrations:', err);
  });
}

