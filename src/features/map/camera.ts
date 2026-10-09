import type { Position } from '../../game/model';

export const TILE_SIZE = 28;
export type Size = { width: number; height: number };
export type Camera = { x: number; y: number; scale: number };

export function clampCamera(camera: Camera, size: Size, map: Size): Camera {
  const width = map.width * TILE_SIZE * camera.scale;
  const height = map.height * TILE_SIZE * camera.scale;
  return {
    ...camera,
    x: width < size.width ? (size.width - width) / 2 : Math.min(0, Math.max(size.width - width, camera.x)),
    y: height < size.height ? (size.height - height) / 2 : Math.min(0, Math.max(size.height - height, camera.y)),
  };
}

export function tileAt(point: Position, camera: Camera): Position {
  return { x: Math.floor((point.x - camera.x) / (TILE_SIZE * camera.scale)), y: Math.floor((point.y - camera.y) / (TILE_SIZE * camera.scale)) };
}
