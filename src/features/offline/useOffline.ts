import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { applyUpdate } from './applyUpdate';

async function cachedShellReady(): Promise<boolean> {
  const scripts = [...document.querySelectorAll<HTMLScriptElement>('script[type="module"][src]')].map(s => s.src);
  const styles = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map(s => s.href);
  const urls = ['/index.html', '/icon-192.png', '/icon-512.png', ...scripts, ...styles];
  const matches = await Promise.all(urls.map(url => caches.match(new URL(url, location.origin), { ignoreSearch: true })));
  return matches.every(response => response?.ok);
}

export function useOffline() {
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsReload, setNeedsReload] = useState(false);
  const { needRefresh: [needsUpdate] } = useRegisterSW({
    onNeedReload() { setNeedsReload(true); },
    onRegisterError(reason: unknown) {
      console.error('Offline setup failed:', reason);
      setError('Offline setup failed. Reload online to retry.');
    },
  });
  useEffect(() => {
    if (import.meta.env.DEV || !('serviceWorker' in navigator)) return;
    let active = true;
    const verify = async () => {
      try {
        const ready = await cachedShellReady();
        if (active) setAvailable(ready);
      } catch (reason) {
        console.error('Offline cache verification failed:', reason);
        if (active) setError('Offline cache could not be verified.');
      }
    };
    void navigator.serviceWorker.ready.then(verify);
    navigator.serviceWorker.addEventListener('controllerchange', verify);
    return () => { active = false; navigator.serviceWorker.removeEventListener('controllerchange', verify); };
  }, []);
  const unsupported = !('serviceWorker' in navigator) ? 'Offline is unavailable in this browser.' : null;
  const status = import.meta.env.DEV ? 'Development: offline cache disabled' : error ?? unsupported ?? (available ? 'Available offline' : 'Preparing offline cache');
  return { status, available, needsUpdate: needsUpdate || needsReload, update: applyUpdate };
}
