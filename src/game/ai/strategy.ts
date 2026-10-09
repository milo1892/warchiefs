import { HERO_COST, UNITS } from '../../content/rules';
import { FACTIONS, type Command, type GameState } from '../model';
import { alive, armyAt, sameTile, strength } from '../selectors';
import { conquestDestination, reinforcementDestination } from './targets';

function productionCommand(s: GameState): Command | null {
  const cities = s.cities.filter(c => c.owner === s.active);
  const own = s.armies.filter(a => a.owner === s.active);
  if (!own.some(a => a.hero) && s.factions[s.active].gold >= HERO_COST) {
    const city = cities.find(c => armyAt(s, c)?.owner === s.active);
    if (city) return { type: 'hero', cityId: city.id };
  }
  const city = cities.find(c => !c.queue);
  const kind = s.round % 3 === 0 ? 'rider' : 'soldier';
  if (city && s.factions[s.active].gold >= UNITS[kind].cost) return { type: 'recruit', cityId: city.id, kind };
  return null;
}

function diplomacyCommand(s: GameState): Command | null {
  const proposal = s.proposals.find(p => p.to === s.active);
  if (proposal) {
    const total = (owner: number) => s.armies.filter(a => a.owner === owner).reduce((v, a) => v + strength(a), 0);
    return { type: 'respond', from: proposal.from, accept: total(s.active) < total(proposal.from) };
  }
  const targets = s.cities.filter(c => c.owner !== s.active && (c.owner === -1 || s.relations[s.active][c.owner] === 'war'));
  if (!targets.length || s.round % 8 === 0) {
    const rival = FACTIONS.find(id => id !== s.active && alive(s, id) && s.relations[s.active][id] === 'peace');
    if (rival !== undefined) return { type: 'declare', to: rival };
  }
  return null;
}

function armyCommand(s: GameState): Command | null {
  const own = s.armies.filter(a => a.owner === s.active && a.movement > 0);
  for (const army of own.sort((a, b) => strength(b) - strength(a))) {
    if (army.hero && s.ruins.some(r => r.exploredBy === null && sameTile(r, army))) return { type: 'explore', armyId: army.id };
    const to = conquestDestination(s, army) ?? reinforcementDestination(s, army);
    if (to) return { type: 'move', armyId: army.id, to };
  }
  return null;
}

function peaceOffer(s: GameState): Command | null {
  if (s.round < 3 || s.cities.filter(c => c.owner === s.active).length > 1 || s.aiSteps !== 0) return null;
  const rival = FACTIONS.find(id => id !== s.active && alive(s, id) && s.relations[s.active][id] === 'war'
    && !s.proposals.some(p => (p.from === s.active && p.to === id) || (p.to === s.active && p.from === id)));
  return rival === undefined ? null : { type: 'propose', to: rival };
}

export function nextAICommand(s: GameState): Command {
  if (s.aiSteps >= 60) return { type: 'end' };
  return diplomacyCommand(s) ?? productionCommand(s) ?? armyCommand(s) ?? peaceOffer(s) ?? { type: 'end' };
}
