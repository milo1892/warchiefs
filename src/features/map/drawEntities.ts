import type { Army, GameState, Owner } from '../../game/model';
import { CITY_SPRITES, FACTION_CRESTS, UNIT_SPRITES, ART_TILE_SIZE } from './art/atlas';
import { drawObjectSprite } from './art/drawSprite';
import { TILE_SIZE, type Camera } from './camera';

function ownerColor(state: GameState, owner: Owner): string {
  return owner === -1 ? '#dad0af' : state.factions[owner].color;
}

function drawPennant(ctx: CanvasRenderingContext2D, state: GameState, owner: Owner, x: number, y: number): void {
  ctx.fillStyle = '#233626';
  ctx.fillRect(x - 1, y - 1, 9, 7);
  ctx.fillStyle = ownerColor(state, owner);
  ctx.fillRect(x, y, 7, 5);
  ctx.fillStyle = '#fff0c7';
  for (const [dx, dy] of FACTION_CRESTS[owner]) ctx.fillRect(x + dx, y + dy, 1, 1);
}

export function drawSettlements(ctx: CanvasRenderingContext2D, image: HTMLImageElement, state: GameState, camera: Camera): void {
  const scale = TILE_SIZE / ART_TILE_SIZE;
  for (const ruin of state.ruins) {
    drawObjectSprite(ctx, image, ruin.exploredBy === null ? 'ruin-open' : 'ruin-sealed',
      { x: (ruin.x + 0.5) * TILE_SIZE, y: (ruin.y + 1) * TILE_SIZE }, scale);
  }
  for (const city of state.cities) {
    drawObjectSprite(ctx, image, CITY_SPRITES[city.owner], { x: (city.x + 0.5) * TILE_SIZE, y: (city.y + 1) * TILE_SIZE }, scale);
    drawPennant(ctx, state, city.owner, city.x * TILE_SIZE + 15, city.y * TILE_SIZE - 6);
    if (camera.scale < 0.7) continue;
    ctx.font = 'bold 9px system-ui';
    ctx.strokeStyle = '#203629';
    ctx.lineWidth = 3;
    const x = (city.x + 0.5) * TILE_SIZE - ctx.measureText(city.name).width / 2;
    const y = city.y * TILE_SIZE - 12;
    ctx.strokeText(city.name, x, y);
    ctx.fillStyle = '#fff1d1';
    ctx.fillText(city.name, x, y);
  }
}

function armySprite(army: Army) {
  if (army.hero) return 'army-hero';
  const kind = army.units.includes('rider') ? 'rider' : army.units.includes('guard') ? 'guard' : 'soldier';
  return UNIT_SPRITES[kind];
}

export function drawArmies(ctx: CanvasRenderingContext2D, image: HTMLImageElement, state: GameState): void {
  for (const army of state.armies) {
    const x = army.x * TILE_SIZE;
    const y = army.y * TILE_SIZE;
    drawObjectSprite(ctx, image, armySprite(army), { x: x + TILE_SIZE / 2 + 3, y: y + TILE_SIZE }, TILE_SIZE / ART_TILE_SIZE);
    drawPennant(ctx, state, army.owner, x + 22, y + 3);
    ctx.font = 'bold 10px system-ui';
    const text = `${army.hero ? 'H' : ''}${army.units.length}`;
    const width = ctx.measureText(text).width + 4;
    ctx.fillStyle = '#172f26';
    ctx.fillRect(x + 28 - width, y + 20, width, 12);
    ctx.strokeStyle = ownerColor(state, army.owner);
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 28 - width, y + 20, width, 12);
    ctx.fillStyle = '#fff4d5';
    ctx.fillText(text, x + 30 - width, y + 29);
  }
}
