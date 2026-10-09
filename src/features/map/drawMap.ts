import type { GameState, Position } from '../../game/model';
import { TILE_SIZE, type Camera, type Size } from './camera';
import { drawTerrain } from './drawTerrain';

function ownerColor(s: GameState, owner: number): string {
  return owner === -1 ? '#dad0af' : s.factions[owner].color;
}

function drawSites(ctx: CanvasRenderingContext2D, s: GameState, camera: Camera): void {
  for (const city of s.cities) {
    const x = city.x * TILE_SIZE;
    const y = city.y * TILE_SIZE;
    ctx.fillStyle = ownerColor(s, city.owner);
    ctx.fillRect(x + 4, y + 7, 20, 16);
    ctx.fillRect(x + 4, y + 3, 5, 9);
    ctx.fillRect(x + 19, y + 3, 5, 9);
    ctx.fillStyle = '#152722';
    ctx.fillRect(x + 11, y + 15, 6, 8);
    if (camera.scale >= 0.7) {
      ctx.font = 'bold 9px system-ui';
      ctx.strokeStyle = '#142822';
      ctx.lineWidth = 3;
      ctx.strokeText(city.name, x - 4, y - 4);
      ctx.fillStyle = '#f4edda';
      ctx.fillText(city.name, x - 4, y - 4);
    }
  }
  for (const ruin of s.ruins) {
    ctx.fillStyle = ruin.exploredBy === null ? '#d6b2e5' : '#929185';
    ctx.font = 'bold 20px system-ui';
    ctx.fillText(ruin.exploredBy === null ? '?' : 'x', ruin.x * TILE_SIZE + 8, ruin.y * TILE_SIZE + 21);
  }
}

function drawArmies(ctx: CanvasRenderingContext2D, s: GameState): void {
  for (const army of s.armies) {
    const x = army.x * TILE_SIZE;
    const y = army.y * TILE_SIZE;
    ctx.fillStyle = '#11241f';
    ctx.fillRect(x + 2, y + 13, 24, 14);
    ctx.strokeStyle = ownerColor(s, army.owner);
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 13, 24, 14);
    ctx.fillStyle = '#fff5da';
    ctx.font = 'bold 11px system-ui';
    ctx.fillText(`${army.hero ? 'H' : ''}${army.units.length}`, x + 5, y + 24);
  }
}

function drawSelection(ctx: CanvasRenderingContext2D, selected: Position, preview: Position[]): void {
  if (preview.length) {
    ctx.strokeStyle = '#f8dd87';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    preview.forEach((p, i) => {
      const x = (p.x + 0.5) * TILE_SIZE;
      const y = (p.y + 0.5) * TILE_SIZE;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.strokeStyle = '#fff3bd';
  ctx.lineWidth = 3;
  ctx.strokeRect(selected.x * TILE_SIZE + 1, selected.y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
}

export function drawMap(canvas: HTMLCanvasElement, size: Size, camera: Camera, s: GameState, selected: Position, preview: Position[]): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser does not provide a Canvas 2D context.');
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(size.width * pixelRatio);
  canvas.height = Math.round(size.height * pixelRatio);
  ctx.scale(pixelRatio, pixelRatio);
  ctx.fillStyle = '#152923';
  ctx.fillRect(0, 0, size.width, size.height);
  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.scale, camera.scale);
  const minX = Math.max(0, Math.floor(-camera.x / (TILE_SIZE * camera.scale)));
  const maxX = Math.min(s.map.width, Math.ceil((size.width - camera.x) / (TILE_SIZE * camera.scale)));
  const minY = Math.max(0, Math.floor(-camera.y / (TILE_SIZE * camera.scale)));
  const maxY = Math.min(s.map.height, Math.ceil((size.height - camera.y) / (TILE_SIZE * camera.scale)));
  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) drawTerrain(ctx, s.map.tiles[y * s.map.width + x], x * TILE_SIZE, y * TILE_SIZE);
  }
  drawSites(ctx, s, camera);
  drawArmies(ctx, s);
  drawSelection(ctx, selected, preview);
}
