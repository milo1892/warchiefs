import { downloadSave, shareSave } from './portableSave';
import { session, type SessionView } from './sessionStore';
import { useStorageProtection } from './useStorageProtection';

export function SaveActions({ view }: { view: SessionView }) {
  const protection = useStorageProtection();
  const state = view.pending?.state ?? view.slot?.snapshot.state;
  const exportSave = () => {
    if (!state) return;
    try { downloadSave(state); session.notify('Save file exported. Keep it outside browser storage.'); }
    catch (error) { session.report(error); }
  };
  return <section className="order-block">
    <h3>Backup and transfer</h3>
    {view.pending && <p>Export will include the unsaved candidate, not the older committed state.</p>}
    <div className="button-row">
      <button disabled={!state} onClick={exportSave}>Export JSON</button>
      <button disabled={!state} onClick={() => { if (state) void shareSave(state).then(session.notify).catch(session.report); }}>Share save file</button>
      <button disabled={!view.slot || view.busy || !!view.pending} onClick={() => void session.checkpoint()}>Save checkpoint</button>
      <button disabled={!view.slot?.record.checkpoint || view.busy || !!view.pending} onClick={() => {
        if (window.confirm('Restore the manual checkpoint? Current progress becomes the recovery backup.')) void session.restore();
      }}>Restore checkpoint</button>
    </div>
    <label>Import a JSON save<input type="file" accept=".json,application/json" disabled={!view.ready || view.busy || !!view.pending} onChange={event => {
      const file = event.currentTarget.files?.[0];
      if (file) void session.importFile(file);
      event.currentTarget.value = '';
    }} /></label>
    <p>{protection.status}</p>
    <button onClick={() => void protection.request()}>Request storage protection</button>
    <p>Local data does not sync between browsers or devices. Use export/import to transfer games. Avoid private browsing.</p>
  </section>;
}
