# The Red Book

A companion app for **Risk: The Lord of the Rings Trilogy Edition** — a PWA that keeps the game
flowing so nobody has to referee. Designed for a tablet in landscape (steps on the left, the current
step's tools on the right) and still works stacked on a phone.

Live: https://redbook-lotr-companion.netlify.app

## What it does

| Tab | Purpose |
| --- | --- |
| **Turn** | A guided, step-by-step turn built for a kid to lead the table: one step at a time with a plain-language instruction and a big **Done ▶ next step** button. Everything a turn needs is inline — the reinforcement count (with stronghold names, region bonuses and card trade-ins), the battle settler (highest-vs-highest, Leader / stronghold bonuses, ties to the defender), an **I conquered a land** picker that updates the map, the Territory-card hand count, and one-tap **End turn** that moves the Fellowship (rolling the die on die-symbol territories and at Mount Doom). Also holds the dice roller and player elimination. |
| **Lands** | A photo of the real gameboard with an owner badge on every one of the 64 territories. Tap a land to paint its owner; it detects fully-controlled regions and computes the current player's reinforcements live. The same tappable board is used by the Turn tab's "I conquered a land" and "Mark my lands" pickers. Region lists remain as a fallback and for editing. |
| **Ring** | The Fellowship's 17-step path with die territories, plus the optional Hunt-for-the-Ring variant. |
| **Score** | End-game tally (territories ×1, strongholds ×2, region bonuses, played Adventure cards), prefilled from the Lands map. |
| **Stone** | The Palantír — an offline, searchable rules oracle (41 verified rulings). |

Everything is verified against the physical rulebook and gameboard. State is saved to `localStorage`
and the app works fully offline once installed.

## Stack

React 18 · esbuild · Tailwind 3 · a hand-rolled service worker. No framework, no server, no API keys.
The whole deploy is ~200 KB.

```
src/App.jsx        the app (components, game data, rules oracle)
src/BoardMap.jsx   the tappable board photo with owner badges
src/mapData.js     where each territory sits on the photo (tap goes to the nearest point)
tools/anchors.html drag-and-drop editor for those points (open via `npm run dev`)
src/main.jsx       mount + service-worker registration
src/tw.css         Tailwind entry
public/            static assets copied into dist/ (index.html, sw.js, fonts, icons, manifest, board.webp)
build.mjs          build script (esbuild + tailwind + cache-stamped service worker)
tests/smoke.mjs    jsdom smoke test — boots the bundle and exercises every screen
netlify.toml       Netlify build config + cache headers
```

## Develop

```bash
npm install
npm run build      # -> dist/
npm test           # builds nothing; runs the smoke test against dist/
npm run dev        # build + local preview at http://localhost:5173
```

The build stamps `sw.js` with a content hash, so every deploy invalidates the old cache automatically —
no more manual version bumps or hard-refreshes.

## Deploy (GitHub → Netlify, automatic)

One-time setup:

1. **Create a GitHub repo** (e.g. `redbook-lotr-risk`, private is fine) — empty, no README.
2. **Push this folder:**
   ```bash
   cd redbook-lotr-risk
   git init
   git add .
   git commit -m "The Red Book — LOTR Risk companion"
   git branch -M main
   git remote add origin git@github.com:<you>/redbook-lotr-risk.git
   git push -u origin main
   ```
3. **Link it in Netlify:** open the existing site → **Site configuration → Build & deploy →
   Continuous deployment → Link repository** → pick the GitHub repo. Netlify reads `netlify.toml`
   for the build command (`npm run build`) and publish folder (`dist`), so leave those as detected.
4. Netlify builds and deploys immediately. From now on, **every `git push` to `main` deploys**.

Branch pushes get Deploy Previews on their own URL, which is handy for trying a change on the phone
before it hits the family's home screen.

## Install on a device

Open the site in Chrome (Android) or Safari (iOS) → **Add to Home Screen**. After the first load it
works offline. Each device keeps its own saved game.

## Editing the rules data

- **Fellowship path** — `DEFAULT_PATH` in `src/App.jsx` (also editable in-app on the Ring tab).
- **Territories / regions / strongholds** — `DEFAULT_TERRITORIES` (also editable in-app on the Lands tab). Names match the printed board.
- **Where a territory sits on the board photo** — `MAP_ANCHORS` in `src/mapData.js`. Open `http://localhost:5173/tools/anchors.html` while `npm run dev` is running to drag points and copy the JSON back.
- **Region bonuses** — `REGIONS`.
- **2-player starting lands** — `GOOD_TERRITORIES` / `EVIL_TERRITORIES` (the Good-shield and Evil-shield territory cards).
- **Palantír answers** — `PALANTIR_KB`. Each entry has a `category`, a display `q`, an `a`, and
  `keywords` used for matching. Add an entry to teach the stone a new ruling.

Bumping `STORAGE_KEY` resets saved games on all devices; do this when the saved-game shape changes.
