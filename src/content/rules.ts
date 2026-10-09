import type { Faction, UnitKind } from '../game/model';

export const STACK_LIMIT = 12;
export const HERO_COST = 70;
export const CITY_INCOME = 12;
export const QUEST_REWARD = 60;
export const UNITS: Record<UnitKind, { name: string; cost: number; turns: number; strength: number; movement: number }> = {
  soldier: { name: 'Soldiers', cost: 14, turns: 1, strength: 6, movement: 5 },
  guard: { name: 'Guards', cost: 20, turns: 1, strength: 8, movement: 4 },
  rider: { name: 'Riders', cost: 28, turns: 2, strength: 10, movement: 8 },
};
export const FACTION_DEFINITIONS: Faction[] = [
  { id: 0, name: 'Alder Pact', color: '#7dcf9b', gold: 100 },
  { id: 1, name: 'Dawn Banner', color: '#e9c568', gold: 100 },
  { id: 2, name: 'Ember Court', color: '#ed9280', gold: 100 },
  { id: 3, name: 'Tide Council', color: '#82b9ed', gold: 100 },
];
export const HERO_NAMES = ['Rowan', 'Aurelia', 'Cinder', 'Maren'];
