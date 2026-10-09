import type { GameState } from '../../game/model';
import { exportText } from '../../persistence/snapshot';

function saveFile(state: GameState): File {
  return new File([exportText(state)], `warchiefs-round-${state.round}.json`, { type: 'application/json' });
}

export function downloadSave(state: GameState): void {
  const url = URL.createObjectURL(saveFile(state));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `warchiefs-round-${state.round}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function shareSave(state: GameState): Promise<string> {
  const files = [saveFile(state)];
  if (!navigator.canShare?.({ files })) throw new Error('File sharing is unavailable here. Use Export JSON instead.');
  try { await navigator.share({ files, title: 'Warchiefs save' }); return 'Save shared.'; }
  catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return 'Sharing cancelled.';
    throw error;
  }
}
