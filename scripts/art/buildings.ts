import type { Owner } from '../../src/game/model.ts';
import { FACTION_DEFINITIONS } from '../../src/content/rules.ts';
import { FACTION_CRESTS } from '../../src/features/map/art/atlas.ts';
import { PixelSurface } from './surface.ts';

type CastleStyle = { wall: string; light: string; mortar: string; roof: string; roofLight: string; towers: 'wood' | 'square' | 'angular' | 'slim' };
const STYLES: Record<Owner, CastleStyle> = {
  '-1': { wall: '#aaa08a', light: '#c5bca3', mortar: '#746e5d', roof: '#786749', roofLight: '#a18b5d', towers: 'square' },
  0: { wall: '#947044', light: '#be9458', mortar: '#5a422a', roof: '#3f653e', roofLight: '#6c914e', towers: 'wood' },
  1: { wall: '#c5bda0', light: '#ece2bd', mortar: '#92896f', roof: '#ab7b35', roofLight: '#d6ac57', towers: 'square' },
  2: { wall: '#626265', light: '#92918b', mortar: '#414447', roof: '#873e35', roofLight: '#bf6650', towers: 'angular' },
  3: { wall: '#929c9e', light: '#c0c5bd', mortar: '#606d72', roof: '#3b6375', roofLight: '#6795a4', towers: 'slim' },
};

function masonry(surface: PixelSurface, x: number, y: number, width: number, height: number, style: CastleStyle): void {
  surface.rect(x, y, width, height, style.wall);
  surface.rect(x, y, width, 1, style.light);
  surface.rect(x, y, 1, height, style.light);
  for (let row = y + 3; row < y + height; row += 4) {
    surface.rect(x, row, width, 1, style.mortar);
    for (let col = x + ((row - y) % 8 ? 3 : 6); col < x + width; col += 7) surface.rect(col, row - 3, 1, 3, style.mortar);
  }
}

function tower(surface: PixelSurface, x: number, top: number, style: CastleStyle): void {
  const width = style.towers === 'slim' ? 6 : 8;
  surface.rect(x - 1, top, width + 2, 27 - top + 13, '#393b2d');
  masonry(surface, x, top + 1, width, 39 - top, style);
  surface.rect(x + 2, top + 7, 2, 4, '#354032');
  if (style.towers === 'square') {
    for (let col = x; col < x + width; col += 3) surface.rect(col, top - 2, 2, 3, style.light);
  } else {
    surface.polygon([[x - 2, top + 1], [x + width / 2, top - 7], [x + width + 2, top + 1]], '#343b2b');
    surface.polygon([[x - 1, top], [x + width / 2, top - 5], [x + width + 1, top]], style.roof);
    surface.line([x, top - 1], [x + width / 2, top - 5], 1, style.roofLight);
  }
}

function banner(surface: PixelSurface, owner: Owner): void {
  const color = owner === -1 ? '#a7a58c' : FACTION_DEFINITIONS[owner].color;
  surface.rect(24, 3, 1, 12, '#473a25');
  surface.rect(25, 4, 9, 6, '#33432d');
  surface.rect(26, 5, 7, 4, color);
  for (const [x, y] of FACTION_CRESTS[owner]) surface.set(26 + x, 5 + y, '#fff0c7');
}

export function castle(surface: PixelSurface, owner: Owner): void {
  const style = STYLES[owner];
  surface.ellipse(24, 44, 18, 2, '#263c2955');
  surface.rect(7, 25, 34, 18, '#393b2d');
  masonry(surface, 8, 26, 32, 15, style);
  masonry(surface, 16, 20, 16, 16, style);
  surface.polygon([[14, 21], [23, 11], [34, 21]], '#383929');
  surface.polygon([[16, 20], [23, 13], [32, 20]], style.roof);
  surface.line([17, 19], [23, 13], 1, style.roofLight);
  surface.rect(21, 25, 3, 4, '#393e2f');
  surface.rect(27, 25, 2, 4, '#393e2f');
  tower(surface, 8, owner === 2 ? 21 : 19, style);
  tower(surface, 33, owner === 3 ? 17 : 20, style);
  surface.ellipse(24, 35, 4, 5, '#37372b');
  surface.rect(20, 35, 9, 7, '#393326');
  surface.rect(22, 35, 5, 7, '#84603a');
  surface.rect(24, 35, 1, 7, '#bd9257');
  surface.rect(22, 39, 5, 1, '#523e27');
  if (style.towers === 'wood') {
    for (const x of [9, 12, 15, 33, 36, 39]) surface.rect(x, 26, 1, 14, '#5a422a');
  }
  banner(surface, owner);
}

export function ruin(surface: PixelSurface, sealed: boolean): void {
  surface.ellipse(24, 44, 15, 2, '#2b402944');
  for (const [x, y, h] of [[11, 27, 14], [17, 19, 22], [28, 20, 21], [35, 29, 12]]) {
    surface.rect(x - 1, y, 5, h, '#4d594a');
    surface.rect(x, y + 1, 3, h - 2, '#a9ad94');
    surface.rect(x, y + 1, 1, h - 3, '#d0ccb0');
    surface.rect(x - 1, y - 1, 5, 2, '#8e9b74');
  }
  surface.rect(17, 18, 15, 4, '#525e4e');
  surface.rect(18, 18, 13, 2, '#c1c1a3');
  surface.rect(21, 26, 7, 14, sealed ? '#777e63' : '#34443b');
  if (!sealed) {
    surface.polygon([[24, 28], [27, 33], [24, 36], [22, 33]], '#c8a5d0');
    surface.set(24, 31, '#f4deb9');
  }
  surface.rect(13, 39, 6, 3, '#778568');
  surface.rect(28, 40, 7, 3, '#899477');
}
