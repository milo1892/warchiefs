import { STACK_LIMIT } from '../../content/rules';
import type { Army, GameState, Position } from '../model';
import { marchDestination, route } from '../pathfinding';
import { armyAt, atPeace, cityAt, distance, strength } from '../selectors';

function targets(s: GameState, army: Army): { p: Position; score: number }[] {
  return [
    ...s.cities.filter(c => c.owner !== s.active && !atPeace(s, s.active, c.owner)).map(c => ({
      p: c, score: distance(army, c) + (armyAt(s, c) ? 2 : -4) - (c.id === 'city-8' ? 2 : 0),
    })),
    ...s.armies.filter(a => a.owner >= 0 && a.owner !== s.active && !atPeace(s, s.active, a.owner)).map(a => ({
      p: a, score: distance(army, a) + 2,
    })),
    ...s.ruins.filter(r => army.hero && r.exploredBy === null).map(r => ({ p: r, score: distance(army, r) - 3 })),
  ];
}

export function conquestDestination(s: GameState, army: Army): Position | null {
  for (const target of targets(s, army).sort((a, b) => a.score - b.score)) {
    const path = route(s, army, target.p);
    if (!path?.tiles.length) continue;
    const defender = armyAt(s, target.p);
    if (defender && defender.owner !== army.owner && strength(army) < strength(defender, !!cityAt(s, defender)) * 0.65) continue;
    const to = marchDestination(s, army, target.p);
    if (to) return to;
  }
  return null;
}

export function reinforcementDestination(s: GameState, army: Army): Position | null {
  const friends = s.armies.filter(a => a.owner === army.owner && a.id !== army.id
    && a.units.length + army.units.length <= STACK_LIMIT && !(a.hero && army.hero));
  friends.sort((a, b) => distance(army, a) - distance(army, b));
  for (const friend of friends) {
    const to = marchDestination(s, army, friend);
    if (to) return to;
  }
  return null;
}
