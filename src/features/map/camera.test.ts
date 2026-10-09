import { expect, it } from 'vitest';
import { clampCamera, tileAt } from './camera';

it('converts scaled screen points into map coordinates', () => {
  expect(tileAt({ x: 50, y: 80 }, { x: -20, y: -4, scale: 0.5 })).toEqual({ x: 5, y: 6 });
});

it('keeps a panned map inside the viewport and centers a smaller map', () => {
  expect(clampCamera({ x: -9000, y: 100, scale: 1 }, { width: 360, height: 300 }, { width: 40, height: 30 })).toMatchObject({ x: -760, y: 0 });
  expect(clampCamera({ x: 99, y: -90, scale: 0.25 }, { width: 360, height: 300 }, { width: 40, height: 30 })).toMatchObject({ x: 40, y: 45 });
});
