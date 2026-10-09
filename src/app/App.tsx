import { useState } from 'react';
import { GamePage } from '../features/game/GamePage';
import { GuideDialog } from '../features/game/GuideDialog';
import { useOffline } from '../features/offline/useOffline';
import { SaveDialog } from '../features/session/SaveDialog';
import { SessionMessages } from '../features/session/SessionMessages';
import { useAITurns, useSession } from '../features/session/useSession';
import { AppHeader } from './AppHeader';

export function App() {
  const view = useSession();
  const offline = useOffline();
  const [savesOpen, setSavesOpen] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);
  const showSaves = savesOpen || !view.slot;
  useAITurns(!showSaves && !guideOpen);
  return <main className="app">
    <AppHeader view={view} offline={offline} onSaves={() => setSavesOpen(true)} onGuide={() => setGuideOpen(true)} />
    {!showSaves && <SessionMessages view={view} />}
    {view.slot ? <GamePage key={view.slot.record.id} view={view} slot={view.slot} /> : <section className="welcome">
      <h2>The realm awaits</h2><p>Found a campaign, lead heroes into forgotten ruins, and unite twelve cities under one banner.</p>
    </section>}
    {showSaves && <SaveDialog view={view} onClose={() => setSavesOpen(false)} />}
    {guideOpen && <GuideDialog onClose={() => setGuideOpen(false)} />}
  </main>;
}
