import { z } from 'zod';
import type { GameState } from '../game/model';
import { stateSchema } from './stateSchema';

export const MAX_SAVE_BYTES = 2_000_000;
export class SaveError extends Error {}
const versions = z.object({
  format: z.literal('warchiefs'),
  rulesVersion: z.literal(1),
  contentVersion: z.literal(1),
  state: stateSchema,
});
const currentSchema = versions.extend({ schemaVersion: z.literal(2), rngAlgorithm: z.literal('lcg32-v1') });
const legacySchema = versions.extend({ schemaVersion: z.literal(1) });
export type Snapshot = z.infer<typeof currentSchema>;

export function snapshot(state: GameState): Snapshot {
  return currentSchema.parse({
    format: 'warchiefs', schemaVersion: 2, rulesVersion: 1, contentVersion: 1,
    rngAlgorithm: 'lcg32-v1', state,
  });
}

export function parseSnapshot(value: unknown): Snapshot {
  const current = currentSchema.safeParse(value);
  if (current.success) return current.data;
  const legacy = legacySchema.safeParse(value);
  if (legacy.success) return snapshot(legacy.data.state);
  throw new SaveError(`Invalid or incompatible Warchiefs save: ${current.error.issues[0]?.message ?? 'unknown format'}. Existing games were not changed.`);
}

export function importText(text: string): Snapshot {
  if (new TextEncoder().encode(text).length > MAX_SAVE_BYTES) throw new SaveError('Save file exceeds the 2 MB limit.');
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    throw new SaveError('Save file is not valid JSON.');
  }
  return parseSnapshot(value);
}

export function exportText(state: GameState): string {
  return JSON.stringify(snapshot(state), null, 2);
}
