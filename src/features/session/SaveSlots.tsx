import type { SlotRecord } from '../../persistence/database';
import { SaveError, parseSnapshot } from '../../persistence/snapshot';
import { session, type SessionView } from './sessionStore';

function summary(record: SlotRecord): string {
  try {
    const s = parseSnapshot(record.current).state;
    return `Round ${s.round} · ${s.factions[s.active].name}`;
  } catch (error) {
    if (!(error instanceof SaveError)) throw error;
    return 'Unsupported or damaged snapshot; open to attempt recovery.';
  }
}

export function SaveSlots({ view, onOpened }: { view: SessionView; onOpened: () => void }) {
  const open = (id: string) => {
    if (view.pending && !window.confirm('Discard the unsaved candidate and open this saved game?')) return;
    void session.load(id).then(success => { if (success) onOpened(); });
  };
  return <section className="order-block">
    <h3>Saved campaigns</h3>
    <button disabled={view.busy || (!view.ready && !view.error)} onClick={() => void session.refresh()}>Refresh save list</button>
    {!view.slots.length && <p>No saved campaigns in this browser yet.</p>}
    <ul className="save-slots">{view.slots.map(record => <li key={record.id}>
      <strong>{record.name}</strong>
      <p>{summary(record)}<br />Last saved: {new Date(record.updatedAt).toLocaleString()}</p>
      <div className="button-row">
        <button disabled={view.busy} onClick={() => open(record.id)}>Continue {record.name}</button>
        <button className="danger" disabled={view.busy || !!view.pending} onClick={() => {
          if (window.confirm(`Permanently delete "${record.name}" from this browser? Export a backup first.`)) void session.remove(record);
        }}>Delete</button>
      </div>
    </li>)}</ul>
  </section>;
}
