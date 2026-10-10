export function artNoise(x: number, y: number, salt = 0): number {
  let value = Math.imul(x + 31, 374761393) ^ Math.imul(y + 17, 668265263) ^ Math.imul(salt + 7, 1274126177);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return (value ^ (value >>> 16)) >>> 0;
}
