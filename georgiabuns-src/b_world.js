/* ================= Georgia Buns — the world =================
   Day 1: Rocks in the Creek. House and lawn, Sunny's oak, the forest,
   a root loop, the Nibbin' Bun's log jam, the bobcat's pine, the creek. */

let WW = 9600, WBOT = 780, LAWN_END = 1000, BANK_X = 7930, WATER, GPTS, GY, LOOP, PLATS, LV = null;
const NOWATER = { x0: -99, x1: -98, y: -9999 };
const LEVELS = {};
LEVELS.creek = { id: 'creek', day: 1, title: 'ROCKS IN THE CREEK', want: 'ROCKS. CREEK. TODAY.', theme: 'forest', ww: 9600, start: 500, goal: 8400, forestFrom: 650,
  water: { x0: 8030, x1: 8990, y: 582 }, loop: { cx: 2730, cy: 402 - 62, R: 62 },
  gpts: [[-200, 300], [0, 300], [1000, 300], [1100, 312], [1250, 292], [1400, 332], [1600, 362], [1750, 352], [1900, 302], [2000, 292],
  [2200, 332], [2400, 382], [2600, 402], [2860, 402], [3050, 362], [3200, 342], [3400, 352], [3600, 322], [3800, 332], [4000, 362],
  [4200, 372], [4500, 372], [4700, 342], [4900, 302], [5100, 292], [5300, 297], [5600, 352], [5900, 422], [6100, 432], [6300, 402],
  [6500, 442], [6800, 482], [7000, 472], [7300, 502], [7600, 522], [7800, 522], [7980, 532], [8070, 600], [8950, 600], [9040, 545],
  [9200, 535], [9800, 535]],
  plats: [
  { pts: [[92, 212], [270, 152], [448, 212]], kind: 'roof' },
  { pts: [[1590, 232], [1730, 232]], kind: 'log' },
  { pts: [[2960, 262], [3110, 252]], kind: 'log' },
  { pts: [[3600, 228], [3730, 222]], kind: 'log' },
  { pts: [[6270, 318], [6390, 314]], kind: 'log' },
  { pts: [[8372, 486], [8392, 478], [8508, 478], [8528, 486]], kind: 'rock' }],
  zone: x => x < 1000 ? 0 : x < 7930 ? 1 : (x > 8060 && x < 8960) ? 3 : 2,
  music: x => x > 7750 ? 'creek' : x > 1060 ? 'theme' : 'lawn',
  item: 'rock', itemLines: ['GOOD ROCK.', 'THAT ONE\'S A SKIPPER.', 'THREE. PERFECT.'],
  finale: 'throw', cook: 'home', meter: '#3c8ed0' };
function buildGY() {
  GY = new Float32Array(WW + 2); let k = 0;
  for (let x = 0; x <= WW + 1; x++) {
    while (k < GPTS.length - 2 && GPTS[k + 1][0] <= x) k++;
    const [x0, y0] = GPTS[k], [x1, y1] = GPTS[k + 1], t = clamp((x - x0) / (x1 - x0), 0, 1);
    GY[x] = y0 + (y1 - y0) * (1 - Math.cos(Math.PI * t)) / 2;
  }
}
function groundY(x) { if (x <= 0) return GY[0]; if (x >= WW) return GY[WW]; const i = x | 0, f = x - i; return GY[i] + (GY[i + 1] - GY[i]) * f; }
function loadLevel(id) {
  LV = LEVELS[id]; WW = LV.ww; WBOT = LV.wbot || 780; GPTS = LV.gpts; WATER = LV.water || NOWATER; LOOP = LV.loop || null; PLATS = LV.plats || [];
  buildGY(); buildTerrain(); LAYERS = buildLayers(LV.theme); buildLevelProps();
  if (LV.build && !LV.built) { LV.build(); LV.built = true; }
}
function platY(p, x) {
  const a = p.pts; if (x < a[0][0] || x > a[a.length - 1][0]) return null;
  for (let i = 0; i < a.length - 1; i++) if (x <= a[i + 1][0]) { const t = (x - a[i][0]) / (a[i + 1][0] - a[i][0]); return a[i][1] + (a[i + 1][1] - a[i][1]) * t; }
  return null;
}

/* ---------- level objects ---------- */
function creekObjects() {
  const L = { carrots: [], boulders: [], springs: [], rocks: [], cousins: [], tokens: [], ferns: [] };
  const C = (x, y, respawn) => L.carrots.push({ x, y, got: false, respawn: respawn || 0, t: 0 });
  const line = (x0, x1, step, up = 18) => { for (let x = x0; x <= x1; x += step) C(x, groundY(x) - up); };
  const arc = (x0, x1, n, peak, base) => { for (let i = 0; i < n; i++) { const t = n === 1 ? .5 : i / (n - 1), x = lerp(x0, x1, t); C(x, (base != null ? base : groundY(x)) - 18 - Math.sin(t * Math.PI) * peak); } };
  const platLine = (p, x0, x1, step) => { for (let x = x0; x <= x1; x += step) C(x, platY(PLATS[p], x) - 16); };

  // lawn and roof
  line(620, 690, 24); arc(860, 980, 5, 26);
  platLine(0, 140, 250, 22); platLine(0, 290, 420, 22);
  // forest opening
  line(1040, 1200, 26); arc(1250, 1320, 4, 30);
  line(1400, 1520, 24); platLine(1, 1600, 1720, 20);
  line(1780, 1900, 28); arc(2030, 2140, 5, 42);
  line(2200, 2560, 30);
  // carrots around the loop
  for (let i = 1; i < 12; i++) { const t = i / 12 * Math.PI * 2; C(LOOP.cx + (LOOP.R - 16) * Math.sin(t), LOOP.cy + (LOOP.R - 16) * Math.cos(t)); }
  line(2880, 2930, 25); platLine(2, 2980, 3090, 22);
  arc(3290, 3380, 4, 34); line(3420, 3540, 30); platLine(3, 3620, 3710, 22);
  line(3780, 3950, 28); arc(3850, 3910, 3, 30);
  // carrot patch before the jam: grows back
  for (let x = 4040; x <= 4240; x += 20) C(x, groundY(x) - 18, 360);
  line(4420, 4520, 25); arc(4545, 4700, 7, 120); line(4800, 5020, 30);
  // the chase
  line(5300, 5560, 26); arc(5620, 5740, 5, 40); line(5800, 6100, 30);
  platLine(4, 6290, 6380, 22); arc(6560, 6720, 6, 50); line(6780, 7100, 32); arc(7120, 7180, 3, 34);
  line(7250, 7700, 30);
  line(7800, 7960, 26);

  [[1280, 13], [2080, 18], [3330, 15], [3880, 13], [4760, 19], [6150, 15], [6650, 18], [7150, 13], [5480, 12]].forEach(([x, r]) =>
    L.boulders.push({ x, y: groundY(x) - r + 4, r, broken: false }));
  [560, 1560, 2940, 3570, 4560, 6250].forEach(x => L.springs.push({ x, y: groundY(x), t: 0 }));
  L.rocks.push({ id: 0, x: 352, y: platY(PLATS[0], 352) - 6, got: false, shown: true });
  L.rocks.push({ id: 1, x: 4346, y: groundY(4346) - 8, got: false, shown: false });
  L.rocks.push({ id: 2, x: 0, y: 0, got: false, shown: false });
  [[1700, 1, 'white'], [3085, 2, 'ginger'], [3705, 3, 'dark'], [6365, 4, 'smoke'], [7352, null, 'honey']].forEach(([x, p, fur]) => {
    const y = p != null ? platY(PLATS[p], x) : groundY(x);
    L.cousins.push({ x, y, fur, woke: false, t: 0 });
  });
  L.tokens.push({ x: 2470, y: groundY(2470) - 30, got: false });
  L.tokens.push({ x: 5700, y: groundY(5700) - 40, got: false });
  srand(41);
  for (let x = 1050; x < 7900; x += 90 + rnd() * 160) L.ferns.push({ x, k: (rnd() * 3) | 0 });
  L.decor = []; srand(43);
  const busy = x => L.springs.some(sp => Math.abs(sp.x - x) < 24) || L.boulders.some(b => Math.abs(b.x - x) < b.r + 6) || (x > 4300 && x < 4380) || (x > 490 && x < 512);
  for (let x = 30; x < 9300; x += 16 + rnd() * 34) {
    if (busy(x) || (x > WATER.x0 - 30 && x < WATER.x1 + 10)) continue;
    let k;
    if (x < LAWN_END) k = ['daisy', 'butter', 'clover', 'daisy', 'clover'][(rnd() * 5) | 0];
    else if (x < BANK_X) k = ['mush', 'cone', 'stone', 'mush2', 'cone', 'clover', 'daisy'][(rnd() * 7) | 0];
    else k = rnd() < .6 ? 'cattail' : 'stone';
    L.decor.push({ x, k });
  }
  for (const x of [470, 600, 960, 1180, 1960, 3150, 3990, 5350, 6050, 6860, 7480]) L.decor.push({ x, k: 'azalea' });
  return L;
}

/* ---------- terrain prerender ---------- */
const CLAY = ['#b54a2b', '#a2401f', '#c4573a', '#953a22', '#ad4628'].map(rgb);
const GRASS_LAWN = ['#a6e870', '#7ccf4a', '#62b83a', '#4ea232', '#3f8a2a', '#33721f', '#285a18'].map(rgb);
const GRASS_FOR = ['#8fd25c', '#68b440', '#529c36', '#43862e', '#376f26', '#2c5a1e', '#224818'].map(rgb);
const BANK = ['#c9a878', '#b08c5c', '#9a7848', '#86663c', '#735632', '#634a2a', '#523c22'].map(rgb);
const BED = ['#7a8478', '#5e6a64', '#94a092', '#4c5854'].map(rgb);
const CHAMBER = rgb('#3b1d10'), CHAMBER_L = rgb('#5a2c18'), CHAMBER_GLOW = rgb('#7a4022');
const TERR = { chunks: [], CW: 256 };
function inChamber(x, y) { const dx = (x - 300) / 122, dy = (y - 362) / 34; if (dx * dx + dy * dy < 1 && y < 392) return 1; const tx = (x - 372) / 128; if (tx >= 0 && tx <= 1 && y < 389) { const cy = lerp(380, 302, tx); if (Math.abs(y - cy) < 9) return 2; } return 0; }
function buildTerrain() {
  const CW = TERR.CW; TERR.chunks = []; const isCreek = LV.id === 'creek' || LV.id === 'garden';
  for (let cx = 0; cx < WW; cx += CW) {
    let top = 1e9; for (let x = cx; x < cx + CW; x++) top = Math.min(top, GY[Math.min(x, WW)]);
    top = Math.floor(top) - 4;
    const h = WBOT - top, c = mkC(CW, h), g = c.getContext('2d'), id = g.createImageData(CW, h), d = id.data;
    for (let i = 0; i < CW; i++) {
      const x = cx + i, gy = Math.round(GY[Math.min(x, WW)]);
      const zone = LV.zone(x);
      if (zone >= 4) { const Z = ZONES[zone]; for (let y = top; y < WBOT; y++) { const col = Z(x, y, y - gy, gy); if (!col) continue; const p = ((y - top) * CW + i) * 4; d[p] = col[0]; d[p + 1] = col[1]; d[p + 2] = col[2]; d[p + 3] = 255; } continue; }
      const GR = zone === 0 ? GRASS_LAWN : zone === 1 ? GRASS_FOR : BANK;
      for (let y = top; y < WBOT; y++) {
        const dd = y - gy; let col = null;
        if (dd < 0) {
          if (zone < 2 && dd >= -3) { const hh = hash(x, 7); const bl = hh < .35 ? 1 : hh < .6 ? 2 : hh < .7 ? 3 : 0; if (-dd <= bl) col = (-dd === bl) ? GR[0] : GR[1]; }
        } else if (zone === 3) {
          const q = y + Math.sin(x * .05) * 2; const hb = hash(x >> 2, q >> 2);
          col = dd < 2 ? BED[2] : BED[hb < .3 ? 1 : hb < .55 ? 2 : hb < .7 ? 3 : 0];
          if (hash(x, y) < .04) col = BED[2];
        } else if (dd < 7 + ((Math.sin(x * .33) + Math.sin(x * .13)) * 1.2 | 0)) {
          const gd = 7 + ((Math.sin(x * .33) + Math.sin(x * .13)) * 1.2 | 0), last = dd === gd - 1;
          col = last ? GR[6] : GR[Math.min(5, Math.floor(dd * 6 / gd) + (hash(x, y) < .15 ? 1 : 0))];
          if (dd === 0 && hash(x, 3) < .5) col = GR[0];
          if (zone === 1 && dd < 4 && hash(x * 3, y) < .09) col = rgb('#c8913a');
          if (zone === 0 && dd < 3 && hash(x, y * 5) < .03) col = rgb('#fff2a8');
        } else if (dd < 13 + ((Math.sin(x * .33) + Math.sin(x * .13)) * 1.2 | 0)) col = mixRGB(CLAY[3], [40, 12, 6], .45 - (dd - 7) * .06);
        else {
          const q = y + Math.sin(x * .021) * 3 + Math.sin(x * .0061) * 7, band = Math.floor(q / 8), pos = ((Math.floor(q) % 8) + 8) % 8;
          col = CLAY[((band % 5) + 5) % 5];
          if (pos === 0) col = mixRGB(col, [236, 150, 100], .28); else if (pos === 1) col = mixRGB(col, [236, 150, 100], .12); else if (pos === 7) col = mixRGB(col, [50, 14, 6], .3);
          const hh = hash(x, y);
          if (hh < .018) col = rgb('#d97a4c'); else if (hh < .03) col = rgb('#6e2814');
          if (hash(x >> 1, y >> 1) < .004) col = rgb('#e8a070');
          if (dd > 120) col = mixRGB(col, [70, 22, 12], Math.min(.5, (dd - 120) / 260));
        }
        if (dd >= 0 && x < 520 && LV.id === 'creek') { const ch = inChamber(x, y); if (ch) { col = (y > 385 && ch === 1) ? CHAMBER_L : CHAMBER; if (ch === 1 && y < 386) { const gd = Math.hypot(x - 362, (y - 370) * 1.6); if (gd < 46) col = mixRGB(CHAMBER_GLOW, col, gd / 46); } } }
        if (!col) continue;
        const p = ((y - top) * CW + i) * 4; d[p] = col[0]; d[p + 1] = col[1]; d[p + 2] = col[2]; d[p + 3] = 255;
      }
    }
    g.putImageData(id, 0, 0);
    srand(cx * 3 + 1);
    for (let k = 0; k < 4; k++) { const sx = cx + 10 + rnd() * (CW - 20), dep = 16 + rnd() * 90, r = 2 + rnd() * 3.5; if (sx > WATER.x0 - 40 && sx < WATER.x1 + 40) continue; if (sx < 520 && LV.id === 'creek') continue; if (LV.noStones && LV.noStones(sx)) continue; const st = new Spr(Math.ceil(r * 2.6) + 4, Math.ceil(r * 2) + 4); st.ell(st.w / 2, st.h / 2, r * 1.3, r, [2, 3, 4]); g.drawImage(st.outline(1).canvas(palette(['#5a2414', '#9a8e86', '#6e625c', '#c4b8ae'])), Math.round(sx - cx - st.w / 2), Math.round(GY[Math.floor(sx)] + dep - top)); }
    if (LV.zone(cx) === 1 || LV.zone(cx) === 6) for (let k = 0; k < 2; k++) { let rx = cx + rnd() * CW, ry = GY[Math.floor(rx)] + 8; g.fillStyle = '#5a2a14'; for (let i = 0; i < 26; i++) { g.fillRect(Math.round(rx - cx), Math.round(ry - top), 2, 2); rx += (rnd() - .5) * 2.4; ry += .8 + rnd() * .6; } }
    TERR.chunks.push({ x: cx, y: top, c });
  }
}

/* ---------- parallax layers ---------- */
let LAYERS = []; const LAYERSETS = {};
function buildLayers(theme) {
  if (LAYERSETS[theme]) return LAYERSETS[theme];
  if (theme !== 'forest') return (LAYERSETS[theme] = THEME_LAYERS[theme]());
  const LAYERS = []; LAYERSETS.forest = LAYERS;
  // far, faint cloud deck
  { const c = mkC(640, 70), g = c.getContext('2d'); srand(13);
    for (let i = 0; i < 9; i++) { const x = rnd() * 580, y = 6 + rnd() * 44, w = 24 + rnd() * 30; const s = new Spr(Math.ceil(w) + 12, 16);
      for (let k = 0; k < 4; k++) s.ell(6 + rnd() * w, 9 + rnd() * 2, 5 + rnd() * 4, 3.5 + rnd() * 2, [1, 2, 1]);
      g.drawImage(s.canvas(palette(['#eef5fc', '#cfe0f0'])), x, y); }
    LAYERS.push({ c, fx: .025, fy: .01, base: -85, drift: .03, fill: null }); }
  // clouds
  { const c = mkC(720, 110), g = c.getContext('2d'); srand(11);
    for (let i = 0; i < 7; i++) { const x = rnd() * 600, y = 10 + rnd() * 70, w = 40 + rnd() * 50; const s = new Spr(Math.ceil(w) + 20, 30);
      for (let k = 0; k < 5; k++) s.ell(10 + rnd() * w, 16 + rnd() * 4, 8 + rnd() * 6, 6 + rnd() * 4, [1, 2, 1]);
      g.drawImage(s.canvas(palette(['#ffffff', '#dbe9f6'])), x, y); }
    LAYERS.push({ c, fx: .05, fy: .02, base: -60, drift: .08, fill: null }); }
  // forestified ATL skyline
  { const c = mkC(560, 120), g = c.getContext('2d'); srand(23);
    const body = '#8d9ccb', lite = '#a9b6de', win = '#d4dcf4', tree = '#7d9eaa', treeD = '#6c8c98';
    let x = 0;
    while (x < 560) { const w = 12 + (rnd() * 22 | 0), h = 26 + (rnd() * 70 | 0); g.fillStyle = body; g.fillRect(x, 120 - h, w, h); g.fillStyle = lite; g.fillRect(x, 120 - h, 2, h);
      g.fillStyle = win; for (let yy = 120 - h + 4; yy < 116; yy += 5) for (let xx = x + 4; xx < x + w - 2; xx += 4) if (hash(xx, yy) < .45) g.fillRect(xx, yy, 1, 2);
      if (h > 80) { g.fillStyle = body; g.fillRect(x + w / 2 - 1, 120 - h - 14, 2, 14); g.fillRect(x + w / 2 - 3, 120 - h - 4, 6, 4); }
      if (rnd() < .6) { g.fillStyle = tree; for (let k = 0; k < 4; k++) { const r = 3 + rnd() * 5; g.beginPath(); g.arc(x + rnd() * w, 120 - h + 1, r, 0, 7); g.fill(); } }
      x += w + (rnd() * 6 | 0); }
    for (let i = 0; i < 40; i++) { g.fillStyle = i % 2 ? tree : treeD; const r = 5 + rnd() * 9; g.beginPath(); g.arc(rnd() * 560, 118 - rnd() * 8, r, 0, 7); g.fill(); }
    LAYERS.push({ c, fx: .1, fy: .05, base: -10, fill: treeD, city: true }); }
  // hills and the lake
  { const c = mkC(640, 140), g = c.getContext('2d'), s = new Spr(640, 140); srand(31);
    for (let x = 0; x < 640; x++) { const h1 = 70 + Math.sin(x / 640 * Math.PI * 2 * 2) * 18 + Math.sin(x / 640 * Math.PI * 2 * 5) * 6; for (let y = Math.floor(h1); y < 110; y++) s.set(x, y, y < h1 + 3 ? 3 : 1);
      const h2 = 88 + Math.sin(x / 640 * Math.PI * 2 * 3 + 1) * 10; for (let y = Math.floor(h2); y < 112; y++) s.set(x, y, y < h2 + 2 ? 4 : 2); }
    for (let i = 0; i < 160; i++) { const x = rnd() * 640, y = 80 + rnd() * 26; if (s.get(x, y)) s.ell(x, y, 2, 3, 2); }
    for (let y = 110; y < 140; y++) for (let x = 0; x < 640; x++) s.set(x, y, (y === 110) ? 6 : (hash(x >> 3, y) < .08 ? 7 : 5));
    g.drawImage(s.canvas(palette(['#5f9e8c', '#4a8775', '#78b8a2', '#5c9c86', '#7cc0dc', '#b8e4f2', '#a4d8ec'])), 0, 0);
    LAYERS.push({ c, fx: .2, fy: .1, base: 30, fill: '#7cc0dc', lake: true }); }
  // far pines: shaded cones, tier on tier
  { const c = mkC(480, 170), s = new Spr(480, 170); srand(47);
    const trees = []; for (let i = 0; i < 24; i++) trees.push([rnd() * 480, 70 + rnd() * 80, 13 + rnd() * 9]); trees.sort((a, b) => a[1] - b[1]);
    for (const [x, h, w] of trees) { s.cyl(x - 1.5, 150, 4, 20, [6, 7]); for (let k = 0; k < 6; k++) { const yy = 170 - h + k * h / 7; s.cone(x, yy - 6, yy + h / 5, w * (0.38 + k * .13), [1, 2, 3, 4, 5]); } }
    s.rect(0, 162, 480, 8, 1);
    c.getContext('2d').drawImage(s.canvas(palette(['#1c4632', '#26583e', '#2f6a4c', '#3c7c58', '#5a9c6e', '#2a1e18', '#4a3424'])), 0, 0);
    LAYERS.push({ c, fx: .35, fy: .2, base: 60, fill: '#1c4632', forest: true }); }
  // azaleas and dogwoods: a Georgia spring hedge line, in round lit clumps
  { const c = mkC(600, 64), s = new Spr(600, 64); srand(59);
    const cl = []; for (let i = 0; i < 46; i++) { const r = 8 + rnd() * 11; cl.push([rnd() * 600, 64 - r * .5, r]); } cl.sort((a, b) => a[1] - b[1]);
    for (const [x, y, r] of cl) s.sphere(x, y, r * 1.25, r * .9, [1, 2, 3, 4]);
    for (let i = 0; i < 520; i++) { const x = rnd() * 600, y = 24 + rnd() * 40, v = s.get(x, y); if (v >= 2 && v <= 4) { const k = rnd(); const col = v >= 3 ? (k < .55 ? 6 : 8) : (k < .5 ? 7 : 5); s.set(x, y, col); if (k < .5) s.set(x + 1, y, col); } }
    for (let i = 0; i < 6; i++) { const x = 30 + rnd() * 540; s.cyl(x - 1, 20, 3, 34, [9, 10]); for (let k = 0; k < 34; k++) { const a = rnd() * 6.28, r = rnd() * 12; s.set(x + Math.cos(a) * r * 1.3, 20 + Math.sin(a) * r * .6, rnd() < .7 ? 8 : 5); } }
    c.getContext('2d').drawImage(s.canvas(palette(['#1e4a1e', '#2c6230', '#3e7e3a', '#5aa04c', '#c8307a', '#ff5fa2', '#ffb0d0', '#ffffff', '#3a2618', '#6a4a32'])), 0, 0);
    LAYERS.push({ c, fx: .48, fy: .3, base: -4, fill: '#1e4a1e' }); }
  // near trunks: round, barked, draped in lit kudzu, a canopy band overhead
  { const c = mkC(760, 420), s = new Spr(760, 420); srand(53);
    for (let i = 0; i < 7; i++) { const x = 40 + i * 105 + rnd() * 40, w = 16 + rnd() * 12;
      s.cyl(x, 0, w, 420, [1, 2, 3, 4, 5], true);
      for (let j = 0; j < 4; j++) { const ky = 50 + rnd() * 200, kx = x + w / 2 + (rnd() - .5) * w; for (let m = 0; m < 6; m++) s.sphere(kx + (rnd() - .5) * 20, ky + m * 7, 5 + rnd() * 3, 4.2, [6, 7, 8, 9, 10]); } }
    for (let i = 0; i < 70; i++) s.sphere(rnd() * 760, rnd() * 34, 12 + rnd() * 10, 9 + rnd() * 6, [6, 7, 8, 9, 10], -.1);
    c.getContext('2d').drawImage(s.canvas(palette(['#24160e', '#3a2618', '#563a26', '#755034', '#94704a', '#173a16', '#245a20', '#357c2c', '#52a440', '#86d062'])), 0, 0);
    LAYERS.push({ c, fx: .6, fy: .45, base: 30, fill: null, forest: true, alpha: true }); }
  return LAYERS;
}

/* ---------- props ---------- */
function buildLevelProps() {
  PROPS.loop = null; PROPS.logs = [];
  if (LOOP) { const R = LOOP.R, T = 13, sz = (R + T) * 2 + 4, s = new Spr(sz, sz), c0 = sz / 2;
    for (let y = 0; y < sz; y++) for (let x = 0; x < sz; x++) { const dx = x + .5 - c0, dy = y + .5 - c0, r = Math.hypot(dx, dy); if (r >= R && r < R + T) { const t = ((r - R) / T) * 2 - 1, nz = Math.sqrt(1 - t * t), ux = dx / r * t, uy = dy / r * t; let l = (-ux * .55 - uy * .65 + nz * .6 + .3) / 1.5; if (hash(Math.round(Math.atan2(dy, dx) * 40), Math.round(r)) < .1) l -= .2; let col = rampIdx([1, 2, 3, 4, 5], l, x, y); if (dy < -R * .5 && t > .2 && hash(x >> 1, y >> 1) < .45) col = rampIdx([6, 7, 8], l + .2, x, y); s.set(x, y, col); } }
    PROPS.loop = { c: s.outline(9).canvas(palette(['#3a2416', '#563620', '#7a5236', '#9a6e48', '#c09468', '#2f7a2a', '#4ea23a', '#7ccf4a', '#1e100a'])), x: LOOP.cx - c0, y: LOOP.cy - c0 }; }
  PROPS.logs = PLATS.filter(p => p.kind === 'log').map(p => { const x0 = p.pts[0][0], x1 = p.pts[p.pts.length - 1][0], w = x1 - x0 + 8, s = new Spr(w, 16);
    const y0 = p.pts[0][1], y1 = p.pts[p.pts.length - 1][1];
    for (let x = 0; x < w; x++) { const off = Math.round((y1 - y0) * x / w); for (let k = 0; k < 11; k++) s.set(x, k + off + 1, k < 3 ? 3 : k > 8 ? 2 : (hash(x >> 2, k) < .15 ? 2 : 1)); }
    s.ell(w - 4, 6 + (y1 - y0), 3, 5.5, [4, 3, 4]);
    return { c: s.outline(5).canvas(palette(['#7a5236', '#4e3220', '#a07450', '#d8b080', '#2a140c'])), x: x0 - 4, y: y0 - 2 }; });
}
const PROPS = {};
function buildProps() {
  // house: world box (80,130)-(460,302)
  { const ox = 80, oy = 130, c = mkC(380, 172), g = c.getContext('2d'), R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x - ox, y - oy, w, h); };
    R(110, 208, 320, 92, '#c9a06a'); for (let y = 212; y < 300; y += 5) R(110, y, 320, 1, '#a8804e'); R(110, 208, 320, 2, '#e2bf8a');
    R(108, 292, 324, 8, '#7a6a5a'); for (let x = 110; x < 430; x += 9) R(x, 293 + (x % 2), 7, 3, '#958474');
    // kitchen window (island + pendants)
    R(126, 222, 128, 50, '#5a3a22'); R(130, 226, 120, 42, '#f2c27a'); R(130, 226, 120, 14, '#ffdf9e');
    R(150, 252, 70, 16, '#7a4a2c'); R(150, 252, 70, 3, '#a8704a'); R(160, 240, 6, 12, '#3a8a3a'); R(200, 244, 10, 8, '#e8e0d0');
    for (const px of [165, 185, 205]) { R(px, 226, 1, 8, '#3a2a1a'); R(px - 2, 234, 5, 3, '#ffe9a0'); }
    R(189, 226, 2, 42, '#5a3a22'); R(130, 246, 120, 2, '#5a3a22');
    // living room window
    R(300, 222, 92, 42, '#5a3a22'); R(304, 226, 84, 34, '#e9b46c'); R(312, 246, 52, 14, '#8a3a3a'); R(312, 242, 52, 5, '#a84a4a'); R(370, 236, 10, 24, '#3a2a1a'); R(366, 232, 18, 6, '#ffe9a0');
    R(345, 226, 2, 34, '#5a3a22');
    // door
    R(262, 238, 30, 62, '#4a2e1a'); R(265, 241, 24, 59, '#2e5a3a'); R(267, 244, 20, 22, '#3a6e48'); R(284, 270, 3, 3, '#f6c645');
    R(258, 232, 38, 4, '#e8dcc0');
    // porch lamp + plant
    R(298, 240, 4, 6, '#ffe9a0'); R(116, 284, 10, 10, '#8a4a2a'); R(114, 276, 14, 9, '#4f9a3a');
    // roof (matches the roof platform)
    for (let x = 92; x <= 448; x++) { const top = x < 270 ? lerp(212, 152, (x - 92) / 178) : lerp(152, 212, (x - 270) / 178); for (let y = Math.floor(top); y < Math.max(top + 14, 210); y++) { const row = Math.floor((y - top) / 4); const sh = ((x + row * 5) % 10 < 1) ? '#2a1e2a' : (row % 2 ? '#4a3648' : '#3e2c3e'); R(x, y, 1, 1, y < top + 2 ? '#e8dcc0' : sh); } }
    R(360, 150, 18, 34, '#a0503a'); for (let y = 152; y < 184; y += 4) R(360, y, 18, 1, '#7a3a2a'); R(357, 146, 24, 5, '#5a4a4a');
    for (let i = 0; i < 26; i++) { const x = 120 + hash(i, 1) * 300, top = x < 270 ? lerp(212, 152, (x - 92) / 178) : lerp(152, 212, (x - 270) / 178); R(x, top + 3 + hash(i, 2) * 6, 3, 2, '#5c8a3a'); }
    PROPS.house = { c, x: ox, y: oy }; }
  // Sunny's oak: round trunk, a lit branch, a canopy of clumps
  { const c = mkC(260, 300), s = new Spr(260, 300), ox = 640, oy = 2;
    for (let y = 140; y < 300; y++) { const w = 36 + Math.max(0, y - 266) * 1.3; s.cyl(130 - w / 2, y, w, 1, [1, 2, 3, 4, 5], true); }
    for (let x = 58; x < 122; x++) { const y = 172 + (122 - x) * .12; for (let k = -4; k <= 4; k++) { const l = (-k / 4 * .7 + .6); s.set(x, y + k, rampIdx([1, 2, 3, 4, 5], l, x, y + k)); } }
    s.canopy(130, 96, 98, 62, 64, [6, 7, 8, 9, 10], 61);
    c.getContext('2d').drawImage(s.outline(11).canvas(palette(['#3a2416', '#563620', '#755034', '#94704a', '#b8906a', '#1e4a1a', '#2f6e26', '#47922f', '#69b844', '#9ade6a', '#14260e'])), 0, 0);
    PROPS.oak = { c, x: ox, y: oy }; }
  // the bobcat's pine
  { const c = mkC(200, 300), s = new Spr(200, 300), ox = 5050, oy = 0;
    s.cyl(87, 30, 26, 270, [1, 2, 3, 4, 5], true);
    for (let x = 6; x < 92; x++) { const y = 224 + (92 - x) * .03; for (let k = -4; k <= 4; k++) s.set(x, y + k, rampIdx([1, 2, 3, 4, 5], -k / 4 * .6 + .55, x, y + k)); }
    for (let k = 0; k < 8; k++) { const yy = 18 + k * 22; s.cone(100, yy - 12, yy + 28, 26 + k * 6, [6, 7, 8, 9, 10]); }
    c.getContext('2d').drawImage(s.outline(11).canvas(palette(['#3a2416', '#563620', '#755034', '#94704a', '#b8906a', '#173c26', '#22583a', '#2f704a', '#4a9060', '#76b880', '#0e2016'])), 0, 0);
    PROPS.pine = { c, x: ox, y: oy }; }
  // signs
  PROPS.sign = (() => { const c = mkC(44, 40), g = c.getContext('2d'); g.fillStyle = '#4e3220'; g.fillRect(19, 16, 5, 24); g.fillStyle = '#2a140c'; g.fillRect(1, 1, 42, 17); g.fillStyle = '#a07450'; g.fillRect(2, 2, 40, 15); g.fillStyle = '#c89a6a'; g.fillRect(2, 2, 40, 2); drawText(g, 'CREEK', 4, 6, '#3a1e10'); g.fillStyle = '#3a1e10'; g.fillRect(34, 9, 5, 1); g.fillRect(37, 8, 1, 3); g.fillRect(38, 9, 1, 1); return c; })();
  // hollow log (a cousin naps inside)
  { const s = new Spr(96, 40); s.rect(4, 6, 84, 30, 1); s.rect(4, 6, 84, 4, 3); s.rect(4, 30, 84, 6, 2); for (let x = 8; x < 80; x += 9) s.line(x, 14, x + 5, 15, 2); s.ell(88, 21, 8, 15, [3, 1, 4]); s.ell(88, 21, 5, 11, 6); s.ell(30, 6, 10, 3, 5);
    PROPS.hollow = { c: s.outline(7).canvas(palette(['#7a5236', '#4e3220', '#a07450', '#d8b080', '#5cae44', '#1e100a', '#2a140c'])), x: 7262, y: 0 }; }
  // ground decor
  { const P = palette(['#2a140c', '#3fb04a', '#2c6a24', '#fff3b0', '#ffffff', '#ff5fa2', '#c8307a', '#e03030', '#f4e2bd', '#8a5a22', '#c8913a', '#5a3a14', '#9a8e86', '#6cbc4a', '#7a5236']);
    const mk = (w, h, fn) => { const s = new Spr(w, h); fn(s); return s.outline(1).canvas(P); };
    PROPS.decor = {
      daisy: mk(9, 10, s => { s.line(4, 9, 4, 4, 2); s.ell(4.5, 3.5, 3, 3, 5); s.set(4, 3, 4); s.set(4, 4, 4); }),
      butter: mk(9, 9, s => { s.line(4, 8, 4, 4, 2); s.ell(4.5, 3, 2.6, 2.4, 4); }),
      clover: mk(10, 6, s => { s.ell(3, 3, 2, 2, 2); s.ell(6, 2.5, 2, 2, 14); s.ell(7, 4, 2, 1.6, 2); }),
      azalea: mk(30, 18, s => { s.ell(15, 11, 14, 7, [3, 3, 14]); srand(3); for (let i = 0; i < 40; i++) { const x = 3 + rnd() * 24, y = 5 + rnd() * 10; if (s.get(x, y)) s.set(x, y, rnd() < .6 ? 6 : 7); } }),
      mush: mk(10, 9, s => { s.rect(4, 4, 3, 5, 9); s.ell(5.5, 3.5, 4.5, 2.8, 8); s.set(4, 2, 5); s.set(7, 3, 5); }),
      mush2: mk(7, 7, s => { s.rect(3, 3, 2, 4, 9); s.ell(3.5, 2.5, 3, 2.2, 11); }),
      cone: mk(7, 9, s => { s.ell(3.5, 4.5, 2.8, 3.8, [11, 12, 10]); for (let y = 2; y < 8; y += 2) s.line(1, y, 6, y + 1, 12); }),
      stone: mk(11, 7, s => { s.ell(5.5, 4, 5, 3, [13, 0, 9]); }),
      cattail: mk(10, 26, s => { for (const [x, h] of [[2, 22], [5, 25], [8, 19]]) { s.line(x, 25, x, 25 - h, 2); s.rect(x - 1, 25 - h + 2, 2, 6, 15); } s.line(0, 25, 3, 12, 14); s.line(9, 25, 7, 14, 14); })
    };
  }
  // ferns (foreground)
  PROPS.ferns = [0, 1, 2].map(k => { const s = new Spr(30, 16); srand(90 + k); for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * .38, l = 9 + rnd() * 5; for (let r = 0; r < l; r++) s.set(15 + Math.cos(a) * r, 15 + Math.sin(a) * r + r * r * .02, r > l - 3 ? 3 : (i % 2 ? 1 : 2)); } return s.outline(4).canvas(palette(['#3f8a32', '#2c6a24', '#6cbc4a', '#1a3a14'])); });
}
