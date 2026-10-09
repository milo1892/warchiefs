import { CITY_INCOME, STACK_LIMIT, UNITS } from '../content/rules';
import type { City, CommandOf, GameState } from './model';
import { armyAt, ownedCity } from './selectors';
import { addReport, ensure } from './state';

export function recruit(s: GameState, command: CommandOf<'recruit'>): void {
  const city = ownedCity(s, command.cityId);
  const faction = s.factions[s.active];
  const unit = UNITS[command.kind];
  ensure(unit, 'Unknown unit type.');
  ensure(!city.queue, 'This city already has a recruitment order.');
  ensure(faction.gold >= unit.cost, 'Not enough gold.');
  faction.gold -= unit.cost;
  city.queue = { kind: command.kind, remaining: unit.turns };
  addReport(s, `${city.name} will recruit ${unit.name.toLowerCase()}.`);
}

function completeRecruitment(s: GameState, city: City): void {
  if (!city.queue) return;
  const resident = armyAt(s, city);
  if (resident && resident.owner === s.active && resident.units.length < STACK_LIMIT) {
    resident.units.push(city.queue.kind);
    city.queue = null;
  } else if (!resident) {
    s.armies.push({
      id: `army-${s.nextId++}`, x: city.x, y: city.y, owner: s.active,
      units: [city.queue.kind], movement: 0, hero: null,
    });
    city.queue = null;
  }
}

export function advanceEconomy(s: GameState): void {
  for (const city of s.cities.filter(c => c.owner === s.active)) {
    s.factions[s.active].gold += CITY_INCOME;
    if (!city.queue) continue;
    city.queue.remaining = Math.max(0, city.queue.remaining - 1);
    if (city.queue.remaining === 0) completeRecruitment(s, city);
  }
}
