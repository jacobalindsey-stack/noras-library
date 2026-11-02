# Context for Claude: Nora's Library (noralindsey.com)

Read this first in any new chat about the site or its games. README.md has
the player-facing details of each game. This file covers how the work gets
done.

## Who and what

- **Nora** is Jacob's daughter. She dreams up the games, and some of the art
  comes from her own drawings (Wick in Blackthorn Manor II is one of them).
  Jacob (jacob.a.lindsey@gmail.com) runs the site and talks to Claude.
- **noralindsey.com** is a playbill-style front page that links to every game.
  Each game opens in a new tab.
- **Who plays it:** the games are played mostly on an **iPad**, and also on
  iPhone and PC. Every change gets checked on iPad landscape/portrait,
  phone and desktop.
- **How Jacob likes to work:** plain language, no jargon. He wants finished,
  tested work rather than questions about how to do it. He says "go" when a
  plan is fine.

## The repos

| Repo | What it is | Branch |
|---|---|---|
| `jacobalindsey-stack/noras-library` | The website itself. Plain static files, no build step. | `main` (every push deploys live) |
| `jacobalindsey-stack/reimagined-chainsaw` | Source for Blackthorn Manor and Blackthorn Manor II | BM1: `claude/haunted-witch-game-prompt-9t1z47` · BM2: `claude/affectionate-ramanujan-3ld4ce` |

**Hosting:** Cloudflare Workers with static assets, connected to
`noras-library`. Every push to `main` goes live in about a minute.

- `wrangler.jsonc` publishes the repo root.
- `.assetsignore` keeps `.git`, the README, this file and the config files
  off the site.
- Cloudflare rejects any single file over 25 MiB.
- `_redirects` sends the old `catbakery.html`, `apprenticeship.html` and
  `adriatica.html` addresses to the new folders.

### Commit rules

- Commit as Jacob:
  `git -c user.name="Jacob Lindsey" -c user.email="jacob.a.lindsey@gmail.com" commit ...`
- End every message with the Co-Authored-By and Claude-Session lines the
  session gives you.
- Before every push, run `git fetch origin main`, then rebase on
  `origin/main`. Other sessions push to this repo too.
- Write commit subjects in plain words with the game name first, e.g.
  `Cat Bakery: playtested; New Game asks before erasing`.
- Push straight to `main`. That is the normal flow here; there are no PRs.

## Layout of the site repo

```
index.html        the playbill front page (never needs editing to add a game)
games.js          the list of games: the front page builds itself from this
previews/         two JPEG screenshots per game, ~1000 px wide (play, title)
README.md         the shelf table and how to add a game
CLAUDE.md         this file
blackthorn.html   Blackthorn Manor        (built single file, copied from reimagined-chainsaw)
blackthorn2.html  Blackthorn Manor II     (built single file, copied from reimagined-chainsaw)
pumpkinslash.html Pumpkin Slash           (single file, three.js r128 from cdnjs)
holycity.html     Holy City Hustle        (single file, canvas 2D, no libraries)
algol.html        Mirror of Algol         (single file)
catbakery/        Cat Bakery              (React + Babel from unpkg, .jsx compiled in the browser)
apprenticeship/   The Long Apprenticeship (React + Babel from unpkg; code in src/)
adriatica/        Adriatica               (title page index.html, game in play.html)
adriatica2/       Adriatica II            (folder build, ~19 MB; React + three.js from unpkg)
```

## The games

The front page lists the games in this order (games.js order):

| Game | Where | Save key | Notes |
|---|---|---|---|
| Blackthorn Manor | `blackthorn.html` | `blackthornmanor.` prefix | SNES-style 3/4 top-down action adventure. **Don't edit it in this repo:** edit it in reimagined-chainsaw and sync it in. |
| Blackthorn Manor II | `blackthorn2.html` | `bm2.save.v1` | 3D platformer (raw WebGL2), **beta**. Same rule: build it in reimagined-chainsaw and sync it in. |
| Cat Bakery | `catbakery/` | `catbakery.save.v2` | Cozy bakery sim. Playtested Nov 1 2026. |
| Mirror of Algol | `algol.html` | `mirror-save` | Dev menu only with `?dev`. |
| Adriatica | `adriatica/` | `sq_save_v1` | "Thirteen Sphinxes". Jump panels only with `?dev`. |
| Adriatica II | `adriatica2/` | `adriatica-save-v2` | Dev panel only with `?dev`. Also still served at adriatica2.noralindsey.com until that subdomain is retired. |
| The Long Apprenticeship | `apprenticeship/` | `wilderlore:save:v1` | "Wilderlore" caravan journey. Difficulty values live in `src/app.jsx`. |
| Pumpkin Slash | `pumpkinslash.html` | — | **Jacob says it's perfect. Do not change it.** |
| Holy City Hustle | `holycity.html` | `holycity.save.v1` | SNES-style RC Pro-Am errand racer across Charleston (11 errands incl. secret King Tide race, plus Free Drive). Save also holds `stickers` and `dog` (added Nov 2; old saves fill them in on load). Source lives only in this built file; no real people in the game (Jacob asked for Bill Murray; declined). |

**Saves must never break.** Players have progress in browser storage. Never
rename a save key or change a save's shape without migrating the old save.
The sync steps below check the Blackthorn save keys on every update.

Every game was originally a Claude Design export. All of them have been
migrated here. Standalone Claude Design closes December 14 2026, and nothing
on the site depends on it.

## Adding a new game

The full steps are in README.md under "Adding a game". In short:

1. Put the game in the repo: a single file in the root, or a folder with its
   own `index.html`.
2. Add an entry to `games.js` with these fields:
   - `key`, `title`, `kind`, `platforms`;
   - `blurb` and `howto`;
   - two `shots`;
   - `href`;
   - `ground` and `foil`, two colors from the game's own art;
   - a 64×64 line-drawn `emblem`.
3. Optional flags:
   - `isNew: true` adds the gold "New" badge;
   - `beta: true` adds a "Beta" chip;
   - `comingSoon: true` with a `note` (and no href or shots) adds a teaser.
4. Take the two screenshots (gameplay, then the title screen) and save them
   as JPEGs in `previews/`.
5. Playtest the game (see below). Update the README shelf table, then commit
   and push.

## Syncing Blackthorn Manor / Blackthorn Manor II onto the site

Each Blackthorn game is a folder of numbered source files (`src/*.js`). A
script (`tools/build.py` for BM1, `blackthorn2/tools/build.py` for BM2) joins
them into a single `index.html`. The site gets a copy of that built file.

To update the site:

1. Clone or fetch reimagined-chainsaw. Check out the game's branch.
2. Copy the committed `index.html` aside. Run the build. Make sure the rebuilt
   file is **identical** to the committed one. If it differs, the branch
   needs a rebuild commit first; stop and fix that.
3. Check the save key is unchanged:
   - BM1: `SAVE_PREFIX = 'blackthornmanor.'`
   - BM2: `SAVE_KEY = 'bm2.save.v1'`
4. Copy the file over:
   - BM1: `index.html` → `blackthorn.html`
   - BM2: `blackthorn2/index.html` → `blackthorn2.html`
5. Smoke-test it in a browser: the game loads, there are no console errors,
   and the game saves.
6. Update the commit hash in the README shelf row, e.g. "(0558efc)". For BM1,
   also update the version.
7. Commit as `Blackthorn Manor II: update to <hash>`, listing the new commit
   subjects in the message. Rebase, then push.

Blackthorn II's own design notes are in `blackthorn2/DESIGN.md` and
`blackthorn2/NEXT.md` in reimagined-chainsaw. Its test tools are in
`blackthorn2/tools/` (route bots, `fullrun.js`, `physics.js`, iPad and iPhone
checks).

## How to playtest

The container has Chromium and Playwright (Python and Node) pre-installed;
don't reinstall them.

1. Serve the repo locally: `python3 -m http.server 8770` from the repo root,
   run in the background.
2. Drive the game with Playwright at these sizes:
   - iPhone portrait 390×844 and landscape 844×390;
   - iPad landscape 1180×820 and portrait 820×1180;
   - desktop 1440×900.
3. Use `has_touch`/`is_mobile` for the phone and iPad sizes. Look at the
   screenshots yourself.
4. Write a bot that plays through the real UI by clicking the same buttons a
   player would. Run it end to end at every difficulty. Check for:
   - dead ends, stuck states and runaway economies;
   - endings you can't reach;
   - console errors.
5. Things that have needed fixing before:
   - overlays and cards that don't scroll on short phone screens;
   - keyboard hints showing on touch devices;
   - choices the player can't afford still being clickable;
   - saves surviving after an ending;
   - a game freezing after the iPad sleeps (lost WebGL or audio).
6. Before claiming something works, take a screenshot and check it.

## After every change

- Update the README shelf row with what changed and the date.
- Write the updated files to the claude.ai Project "NoraLindsey.com" under
  `site/`: `README.md` every time, plus `index.html` or `games.js` when they
  change. Also write this file as `site/CLAUDE.md` when it changes.
- Tell Jacob what changed in a sentence or two. Don't walk him through the
  steps.

## Open threads (as of Nov 2 2026)

- **New games:** Jacob is asking Nora for new game ideas. That is the next
  big piece of work.
- **Blackthorn Manor II, on hold until Jacob says go:** pause and settings
  pages, and secrets.
- **Blackthorn Manor II freeze report:** waiting on a photo of the screen
  where the game stopped. The game now shows a "Wick got tangled" message
  instead of looking frozen, so the photo should show what went wrong.
- **Adriatica II:** the old adriatica2.noralindsey.com subdomain is still up.
  Retire it whenever Jacob wants.
