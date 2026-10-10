import { describe, expect, it } from 'vitest';
import { createGame } from '../../../content/map';
import { terrainCost } from '../../../game/pathfinding';
import { FACTIONS } from '../../../game/model';
import { buildRoads, neighborMask, shoreMask, terrainArtKey, tileKey } from './geometry';
import { CITY_SPRITES, FACTION_CRESTS, SPRITES, spriteFrame, ATLAS_WIDTH, ATLAS_HEIGHT } from './atlas';

describe('original sprite metadata', () => {
  it('has unique, bounded frames and five distinct city variants and crests', () => {
    expect(new Set(SPRITES.map(s => s.id)).size).toBe(SPRITES.length);
    for (const sprite of SPRITES) {
      const frame = spriteFrame(sprite.id);
      expect(frame.x).toBeGreaterThanOrEqual(0);
      expect(frame.y).toBeGreaterThanOrEqual(0);
      expect(frame.x + frame.width).toBeLessThanOrEqual(ATLAS_WIDTH);
      expect(frame.y + frame.height).toBeLessThanOrEqual(ATLAS_HEIGHT);
    }
    expect(new Set(Object.values(CITY_SPRITES)).size).toBe(5);
    expect(new Set(Object.values(FACTION_CRESTS).map(c => JSON.stringify(c))).size).toBe(5);
    expect(new Set(Object.values(CITY_SPRITES).map(name => JSON.stringify(spriteFrame(name)))).size).toBe(5);
  });
});

describe('decorative terrain geometry', () => {
  it('derives deterministic, passable roads without mutating game state or RNG', () => {
    const state = createGame(99);
    const original = structuredClone(state);
    const roads = buildRoads(state);
    expect(roads.size).toBeGreaterThan(30);
    for (const key of roads) expect(Number.isFinite(terrainCost(state, { x: key % state.map.width, y: Math.floor(key / state.map.width) }))).toBe(true);
    for (const city of state.cities) expect(roads.has(tileKey(city, state.map.width))).toBe(true);
    expect(buildRoads(state)).toEqual(roads);
    expect(state).toEqual(original);
  });

  it('keeps artwork geometry stable across owners, army movement and politics', () => {
    const state = createGame(11);
    const modified = structuredClone(state);
    for (const city of modified.cities) city.owner = 0;
    modified.armies[0].x++;
    modified.rng = 25;
    modified.relations = FACTIONS.map(() => FACTIONS.map(() => 'peace'));
    expect(terrainArtKey(modified)).toBe(terrainArtKey(state));
    expect(buildRoads(modified)).toEqual(buildRoads(state));
    modified.map.tiles[0] = 'forest';
    expect(terrainArtKey(modified)).not.toBe(terrainArtKey(state));
  });

  it('joins water and bridge cells while drawing banks only against land', () => {
    const state = createGame(1);
    expect(shoreMask(state, { x: 19, y: 5 })).toBe(10);
    expect(shoreMask(state, { x: 19, y: 6 })).toBe(10);
    expect(neighborMask({ x: 0, y: 0 }, p => p.x === 1 || p.y === -1)).toBe(3);
  });
});
