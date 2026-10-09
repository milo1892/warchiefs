import { FACTIONS, type Army, type City, type GameState, type Terrain } from '../game/model';
import { FACTION_DEFINITIONS } from './rules';

const WIDTH = 40;
const HEIGHT = 30;
const CITY_SITES = [
  [3, 3, 'Alderwatch'], [36, 3, 'Dawnspire'], [36, 26, 'Emberkeep'], [3, 26, 'Tidehold'],
  [11, 3, 'Mossford'], [28, 3, 'Sunfield'], [28, 26, 'Cinderbrook'], [11, 26, 'Mistvale'],
  [17, 14, 'Stonegate'], [22, 14, 'Eastbridge'], [17, 6, 'Northcross'], [22, 23, 'Southcross'],
] as const;

function terrainAt(x: number, y: number): Terrain {
  if (x === 19) return [6, 14, 23].includes(y) ? 'bridge' : 'water';
  if (y >= 10 && y <= 17 && ((x >= 9 && x <= 12) || (x >= 28 && x <= 31))) return 'mountain';
  if ((x >= 5 && x <= 10 && y >= 4 && y <= 7) || (x >= 25 && x <= 35 && y >= 21 && y <= 24)) return 'forest';
  return 'plain';
}

function createCities(): City[] {
  return CITY_SITES.map(([x, y, name], i) => ({
    id: `city-${i}`, x, y, name, owner: i < 4 ? FACTIONS[i] : -1, queue: null,
  }));
}

function startingArmy(city: City, i: number): Army {
  return {
    id: `army-${i}`, owner: city.owner, x: city.x, y: city.y,
    units: i < 4 ? ['soldier', 'soldier', 'guard', 'rider'] : ['guard', 'soldier'],
    movement: i < 4 ? 4 : 0, hero: null,
  };
}

export function createGame(seed: number): GameState {
  const tiles = Array.from({ length: WIDTH * HEIGHT }, (_, i) => terrainAt(i % WIDTH, Math.floor(i / WIDTH)));
  const cities = createCities();
  for (const city of cities) tiles[city.y * WIDTH + city.x] = 'plain';
  return {
    map: { width: WIDTH, height: HEIGHT, tiles },
    factions: structuredClone(FACTION_DEFINITIONS),
    cities,
    armies: cities.map(startingArmy),
    ruins: [
      { id: 'ruin-0', name: 'Whisper Vault', x: 7, y: 12, exploredBy: null },
      { id: 'ruin-1', name: 'Sundial Crypt', x: 33, y: 9, exploredBy: null },
      { id: 'ruin-2', name: 'Ashen Observatory', x: 33, y: 19, exploredBy: null },
      { id: 'ruin-3', name: 'Drowned Archive', x: 7, y: 21, exploredBy: null },
    ],
    quests: FACTIONS.flatMap(owner => [
      { id: `quest-${owner}-city`, owner, kind: 'city' as const, target: 'city-8', completed: false },
      { id: `quest-${owner}-ruin`, owner, kind: 'ruin' as const, target: null, completed: false },
    ]),
    relations: FACTIONS.map(a => FACTIONS.map(b => a === b ? 'peace' : 'war')),
    proposals: [], active: 0, round: 1, sequence: 0, nextId: 12,
    rng: seed >>> 0, aiSteps: 0, winner: null,
    log: ['Your banner rises at Alderwatch. Recruit a hero, muster armies, and claim the realm.'],
  };
}
