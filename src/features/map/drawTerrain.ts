import type { Terrain } from '../../game/model';
import { TILE_SIZE } from './camera';

const COLORS: Record<Terrain, string> = { plain: '#516441', forest: '#304f3d', mountain: '#68716b', water: '#274e61', bridge: '#9b906b' };

export function drawTerrain(ctx: CanvasRenderingContext2D, tile: Terrain, x: number, y: number): void {
  const size = TILE_SIZE;
  ctx.fillStyle = COLORS[tile];
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = '#192c2333';
  ctx.strokeRect(x, y, size, size);
  if (tile === 'forest' || tile === 'mountain') {
    ctx.fillStyle = tile === 'forest' ? '#213c30' : '#b0b5a3';
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 23);
    ctx.lineTo(x + 14, y + 5);
    ctx.lineTo(x + 23, y + 23);
    ctx.fill();
  }
  if (tile === 'water') {
    ctx.strokeStyle = '#47788a';
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 14);
    ctx.lineTo(x + 22, y + 14);
    ctx.stroke();
  }
}
