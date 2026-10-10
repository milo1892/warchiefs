import { PixelSurface } from './surface.ts';

function infantry(surface: PixelSurface, guard: boolean, hero: boolean): void {
  surface.ellipse(24, 44, 8, 2, '#22372c55');
  surface.rect(21, 36, 3, 7, '#3f3c30');
  surface.rect(26, 36, 3, 7, '#3f3c30');
  surface.rect(20, 42, 4, 2, '#26332d');
  surface.rect(26, 42, 5, 2, '#26332d');
  surface.rect(20, 27, 11, 11, '#414b4b');
  surface.rect(21, 28, 9, 8, hero ? '#bda16a' : '#8caaa9');
  surface.rect(21, 28, 3, 7, hero ? '#e2ca84' : '#c5d4c6');
  surface.rect(23, 20, 5, 8, '#424746');
  surface.rect(23, 22, 5, 4, '#cfa36d');
  surface.rect(22, 19, 7, 4, '#606f70');
  surface.rect(23, 19, 5, 2, '#cbd5c8');
  surface.set(27, 23, '#2a322c');
  surface.line([33, 35], [36, 22], 2, '#d5dac6');
  surface.line([31, 31], [36, 32], 2, '#846b40');
  surface.polygon([[17, 28], [23, 28], [23, 35], [20, 39], [17, 35]], '#3d4135');
  surface.polygon([[18, 29], [22, 29], [22, 34], [20, 37], [18, 34]], guard ? '#b79b62' : '#6e8990');
  surface.rect(20, 30, 1, 5, '#ddd0a0');
  if (hero) {
    surface.rect(22, 18, 8, 2, '#c49d45');
    for (const x of [22, 25, 29]) surface.rect(x, 15, 1, 4, '#edca71');
    surface.polygon([[20, 29], [18, 40], [22, 38]], '#835444');
  }
}

function rider(surface: PixelSurface): void {
  surface.ellipse(24, 44, 13, 2, '#22372c55');
  surface.rect(14, 32, 3, 11, '#533e2b');
  surface.rect(30, 32, 3, 11, '#533e2b');
  surface.ellipse(23, 33, 12, 6, '#6e4930');
  surface.ellipse(23, 31, 10, 4, '#ab7b46');
  surface.polygon([[29, 29], [30, 20], [33, 16], [35, 22], [39, 24], [39, 28], [34, 29]], '#67472d');
  surface.polygon([[31, 28], [32, 21], [35, 24], [38, 25], [38, 27]], '#be955b');
  surface.set(35, 23, '#272f28');
  surface.line([32, 25], [27, 32], 1, '#dac18b');
  surface.line([13, 31], [9, 36], 2, '#43352a');
  surface.rect(20, 23, 9, 10, '#424d4c');
  surface.rect(21, 23, 7, 7, '#a4bab2');
  surface.rect(22, 17, 5, 6, '#c8a273');
  surface.rect(21, 15, 7, 4, '#697d7e');
  surface.rect(22, 15, 5, 2, '#d0d6c3');
  surface.line([30, 28], [33, 11], 1, '#ab9561');
  surface.polygon([[33, 8], [35, 12], [32, 13]], '#d6ddc9');
}

export function unit(surface: PixelSurface, role: 'soldier' | 'guard' | 'rider' | 'hero'): void {
  if (role === 'rider') rider(surface);
  else infantry(surface, role === 'guard', role === 'hero');
}
