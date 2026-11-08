# Nora's Library

Source for noralindsey.com. Plain static files, no build step.

Cloudflare Pages settings: build command blank, output directory `/`.
Every push to `main` redeploys the site.

## Shelf

| Game | Location | Status |
|---|---|---|
| Cat Bakery | `catbakery/` | migrated from Claude Design export (deploy build); playtested Nov 1 2026 (finale reachable in ~40 rounds, never stuck broke) |
| The Long Apprenticeship | `apprenticeship/` | migrated from Claude Design export ("Wilderlore"); playtested Nov 1 2026: playable on phones (the trail screen and cards scroll), Keeper and Grand Keeper retuned so careless play costs apprentices. Saves under `wilderlore:save:v1` |
| Adriatica | `adriatica/` | migrated from Claude Design export ("Thirteen Sphinxes", v2.1); playtested and fixed Oct 30 2026. Jump panels only with `?dev` |
| Mirror of Algol | `algol.html` | migrated from Claude Design export (single file); playtested, fixed and rebalanced Oct 30 2026. Dev menu only with `?dev`. Saves under `mirror-save` |
| Adriatica II | `adriatica2/` | migrated from Claude Design export (folder build, 19 MB); playtested Nov 1 2026 (both endings reachable, no dead ends). Dev panel only with `?dev` |
| Pumpkin Slash | `pumpkinslash.html` | single file, attached Oct 18 2026 (three.js r128 from cdnjs, jsdelivr/unpkg fallbacks) |
| Blackthorn Manor II | `blackthorn2.html` | beta: built `blackthorn2/index.html` from the `claude/affectionate-ramanujan-3ld4ce` branch of reimagined-chainsaw (0558efc). Saves under `bm2.save.v1` |
| Holy City Hustle | `holycity.html` | new Nov 2 2026: single-file SNES-style RC Pro-Am errand racer across Charleston (six errands plus the secret King Tide Showdown, dealership upgrades). Bot-playtested every errand at all difficulties on iPad, iPhone and desktop. Saves under `holycity.save.v1`. Nov 2: double-tap and pinch zoom blocked on iOS; roads ~45% wider, camera pulled back, Driving help (keeps the car straight when you let go), 8-bit touch buttons, Button layout editor and button size in Settings; steering wheel (left/right) is the default touch steering with 4-WAY as the option, compact HUD and smaller see-through controls on phones; roads twice their original width, RC Pro-Am style curbs keep the car on the pavement (hit one hard to hop it); turn-by-turn card with a big arrow, street and distance that pulses then flashes "TURN NOW", plus blinking chevrons painted at each turn. Nov 2 (later): tidal flooding cycles in and out (streets go under, deep water stalls the engine, hold GAS to crank), coastal decor (pelicans, egrets, sailboats, surfers, beach umbrellas), bigger centered landmark signs, three new errands (Surf Day: Isle of Palms, RiverDogs Game Night, Pick Up Dad at CHS), Lowcountry lore on briefings and results. All 10 errands bot-tested. Holy City Motors restyled as a bright glass showroom (curtain wall onto Savannah Hwy, polished floor with reflections, spotlights, turntable); every new car gets an 8-bit collectible hero card (also via VIEW CARD, and the Alfa's card pops up when you win it). iPhone reworked as portrait-only: street view zoomed in about 35% above a bottom control deck (wheel, GAS, BRAKE, TEA, HONK, MPH readout), "hold your phone upright" screen when sideways; iPad and desktop unchanged. File now has a doctype (was rendering in quirks mode). Nov 2 (evening): real Front Beach at the Isle of Palms surf stop (beach parking, boardwalk over the dunes, FRONT BEACH sign, lifeguard stand, IOP pier, beachgoers, wet sand, swash and breakers along every ocean beach; the surf errand now ends at the beach lot). Each car handles differently: Ranger and Volvo hop curbs easily and roll over grass, Smart and Minis need a hard hit to clear a curb and bog down off-road; speed, pickup, steering response, braking and tail slide tuned per car; dealer shows Pickup, Steering and Curb hopping bars. All 10 errands bot-tested in the Ranger, surf and A. Hall in every car. Nov 2 (night): ballet studio moved from Mount Pleasant to Ashley Hall Rd in West Ashley, off a new Highway 61 (Ashley River Rd); the ballet errand now runs back over the drawbridge and up 61, with construction on 61. Bot-tested in three cars on normal and hard. Inside corners of every intersection get a slight chamfer (road, sidewalk and curb) so tight turns don't snag. Nov 2 (late): FREE DRIVE (from the map, or "Free drive from here" in the pause menu) with a full day/night clock; lighting now follows the clock in every errand. Map built out: Mary Murray Dr loop around Hampton Park, King St lined with storefronts from Broad to Spring, Marion Square farmers market, Pineapple Fountain. Sticker book (33 stickers: 26 in the streets, 7 secret) saved in the same save; Biscuit the lost Boykin spaniel (bring him home twice and he rides along); Luna the fluffy tortoiseshell cat waits on the porch on gold-pace runs that end at home; Easter eggs (pineapple fountain lap, honk at a Battery cannon, dolphins under the drawbridge, NORA on the RiverDogs scoreboard, palmetto bug on Wagener Terrace). New errand: Costume Run (Halloween). Radio changes by area (downtown swing, island surf, Lowcountry pickin'). Postcard photo mode in the pause menu. Home is now a cute yellow cottage. Old saves load fine. All 11 errands bot-tested. Nov 2 (evening, later): smoother driving: a glancing curb hit now slides you along the curb and straightens the car instead of stopping it (tight turns keep their speed), curb checks use the car body instead of a point past the bumper, neighborhood and downtown streets 15% wider; play-date race rivals eased slightly to match. iPhone: turn-by-turn card moved into its own strip between the street view and the controls (shows the current street when there's no turn). iPhone deck tightened: clock, money, tea, tide, place/eggs and PAUSE moved off the street view into a slim status bar at the top of the deck; objective shows in the nav strip; controls area shorter, so the street view is taller. iPad: minimap now sits just under the status chips instead of overlapping them. Full replay: all 11 errands on easy and hard in the Ranger, plus a long free-drive run past midnight, no errors. Nov 3: land on a roof or treetop after a jump and you can drive across it and drop off the edge (no more getting stuck); curbs and edge lines now follow the 45° chamfer at every corner |
| Blackthorn Manor | `blackthorn.html` | built `index.html` from the reimagined-chainsaw repo (483e4a6, v1.2.9). Nov 8 2026: the iPad stick no longer gets stuck when Safari loses a finger-lift (v1.2.9); iPad spell menu in the right panel, tidier side panels, pause button (P), labelled Surge meter; saves from v1.2.7 carry over unchanged. Nov 2 2026: touch buttons laid out by importance (CAST, then DASH beside it, ACT, CAT farthest); rooms go cold every 12-18 min, one at a time; on touch screens the spell arrows and song button sit on the CAST button (all movable in Button layout); boss rooms no longer freeze on entry, spellbook fits narrow screens, clearer touch buttons with a Button layout editor, iPad full screen keeps both side panels, Servants' Corridor fall loop fixed, pantry steam step points at the steam |

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

A game that isn't out yet gets `comingSoon: true` (no `href` or `shots`) and a
`note` instead of `howto`: it shows a "Coming soon" tag, its preview has no
Open button, and it takes the place of the empty next-act slot. When it ships,
remove `comingSoon` and add `href`, `howto` and `shots`.

A brand-new game can carry `isNew: true` (a sparkly gold "New" badge on its
cameo) and `beta: true` (a small "Beta" chip after its kind). Take them off
when they no longer apply.

Clicking a game opens its preview (screenshots, description, how to play)
with **Open the game** and **Close**; ctrl/cmd-click still opens the game
directly.

## Cloudflare

The site deploys as a Cloudflare Workers project with static assets, connected
to this repo: every push to `main` redeploys. `wrangler.jsonc` sets the assets
folder to the repo root, and `.assetsignore` keeps `.git`, this README and the
config files out of the published site (Cloudflare rejects any single file over
25 MiB, and git's own pack files can exceed that).
