import type { GameState } from './model';

export class RuleError extends Error {}

export function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new RuleError(message);
}

export function addReport(s: GameState, message: string): void {
  s.log = [message, ...s.log].slice(0, 80);
}

export function random(s: GameState): number {
  s.rng = (Math.imul(s.rng, 1664525) + 1013904223) >>> 0;
  return s.rng / 4294967296;
}
