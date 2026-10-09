function activate(worker: ServiceWorker): Promise<void> {
  return new Promise((accept, reject) => {
    const cleanup = () => {
      window.clearTimeout(timeout);
      worker.removeEventListener('statechange', changed);
    };
    const changed = () => {
      if (worker.state === 'activated') { cleanup(); accept(); }
      else if (worker.state === 'redundant') { cleanup(); reject(new Error('The waiting update was replaced. Reload online and try again.')); }
    };
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Update activation timed out. Your committed saves are unchanged; reload online to retry.'));
    }, 15_000);
    worker.addEventListener('statechange', changed);
    try { worker.postMessage({ type: 'SKIP_WAITING' }); changed(); }
    catch (error) { cleanup(); reject(error); }
  });
}

export async function applyUpdate(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) throw new Error('No registered offline worker. Reload online to retry setup.');
  if (registration.waiting) await activate(registration.waiting);
  window.location.reload();
}
