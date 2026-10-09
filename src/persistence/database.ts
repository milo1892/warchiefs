import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export type SlotRecord = {
  id: string;
  name: string;
  revision: number;
  updatedAt: string;
  current: unknown;
  previous: unknown | null;
  checkpoint: unknown | null;
};
interface GameDatabase extends DBSchema {
  slots: { key: string; value: SlotRecord };
}

export function openDatabase(name = 'warchiefs'): Promise<IDBPDatabase<GameDatabase>> {
  return openDB<GameDatabase>(name, 1, {
    upgrade(db) { db.createObjectStore('slots', { keyPath: 'id' }); },
    blocking(_current, _blocked, event) {
      const request = event.target;
      if (request instanceof IDBDatabase) request.close();
    },
    blocked() { console.error('Warchiefs database upgrade blocked. Close other game tabs and reload.'); },
  });
}
