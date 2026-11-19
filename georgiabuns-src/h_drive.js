/* ================= Georgia Buns — Day 3: THE ICE BOX =================
   A road that runs into the screen. The Escalade cruises Peachtree at night,
   past the clubs and under Spaghetti Junction, hopping traffic on its
   hydraulics, collecting ice (and, for the cousins who misheard, actual ice). */

LEVELS.icebox = { id: 'icebox', day: 3, title: 'THE ICE BOX', want: 'WOKE UP NEEDING MORE ICE. DRIP DRIP LIKE WATER.', drive: true, theme: 'forest', ww: 2400, start: 200, goal: 2200,
  gpts: [[-200, 300], [2600, 300]], zone: () => 12, music: () => 'icebox', item: 'rock', itemLines: [], finale: 'drive', cook: 'icebox', cookSong: 'icebox', scoreName: 'ICE', meter: '#4fe0ff',
  objects: () => newL() };
LEVELS.icebox.forestFrom = 1e9;

const DRV = { SEG: 200, ROADW: 2000, CAMH: 1000, DEPTH: 1 / Math.tan(50 * Math.PI / 180), DRAW: 160 };
function driveArt() {
  if (A.drive) return; A.drive = {};
  A.drive.esc = escaladeRear(); A.drive.escB = escaladeRear(1);
  A.drive.cars = [['#2a5ab8', '#4a7ad8', '#183a80'], ['#d8d4cc', '#f4f0e8', '#a8a49c'], ['#b8282a', '#e04a44', '#801818'], ['#2f8a3a', '#4ab05a', '#1e5a26']].map(c => sedanRear(c));
  A.drive.lamp = smallSpr(16, 80, ['#1a1a24', '#3a3a48', '#ffe9a0', '#fff6d0'], s => { s.rect(7, 10, 3, 70, 2); s.rect(2, 6, 12, 5, 2); s.rect(3, 10, 10, 2, 3); });
  A.drive.neon = [0, 1].map(i => propCanvas(70, 64, (x, R) => { R(31, 34, 4, 30, '#2a2a34'); R(0, 0, 70, 36, '#14101e'); R(2, 2, 66, 32, i ? '#ff4fa0' : '#4fe0ff'); R(5, 5, 60, 26, '#14101e'); drawText(x, 'CLUB', 22, 14, i ? '#ff4fa0' : '#4fe0ff'); }));
  A.drive.street = propCanvas(80, 70, (x, R) => { R(38, 20, 4, 50, '#5a5a60'); R(0, 0, 80, 22, '#ffffff'); R(1, 1, 78, 20, '#1e6a3a'); drawText(x, 'PEACHTREE', 13, 4, '#ffffff'); drawText(x, 'ST NE', 25, 12, '#ffffff'); });
  A.drive.dogwood = smallSpr(50, 60, ['#2a140c', '#5a3a26', '#ffffff', '#f0e0f0', '#3f8a32'], s => { s.rect(23, 30, 4, 30, 2); srand(8); for (let k = 0; k < 40; k++) s.ell(25 + (rnd() - .5) * 40, 22 + (rnd() - .5) * 26, 3, 3, rnd() < .7 ? 3 : (rnd() < .5 ? 4 : 5)); });
  A.drive.gem = [0, 1, 2, 3].map(i => smallSpr(16, 16, ['#1a2a4a', '#bff4ff', '#4fe0ff', '#ffffff', '#2a8ad8'], s => { const w = [6, 4, 2, 4][i]; s.tri(8 - w, 6, 8 + w, 6, 8, 15, 3); s.tri(8 - w, 6, 8, 1, 8 + w, 6, 2); s.set(8, 3, 4); }));
  A.drive.cube = smallSpr(14, 14, ['#3a5a8a', '#d8f0ff', '#a8d8f0', '#ffffff'], s => { s.rect(2, 3, 10, 9, 2); s.rect(2, 3, 10, 2, 1); s.rect(3, 4, 3, 2, 4); });
  A.drive.store = propCanvas(240, 140, (x, R) => { R(0, 30, 240, 110, '#14101e'); R(0, 30, 240, 6, '#4fe0ff'); R(10, 0, 220, 30, '#14101e'); R(12, 2, 216, 26, '#4fe0ff'); R(16, 6, 208, 18, '#14101e'); drawText(x, 'THE ICE BOX', 78, 12, '#ffffff'); R(20, 50, 200, 70, '#2a3a5a'); for (let k = 0; k < 20; k++) R(24 + (k * 37) % 190, 56 + (k * 13) % 60, 2, 2, '#ffffff'); R(100, 90, 40, 50, '#0a0a14'); });
}
// a real-looking SUV from behind, painted pixel by pixel with gradients
function escaladeRear(brake) {
  const W = 132, H = 80, c = mkC(W, H), x = c.getContext('2d');
  const R = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  const grad = (a, b, w, h, c1, c2) => { for (let i = 0; i < h; i++) R(a, b + i, w, 1, css(mixRGB(rgb(c1), rgb(c2), i / Math.max(1, h - 1)))); };
  // shadow + tires
  x.globalAlpha = .45; R(4, 74, 124, 5, '#000'); x.globalAlpha = 1;
  for (const tx of [8, 104]) { R(tx, 58, 20, 20, '#0c0c10'); R(tx + 1, 59, 18, 18, '#1a1a20'); for (let k = 0; k < 18; k += 3) R(tx + 2, 60 + k, 16, 1, '#26262e'); R(tx + 1, 59, 2, 18, '#30303a'); }
  // body silhouette: roof, D-pillars, tailgate, bumper
  R(14, 4, 104, 6, '#0a0b10'); grad(16, 5, 100, 4, '#3a3f50', '#1a1d26');
  R(10, 9, 112, 3, '#0a0b10');
  R(6, 12, 120, 50, '#0a0b10');
  grad(8, 13, 116, 46, '#2e3342', '#0e1016');
  // rear glass with neon reflections
  R(20, 13, 92, 22, '#06070a'); grad(21, 14, 90, 20, '#1a2236', '#080a12');
  x.globalAlpha = .55; for (let i = 0; i < 14; i++) { R(30 + i * 2, 14 + i, 3, 1, '#ff4fa0'); R(66 + i * 2, 14 + i, 2, 1, '#4fe0ff'); } x.globalAlpha = .25; R(21, 14, 90, 2, '#ffffff'); x.globalAlpha = 1;
  R(60, 31, 14, 1, '#2a2a34'); R(64, 30, 1, 3, '#2a2a34');
  // spoiler + third brake light
  R(30, 9, 72, 2, brake ? '#ff3a30' : '#7a1a18');
  // tall vertical taillights up the D-pillars
  for (const lx of [7, 117]) { R(lx, 13, 8, 42, '#2a0808'); grad(lx + 1, 14, 6, 40, brake ? '#ff6a5a' : '#e0302a', brake ? '#ff2a20' : '#801010'); for (let k = 0; k < 40; k += 4) R(lx + 2, 15 + k, 4, 1, brake ? '#fff0e0' : '#ff8a7a'); }
  // tailgate: body-color sheen, chrome bar, crest, plate
  grad(18, 37, 96, 18, '#262a38', '#0c0e14');
  x.globalAlpha = .18; for (let i = 0; i < 18; i++) R(30 + i * 3, 37 + i, 18, 1, '#ffffff'); x.globalAlpha = 1;
  grad(22, 41, 88, 3, '#f0f4f8', '#7a808a'); R(22, 44, 88, 1, '#2a2e36');
  R(62, 36, 8, 5, '#c8ced8'); R(63, 37, 6, 3, '#8a2a3a'); R(64, 37, 1, 1, '#f6c645'); R(67, 37, 1, 1, '#f6c645');
  R(50, 47, 32, 10, '#1a1a1a'); R(51, 48, 30, 8, '#f4f0e8'); R(51, 48, 30, 1, '#c8302a'); drawText(x, 'BUNS', 55, 49, '#1e2a5a');
  // bumper, step pad, exhaust tips
  grad(6, 58, 120, 8, '#3a3e48', '#14161c'); R(6, 58, 120, 1, '#9aa2ae'); R(40, 60, 52, 4, '#08080a');
  for (const ex of [26, 98]) { R(ex, 63, 9, 6, '#0a0a0c'); R(ex + 1, 64, 7, 4, '#c8ced8'); R(ex + 2, 65, 5, 2, '#30343c'); }
  R(6, 12, 1, 50, '#4a5060'); R(125, 12, 1, 50, '#1a1c22');
  return c;
}
function sedanRear(col) {
  const W = 92, H = 56, c = mkC(W, H), x = c.getContext('2d');
  const R = (a, b, w, h, cc) => { x.fillStyle = cc; x.fillRect(a, b, w, h); };
  const grad = (a, b, w, h, c1, c2) => { for (let i = 0; i < h; i++) R(a, b + i, w, 1, css(mixRGB(rgb(c1), rgb(c2), i / Math.max(1, h - 1)))); };
  x.globalAlpha = .45; R(4, 51, 84, 4, '#000'); x.globalAlpha = 1;
  for (const tx of [8, 70]) { R(tx, 40, 14, 14, '#0c0c10'); for (let k = 0; k < 12; k += 3) R(tx + 1, 41 + k, 12, 1, '#22222a'); }
  R(18, 4, 56, 4, '#0a0b10'); R(8, 8, 76, 36, '#0a0b10');
  grad(20, 5, 52, 3, col[1], col[0]); grad(10, 9, 72, 33, col[1], col[2]);
  R(20, 9, 52, 14, '#080a12'); grad(21, 10, 50, 12, '#22304a', '#0a0e18'); x.globalAlpha = .3; R(21, 10, 50, 1, '#ffffff'); x.globalAlpha = 1;
  for (const lx of [10, 66]) { R(lx, 26, 16, 7, '#300808'); grad(lx + 1, 27, 14, 5, '#ff5a4a', '#a01818'); }
  R(36, 30, 20, 7, '#1a1a1a'); R(37, 31, 18, 5, '#f4f0e8');
  grad(8, 38, 76, 6, '#3a3e48', '#14161c'); R(8, 38, 76, 1, '#8a929e');
  return c;
}
function buildTrack() {
  const segs = [], add = (n, curve, hill) => { const y0 = segs.length ? segs[segs.length - 1].y2 : 0; for (let i = 0; i < n; i++) { const k = i / n, e = curve * (k < .25 ? k * 4 : k > .75 ? (1 - k) * 4 : 1); segs.push({ i: segs.length, curve: e, y1: 0, y2: 0, sprites: [], cars: [] }); } return y0; };
  const plan = [[120, 0, 0], [180, 2, 0], [160, 0, 40], [200, -3, -30], [140, 0, 0], [220, 4, 20], [160, -2, -40], [200, 0, 60], [240, -4, 0], [180, 3, -60], [200, 0, 0], [220, -2, 30], [160, 5, -20], [260, 0, 0], [120, 0, 0]];
  let h = 0; for (const [n, c, hl] of plan) { const st = segs.length; add(n, c, hl); for (let i = st; i < segs.length; i++) { const k = (i - st) / n; segs[i].y1 = h + hl * 40 * (1 - Math.cos(Math.PI * k)) / 2; } h += hl * 40; }
  for (let i = 0; i < segs.length; i++) segs[i].y2 = (segs[i + 1] || segs[i]).y1;
  const S2 = (i, k, x) => segs[i] && segs[i].sprites.push({ k, x });
  for (let i = 20; i < segs.length - 60; i += 8) { S2(i, 'lamp', -1.25); S2(i, 'lamp', 1.25); }
  srand(55); for (let i = 40; i < segs.length - 80; i += 37) S2(i, rnd() < .55 ? 'neon' : 'dogwood', rnd() < .5 ? -1.9 : 1.9);
  for (let i = 90; i < segs.length - 80; i += 260) S2(i, 'street', 1.7);
  for (const i of [700, 1500, 2300]) { for (let k = 0; k < 6; k++) segs[i + k].bridge = true; }
  S2(segs.length - 50, 'store', 0);
  return segs;
}
function initDrive() {
  driveArt();
  const segs = buildTrack(), L = segs.length * DRV.SEG;
  const items = []; srand(66);
  for (let z = 3000; z < L - 8000; z += 900) { const lane = [-.6, 0, .6][(rnd() * 3) | 0]; for (let k = 0; k < 4; k++) items.push({ z: z + k * 260, x: lane, k: rnd() < .22 ? 'cube' : 'gem', got: false }); }
  const golds = [[90000, .7, 1], [260000, -.7, 1], [410000, 0, 1]].map(([z, x, hi]) => ({ z, x, hi, got: !!0 }));
  const toks = [['spaghetti', 1500 * DRV.SEG + 400, 0], ['stonemtn', 1000 * DRV.SEG, -.65], ['peachdrop', 2600 * DRV.SEG, .65]].map(([k, z, x]) => ({ k, z, x, got: false }));
  const cars = []; for (let i = 0; i < 26; i++) cars.push({ z: 6000 + i * (L / 28), x: [-.6, 0, .6][i % 3] + (rnd() - .5) * .2, sp: 70 + rnd() * 60, spr: i % 4 });
  S.drv = { segs, L, z: 0, x: 0, sp: 0, max: 225, hop: 0, hv: 0, ice: 0, cubes: 0, items, golds, toks, cars, phase: 'go', t: 0, bg: 0, sel: 1, bump: 0, said: 0 };
  S.mode = 'drive'; S.carrots = 0; auMode('icebox'); say('hero', LV.want, 200);
}
function stepDrive() {
  const D = S.drv; D.t++;
  if (D.phase === 'shop') { stepShop(D); return; }
  if (D.phase === 'arrive') { D.sp *= .95; D.z += D.sp; if (D.sp < 8 && MISSION && !MISSION.shop) { if (!S.fadeTo) { S.score = D.ice; S.fadeTo = 'cook'; say('hero', 'THAT\'S PEACHTREE.', 120); } return; } if (D.sp < 8) { D.phase = 'shop'; D.t = 0; say('hero', 'PICK SOME DRIP, CUZ.', 160); } return; }
  const seg = D.segs[Math.floor(D.z / DRV.SEG) % D.segs.length], pct = D.sp / D.max;
  const off = Math.abs(D.x) > 1.05;
  D.sp += (off ? (D.sp > D.max * .55 ? -4 : 2) : 3.2); D.sp = clamp(D.sp, 0, D.max);
  if (D.bump > 0) D.bump--;
  D.x += IN.ix * .05 * Math.max(.35, pct); D.x -= .05 * pct * seg.curve * .045;
  if (Math.abs(D.x) > 1.65) { D.x = sgn(D.x) * 1.6; sfx('bonk'); D.sp *= .9; }
  if (IN.jumpP && D.hop <= 0) { D.hv = perk('hydro') ? 9 : 7.5; D.hop = .01; sfx('jump'); }
  if (D.hop > 0) { D.hop += D.hv; D.hv -= .55; if (D.hop <= 0) { D.hop = 0; sfx('land'); } }
  D.z += D.sp; D.bg -= seg.curve * pct * .9;
  for (const c of D.cars) { c.z += c.sp; if (c.z > D.L) c.z -= D.L; const dz = c.z - D.z; if (dz > 0 && dz < 220 && Math.abs(c.x - D.x) < .34 && D.hop < 12 && D.bump === 0) { D.sp *= .74; D.x += sgn(D.x - c.x || 1) * .3; c.z += 300; D.bump = 30; sfx('bonk'); popText(NW / 2, NH * .55, 'BUMP!'); S.shake = 6; } }
  for (const it of D.items) if (!it.got) { const dz = it.z - D.z; if (dz > -40 && dz < 140 && Math.abs(it.x - D.x) < .3 && D.hop < 20) { it.got = true; if (it.k === 'gem') { D.ice++; S.carrots++; sfx('carrot', D.ice & 1); } else { D.cubes++; sfx('plip'); if (D.cubes % 3 === 1) popText(NW / 2, NH * .5, 'ACTUAL ICE?!', '#bfe8ff'); } } }
  for (let i = 0; i < D.golds.length; i++) { const gc = D.golds[i]; if (gc.got) continue; const dz = gc.z - D.z; if (dz > -40 && dz < 160 && Math.abs(gc.x - D.x) < .32 && D.hop > 14) { gc.got = true; S.golds++; dayRec('icebox').gold[i] = true; writeSave(); sfx('rock'); sfx('crew'); popText(NW / 2, NH * .45, 'GOLDEN CARROT!', '#f6c645'); } }
  for (const tk of D.toks) if (!tk.got) { const dz = tk.z - D.z; if (dz > -40 && dz < 160 && Math.abs(tk.x - D.x) < .35) { tk.got = true; const first = !SAVE.stickers[tk.k]; SAVE.stickers[tk.k] = true; writeSave(); S.found.push(tk.k); sfx('wake'); popText(NW / 2, NH * .4, (first ? 'NEW STICKER: ' : '') + CAMEOS[tk.k].name, '#7ad050'); } }
  if (!D.said && D.z > 40000) { D.said = 1; say('hero', 'COUSINS IN THE BACK THINK WE\'RE GETTING ACTUAL ICE.', 170); }
  if (D.z > D.L - 60 * DRV.SEG) { D.phase = 'arrive'; }
}
const DRIPS = [['rope', 'GOLD ROPE'], ['carrot', 'CARROT PENDANT'], ['ice', 'ICED OUT']];
function stepShop(D) {
  if (D.chosen) { if (++D.ct === 150) { S.score = D.ice; S.fadeTo = 'cook'; } return; }
  if (Math.abs(IN.ix) > .5 && !D.lk) { D.sel = clamp(D.sel + sgn(IN.ix), 0, 2); D.lk = 1; sfx('tap'); } if (Math.abs(IN.ix) < .3) D.lk = 0;
  let pick = -1;
  if (IN.press && IN.tapX != null) { for (let i = 0; i < 3; i++) { const [x, y, w, h] = shopCard(i); if (IN.tapX >= x && IN.tapX <= x + w && IN.tapY >= y && IN.tapY <= y + h) pick = i; } }
  if (IN.jumpP) pick = D.sel;
  if (pick >= 0 && D.t > 20) { D.sel = pick; D.chosen = 1; D.ct = 0; setDrip(DRIPS[pick][0]); sfx('pay'); sfx('rock'); say('hero', 'DRIP DRIP LIKE WATER.', 150); }
}
function shopCard(i) { const w = 100, h = 92, gap = 16, x0 = NW / 2 - (w * 3 + gap * 2) / 2; return [Math.round(x0 + i * (w + gap)), Math.round(NH * .32), w, h]; }

function drawDrive() {
  const D = S.drv, hz = Math.round(NH * .52);
  // night sky with neon haze
  const top = rgb('#0a0820'), bot = rgb('#5a2a6a');
  for (let i = 0; i < 16; i++) { g.fillStyle = css(mixRGB(top, bot, i / 15)); g.fillRect(0, Math.floor(hz * i / 16), NW, Math.ceil(hz / 16) + 1); }
  for (let i = 0; i < 40; i++) if ((S.t + i * 13) % 90 < 70) { g.fillStyle = '#fff6d0'; g.fillRect((i * 97) % NW, (i * 41) % (hz * .6), 1, 1); }
  pixCircle(NW * .8, NH * .12, 9, '#f4f0d0');
  const bx = ((D.bg * 40) % NW + NW) % NW;
  g.fillStyle = '#2a2040'; g.beginPath(); g.ellipse(((bx * .3) % NW) + 60, hz + 4, 70, 26, 0, Math.PI, 0); g.fill();
  const city = forestBase().find(l => l.city).c;
  for (let x = -bx * .6 % city.width - city.width; x < NW; x += city.width) g.drawImage(city, Math.round(x), hz - city.height + 6);
  g.globalAlpha = .55; g.fillStyle = '#140a28'; g.fillRect(0, 0, NW, hz + 6); g.globalAlpha = 1;
  for (let i = 0; i < 26; i++) { const wx = ((i * 53 - bx * .6) % NW + NW) % NW; if ((S.t + i * 7) % 60 < 40) { g.fillStyle = ['#ff4fa0', '#4fe0ff', '#f6c645'][i % 3]; g.fillRect(Math.round(wx), hz - 10 - (i * 17) % 50, 1, 2); } }
  g.fillStyle = '#10141a'; g.fillRect(0, hz, NW, NH - hz);
  if (D.phase === 'shop') { drawShop(D); return; }
  // road
  const base = Math.floor(D.z / DRV.SEG), segs = D.segs, N = segs.length, camX = D.x * DRV.ROADW, pseg = segs[base % N];
  const camY = DRV.CAMH + lerp(pseg.y1, pseg.y2, (D.z % DRV.SEG) / DRV.SEG);
  let dx = 0, ddx = 0, maxY = NH; const proj = [];
  const P = (wz, wx, wy) => { const cz = wz - D.z; if (cz <= 1) return null; const sc = DRV.DEPTH / cz; return { x: Math.round(NW / 2 + sc * (wx - camX) * NW / 2), y: Math.round(hz - sc * (wy - camY) * NH / 2), w: sc * DRV.ROADW * NW / 2, sc }; };
  const firstOff = -(D.z % DRV.SEG) / DRV.SEG;
  for (let n = 0; n < DRV.DRAW; n++) {
    const s = segs[(base + n) % N], z1 = (base + n) * DRV.SEG, z2 = z1 + DRV.SEG;
    const a = P(z1, dx, s.y1), b = P(z2, dx + ddx, s.y2);
    dx += ddx; ddx += s.curve * 3;
    proj[n] = { s, a, b, clip: maxY };
    if (!a || !b || b.y >= maxY || a.y <= b.y) continue;
    const alt = ((base + n) >> 2) & 1;
    for (let y = Math.max(0, b.y); y < Math.min(a.y, maxY); y++) {
      const t = (a.y - y) / (a.y - b.y), cx = lerp(a.x, b.x, t), w = lerp(a.w, b.w, t);
      g.fillStyle = alt ? '#1a1e26' : '#161a22'; g.fillRect(0, y, NW, 1);
      g.fillStyle = alt ? '#c8302a' : '#ffffff'; g.fillRect(Math.round(cx - w * 1.12), y, Math.round(w * 2.24), 1);
      g.fillStyle = alt ? '#3a3a44' : '#36363f'; g.fillRect(Math.round(cx - w), y, Math.round(w * 2), 1);
      if (alt) { g.fillStyle = '#f6c645'; g.fillRect(Math.round(cx - w * .34 - w * .02), y, Math.max(1, Math.round(w * .016)), 1); g.fillRect(Math.round(cx + w * .34 - w * .02), y, Math.max(1, Math.round(w * .016)), 1); }
    }
    maxY = b.y;
  }
  // sprites far to near
  const drawAt = (n, frac, wx, img, scaleMul, lift) => { const pr = proj[n]; if (!pr || !pr.a || !pr.b) return; const sx = lerp(pr.a.x, pr.b.x, frac) + lerp(pr.a.w, pr.b.w, frac) * wx, sy = lerp(pr.a.y, pr.b.y, frac), sc = lerp(pr.a.sc, pr.b.sc, frac) * NW * 4.2 * (scaleMul || 1); const w = img.width * sc, h = img.height * sc; if (w < 1 || sy - h > pr.clip + 2) return; const clipH = Math.min(h, pr.clip - (sy - h) - (lift || 0) * sc); if (clipH <= 0) return; g.drawImage(img, 0, 0, img.width, img.height * clipH / h, Math.round(sx - w / 2), Math.round(sy - h - (lift || 0) * sc), Math.round(w), Math.round(clipH)); };
  for (let n = DRV.DRAW - 1; n >= 1; n--) {
    const s = segs[(base + n) % N];
    if (s.bridge && proj[n] && proj[n].a) { const pr = proj[n], y = pr.a.y, w = pr.a.w; if (y < pr.clip + 2) { const top = y - w * 1.4; g.fillStyle = '#5a5a66'; g.fillRect(0, Math.round(top), NW, Math.max(1, Math.round(w * .25))); g.fillStyle = '#7a7a86'; g.fillRect(0, Math.round(top), NW, Math.max(1, Math.round(w * .06))); g.fillStyle = '#4a4a56'; g.fillRect(Math.round(pr.a.x - w * 1.3), Math.round(top), Math.max(1, Math.round(w * .12)), Math.round(w * 1.4)); g.fillRect(Math.round(pr.a.x + w * 1.18), Math.round(top), Math.max(1, Math.round(w * .12)), Math.round(w * 1.4)); } }
    for (const sp of s.sprites) { const img = sp.k === 'neon' ? A.drive.neon[(S.t >> 4) & 1] : A.drive[sp.k]; drawAt(n, 0, sp.x, img, sp.k === 'store' ? 1.6 : 1); }
    const z1 = (base + n) * DRV.SEG;
    for (const it of D.items) if (!it.got && it.z >= z1 && it.z < z1 + DRV.SEG) drawAt(n, (it.z - z1) / DRV.SEG, it.x, it.k === 'gem' ? A.drive.gem[(S.t >> 3) & 3] : A.drive.cube, .7, 10);
    for (const gc of D.golds) if (!gc.got && gc.z >= z1 && gc.z < z1 + DRV.SEG) drawAt(n, (gc.z - z1) / DRV.SEG, gc.x, A.gold[(S.t >> 2) & 7], .9, 40);
    for (const tk of D.toks) if (!tk.got && tk.z >= z1 && tk.z < z1 + DRV.SEG) { const [c] = cameoIcon(tk.k, 40); drawAt(n, (tk.z - z1) / DRV.SEG, tk.x, c, .9, 8); }
    for (const c of D.cars) { const cz = ((c.z - z1) % D.L + D.L) % D.L; if (cz < DRV.SEG) drawAt(n, cz / DRV.SEG, c.x, A.drive.cars[c.spr], .75); }
  }
  // the Escalade
  const ew = A.drive.esc.width, eh = A.drive.esc.height, sc = 1, bob = (D.sp > 10 && (S.t & 4)) ? 1 : 0;
  const tilt = IN.ix * 3;
  g.globalAlpha = .4; g.fillStyle = '#000'; g.fillRect(Math.round(NW / 2 - ew * sc / 2 + 4), NH - 14, Math.round(ew * sc - 8), 4); g.globalAlpha = 1;
  g.drawImage(D.bump > 0 || IN.ix === 0 && D.sp < D.max * .6 ? A.drive.escB : A.drive.esc, Math.round(NW / 2 - ew * sc / 2 + tilt), Math.round(NH - eh * sc - 10 - bob - D.hop * .6), ew * sc, eh * sc);
  if (D.bump > 20 && (S.t & 2)) { g.fillStyle = '#f6c645'; for (let k = 0; k < 6; k++) g.fillRect(NW / 2 + (Math.random() - .5) * 90, NH - 40 + (Math.random() - .5) * 20, 2, 2); }
  // HUD
  const mid = NW / 2; g.drawImage(A.drive.gem[0], mid - 120, 4); drawTextO(g, String(D.ice), mid - 102, 8, '#bfe8ff', 1, '#0a0a14');
  g.drawImage(A.drive.cube, mid + 74, 5); drawTextO(g, String(D.cubes), mid + 90, 8, '#ffffff', 1, '#0a0a14');
  const pr = clamp(D.z / D.L, 0, 1); g.fillStyle = '#0a0a14'; g.fillRect(mid - 61, 10, 122, 4); g.fillStyle = '#4fe0ff'; g.fillRect(mid - 60, 11, Math.round(120 * pr), 2);
  drawTextO(g, Math.round(D.sp / D.max * 88) + ' MPH', mid - 18, 18, '#f6c645', 1, '#0a0a14');
  for (const q of S.parts) drawPart(q); drawBubbleScreen();
  if (D.t < 200) drawTextO(g, 'HOP OVER TRAFFIC!', mid - textW('HOP OVER TRAFFIC!') / 2, 30 + (S.t >> 4 & 1), '#ffffff', 1, '#0a0a14');
}
function drawShop(D) {
  g.fillStyle = '#14101e'; g.fillRect(0, 0, NW, NH); for (let i = 0; i < 30; i++) if ((S.t + i * 11) % 40 < 20) { g.fillStyle = '#ffffff'; g.fillRect((i * 71) % NW, (i * 37) % NH, 1, 1); }
  drawTextO(g, 'THE ICE BOX', NW / 2 - textW('THE ICE BOX', 2) / 2, 12, (S.t & 16) ? '#4fe0ff' : '#ffffff', 2, '#0a0a14');
  for (let i = 0; i < 3; i++) { const [x, y, w, h] = shopCard(i), sel = D.sel === i;
    g.fillStyle = sel ? '#4fe0ff' : '#2a3a5a'; g.fillRect(x - 2, y - 2, w + 4, h + 4); g.fillStyle = '#5a1a2a'; g.fillRect(x, y, w, h); g.fillStyle = '#7a2a3a'; g.fillRect(x, y, w, 3);
    const cx = x + w / 2, cy = y + 36; for (let k = 0; k <= 20; k++) { const a = Math.PI * k / 20; g.fillStyle = k % 2 ? '#fff3b0' : '#f6c645'; g.fillRect(Math.round(cx - Math.cos(a) * 26), Math.round(cy - 18 + Math.sin(a) * 22), i === 0 ? 3 : 2, i === 0 ? 3 : 2); }
    if (i === 0) { g.fillStyle = '#f6c645'; g.fillRect(cx - 4, cy + 4, 8, 8); g.fillStyle = '#fff3b0'; g.fillRect(cx - 2, cy + 6, 2, 2); }
    if (i === 1) { g.fillStyle = '#3fb04a'; g.fillRect(cx - 1, cy + 3, 3, 3); g.fillStyle = '#ff8a1c'; g.fillRect(cx - 2, cy + 6, 5, 4); g.fillRect(cx - 1, cy + 10, 3, 3); g.fillRect(cx, cy + 13, 1, 2); }
    if (i === 2) { g.fillStyle = '#ffffff'; g.fillRect(cx - 5, cy + 4, 10, 4); g.fillRect(cx - 3, cy + 8, 6, 3); g.fillRect(cx - 1, cy + 11, 2, 2); if (S.t & 8) { g.fillStyle = '#bff4ff'; g.fillRect(cx + 6, cy, 2, 2); g.fillRect(cx - 9, cy + 6, 2, 2); } }
    const lab = DRIPS[i][1]; drawTextO(g, lab, cx - textW(lab) / 2, y + h - 16, '#ffffff', 1, '#0a0a14'); }
  if (!D.chosen) drawTextO(g, 'TAP YOUR DRIP', NW / 2 - textW('TAP YOUR DRIP') / 2, NH - 22, (S.t & 16) ? '#ffffff' : '#f6c645', 1, '#0a0a14');
  else drawSpr(A.hero.cheer[(S.t >> 3) & 1], NW / 2, NH - 6, 0, 1, BAX, BAY);
  drawBubbleScreen();
}
function drawBubbleScreen() { for (const b of S.bubbles) { const lines = wrap(b.text, 26), w = Math.max(...lines.map(l => textW(l))) + 8, h = lines.length * 9 + 5, bx = Math.round(NW / 2 - w / 2), by = Math.round(NH * .62 - h); g.fillStyle = '#2a140c'; g.fillRect(bx - 1, by - 1, w + 2, h + 2); g.fillStyle = '#ffffff'; g.fillRect(bx, by, w, h); lines.forEach((l, i) => drawText(g, l, bx + 4, by + 3 + i * 9, '#2a140c')); } }
