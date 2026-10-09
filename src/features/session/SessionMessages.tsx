import { session, type SessionView } from './sessionStore';

export function SessionMessages({ view }: { view: SessionView }) {
  const slotId = view.slot?.record.id;
  return <div className="session-messages">
    {view.error && <div role="alert" className="error">
      <strong>Operation stopped:</strong> {view.error}
      {view.pending && <p>The last committed game is unchanged. The unsaved candidate is available for export.</p>}
      <div className="button-row">
        {view.pending && <button disabled={view.busy} onClick={() => void session.retry()}>Retry unsaved write</button>}
        {slotId && <button disabled={view.busy} onClick={() => {
          if (!view.pending || window.confirm('Discard the unsaved candidate and open the latest committed save?')) void session.load(slotId);
        }}>Reload latest save</button>}
      </div>
    </div>}
    <p role="status">{view.busy ? 'Saving / loading...' : view.notice}</p>
  </div>;
}
