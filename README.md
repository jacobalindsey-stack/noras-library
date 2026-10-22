# Nora's Library

Source for noralindsey.com. Plain static files, no build step.

Cloudflare Pages settings: build command blank, output directory `/`.
Every push to `main` redeploys the site.

## Shelf

| Game | Location | Status |
|---|---|---|
| Cat Bakery | `catbakery/` | migrated from Claude Design export (deploy build) |
| The Long Apprenticeship | `apprenticeship/` | migrated from Claude Design export ("Wilderlore") |
| Adriatica | `adriatica/` | migrated from Claude Design export ("Thirteen Sphinxes", v2.1) |
| Mirror of Algol | `algol.html` | migrated from Claude Design export (single file) |
| Adriatica II | `adriatica2/` | migrated from Claude Design export (folder build, 19 MB) |
| Pumpkin Slash | `pumpkinslash.html` | single file, attached Oct 18 2026 (three.js r128 from cdnjs, jsdelivr/unpkg fallbacks) |
| Blackthorn Manor | `blackthorn.html` | built `index.html` from the reimagined-chainsaw repo (cfd48f4, v1.2.0) |

Adriatica II also lives at the old subdomain adriatica2.noralindsey.com until
that is retired. Its folder build loads React and three.js from unpkg and its
fonts from Google Fonts; everything else is local. Saves go to the player's
browser storage under `adriatica-save-v2`.

Cat Bakery and The Long Apprenticeship load React and Babel from unpkg and
compile their `.jsx` files in the browser. Adriatica's title page is
`adriatica/index.html`; the game itself runs in `adriatica/play.html`.
Saves: `catbakery.save.v2`, `wilderlore:save:v1`, `sq_save_v1`.

`_redirects` (Cloudflare Pages) sends the old `catbakery.html`,
`apprenticeship.html` and `adriatica.html` addresses to the new folders.

Every game is now migrated. Standalone Claude Design closes by December 14, 2026;
nothing here depends on it any more.

## The front page

`index.html` is the playbill: a velvet curtain, then one numbered act per game,
each with a cameo emblem in the game's own colors. Every game opens in a new tab.
The acts are built from `games.js`; `index.html` itself never needs editing to
add a game.

## Adding a game

1. Put the game in the site. Single-file games go in the root (`mygame.html`).
   Folder builds get their own folder with `index.html` inside (`mygame/`).
2. Open `games.js`, copy one entry, and change it:
   - `title`, `kind` (the kind of game, e.g. "Cozy bakery sim"), `href`
   - `ground` and `foil`: two colors taken from the game's own art, a dark
     background and a gold-ish highlight
   - `emblem`: a small line drawing inside a 64x64 box, drawn in
     `currentColor`. Copy an existing one to start from.
   - `platforms`: where it plays well, best first (`'PC'`, `'iPad'`, `'iPhone'`)
   - `blurb` and `howto`: the preview's description and its one-line controls
   - `shots`: two screenshots in `previews/`, gameplay first, then the title
     screen (JPEG, about 1000 px wide)
3. Save and push. The game appears as the next act with the next numeral.

Clicking a game opens its preview (screenshots, description, how to play)
with **Open the game** and **Close**; ctrl/cmd-click still opens the game
directly.

## Cloudflare

The site deploys as a Cloudflare Workers project with static assets, connected
to this repo: every push to `main` redeploys. `wrangler.jsonc` sets the assets
folder to the repo root, and `.assetsignore` keeps `.git`, this README and the
config files out of the published site (Cloudflare rejects any single file over
25 MiB, and git's own pack files can exceed that).
