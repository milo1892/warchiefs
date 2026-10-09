import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { createGame } from '../content/map';
import { applyCommand } from '../game/commands';
import { openDatabase } from './database';
import { SaveRepository } from './repository';
import { exportText, importText, parseSnapshot, snapshot } from './snapshot';

let repository: SaveRepository;
let name: string;
beforeEach(() => { name = crypto.randomUUID(); repository = new SaveRepository(name); });

describe('portable snapshot validation', () => {
  it('round-trips all state and explicitly migrates schema 1', () => {
    const s = createGame(123);
    expect(importText(exportText(s)).state).toEqual(s);
    expect(parseSnapshot({ format: 'warchiefs', schemaVersion: 1, rulesVersion: 1, contentVersion: 1, state: s })).toEqual(snapshot(s));
  });

  it('rejects malformed, oversized, incompatible and invariant-breaking saves', () => {
    expect(() => importText('{')).toThrow(/JSON/);
    expect(() => importText(' '.repeat(2_000_001))).toThrow(/limit/);
    expect(() => parseSnapshot({ ...snapshot(createGame(1)), rulesVersion: 9 })).toThrow(/incompatible/);
    const s = createGame(1);
    s.armies[0].x = -1;
    expect(() => parseSnapshot({ ...snapshot(createGame(1)), state: s })).toThrow(/Invalid/);
    s.armies[0].x = 36;
    expect(() => parseSnapshot({ ...snapshot(createGame(1)), state: s })).toThrow(/Duplicate/);
    s.armies[0].x = 3;
    s.relations[0][1] = 'peace';
    expect(() => parseSnapshot({ ...snapshot(createGame(1)), state: s })).toThrow(/symmetric/);
  });
});

describe('transactional local saves', () => {
  it('saves progress atomically and rejects stale writers', async () => {
    const original = await repository.create(createGame(7), 'Test');
    const next = applyCommand(original.snapshot.state, { type: 'hero', cityId: 'city-0' });
    const saved = await repository.commit(original, next);
    expect(saved.record.revision).toBe(1);
    expect((await repository.load(original.record.id)).snapshot.state).toEqual(next);
    await expect(repository.commit(original, original.snapshot.state)).rejects.toThrow(/Another tab/);
    expect((await repository.load(original.record.id)).snapshot.state).toEqual(next);
  });

  it('creates multiple independent slots and checkpoints with monotonic revisions', async () => {
    let slot = await repository.create(createGame(1), 'First');
    await repository.create(createGame(2), 'Second');
    expect(await repository.list()).toHaveLength(2);
    slot = await repository.commit(slot, slot.snapshot.state, true);
    const checkpoint = slot.snapshot.state;
    slot = await repository.commit(slot, applyCommand(slot.snapshot.state, { type: 'hero', cityId: 'city-0' }));
    slot = await repository.restoreCheckpoint(slot);
    expect(slot.snapshot.state).toEqual(checkpoint);
    expect(slot.record.revision).toBe(3);
  });

  it('recovers a known-good snapshot explicitly without deleting the bad record', async () => {
    let slot = await repository.create(createGame(9), 'Recover');
    const original = slot.snapshot;
    slot = await repository.commit(slot, applyCommand(slot.snapshot.state, { type: 'hero', cityId: 'city-0' }));
    const db = await openDatabase(name);
    await db.put('slots', { ...slot.record, current: { broken: true } });
    db.close();
    const recovered = await repository.load(slot.record.id);
    expect(recovered.recovered).toBe(true);
    expect(recovered.snapshot).toEqual(original);
    const next = await repository.commit(recovered, applyCommand(recovered.snapshot.state, { type: 'hero', cityId: 'city-0' }));
    expect(next.record.previous).toEqual(original);
  });

  it('preserves unsupported snapshots and rejects stale deletion', async () => {
    const slot = await repository.create(createGame(3), 'Future');
    await repository.commit(slot, slot.snapshot.state);
    await expect(repository.remove(slot.record)).rejects.toThrow(/another tab/);
    const db = await openDatabase(name);
    const current = await db.get('slots', slot.record.id);
    if (!current) throw new Error('Fixture disappeared.');
    await db.put('slots', { ...current, current: { schemaVersion: 999 }, previous: null });
    db.close();
    await expect(repository.load(slot.record.id)).rejects.toThrow(/incompatible/);
    expect(await repository.list()).toHaveLength(1);
  });
});
