export const FACTIONS = [0, 1, 2, 3] as const;
export type FactionId = (typeof FACTIONS)[number];
export type Owner = FactionId | -1;
export type Terrain = 'plain' | 'forest' | 'mountain' | 'water' | 'bridge';
export const UNIT_KINDS = ['soldier', 'guard', 'rider'] as const;
export type UnitKind = (typeof UNIT_KINDS)[number];
export type Relation = 'war' | 'peace';
export type Position = { x: number; y: number };
export type Hero = { id: string; name: string; level: number };
export type Faction = { id: FactionId; name: string; color: string; gold: number };
export type Army = Position & {
  id: string;
  owner: Owner;
  units: UnitKind[];
  movement: number;
  hero: Hero | null;
};
export type City = Position & {
  id: string;
  name: string;
  owner: Owner;
  queue: { kind: UnitKind; remaining: number } | null;
};
export type Ruin = Position & { id: string; name: string; exploredBy: FactionId | null };
export type Quest = {
  id: string;
  owner: FactionId;
  kind: 'city' | 'ruin';
  target: string | null;
  completed: boolean;
};
export type Proposal = { from: FactionId; to: FactionId; expires: number };
export type GameState = {
  map: { width: number; height: number; tiles: Terrain[] };
  factions: Faction[];
  armies: Army[];
  cities: City[];
  ruins: Ruin[];
  quests: Quest[];
  relations: Relation[][];
  proposals: Proposal[];
  active: FactionId;
  round: number;
  sequence: number;
  nextId: number;
  rng: number;
  aiSteps: number;
  winner: FactionId | null;
  log: string[];
};
export type Command =
  | { type: 'move'; armyId: string; to: Position }
  | { type: 'recruit'; cityId: string; kind: UnitKind }
  | { type: 'hero'; cityId: string }
  | { type: 'split'; armyId: string; count: number; to: Position }
  | { type: 'explore'; armyId: string }
  | { type: 'propose'; to: FactionId }
  | { type: 'respond'; from: FactionId; accept: boolean }
  | { type: 'declare'; to: FactionId }
  | { type: 'end' };
export type CommandOf<T extends Command['type']> = Extract<Command, { type: T }>;
export type Route = { tiles: Position[]; cost: number };
