# Nora's Library

Source for noralindsey.com. Plain static files, no build step.

Cloudflare Pages settings: build command blank, output directory `/`.
Every push to `main` redeploys the site.

## Shelf

| Game | File | Status |
|---|---|---|
| Cat Bakery | `catbakery.html` | missing: original not yet recovered |
| The Long Apprenticeship | `apprenticeship.html` | missing: original not yet recovered |
| Adriatica | `adriatica.html` | missing: original not yet recovered |
| Mirror of Algol | `algol.html` | missing: original not yet recovered |
| Adriatica II | adriatica2.noralindsey.com | live on its own subdomain; source to be pulled in |
| Blackthorn Manor | `blackthorn.html` | added from Claude artifact (v1.1.0) |

## Adding a game

Drop the game's single `.html` file in the root, then copy a `<li>` in `index.html`.
To bring back a missing book, add its file under the name above and change its
`<div class="book away">` into `<a class="book" href="...">`.
