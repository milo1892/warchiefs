import { artNoise } from '../../src/features/map/art/noise.ts';
import { PixelSurface, type Point } from './surface.ts';

function leaves(surface: PixelSurface, x: number, y: number, rx: number, ry: number, salt: number): void {
  surface.ellipse(x, y, rx + 1, ry + 1, '#203f25');
  surface.ellipse(x, y, rx, ry, '#36713a');
  surface.ellipse(x - 1, y - 2, rx - 1, ry - 2, '#4b8c42');
  for (let py = y - ry + 2; py < y + ry - 2; py++) {
    for (let px = x - rx + 2; px < x + rx - 2; px++) {
      if (((px - x) / rx) ** 2 + ((py - y) / ry) ** 2 > 0.65) continue;
      const noise = artNoise(px, py, salt);
      if (noise % 13 === 0) surface.set(px, py, '#73aa52');
      else if (noise % 11 === 0) surface.set(px, py, '#2d6034');
    }
  }
}

export function oak(surface: PixelSurface, variant: number): void {
  surface.ellipse(25, 42, 15, 3, '#1d372a55');
  surface.polygon([[21, 25], [27, 25], [27, 37], [31, 42], [25, 41], [22, 43], [21, 38], [17, 41], [21, 34]], '#513920');
  surface.rect(23, 27, 2, 13, '#a9763d');
  surface.line([24, 30], [15, 25], 3, '#6e4b29');
  surface.line([25, 29], [33, 22], 3, '#6e4b29');
  leaves(surface, 14 + variant, 24, 9, 7, 1);
  leaves(surface, 33 - variant, 23, 9, 8, 2);
  leaves(surface, 23, 27, 10, 7, 3);
  leaves(surface, 24 + variant, 17, 12, 9, 4 + variant);
  leaves(surface, 13, 17 + variant, 7, 6, 6);
  leaves(surface, 33, 16 + variant, 7, 7, 7);
}

export function pine(surface: PixelSurface): void {
  surface.ellipse(24, 43, 11, 2, '#1d372a55');
  surface.rect(22, 33, 4, 10, '#654525');
  surface.rect(23, 34, 1, 8, '#a47541');
  for (const [tip, base, half] of [[20, 39, 12], [13, 31, 10], [7, 23, 8]]) {
    surface.polygon([[24, tip], [24 - half, base], [24 + half, base]], '#1e432c');
    surface.polygon([[23, tip + 2], [26 - half, base - 2], [23, base - 2]], '#4f8543');
    surface.line([24 - half + 3, base - 3], [24, base - 2], 1, '#639a49');
  }
}

export function bush(surface: PixelSurface): void {
  surface.ellipse(24, 43, 9, 2, '#1d372a44');
  leaves(surface, 20, 39, 5, 4, 20);
  leaves(surface, 28, 38, 5, 5, 21);
  surface.set(22, 35, '#abc677');
}

export function rock(surface: PixelSurface): void {
  surface.ellipse(24, 43, 7, 2, '#25372944');
  surface.polygon([[18, 41], [19, 35], [23, 33], [28, 35], [30, 41], [26, 43], [20, 43]], '#53594a');
  surface.polygon([[19, 40], [20, 36], [23, 34], [26, 36], [25, 40]], '#b5b29a');
  surface.polygon([[25, 35], [28, 36], [29, 40], [26, 42], [25, 40]], '#858973');
}

export function mountain(surface: PixelSurface, variant: number): void {
  const tip = 20 + variant * 6;
  const outline: Point[] = [[3, 43], [8, 32], [13, 26], [17, 15], [tip, 7], [tip + 4, 12], [31, 27], [39, 35], [44, 43]];
  surface.ellipse(24, 44, 21, 2, '#26362855');
  surface.polygon(outline, '#393a32');
  surface.polygon([[5, 41], [14, 27], [19, 15], [tip, 10], [tip + 1, 22], [15, 36], [19, 42]], '#b9af91');
  surface.polygon([[tip + 1, 11], [30, 27], [40, 41], [26, 43], [19, 36], [tip + 1, 22]], '#786f5c');
  surface.polygon([[tip, 10], [tip + 5, 17], [tip + 3, 19], [tip + 1, 16], [tip - 2, 21], [tip - 5, 20]], '#ede9d2');
  surface.line([tip - 3, 22], [11, 38], 2, '#d1c5a1');
  surface.line([tip + 4, 24], [35, 39], 2, '#514d41');
  surface.line([24, 32], [25, 41], 2, '#4a473c');
  surface.line([13, 32], [8, 39], 1, '#81775f');
}
