import { describe, expect, it } from 'vitest';
import { createGame } from '../content/map';
import { applyCommand } from './commands';
import { route } from './pathfinding';
import { nextAICommand } from './ai/strategy';
import { exportText, importText, snapshot } from '../persistence/snapshot';

describe('conquest rules', () => {
  it('creates a valid authored map with reachable cities and ruins', () => {
    const s = createGame(1);
    expect(snapshot(s).state).toEqual(s);
    for (const city of s.cities) expect(route(s, s.armies[0], city)).not.toBeNull();
    for (const ruin of s.ruins) expect(route(s, s.armies[0], ruin)).not.toBeNull();
  });

  it('moves without mutating prior state and rejects illegal commands', () => {
    const s = createGame(1);
    const next = applyCommand(s, { type: 'move', armyId: 'army-0', to: { x: 4, y: 3 } });
    expect(s.armies[0].x).toBe(3);
    expect(next.armies[0]).toMatchObject({ x: 4, y: 3, movement: 3 });
    expect(() => applyCommand(s, { type: 'move', armyId: 'army-1', to: { x: 35, y: 3 } })).toThrow(/active faction/);
    expect(() => applyCommand(s, { type: 'move', armyId: 'army-0', to: { x: 19, y: 0 } })).toThrow(/blocked/);
    expect(() => applyCommand(s, { type: 'move', armyId: 'army-0', to: { x: 30, y: 3 } })).toThrow(/movement/);
  });

  it('splits and merges with conservative movement and no unit duplication', () => {
    const s = applyCommand(createGame(2), { type: 'split', armyId: 'army-0', count: 2, to: { x: 3, y: 4 } });
    expect(s.armies[0].units).toHaveLength(2);
    expect(s.armies.at(-1)?.units).toHaveLength(2);
    const merged = applyCommand(s, { type: 'move', armyId: 'army-12', to: { x: 3, y: 3 } });
    expect(merged.armies[0].units).toHaveLength(4);
    expect(merged.armies[0].movement).toBe(2);
    expect(merged.armies).toHaveLength(12);
  });

  it('advances income, production and movement only on the owner turn', () => {
    let s = applyCommand(createGame(3), { type: 'recruit', cityId: 'city-0', kind: 'soldier' });
    expect(s.factions[0].gold).toBe(86);
    expect(() => applyCommand(s, { type: 'recruit', cityId: 'city-0', kind: 'guard' })).toThrow(/already/);
    for (let i = 0; i < 3; i++) s = applyCommand(s, { type: 'end' });
    expect(s.cities[0].queue?.remaining).toBe(1);
    s = applyCommand(s, { type: 'end' });
    expect(s.active).toBe(0);
    expect(s.round).toBe(2);
    expect(s.factions[0].gold).toBe(98);
    expect(s.armies[0].units).toHaveLength(5);
    expect(s.cities[0].queue).toBeNull();
  });

  it('resumes partial AI turns with identical commands and RNG outcomes', () => {
    let s = applyCommand(createGame(19), { type: 'end' });
    for (let i = 0; i < 5; i++) s = applyCommand(s, nextAICommand(s));
    let resumed = importText(exportText(s)).state;
    for (let i = 0; i < 80; i++) {
      expect(nextAICommand(resumed)).toEqual(nextAICommand(s));
      s = applyCommand(s, nextAICommand(s));
      resumed = applyCommand(resumed, nextAICommand(resumed));
      expect(resumed).toEqual(s);
    }
  });

  it('skips an eliminated active faction after losing its final army', () => {
    const s = createGame(1);
    s.cities[0].owner = -1;
    s.armies[0].x = 35;
    s.armies[0].units = ['soldier'];
    const next = applyCommand(s, { type: 'move', armyId: 'army-0', to: { x: 36, y: 3 } });
    expect(next.armies.some(a => a.owner === 0)).toBe(false);
    expect(next.active).toBe(1);
    expect(snapshot(next).state).toEqual(next);
  });
});

describe('classic systems', () => {
  it('recruits only one hero and permanently consumes ruins and quest rewards', () => {
    let s = applyCommand(createGame(300), { type: 'hero', cityId: 'city-0' });
    expect(s.factions[0].gold).toBe(30);
    expect(() => applyCommand(s, { type: 'hero', cityId: 'city-0' })).toThrow(/already/);
    s.armies[0].x = 7;
    s.armies[0].y = 12;
    s = applyCommand(s, { type: 'explore', armyId: 'army-0' });
    expect(s.ruins[0].exploredBy).toBe(0);
    expect(s.quests[1].completed).toBe(true);
    expect(s.armies[0].movement).toBe(0);
    const gold = s.factions[0].gold;
    expect(() => applyCommand(s, { type: 'explore', armyId: 'army-0' })).toThrow();
    s = applyCommand(s, { type: 'end' });
    expect(s.factions[0].gold).toBe(gold);
    expect(snapshot(s).state).toEqual(s);
  });

  it('blocks peaceful territory and restores legal paths after war declaration', () => {
    let s = applyCommand(createGame(4), { type: 'propose', to: 1 });
    s = applyCommand(s, { type: 'end' });
    s = applyCommand(s, { type: 'respond', from: 0, accept: true });
    expect(s.relations[0][1]).toBe('peace');
    expect(route(s, s.armies[1], s.cities[0])).toBeNull();
    s = applyCommand(s, { type: 'declare', to: 0 });
    expect(route(s, s.armies[1], s.cities[0])).not.toBeNull();
  });

  it('awards city quests once even if ownership changes again', () => {
    const s = createGame(5);
    s.armies = s.armies.filter(a => a.id !== 'army-8');
    s.armies[0].x = 16;
    s.armies[0].y = 14;
    let next = applyCommand(s, { type: 'move', armyId: 'army-0', to: { x: 17, y: 14 } });
    expect(next.quests[0].completed).toBe(true);
    expect(next.factions[0].gold).toBe(160);
    next = applyCommand(next, { type: 'move', armyId: 'army-0', to: { x: 16, y: 14 } });
    expect(next.factions[0].gold).toBe(160);
  });
});
