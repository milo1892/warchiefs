type Rgba = readonly [number, number, number, number];
export type Point = readonly [number, number];
const colorCache = new Map<string, Rgba>();

function rgba(color: string): Rgba {
  const cached = colorCache.get(color);
  if (cached) return cached;
  if (!/^#[\da-f]{6}([\da-f]{2})?$/i.test(color)) throw new Error(`Invalid pixel color: ${color}.`);
  const value: Rgba = [
    parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16),
    color.length === 9 ? parseInt(color.slice(7, 9), 16) : 255,
  ];
  colorCache.set(color, value);
  return value;
}

export class PixelSurface {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8Array;
  constructor(width: number, height: number) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) throw new Error('Pixel surface dimensions must be positive integers.');
    this.width = width;
    this.height = height;
    this.pixels = new Uint8Array(width * height * 4);
  }

  set(x: number, y: number, color: string): void {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    this.pixels.set(rgba(color), (y * this.width + x) * 4);
  }

  alpha(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return 0;
    return this.pixels[(y * this.width + x) * 4 + 3];
  }

  rect(x: number, y: number, width: number, height: number, color: string): void {
    for (let py = Math.floor(y); py < y + height; py++) {
      for (let px = Math.floor(x); px < x + width; px++) this.set(px, py, color);
    }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, color: string): void {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) this.set(x, y, color);
      }
    }
  }

  line(from: Point, to: Point, width: number, color: string): void {
    const steps = Math.max(Math.abs(to[0] - from[0]), Math.abs(to[1] - from[1]), 1);
    for (let step = 0; step <= steps; step++) {
      const x = from[0] + (to[0] - from[0]) * step / steps;
      const y = from[1] + (to[1] - from[1]) * step / steps;
      this.rect(Math.round(x - width / 2), Math.round(y - width / 2), width, width, color);
    }
  }

  polygon(points: readonly Point[], color: string): void {
    const minY = Math.max(0, Math.floor(Math.min(...points.map(p => p[1]))));
    const maxY = Math.min(this.height - 1, Math.ceil(Math.max(...points.map(p => p[1]))));
    for (let y = minY; y <= maxY; y++) {
      const intersections: number[] = [];
      for (let i = 0; i < points.length; i++) {
        const a = points[i];
        const b = points[(i + 1) % points.length];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) intersections.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
      }
      intersections.sort((a, b) => a - b);
      for (let i = 0; i + 1 < intersections.length; i += 2) this.rect(Math.ceil(intersections[i]), y, Math.floor(intersections[i + 1]) - Math.ceil(intersections[i]) + 1, 1, color);
    }
  }

  copy(source: PixelSurface, left: number, top: number): void {
    if (left < 0 || top < 0 || left + source.width > this.width || top + source.height > this.height) throw new Error('Sprite would extend outside its atlas frame.');
    for (let y = 0; y < source.height; y++) {
      const row = source.pixels.subarray(y * source.width * 4, (y + 1) * source.width * 4);
      this.pixels.set(row, ((top + y) * this.width + left) * 4);
    }
  }
}
