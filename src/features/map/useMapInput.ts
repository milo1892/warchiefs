import { useEffect, useRef, type PointerEvent, type RefObject } from 'react';
import type { Position } from '../../game/model';
import { tileAt, type Camera, type Size } from './camera';

type Transform = (from: Position, to: Position, factor: number) => void;
const midpoint = (a: Position, b: Position): Position => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const separation = (a: Position, b: Position) => Math.hypot(a.x - b.x, a.y - b.y);

function localPoint(element: HTMLElement, x: number, y: number): Position {
  const rect = element.getBoundingClientRect();
  return { x: x - rect.left, y: y - rect.top };
}

export function useMapInput(ref: RefObject<HTMLCanvasElement | null>, camera: Camera, map: Size, select: (p: Position) => void, transform: Transform) {
  const pointers = useRef(new Map<number, Position>());
  const start = useRef<Position | null>(null);
  const moved = useRef(false);
  const down = (event: PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const p = localPoint(event.currentTarget, event.clientX, event.clientY);
    if (!pointers.current.size) { start.current = p; moved.current = false; }
    pointers.current.set(event.pointerId, p);
    if (pointers.current.size > 1) moved.current = true;
  };
  const move = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    const before = [...pointers.current.values()];
    const previous = pointers.current.get(event.pointerId)!;
    const point = localPoint(event.currentTarget, event.clientX, event.clientY);
    pointers.current.set(event.pointerId, point);
    const after = [...pointers.current.values()];
    if (before.length === 2) {
      transform(midpoint(before[0], before[1]), midpoint(after[0], after[1]), separation(after[0], after[1]) / Math.max(1, separation(before[0], before[1])));
    } else {
      if (start.current && separation(start.current, point) > 6) moved.current = true;
      if (moved.current) transform(previous, point, 1);
    }
  };
  const up = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    const tap = !moved.current && pointers.current.size === 1 && event.type !== 'pointercancel';
    pointers.current.delete(event.pointerId);
    if (tap) {
      const p = tileAt(localPoint(event.currentTarget, event.clientX, event.clientY), camera);
      if (p.x >= 0 && p.y >= 0 && p.x < map.width && p.y < map.height) select(p);
    }
  };
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const point = localPoint(element, event.clientX, event.clientY);
      transform(point, point, Math.exp(-event.deltaY * 0.002));
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, [ref, transform]);
  return { onPointerDown: down, onPointerMove: move, onPointerUp: up, onPointerCancel: up };
}
