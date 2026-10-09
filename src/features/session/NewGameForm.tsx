import { useState, type FormEvent } from 'react';
import { session } from './sessionStore';

export function NewGameForm({ disabled, onCreated }: { disabled: boolean; onCreated: () => void }) {
  const [seed] = useState(() => crypto.getRandomValues(new Uint32Array(1))[0]);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const chosenSeed = Number(data.get('seed'));
    if (!Number.isInteger(chosenSeed) || chosenSeed < 0 || chosenSeed > 0xffffffff) {
      session.report(new Error('Seed must be an integer from 0 to 4294967295.'));
      return;
    }
    void session.create(String(data.get('name')), chosenSeed).then(success => { if (success) onCreated(); });
  };
  return <form onSubmit={submit} className="order-block">
    <h3>Start a new campaign</h3>
    <p>One human, three AI rivals, one original map. Your goal: eliminate rival cities and armies.</p>
    <label>Campaign name<input name="name" required maxLength={40} defaultValue="Alder campaign" /></label>
    <label>Battle seed<input name="seed" type="number" required min="0" max="4294967295" defaultValue={seed} /></label>
    <button className="primary" disabled={disabled}>Create campaign</button>
  </form>;
}
