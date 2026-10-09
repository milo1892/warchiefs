import { Dialog } from '../../components/Dialog';
import { NewGameForm } from './NewGameForm';
import { SaveActions } from './SaveActions';
import { SaveSlots } from './SaveSlots';
import { SessionMessages } from './SessionMessages';
import type { SessionView } from './sessionStore';

export function SaveDialog({ view, onClose }: { view: SessionView; onClose: () => void }) {
  return <Dialog title="Campaigns and saves" onClose={onClose} canClose={!!view.slot && !view.busy}>
    <SessionMessages view={view} />
    <NewGameForm disabled={!view.ready || view.busy || !!view.pending} onCreated={onClose} />
    <SaveSlots view={view} onOpened={onClose} />
    <SaveActions view={view} />
  </Dialog>;
}
