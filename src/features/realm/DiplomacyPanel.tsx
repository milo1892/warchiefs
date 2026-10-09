import type { GameState } from '../../game/model';
import { alive } from '../../game/selectors';
import { session } from '../session/sessionStore';

export function DiplomacyPanel({ state, disabled }: { state: GameState; disabled: boolean }) {
  return <details>
    <summary>Diplomacy</summary>
    {state.factions.filter(f => f.id !== 0).map(faction => {
      const living = alive(state, faction.id);
      const peace = state.relations[0][faction.id] === 'peace';
      const incoming = state.proposals.find(p => p.from === faction.id && p.to === 0);
      const outgoing = state.proposals.some(p => p.from === 0 && p.to === faction.id);
      return <section className="order-block" key={faction.id}>
        <h3 style={{ color: faction.color }}>{faction.name}</h3>
        <p>{living ? (peace ? 'At peace: no entering their territory.' : 'At war') : 'Eliminated'} · {state.cities.filter(c => c.owner === faction.id).length} cities</p>
        {living && <div className="button-row">
          <button disabled={disabled || !!incoming || outgoing} onClick={() => void session.perform({ type: peace ? 'declare' : 'propose', to: faction.id })}>{peace ? 'Declare war' : outgoing ? 'Peace offered' : 'Offer peace'}</button>
          {incoming && <>
            <button disabled={disabled} onClick={() => void session.perform({ type: 'respond', from: faction.id, accept: true })}>Accept peace</button>
            <button disabled={disabled} onClick={() => void session.perform({ type: 'respond', from: faction.id, accept: false })}>Reject peace</button>
          </>}
        </div>}
        {incoming && <p>Proposal expires after round {incoming.expires}.</p>}
      </section>;
    })}
    <p>Peace is not an alliance. War can be declared later; eliminating rivals is still required to win.</p>
  </details>;
}
