import { FACTIONS, type GameState } from './model';
import { advanceEconomy } from './economy';
import { alive, maximumMovement } from './selectors';
import { addReport } from './state';

function beginTurn(s: GameState): void {
  advanceEconomy(s);
  for (const army of s.armies.filter(a => a.owner === s.active)) army.movement = maximumMovement(army);
  s.aiSteps = 0;
  s.proposals = s.proposals.filter(p => p.expires >= s.round && alive(s, p.from) && alive(s, p.to));
  addReport(s, `Round ${s.round}: ${s.factions[s.active].name} begins its turn.`);
}

export function endTurn(s: GameState): void {
  let next = s.active;
  do {
    next = FACTIONS[(next + 1) % FACTIONS.length];
    if (next === 0) s.round++;
  } while (!alive(s, next));
  s.active = next;
  beginTurn(s);
}

export function checkWinner(s: GameState): void {
  const survivors = FACTIONS.filter(id => alive(s, id));
  if (survivors.length !== 1) return;
  s.winner = survivors[0];
  addReport(s, `${s.factions[s.winner].name} has united the realm!`);
}
