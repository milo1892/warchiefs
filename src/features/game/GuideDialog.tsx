import { Dialog } from '../../components/Dialog';

export function GuideDialog({ onClose }: { onClose: () => void }) {
  return <Dialog title="How to play" onClose={onClose}>
    <h3>Raise a banner</h3>
    <p>You command the green Alder Pact. Eliminate each rival's cities AND remaining armies to win. Losing yours ends your campaign. The entire map is visible.</p>
    <h3>Order armies</h3>
    <p>Tap an army or use Your armies. Tap a destination to preview a route, then confirm the march. Long routes advance only as far as current movement allows. Drag the map to pan; pinch or use zoom buttons. Arrow keys and coordinate fields provide keyboard controls.</p>
    <p>Water and mountains are impassable; cross rivers at bridges. Forest costs two movement points, other passable terrain one. Stacks contain up to 12 units. Enter a friendly army to merge; splitting requires an empty adjacent non-city tile.</p>
    <p>Roads are decorative and do not grant movement bonuses. Show tile grid reveals the underlying cells; scenery and castle styles do not change their logical footprint or rules.</p>
    <h3>Muster and conquer</h3>
    <p>Each city earns 12 gold at the beginning of your turn. A recruitment order completes after its displayed number of owner turns. A full garrison stalls production until there is space. Capturing a city cancels its recruitment.</p>
    <p>Combat resolves automatically with seeded randomness, one casualty per exchange. Larger, stronger armies have better odds. City defenders gain 25% strength. Battles consume remaining movement. Dead heroes cannot be recovered; a new hero may be recruited.</p>
    <h3>Heroes and legends</h3>
    <p>A hero costs 70 gold and joins a friendly army stationed in your city. Each faction can have one living hero. Heroes strengthen every unit and add one movement point on future turns.</p>
    <p>Explore ruins with a hero and remaining movement. Each ruin can be explored only once. Exploration consumes remaining movement, with a 20% chance of losing the hero; otherwise it grants gold and a hero level. Quests reward 60 gold once.</p>
    <h3>Diplomacy and turns</h3>
    <p>Peace proposals last through the displayed round. Peace blocks entering the other faction's occupied/city tiles; it is not an alliance. Declare war when needed. AI rivals use the same rules and can reject offers. End turn lets all living rivals act.</p>
    <h3>Keep your chronicle</h3>
    <p>Every accepted action is saved before becoming authoritative. Campaigns and saves provides manual checkpoints and JSON transfer. Browser data can disappear; keep file backups. Offline play is ready only when the header says Available offline, after a successful online load.</p>
  </Dialog>;
}
