import { useCallback, useEffect, useState } from 'react';
import type { GameState } from '../../../game/model';
import { loadAtlas } from './loadAtlas';
import { terrainArtKey } from './geometry';
import { createTerrainLayer } from './terrainLayer';

type TerrainCache = { key: string; atlas: HTMLImageElement; canvas: HTMLCanvasElement };

function useAtlas() {
  const [atlas, setAtlas] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void loadAtlas().then(image => { if (active) setAtlas(image); }).catch(reason => {
      console.error('Map artwork loading failed:', reason);
      if (active) setError(reason instanceof Error ? reason.message : 'Unknown artwork loading failure.');
    });
    return () => { active = false; };
  }, [attempt]);
  const retry = useCallback(() => { setError(null); setAttempt(value => value + 1); }, []);
  return { atlas, error, retry };
}

export function useMapArtwork(state: GameState) {
  const { atlas, error, retry } = useAtlas();
  const [terrain, setTerrain] = useState<TerrainCache | null>(null);
  const key = terrainArtKey(state);
  useEffect(() => {
    if (!atlas) return;
    setTerrain(previous => previous?.key === key && previous.atlas === atlas
      ? previous : { key, atlas, canvas: createTerrainLayer(atlas, state) });
  }, [atlas, key, state]);
  return { atlas, terrain: terrain?.key === key ? terrain.canvas : null, error, retry };
}
