import { mkdirSync, writeFileSync } from 'node:fs';
import { ATLAS_CELL_SIZE, ATLAS_HEIGHT, ATLAS_WIDTH, SPRITES, spriteFrame, type SpriteRecipe } from '../src/features/map/art/atlas.ts';
import { PixelSurface } from './art/surface.ts';
import { encodePng } from './art/png.ts';
import { grass, water, road, coast, bridge } from './art/terrain.ts';
import { oak, pine, bush, rock, mountain } from './art/scenery.ts';
import { castle, ruin } from './art/buildings.ts';
import { unit } from './art/units.ts';

function paint(surface: PixelSurface, sprite: SpriteRecipe): void {
  switch (sprite.kind) {
    case 'grass': return grass(surface, sprite.variant);
    case 'water': return water(surface, sprite.variant);
    case 'road': return road(surface, sprite.mask);
    case 'coast': return coast(surface, sprite.mask);
    case 'bridge': return bridge(surface, sprite.vertical);
    case 'oak': return oak(surface, sprite.variant);
    case 'pine': return pine(surface);
    case 'bush': return bush(surface);
    case 'rock': return rock(surface);
    case 'mountain': return mountain(surface, sprite.variant);
    case 'castle': return castle(surface, sprite.owner);
    case 'ruin': return ruin(surface, sprite.sealed);
    case 'unit': return unit(surface, sprite.role);
  }
}

const atlas = new PixelSurface(ATLAS_WIDTH, ATLAS_HEIGHT);
for (const sprite of SPRITES) {
  const surface = new PixelSurface(ATLAS_CELL_SIZE, ATLAS_CELL_SIZE);
  paint(surface, sprite);
  const frame = spriteFrame(sprite.id);
  atlas.copy(surface, frame.x, frame.y);
}
mkdirSync(new URL('../public/art/', import.meta.url), { recursive: true });
writeFileSync(new URL('../public/art/atlas.png', import.meta.url), encodePng(atlas.width, atlas.height, atlas.pixels));
console.log(`Generated ${SPRITES.length} original sprites in ${atlas.width}x${atlas.height} atlas.`);
