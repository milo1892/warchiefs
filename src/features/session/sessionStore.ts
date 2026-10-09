import { createGame } from '../../content/map';
import { applyCommand } from '../../game/commands';
import type { Command, GameState } from '../../game/model';
import { RuleError } from '../../game/state';
import { alive } from '../../game/selectors';
import type { SlotRecord } from '../../persistence/database';
import { SaveRepository, type LoadedSlot } from '../../persistence/repository';
import { MAX_SAVE_BYTES, SaveError, importText, parseSnapshot } from '../../persistence/snapshot';

type PendingWrite =
  | { kind: 'create'; state: GameState; name: string }
  | { kind: 'commit'; state: GameState; slot: LoadedSlot; checkpoint: boolean };
export type SessionView = {
  slot: LoadedSlot | null;
  slots: SlotRecord[];
  busy: boolean;
  ready: boolean;
  error: string | null;
  notice: string;
  pending: PendingWrite | null;
  paused: boolean;
};

export class SessionStore {
  private view: SessionView = { slot: null, slots: [], busy: false, ready: false, error: null, notice: '', pending: null, paused: false };
  private readonly listeners = new Set<() => void>();
  constructor(private readonly repository = new SaveRepository()) {}
  getSnapshot = (): SessionView => this.view;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private patch(changes: Partial<SessionView>): void {
    this.view = { ...this.view, ...changes };
    for (const listener of this.listeners) listener();
  }

  private requireSlot(): LoadedSlot {
    if (!this.view.slot) throw new SaveError('Open or create a game first.');
    return this.view.slot;
  }

  private async run(work: () => Promise<void>): Promise<boolean> {
    if (this.view.busy) { this.patch({ error: 'An operation is still in progress.' }); return false; }
    this.patch({ busy: true, error: null });
    try { await work(); return true; }
    catch (error) {
      if (error instanceof RuleError) console.warn('Rejected game command:', error);
      else console.error('Warchiefs operation failed:', error);
      this.patch({ error: error instanceof Error ? error.message : 'An unknown operation failed.', paused: true });
      return false;
    } finally { this.patch({ busy: false }); }
  }

  private async persist(write: PendingWrite): Promise<void> {
    this.patch({ pending: write });
    const slot = write.kind === 'create'
      ? await this.repository.create(write.state, write.name)
      : await this.repository.commit(write.slot, write.state, write.checkpoint);
    const slots = [slot.record, ...this.view.slots.filter(s => s.id !== slot.record.id)];
    this.patch({ slot, slots, pending: null, notice: `Saved round ${slot.snapshot.state.round}.` });
  }

  refresh = (): Promise<boolean> => this.run(async () => {
    this.patch({ slots: await this.repository.list(), ready: true });
  });

  create = (name: string, seed: number): Promise<boolean> => this.run(async () => {
    if (this.view.pending) throw new SaveError('Resolve the unsaved write before creating another game.');
    await this.persist({ kind: 'create', name, state: createGame(seed) });
    this.patch({ paused: false });
  });

  load = (id: string): Promise<boolean> => this.run(async () => {
    const slot = await this.repository.load(id);
    this.patch({
      slot, pending: null, paused: slot.recovered,
      notice: slot.recovered ? 'Recovered the previous known-good snapshot. Some recent progress may be missing.' : 'Saved game opened.',
    });
  });

  perform = (command: Command): Promise<boolean> => this.run(async () => {
    if (this.view.pending) throw new SaveError('Retry the unsaved write or reload before making another move.');
    const slot = this.requireSlot();
    await this.persist({ kind: 'commit', slot, state: applyCommand(slot.snapshot.state, command), checkpoint: false });
  });

  checkpoint = (): Promise<boolean> => this.run(async () => {
    if (this.view.pending) throw new SaveError('Resolve the unsaved write before making a checkpoint.');
    const slot = this.requireSlot();
    await this.persist({ kind: 'commit', slot, state: slot.snapshot.state, checkpoint: true });
    this.patch({ notice: 'Manual checkpoint saved.' });
  });

  restore = (): Promise<boolean> => this.run(async () => {
    if (this.view.pending) throw new SaveError('Resolve the unsaved write before restoring a checkpoint.');
    const slot = this.requireSlot();
    if (slot.record.checkpoint === null) throw new SaveError('No manual checkpoint is available.');
    await this.persist({ kind: 'commit', slot, state: parseSnapshot(slot.record.checkpoint).state, checkpoint: false });
    this.patch({ notice: 'Manual checkpoint restored.', paused: true });
  });

  retry = (): Promise<boolean> => this.run(async () => {
    if (!this.view.pending) throw new SaveError('No unsaved write to retry.');
    await this.persist(this.view.pending);
  });

  importFile = (file: File): Promise<boolean> => this.run(async () => {
    if (this.view.pending) throw new SaveError('Resolve the unsaved write before importing another game.');
    if (file.size > MAX_SAVE_BYTES) throw new SaveError('Save file exceeds the 2 MB limit.');
    const state = importText(await file.text()).state;
    await this.persist({ kind: 'create', name: file.name.replace(/\.json$/i, ''), state });
    this.patch({ paused: false, notice: 'Save imported into a new slot.' });
  });

  remove = (record: SlotRecord): Promise<boolean> => this.run(async () => {
    if (this.view.pending) throw new SaveError('Resolve the unsaved write before deleting a game.');
    await this.repository.remove(record);
    this.patch({
      slots: this.view.slots.filter(s => s.id !== record.id),
      ...(this.view.slot?.record.id === record.id ? { slot: null, pending: null } : {}),
      notice: 'Saved game deleted.',
    });
  });

  applyUpdate = (update: () => Promise<void>): Promise<boolean> => this.run(async () => {
    if (this.view.pending) throw new SaveError('Resolve the unsaved write before updating.');
    const state = this.view.slot?.snapshot.state;
    if (state && state.active !== 0 && state.winner === null && alive(state, 0)) throw new RuleError('Wait for a human turn before applying the update.');
    this.patch({ paused: true });
    await update();
  });

  togglePause = (): void => this.patch({ paused: !this.view.paused });
  notify = (notice: string): void => this.patch({ notice });
  report = (error: unknown): void => {
    console.error('Warchiefs operation failed:', error);
    this.patch({ error: error instanceof Error ? error.message : 'An unknown operation failed.', paused: true });
  };
}

export const session = new SessionStore();
