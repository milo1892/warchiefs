import { expect, it } from 'vitest';
import { createGame } from '../../content/map';
import { applyCommand } from '../commands';
import { snapshot } from '../../persistence/snapshot';
import { nextAICommand } from './strategy';

it.each([11, 42, 197])('plays a complete legal seeded game (%i)', seed => {
  let s = createGame(seed);
  for (let i = 0; i < 12_000 && s.winner === null; i++) {
    s = applyCommand(s, nextAICommand(s));
    if (i % 100 === 0) expect(snapshot(s).state).toEqual(s);
  }
  expect(s.winner, `No victory by round ${s.round}, sequence ${s.sequence}`).not.toBeNull();
  expect(snapshot(s).state).toEqual(s);
}, 60_000);
