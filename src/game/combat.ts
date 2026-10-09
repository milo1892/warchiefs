import type { Army, GameState } from './model';
import { cityAt, strength } from './selectors';
import { addReport, random } from './state';

export function removeArmy(s: GameState, army: Army): void {
  s.armies = s.armies.filter(other => other.id !== army.id);
}

export function battle(s: GameState, attacker: Army, defender: Army): void {
  const attack = strength(attacker);
  const defense = strength(defender, !!cityAt(s, defender));
  let casualties = 0;
  while (attacker.units.length && defender.units.length) {
    const a = strength(attacker);
    const d = strength(defender, !!cityAt(s, defender));
    if (random(s) < a / (a + d)) defender.units.pop();
    else attacker.units.pop();
    casualties++;
  }
  const attackerWon = attacker.units.length > 0;
  const winner = attackerWon ? attacker : defender;
  const loser = attackerWon ? defender : attacker;
  const name = winner.owner === -1 ? 'Neutral defenders' : s.factions[winner.owner].name;
  addReport(s, `${name} won at (${defender.x + 1}, ${defender.y + 1}): ${Math.round(attack)} vs ${Math.round(defense)}, ${casualties} casualties.${loser.hero ? ` ${loser.hero.name} fell.` : ''}`);
  removeArmy(s, loser);
  if (attackerWon) {
    attacker.x = defender.x;
    attacker.y = defender.y;
  }
  attacker.movement = 0;
}
