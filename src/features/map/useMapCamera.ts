import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { Position } from '../../game/model';
import { clampCamera, TILE_SIZE, type Camera, type Size } from './camera';

export function useContainerSize(ref: RefObject<HTMLDivElement | null>): Size {
  const [size, setSize] = useState<Size>({ width: 1, height: 1 });
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

export function useMapCamera(size: Size, map: Size) {
  const [camera, setCamera] = useState<Camera>(() => ({
    x: 0, y: 0, scale: window.matchMedia('(pointer: coarse)').matches ? 1.6 : 1,
  }));
  const previousSize = useRef(size);
  const { width, height } = size;
  const { width: mapWidth, height: mapHeight } = map;
  const constrain = useCallback((value: Camera) => clampCamera(value, { width, height }, { width: mapWidth, height: mapHeight }), [width, height, mapWidth, mapHeight]);
  useEffect(() => {
    const previous = previousSize.current;
    setCamera(c => constrain({ ...c, x: c.x + (width - previous.width) / 2, y: c.y + (height - previous.height) / 2 }));
    previousSize.current = { width, height };
  }, [width, height, constrain]);

  const transform = useCallback((from: Position, to: Position, factor: number) => {
    setCamera(c => {
      const scale = Math.max(0.25, Math.min(2.5, c.scale * factor));
      const ratio = scale / c.scale;
      return constrain({ scale, x: to.x - (from.x - c.x) * ratio, y: to.y - (from.y - c.y) * ratio });
    });
  }, [constrain]);
  const center = useCallback((p: Position) => {
    setCamera(c => constrain({ ...c, x: size.width / 2 - (p.x + 0.5) * TILE_SIZE * c.scale, y: size.height / 2 - (p.y + 0.5) * TILE_SIZE * c.scale }));
  }, [constrain, size.width, size.height]);
  const fit = useCallback(() => {
    setCamera(constrain({ x: 0, y: 0, scale: Math.min(size.width / (map.width * TILE_SIZE), size.height / (map.height * TILE_SIZE)) }));
  }, [constrain, size.width, size.height, map.width, map.height]);
  return { camera, center, fit, transform };
}
