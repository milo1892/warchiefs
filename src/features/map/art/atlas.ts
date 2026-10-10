import type { Owner, UnitKind } from '../../../game/model';

export const ART_TILE_SIZE = 32;
export const ATLAS_CELL_SIZE = 48;
export const ATLAS_COLUMNS = 8;
export const ATLAS_URL = '/art/atlas.png';

export const GRASS_SPRITES = ['grass-0', 'grass-1', 'grass-2', 'grass-3'] as const;
export const WATER_SPRITES = ['water-0', 'water-1', 'water-2'] as const;
export const ROAD_SPRITES = [
  'road-0', 'road-1', 'road-2', 'road-3', 'road-4', 'road-5', 'road-6', 'road-7',
  'road-8', 'road-9', 'road-10', 'road-11', 'road-12', 'road-13', 'road-14', 'road-15',
] as const;
export const COAST_SPRITES = [
  'coast-0', 'coast-1', 'coast-2', 'coast-3', 'coast-4', 'coast-5', 'coast-6', 'coast-7',
  'coast-8', 'coast-9', 'coast-10', 'coast-11', 'coast-12', 'coast-13', 'coast-14', 'coast-15',
] as const;

export const SPRITES = [
  ...GRASS_SPRITES.map((id, variant) => ({ id, kind: 'grass' as const, variant })),
  ...WATER_SPRITES.map((id, variant) => ({ id, kind: 'water' as const, variant })),
  { id: 'oak-0', kind: 'oak', variant: 0 }, { id: 'oak-1', kind: 'oak', variant: 1 },
  { id: 'pine', kind: 'pine' }, { id: 'bush', kind: 'bush' }, { id: 'rock', kind: 'rock' },
  { id: 'mountain-0', kind: 'mountain', variant: 0 }, { id: 'mountain-1', kind: 'mountain', variant: 1 },
  { id: 'bridge-horizontal', kind: 'bridge', vertical: false }, { id: 'bridge-vertical', kind: 'bridge', vertical: true },
  { id: 'castle-alder', kind: 'castle', owner: 0 }, { id: 'castle-dawn', kind: 'castle', owner: 1 },
  { id: 'castle-ember', kind: 'castle', owner: 2 }, { id: 'castle-tide', kind: 'castle', owner: 3 },
  { id: 'castle-neutral', kind: 'castle', owner: -1 },
  { id: 'ruin-open', kind: 'ruin', sealed: false }, { id: 'ruin-sealed', kind: 'ruin', sealed: true },
  { id: 'army-soldier', kind: 'unit', role: 'soldier' }, { id: 'army-guard', kind: 'unit', role: 'guard' },
  { id: 'army-rider', kind: 'unit', role: 'rider' }, { id: 'army-hero', kind: 'unit', role: 'hero' },
  ...ROAD_SPRITES.map((id, mask) => ({ id, kind: 'road' as const, mask })),
  ...COAST_SPRITES.map((id, mask) => ({ id, kind: 'coast' as const, mask })),
] as const;

export type SpriteRecipe = (typeof SPRITES)[number];
export type SpriteName = SpriteRecipe['id'];
export type SpriteFrame = { x: number; y: number; width: number; height: number };
export const ATLAS_WIDTH = ATLAS_COLUMNS * ATLAS_CELL_SIZE;
export const ATLAS_HEIGHT = Math.ceil(SPRITES.length / ATLAS_COLUMNS) * ATLAS_CELL_SIZE;
export const CITY_SPRITES: Readonly<Record<Owner, SpriteName>> = {
  '-1': 'castle-neutral', 0: 'castle-alder', 1: 'castle-dawn', 2: 'castle-ember', 3: 'castle-tide',
};
export const UNIT_SPRITES: Readonly<Record<UnitKind, SpriteName>> = {
  soldier: 'army-soldier', guard: 'army-guard', rider: 'army-rider',
};
export const FACTION_CRESTS: Readonly<Record<Owner, readonly (readonly [number, number])[]>> = {
  '-1': [[2, 2], [3, 2], [4, 2]],
  0: [[3, 1], [2, 2], [3, 2], [3, 3]],
  1: [[3, 1], [2, 2], [3, 2], [4, 2], [3, 3]],
  2: [[3, 1], [2, 3], [3, 2], [3, 3], [4, 3]],
  3: [[2, 2], [3, 3], [4, 2]],
};

export function spriteFrame(name: SpriteName): SpriteFrame {
  const index = SPRITES.findIndex(sprite => sprite.id === name);
  if (index < 0) throw new Error(`Unknown sprite: ${name}.`);
  return {
    x: (index % ATLAS_COLUMNS) * ATLAS_CELL_SIZE,
    y: Math.floor(index / ATLAS_COLUMNS) * ATLAS_CELL_SIZE,
    width: ATLAS_CELL_SIZE, height: ATLAS_CELL_SIZE,
  };
}
