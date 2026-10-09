import 'fake-indexeddb/auto';
import { expect, it, vi } from 'vitest';
import { SaveRepository } from '../../persistence/repository';
import { SessionStore } from './sessionStore';

it('keeps the committed state and exportable candidate on a failed write, then retries', async () => {
  const repo = new SaveRepository(crypto.randomUUID());
  const store = new SessionStore(repo);
  await store.create('Failure recovery', 123);
  const original = store.getSnapshot().slot;
  vi.spyOn(repo, 'commit').mockRejectedValueOnce(new DOMException('Disk is full', 'QuotaExceededError'));
  expect(await store.perform({ type: 'hero', cityId: 'city-0' })).toBe(false);
  const failed = store.getSnapshot();
  expect(failed.slot).toBe(original);
  expect(failed.pending?.state.armies[0].hero?.name).toBe('Rowan');
  expect(failed.error).toMatch(/Disk is full/);
  expect(failed.paused).toBe(true);
  expect(await store.perform({ type: 'end' })).toBe(false);
  expect(await store.retry()).toBe(true);
  expect(store.getSnapshot().pending).toBeNull();
  expect(store.getSnapshot().slot?.snapshot.state.armies[0].hero?.name).toBe('Rowan');
});

it('blocks commands during update activation and rejects updates in an AI turn', async () => {
  const store = new SessionStore(new SaveRepository(crypto.randomUUID()));
  await store.create('Update boundary', 1);
  let finish: () => void = () => { throw new Error('Update gate was not initialized.'); };
  const update = store.applyUpdate(() => new Promise<void>(resolve => { finish = resolve; }));
  expect(store.getSnapshot().busy).toBe(true);
  expect(await store.perform({ type: 'end' })).toBe(false);
  finish();
  expect(await update).toBe(true);
  expect(store.getSnapshot().slot?.snapshot.state.active).toBe(0);
  await store.perform({ type: 'end' });
  expect(await store.applyUpdate(() => Promise.resolve())).toBe(false);
  expect(store.getSnapshot().error).toMatch(/human turn/);
});
