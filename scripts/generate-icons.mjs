import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(name, data) {
  const type = Buffer.from(name);
  const size = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([type, data])));
  return Buffer.concat([size, type, data, checksum]);
}

function inside(x, y, left, top, right, bottom) {
  return x >= left && x < right && y >= top && y < bottom;
}

function fortressPixel(x, y) {
  const shapes = [[118, 242, 394, 376], [118, 178, 178, 242], [334, 178, 394, 242], [226, 142, 286, 242]];
  return shapes.some(([l, t, r, b]) => inside(x, y, l, t, r, b)) && !inside(x, y, 224, 294, 288, 376);
}

function createIcon(size) {
  const pixels = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x / size * 512;
      const py = y / size * 512;
      const color = fortressPixel(px, py) ? [237, 199, 121, 255] : [23, 43, 40, 255];
      pixels.set(color, y * (size * 4 + 1) + 1 + x * 4);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
}

for (const size of [192, 512]) writeFileSync(new URL(`../public/icon-${size}.png`, import.meta.url), createIcon(size));
