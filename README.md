# Warchiefs

An original, self-hosted turn-based conquest game inspired by classic fantasy
strategy games. Lead the Alder Pact against three AI factions on an authored
40-by-30 map. Heroes, one-time ruins, quests, peace/war diplomacy, and local
save/resume are included. No account, game server, telemetry, remote fonts, or
runtime content service is required.

## Development

Use Node.js 22.12+ (or a supported newer release) and npm.

```sh
npm ci
npm run dev
```

Vite prints the local address. The development server listens on all interfaces
for local-device access; keep it on a trusted network. Development mode does not
register an offline service worker. Use a production build for offline testing.

```sh
npm run check
npm run build
npm run preview -- --port 4173
npm run test:e2e
```

If Playwright reports missing browser executables, install the declared test
tool's browsers with `npx playwright install chromium firefox webkit`.
`npm test` covers deterministic rules, AI simulations, save formats, IndexedDB
transactions, conflicts, recovery, and failed-write retry.

## Project layout

- `src/app`: application composition, header, global styles.
- `src/components`: shared dialog and render error boundary.
- `src/content`: original authored map, faction definitions, balance constants.
- `src/game`: pure typed rules and small domain modules; AI planning is separate.
- `src/features`: focused React components/hooks for map input, orders, realm,
  sessions, and offline lifecycle.
- `src/persistence`: runtime validation, explicit snapshot migration, IndexedDB.
- `tests`: Playwright browser workflows.
- `public`: original icons and the generated `art/atlas.png` sprite sheet.
- `src/features/map/art`: typed sprite metadata, terrain geometry, loading and
  cached background artwork.
- `scripts/art`: small TypeScript pixel-art painters and the shared PNG encoder.

Vite uses separate app and Node TypeScript projects. Linting enforces React
hook dependencies, a function-size budget, complexity limits, and TypeScript
conventions. Domain rules have no React or browser storage dependency.

## Graphics

The map uses an original 59-sprite pixel-art atlas: textured grass/water,
riverbanks, decorative roads, wooden bridges, overlapping oak/pine foliage,
compact mountain clusters, castles, ruins, and soldier/guard/rider/hero figures.
The visual grid is hidden by default; **Show tile grid** enables it for planning.

Castle silhouettes share the same logical footprint and gameplay. Alder uses
timber/green accents, Dawn pale stone/gold, Ember dark stone/red, and Tide gray
stone/slate blue; neutral forts are muted. Flags and distinct crests identify
ownership as well as color. Captures immediately change the displayed castle
variant and pennant. Army badges remain on top of scenery.

Roads are decorative connections between settlements, derived from passable
terrain without troop or diplomacy state. **They do not change movement costs.**
Graphics variations use an independent coordinate hash, never the gameplay RNG.
Existing saves and map layouts are unchanged.

Terrain/roads/foliage are rendered once into a cached background; ownership,
units, paths, and selection are separate live layers. The atlas is preloaded,
checked for the expected dimensions, and included in offline cache verification.
Missing artwork produces an explicit error and retry control, not silent
placeholder graphics.

```sh
npm run generate:art
npm run generate:icons
npm run generate:assets
```

Generation uses Node's TypeScript stripping flag and built-in PNG compression;
no external art service or image-processing dependency is required. Edit the
typed recipes/palettes/painters, regenerate the checked-in PNG, and rebuild.
All artwork is created from the project source, not copied or traced from the
inspiration image or an existing game. This is the first art pass, not a claim
that final production artwork or physical-device graphics profiling is complete.

## Playing

Create a named campaign; the seed controls combat/exploration randomness, not
the authored map. Select an army, inspect a destination, and confirm the march.
The order travels only as far as the army's remaining movement allows. Drag to
pan, pinch/scroll or use buttons to zoom; keyboard arrows and coordinate fields
also select tiles.

Touch devices start with tiles larger than 44 CSS pixels. Whole-map/zoomed-out
views trade hit-target size for overview; zoom in for precise selection, or use
the army/city lists and coordinate fields.

Cities earn 12 gold per owner turn and train one ordered unit at a time. Stack
capacity is 12; a full garrison stalls production until space is available.
Combats resolve automatically and consume movement; city defenders have a 25%
strength bonus. Friendly armies can merge, and stacks can split onto empty
adjacent non-city tiles.

Recruit a hero for 70 gold in a city containing a friendly army. Each faction
has at most one living hero. Heroes strengthen troops and can explore ruins;
each ruin is consumed globally once, with a 20% risk of losing the hero.
Quests grant 60 gold once. Peace blocks entering the other faction's army/city
tiles, does not create an alliance, and can be broken by declaring war.

Eliminate all rival cities **and** armies to win. AI uses the same commands and
validation as the player; its bounded batches yield between saved actions.
The in-game guide and Chronicle explain rules and combat results.

## Saves and backups

Every accepted action, including each AI action, commits a complete IndexedDB
snapshot before becoming authoritative. Reopening a campaign preserves turn
progress and random-generator state. Multiple slots, manual checkpoints, and a
previous known-good snapshot are supported. Restoring a checkpoint makes the
previous current state the recovery backup.

Campaigns and saves provides JSON export, optional file sharing, and file-picker
import. Import creates a **new** slot and rejects oversized (over 2 MB), malformed,
incompatible, or inconsistent data before mutation. Current snapshot schema is
2; schema 1 is explicitly migrated by adding the declared RNG algorithm. Rules
and content versions are separate from save schema and database schema.

Two tabs cannot silently overwrite one another: writes/deletes compare the
stored revision inside an IndexedDB transaction. A conflict pauses the game
and offers export or reload. Failed writes retain the last committed state and
an exportable candidate; use Retry unsaved write after resolving the failure.
An invalid current snapshot can be recovered from the previous one with an
explicit warning; unsupported records are not silently removed.

**Browser storage is not a permanent backup.** Clearing data, private browsing,
device storage pressure, and browser policy can remove it. Persistence requests
are heuristic and do not prevent user deletion. Safari, Chrome, and installed
web-app contexts must not be assumed to share data. Keep exported files outside
browser storage and use import/export to move between browsers or devices.

## Self-hosting and offline operation

`npm run build` produces `dist/`. Serve that directory at the root of a stable
HTTPS origin. No Node server or database is required in production. For example,
with Caddy:

```caddy
game.example.com {
    root * /srv/warchiefs/dist
    file_server
    @worker path /sw.js /index.html /manifest.webmanifest
    header @worker Cache-Control "no-cache"
    @assets path /assets/*
    header @assets Cache-Control "public, max-age=31536000, immutable"
}
```

Copy the complete build, including the service worker and hashed assets.
Do not deploy just `index.html`. Caddy handles HTTPS when the domain/DNS and
server are configured. Nginx or another static host with equivalent HTTPS and
cache headers works too. Service workers require HTTPS except on localhost;
an ordinary HTTP LAN IP is not sufficient for phone offline testing.

After an initial successful load, the app precaches all required content and
verifies the cached shell before showing **Available offline**. It then works
without network access in a supported browser tab; home-screen installation is
optional. First-ever loading without a connection is not supported. Browser
cache eviction can also remove offline availability.

Updates are prompted, not forced mid-game. Apply an update only at a safe,
fully committed boundary; cache updates do not delete IndexedDB. Compatible
saved games remain available after reload. Changing protocol, hostname, or port
changes the storage origin: export backups before moving to a different origin.

## Compatibility and release caveats

Targets: Safari **and Chrome on iPhone**, Chrome on Android, and modern desktop
Chromium/Firefox/Safari, in portrait and landscape. Installation UX is browser
specific; regular-tab gameplay does not require installation. The app does not
require the desktop File System Access API.

Playwright exercises Chromium, Firefox, WebKit, and touch/mobile viewport
profiles. **Emulation is not a physical-device certification.** Before a public
release, record actual OS/browser versions and check iPhone Safari, iPhone
Chrome, and Android Chrome for real touch/pinch input, offline reopening,
screen-lock/suspension, file download/share/import, and installed contexts.
Gameplay/economy difficulty also needs human playtesting.

The implemented browser workflows cover gameplay through victory, all four
classic systems, exact resumption of partial AI turns, save transfer/checkpoints,
stale-tab conflicts, cached offline reopening, controlled worker updates, and a
100-stack rendering fixture. The automated matrix is not a claim of physical
iPhone/Android certification or real-device frame-rate measurements.

No online multiplayer, cloud sync, procedural maps, fog of war, or tactical
battle scenes are included. Original content is used throughout.
