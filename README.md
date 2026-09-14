# CFNAM

A browser game that makes browser games: build your own custom five-nights-style
survival horror game and export it as a single `.html` file, or as a folder of plain
HTML/CSS/JS. No server, no install, no build step — at any point.

CFNAM is a fan-made, from-scratch tool: no Five Nights at Freddy's assets, code, or
trademarked names are used anywhere. Everything on screen is either procedurally drawn or
something you upload yourself.

## Run it

Double-click `fnaf-clone/index.html`. That's it — no server, no install, no build step.
The studio is itself a browser page, and it never fetches anything: the runtime files
register their own source so the studio can read it back and write it into your game.

If your browser is fussy about local files (some block storage on `file://`, which only
costs you autosave — "Save file" still works), `Start CFNAM.bat` serves the same
folder on <http://localhost:3483>. You can also just upload the whole `fnaf-clone` folder
to any static host and use the studio online.

## The two tabs

**Simple** — title, how many nights, a difficulty, one of five maps, and up to six
animatronics with a name and a picture each. Every animatronic automatically gets a
different behaviour, route and entrance. Nothing else is required to have a playable game.

**Advanced** — everything else, in seven sections:

| Section | What's in it |
| --- | --- |
| Game | Title, tagline, night count, hour length, theme colours, win/lose text |
| Office | Which entrances exist, doors, lights, office and hallway pictures, mouse-look panning |
| Map | Add/rename/delete rooms, room art style or your own picture, drag the layout, wire up connections, mark which rooms lead to your left door / right door / vent |
| Animatronics | Per-night AI levels, move/attack/retreat timing, fixed routes or free roaming, entrance, nine behaviour traits, images, jumpscare sound, voicelines |
| Power | Starting power and the drain of every device, blackout timing and music |
| Audio | Master and ambience volume, five built-in ambiences or your own looping track |
| Export | Downloads the game as one .html file, or as a zipped folder |

Anything you do in Simple is written into the same project Advanced edits — switching tabs
never throws work away. (Changing the *map* is the one exception: routes get rebuilt for the
new layout, because the old room IDs no longer exist.)

## Animatronic traits

Each of the six can mix these:

- **Doors stop them** — the normal rule. Turn it off for something that walks through.
- **Walks through closed doors** — pair with light-stun or the night is unwinnable.
- **Hall light drives them away** — flash the light to reset them.
- **Freezes while you watch its camera** — rewards camera checking.
- **Speeds up while its room is not watched** — the classic runner.
- **Never appears on cameras** — only the hall light reveals them.
- **Wrecks the camera feed in its room** — heavy static wherever it stands.
- **Drains power at your door** — punishes leaving the door shut on them.
- **Knocks on arrival** — audio tell when they reach you.

Nine ready-made presets (Wanderer, Left/Right Stalker, Vent Crawler, The Runner, Shy One,
Phantom, Signal Jammer, The Brute) fill these in for you.

## Voicelines

Per animatronic, per trigger (moves room / spotted on camera / arrives at your door /
attacks / idle). Each line is either an audio file you upload, or text spoken by the
browser's speech synthesis with adjustable voice, pitch and speed. Both survive export.

## Maps

Five built in — Freddy's Pizzeria, The House on Elm Row, Midnight Arcade, Nightshift
Academy, and a blank starter — or build your own room by room. Rooms with no picture are
drawn procedurally from twelve art styles.

## Health check

Every screen shows automatic checks for the mistakes that make a night unplayable:
unreachable rooms, dead ends, animatronics using an entrance that doesn't exist, routes
that lead nowhere, AI 0 on every night, and power budgets that can't reach 6 AM.

## Export

Two shapes of the same game, both plain browser games:

**One `.html` file** — code, styling, pictures and sounds all baked into a single file.
Double-click it, put it on a USB stick, email it, upload it anywhere. ~80 KB before your
own assets. Easiest to share, hardest to edit later.

**Game folder** (zipped) — the same game as readable source:

```
your-game/
├── index.html
├── css/style.css
├── js/data.js      ← your rooms, animatronics, AI, voicelines (hand-editable)
├── js/audio.js     ← synth SFX, samples, text-to-speech
├── js/render.js    ← procedural rooms and animatronics
├── js/engine.js    ← night simulation, AI, power, jumpscares
├── js/boot.js      ← menus and night flow
├── js/main.js
├── assets/         ← every picture and sound you uploaded
└── README.txt
```

Unzip and double-click `index.html`. To put it on the web, upload the folder to GitHub
Pages / Neocities, or upload the zip to itch.io as an HTML game (tick *"This file will be
played in the browser"*).

## Saving

The project autosaves to browser storage. That can fail two ways — too many megabytes of
uploaded pictures, or a browser that blocks storage for local files — and in both cases the
studio says so and keeps working; use **Save file** (`.fnafproj`) to keep your work, and
**Open file** to load it back.

## Controls (in game)

`A`/`D` or arrows doors · `W` or `↑` vent · hold `Q`/`E` hall lights ·
`Space` cameras · `1`–`9` switch camera · `P` or `Esc` pause

## Project layout

```
fnaf-clone/
├── index.html          studio shell
├── game/               the runtime, shared verbatim with every export
│   ├── module.js       registers each module's own source (studio only)
│   ├── style.js        the stylesheet, held as a string so it needs no fetch
│   └── audio.js  render.js  engine.js  boot.js
└── studio/             editor only
    ├── studio.css  studio.js  presets.js  bundler.js  zip.js
```

Each runtime file is wrapped in `FNAF_MODULE('name.js', function (root) { ... })`. The
loader stores `Function.prototype.toString()` of that function, so the exporter can emit it
as a standalone IIFE. That is the whole trick behind needing no server — and it means the
runtime can never drift from what gets exported, because it *is* what gets exported.

`window.__FNAF` is exposed while a night is running (`state`, `actors`, `step(dt)`,
`toggleDoor`, `setLight`, `setCams`, `switchCam`) — handy for debugging a config without
playing it in real time.
