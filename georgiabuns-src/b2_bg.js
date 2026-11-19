/* ---------- richer backdrops: horizon cloud banks, hazy ridges, line-scrolled planes, foreground ----------
   Layer fields used by drawBackdrop:
     c        canvas (or frames: [c0, c1, ...] cycled for shimmer)
     fx, fy   horizontal / vertical parallax
     rows     [fxTop, fxBottom]: line scroll, each pixel row slides at its own speed (a 3D ground plane)
     base     vertical placement, fill: colour under the layer, drift: slow auto-scroll
   FG pieces are drawn in front of the world (see drawForeground in e_render.js). */

function wrapX(s, w, fn) { for (const dx of [-w, 0, w]) fn(dx); }

// a bank of big cumulus along the horizon, lit from the upper left
function cumulusBank(w, h, pal, seed, opt) {
  opt = opt || {};
  return layerFrom(w, h, pal, s => {
    srand(seed); const pts = [], n = Math.floor(w / (opt.gap || 34));
    for (let i = 0; i < n; i++) {
      const x = i * w / n + rnd() * 18, tall = (opt.tall || .55) * h * (.45 + rnd() * .55), r0 = 9 + rnd() * 11;
      for (let k = 0; k < 5; k++) { const r = r0 * (1 - k * .14); pts.push([x + (rnd() - .5) * r0 * 1.8, h - r * .55 - k * tall / 5, r]); }
    }
    pts.sort((a, b) => a[1] - b[1]);
    for (const [x, y, r] of pts) wrapX(s, w, dx => s.sphere(x + dx, y, r * 1.3, r, [4, 3, 2, 1], .08));
    for (let y = h - 4; y < h; y++) for (let x = 0; x < w; x++) if (!s.get(x, y)) s.set(x, y, 3);
  });
}

// a hazy mountain ridge; snow caps optional
function ridgeLayer(w, h, pal, seed, opt) {
  opt = opt || {};
  return layerFrom(w, h, pal, s => {
    srand(seed); const ph = [rnd() * 6, rnd() * 6, rnd() * 6], F = opt.freq || 1;
    const top = x => { const u = x / w * Math.PI * 2; return h * (opt.lo || .35) + Math.sin(u * 2 * F + ph[0]) * h * .14 + Math.sin(u * 5 * F + ph[1]) * h * .07 + Math.abs(Math.sin(u * 11 * F + ph[2])) * -h * .06; };
    for (let x = 0; x < w; x++) {
      const t = top(x), sl = top(x + 1) - top(x - 1);
      for (let y = Math.floor(t); y < h; y++) {
        const d = (y - t) / (h - t);
        let l = .55 - sl * .9 - d * .3 + (hash(x >> 2, y >> 2) - .5) * .08;
        let c = rampIdx([1, 2, 3], l, x, y);
        if (opt.snow && y < t + 5 + hash(x >> 1, 9) * 6 && t < h * .5) c = sl < 0 ? 5 : 4;
        s.set(x, y, c);
      }
    }
  });
}

// line-scrolled water: frames shift the ripple highlights (palette-cycle shimmer)
function waterFrames(w, h, pal, seed) {
  // pal: [deep, mid, light, horizon, sparkle]
  const out = [];
  for (let f = 0; f < 3; f++) out.push(layerFrom(w, h, pal, s => {
    srand(seed);
    for (let y = 0; y < h; y++) { const k = y / (h - 1); for (let x = 0; x < w; x++) s.set(x, y, rampIdx([4, 3, 2, 1], .95 - k * .9, x, y)); }
    srand(seed + 1);
    for (let i = 0; i < w * h / 26; i++) {
      const y = Math.floor(Math.pow(rnd(), .8) * h), k = y / h, x = rnd() * w, len = 2 + k * 9;
      const lit = ((i + f) % 3) === 0;
      for (let j = 0; j < len; j++) s.set((x + j) % w, y, lit ? 5 : (k < .3 ? 4 : 3));
    }
  }));
  return out;
}

// patchwork fields in perspective (farm)
function fieldsBand(w, h, seed) {
  return layerFrom(w, h, ['#88b45a', '#a8c86a', '#c8b860', '#6a9a48', '#b8905a', '#4a7a3a', '#2f5a2a', '#e8d890', '#7a6a3a'], s => {
    srand(seed); let y = 0, band = 0;
    while (y < h) {
      const k = y / h, th = Math.max(2, Math.round(2 + k * k * 18)), cols = [];
      let x = 0; while (x < w) { const fw = 30 + rnd() * 70; cols.push([x, fw, [1, 2, 3, 4, 5, 8][(rnd() * 6) | 0]]); x += fw; }
      for (const [x0, fw, c] of cols) for (let yy = y; yy < Math.min(h, y + th); yy++) for (let xx = x0; xx < Math.min(w, x0 + fw); xx++) {
        let cc = c; if ((c === 3 || c === 5) && (xx + yy * 2) % (k < .4 ? 3 : 5) === 0) cc = 9; // furrows
        if (xx === Math.floor(x0)) cc = 7; s.set(xx, yy, cc);
      }
      for (let xx = 0; xx < w; xx++) s.set(xx, y, 7); // hedgerow
      if (k > .25) for (let i = 0; i < 6; i++) { const tx = rnd() * w, r = 1 + k * 4; s.sphere(tx, y - r * .4, r * 1.2, r, [7, 6, 4]); }
      y += th; band++;
    }
  });
}

// marsh grass (spartina) with winding tidal creeks, in perspective
function marshBand(w, h, seed) {
  return layerFrom(w, h, ['#9aa85a', '#b8c070', '#7a8a48', '#d8d890', '#6aa8c8', '#9ad0e8', '#5a6a38'], s => {
    srand(seed);
    for (let y = 0; y < h; y++) { const k = y / h; for (let x = 0; x < w; x++) s.set(x, y, rampIdx([3, 1, 2, 4], .25 + (hash(x >> (k < .4 ? 1 : 2), y) - .5) * .5 + (1 - k) * .3, x, y)); }
    for (let c = 0; c < 3; c++) { let cx = rnd() * w; for (let y = 0; y < h; y++) { const k = y / h, ww = 1 + k * 7; cx += Math.sin(y * .3 + c) * (1 + k * 2); for (let x = -ww; x <= ww; x++) s.set((cx + x + w) % w, y, Math.abs(x) > ww - 1 ? 5 : 6); } }
    for (let i = 0; i < w; i++) { const x = rnd() * w, y = h * (.3 + rnd() * .7), hh = 2 + (y / h) * 6; for (let j = 0; j < hh; j++) s.set(x, y - j, j > hh - 2 ? 4 : 7); }
  });
}

// forest floor under the hedge: dappled light, leaf litter and fern clumps, darker as it nears
function floorBand(w, h, seed) {
  return layerFrom(w, h, ['#163a16', '#1e4a1e', '#2a5e24', '#3e7a2e', '#5a9a3a', '#4a3424', '#6a4a2c', '#8ac85a'], s => {
    srand(seed);
    for (let y = 0; y < h; y++) { const k = y / h; for (let x = 0; x < w; x++) { const lit = Math.sin(x * .045 + Math.sin(y * .2) * 2) * .5 + .5; s.set(x, y, rampIdx([1, 2, 3, 4], .75 - k * .55 + (lit - .5) * .35 + (hash(x >> 1, y) - .5) * .15, x, y)); } }
    for (let i = 0; i < w / 3; i++) { const x = rnd() * w, y = h * Math.pow(rnd(), .7); s.set(x, y, rnd() < .5 ? 6 : 7); }
    for (let i = 0; i < 22; i++) { const x = rnd() * w, y = h * (.15 + rnd() * .85), r = 3 + (y / h) * 9; s.sphere(x, y - r * .5, r * 1.4, r * .8, [1, 2, 3, 4]); if (rnd() < .4) s.set(x - 1, y - r, 8); }
  });
}
// snowy foothill meadow (Boulder)
function meadowBand(w, h, seed) {
  return layerFrom(w, h, ['#e8eef8', '#d0dcec', '#b8c8de', '#ffffff', '#6a5a4a', '#5a7a5a'], s => {
    srand(seed);
    for (let y = 0; y < h; y++) { const k = y / h; for (let x = 0; x < w; x++) s.set(x, y, rampIdx([3, 2, 1, 4], .5 + Math.sin(x * .02 + y * .15) * .25 + (hash(x >> 2, y >> 1) - .5) * .2, x, y)); }
    for (let f = 0; f < 3; f++) { const y = Math.floor(h * (.25 + f * .27)), step = 6 + f * 6; for (let x = 0; x < w; x++) { if (x % step === 0) for (let j = 0; j < 2 + f * 2; j++) s.set(x, y - j, 5); if (x % 2 === 0) s.set(x, y - 1 - f, 5); } }
    for (let i = 0; i < 40; i++) { const x = rnd() * w, y = h * (.2 + rnd() * .8), r = 1 + (y / h) * 3; s.cone(x, y - r * 4, y, r, [6, 6, 6]); }
  });
}

/* ---------- foreground pieces, drawn in front of the bunny ---------- */
function fgPiece(w, h, pal, fn) { const s = new Spr(w, h); fn(s); return s.canvas(palette(pal)); }
const FG_PAL = { forest: ['#06140a', '#0c2410', '#163a18', '#2c5e22', '#120c08', '#1e140e', '#30221a'],
  farm: ['#0e1e08', '#1a3010', '#2e4c1a', '#5a7a2a', '#1e140a', '#34241a', '#d89a18', '#8a5208'],
  marsh: ['#24240e', '#3a3a18', '#5e5e2a', '#9a9450', '#2a1e12', '#4a3a26', '#c8b890'],
  paris: ['#14141c', '#22222e', '#3a3a4a', '#5a5a6e', '#ffe6a0', '#ffd060', '#1a120c'],
  snow: ['#3a4658', '#5a6a80', '#8a9ab0', '#e8eef8', '#ffffff', '#1a3020', '#2a4a30'],
  garden: ['#06140a', '#0c2410', '#163a18', '#2c5e22', '#24160c', '#d89a18', '#8a5208', '#a8241e'] };
function fernSpr(seed, w, h) { return fgPiece(w, h, FG_PAL.forest, s => { srand(seed); for (let f = 0; f < 9; f++) { const a = -Math.PI / 2 + (rnd() - .5) * 2.2, L = h * (.55 + rnd() * .45); for (let t = 0; t < L; t++) { const px = w / 2 + Math.cos(a) * t + Math.sin(t * .08) * 3 * Math.sign(Math.cos(a)), py = h - 1 + Math.sin(a) * t * .95 + (t / L) * (t / L) * L * .35; s.set(px, py, t > L * .6 ? 3 : 2); s.set(px, py + 1, 1); if (t % 3 === 0) { const lf = 3 + (1 - t / L) * 5; for (let j = 1; j < lf; j++) { s.set(px - j * .7, py - j * .5, j < 2 ? 2 : 1); s.set(px + j * .7, py - j * .5, j < 2 ? 3 : 2); } } } } }); }
function tuftSpr(seed, w, h, pal, hi) { return fgPiece(w, h, pal, s => { srand(seed); for (let i = 0; i < w * .9; i++) { const x = rnd() * w, L = h * (.4 + rnd() * .6), lean = (rnd() - .5) * 8; for (let t = 0; t < L; t++) { const k = t / L; s.set(x + lean * k * k, h - 1 - t, k > .75 ? hi : k > .4 ? 2 : 1); } } }); }
function trunkSpr(seed, h) { return fgPiece(40, h, FG_PAL.forest, s => { s.cyl(8, 0, 22, h, [5, 6, 7, 6], true); srand(seed); for (let i = 0; i < 6; i++) s.sphere(10 + rnd() * 18, h * .2 + rnd() * h * .5, 6, 5, [1, 2, 3]); }); }
function buildFG(theme) {
  const P = FG_PAL[theme] || FG_PAL.forest, out = { low: [], tall: [], hang: [] };
  if (theme === 'forest' || theme === 'garden') {
    for (let i = 0; i < 3; i++) out.low.push(fernSpr(400 + i, 120, 74));
    out.low.push(tuftSpr(410, 100, 52, FG_PAL.forest, 3));
    if (theme === 'garden') { out.low.push(fgPiece(30, 90, FG_PAL.garden, s => { s.rect(14, 10, 3, 80, 5); for (let k = 0; k < 14; k++) { const a = k / 14 * 6.283; s.ell(15 + Math.cos(a) * 9, 14 + Math.sin(a) * 9, 3, 3, 6); } s.ell(15, 14, 5, 5, 7); for (let y = 30; y < 90; y += 14) { s.ell(10, y, 5, 2, 3); s.ell(21, y + 7, 5, 2, 2); } })); }
    out.tall.push(trunkSpr(420, 340)); out.tall.push(trunkSpr(421, 340));
  } else if (theme === 'farm') {
    out.low.push(tuftSpr(500, 110, 60, P, 4), tuftSpr(501, 80, 46, P, 4));
    out.low.push(fgPiece(14, 60, P, s => { s.rect(3, 6, 8, 54, 6); s.rect(3, 6, 2, 54, 7); s.rect(0, 20, 14, 3, 6); s.rect(0, 40, 14, 3, 6); }));
    out.low.push(fgPiece(34, 100, P, s => { s.rect(16, 18, 3, 82, 2); for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; s.ell(17 + Math.cos(a) * 10, 18 + Math.sin(a) * 10, 4, 3, 7); } s.ell(17, 18, 6, 6, 5); for (let y = 36; y < 100; y += 16) { s.ell(10, y, 6, 3, 3); s.ell(24, y + 8, 6, 3, 2); } }));
  } else if (theme === 'marsh') {
    out.low.push(fgPiece(90, 86, P, s => { srand(600); for (let i = 0; i < 18; i++) { const x = 6 + rnd() * 78, L = 40 + rnd() * 44, lean = (rnd() - .5) * 10; for (let t = 0; t < L; t++) { s.set(x + lean * (t / L) ** 2, 85 - t, 2); s.set(x + 1 + lean * (t / L) ** 2, 85 - t, 1); } for (let j = 0; j < 10; j++) { s.set(x + lean + (j % 2), 85 - L + j * 1.5, 4); s.set(x + lean + 1 - (j % 2), 85 - L + j * 1.5, 3); } } }));
    out.low.push(fgPiece(80, 40, P, s => { for (let x = 2; x < 80; x += 6) { const hh = 30 + (x % 12 ? 0 : 4); s.rect(x, 40 - hh, 3, hh, 5); s.rect(x, 40 - hh, 1, hh, 6); } s.rect(0, 14, 80, 1, 5); s.rect(0, 30, 80, 1, 5); }));
    out.low.push(tuftSpr(602, 100, 50, P, 4));
  } else if (theme === 'paris') {
    out.tall.push(fgPiece(24, 200, P, s => { s.rect(10, 30, 4, 170, 1); s.rect(9, 30, 1, 170, 2); s.rect(6, 190, 12, 10, 1); s.rect(4, 22, 16, 3, 1); s.tri(5, 22, 12, 6, 19, 22, 1); s.rect(7, 12, 10, 10, 5); s.rect(8, 13, 8, 8, 6); s.rect(11, 2, 2, 5, 1); }));
    out.low.push(fgPiece(90, 34, P, s => { s.rect(0, 2, 90, 3, 1); s.rect(0, 30, 90, 4, 1); for (let x = 2; x < 90; x += 7) { s.rect(x, 4, 2, 26, 1); s.ell(x + 1, 3, 2, 2, 2); } for (let x = 5; x < 90; x += 7) s.ell(x + 1, 17, 2, 5, 1); }));
    out.low.push(fgPiece(40, 30, P, s => { s.ell(20, 8, 16, 3, 2); s.rect(19, 8, 2, 22, 1); s.rect(12, 28, 16, 2, 1); s.rect(2, 10, 3, 20, 1); s.rect(2, 10, 8, 2, 1); s.rect(35, 10, 3, 20, 1); s.rect(30, 10, 8, 2, 1); }));
  } else if (theme === 'snow') {
    out.low.push(fgPiece(70, 34, P, s => { s.sphere(30, 26, 26, 14, [1, 2, 3]); s.sphere(28, 18, 22, 8, [3, 4, 5]); s.sphere(56, 28, 12, 8, [1, 2, 3]); s.sphere(55, 23, 10, 4, [4, 5, 5]); }));
    out.low.push(tuftSpr(700, 90, 44, ['#4a3a2a', '#6a5a3a', '#8a7a50', '#c8b890'], 4));
    if (0) out.hang.push(fgPiece(140, 60, P, s => { for (let b = 0; b < 3; b++) { const y0 = 6 + b * 14, x1 = 140 - b * 30; for (let x = 0; x < x1; x++) { const yy = y0 + x * .12; s.set(x, yy, 7); s.set(x, yy + 1, 7); if (x % 4 === 0) for (let j = 0; j < 8 - x / x1 * 5; j++) { s.set(x + j * .5, yy + 1 + j, 6); s.set(x - j * .5, yy + 1 + j, 6); } if (x % 3 === 0) s.set(x, yy - 1, 5); } } }));
  }
  return out;
}

// thin high streaks; line-scrolled so the top of the sky moves faster than the horizon
function cirrusLayer(w, h, pal, seed) {
  return layerFrom(w, h, pal, s => { srand(seed); for (let i = 0; i < 11; i++) { const y = 4 + rnd() * (h - 10), x = rnd() * w, len = 40 + rnd() * 70; for (let k = 0; k < 5; k++) { const ex = x + k * len / 5 + rnd() * 6, rx = len / 5 + 4 + rnd() * 6, ey = y + Math.sin(k) * 1.5; wrapX(s, w, dx => { s.ell(ex + dx, ey + 1, rx, 1.6, 2); s.ell(ex + dx - 2, ey, rx * .75, 1, 1); }); } } });
}
/* ---------- the stacks, far to near ---------- */
function buildLayers(theme) {
  if (LAYERSETS[theme]) return LAYERSETS[theme];
  const L = [];
  const cirrus = (pal, seed) => ({ c: cirrusLayer(640, 46, pal, seed), fx: .04, rows: [.06, .015], fy: .005, base: -98, drift: .05, fill: null });
  const bank = (pal, seed, base, opt) => ({ c: cumulusBank(720, 90, pal, seed, opt), fx: .03, fy: .015, base, drift: .02, fill: null });
  if (theme === 'forest') {
    const B = forestBase();
    L.push(cirrus(['#ffffff', '#cfe2f6'], 800), B[0], bank(['#ffffff', '#eef4fb', '#d2e0f0', '#b8cae2'], 801, -62, { tall: .7 }), { c: ridgeLayer(800, 90, ['#8ea6c6', '#a2b6d4', '#b6c8e2'], 802, { lo: .42 }), fx: .065, fy: .03, base: -18, fill: '#8ea6c6' }, B[1], B[2], B[3],
      { frames: waterFrames(640, 30, ['#4a8cb8', '#6aaed4', '#94cce6', '#b8e4f2', '#ffffff'], 803), fx: .2, rows: [.2, .34], fy: .1, base: 85, fill: null }, B[4], B[5], { c: floorBand(600, 64, 804), fx: .48, rows: [.48, .62], fy: .3, base: 60, fill: '#163a16' }, B[6]);
  } else if (theme === 'farm') {
    const T = THEME_LAYERS.farm();
    L.push(cirrus(['#ffffff', '#d4e4f4'], 810), T[0], bank(['#ffffff', '#f2f6fb', '#d8e4f0', '#c0d0e2'], 811, -30, { tall: .65 }), { c: ridgeLayer(800, 80, ['#94a8c4', '#a8bad2', '#bccbe0'], 812, { lo: .5, freq: .7 }), fx: .06, fy: .03, base: -8, fill: '#94a8c4' }, T[1], T[2],
      { c: fieldsBand(640, 52, 813), fx: .12, rows: [.12, .35], fy: .06, base: 56, fill: '#4a7a3a' }, T[3]);
  } else if (theme === 'marsh') {
    const T = THEME_LAYERS.marsh();
    L.push(cirrus(['#ffffff', '#d4e4f4'], 820), T[0], bank(['#ffffff', '#f4f6fa', '#dce6f0', '#c4d4e4'], 821, -22, { tall: .7, gap: 30 }), T[1], T[2],
      { frames: waterFrames(700, 50, ['#3a88b8', '#5aa0c8', '#86c4e0', '#b8e4f2', '#ffffff'], 823), fx: .1, rows: [.1, .3], fy: .05, base: 45, fill: null }, T[3], T[4]);
  } else if (theme === 'snow') {
    const T = THEME_LAYERS.snow();
    L.push(cirrus(['#ffffff', '#d8e2f0'], 830), T[0], bank(['#ffffff', '#eef2f8', '#d4dcea', '#bcc8dc'], 831, -40, { tall: .5 }), T[1], T[2], T[3],
      { c: meadowBand(640, 46, 833), fx: .18, rows: [.18, .38], fy: .09, base: 62, fill: '#b8c8de' }, T[4]);
  } else if (theme === 'paris') {
    const T = THEME_LAYERS.paris();
    L.push(cirrus(['#fffaf4', '#e8e0e8'], 840), T[0], bank(['#fffaf4', '#f6eee6', '#e2d8d4', '#cdc4cc'], 841, -30, { tall: .55 }), { c: ridgeLayer(800, 70, ['#a8a4c0', '#b8b4ce', '#c8c4da'], 842, { lo: .55, freq: .5 }), fx: .05, fy: .025, base: -6, fill: '#a8a4c0' }, T[1], T[2], T[3],
      { c: layerFrom(600, 90, ['#1e3a22', '#2a5030', '#3a6a3a', '#5a8a4a', '#3a2a20', '#5a4030'], s => { srand(845); for (let i = 0; i < 9; i++) { const x = 30 + i * 66 + rnd() * 16; s.cyl(x - 2, 50, 5, 40, [5, 6]); s.canopy(x, 34, 30, 18, 12, [1, 2, 3, 4], 846 + i); } }), fx: .45, fy: .3, base: 22, fill: null });
  } else return (LAYERSETS[theme] = THEME_LAYERS[theme]());
  return (LAYERSETS[theme] = L);
}
