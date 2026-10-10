import type { GameState, Position, Terrain } from '../../../game/model';
import { ART_TILE_SIZE, COAST_SPRITES, GRASS_SPRITES, ROAD_SPRITES, WATER_SPRITES } from './atlas';
import { artNoise } from './noise';
import { buildRoads, neighborMask, shoreMask, tileKey } from './geometry';
import { drawGroundSprite, drawObjectSprite } from './drawSprite';

function roadMask(p: Position, roads: ReadonlySet<number>, width: number, height: number): number {
  return neighborMask(p, n => n.x >= 0 && n.y >= 0 && n.x < width && n.y < height && roads.has(tileKey(n, width)));
}

function drawGround(ctx: CanvasRenderingContext2D, image: HTMLImageElement, s: GameState, roads: ReadonlySet<number>): void {
  for (let y = 0; y < s.map.height; y++) {
    for (let x = 0; x < s.map.width; x++) {
      const p = { x, y };
      const tile = s.map.tiles[tileKey(p, s.map.width)];
      const noise = artNoise(x, y);
      const wet = tile === 'water' || tile === 'bridge';
      const sprite = wet ? WATER_SPRITES[noise % WATER_SPRITES.length] : GRASS_SPRITES[noise % GRASS_SPRITES.length];
      drawGroundSprite(ctx, image, sprite, x * ART_TILE_SIZE, y * ART_TILE_SIZE);
      if (wet) drawGroundSprite(ctx, image, COAST_SPRITES[shoreMask(s, p)], x * ART_TILE_SIZE, y * ART_TILE_SIZE);
      else if (roads.has(tileKey(p, s.map.width))) {
        drawGroundSprite(ctx, image, ROAD_SPRITES[roadMask(p, roads, s.map.width, s.map.height)], x * ART_TILE_SIZE, y * ART_TILE_SIZE);
      }
    }
  }
}

function drawScenery(ctx: CanvasRenderingContext2D, image: HTMLImageElement, tile: Terrain, p: Position, onRoad: boolean): void {
  const noise = artNoise(p.x, p.y, 4);
  const point = { x: (p.x + 0.5) * ART_TILE_SIZE, y: (p.y + 1) * ART_TILE_SIZE };
  if (tile === 'forest') {
    point.x += onRoad ? -11 : (noise % 5) - 2;
    point.y -= noise % 3;
    const sprite = onRoad || noise % 5 === 0 ? 'pine' : noise % 2 ? 'oak-0' : 'oak-1';
    drawObjectSprite(ctx, image, sprite, point, onRoad ? 0.6 : 1);
  } else if (tile === 'mountain') {
    drawObjectSprite(ctx, image, noise % 2 ? 'mountain-0' : 'mountain-1', point);
  } else if (tile === 'plain' && !onRoad && noise % 9 === 0) {
    point.x += 7;
    drawObjectSprite(ctx, image, noise % 2 ? 'bush' : 'rock', point, 0.7);
  }
}

function drawObjects(ctx: CanvasRenderingContext2D, image: HTMLImageElement, s: GameState, roads: ReadonlySet<number>): void {
  for (let y = 0; y < s.map.height; y++) {
    for (let x = 0; x < s.map.width; x++) {
      const p = { x, y };
      const tile = s.map.tiles[tileKey(p, s.map.width)];
      if (tile === 'bridge') {
        const mask = roadMask(p, roads, s.map.width, s.map.height);
        const sprite = mask & 5 && !(mask & 10) ? 'bridge-vertical' : 'bridge-horizontal';
        drawObjectSprite(ctx, image, sprite, { x: (x + 0.5) * ART_TILE_SIZE, y: (y + 0.5) * ART_TILE_SIZE }, 1, 24);
      } else drawScenery(ctx, image, tile, p, roads.has(tileKey(p, s.map.width)));
    }
  }
}

export function createTerrainLayer(image: HTMLImageElement, s: GameState): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = s.map.width * ART_TILE_SIZE;
  canvas.height = s.map.height * ART_TILE_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Terrain artwork requires a Canvas 2D context.');
  ctx.imageSmoothingEnabled = false;
  const roads = buildRoads(s);
  drawGround(ctx, image, s, roads);
  drawObjects(ctx, image, s, roads);
  return canvas;
}
