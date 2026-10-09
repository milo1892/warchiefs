import { QUEST_REWARD } from '../../content/rules';
import type { GameState, Position } from '../../game/model';
import { questName } from '../../game/quests';
import { DiplomacyPanel } from './DiplomacyPanel';

type Props = { state: GameState; disabled: boolean; onFocus: (p: Position) => void };

export function RealmPanel({ state, disabled, onFocus }: Props) {
  return <>
    <details open><summary>Your armies</summary>
      <div className="button-stack">{state.armies.filter(a => a.owner === 0).map(a => <button key={a.id} onClick={() => onFocus(a)}>
        Select army ({a.x + 1}, {a.y + 1}) · {a.units.length} units{a.hero ? ` · ${a.hero.name}` : ''}
      </button>)}</div>
    </details>
    <details><summary>Cities</summary>
      <div className="button-stack">{state.cities.map(c => <button key={c.id} onClick={() => onFocus(c)}>
        Inspect {c.name} · {c.owner === -1 ? 'Neutral' : state.factions[c.owner].name}
      </button>)}</div>
    </details>
    <details><summary>Quests and ruins</summary>
      {state.quests.filter(q => q.owner === 0).map(q => <section className="order-block" key={q.id}>
        <h3>{questName(q)}</h3>
        <p>{q.completed ? 'Completed; reward granted.' : `${q.kind === 'city' ? 'Capture Stonegate.' : 'Explore any ruin with a hero.'} Reward: ${QUEST_REWARD} gold.`}</p>
      </section>)}
      <div className="button-stack">{state.ruins.map(r => <button key={r.id} onClick={() => onFocus(r)}>
        Inspect {r.name} · {r.exploredBy === null ? 'Unexplored' : 'Sealed'}
      </button>)}</div>
    </details>
    <DiplomacyPanel state={state} disabled={disabled} />
  </>;
}
