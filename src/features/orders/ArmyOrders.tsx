import { UNITS } from '../../content/rules';
import { UNIT_KINDS, type Army, type GameState, type Position, type Route } from '../../game/model';
import { marchDestination } from '../../game/pathfinding';
import { sameTile, strength } from '../../game/selectors';
import { session } from '../session/sessionStore';
import { SplitOrders } from './SplitOrders';

type Props = { state: GameState; army: Army; tile: Position; path: Route | null; disabled: boolean };

function describeArmy(army: Army): string {
  return UNIT_KINDS.filter(kind => army.units.includes(kind)).map(kind => {
    const count = army.units.filter(unit => unit === kind).length;
    return `${count} ${count === 1 ? kind : UNITS[kind].name.toLowerCase()}`;
  }).join(', ');
}

export function ArmyOrders({ state, army, tile, path, disabled }: Props) {
  const to = marchDestination(state, army, tile);
  const ruin = state.ruins.find(r => sameTile(r, army));
  return <section className="order-block">
    <h3>Your army · ({army.x + 1}, {army.y + 1})</h3>
    <p>{describeArmy(army)}. Strength {Math.round(strength(army))}. Movement {army.movement}.</p>
    {army.hero && <p><strong>{army.hero.name}</strong>, level {army.hero.level}: army strength bonus and +1 movement next turn.</p>}
    {sameTile(army, tile) ? <p>Select a destination on the map or inspect a tile below.</p>
      : <p>{path ? `Route costs ${path.cost} movement. This order stops at the furthest reachable tile this turn.` : 'No legal route. Mountains, armies, water, or a peace treaty block this destination.'}</p>}
    <button className="primary" disabled={disabled || !to} onClick={() => {
      if (to) void session.perform({ type: 'move', armyId: army.id, to });
    }}>{to ? `Confirm march to (${to.x + 1}, ${to.y + 1})` : 'Select a reachable destination'}</button>
    {ruin && <button disabled={disabled || !army.hero || ruin.exploredBy !== null || army.movement === 0}
      onClick={() => void session.perform({ type: 'explore', armyId: army.id })}>Explore {ruin.name}</button>}
    {army.units.length > 1 && <SplitOrders key={army.id} state={state} army={army} disabled={disabled} />}
  </section>;
}
