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
| Blackthorn Manor | `blackthorn.html` | migrated from Claude artifact (v1.1.0) |

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

## Adding a game

Single-file games: drop the `.html` in the root. Folder builds: give them their
own folder with `index.html` inside. Then copy a `<li>` in `index.html`.
To bring back a missing book, add its file under the name above and change its
`<div class="book away">` into `<a class="book" href="...">`.
