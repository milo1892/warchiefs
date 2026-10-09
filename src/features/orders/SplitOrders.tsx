import { useState } from 'react';
import type { Army, GameState } from '../../game/model';
import { armyAt, cityAt } from '../../game/selectors';
import { terrainCost } from '../../game/pathfinding';
import { session } from '../session/sessionStore';

const DIRECTIONS = [{ name: 'North', x: 0, y: -1 }, { name: 'West', x: -1, y: 0 }, { name: 'East', x: 1, y: 0 }, { name: 'South', x: 0, y: 1 }];

export function SplitOrders({ state, army, disabled }: { state: GameState; army: Army; disabled: boolean }) {
  const [count, setCount] = useState(1);
  return <details>
    <summary>Split army</summary>
    <label>Units to detach<input type="number" min="1" max={army.units.length - 1} value={count} onChange={e => setCount(Number(e.target.value))} /></label>
    <div className="button-row">{DIRECTIONS.map(direction => {
      const to = { x: army.x + direction.x, y: army.y + direction.y };
      const blocked = !!armyAt(state, to) || !!cityAt(state, to) || terrainCost(state, to) > army.movement;
      return <button key={direction.name} disabled={disabled || blocked || !Number.isInteger(count) || count < 1 || count >= army.units.length}
        onClick={() => void session.perform({ type: 'split', armyId: army.id, count, to })}>{direction.name}</button>;
    })}</div>
    <p>The hero stays with the original army. Both stacks share the remaining movement.</p>
  </details>;
}
