# Nora's Library

Source for noralindsey.com. Plain static files, no build step.

Cloudflare Pages settings: build command blank, output directory `/`.
Every push to `main` redeploys the site.

## Shelf

| Game | Location | Status |
|---|---|---|
| Cat Bakery | `catbakery.html` | missing: export from Claude Design and attach |
| The Long Apprenticeship | `apprenticeship.html` | missing: export from Claude Design and attach |
| Adriatica | `adriatica.html` | missing: export from Claude Design and attach |
| Mirror of Algol | `algol.html` | missing: export from Claude Design and attach |
| Adriatica II | `adriatica2/` | migrated from Claude Design export (folder build, 19 MB) |
| Blackthorn Manor | `blackthorn.html` | migrated from Claude artifact (v1.1.0) |

Adriatica II also lives at the old subdomain adriatica2.noralindsey.com until
that is retired. Its folder build loads React and three.js from unpkg and its
fonts from Google Fonts; everything else is local. Saves go to the player's
browser storage under `adriatica-save-v2`.

Standalone Claude Design closes by December 14, 2026. Export the remaining
games before then.

## Adding a game

Single-file games: drop the `.html` in the root. Folder builds: give them their
own folder with `index.html` inside. Then copy a `<li>` in `index.html`.
To bring back a missing book, add its file under the name above and change its
`<div class="book away">` into `<a class="book" href="...">`.
