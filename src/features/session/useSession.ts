import { useEffect, useRef, useSyncExternalStore } from 'react';
import { nextAICommand } from '../../game/ai/strategy';
import { alive } from '../../game/selectors';
import { session } from './sessionStore';

export function useSession() {
  const view = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) { initialized.current = true; void session.refresh(); }
  }, []);
  return view;
}

export function useAITurns(enabled: boolean): void {
  const view = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const state = view.slot?.snapshot.state;
  useEffect(() => {
    if (!enabled || !state || view.busy || view.paused || view.pending || state.active === 0 || state.winner !== null || !alive(state, 0)) return;
    const timer = window.setTimeout(() => { void session.perform(nextAICommand(state)); }, 80);
    return () => window.clearTimeout(timer);
  }, [enabled, state, view.busy, view.paused, view.pending]);
}
