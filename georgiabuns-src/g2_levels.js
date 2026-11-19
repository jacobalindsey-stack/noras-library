/* ================= Georgia Buns — the other days ================= */

/* ---------- ground types beyond grass-and-clay ---------- */
const C3 = h => rgb(h);
const SAND = ['#f2dca8', '#e6cc94', '#d8bc84', '#c8aa72', '#b89a64'].map(C3), MUD = ['#6e5238', '#5e442c', '#4a3422', '#8a7050'].map(C3);
const COB = ['#9a9488', '#868074', '#aaa498', '#6e6a60'].map(C3), ZINC = ['#8a9aac', '#728498', '#a8b8c8', '#5a6a80'].map(C3), SOIL = ['#5a3a24', '#4a2e1c', '#6a4630', '#3a2414'].map(C3);
const ZONES = {
  4: (x, y, dd) => { if (dd < 0) return null; if (dd < 2) return SAND[0]; const q = Math.floor((y + Math.sin(x * .03) * 3) / 6); let c = SAND[1 + (q & 1) + (dd > 40 ? 1 : 0)]; if (hash(x, y) < .02) c = C3('#ffffff'); else if (hash(x, y) < .035) c = SAND[4]; return c; },
  5: (x, y, dd) => { if (dd < 0) { const cl = hash(x >> 2, 9); if (cl < .45 && -dd <= 2 + (hash(x, 3) * 7 | 0)) return hash(x, y) < .5 ? C3('#9ab050') : C3('#c8b860'); return null; } if (dd < 2) return (hash(x, 5) < .3) ? C3('#9aa8b0') : MUD[3]; let c = MUD[dd > 30 ? 2 : (hash(x >> 2, y >> 1) < .4 ? 1 : 0)]; if (dd < 6 && hash(x, y) < .08) c = C3('#a89070'); return c; },
  7: (x, y, dd) => { if (dd < 0) return null; if (dd < 2) return COB[2]; const row = Math.floor(dd / 6), off = row & 1 ? 4 : 0, cx = ((x + off) % 8 + 8) % 8, cy = dd % 6; if (cx === 0 || cy === 0) return COB[3]; return COB[(hash((x + off) >> 3, row) * 3) | 0]; },
  8: (x, y, dd) => { if (dd < 0) return null; if (dd < 3) return ZINC[dd === 0 ? 2 : 0]; if (dd < 24) return (x % 10 === 0) ? ZINC[3] : ZINC[1 - ((dd >> 2) & 1) + 1 - 1]; const by = Math.floor((dd - 24) / 5), bx = ((x + (by & 1) * 6) % 12 + 12) % 12; if ((dd - 24) % 5 === 0 || bx === 0) return C3('#5a4a44'); return C3(hash(x >> 2, by) < .5 ? '#e8dcc0' : '#d8ccb0'); },
  9: (x, y, dd) => { if (dd < 0) { if ((x % 22) > 9 && (x % 22) < 13 && -dd <= 4) return -dd === 4 ? C3('#7ad050') : C3('#3fb04a'); return null; } if (dd < 2) return SOIL[2]; if (dd < 40) { let c = SOIL[(hash(x >> 1, y >> 1) * 2) | 0]; if (hash(x, y) < .02) c = C3('#8a6a4a'); return c; } const q = y + Math.sin(x * .021) * 3; return CLAY[((Math.floor(q / 7) % 5) + 5) % 5]; },
  10: (x, y, dd) => { if (dd < 0) return null; if (dd < 2) return C3('#f4f0e8'); const t = ((x >> 4) + (dd >> 4)) & 1; return C3(t ? '#d8d4cc' : '#c4c0b6'); },
  11: (x, y, dd) => { if (dd < 0) return null; if (dd < 2) return C3('#ffffff'); const t = ((x >> 4) + (dd >> 4)) % 4; return C3(['#ff4fa0', '#4fe0ff', '#f6c645', '#a060ff'][(t + 4) % 4]); },
  13: (x, y, dd) => { if (dd < 0) return null; if (dd < 2) return C3('#ffffff'); if (dd < 26) { const b = ((dd + (Math.sin(x * .05) * 3 | 0)) >> 3) & 1; let c = C3(dd < 6 ? '#eef4fc' : b ? '#dfe9f5' : '#d2e0f0'); if (hash(x, y) < .03) c = C3('#ffffff'); if (dd > 20) c = mixRGB(c, [150, 170, 200], (dd - 20) / 8); return c; } const q = Math.floor((y + Math.sin(x * .02) * 4) / 9); let c = C3(['#7a6e72', '#8a7e80', '#6a5e62', '#94888a'][(q % 4 + 4) % 4]); if (hash(x, y) < .02) c = C3('#c4b8b4'); return c; },
  14: (x, y, dd) => { if (dd < 0) return null; if (dd < 2) return C3('#f4fcff'); if (dd < 4) return C3('#bfe8ff'); if (dd < 30) { let c = C3(hash(x >> 3, dd >> 2) < .5 ? '#9ad0f0' : '#8ac4e8'); if ((x + dd * 2) % 23 === 0) c = C3('#e8f8ff'); return c; } return ZONES[13](x, y, dd + 26); },
  15: (x, y, dd) => { if (dd < 0) { if (-dd <= 2 && hash(x >> 1, 21) < .25) return C3(hash(x, 4) < .5 ? '#b8a060' : '#d8c080'); return null; } if (dd < 2) return C3('#d8b88a'); if (dd < 6) return C3(hash(x, y) < .3 ? '#b8946a' : '#c8a47a'); const slab = Math.floor((y + x * .35) / 11), pos = ((Math.floor(y + x * .35) % 11) + 11) % 11; let c = C3(['#b8603e', '#a8543a', '#c46e48', '#9a4a32'][(slab % 4 + 4) % 4]); if (pos === 0) c = mixRGB(c, [255, 200, 160], .3); else if (pos === 10) c = mixRGB(c, [60, 20, 10], .35); if (hash(x >> 2, y >> 2) < .05) c = C3('#6a2a1a'); return c; },
  12: (x, y, dd) => { if (dd < 0) return null; if (dd < 2) return C3('#5a5a60'); if (dd === 2 || dd === 3) return (x % 24 < 12) ? C3('#f6c645') : C3('#3a3a40'); return C3(hash(x >> 1, y >> 1) < .5 ? '#3a3a40' : '#34343a'); }
};

/* ---------- parallax sets for the new places ---------- */
function layerFrom(w, h, pal, fn) { const s = new Spr(w, h); fn(s); const c = mkC(w, h); c.getContext('2d').drawImage(s.canvas(palette(pal)), 0, 0); return c; }
const THEME_LAYERS = {
  farm: () => { const F = forestBase(); return [F[0], F[1],
    { c: layerFrom(640, 130, ['#7aa86a', '#5f9058', '#9cc47e', '#e8e0d0', '#c8302a', '#8a8a8a', '#3a6a3a'], s => { for (let x = 0; x < 640; x++) { const h = 70 + Math.sin(x / 640 * Math.PI * 4) * 14 + Math.sin(x / 640 * Math.PI * 10) * 4; for (let y = Math.floor(h); y < 130; y++) s.set(x, y, y < h + 2 ? 3 : 1); }
      s.rect(120, 52, 22, 30, 5); s.tri(118, 52, 131, 40, 144, 52, 5); s.rect(126, 64, 10, 18, 4); s.rect(400, 30, 10, 50, 6); s.ell(405, 30, 5, 3, 6); for (let i = 0; i < 30; i++) s.ell(rnd() * 640, 78 + rnd() * 6, 6, 5, 7); }), fx: .12, fy: .06, base: 0, fill: '#5f9058' },
    { c: layerFrom(560, 120, ['#2a5222', '#3a6a2e', '#4a7a3a', '#6a9a4a', '#88b860', '#3a2618', '#5a3a26'], s => { srand(77); for (let i = 0; i < 8; i++) { const x = rnd() * 560; s.cyl(x - 3, 68, 6, 52, [6, 7]); s.canopy(x, 54, 30, 20, 12, [1, 2, 3, 4, 5], 70 + i); } s.rect(0, 112, 560, 8, 2); }), fx: .35, fy: .2, base: 40, fill: '#3a6a2e' }]; },
  marsh: () => { const F = forestBase(); return [F[0], F[1],
    { c: layerFrom(700, 120, ['#7cc0dc', '#5aa0c8', '#b8e4f2', '#2a2a30', '#ffffff', '#8a9aa8', '#c8ced8'], s => { for (let y = 70; y < 120; y++) for (let x = 0; x < 700; x++) s.set(x, y, y === 70 ? 3 : hash(x >> 3, y) < .06 ? 3 : 1); s.tri(300, 70, 308, 18, 316, 70, 4); s.tri(303, 70, 308, 26, 313, 70, 5); s.rect(305, 14, 6, 6, 4); s.rect(306, 12, 4, 2, 3); for (let x = 470; x < 640; x++) s.set(x, 58 + Math.round(Math.abs(Math.sin((x - 470) / 170 * Math.PI)) * -12) + 12, 6); for (const x of [520, 590]) { s.tri(x - 6, 70, x, 30, x + 6, 70, 7); } }), fx: .1, fy: .05, base: 10, fill: '#5aa0c8' },
    { c: layerFrom(600, 70, ['#b8b060', '#9a9a48', '#d8d080', '#6aa8c8'], s => { srand(91); for (let x = 0; x < 600; x++) { const h = 30 + (hash(x >> 2, 1) * 8 | 0); for (let y = h; y < 70; y++) s.set(x, y, hash(x, y >> 1) < .5 ? 1 : 2); if (hash(x, 2) < .3) s.set(x, h - 1, 3); } for (let i = 0; i < 6; i++) { const x = rnd() * 560, w = 30 + rnd() * 40; for (let y = 48; y < 54; y++) for (let k = 0; k < w; k++) s.set(x + k, y, 4); } }), fx: .3, fy: .18, base: 50, fill: '#9a9a48' },
    { c: layerFrom(720, 200, ['#5a4a32', '#3f8a32', '#2c6a24', '#6cbc4a'], s => { srand(93); for (let i = 0; i < 5; i++) { const x = 40 + i * 140 + rnd() * 50, h = 110 + rnd() * 60; for (let y = 200 - h; y < 200; y++) { s.set(x, y, 1); s.set(x + 1, y, 1); s.set(x + 2, y, (y % 6 < 2) ? 1 : 1); } for (let k = 0; k < 9; k++) { const a = -Math.PI + k * .39; for (let r = 0; r < 26; r++) s.set(x + 1 + Math.cos(a) * r, 200 - h + Math.sin(a) * r * .5 + r * r * .02, r > 20 ? 4 : (k % 2 ? 2 : 3)); } } }), fx: .55, fy: .4, base: 20, fill: null }]; },
  snow: () => { const F = forestBase(); return [F[0], F[1],
    { c: layerFrom(700, 140, ['#8a9ab8', '#a8b8d0', '#c8d4e8', '#ffffff', '#6a7a98', '#e8eef8'], s => { srand(131); for (let i = 0; i < 9; i++) { const x = i * 80 + rnd() * 40, h = 70 + rnd() * 60, w = 70 + rnd() * 50; s.cone(x, 140 - h, 140, w, [5, 1, 2, 3]); for (let y = 140 - h; y < 140 - h + h * .32; y++) { const k = (y - (140 - h)) / h, ww = w * k; for (let xx = -ww; xx <= ww; xx++) if (hash(Math.round(x + xx), y) < .85 - k) s.set(x + xx, y, xx < 0 ? 4 : 6); } } }), fx: .08, fy: .04, base: -10, fill: '#8a9ab8' },
    { c: layerFrom(640, 130, ['#8a4a32', '#a85e40', '#c47a56', '#6a3424', '#ffffff', '#3a5a3a', '#4a7048'], s => { for (let i = 0; i < 5; i++) { const x0 = 40 + i * 120, top = 20 + (i % 2) * 18; for (let y = top; y < 130; y++) { const k = (y - top) / (130 - top), x1 = x0 + k * 34, x2 = x0 + 46 + k * 52; for (let x = x1; x < x2; x++) { const u = (x - x1) / (x2 - x1); s.set(x, y, u < .25 ? 3 : u > .8 ? 4 : (hash(Math.round(x) >> 1, y >> 3) < .2 ? 1 : 2)); if (hash(Math.round(x), y) < .05 && y > top + 6) s.set(x, y, 5); } } } for (let x = 0; x < 640; x++) for (let y = 112; y < 130; y++) s.set(x, y, hash(x >> 3, y >> 2) < .5 ? 6 : 7); }), fx: .18, fy: .09, base: 20, fill: '#3a5a3a' },
    { c: layerFrom(560, 170, ['#173c26', '#22583a', '#2f704a', '#4a9060', '#ffffff', '#dfeaf6', '#2a1e18'], s => { srand(133); const tr = []; for (let i = 0; i < 16; i++) tr.push([rnd() * 560, 80 + rnd() * 70, 15 + rnd() * 9]); tr.sort((a, b) => a[1] - b[1]); for (const [x, h, w] of tr) { s.cyl(x - 2, 150, 4, 20, [7, 7]); for (let k = 0; k < 6; k++) { const yy = 170 - h + k * h / 7, top = yy - 6, bot = yy + h / 5, hw = w * (.38 + k * .13); s.cone(x, top, bot, hw, [1, 2, 3, 4]); for (let xx = -hw; xx <= hw; xx++) if (hash(Math.round(x + xx), k) < .7) s.set(x + xx, bot - 1, xx < 0 ? 5 : 6); } } for (let y = 156; y < 170; y++) for (let x = 0; x < 560; x++) if (hash(x >> 1, y) < .5 + (y - 156) * .04) s.set(x, y, 1); }), fx: .38, fy: .22, base: 60, fill: '#173c26', pines: true }]; },
  paris: () => { const F = forestBase(); return [F[0], F[1],
    { c: layerFrom(700, 140, ['#8d9ccb', '#a9b6de', '#7a88b8', '#c8d0f0', '#6a78a8'], s => { srand(101); let x = 0; while (x < 700) { const w = 18 + rnd() * 26 | 0, h = 26 + rnd() * 30 | 0; s.rect(x, 140 - h, w, h, 1); s.rect(x, 140 - h, w, 3, 3); x += w; }
      const ex = 360; for (let y = 10; y < 140; y++) { const k = (y - 10) / 130, hw = 2 + Math.pow(k, 2.2) * 34; for (let i = -hw; i <= hw; i++) if (Math.abs(i) > hw - 3 || y % 9 < 1 || (y > 95 && Math.abs(i) > hw * .55 && y < 120)) s.set(ex + i, y, 5); } s.rect(ex - 9, 92, 18, 3, 5); s.rect(ex - 5, 58, 10, 2, 5); s.rect(ex - 1, 2, 2, 8, 5);
      s.ell(560, 100, 22, 18, 3); s.rect(556, 70, 8, 12, 3); s.ell(560, 70, 4, 6, 3); }), fx: .1, fy: .05, base: 0, fill: '#7a88b8' },
    { c: layerFrom(640, 150, ['#e8dcc0', '#d0c4a8', '#5a6a80', '#728498', '#3a3040', '#2a2a34', '#ffd890'], s => { srand(103); let x = 0; while (x < 640) { const w = 60 + rnd() * 40 | 0, h = 80 + rnd() * 30 | 0, top = 150 - h; s.rect(x, top, w - 2, h, 1); s.rect(x, top, w - 2, 2, 2); s.rect(x - 2, top - 18, w + 2, 18, 3); s.rect(x - 2, top - 18, w + 2, 3, 4);
      for (let wx = x + 6; wx < x + w - 10; wx += 12) { s.rect(wx, top - 13, 6, 8, 2); for (let wy = top + 8; wy < 140; wy += 18) { s.rect(wx, wy, 6, 11, rnd() < .25 ? 7 : 5); s.rect(wx - 1, wy + 11, 8, 2, 6); } } x += w + 2; } }), fx: .32, fy: .2, base: 25, fill: '#d0c4a8' }]; }
};

let PEACHTREE = null;
function peachTree() { if (PEACHTREE) return PEACHTREE; const s = new Spr(120, 86); s.canopy(60, 40, 56, 30, 34, [1, 2, 3, 4, 5], 12); for (let x = 14; x < 106; x++) for (let k = 0; k < 5; k++) s.set(x, 76 + k, rampIdx([6, 7, 8], .7 - k * .15, x, 76 + k)); srand(5); for (let i = 0; i < 16; i++) s.sphere(14 + rnd() * 92, 20 + rnd() * 46, 2.6, 2.6, [9, 10, 11]); return (PEACHTREE = s.outline(12).canvas(palette(['#1e4a1a', '#2f6e26', '#47922f', '#69b844', '#9ade6a', '#3a2416', '#5a3a26', '#7a5236', '#d0602a', '#ff9a40', '#ffd090', '#14260e']))); }
/* ---------- helpers to place things ---------- */
function newL() { return { carrots: [], boulders: [], springs: [], rocks: [], cousins: [], tokens: [], ferns: [], decor: [], golds: [], cameos: [] }; }
function kit(L) {
  const C = (x, y, r) => L.carrots.push({ x, y, got: false, respawn: r || 0, t: 0 });
  return {
    C, line: (x0, x1, st, up = 18) => { for (let x = x0; x <= x1; x += st) C(x, groundY(x) - up); },
    arc: (x0, x1, n, pk) => { for (let i = 0; i < n; i++) { const t = n === 1 ? .5 : i / (n - 1), x = lerp(x0, x1, t); C(x, groundY(x) - 18 - Math.sin(t * Math.PI) * pk); } },
    onPlat: (pi, x0, x1, st) => { for (let x = x0; x <= x1; x += st) C(x, platY(PLATS[pi], x) - 16); },
    loopRing: () => { if (LOOP) for (let i = 1; i < 12; i++) { const t = i / 12 * Math.PI * 2; C(LOOP.cx + (LOOP.R - 16) * Math.sin(t), LOOP.cy + (LOOP.R - 16) * Math.cos(t)); } },
    rock: (x, r) => L.boulders.push({ x, y: groundY(x) - r + 4, r, broken: false }),
    spring: x => L.springs.push({ x, y: groundY(x), t: 0 }),
    item: (id, x, y) => L.rocks.push({ id, x, y, got: false, shown: true }),
    cuz: (x, y, fur) => L.cousins.push({ x, y, fur, woke: false, t: 0 }),
    token: (x, y) => L.tokens.push({ x, y, got: false }),
    gold: (x, y) => L.golds.push({ x, y, got: false }),
    cameo: (k, x, y, r) => L.cameos.push({ k, x, y, r, h: 40 }),
    decor: (x0, x1, kinds, seed) => { srand(seed || 5); for (let x = x0; x < x1; x += 18 + rnd() * 36) { if (L.springs.some(s => Math.abs(s.x - x) < 24) || L.boulders.some(b => Math.abs(b.x - x) < b.r + 6)) continue; if (x > WATER.x0 - 30 && x < WATER.x1 + 10) continue; L.decor.push({ x, k: kinds[(rnd() * kinds.length) | 0] }); } },
    ferns: (x0, x1, seed) => { srand(seed || 7); for (let x = x0; x < x1; x += 90 + rnd() * 160) L.ferns.push({ x, k: (rnd() * 3) | 0 }); }
  };
}
function markGolds(L, id) { const rec = (SAVE.days[id] || {}).gold || []; L.golds.forEach((g2, i) => { g2.was = !!rec[i]; }); }
function actorAt(S, k) { return S.actors.find(a => a.k === k); }
function near(p, a, dx, dy) { const [cx, cy] = bodyC(p); return Math.abs(cx - a.x) < dx && Math.abs(cy - (a.y - (a.h || 30) / 2)) < dy; }
function bounceOff(p, vy, msg) { airborne(p, p.ground ? p.gsp * Math.cos(p.ang) : p.vx, vy); p.ball = false; p.spring = 26; p.jumping = false; sfx('spring'); if (msg) popText(p.x, p.y - 44, msg); }
function propCanvas(w, h, fn) { const c = mkC(w, h), x = c.getContext('2d'); fn(x, (X, Y, W, H, col) => { x.fillStyle = col; x.fillRect(X, Y, W, H); }); return c; }

/* ---------- Day 1 extras: secrets ---------- */
LEVELS.creek.burrow = true;
LEVELS.creek.objects = () => { const L = creekObjects(); L.golds = []; L.cameos = []; const K = kit(L);
  K.gold(842, 86); K.gold(7290, groundY(7290) - 12); K.gold(5066, 208);
  K.cameo('flamingo', 905, 300); K.cameo('wick', 3012, groundY(3012)); K.cameo('sphinx', 6610, groundY(6610));
  return L; };

/* =====================================================================
   DAY 2 — COUNTRY COUSIN: Elli's farm, Washington, GA
   ===================================================================== */
LEVELS.farm = { id: 'farm', day: 2, title: 'COUNTRY COUSIN', want: 'NEED THE SWEETEST PEACH IN GEORGIA. DEXTER KNOWS WHERE.', theme: 'farm', ww: 7600, start: 420, goal: 6560,
  gpts: [[-200, 300], [0, 300], [650, 300], [850, 288], [1050, 306], [1250, 292], [1450, 318], [1650, 350], [2400, 350], [2780, 350], [2840, 362], [2890, 404], [3270, 404], [3320, 362], [3380, 350],
    [3700, 340], [3900, 330], [4150, 300], [4400, 336], [4650, 300], [4900, 345], [5150, 320], [5300, 320], [5900, 320], [6150, 300], [6400, 292], [7600, 292]],
  water: { x0: 2850, x1: 3310, y: 384 }, loop: { cx: 2100, cy: 350 - 56, R: 56 },
  plats: [{ pts: [[2470, 262], [2730, 262]], kind: 'loft' }, { pts: [[2440, 226], [2600, 178], [2760, 226]], kind: 'roof' }, { pts: [[2850, 372], [2970, 372]], kind: 'log' },
    { pts: [[5420, 236], [5500, 236]], kind: 'branch' }, { pts: [[5640, 226], [5720, 226]], kind: 'branch' }, { pts: [[5860, 232], [5940, 232]], kind: 'branch' }],
  zone: x => (x > 2870 && x < 3290) ? 3 : (x > 2830 && x < 3330) ? 2 : (x < 1650 || x > 5250) ? 0 : 1,
  music: x => 'dexter', item: 'peach', itemLines: ['ONE PEACH.', 'TWO PEACHES. SMELLS LIKE JULY.', 'THREE! THE SWEETEST IN GEORGIA.'],
  finale: 'goal', cook: 'farm', cookSong: 'dexter', meter: '#ffb347', scoreName: 'SCORE', leaves: 1, guests: ['dexter'],
  endLine: 'MISS ELLI! WE BROUGHT PEACHES!',
  objects: () => { const L = newL(), K = kit(L);
    K.line(520, 640, 24); K.arc(850, 980, 5, 40); K.line(1080, 1260, 30); K.arc(1300, 1420, 4, 30); K.line(1700, 1960, 26); K.loopRing(); K.line(2200, 2380, 30);
    K.onPlat(0, 2490, 2560, 22); K.onPlat(1, 2470, 2580, 26); K.line(3380, 3560, 30); K.line(3720, 5200, 38); K.arc(4100, 4200, 4, 60); K.arc(4600, 4700, 4, 60);
    K.onPlat(3, 5430, 5490, 20); K.onPlat(5, 5870, 5930, 20); K.line(5980, 6380, 28);
    [[1100, 13], [1560, 12], [4050, 11], [4500, 11], [4800, 11], [5060, 11], [6200, 14]].forEach(([x, r]) => K.rock(x, r));
    [1480, 2420, 2800, 5380, 5600, 5820, 6180].forEach(K.spring);
    K.item(0, 2650, 254); K.item(1, 2955, 364); K.item(2, 5690, 218);
    K.cuz(1380, groundY(1380), 'white'); K.cuz(2715, 262, 'smoke'); K.cuz(4650, groundY(4650), 'honey'); K.cuz(6020, groundY(6020), 'ginger');
    K.token(1900, groundY(1900) - 34);
    K.gold(2600, 160); K.gold(2905, 396); K.gold(6236, 108);
    K.cameo('peachstand', 300, 300, 30); K.cameo('pumpkin', 1590, groundY(1590)); K.cameo('tractor', 3980, groundY(3980), 30);
    K.decor(80, 1640, ['daisy', 'butter', 'clover', 'clover'], 21); K.decor(3360, 7400, ['daisy', 'clover', 'stone', 'butter'], 22);
    return L; },
  init: S => { S.actors = [
    { k: 'cow', x: 920, y: groundY(920), h: 30, sq: 0 }, { k: 'cow', x: 1190, y: groundY(1190), h: 30, sq: 0, f: -1 },
    ...[0, 1, 2, 3, 4, 5].map(i => ({ k: 'chick', x: 1720 + i * 46, y: 350, h: 12, vx: 0, ph: i })),
    { k: 'dexter', x: 2580, y: 350, h: 36, woke: false }, { k: 'hog', x: 3480, y: groundY(3480), h: 18 },
    { k: 'seven', x: 3660, y: groundY(3660), h: 46, state: 'wait' }, { k: 'elli', x: 6660, y: 292, h: 44 }]; S.ride = 0; },
  step: (S, p) => {
    for (const a of S.actors) {
      if (a.k === 'cow') { if (a.sq > 0) a.sq--; if (!p.ground && p.vy > 0 && Math.abs(p.x - a.x) < 26 && p.y > a.y - 34 && p.y < a.y - 18) { p.y = a.y - 30; bounceOff(p, -8.6, 'MOO!'); a.sq = 10; } }
      if (a.k === 'chick') { const d = a.x - p.x; if (Math.abs(d) < 60 && Math.abs(p.y - a.y) < 40) { a.vx = sgn(d || 1) * 3; a.fly = 16; if (S.t % 6 === 0) part({ type: 'chip', x: a.x, y: a.y - 6, vx: (Math.random() - .5) * 2, vy: -1, g: .05, life: 40, col: '#ffffff' }); } a.x += a.vx; a.vx *= .9; if (a.fly > 0) a.fly--; a.x = clamp(a.x, 1680, 2060); a.y = groundY(a.x); }
      if (a.k === 'dexter' && !a.woke && near(p, a, 30, 30)) { a.woke = true; sfx('wake'); say(a, 'CITY COUSINS?! IN MY BARN?! ...PEACHES ARE PAST THE POND. ASK SEVEN.', 260); }
      if (a.k === 'hog' && near(p, a, 26, 20) && !a.said) { a.said = 1; say(a, 'OINK. (HE SAYS HI.)', 100); }
      if (a.k === 'elli' && !a.said && p.x > 6200) { a.said = 1; say(a, 'WELL HEY, Y\'ALL! COME ON UP TO THE PORCH!', 200); }
      if (a.k === 'seven') {
        if (a.state === 'wait' && near(p, a, 30, 44)) { a.state = 'ride'; S.ride = 1; sfx('crew'); say('hero', 'GIDDY UP, SEVEN!', 120); popText(p.x, p.y - 60, 'RIDING SEVEN!', '#f6c645'); }
        if (a.state === 'ride') { a.x = p.x; a.y = p.y; if (p.x > 5230) { a.state = 'done'; S.ride = 0; a.x = 5230; a.y = groundY(5230); airborne(p, 4, -6); say('hero', 'SEVEN DON\'T DO ORCHARDS. THANKS, SEVEN!', 140); } }
      }
    }
    if (S.ride) { p.ball = false; p.tumble = 0; if (p.ground) { p.gsp = Math.max(p.gsp, 8.6); p.roll = false; for (const b of S.L.boulders) if (!b.broken && b.x > p.x && b.x - p.x < 70 && p.ground) { IN.jumpP = true; } } p.face = 1; }
  },
  drawBack: (g, vis) => {
    if (vis(250, 80)) { g.fillStyle = '#5a3a22'; g.fillRect(190, 252, 4, 48); g.fillRect(306, 252, 4, 48); g.fillStyle = '#2a140c'; g.fillRect(186, 244, 128, 22); g.fillStyle = '#c89a6a'; g.fillRect(188, 246, 124, 18); drawText(g, 'ELLI\'S FARM', 196, 248, '#3a1e10'); drawText(g, 'WASHINGTON GA', 196, 256, '#7a4a2a'); }
    g.fillStyle = '#8a6a4a'; for (let x = 620; x < 1650; x += 40) if (vis(x)) { const y = groundY(x); g.fillRect(x, y - 22, 3, 22); if (x + 40 < 1650) { g.fillRect(x, y - 18, 40, 2); g.fillRect(x, y - 9, 40, 2); } }
    if (vis(2600, 220)) { const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
      for (let x = 2440; x <= 2760; x++) { const top = x < 2600 ? lerp(226, 178, (x - 2440) / 160) : lerp(178, 226, (x - 2600) / 160); R(x, top, 1, 8, (x % 6) ? '#5a2a20' : '#3a1a14'); R(x, top, 1, 2, '#e8dcc0'); }
      R(2450, 232, 300, 118, '#3a1c14'); R(2450, 232, 300, 118, '#4a2418'); R(2446, 226, 8, 124, '#b8302a'); R(2746, 226, 8, 124, '#b8302a'); R(2446, 226, 8, 124, '#b8302a');
      R(2454, 262, 292, 6, '#8a5a3a'); R(2454, 262, 292, 2, '#c89a6a');
      for (let i = 0; i < 5; i++) { R(2470 + i * 22, 244, 18, 18, '#d8b050'); R(2470 + i * 22, 244, 18, 2, '#f0d070'); }
      R(2520, 336, 120, 14, '#c8913a'); for (let i = 0; i < 30; i++) R(2522 + i * 4, 332 + (i % 3), 3, 2, '#e8b85e');
      R(2446, 342, 308, 8, '#b8302a'); R(2585, 190, 30, 22, '#e8dcc0'); R(2588, 193, 24, 16, '#2a140c'); R(2599, 193, 2, 16, '#e8dcc0'); R(2588, 200, 24, 2, '#e8dcc0'); }
    for (const tx of [5460, 5680, 5900]) if (vis(tx, 120)) { const tr = peachTree(); g.drawImage(tr, tx - 60, 236 - 76); g.fillStyle = '#5a3a26'; g.fillRect(tx - 5, 241, 10, groundY(tx) - 241); }
    if (vis(6236, 80)) { g.fillStyle = '#8a8478'; g.fillRect(6233, 130, 6, groundY(6236) - 130); for (let a = 0; a < 6; a++) { const ang = a * 1.047 + S.t * .03; g.fillStyle = '#d8d0c0'; for (let r = 4; r < 26; r++) g.fillRect(Math.round(6236 + Math.cos(ang) * r), Math.round(126 + Math.sin(ang) * r), 2, 2); } }
    if (vis(6700, 260)) { const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); }; R(6480, 170, 360, 122, '#f4f0e6'); for (let y = 176; y < 292; y += 6) R(6480, y, 360, 1, '#d8d0c0'); R(6460, 150, 400, 24, '#4a4a58'); R(6450, 230, 420, 6, '#e8e0d0'); for (const x of [6500, 6580, 6740, 6820]) R(x, 236, 8, 56, '#ffffff'); R(6640, 240, 36, 52, '#2e5a3a'); for (const x of [6520, 6760]) { R(x, 186, 40, 34, '#3a3a48'); R(x + 3, 189, 34, 28, '#ffe0a0'); } R(6690, 270, 30, 6, '#8a5a3a'); R(6700, 258, 10, 12, '#d8a020'); }
  },
  drawActors: (g, vis) => {
    for (const a of S.actors) { if (!vis(a.x, 80)) continue;
      if (a.k === 'cow') g.drawImage(A.cow[a.sq > 0 ? 1 : 0], Math.round(a.x - 30), Math.round(a.y - 38));
      else if (a.k === 'chick') g.drawImage(A.chick[(a.fly > 0 && (S.t & 2)) ? 1 : 0], Math.round(a.x - 7), Math.round(a.y - 13 - (a.fly > 0 ? 4 : 0)));
      else if (a.k === 'dexter') drawSpr(a.woke ? A.dexter.idle[(S.t % 200 > 190) ? 1 : 0] : A.dexter.sleep[0], a.x, a.y, 0, -1, BAX, BAY);
      else if (a.k === 'hog') g.drawImage(A.hog[(S.t >> 5) & 1], Math.round(a.x - 18), Math.round(a.y - 21));
      else if (a.k === 'elli') g.drawImage(A.elli[(S.t >> 4) & 1], Math.round(a.x - 14), Math.round(a.y - 46));
      else if (a.k === 'seven') { if (a.state === 'ride') { const fr = A.seven.run[(S.t >> 2) & 3]; drawSpr(fr, a.x, a.y + 2, Math.abs(S.pl.ang) > .3 ? S.pl.ang : 0, 1, 34, 52); } else drawSpr(A.seven.stand[0], a.x, a.y + 2, 0, a.state === 'done' ? -1 : 1, 34, 52); } }
  },
  camY: (ty, p) => S.ride ? ty - 14 : ty,
  onGoal: S => { const e = actorAt(S, 'elli'); say(e, 'PEACHES! I\'LL MAKE A COBBLER. Y\'ALL STAY FOR SUPPER.', 170); setTimeout(() => S && say('hero', 'DEXTER, YOUR LIFE IS SO CUSHY.', 120), 1400); }
};

/* =====================================================================
   DAY 4 — MARSH BUNS: Sullivan's Island, SC
   ===================================================================== */
LEVELS.marsh = { id: 'marsh', day: 4, title: 'MARSH BUNS', want: 'GOTTA LEARN TO WALK LIKE A CAT. PONTOON CAN TEACH ME.', theme: 'marsh', ww: 7400, start: 380, goal: 6380,
  gpts: [[-200, 300], [0, 300], [700, 300], [820, 318], [1000, 350], [1500, 352], [2000, 352], [2300, 348], [2600, 354], [3000, 350], [3300, 330], [3500, 310], [4600, 300],
    [4800, 282], [5000, 232], [5200, 300], [5400, 222], [5600, 300], [5800, 244], [6000, 310], [6200, 322], [6700, 334], [6800, 372], [7400, 382]],
  water: { x0: 6810, x1: 7400, y: 362 }, loop: { cx: 1750, cy: 352 - 56, R: 56 },
  plats: [{ pts: [[1040, 318], [1420, 318]], kind: 'board' }, { pts: [[2100, 316], [2600, 316]], kind: 'board' }, { pts: [[2700, 300], [3200, 300]], kind: 'board' }, { pts: [[4040, 236], [4260, 236]], kind: 'deck' }],
  zone: x => x < 820 ? 12 : x < 3320 ? 5 : x < 6790 ? 4 : 3,
  slick: x => x > 900 && x < 3300, noStones: x => x < 3400,
  music: x => 'marsh', item: 'sand', itemLines: ['A SAND DOLLAR.', 'TWO SAND DOLLARS. RICH.', 'THREE! THAT\'S A WHOLE BEACH FORTUNE.'],
  finale: 'goal', cook: 'marsh', cookSong: 'marsh', meter: '#f2dca8', scoreName: 'SCORE', guests: ['pontoon'],
  objects: () => { const L = newL(), K = kit(L);
    K.line(500, 760, 26); K.line(900, 1000, 25); K.onPlat(0, 1060, 1400, 30); K.line(1500, 1600, 25); K.loopRing(); K.line(1880, 2060, 30); K.onPlat(1, 2120, 2560, 32); K.onPlat(2, 2720, 3180, 32);
    K.line(3400, 4000, 34); K.onPlat(3, 4060, 4240, 24); K.line(4300, 4700, 30); K.arc(4900, 5100, 6, 40); K.arc(5300, 5500, 6, 40); K.arc(5700, 5900, 6, 40); K.line(6000, 6300, 30);
    [[1250, 11], [2380, 12], [2950, 11], [6110, 14]].forEach(([x, r]) => K.rock(x, r));
    [3820, 3960, 5960].forEach(K.spring);
    K.item(0, 2560, 306); K.item(1, 4150, 228); K.item(2, 5400, 204);
    K.cuz(1300, 318, 'white'); K.cuz(3700, groundY(3700), 'dark'); K.cuz(5000, groundY(5000), 'honey'); K.cuz(6240, groundY(6240), 'smoke');
    K.token(4700, groundY(4700) - 36);
    K.gold(1200, 340); K.gold(4150, 176); K.gold(5000, 150);
    K.cameo('volvo', 600, 300, 34); K.cameo('luna', 4110, 236); K.cameo('biscuit', 6150, groundY(6150), 30);
    K.decor(3400, 4600, ['cattail', 'stone', 'clover'], 41); K.decor(4640, 6780, ['cattail', 'stone'], 42);
    return L; },
  init: S => { S.actors = [...[1150, 1460, 2250, 2850, 3100].map((x, i) => ({ k: 'crab', x, x0: x, y: groundY(x), h: 10, ph: i * 2 })), { k: 'pontoon', x: 6440, y: groundY(6440), h: 40 }, ...[0, 1].map(i => ({ k: 'pelican', x: 900 + i * 2400, y: 160 + i * 20 }))]; },
  step: (S, p) => {
    for (const a of S.actors) {
      if (a.k === 'crab') { a.ph += .04; a.x = a.x0 + Math.sin(a.ph) * 26; a.y = groundY(a.x); if (near(p, a, 18, 16) && p.inv === 0) { const [vx] = curVel(p); airborne(p, vx * .9, -4.2); p.tumble = 16; p.inv = 50; p.ball = true; sfx('bonk'); popText(p.x, p.y - 44, 'PINCH!'); } }
      if (a.k === 'pelican') { a.x += 1.2; if (a.x > S.cam.x + NW + 200) a.x = S.cam.x - 120; }
      if (a.k === 'pontoon' && !a.said && p.x > 6000) { a.said = 1; say(a, 'WELL LOOK WHO RAN ALL THE WAY FROM ATLANTA.', 200); }
    }
    if (LV.slick(p.x) && p.ground && S.t % 9 === 0 && Math.abs(p.gsp) > 3) part({ type: 'dust', x: p.x - p.face * 8, y: p.y, vx: -p.face, vy: -.6, life: 20 });
  },
  drawBack: (g, vis) => {
    if (vis(400, 300)) { g.fillStyle = '#2a140c'; g.fillRect(440, 248, 70, 22); g.fillStyle = '#2e6a3a'; g.fillRect(442, 250, 66, 18); drawText(g, 'SULLIVAN\'S', 446, 252, '#ffffff'); drawText(g, 'ISLAND', 458, 260, '#ffffff'); g.fillStyle = '#5a5a60'; g.fillRect(472, 270, 4, 30); }
    for (const pl of PLATS) { if (pl.kind !== 'board' && pl.kind !== 'deck') continue; const x0 = pl.pts[0][0], x1 = pl.pts[pl.pts.length - 1][0], y = pl.pts[0][1]; if (!vis((x0 + x1) / 2, (x1 - x0))) continue;
      g.fillStyle = '#6a4a2e'; for (let x = x0 + 6; x < x1; x += 40) g.fillRect(x, y, 4, Math.max(0, groundY(x) - y + 4)); g.fillStyle = '#2a140c'; g.fillRect(x0, y - 1, x1 - x0, 7); g.fillStyle = '#b08a5a'; g.fillRect(x0, y, x1 - x0, 5); g.fillStyle = '#8a6a44'; for (let x = x0; x < x1; x += 6) g.fillRect(x, y, 1, 5); g.fillStyle = '#c8a070'; g.fillRect(x0, y, x1 - x0, 1); }
    if (vis(4150, 200)) { const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); }; R(4040, 180, 220, 56, '#9ad0d8'); for (let y = 184; y < 236; y += 5) R(4040, y, 220, 1, '#7ab0b8'); R(4030, 166, 240, 16, '#e8e0d0'); R(4070, 192, 30, 24, '#ffe0a0'); R(4200, 192, 30, 24, '#ffe0a0'); for (const x of [4050, 4140, 4250]) R(x, 236, 6, groundY(x) - 236, '#7a5a3a'); }
  },
  drawActors: (g, vis) => {
    for (const a of S.actors) {
      if (a.k === 'crab' && vis(a.x)) g.drawImage(A.crab[(S.t >> 3) & 1], Math.round(a.x - 9), Math.round(a.y - 11));
      else if (a.k === 'pontoon' && vis(a.x)) drawSpr(A.pontoon.catsit[(S.t % 180 > 170) ? 1 : 0], a.x, a.y, 0, -1, BAX, BAY);
      else if (a.k === 'pelican' && vis(a.x, 40)) { const y = Math.round(a.y + Math.sin(S.t * .03 + a.x) * 4), x = Math.round(a.x), w = (S.t >> 4) & 1; g.fillStyle = '#5a4a3a'; g.fillRect(x - 6, y, 12, 3); g.fillRect(x - 12, y - (w ? 3 : -1), 7, 2); g.fillRect(x + 5, y - (w ? 3 : -1), 7, 2); g.fillStyle = '#d8a020'; g.fillRect(x + 6, y + 1, 6, 2); }
    }
  },
  onGoal: S => { say('hero', 'Y\'ALL WALK LIKE CATS?!', 110); setTimeout(() => S && say(actorAt(S, 'pontoon'), 'AND Y\'ALL RUN LIKE YOUR TAILS ARE ON FIRE. SIT UP. LIKE THIS.', 170), 1300); },
  goalStep: S => { if (S.goalT > 120) S.pl.catsit = 1; }
};

/* =====================================================================
   DAY 5 — THE FRENCH CONNECTION: baggage claim, Paris, Maison Carotte
   ===================================================================== */
LEVELS.paris = { id: 'paris', day: 5, title: 'THE FRENCH CONNECTION', want: 'EVERYBODY LEFT ME AT BAGGAGE CLAIM. FINE. I\'M GOING SHOPPING.', theme: 'paris', ww: 7800, start: 260, goal: 7020, hero: 'lone',
  gpts: [[-200, 300], [0, 300], [1400, 300], [1500, 304], [2400, 304], [2600, 300], [3600, 300], [3800, 250], [3900, 200], [4100, 176], [4300, 210], [4500, 170], [4700, 214], [4900, 168], [5100, 212], [5300, 180], [5500, 250], [5650, 300], [6400, 300], [6600, 304], [7800, 304]],
  loop: { cx: 2900, cy: 300 - 56, R: 56 },
  plats: [{ pts: [[340, 262], [700, 262]], kind: 'belt' }, { pts: [[860, 250], [1240, 250]], kind: 'belt' }, { pts: [[5980, 236], [6100, 236]], kind: 'booth' }],
  zone: x => x < 1450 ? 10 : x < 3700 ? 7 : x < 5600 ? 8 : x < 6450 ? 11 : 7,
  noStones: x => true,
  music: x => 'french', item: 'box', itemLines: ['ONE ORANGE BOX.', 'TWO ORANGE BOXES. FANCY.', 'THREE! EXTREMELY BLINGIN\'.'],
  finale: 'goal', cook: 'riviera', cookSong: 'french', meter: '#ff8a1c', scoreName: 'SCORE', springArt: 'suitcase',
  objects: () => { const L = newL(), K = kit(L);
    K.onPlat(0, 360, 680, 30); K.onPlat(1, 880, 1220, 30); K.line(1500, 2400, 32); K.loopRing(); K.line(3000, 3560, 30); K.arc(3900, 4100, 5, 26); K.arc(4300, 4500, 5, 26); K.arc(4700, 4900, 5, 26); K.arc(5100, 5300, 5, 26);
    K.line(5700, 6300, 26); K.onPlat(2, 6000, 6080, 20); K.line(6500, 6950, 28);
    [[1900, 12], [3300, 13], [6650, 12]].forEach(([x, r]) => K.rock(x, r));
    [300, 820, 3700, 4600, 5900].forEach(K.spring);
    K.item(0, 1200, 242); K.item(1, 4500, 150); K.item(2, 6040, 228);
    K.cuz(2100, groundY(2100), 'white'); K.cuz(4100, groundY(4100), 'honey'); K.cuz(6200, groundY(6200), 'dark');
    K.token(3500, groundY(3500) - 36);
    K.gold(560, 200); K.gold(4620, 70); K.gold(6040, 150);
    K.cameo('cinnamon', 2230, 300); K.cameo('clock', 2640, 300, 30); K.cameo('wick', 4720, 214); K.cameo('snails', 6230, 300, 30); K.cameo('vinyl', 5720, 300);
    return L; },
  init: S => { S.actors = [{ k: 'snails', x: 6000, y: 300 }]; },
  step: (S, p) => {
    for (const pl of PLATS) if (pl.kind === 'belt' && p.ground && p.surf === pl) { p.gsp += .25; if (S.t % 6 === 0) part({ type: 'dust', x: p.x, y: p.y, vx: -1, vy: -.3, life: 14 }); }
    if (p.x > 5650 && p.x < 6450 && S.t % 10 === 0) part({ type: 'spark', x: S.cam.x + Math.random() * NW, y: S.cam.y + Math.random() * NH * .5, life: 16 });
  },
  drawBack: (g, vis, cx, cy) => {
    if (cx < 1500) { const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); }; R(-20, -100, 1480, 400, '#dfe6ee'); for (let x = 20; x < 1440; x += 120) { R(x, 60, 100, 150, '#9ac8e8'); R(x, 60, 100, 4, '#7aa8c8'); for (let k = 0; k < 4; k++) R(x + k * 25, 60, 2, 150, '#c8d8e4'); }
      R(-20, 210, 1480, 6, '#b8c4d0'); R(160, 30, 140, 20, '#2a3a5a'); drawText(g, 'BAGAGES', 190, 37, '#f6c645'); R(1000, 30, 160, 20, '#2a3a5a'); drawText(g, 'SORTIE  >', 1030, 37, '#ffffff');
      for (const pl of PLATS) if (pl.kind === 'belt') { const x0 = pl.pts[0][0], x1 = pl.pts[1][0], y = pl.pts[0][1]; R(x0 - 6, y, x1 - x0 + 12, 10, '#3a3a44'); for (let x = x0 + ((S.t * 2) % 12); x < x1; x += 12) R(x, y + 1, 8, 3, '#6a6a78'); R(x0, y + 10, 8, 300 - y - 10, '#5a5a64'); R(x1 - 8, y + 10, 8, 300 - y - 10, '#5a5a64'); } }
    if (vis(2300, 300)) { const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); }; R(2160, 230, 150, 70, '#e8dcc0'); R(2160, 222, 150, 10, '#c8302a'); for (let x = 2160; x < 2310; x += 10) R(x, 232, 5, 6, '#ffffff'); drawText(g, 'BOULANGERIE', 2178, 224, '#ffffff'); R(2190, 246, 70, 40, '#ffe0a0');
      R(2560, 120, 160, 180, '#d8ccb0'); R(2560, 120, 160, 6, '#b8ac90'); drawText(g, 'MUSEE', 2620, 280, '#5a4a3a');
      for (const x of [1700, 1980, 3200, 3450]) { R(x, 270, 2, 30, '#2a2a34'); R(x - 8, 284, 18, 3, '#2a2a34'); R(x - 6, 272, 14, 3, '#c8302a'); } }
    for (let x = 1600; x < 3700; x += 160) if (vis(x)) { const y = groundY(x); g.fillStyle = '#2a2a34'; g.fillRect(x, y - 56, 3, 56); g.fillRect(x - 4, y - 60, 11, 5); g.fillStyle = '#ffe9a0'; g.fillRect(x - 2, y - 58, 7, 2); }
    for (let x = 3900; x < 5500; x += 230) if (vis(x)) { const y = groundY(x); g.fillStyle = '#a0503a'; g.fillRect(x, y - 26, 14, 26); g.fillStyle = '#5a4a4a'; g.fillRect(x - 2, y - 30, 18, 5); g.fillStyle = '#e8dcc0'; g.fillRect(x + 3, y - 34, 3, 4); g.fillRect(x + 8, y - 34, 3, 4); }
    if (vis(6050, 500)) { const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); }; R(5650, 120, 800, 180, '#1a1428'); for (let i = 0; i < 12; i++) { g.globalAlpha = .18; R(5660 + i * 66, 120, 30, 180, ['#ff4fa0', '#4fe0ff', '#f6c645'][(i + (S.t >> 4)) % 3]); } g.globalAlpha = 1;
      R(5940, 236, 200, 64, '#2a2438'); R(5940, 236, 200, 4, '#c8d0e0'); drawText(g, 'LE CLUB', 6010, 130, (S.t & 16) ? '#ff4fa0' : '#4fe0ff');
      const bx = 6040, by = 160; pixCircle(bx, by, 10, '#c8d0e0'); for (let k = 0; k < 8; k++) { g.fillStyle = (k + (S.t >> 2)) % 3 ? '#ffffff' : '#8a94aa'; g.fillRect(bx - 8 + (k % 4) * 4, by - 6 + Math.floor(k / 4) * 6, 3, 3); } R(bx, 120, 1, 30, '#c8d0e0'); }
    if (vis(7100, 300)) { const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); }; R(6960, 150, 300, 154, '#e8dcc0'); R(6950, 200, 320, 18, '#ff8a1c'); for (let x = 6950; x < 7270; x += 16) R(x, 218, 8, 8, '#ff8a1c'); drawText(g, 'MAISON CAROTTE', 7046, 205, '#ffffff'); R(6990, 236, 110, 68, '#ffe0a0'); R(7140, 236, 40, 68, '#2a140c'); for (let k = 0; k < 4; k++) { R(7004 + k * 24, 282, 18, 14, '#ff8a1c'); R(7004 + k * 24, 282, 18, 2, '#ffb060'); } }
  },
  drawActors: (g, vis) => { const a = actorAt(S, 'snails'); if (a && vis(a.x, 200)) { g.drawImage(A.snail[(S.t >> 3) & 1], 5990, 212); g.drawImage(A.snail[((S.t >> 3) + 1) & 1], 6070, 212); } },
  onGoal: S => { say('hero', 'BONJOUR. I\'LL TAKE EVERYTHING ORANGE.', 160); }
};

/* =====================================================================
   DAY 6 — GARDEN PARTY: back home, everybody comes
   ===================================================================== */
LEVELS.garden = { id: 'garden', day: 6, title: 'GARDEN PARTY', want: 'HARVEST DAY. EVERYTHING IN THE GARDEN, THEN THE BIGGEST PARTY EVER.', theme: 'forest', ww: 6400, start: 500, goal: 5520, home: true, burrow: true, forestFrom: 1e9,
  gpts: [[-200, 300], [0, 300], [1000, 300], [1100, 310], [1300, 300], [1500, 320], [1700, 300], [1900, 322], [2100, 300], [2300, 330], [2700, 330], [2900, 300], [3100, 325], [3300, 300], [3500, 325], [3700, 300], [3900, 320], [4200, 300], [4400, 300], [6400, 300]],
  loop: { cx: 2500, cy: 330 - 56, R: 56 },
  plats: [{ pts: [[92, 212], [270, 152], [448, 212]], kind: 'roof' }, { pts: [[1600, 236], [1720, 236]], kind: 'trellis' }, { pts: [[3150, 232], [3280, 232]], kind: 'trellis' }, { pts: [[3860, 236], [3950, 236]], kind: 'arm' }],
  zone: x => (x > 1060 && x < 4300) ? 9 : 0,
  music: x => x < 1060 ? 'lawn' : 'cookout', item: 'veg', itemLines: ['LETTUCE!', 'SWEET POTATO!', 'THE BIGGEST CARROT IN GEORGIA!'],
  finale: 'goal', cook: 'garden', cookSong: 'cookout', meter: '#7ad050', scoreName: 'SCORE', guests: ['dexter', 'pontoon', 'lone'], credits: true,
  objects: () => { const L = newL(), K = kit(L);
    K.line(620, 980, 26); K.line(1100, 1500, 30); K.onPlat(1, 1610, 1710, 24); K.line(1800, 2280, 30); K.loopRing(); K.line(2720, 3100, 30); K.onPlat(2, 3160, 3270, 26); K.line(3320, 3800, 30); K.line(4000, 5400, 34);
    [[1400, 12], [2050, 12], [3420, 13], [4700, 13]].forEach(([x, r]) => K.rock(x, r));
    [560, 1550, 3100, 3820].forEach(K.spring);
    K.item(0, 1660, 228); K.item(1, 2950, groundY(2950) - 8); K.item(2, 3905, 228);
    K.cuz(1250, groundY(1250), 'white'); K.cuz(2150, groundY(2150), 'ginger'); K.cuz(3220, 232, 'dark'); K.cuz(4050, groundY(4050), 'smoke'); K.cuz(4800, groundY(4800), 'honey');
    K.token(2280, groundY(2280) - 34);
    K.gold(842, 86); K.gold(2010, groundY(2010) - 10); K.gold(3905, 140);
    K.cameo('mailbox', 40, 300); K.cameo('moons', 4320, 300); K.cameo('flamingo', 4560, 300);
    K.decor(30, 1050, ['daisy', 'butter', 'clover'], 61); K.decor(4320, 6300, ['daisy', 'butter', 'clover'], 62);
    return L; },
  init: S => { S.actors = [{ k: 'nibhide', x: 3440, y: groundY(3440), h: 30 }, { k: 'roofbun', x: 300, y: platY(PLATS[0], 300), h: 40 }, { k: 'sunny', x: 737, y: 150 }, { k: 'bob', x: 5640, y: 300, h: 36 }, { k: 'dexter', x: 5760, y: 300, h: 36 }, { k: 'pontoon', x: 5820, y: 300, h: 40 }]; },
  step: (S, p) => {
    for (const a of S.actors) {
      if (a.k === 'nibhide') { if (!a.s1 && p.x > 3150) { a.s1 = 1; say(a, 'DOOO BA DEE DA DEE...', 160); } if (!a.s2 && p.x > 3380) { a.s2 = 1; a.shown = 1; say('hero', 'BOBCAT?! ...OH. IT\'S JUST YOU EATING.', 150); setTimeout(() => S && say(a, 'NOM. THIS CABBAGE GROWLS BACK.', 140), 1300); } }
      if (a.k === 'roofbun' && !a.said && S.t > 60) { a.said = 1; say(a, 'PARTY TONIGHT! EVERYBODY\'S COMING!', 200); }
      if (a.k === 'bob' && !a.said && p.x > 5200) { a.said = 1; say(a, 'MRRR...', 90); }
    }
  },
  drawBack: (g, vis) => {
    for (const pl of PLATS) { if (pl.kind !== 'trellis' && pl.kind !== 'arm') continue; const x0 = pl.pts[0][0], x1 = pl.pts[1][0], y = pl.pts[0][1]; if (!vis((x0 + x1) / 2, 100)) continue;
      if (pl.kind === 'trellis') { g.fillStyle = '#8a6a44'; g.fillRect(x0, y, x1 - x0, 4); g.fillRect(x0 + 4, y, 3, groundY(x0) - y); g.fillRect(x1 - 7, y, 3, groundY(x1) - y); for (let k = 0; k < 10; k++) pixCircle(x0 + 8 + k * ((x1 - x0 - 16) / 9), y - 3 + (k % 2) * 2, 4, k % 3 ? '#3fb04a' : '#5cae44'); g.fillStyle = '#e03030'; for (let k = 0; k < 4; k++) g.fillRect(x0 + 16 + k * 26, y + 6, 4, 4); }
      else { const sx = (x0 + x1) / 2, gy = groundY(sx); g.fillStyle = '#8a6a44'; g.fillRect(sx - 2, y - 30, 4, gy - y + 30); g.fillRect(x0, y, x1 - x0, 4); g.fillStyle = '#c8302a'; g.fillRect(sx - 9, y - 14, 18, 22); g.fillStyle = '#f2dca8'; pixCircle(sx, y - 24, 8, '#f2dca8'); g.fillStyle = '#8a5a22'; g.fillRect(sx - 14, y - 34, 28, 3); g.fillRect(sx - 8, y - 44, 16, 10); g.fillStyle = '#2a140c'; g.fillRect(sx - 4, y - 26, 2, 2); g.fillRect(sx + 3, y - 26, 2, 2); } }
    for (let x = 1120; x < 4280; x += 44) if (vis(x)) { const y = groundY(x); g.fillStyle = '#3fb04a'; g.fillRect(x, y - 8, 2, 8); g.fillRect(x - 3, y - 6, 3, 2); g.fillRect(x + 2, y - 5, 3, 2); if (x % 3 === 0) { g.fillStyle = '#e03030'; g.fillRect(x - 1, y - 10, 4, 3); } }
    if (vis(2010, 60)) { g.fillStyle = '#5a3a24'; g.beginPath(); g.ellipse(2010, groundY(2010), 26, 14, 0, Math.PI, 0); g.fill(); g.fillStyle = '#7a5a3a'; for (let k = 0; k < 9; k++) g.fillRect(1990 + k * 5, groundY(2010) - 6 - (k % 3) * 3, 3, 2); }
    if (vis(5560, 260)) { const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); }; R(5500, 276, 120, 4, '#2a140c'); R(5500, 272, 120, 4, '#e03030'); for (let x = 5500; x < 5620; x += 6) R(x, 272, 3, 2, '#ffffff'); R(5506, 280, 3, 20, '#4e3220'); R(5612, 280, 3, 20, '#4e3220'); R(5520, 260, 18, 12, '#3a3a3a'); R(5522, 258, 14, 3, '#2f7a2a'); R(5550, 266, 18, 4, '#8a3a1a'); R(5584, 254, 10, 18, '#ff8a1c');
      for (let i = 0; i <= 30; i++) { const k = i / 30, x = lerp(5420, 5900, k), y = 200 + Math.sin(k * Math.PI) * 26; R(Math.round(x), Math.round(y), 1, 1, '#2a140c'); if (i % 2 === 0) R(Math.round(x) - 1, Math.round(y) + 1, 3, 3, ((i + (S.t >> 4)) % 3) ? '#ffd86a' : '#ff9a5a'); } R(5418, 196, 3, 104, '#4e3220'); R(5898, 196, 3, 104, '#4e3220'); }
  },
  drawActors: (g, vis) => {
    for (const a of S.actors) { if (!vis(a.x, 60)) continue;
      if (a.k === 'nibhide') { if (a.shown) drawSpr(A.nib.chomp[(S.t >> 2) & 1], a.x, a.y, 0, -1, BAX, BAY); pixCircle(a.x + 14, a.y - 8, 9, '#7ad050'); pixCircle(a.x + 24, a.y - 6, 8, '#5cae44'); }
      else if (a.k === 'roofbun') drawSpr(A.roof.wave[(S.t >> 4) & 1], a.x, a.y, 0, -1, BAX, BAY);
      else if (a.k === 'sunny') g.drawImage(A.sq[(S.t % 90 < 10) ? 1 : 0], 724, 152);
      else if (a.k === 'bob') drawSpr(A.bob.sit[(S.t >> 5) & 1], a.x, a.y, 0, -1, 30, 37);
      else if (a.k === 'dexter') drawSpr(A.dexter.cheer[(S.t >> 3) & 1], a.x, a.y, 0, -1, BAX, BAY);
      else if (a.k === 'pontoon') drawSpr(A.pontoon.catsit[0], a.x, a.y, 0, -1, BAX, BAY); }
  },
  onGoal: S => { say('hero', 'HEY BOBCAT. CARROTS FOR PEACE?', 120); setTimeout(() => S && say(actorAt(S, 'bob'), '...DOOO BA DEE DA DEE BA DA DOOO.', 180), 1300); }
};

/* =====================================================================
   DAY 7 (the not-so-secret one) — BOULDER: snow, the Flatirons, cousins in beanies
   ===================================================================== */
LEVELS.boulder = { id: 'boulder', day: 7, title: 'CLIMBING SANITAS', want: 'GONNA CLIMB MOUNT SANITAS. HEARD THERE\'S SNOW AT THE TOP.', theme: 'snow', ww: 6200, wbot: 940, start: 380, goal: 5150, climb: true,
  gpts: [[-200, 640], [0, 640], [600, 640], [900, 600], [1200, 562], [1300, 560], [1306, 470], [1500, 462], [1700, 422], [1900, 402], [2000, 400], [2006, 300], [2200, 296], [2400, 262], [2700, 242], [2800, 240], [2806, 140], [3000, 136], [3300, 110], [3550, 110], [3800, 92], [3900, 90], [3906, -10], [4100, -14], [4400, -40], [4700, -50], [6200, -50]],
  loop: { cx: 3425, cy: 110 - 56, R: 56 }, plats: [],
  zone: x => x < 2990 ? 15 : 13, noStones: x => false,
  music: x => 'lawn', item: 'snowball', itemLines: ['FIRST SNOW!', 'TWO SNOWBALLS. MY PAWS ARE FREEZING.', 'THREE. SNOW BUN TIME.'],
  finale: 'goal', cook: 'snow', cookSong: 'cookout', meter: '#bfe8ff', scoreName: 'SCORE', springArt: 'snowbank',
  objects: () => { const L = newL(), K = kit(L);
    K.line(480, 1250, 34); K.line(1340, 1960, 34); K.line(2050, 2760, 34); K.line(2840, 3280, 34); K.loopRing(); K.line(3560, 3860, 30); K.line(3950, 5000, 36); K.arc(4250, 4350, 4, 90);
    [[900, 14], [1750, 12], [3700, 12], [4550, 16]].forEach(([x, r]) => K.rock(x, r));
    [1100, 2500, 4300].forEach(K.spring);
    K.item(0, 3060, groundY(3060) - 8); K.item(1, 3700, groundY(3700) - 34); K.item(2, 4620, groundY(4620) - 8);
    K.cuz(1460, groundY(1460), 'white'); K.cuz(2300, groundY(2300), 'dark'); K.cuz(4180, groundY(4180), 'ginger');
    K.token(1600, groundY(1600) - 34);
    K.gold(120, 628); K.gold(3425, 14); K.gold(4300, groundY(4300) - 228);
    K.cameo('bsquirrel', 1020, groundY(1020)); K.cameo('skis', 4900, groundY(4900));
    K.decor(80, 6100, ['stone', 'stone', 'clover'], 71);
    return L; },
  init: S => { S.actors = [{ k: 'bb', set: 'bb1', x: 700, y: groundY(700), h: 40, line: 'SANITAS? IT\'S STRAIGHT UP, CUZ. RUN AT THE ROCK AND CLIMB.' }, { k: 'bb', set: 'bb2', x: 2240, y: groundY(2240), h: 40, line: 'IT\'S SANDSTONE. GRIPPY. YOU GOT THIS.' }, { k: 'bb', set: 'bb3', x: 5320, y: groundY(5320), h: 40, line: 'SNOW BUN GOES RIGHT HERE. BEST VIEW IN BOULDER.' }]; },
  step: (S, p) => {
    for (const a of S.actors) if (!a.said && Math.abs(p.x - a.x) < 170) { a.said = 1; say(a, a.line, 190); }
    if (p.x > 2700 && S.t % 3 === 0) part({ type: 'snow', x: S.cam.x + Math.random() * (NW + 60), y: S.cam.y - 4, vx: -.3 - Math.random() * .3, vy: .5 + Math.random() * .5, life: 400 });
  },
  drawBack: (g, vis) => {
    if (vis(520, 80)) { const y = groundY(520); g.fillStyle = '#5a3a22'; g.fillRect(498, y - 40, 4, 40); g.fillRect(546, y - 40, 4, 40); g.fillStyle = '#2a140c'; g.fillRect(492, y - 52, 64, 22); g.fillStyle = '#7a5236'; g.fillRect(494, y - 50, 60, 18); drawText(g, 'MT SANITAS', 497, y - 48, '#f4e2bd'); drawText(g, 'TRAIL', 510, y - 40, '#f4e2bd'); }
    if (vis(5000, 120)) { const y = groundY(5000); for (let k = 0; k < 5; k++) pixCircle(5000 + (k % 2) * 3 - 1, y - 4 - k * 7, 6 - k, k % 2 ? '#8a7e80' : '#a89c9c'); }
    if (vis(5210, 120) && S.mode === 'goal') { const k = Math.min(1, S.goalT / 80), gy = groundY(5210), x0 = 5210; pixCircle(x0, gy - 10, Math.round(12 * k), '#ffffff'); if (k > .4) pixCircle(x0, gy - 28, Math.round(9 * Math.min(1, (k - .4) / .3)), '#f4f8ff'); if (k > .7) { pixCircle(x0, gy - 41, 6, '#ffffff'); g.fillStyle = '#ffffff'; g.fillRect(x0 - 5, gy - 58, 3, 12); g.fillRect(x0 + 2, gy - 58, 3, 12); g.fillStyle = '#ff8a1c'; g.fillRect(x0 + 4, gy - 41, 5, 2); g.fillStyle = '#1a0e0a'; g.fillRect(x0 - 3, gy - 44, 2, 2); g.fillRect(x0 + 2, gy - 44, 2, 2); g.fillStyle = '#c8302a'; g.fillRect(x0 - 8, gy - 35, 16, 3); } }
  },
  drawActors: (g, vis) => { for (const a of S.actors) if (vis(a.x)) drawSpr(A[a.set].idle[(S.t % 200 > 190) ? 1 : 0], a.x, a.y, 0, -1, BAX, BAY); },
  onGoal: S => { say('hero', 'TOP OF SANITAS! SNOW! I\'M BUILDING A SNOW BUN.', 160); setTimeout(() => S && say(S.actors[2], 'WELCOME TO BOULDER, CUZ.', 150), 1500); }
};

/* ---------- cookout backdrops for the away days ---------- */
function duskSky(t, gy, top, mid, bot) { top = rgb(top); mid = rgb(mid); bot = rgb(bot); for (let i = 0; i < 22; i++) { const k = i / 21; g.fillStyle = css(k < .55 ? mixRGB(top, mid, k / .55) : mixRGB(mid, bot, (k - .55) / .45)); g.fillRect(0, Math.floor(gy * i / 22), NW, Math.ceil(gy / 22) + 1); } }
function groundStrip(gy, top, body) { for (let x = 0; x < NW; x++) { g.fillStyle = top; g.fillRect(x, gy, 1, 6); g.fillStyle = body; g.fillRect(x, gy + 6, 1, NH - gy); } }
const COOKSCENES = {
  farm: (t, gy) => { const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    R(0, gy - 70, NW, 70, '#3a3048'); R(10, gy - 120, 140, 120, '#4a2028'); R(6, gy - 128, 148, 10, '#3a1a20'); R(60, gy - 100, 36, 30, '#ffd68a');
    R(250, gy - 110, 200, 110, '#e8e0d0'); R(240, gy - 124, 220, 16, '#4a4a58'); for (const x of [260, 320, 380, 440]) R(x, gy - 60, 6, 60, '#ffffff'); R(280, gy - 96, 30, 24, '#ffd68a'); R(380, gy - 96, 30, 24, '#ffd68a');
    groundStrip(gy, '#4a8a2a', '#9a3a22'); drawSpr(A.seven.stand[0], 200, gy + 2, 0, -1, 34, 52); g.drawImage(A.elli[(t >> 4) & 1], 340, gy - 46); R(300, gy - 18, 30, 6, '#8a5a3a'); R(306, gy - 26, 18, 8, '#d8a020');
    drawSpr(A.dexter.cheer[(t >> 3) & 1], 160, gy + 1, 0, 1, BAX, BAY); },
  marsh: (t, gy) => { const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    R(0, gy - 50, NW, 30, '#3a5a8a'); for (let x = 0; x < NW; x += 3) R(x, gy - 50 + ((x + t) % 30 < 15 ? 0 : 1), 2, 1, '#ffb070'); pixCircle(330, gy - 52, 16, '#ff7a3a'); R(0, gy - 52, NW, 2, '#ff9a5a');
    g.fillStyle = '#2a2a30'; g.beginPath(); g.moveTo(90, gy - 20); g.lineTo(100, gy - 110); g.lineTo(110, gy - 20); g.fill(); R(97, gy - 116, 6, 6, (t & 32) ? '#fff3b0' : '#2a2a30');
    groundStrip(gy, '#f2dca8', '#d8bc84'); R(0, gy - 20, NW, 20, '#e6cc94'); for (let x = 20; x < NW; x += 50) { R(x, gy - 34, 2, 14, '#c8b860'); R(x + 3, gy - 30, 2, 10, '#9ab050'); }
    drawSpr(A.pontoon.catsit[(t % 180 > 170) ? 1 : 0], 380, gy + 1, 0, -1, BAX, BAY); },
  riviera: (t, gy) => { const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    R(0, gy - 60, NW, 40, '#2a6aa8'); for (let x = 0; x < NW; x += 4) R(x, gy - 60 + ((x * 3 + t) % 40 < 20 ? 0 : 1), 3, 1, '#ffd0a0'); pixCircle(80, gy - 60, 18, '#ff8a3a');
    groundStrip(gy, '#f2dca8', '#d8bc84'); R(0, gy - 20, NW, 20, '#f0d8a8');
    for (const [x, c] of [[150, '#ff8a1c'], [260, '#4fe0ff'], [360, '#ff4fa0']]) { R(x, gy - 50, 2, 50, '#8a8a8a'); for (let k = -18; k <= 18; k++) R(x + k, gy - 50 + Math.abs(k) / 3, 1, 4, (k >> 2) & 1 ? c : '#ffffff'); }
    for (let k = 0; k < 6; k++) { R(300 + k * 14, gy - 12, 12, 10, '#ff8a1c'); R(300 + k * 14, gy - 12, 12, 2, '#ffb060'); }
    drawSpr(A.lone.cheer[(t >> 3) & 1], 290, gy + 1, 0, -1, BAX, BAY); },
  icebox: (t, gy) => { const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    const city = forestBase().find(l => l.city).c; g.globalAlpha = .7; g.drawImage(city, -40, gy - 130); g.drawImage(city, 520, gy - 130); g.globalAlpha = 1; R(0, 0, NW, gy, 'rgba(10,6,30,.45)');
    R(150, gy - 96, 200, 96, '#14101e'); R(150, gy - 96, 200, 4, '#4fe0ff'); drawText(g, 'THE ICE BOX', 214, gy - 86, (t & 16) ? '#4fe0ff' : '#ffffff'); R(170, gy - 70, 160, 40, '#2a3a5a'); for (let k = 0; k < 9; k++) if ((t + k * 7) % 30 < 15) R(180 + k * 17, gy - 60 + (k % 3) * 8, 2, 2, '#ffffff');
    groundStrip(gy, '#3a3a40', '#2a2a30'); g.drawImage(A.escL, 300, gy - 49); }
};
COOKSCENES.snow = (t, gy) => { const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const fl = LAYERSETS.snow ? LAYERSETS.snow.find(l => l.pines).c : null; if (fl) { g.globalAlpha = .6; g.drawImage(fl, -60, gy - 140); g.globalAlpha = 1; }
  R(20, gy - 80, 150, 80, '#5a3a26'); for (let y = gy - 78; y < gy; y += 7) R(20, y, 150, 2, '#4a2e1c'); g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(10, gy - 80); g.lineTo(95, gy - 126); g.lineTo(180, gy - 80); g.fill(); R(50, gy - 60, 28, 22, '#ffd68a'); R(112, gy - 60, 28, 22, '#ffd68a');
  for (let x = 0; x < NW; x++) { R(x, gy, 1, NH - gy, x % 7 ? '#eef4fc' : '#dfe9f5'); } R(0, gy, NW, 2, '#ffffff');
  R(300, gy - 10, 40, 10, '#5a5a60'); for (let k = 0; k < 5; k++) R(306 + k * 6, gy - 20 - (t + k * 9) % 12, 4, 8, ['#ffd040', '#ff8a1c', '#e03030'][k % 3]);
  for (const [x, set] of [[360, 'bb1'], [392, 'bb3']]) drawSpr(A[set].cheer[(t >> 3) & 1], x, gy + 1, 0, -1, BAX, BAY);
  for (let i = 0; i < 40; i++) { R((i * 53 + t * .4) % NW, (i * 31 + t * .8) % gy, 1, 1, '#ffffff'); } };
COOKSCENES.garden = null; // home scene is drawn by drawCook itself (plus the guests)
