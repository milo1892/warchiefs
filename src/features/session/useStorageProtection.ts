import { useState } from 'react';

export function useStorageProtection() {
  const [status, setStatus] = useState('Browser saves can be deleted. Export backups regularly.');
  const request = async () => {
    if (!navigator.storage?.persist) {
      setStatus('Persistent storage requests are unavailable. Export backups regularly.');
      return;
    }
    try {
      const granted = await navigator.storage.persist();
      setStatus(granted ? 'Persistent storage granted. Clearing browser data still deletes saves; keep file backups.' : 'Persistence was not granted by this browser. Keep file backups.');
    } catch (error) {
      console.error('Storage persistence request failed:', error);
      setStatus(`Storage protection request failed: ${error instanceof Error ? error.message : 'unknown error'}. Export backups.`);
    }
  };
  return { status, request };
}
