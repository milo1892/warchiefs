import { STACK_LIMIT } from '../content/rules';
import type { Army, GameState, Position, Route } from './model';
import { armyAt, atPeace, cityAt, distance, neighbors } from './selectors';

function gridCost(map: GameState['map'], p: Position): number {
  if (!Number.isInteger(p.x) || !Number.isInteger(p.y) || p.x < 0 || p.y < 0 || p.x >= map.width || p.y >= map.height) return Infinity;
  const tile = map.tiles[p.y * map.width + p.x];
  if (tile === 'water' || tile === 'mountain') return Infinity;
  return tile === 'forest' ? 2 : 1;
}

export function terrainCost(s: GameState, p: Position): number {
  return gridCost(s.map, p);
}

function canEnter(s: GameState, army: Army, p: Position, final: boolean): boolean {
  const resident = armyAt(s, p);
  const city = cityAt(s, p);
  if (city && atPeace(s, army.owner, city.owner)) return false;
  if (!resident || resident.id === army.id) return true;
  if (!final || atPeace(s, army.owner, resident.owner)) return false;
  if (resident.owner !== army.owner) return true;
  return resident.units.length + army.units.length <= STACK_LIMIT && !(resident.hero && army.hero);
}

function reconstruct(width: number, parents: Map<number, number>, start: number, end: number): Position[] {
  const tiles: Position[] = [];
  let cursor = end;
  while (cursor !== start) {
    tiles.unshift({ x: cursor % width, y: Math.floor(cursor / width) });
    cursor = parents.get(cursor)!;
  }
  return tiles;
}

function findRoute(map: GameState['map'], from: Position, to: Position, enter: (p: Position, final: boolean) => boolean): Route | null {
  if (!Number.isFinite(gridCost(map, to))) return null;
  const key = (p: Position) => p.y * map.width + p.x;
  const start = key(from);
  const target = key(to);
  const costs = new Map<number, number>([[start, 0]]);
  const parents = new Map<number, number>();
  const open = [{ p: { x: from.x, y: from.y }, cost: 0, score: distance(from, to) }];
  while (open.length) {
    open.sort((a, b) => a.score - b.score || a.cost - b.cost || key(a.p) - key(b.p));
    const current = open.shift()!;
    const k = key(current.p);
    if (current.cost !== costs.get(k)) continue;
    if (k === target) return { tiles: reconstruct(map.width, parents, start, k), cost: current.cost };
    for (const p of neighbors(current.p)) {
      const cost = current.cost + gridCost(map, p);
      if (!Number.isFinite(cost) || !enter(p, key(p) === target)) continue;
      if (cost >= (costs.get(key(p)) ?? Infinity)) continue;
      costs.set(key(p), cost);
      parents.set(key(p), k);
      open.push({ p, cost, score: cost + distance(p, to) });
    }
  }
  return null;
}

export function route(s: GameState, army: Army, to: Position): Route | null {
  return findRoute(s.map, army, to, (p, final) => canEnter(s, army, p, final));
}

export function terrainRoute(map: GameState['map'], from: Position, to: Position): Route | null {
  return findRoute(map, from, to, () => true);
}

export function marchDestination(s: GameState, army: Army, to: Position): Position | null {
  const path = route(s, army, to);
  if (!path) return null;
  let left = army.movement;
  let destination: Position | null = null;
  for (const tile of path.tiles) {
    left -= terrainCost(s, tile);
    if (left < 0) break;
    destination = tile;
  }
  return destination;
}
