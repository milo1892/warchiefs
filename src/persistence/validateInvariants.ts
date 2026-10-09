import { UNITS } from '../content/rules';
import { FACTIONS, type GameState, type Position } from '../game/model';
import { terrainCost } from '../game/pathfinding';
import { alive, armyAt } from '../game/selectors';

function unique(values: string[], label: string): string[] {
  return new Set(values).size === values.length ? [] : [`Duplicate ${label}.`];
}

function validateEntities(s: GameState): string[] {
  const errors: string[] = [];
  const entities = [...s.armies, ...s.cities, ...s.ruins];
  if (entities.some(p => !Number.isFinite(terrainCost(s, p)))) errors.push('An entity occupies an invalid or impassable tile.');
  const tileKey = (p: Position) => `${p.x},${p.y}`;
  for (const group of [s.armies, s.cities, s.ruins]) {
    errors.push(...unique(group.map(e => e.id), 'entity identifiers'), ...unique(group.map(tileKey), 'occupied tiles'));
  }
  errors.push(...unique(s.quests.map(q => q.id), 'quest identifiers'));
  if (s.cities.some(c => armyAt(s, c) && armyAt(s, c)?.owner !== c.owner)) errors.push('City and occupying army ownership disagree.');
  if (s.cities.some(c => c.queue && (c.owner === -1 || c.queue.remaining > UNITS[c.queue.kind].turns))) errors.push('Invalid recruitment phase.');
  const heroes = s.armies.flatMap(a => a.hero ? [{ owner: a.owner, hero: a.hero }] : []);
  errors.push(...unique(heroes.map(a => a.hero.id), 'hero identifiers'));
  if (heroes.some(a => a.owner === -1)) errors.push('Neutral armies cannot have heroes.');
  if (FACTIONS.some(id => heroes.filter(a => a.owner === id).length > 1)) errors.push('A faction has multiple heroes.');
  const allocated = [...s.armies.map(a => a.id), ...heroes.map(a => a.hero.id)];
  if (allocated.some(id => !/^(army|hero)-\d+$/.test(id) || Number(id.split('-')[1]) >= s.nextId)) errors.push('Invalid entity allocation counter.');
  return errors;
}

function validatePolitics(s: GameState): string[] {
  const errors: string[] = [];
  if (s.factions.some((f, i) => f.id !== i)) errors.push('Faction definitions must be ordered and unique.');
  if (FACTIONS.some(a => FACTIONS.some(b => s.relations[a][b] !== s.relations[b][a]))) errors.push('Relations must be symmetric.');
  if (FACTIONS.some(a => s.relations[a][a] !== 'peace')) errors.push('A faction cannot be at war with itself.');
  for (const p of s.proposals) {
    if (p.from === p.to || p.expires < s.round || !alive(s, p.from) || !alive(s, p.to) || s.relations[p.from][p.to] !== 'war') errors.push('Invalid peace proposal.');
  }
  errors.push(...unique(s.proposals.map(p => [p.from, p.to].sort().join('-')), 'peace proposals'));
  const survivors = FACTIONS.filter(id => alive(s, id));
  if (!survivors.length || (s.winner === null && survivors.length === 1)) errors.push('Invalid victory state.');
  if (s.winner !== null && (survivors.length !== 1 || survivors[0] !== s.winner)) errors.push('Winner does not match surviving factions.');
  if (s.winner === null && !alive(s, s.active)) errors.push('An eliminated faction cannot have an active turn.');
  return errors;
}

function validateQuests(s: GameState): string[] {
  const invalid = s.quests.some(q => q.kind === 'city'
    ? !s.cities.some(c => c.id === q.target)
    : q.target !== null || (q.completed && !s.ruins.some(r => r.exploredBy === q.owner)));
  return invalid ? ['Invalid quest target or progress.'] : [];
}

export function validateInvariants(s: GameState): string[] {
  const errors = [...validateEntities(s), ...validatePolitics(s), ...validateQuests(s)];
  if (s.map.tiles.length !== s.map.width * s.map.height) errors.push('Map dimensions do not match its tile data.');
  return errors;
}
