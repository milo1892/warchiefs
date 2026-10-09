import { UNITS } from '../content/rules';
import type { Army, FactionId, GameState, Owner, Position } from './model';
import { ensure } from './state';

export const sameTile = (a: Position, b: Position): boolean => a.x === b.x && a.y === b.y;
export const distance = (a: Position, b: Position): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export const armyAt = (s: GameState, p: Position) => s.armies.find(a => sameTile(a, p));
export const cityAt = (s: GameState, p: Position) => s.cities.find(c => sameTile(c, p));
export const alive = (s: GameState, id: FactionId) => s.cities.some(c => c.owner === id) || s.armies.some(a => a.owner === id);
export const neighbors = (p: Position): Position[] => [
  { x: p.x, y: p.y - 1 }, { x: p.x - 1, y: p.y },
  { x: p.x + 1, y: p.y }, { x: p.x, y: p.y + 1 },
];

export function atPeace(s: GameState, a: Owner, b: Owner): boolean {
  return a >= 0 && b >= 0 && a !== b && s.relations[a][b] === 'peace';
}

export function strength(a: Army, cityBonus = false): number {
  return a.units.reduce((sum, unit) => sum + UNITS[unit].strength + (a.hero ? 2 + a.hero.level : 0), 0) * (cityBonus ? 1.25 : 1);
}

export function maximumMovement(a: Army): number {
  return Math.min(...a.units.map(u => UNITS[u].movement)) + (a.hero ? 1 : 0);
}

export function ownedArmy(s: GameState, id: string): Army {
  const army = s.armies.find(a => a.id === id);
  ensure(army && army.owner === s.active, 'Select an army belonging to the active faction.');
  return army;
}

export function ownedCity(s: GameState, id: string) {
  const city = s.cities.find(c => c.id === id);
  ensure(city && city.owner === s.active, 'Select a city belonging to the active faction.');
  return city;
}
