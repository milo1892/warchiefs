import type { GameState, Position } from '../../game/model';
import { TILE_SIZE, type Camera, type Size } from './camera';
import { drawArmies, drawSettlements } from './drawEntities';
import { drawGrid, drawHighlights } from './drawHighlights';

export type MapArtwork = { atlas: HTMLImageElement; terrain: HTMLCanvasElement };
export type MapOverlay = { selected: Position; preview: Position[]; grid: boolean };

export function drawMap(canvas: HTMLCanvasElement, size: Size, camera: Camera, s: GameState, artwork: MapArtwork, overlay: MapOverlay): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser does not provide a Canvas 2D context.');
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(size.width * pixelRatio);
  canvas.height = Math.round(size.height * pixelRatio);
  ctx.scale(pixelRatio, pixelRatio);
  ctx.fillStyle = '#152923';
  ctx.fillRect(0, 0, size.width, size.height);
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.scale, camera.scale);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(artwork.terrain, 0, 0, s.map.width * TILE_SIZE, s.map.height * TILE_SIZE);
  if (overlay.grid) drawGrid(ctx, s);
  drawSettlements(ctx, artwork.atlas, s, camera);
  drawArmies(ctx, artwork.atlas, s);
  drawHighlights(ctx, overlay.selected, overlay.preview);
}
