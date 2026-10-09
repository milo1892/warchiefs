import type { Army, CommandOf, GameState } from './model';
import { battle, removeArmy } from './combat';
import { route, terrainCost } from './pathfinding';
import { armyAt, atPeace, cityAt, distance, ownedArmy } from './selectors';
import { addReport, ensure } from './state';

function capture(s: GameState, army: Army): void {
  const city = cityAt(s, army);
  if (!city || city.owner === army.owner) return;
  ensure(!atPeace(s, army.owner, city.owner), 'Declare war before capturing a peaceful city.');
  city.owner = army.owner;
  city.queue = null;
  addReport(s, `${city.name} now flies the ${s.factions[s.active].name} banner.`);
}

function merge(s: GameState, army: Army, resident: Army): void {
  resident.units.push(...army.units);
  resident.hero ??= army.hero;
  resident.movement = Math.min(resident.movement, army.movement);
  removeArmy(s, army);
  addReport(s, 'Armies merged.');
}

export function moveArmy(s: GameState, command: CommandOf<'move'>): void {
  const army = ownedArmy(s, command.armyId);
  const path = route(s, army, command.to);
  ensure(path && path.tiles.length > 0 && path.cost <= army.movement, 'Destination is blocked or beyond remaining movement.');
  const defender = armyAt(s, command.to);
  army.movement -= path.cost;
  if (defender && defender.id !== army.id) {
    if (defender.owner === army.owner) merge(s, army, defender);
    else battle(s, army, defender);
  } else {
    army.x = command.to.x;
    army.y = command.to.y;
  }
  if (s.armies.some(a => a.id === army.id)) capture(s, army);
}

export function splitArmy(s: GameState, command: CommandOf<'split'>): void {
  const army = ownedArmy(s, command.armyId);
  ensure(Number.isInteger(command.count) && command.count > 0 && command.count < army.units.length, 'Leave at least one unit in each army.');
  ensure(distance(army, command.to) === 1 && !armyAt(s, command.to) && !cityAt(s, command.to), 'Split onto an empty adjacent non-city tile.');
  const cost = terrainCost(s, command.to);
  ensure(cost <= army.movement, 'Not enough movement to split there.');
  army.movement -= cost;
  s.armies.push({
    id: `army-${s.nextId++}`, owner: army.owner, ...command.to,
    units: army.units.splice(-command.count), movement: army.movement, hero: null,
  });
}
