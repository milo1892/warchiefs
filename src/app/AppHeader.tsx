import { alive } from '../game/selectors';
import { session, type SessionView } from '../features/session/sessionStore';
import type { useOffline } from '../features/offline/useOffline';

type Props = { view: SessionView; offline: ReturnType<typeof useOffline>; onSaves: () => void; onGuide: () => void };

export function AppHeader({ view, offline, onSaves, onGuide }: Props) {
  const state = view.slot?.snapshot.state;
  const canUpdate = !view.busy && !view.pending && (!state || state.active === 0 || state.winner !== null || !alive(state, 0));
  return <header className="app-header">
    <div><h1>Warchiefs</h1><p className="eyebrow">A chronicle of banners and broken kingdoms</p></div>
    <div className="header-status">
      {state && <strong>Round {state.round} · {state.factions[state.active].name} · Your gold: {state.factions[0].gold}</strong>}
      <span className={offline.available ? 'offline-badge ready' : 'offline-badge'}>{offline.status}</span>
    </div>
    <nav className="button-row" aria-label="Game menu">
      <button onClick={onGuide}>How to play</button>
      <button onClick={onSaves}>Campaigns and saves</button>
      {offline.needsUpdate && <button disabled={!canUpdate} onClick={() => void session.applyUpdate(offline.update)}>Apply available update</button>}
    </nav>
  </header>;
}
