import type { Command, GameState } from './model';
import { moveArmy, splitArmy } from './movement';
import { recruit } from './economy';
import { recruitHero, exploreRuin } from './heroes';
import { proposePeace, respondPeace, declareWar } from './diplomacy';
import { checkQuests } from './quests';
import { endTurn, checkWinner } from './turns';
import { alive } from './selectors';
import { ensure } from './state';

function dispatch(s: GameState, command: Command): void {
  switch (command.type) {
    case 'move': return moveArmy(s, command);
    case 'split': return splitArmy(s, command);
    case 'recruit': return recruit(s, command);
    case 'hero': return recruitHero(s, command);
    case 'explore': return exploreRuin(s, command);
    case 'propose': return proposePeace(s, command);
    case 'respond': return respondPeace(s, command);
    case 'declare': return declareWar(s, command);
    case 'end': return endTurn(s);
  }
}

export function applyCommand(previous: GameState, command: Command): GameState {
  ensure(previous.winner === null, 'The game has ended.');
  ensure(alive(previous, previous.active), 'The active faction has been eliminated.');
  const s = structuredClone(previous);
  dispatch(s, command);
  if (command.type !== 'end') s.aiSteps++;
  s.sequence++;
  checkQuests(s);
  checkWinner(s);
  s.proposals = s.proposals.filter(p => alive(s, p.from) && alive(s, p.to));
  if (s.winner === null && !alive(s, s.active)) endTurn(s);
  return s;
}
