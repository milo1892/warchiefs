import { HERO_COST, HERO_NAMES } from '../content/rules';
import type { CommandOf, GameState } from './model';
import { armyAt, ownedArmy, ownedCity, sameTile } from './selectors';
import { addReport, ensure, random } from './state';

export function recruitHero(s: GameState, command: CommandOf<'hero'>): void {
  const city = ownedCity(s, command.cityId);
  const faction = s.factions[s.active];
  ensure(!s.armies.some(a => a.owner === s.active && a.hero), 'Your faction already has a hero.');
  const army = armyAt(s, city);
  ensure(army && army.owner === s.active, 'A friendly army must be stationed in the city.');
  ensure(faction.gold >= HERO_COST, `A hero costs ${HERO_COST} gold.`);
  faction.gold -= HERO_COST;
  army.hero = { id: `hero-${s.nextId++}`, name: HERO_NAMES[s.active], level: 1 };
  addReport(s, `${army.hero.name} joins ${faction.name}.`);
}

export function exploreRuin(s: GameState, command: CommandOf<'explore'>): void {
  const army = ownedArmy(s, command.armyId);
  const ruin = s.ruins.find(r => sameTile(r, army));
  ensure(army.hero && ruin && ruin.exploredBy === null, 'A hero must stand on an unexplored ruin.');
  ensure(army.movement > 0, 'Exploration requires remaining movement.');
  ruin.exploredBy = s.active;
  army.movement = 0;
  if (random(s) < 0.2) {
    addReport(s, `${army.hero.name} was lost in ${ruin.name}. The ruin is sealed.`);
    army.hero = null;
    return;
  }
  const reward = 40 + Math.floor(random(s) * 31);
  s.factions[s.active].gold += reward;
  army.hero.level++;
  addReport(s, `${army.hero.name} explored ${ruin.name}: +${reward} gold and a level.`);
}
