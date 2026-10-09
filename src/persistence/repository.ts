import { openDatabase, type SlotRecord } from './database';
import { SaveError, parseSnapshot, snapshot, type Snapshot } from './snapshot';
import type { GameState } from '../game/model';

export type LoadedSlot = { record: SlotRecord; snapshot: Snapshot; recovered: boolean };
export class ConflictError extends SaveError {}

function readSnapshot(record: SlotRecord): LoadedSlot {
  try {
    return { record, snapshot: parseSnapshot(record.current), recovered: false };
  } catch (error) {
    if (!(error instanceof SaveError) || record.previous === null) throw error;
    console.warn('Invalid current save; recovering previous snapshot.', error);
    return { record, snapshot: parseSnapshot(record.previous), recovered: true };
  }
}

export class SaveRepository {
  constructor(private readonly databaseName = 'warchiefs') {}

  async list(): Promise<SlotRecord[]> {
    const db = await openDatabase(this.databaseName);
    try {
      return (await db.getAll('slots')).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } finally { db.close(); }
  }

  async load(id: string): Promise<LoadedSlot> {
    const db = await openDatabase(this.databaseName);
    try {
      const record = await db.get('slots', id);
      if (!record) throw new SaveError('This saved game no longer exists.');
      return readSnapshot(record);
    } finally { db.close(); }
  }

  async create(state: GameState, name: string): Promise<LoadedSlot> {
    const current = snapshot(state);
    const record: SlotRecord = {
      id: crypto.randomUUID(), name: name.trim().slice(0, 40) || 'New campaign',
      revision: 0, updatedAt: new Date().toISOString(), current, previous: null, checkpoint: null,
    };
    const db = await openDatabase(this.databaseName);
    try { await db.add('slots', record); } finally { db.close(); }
    return { record, snapshot: current, recovered: false };
  }

  async commit(slot: LoadedSlot, state: GameState, checkpoint = false): Promise<LoadedSlot> {
    const current = snapshot(state);
    const db = await openDatabase(this.databaseName);
    try {
      const tx = db.transaction('slots', 'readwrite');
      const stored = await tx.store.get(slot.record.id);
      if (!stored || stored.revision !== slot.record.revision) {
        await tx.done;
        throw new ConflictError('Another tab changed this game. Export your unsaved state or reload the latest save.');
      }
      const record: SlotRecord = {
        ...stored, revision: stored.revision + 1, updatedAt: new Date().toISOString(),
        previous: slot.snapshot, current, checkpoint: checkpoint ? current : stored.checkpoint,
      };
      await tx.store.put(record);
      await tx.done;
      return { record, snapshot: current, recovered: false };
    } finally { db.close(); }
  }

  async restoreCheckpoint(slot: LoadedSlot): Promise<LoadedSlot> {
    if (slot.record.checkpoint === null) throw new SaveError('No manual checkpoint has been saved for this game.');
    return this.commit(slot, parseSnapshot(slot.record.checkpoint).state);
  }

  async remove(record: SlotRecord): Promise<void> {
    const db = await openDatabase(this.databaseName);
    try {
      const tx = db.transaction('slots', 'readwrite');
      const current = await tx.store.get(record.id);
      if (!current || current.revision !== record.revision) {
        await tx.done;
        throw new ConflictError('The game changed in another tab. Refresh the save list before deleting it.');
      }
      await tx.store.delete(record.id);
      await tx.done;
    } finally { db.close(); }
  }
}
