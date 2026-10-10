import type { GameState, Position } from '../../game/model';
import { TILE_SIZE } from './camera';

export function drawGrid(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.strokeStyle = '#213d343b';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let x = 0; x <= state.map.width; x++) {
    ctx.moveTo(x * TILE_SIZE, 0);
    ctx.lineTo(x * TILE_SIZE, state.map.height * TILE_SIZE);
  }
  for (let y = 0; y <= state.map.height; y++) {
    ctx.moveTo(0, y * TILE_SIZE);
    ctx.lineTo(state.map.width * TILE_SIZE, y * TILE_SIZE);
  }
  ctx.stroke();
}

export function drawHighlights(ctx: CanvasRenderingContext2D, selected: Position, preview: Position[]): void {
  if (preview.length) {
    ctx.strokeStyle = '#fff0b6';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    preview.forEach((p, i) => {
      const x = (p.x + 0.5) * TILE_SIZE;
      const y = (p.y + 0.5) * TILE_SIZE;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.strokeStyle = '#fbeec1';
  ctx.lineWidth = 2;
  ctx.strokeRect(selected.x * TILE_SIZE + 1, selected.y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
}
