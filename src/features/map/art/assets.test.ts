import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { expect, it } from 'vitest';
import { ATLAS_HEIGHT, ATLAS_WIDTH, CITY_SPRITES, SPRITES, spriteFrame, type SpriteName } from './atlas';
import { encodePng } from '../../../../scripts/art/png';
import { PixelSurface } from '../../../../scripts/art/surface';

function pixels(): Buffer {
  const file = readFileSync('public/art/atlas.png');
  expect(file.readUInt32BE(16)).toBe(ATLAS_WIDTH);
  expect(file.readUInt32BE(20)).toBe(ATLAS_HEIGHT);
  const chunks: Buffer[] = [];
  for (let offset = 8; offset < file.length;) {
    const length = file.readUInt32BE(offset);
    if (file.toString('ascii', offset + 4, offset + 8) === 'IDAT') chunks.push(file.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  return inflateSync(Buffer.concat(chunks));
}

function framePixels(data: Buffer, name: SpriteName): Buffer {
  const frame = spriteFrame(name);
  const rows: Buffer[] = [];
  for (let y = frame.y; y < frame.y + frame.height; y++) {
    const offset = y * (ATLAS_WIDTH * 4 + 1) + 1 + frame.x * 4;
    rows.push(data.subarray(offset, offset + frame.width * 4));
  }
  return Buffer.concat(rows);
}

it('ships drawable original sprites and distinct compact castle silhouettes', () => {
  const data = pixels();
  for (const sprite of SPRITES.filter(s => s.id !== 'coast-0')) {
    const rgba = framePixels(data, sprite.id);
    expect(rgba.some((value, index) => index % 4 === 3 && value > 0), sprite.id).toBe(true);
  }
  const cities = Object.values(CITY_SPRITES).map(id => framePixels(data, id));
  expect(new Set(cities.map(buffer => buffer.toString('hex'))).size).toBe(5);
  for (const rgba of cities) {
    const occupied = Array.from({ length: 48 * 48 }, (_, i) => i).filter(i => rgba[i * 4 + 3] >= 128);
    const x = occupied.map(i => i % 48);
    const y = occupied.map(i => Math.floor(i / 48));
    expect(Math.max(...x) - Math.min(...x) + 1).toBeLessThanOrEqual(36);
    expect(Math.max(...y) - Math.min(...y) + 1).toBeLessThanOrEqual(44);
  }
});

it('validates PNG dimensions and prevents atlas-frame bleed', () => {
  expect(() => encodePng(2, 2, new Uint8Array(3))).toThrow(/dimensions/);
  const surface = new PixelSurface(4, 4);
  surface.rect(0, 0, 4, 4, '#123456');
  expect(surface.pixels.slice(0, 4)).toEqual(new Uint8Array([18, 52, 86, 255]));
  expect(() => surface.copy(new PixelSurface(4, 4), 1, 0)).toThrow(/outside/);
  expect(() => surface.set(0, 0, 'invalid')).toThrow(/color/);
});
