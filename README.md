# The Red Book

A companion app for **Risk: The Lord of the Rings Trilogy Edition** — a phone-first PWA that keeps
the game flowing so nobody has to referee.

Live: https://redbook-lotr-companion.netlify.app

## What it does

| Tab | Purpose |
| --- | --- |
| **Turn** | The rulebook's 7-step turn as a checklist, per-player Territory-card count (with the "must trade at 5" warning), one-tap **End turn** that moves the Fellowship (rolling the die on die-symbol territories and at Mount Doom), a mini dice roller, and player elimination. |
| **Battle** | Enter what your real dice showed; the app sorts highest-vs-highest, applies Leader / stronghold bonuses, and settles ties to the defender. |
| **Lands** | All 64 territories in their 9 regions. Tap to paint ownership; it detects fully-controlled regions and computes the current player's reinforcements live. Fully editable. |
| **Ring** | The Fellowship's 17-step path with die territories, plus the optional Hunt-for-the-Ring variant. |
| **Score** | End-game tally (territories ×1, strongholds ×2, region bonuses, played Adventure cards). |
| **Stone** | The Palantír — an offline, searchable rules oracle (41 verified rulings). |

Everything is verified against the physical rulebook and gameboard. State is saved to `localStorage`
and the app works fully offline once installed.

## Stack

React 18 · esbuild · Tailwind 3 · a hand-rolled service worker. No framework, no server, no API keys.
The whole deploy is ~200 KB.

```
src/App.jsx        the entire app (components, game data, rules oracle)
src/main.jsx       mount + service-worker registration
src/tw.css         Tailwind entry
public/            static assets copied into dist/ (index.html, sw.js, fonts, icons, manifest)
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
- **Territories / regions / strongholds** — `DEFAULT_TERRITORIES` (also editable in-app on the Lands tab).
- **Region bonuses** — `REGIONS`.
- **Palantír answers** — `PALANTIR_KB`. Each entry has a `category`, a display `q`, an `a`, and
  `keywords` used for matching. Add an entry to teach the stone a new ruling.

Bumping `STORAGE_KEY` resets saved games on all devices; do this when the saved-game shape changes.
