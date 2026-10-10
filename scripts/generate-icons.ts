import { writeFileSync } from 'node:fs';
import { encodePng } from './art/png.ts';

function inside(x: number, y: number, left: number, top: number, right: number, bottom: number): boolean {
  return x >= left && x < right && y >= top && y < bottom;
}

function fortressPixel(x: number, y: number): boolean {
  const shapes = [[118, 242, 394, 376], [118, 178, 178, 242], [334, 178, 394, 242], [226, 142, 286, 242]];
  return shapes.some(([l, t, r, b]) => inside(x, y, l, t, r, b)) && !inside(x, y, 224, 294, 288, 376);
}

function createIcon(size: number): Buffer {
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x / size * 512;
      const py = y / size * 512;
      const color = fortressPixel(px, py) ? [237, 199, 121, 255] : [23, 43, 40, 255];
      pixels.set(color, (y * size + x) * 4);
    }
  }
  return encodePng(size, size, pixels);
}

for (const size of [192, 512]) writeFileSync(new URL(`../public/icon-${size}.png`, import.meta.url), createIcon(size));
