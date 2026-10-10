import { ART_TILE_SIZE, spriteFrame, type SpriteName } from './atlas';
import type { Position } from '../../../game/model';

export function drawGroundSprite(ctx: CanvasRenderingContext2D, image: HTMLImageElement, name: SpriteName, x: number, y: number): void {
  const frame = spriteFrame(name);
  ctx.drawImage(image, frame.x + 8, frame.y + 8, ART_TILE_SIZE, ART_TILE_SIZE, x, y, ART_TILE_SIZE, ART_TILE_SIZE);
}

export function drawObjectSprite(ctx: CanvasRenderingContext2D, image: HTMLImageElement, name: SpriteName, point: Position, scale = 1, anchorY = 44): void {
  const frame = spriteFrame(name);
  ctx.drawImage(image, frame.x, frame.y, frame.width, frame.height,
    point.x - 24 * scale, point.y - anchorY * scale, frame.width * scale, frame.height * scale);
}
