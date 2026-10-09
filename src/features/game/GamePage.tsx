import { useMemo, useState } from 'react';
import type { GameState, Position } from '../../game/model';
import { route } from '../../game/pathfinding';
import { alive, armyAt, cityAt } from '../../game/selectors';
import { MapViewport } from '../map/MapViewport';
import { ArmyOrders } from '../orders/ArmyOrders';
import { CityOrders } from '../orders/CityOrders';
import { DestinationForm } from '../orders/DestinationForm';
import { RealmPanel } from '../realm/RealmPanel';
import { session, type SessionView } from '../session/sessionStore';
import type { LoadedSlot } from '../../persistence/repository';

function ordersDisabled(view: SessionView, state: GameState): boolean {
  return view.busy || !!view.pending || state.active !== 0 || state.winner !== null || !alive(state, 0);
}

function campaignResult(state: GameState): string | null {
  if (state.winner === 0) return 'Victory! The realm is united under your banner.';
  return alive(state, 0) ? null : 'Defeat. Your last city and army have fallen.';
}

export function GamePage({ view, slot }: { view: SessionView; slot: LoadedSlot }) {
  const state = slot.snapshot.state;
  const initial = state.armies.find(a => a.owner === 0) ?? state.cities.find(c => c.owner === 0) ?? { x: 0, y: 0 };
  const [tile, setTile] = useState<Position>(initial);
  const [armyId, setArmyId] = useState<string | null>(state.armies.find(a => a.owner === 0)?.id ?? null);
  const [focus, setFocus] = useState<Position | null>(initial);
  const army = state.armies.find(a => a.id === armyId && a.owner === 0);
  const city = cityAt(state, tile);
  const disabled = ordersDisabled(view, state);
  const path = useMemo(() => army ? route(state, army, tile) : null, [state, army, tile]);
  const select = (p: Position) => {
    setTile({ x: p.x, y: p.y });
    const selected = armyAt(state, p);
    if (selected?.owner === 0) setArmyId(selected.id);
  };
  const inspect = (p: Position) => { select(p); setFocus({ x: p.x, y: p.y }); };
  const result = campaignResult(state);
  return <>
    {result && <div className="result" role="status">{result}</div>}
    <div className="game-layout">
      <MapViewport state={state} selected={tile} preview={army && path ? [army, ...path.tiles] : []} focus={focus} onSelect={select} />
      <aside className="orders-panel" aria-label="Orders">
        <h2>Orders</h2>
        <p>Tile ({tile.x + 1}, {tile.y + 1}) · {state.map.tiles[tile.y * state.map.width + tile.x]}</p>
        <DestinationForm state={state} tile={tile} onSelect={inspect} />
        {city && <CityOrders state={state} city={city} disabled={disabled} />}
        {army && <ArmyOrders state={state} army={army} tile={tile} path={path} disabled={disabled} />}
        {!army && <p>Select one of your armies to preview a march.</p>}
        <button className="primary" disabled={disabled} onClick={() => void session.perform({ type: 'end' })}>End turn</button>
        {state.active !== 0 && alive(state, 0) && state.winner === null && <button disabled={view.busy} onClick={session.togglePause}>{view.paused ? 'Resume AI turns' : 'Pause AI turns'}</button>}
        <RealmPanel state={state} disabled={disabled} onFocus={inspect} />
        <details><summary>Chronicle</summary><ol className="chronicle">{state.log.map((text, i) => <li key={`${state.sequence}-${i}`}>{text}</li>)}</ol></details>
      </aside>
    </div>
  </>;
}
