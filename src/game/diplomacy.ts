import type { CommandOf, FactionId, GameState, Proposal } from './model';
import { alive } from './selectors';
import { addReport, ensure } from './state';

function between(p: Proposal, a: FactionId, b: FactionId): boolean {
  return (p.from === a && p.to === b) || (p.from === b && p.to === a);
}

export function proposePeace(s: GameState, command: CommandOf<'propose'>): void {
  const rival = command.to;
  ensure(rival !== s.active && alive(s, rival) && s.relations[s.active][rival] === 'war', 'Choose a living rival at war.');
  ensure(!s.proposals.some(p => between(p, s.active, rival)), 'A proposal between these factions is already pending.');
  s.proposals.push({ from: s.active, to: rival, expires: s.round + 2 });
  addReport(s, `${s.factions[s.active].name} offers peace to ${s.factions[rival].name}.`);
}

export function respondPeace(s: GameState, command: CommandOf<'respond'>): void {
  const proposal = s.proposals.find(p => p.to === s.active && p.from === command.from);
  ensure(proposal, 'That proposal is no longer available.');
  if (command.accept) s.relations[s.active][command.from] = s.relations[command.from][s.active] = 'peace';
  s.proposals = s.proposals.filter(p => p !== proposal);
  addReport(s, `${s.factions[s.active].name} ${command.accept ? 'accepted' : 'rejected'} peace with ${s.factions[command.from].name}.`);
}

export function declareWar(s: GameState, command: CommandOf<'declare'>): void {
  const rival = command.to;
  ensure(rival !== s.active && alive(s, rival) && s.relations[s.active][rival] === 'peace', 'Choose a living peaceful rival.');
  s.relations[s.active][rival] = s.relations[rival][s.active] = 'war';
  s.proposals = s.proposals.filter(p => !between(p, s.active, rival));
  addReport(s, `${s.factions[s.active].name} declares war on ${s.factions[rival].name}.`);
}
