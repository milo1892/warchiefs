import type { GameState, Position, Terrain } from '../../../game/model';
import { distance } from '../../../game/selectors';
import { terrainRoute } from '../../../game/pathfinding';

const SIDES = [{ x: 0, y: -1, bit: 1 }, { x: 1, y: 0, bit: 2 }, { x: 0, y: 1, bit: 4 }, { x: -1, y: 0, bit: 8 }];
export const tileKey = (p: Position, width: number): number => p.y * width + p.x;

export function neighborMask(p: Position, matches: (p: Position) => boolean): number {
  return SIDES.reduce((mask, side) => matches({ x: p.x + side.x, y: p.y + side.y }) ? mask | side.bit : mask, 0);
}

export function tileTerrain(s: GameState, p: Position): Terrain | null {
  if (p.x < 0 || p.y < 0 || p.x >= s.map.width || p.y >= s.map.height) return null;
  return s.map.tiles[tileKey(p, s.map.width)];
}

export function shoreMask(s: GameState, p: Position): number {
  return neighborMask(p, neighbor => {
    const tile = tileTerrain(s, neighbor);
    return tile !== null && tile !== 'water' && tile !== 'bridge';
  });
}

function nearestPair(connected: Position[], remaining: Position[]): { from: Position; index: number } {
  let best = { from: connected[0], index: 0 };
  let cost = Infinity;
  for (const from of connected) {
    remaining.forEach((to, index) => {
      const candidate = distance(from, to);
      if (candidate < cost) { cost = candidate; best = { from, index }; }
    });
  }
  return best;
}

export function buildRoads(s: GameState): ReadonlySet<number> {
  const roads = new Set<number>();
  const sites = s.cities.map(c => ({ x: c.x, y: c.y }));
  if (sites.length < 2) return roads;
  const connected = [sites[0]];
  const remaining = sites.slice(1);
  while (remaining.length) {
    const { from, index } = nearestPair(connected, remaining);
    const [to] = remaining.splice(index, 1);
    const path = terrainRoute(s.map, from, to);
    if (path) for (const p of [from, ...path.tiles]) roads.add(tileKey(p, s.map.width));
    connected.push(to);
  }
  return roads;
}

export function terrainArtKey(s: GameState): string {
  const sites = s.cities.map(c => `${c.x},${c.y}`).join(';');
  return `${s.map.width}:${s.map.height}:${s.map.tiles.join(',')}:${sites}`;
}
