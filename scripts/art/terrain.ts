import { artNoise } from '../../src/features/map/art/noise.ts';
import { PixelSurface } from './surface.ts';

const GRASS = ['#78a94f', '#74a44b', '#7cac50', '#72a149', '#81b154'];
const WATER = ['#3c82b5', '#3c82b5', '#3d83b6', '#3b81b4'];
const DIRECTIONS = [{ bit: 1, end: [24, 8] }, { bit: 2, end: [40, 24] }, { bit: 4, end: [24, 40] }, { bit: 8, end: [8, 24] }] as const;

export function grass(surface: PixelSurface, variant: number): void {
  for (let y = 8; y < 40; y++) {
    for (let x = 8; x < 40; x++) surface.set(x, y, GRASS[artNoise(x, y, variant) % GRASS.length]);
  }
  for (let i = 0; i < 4; i++) {
    const x = 11 + artNoise(i, variant, 12) % 25;
    const y = 12 + artNoise(i, variant, 17) % 24;
    surface.set(x, y, '#527d37');
    surface.set(x - 1, y - 1, '#689a42');
    surface.set(x + 1, y - 2, '#a1c46a');
  }
}

export function water(surface: PixelSurface, variant: number): void {
  for (let y = 8; y < 40; y++) {
    for (let x = 8; x < 40; x++) surface.set(x, y, WATER[artNoise(x, y, variant) % WATER.length]);
  }
  for (let i = 0; i < 2; i++) {
    const x = 13 + artNoise(i, variant, 21) % 20;
    const y = 14 + artNoise(i, variant, 22) % 20;
    surface.rect(x, y, 4, 1, '#619ac0');
    surface.rect(x + 1, y - 1, 2, 1, '#82b3cd');
  }
}

export function road(surface: PixelSurface, mask: number): void {
  for (const direction of DIRECTIONS) {
    if (!(mask & direction.bit)) continue;
    surface.line([24, 24], direction.end, 10, '#9b8249');
    surface.line([24, 24], direction.end, 7, '#d3b47a');
  }
  surface.ellipse(24, 24, 5, 5, '#9b8249');
  surface.ellipse(24, 24, 4, 4, '#d3b47a');
  for (let y = 8; y < 40; y++) {
    for (let x = 8; x < 40; x++) {
      if (surface.alpha(x, y) && artNoise(x, y, mask) % 19 === 0) surface.set(x, y, '#b99b65');
    }
  }
}

function bankPixel(surface: PixelSurface, side: number, along: number, depth: number, color: string): void {
  if (side === 1) surface.set(along, 8 + depth, color);
  if (side === 2) surface.set(39 - depth, along, color);
  if (side === 4) surface.set(along, 39 - depth, color);
  if (side === 8) surface.set(8 + depth, along, color);
}

export function coast(surface: PixelSurface, mask: number): void {
  for (const { bit } of DIRECTIONS) {
    if (!(mask & bit)) continue;
    for (let along = 8; along < 40; along++) {
      const grassWidth = 2 + Math.floor(along / 4) % 2;
      for (let depth = 0; depth < grassWidth; depth++) bankPixel(surface, bit, along, depth, '#78a94f');
      bankPixel(surface, bit, along, grassWidth, '#8d6e3d');
      bankPixel(surface, bit, along, grassWidth + 1, '#baa066');
      bankPixel(surface, bit, along, grassWidth + 2, '#286487');
      bankPixel(surface, bit, along, grassWidth + 3, '#609fc0');
    }
  }
}

export function bridge(surface: PixelSurface, vertical: boolean): void {
  surface.rect(5, 26, 38, 8, '#182e2b55');
  surface.rect(5, 19, 38, 12, '#56391f');
  for (let x = 7; x < 42; x += 4) {
    surface.rect(x, 20, 3, 10, '#b7864d');
    surface.rect(x, 20, 1, 10, '#d3a568');
  }
  for (const y of [17, 31]) {
    surface.rect(5, y, 38, 2, '#4e351f');
    surface.rect(6, y, 36, 1, '#d0a264');
    for (const x of [5, 16, 30, 41]) surface.rect(x, y - 2, 2, 5, '#75512e');
  }
  if (!vertical) return;
  const pixels = surface.pixels.slice();
  for (let y = 0; y < 48; y++) {
    for (let x = 0; x < 48; x++) surface.pixels.set(pixels.subarray((y * 48 + x) * 4, (y * 48 + x + 1) * 4), (x * 48 + y) * 4);
  }
}
