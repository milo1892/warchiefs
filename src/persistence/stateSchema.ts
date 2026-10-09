import { z } from 'zod';
import { STACK_LIMIT } from '../content/rules';
import { UNIT_KINDS, type GameState } from '../game/model';
import { validateInvariants } from './validateInvariants';

const factionId = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);
const owner = z.union([factionId, z.literal(-1)]);
const natural = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const text = z.string().min(1).max(100);
const position = { x: natural, y: natural };
const unit = z.enum(UNIT_KINDS);
const hero = z.object({ id: text, name: text, level: z.number().int().min(1).max(20) });
const army = z.object({
  ...position, id: text, owner, units: z.array(unit).min(1).max(STACK_LIMIT),
  movement: z.number().int().min(0).max(9), hero: hero.nullable(),
});
const city = z.object({
  ...position, id: text, name: text, owner,
  queue: z.object({ kind: unit, remaining: z.number().int().min(0).max(2) }).nullable(),
});
const quest = z.object({
  id: text, owner: factionId, kind: z.enum(['city', 'ruin']),
  target: text.nullable(), completed: z.boolean(),
});

export const stateSchema: z.ZodType<GameState> = z.object({
  map: z.object({
    width: z.number().int().min(1).max(80), height: z.number().int().min(1).max(80),
    tiles: z.array(z.enum(['plain', 'forest', 'mountain', 'water', 'bridge'])).max(6400),
  }),
  factions: z.array(z.object({
    id: factionId, name: text, color: z.string().regex(/^#[a-fA-F0-9]{6}$/),
    gold: z.number().int().min(0).max(1_000_000_000),
  })).length(4),
  armies: z.array(army).max(500),
  cities: z.array(city).min(1).max(200),
  ruins: z.array(z.object({ ...position, id: text, name: text, exploredBy: factionId.nullable() })).max(80),
  quests: z.array(quest).max(100),
  relations: z.array(z.array(z.enum(['war', 'peace'])).length(4)).length(4),
  proposals: z.array(z.object({ from: factionId, to: factionId, expires: natural })).max(12),
  active: factionId, round: z.number().int().min(1).max(10_000_000),
  sequence: natural, nextId: natural, rng: z.number().int().min(0).max(0xffffffff),
  aiSteps: natural, winner: factionId.nullable(), log: z.array(z.string().max(500)).max(80),
}).superRefine((s, context) => {
  for (const message of validateInvariants(s)) context.addIssue({ code: 'custom', message });
});
