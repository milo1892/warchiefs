import { useEffect, useRef, type KeyboardEvent } from 'react';
import type { GameState, Position } from '../../game/model';
import { useContainerSize, useMapCamera } from './useMapCamera';
import { useMapInput } from './useMapInput';
import { drawMap } from './drawMap';

type Props = {
  state: GameState;
  selected: Position;
  preview: Position[];
  focus: Position | null;
  onSelect: (p: Position) => void;
};

export function MapViewport({ state, selected, preview, focus, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const size = useContainerSize(container);
  const { camera, center, fit, transform } = useMapCamera(size, state.map);
  const handlers = useMapInput(canvas, camera, state.map, onSelect, transform);
  useEffect(() => {
    if (focus) center(focus);
  }, [focus, center]);
  useEffect(() => {
    if (canvas.current) drawMap(canvas.current, size, camera, state, selected, preview);
  }, [size, camera, state, selected, preview]);
  const keyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    const offsets: Record<string, Position> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } };
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    const p = { x: Math.max(0, Math.min(state.map.width - 1, selected.x + offset.x)), y: Math.max(0, Math.min(state.map.height - 1, selected.y + offset.y)) };
    onSelect(p);
    center(p);
  };
  const zoom = (factor: number) => {
    const point = { x: size.width / 2, y: size.height / 2 };
    transform(point, point, factor);
  };
  return <section className="map-panel" aria-label="Realm map">
    <div className="map-toolbar">
      <span>Drag to pan. Pinch or scroll to zoom.</span>
      <div className="button-row">
        <button onClick={() => zoom(1.3)} aria-label="Zoom in">+</button>
        <button onClick={() => zoom(1 / 1.3)} aria-label="Zoom out">-</button>
        <button onClick={fit}>Whole map</button>
        <button onClick={() => center(selected)}>Center selection</button>
      </div>
    </div>
    <div className="map-canvas-container" ref={container}>
      <canvas ref={canvas} {...handlers} onKeyDown={keyDown} tabIndex={0}
        data-map-x={camera.x} data-map-y={camera.y} data-map-scale={camera.scale}
        aria-label="Realm map. Arrow keys select tiles. Use the Orders panel to confirm movement."
        style={{ width: size.width, height: size.height }} />
    </div>
    <p className="map-legend">Fortress: city. H: hero army. Number: units. ?: unexplored ruin. Mountains and water block movement.</p>
  </section>;
}
