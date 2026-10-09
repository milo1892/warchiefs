import { HERO_COST, UNITS } from '../../content/rules';
import { UNIT_KINDS, type City, type GameState } from '../../game/model';
import { armyAt } from '../../game/selectors';
import { session } from '../session/sessionStore';

type Props = { state: GameState; city: City; disabled: boolean };

export function CityOrders({ state, city, disabled }: Props) {
  const owned = city.owner === 0;
  const heroAvailable = armyAt(state, city)?.owner === 0 && !state.armies.some(a => a.owner === 0 && a.hero);
  return <section className="order-block">
    <h3>{city.name}</h3>
    <p>{city.owner === -1 ? 'Neutral city' : state.factions[city.owner].name} · 12 gold per turn · defenders gain 25% strength</p>
    {city.queue && <p>Recruiting {UNITS[city.queue.kind].name.toLowerCase()}: {city.queue.remaining ? `${city.queue.remaining} owner turn(s)` : 'ready; make space in the garrison'}</p>}
    {owned && <div className="button-stack">
      {UNIT_KINDS.map(kind => <button key={kind} disabled={disabled || !!city.queue || state.factions[0].gold < UNITS[kind].cost}
        onClick={() => void session.perform({ type: 'recruit', cityId: city.id, kind })}>
        Recruit {UNITS[kind].name.toLowerCase()} · {UNITS[kind].cost} gold · {UNITS[kind].turns} turn(s)
      </button>)}
      <button disabled={disabled || !heroAvailable || state.factions[0].gold < HERO_COST}
        onClick={() => void session.perform({ type: 'hero', cityId: city.id })}>Recruit hero · {HERO_COST} gold</button>
    </div>}
  </section>;
}
