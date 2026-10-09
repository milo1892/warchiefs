import type { FormEvent } from 'react';
import type { GameState, Position } from '../../game/model';
import { RuleError } from '../../game/state';
import { session } from '../session/sessionStore';

export function DestinationForm({ state, tile, onSelect }: { state: GameState; tile: Position; onSelect: (p: Position) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const x = Number(data.get('column')) - 1;
    const y = Number(data.get('row')) - 1;
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= state.map.width || y >= state.map.height) {
      session.report(new RuleError('Enter a valid map column and row.'));
      return;
    }
    onSelect({ x, y });
  };
  return <form className="coordinate-form" key={`${tile.x},${tile.y}`} onSubmit={submit}>
    <label>Column<input name="column" type="number" required min="1" max={state.map.width} defaultValue={tile.x + 1} /></label>
    <label>Row<input name="row" type="number" required min="1" max={state.map.height} defaultValue={tile.y + 1} /></label>
    <button>Inspect tile</button>
  </form>;
}
