/* ================= Georgia Buns — the game =================
   Physics rule: speed is sacred. Glancing hits deflect, small rocks get
   vaulted, big ones ricochet you into a tumble that lands on its feet. */

const NW = 424; let NH = 260;
const scr = mkC(NW, NH); let g = scr.getContext('2d');
const SAVE_KEY = 'georgiabuns.save.v1';
let SAVE = { easy: false, size: 'M', sound: true, best: { skips: 0, carrots: 0, cousins: 0 }, runs: 0, days: {}, stickers: {} };
function loadSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s && typeof s === 'object') SAVE = Object.assign(SAVE, s, { best: Object.assign({}, SAVE.best, s.best || {}), days: s.days || {}, stickers: s.stickers || {} }); } catch (e) {}
  if (SAVE.runs && !SAVE.days.creek) SAVE.days.creek = { done: true, gold: [false, false, false] };
  fixSaga(); }
function dayRec(id) { return SAVE.days[id] || (SAVE.days[id] = { done: false, gold: [false, false, false], best: 0 }); }
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) {} }

const A = {};
function buildAssets() {
  A.hero = buildBun('hero', { pendant: 1 });
  A.roof = buildBun('gray', { shades: 1 });
  A.nib = buildBun('tan', { teeth: 1 });
  A.cuz = {}; for (const f of ['white', 'ginger', 'dark', 'smoke', 'honey']) A.cuz[f] = buildBun(f);
  A.carrot = carrotFrames(); A.rock = rockItemSpr(0); A.rockG = rockItemSpr(1);
  A.spring = [springSpr(0), springSpr(1)]; A.boulder = {}; A.acorn = acornSpr();
  A.phone = [phoneSpr(0), phoneSpr(1)]; A.spark = [0, 1, 2, 3].map(sparkleSpr);
  A.flat = flatRockSpr(); A.jam = [logJamSpr(0), logJamSpr(1)];
  A.bob = bobcatFrames(); A.sq = squirrelFrames(); A.otter = otterFrames(); A.fox = foxFrames();
  A.esc = escaladeSpr(0); A.escL = escaladeSpr(1);
  { const f = new Spr(12, 16); f.rect(4, 0, 3, 8, 2); f.rect(3, 6, 7, 7, 2); f.rect(7, 5, 2, 3, 2); f.rect(9, 6, 2, 3, 2); f.rect(2, 8, 2, 3, 2); f.rect(4, 12, 6, 3, 3); f.rect(5, 1, 1, 2, 4); A.finger = f.outline(1).canvas(palette(['#2a140c', '#ffe0c0', '#e8b890', '#ffffff'])); }
  buildProps(); buildAssets2();
}
function boulderC(r) { return A.boulder[r] || (A.boulder[r] = boulderSpr(r)); }

const IN = { ix: 0, iy: 0, jump: false, jumpP: false, press: false, tapX: null, tapY: null };
function heroSet() { if (MISSION && MISSION.runner != null) return famSet(MISSION.runner); return LV && LV.hero ? A[LV.hero] : A.hero; }
const PH = { ACC: .09, DEC: .55, FRC: .07, TOP: 6.6, MAXS: 15, SLP: .14, SLPUP: .08, SLPDN: .32, RFRC: .028, RDEC: .13, AIR: .14, GRV: .22, JMP: 6.7, JCUT: 4 };
let S = null;

function newGame(mode, day) {
  day = day || (S && S.day) || 'creek'; loadLevel(day);
  const L = LV.objects(); L.golds = L.golds || []; L.cameos = L.cameos || []; L.decor = L.decor || []; L.ferns = L.ferns || [];
  S = {
    mode: mode || 'title', day, t: 0, L, golds: 0, found: [], carrots: 0, rocks: [false, false, false], woke: 0, crew: 0, shake: 0,
    pl: { x: LV.start, y: groundY(LV.start), prevX: LV.start, prevY: groundY(LV.start), vx: 0, vy: 0, gsp: 0, ground: true, surf: 'g', ang: 0, face: 1, roll: false, ball: false, jumping: false, crouch: false, charge: 0,
      tumble: 0, inv: 0, spring: 0, springCD: 0, skid: 0, animPh: 0, lt: 0, inWater: false, look: 0, throwT: 0, idleT: 0 },
    cam: { x: 330 - NW / 2, y: 330 - NH * .55 }, lead: 0, parts: [], scat: [], bubbles: [], sayQ: [], card: null, acorns: [], hist: [],
    bob: { state: 'sleep', x: 5112, y: 222, v: 0, vx: 0, vy: 0, t: 0, face: 1, tx: 7620 },
    jam: { open: false, tries: 0, wait: 0, nib: 0, said: 0 },
    otter: { x: 8200, t: 0, gave: false, said: false, sq: 0, cool: 0 },
    amb: [0, 1, 2, 3].map(i => ({ k: 'fly', x: 320 + i * 190, y: 260 - i * 7, ph: i * 1.7, c: ['#ff9a3a', '#fff3b0', '#ffffff', '#ff9a3a'][i] })).concat([0, 1, 2].map(i => ({ k: 'drag', x: 8100 + i * 260, y: 540 - i * 12, ph: i * 2.1 })), [0, 1, 2].map(i => ({ k: 'fly', x: 2000 + i * 1500, y: groundY(2000 + i * 1500) - 40, ph: i, c: '#fff3b0' }))),
    sunny: { said: 0, cool: 0 }, foxSaid: false, roofSaid: 0, thr: null, cook: null, fade: 0, fadeTo: null, intro: 0, payFlash: 0, pick: 0
  };
  if (S.mode === 'title') { S.cam.x = 190; S.cam.y = 300 - NH * .8; }
  if (LV.init) LV.init(S);
}

/* ---------- helpers ---------- */
// lines stay up long enough to read (about 3.4 frames a letter after the typing finishes) and wait their turn
function readTime(text, dur) { return Math.max(dur || 150, 90 + text.length * 3.6); }
function say(who, text, dur) {
  const d = readTime(text, dur), busy = S.bubbles.find(b => b.who === who && b.t < b.dur * .75);
  if (busy || S.bubbles.length >= 2) { if (!S.sayQ.some(q => q.text === text)) S.sayQ.push({ who, text, dur: d, at: S.t }); return; }
  S.bubbles = S.bubbles.filter(b => b.who !== who); S.bubbles.push({ who, text, t: 0, dur: d });
}
function stepSay() {
  S.sayQ = S.sayQ.filter(q => S.t - q.at < 600);
  for (let i = 0; i < S.sayQ.length; i++) { const q = S.sayQ[i]; if (S.bubbles.length >= 2 || S.bubbles.some(b => b.who === q.who && b.t < b.dur * .75)) continue; S.sayQ.splice(i, 1); S.bubbles = S.bubbles.filter(b => b.who !== q.who); S.bubbles.push({ who: q.who, text: q.text, t: 0, dur: q.dur }); break; }
}
function part(o) { S.parts.push(Object.assign({ life: 30, t: 0, vx: 0, vy: 0, g: 0 }, o)); }
function dust(x, y, n, sp) { for (let i = 0; i < n; i++) part({ type: 'dust', x: x + (Math.random() - .5) * 8, y: y - 2, vx: (Math.random() - .5) * (sp || 2), vy: -Math.random() * 1.2, life: 18 + Math.random() * 10 }); }
function sparkle(x, y) { part({ type: 'spark', x, y, life: 16 }); }
function chips(x, y, n, col) { for (let i = 0; i < n; i++) part({ type: 'chip', x, y, vx: (Math.random() - .5) * 6, vy: -Math.random() * 5 - 1, g: .25, life: 40, col }); }
function splash(x, y, n) { for (let i = 0; i < n; i++) part({ type: 'drop', x: x + (Math.random() - .5) * 10, y, vx: (Math.random() - .5) * 3, vy: -Math.random() * 4 - 1, g: .22, life: 40 }); part({ type: 'ring', x, y, life: 30 }); }
function popText(x, y, s, col) { part({ type: 'text', x, y, s, col: col || '#fff3b0', vy: -.35, life: 90 }); }
function surfAt(s, x) { return s === 'g' ? groundY(x) : platY(s, x); }
function slopeAng(s, x) { const a = surfAt(s, x - 3), b = surfAt(s, x + 3); if (a == null || b == null) return 0; return Math.atan2(b - a, 6); }
function bodyC(p) { const a = p.ang; return [p.x + Math.sin(a) * 11, p.y - Math.cos(a) * 11]; }
function plSpeed(p) { return p.surf === 'loop' || p.ground ? Math.abs(p.gsp) : Math.hypot(p.vx, p.vy); }
function airborne(p, vx, vy) { p.ground = false; p.surf = null; p.vx = vx; p.vy = vy; }
function curVel(p) { return p.ground ? [p.gsp * Math.cos(p.ang), p.gsp * Math.sin(p.ang)] : [p.vx, p.vy]; }

/* ---------- player ---------- */
function stepPlayer() {
  const p = S.pl, crew = S.crew > 0;
  const TOP = p.inWater ? 2.6 : (crew ? 9.5 : PH.TOP), ACC = p.inWater ? .06 : (crew ? .17 : PH.ACC);
  const ix = IN.ix, iy = IN.iy;
  if (p.tumble > 0) p.tumble--; if (p.inv > 0) p.inv--; if (p.spring > 0) p.spring--; if (p.springCD > 0) p.springCD--; if (p.skid > 0) p.skid--; if (p.throwT > 0) p.throwT--;
  p.prevX = p.x; p.prevY = p.y;
  if (p.climb) {
    const c = p.climb; p.y -= IN.jump ? 3.8 : 2.7; p.x = c.x; p.ang = 0; p.face = 1;
    if (S.t % 10 === 0) { part({ type: 'chip', x: p.x + 6, y: p.y - 6, vx: Math.random() - .2, vy: -1, g: .2, life: 30, col: '#c87a56' }); }
    if (ix < -.6) { p.climb = null; airborne(p, -2.5, -2); }
    else if (p.y <= c.top + 1) { p.climb = null; p.x = c.x + 14; p.y = groundY(p.x); p.ground = true; p.surf = 'g'; p.gsp = 3.5; dust(p.x, p.y, 5, 2); sfx('land'); }
  }
  else if (p.surf === 'loop') { loopStep(p, ix, ACC, TOP); }
  else if (p.ground) groundStep(p, ix, iy, ACC, TOP);
  else airStep(p, ix, iy, TOP);
  if (p.surf !== 'loop' && !p.climb) collide(p);
  // water
  const wasW = p.inWater;
  p.inWater = p.x > WATER.x0 && p.x < WATER.x1 && p.y > WATER.y - 4;
  if (p.inWater && !wasW) { splash(p.x, WATER.y, 10); sfx('splash'); }
  // world edges bounce, never stop
  if (p.x < 24) { p.x = 24; if (p.ground) p.gsp = Math.abs(p.gsp) * .5; else p.vx = Math.abs(p.vx) * .5; }
  if (p.x > WW - 140) { p.x = WW - 140; if (p.ground) p.gsp = -Math.abs(p.gsp) * .5; else p.vx = -Math.abs(p.vx) * .5; }
  if (p.y > WBOT - 20) { p.y = groundY(p.x); p.ground = true; p.surf = 'g'; }
  // anim
  const sp = plSpeed(p);
  p.animPh += Math.max(.1, sp * .05);
  if (Math.abs(p.gsp) < .15 && p.ground && !p.crouch) p.idleT++; else p.idleT = 0;
  p.look = (p.ground && iy < -.55 && Math.abs(p.gsp) < .3) ? Math.min(60, p.look + 2) : Math.max(0, p.look - 4);
  if (p.ground && sp > 7 && S.t % 3 === 0 && !p.inWater) dust(p.x - p.face * 10, p.y, 1, 1.5);
  S.hist.push([p.x, p.y, p.ang, p.face]); if (S.hist.length > 120) S.hist.shift();
}
function groundStep(p, ix, iy, ACC, TOP) {
  const s = p.surf, a = slopeAng(s, p.x); p.ang = a; const sa = Math.sin(a);
  if (p.roll) p.gsp += (sgn(p.gsp) === sgn(sa) ? PH.SLPDN : PH.SLPUP) * sa;
  else if (Math.abs(p.gsp) > .05 || Math.abs(sa) > .2) p.gsp += PH.SLP * sa;
  // crouch / spin launch
  if (!p.roll) {
    if (iy > .55 && Math.abs(p.gsp) < 1.2 && Math.abs(ix) < .5) {
      if (!p.crouch) { p.crouch = true; p.charge = 0; }
      p.gsp *= .8;
      if (IN.jumpP) { p.charge = Math.min(p.charge + 2.4, 9); sfx('rev', p.charge); IN.jumpP = false; dust(p.x - p.face * 8, p.y, 3, 3); }
      p.charge *= .99;
    } else if (p.crouch) {
      if (p.charge > .5) { p.roll = true; p.gsp = p.face * (8 + p.charge * .65); sfx('launch'); dust(p.x - p.face * 6, p.y, 8, 4); }
      p.crouch = false; p.charge = 0;
    }
    if (!p.crouch && iy > .55 && Math.abs(p.gsp) >= 1.2) { p.roll = true; sfx('roll'); }
  }
  if (!p.crouch) {
    if (p.roll) {
      if (ix * p.gsp < 0 && Math.abs(ix) > .2) p.gsp -= sgn(p.gsp) * PH.RDEC * Math.abs(ix);
      p.gsp -= Math.min(Math.abs(p.gsp), PH.RFRC) * sgn(p.gsp);
      if (Math.abs(p.gsp) < .5) p.roll = false;
      if (p.gsp) p.face = sgn(p.gsp);
    } else {
      const m = Math.abs(ix);
      if (m > .15) {
        const d = sgn(ix), cap = TOP * Math.max(m, .55);
        if (p.gsp * d < 0) { p.gsp += d * PH.DEC * Math.max(m, .6); if (Math.abs(p.gsp) > 2.6 && !p.skid) { p.skid = 10; sfx('roll'); } if (S.t % 3 === 0) dust(p.x, p.y, 1, 1); }
        else { if (Math.abs(p.gsp) < cap) p.gsp = d * Math.min(Math.abs(p.gsp) + ACC * (.45 + m * .55), cap); p.face = d; }
      } else p.gsp -= Math.min(Math.abs(p.gsp), (LV.slick && LV.slick(p.x)) ? .012 : PH.FRC) * sgn(p.gsp);
    }
  }
  if (p.inWater && Math.abs(p.gsp) > TOP + .4) p.gsp *= .93;
  if (!p.roll && Math.abs(p.gsp) > TOP + .5 && sgn(sa) !== sgn(p.gsp)) p.gsp -= sgn(p.gsp) * .035; // drift back to cruising speed on flats
  p.gsp = clamp(p.gsp, -PH.MAXS, PH.MAXS);
  // jump (straight off the slope)
  if (IN.jumpP && !p.crouch) {
    const J = p.inWater ? 4.4 : PH.JMP; IN.jumpP = false;
    airborne(p, p.gsp * Math.cos(a) + J * Math.sin(a), p.gsp * Math.sin(a) - J * Math.cos(a));
    p.jumping = true; p.ball = true; p.roll = false; sfx('jump'); return;
  }
  const nx = p.x + p.gsp * Math.cos(a);
  if (LOOP && s === 'g' && p.gsp > 0 && p.x < LOOP.cx && nx >= LOOP.cx) { p.surf = 'loop'; p.lt = 0; p.x = LOOP.cx; p.y = LOOP.cy + LOOP.R; return; }
  const ny = surfAt(s, nx);
  if (ny != null && s === 'g' && p.y - ny > Math.max(12, Math.abs(p.gsp) * 1.3)) { // a cliff face, not a slope
    if (LV.climb && nx > p.x) { startClimb(p); return; }
    p.gsp = -p.gsp * .4; sfx('bonk'); return;
  }
  if (ny == null) { airborne(p, p.gsp * Math.cos(a), p.gsp * Math.sin(a)); p.x = nx; p.ball = p.roll; return; }
  const expect = p.y + p.gsp * Math.sin(a);
  if (ny - expect > 4 && Math.abs(p.gsp) > 8.5) { airborne(p, p.gsp * Math.cos(a), p.gsp * Math.sin(a)); p.x = nx; p.y = expect; p.ball = p.roll; return; }
  p.x = nx; p.y = ny;
}
function airStep(p, ix, iy, TOP) {
  if (Math.abs(ix) > .15) { const d = sgn(ix); if (p.vx * d < TOP) p.vx += d * PH.AIR * Math.abs(ix); p.face = d; }
  if (p.jumping && !IN.jump && p.vy < -PH.JCUT) p.vy = -PH.JCUT;
  p.vy += p.inWater ? .12 : PH.GRV; if (p.vy > 12) p.vy = 12;
  if (Math.abs(p.vx) > TOP + .5) p.vx *= .996;
  p.ang *= .85;
  p.x += p.vx; p.y += p.vy;
  // landing: solid ground, or one-way platforms from above
  const gy = groundY(p.x); let land = null, ly = 0;
  if (p.y - gy > 16 && p.prevY > gy + 4) { if (LV.climb && p.vx >= 0) { p.x = p.prevX; startClimb(p); return; } p.x = p.prevX; p.vx = -p.vx * .3; return; }
  if (p.y >= gy) { land = 'g'; ly = gy; }
  if (p.vy >= 0) for (const pl of PLATS) { const py = platY(pl, p.x); if (py != null && p.prevY <= py + 2 && p.y >= py && (land == null || py < ly)) { land = pl; ly = py; } }
  if (!land) return;
  if (p.tumble > 0 && p.vy > 3.4) { p.y = ly - 1; p.vy = -p.vy * .38; sfx('bounce'); dust(p.x, ly, 4, 2); return; }
  const a = slopeAng(land, p.x);
  p.y = ly; p.ground = true; p.surf = land; p.ang = a; p.jumping = false; p.ball = false; p.tumble = 0;
  p.gsp = p.vx * Math.cos(a) + p.vy * Math.sin(a);
  if (Math.abs(p.gsp) < Math.abs(p.vx) * .6 && Math.abs(p.vx) > 2) p.gsp = p.vx * .8; // keep the run going on rough landings
  p.roll = IN.iy > .55 && Math.abs(p.gsp) > 1.2;
  if (p.vy > 4) { dust(p.x, ly, 5, 2.5); sfx('land'); }
}
function loopStep(p, ix, ACC, TOP) {
  const L = LOOP;
  p.gsp -= PH.GRV * Math.sin(p.lt);
  if (ix > .15 && p.gsp < TOP) p.gsp += ACC * ix;
  if (ix < -.15) p.gsp -= PH.DEC * .3 * -ix;
  p.roll = p.roll && Math.abs(p.gsp) > .5;
  if (Math.cos(p.lt) < 0 && p.gsp * p.gsp / L.R < -PH.GRV * Math.cos(p.lt) * .9) {
    const t = p.lt; airborne(p, p.gsp * Math.cos(t), -p.gsp * Math.sin(t)); p.ball = true; return;
  }
  if (IN.jumpP) { IN.jumpP = false; const t = p.lt, J = PH.JMP; airborne(p, p.gsp * Math.cos(t) - J * Math.sin(t), -p.gsp * Math.sin(t) - J * Math.cos(t)); p.ball = true; p.jumping = true; sfx('jump'); return; }
  p.lt += p.gsp / L.R;
  if (p.lt >= Math.PI * 2) { p.surf = 'g'; p.x = L.cx + (p.lt - Math.PI * 2) * L.R + 1; p.y = groundY(p.x); p.ang = 0; popText(p.x, p.y - 40, 'LOOP!'); return; }
  if (p.lt <= 0) { p.surf = 'g'; p.x = L.cx + p.lt * L.R - 1; p.y = groundY(p.x); p.ang = 0; return; }
  p.x = L.cx + L.R * Math.sin(p.lt); p.y = L.cy + L.R * Math.cos(p.lt); p.ang = -p.lt;
  if (p.gsp) p.face = 1;
}
function collide(p) {
  const r = (p.roll || p.ball) ? 8 : 9;
  for (const b of S.L.boulders) {
    if (b.broken || Math.abs(b.x - p.x) > 60) continue;
    let [cx, cy] = bodyC(p);
    const dx = cx - b.x, dy = cy - b.y, d = Math.hypot(dx, dy), R = b.r + r;
    if (d >= R || d < .01) continue;
    const [vx, vy] = curVel(p), speed = Math.hypot(vx, vy);
    if (S.crew > 0 || ((p.roll || p.ball) && speed > 4.5 && b.r <= 16)) {
      b.broken = true; chips(b.x, b.y, 14, '#8a8f96'); chips(b.x, b.y, 6, '#4f6a3a'); sfx('smash'); S.shake = 6; popText(b.x, b.y - 20, 'SMASH!'); continue;
    }
    const nx = dx / d, ny = dy / d, pen = R - d;
    p.x += nx * pen; p.y += ny * pen;
    const vn = vx * nx + vy * ny;
    if (vn >= 0) continue;
    if (ny < -.55) { airborne(p, vx, -Math.max(4.6, Math.abs(vn) * .7)); p.ball = true; sfx('bounce'); }
    else if (b.r <= 16 && speed > 2.2) { airborne(p, vx * .93, -4.9); p.ball = true; sfx('bounce'); }
    else if (speed > 7.2) { airborne(p, vx * .85, -6.6); p.ball = true; sfx('bounce'); popText(p.x, p.y - 40, 'VAULT!'); }
    else { const out = Math.max(2.6, speed * .55); airborne(p, nx * out, -3.7); p.tumble = 44; p.ball = true; p.face = sgn(vx) || p.face; sfx('bonk'); S.shake = 4; dust(cx, cy, 5, 3); }
  }
  // the Nibbin' Bun's log jam
  const J = S.jam;
  if (LV.id === 'creek' && !J.open) {
    const [cx, cy] = bodyC(p), x0 = 4320, x1 = 4372;
    if (cx + r > x0 && cx - r < x1 && cy > 280) {
      if (S.crew > 0) { openJam('smash'); return; }
      const [vx] = curVel(p), sp = Math.abs(vx);
      if (cx < (x0 + x1) / 2) p.x -= (cx + r - x0); else p.x += (x1 - (cx - r));
      const out = Math.max(2.8, sp * .5), dir = cx < (x0 + x1) / 2 ? -1 : 1;
      airborne(p, dir * out, -3.6); p.tumble = 40; p.ball = true; sfx('bonk'); S.shake = 4;
      J.tries++;
      if (J.tries >= 3) openJam('free'); else say('nib', S.carrots >= 10 ? 'HOLD UP, LET ME NIB.' : 'TEN CARROTS AND I NIB THROUGH. CARROTPAY ME.', 170);
    }
  }
}
function openJam(how) {
  const J = S.jam; if (J.open) return; J.open = true; J.nib = 90;
  chips(4346, 320, 26, '#a07450'); chips(4346, 340, 10, '#d8b080'); sfx('crunch'); S.shake = 5;
  const rk = S.L.rocks[1]; rk.shown = true; rk.y = groundY(4346) - 30; rk.vy = -3; rk.fall = true;
  if (how === 'pay') { S.carrots -= 10; S.payFlash = 70; sfx('pay'); popText(S.pl.x, S.pl.y - 46, '-10 CARROTPAY', '#7ad050'); say('nib', 'PAYMENT RECEIVED. NOM NOM NOM.', 150); }
  else if (how === 'smash') say('nib', 'Y\'ALL JUST WENT THROUGH IT?!', 150);
  else say('nib', 'AW, FORGET IT. I\'M HUNGRY ANYWAY.', 160);
}

/* ---------- world objects ---------- */
function stepWorld() {
  const p = S.pl, L = S.L, [pcx, pcy] = bodyC(p);
  if (S.crew > 0) { S.crew--; if (S.crew === 0) auMode(S.bob.state === 'chase' ? 'chase' : zoneMusic()); }
  if (!S.crew && !['drop', 'chase', 'eat', 'swat', 'dizzy'].includes(S.bob.state) && !S.musicLock) auMode(zoneMusic());
  if (S.payFlash > 0) S.payFlash--; if (S.easyHint > 0) { S.easyHint--; if ([...PTR.values()].some(q => q.kind === 'follow')) S.easyHint = Math.min(S.easyHint, 40); }
  if (S.shake > 0) S.shake--;
  // carrots
  for (const c of L.carrots) {
    if (c.got) { if (c.respawn && --c.t <= 0) { c.got = false; sparkle(c.x, c.y); } continue; }
    if (Math.abs(c.x - pcx) < 15 && Math.abs(c.y - pcy) < 17) { c.got = true; c.t = c.respawn; S.carrots++; S.pick ^= 1; sfx('carrot', S.pick); sparkle(c.x, c.y); }
  }
  for (const c of S.scat) {
    c.t++; c.vy += .2; c.x += c.vx; c.y += c.vy; const gy = groundY(c.x); if (c.y > gy - 6) { c.y = gy - 6; c.vy *= -.62; c.vx *= .85; }
    if (c.t > 36 && Math.abs(c.x - pcx) < 15 && Math.abs(c.y - pcy) < 18) { c.dead = true; S.carrots++; S.pick ^= 1; sfx('carrot', S.pick); sparkle(c.x, c.y); }
    if (c.t > 300) c.dead = true;
  }
  S.scat = S.scat.filter(c => !c.dead);
  // springs
  for (const sp of L.springs) {
    if (sp.t > 0) sp.t--;
    if (p.springCD || Math.abs(p.x - sp.x) > 17 || p.y < sp.y - 15 || p.y > sp.y + 3) continue;
    if (p.ground || p.vy > 0) { const vx = p.ground ? p.gsp * Math.cos(p.ang) : p.vx; airborne(p, vx, -10.3); p.ball = false; p.spring = 34; p.springCD = 14; p.jumping = false; sp.t = 10; sfx('spring'); dust(sp.x, sp.y, 4, 2); }
  }
  // rocks (the day's whole point)
  for (const rk of L.rocks) {
    if (!rk.shown || rk.got) continue;
    if (rk.fall) { rk.vy += .25; rk.y += rk.vy; const gy = groundY(rk.x) - 6; if (rk.y > gy) { rk.y = gy; rk.vy *= -.4; if (Math.abs(rk.vy) < 1) rk.fall = false; } }
    if (Math.abs(rk.x - pcx) < 16 && Math.abs(rk.y - pcy) < 20) {
      rk.got = true; S.rocks[rk.id] = true; sfx('rock'); for (let i = 0; i < 4; i++) sparkle(rk.x + (Math.random() - .5) * 16, rk.y + (Math.random() - .5) * 10);
      const n = S.rocks.filter(Boolean).length; say('hero', LV.itemLines[n - 1] || 'NICE.', 110); if (LV.onItem) LV.onItem(S, rk);
      if (rk.id === 0 && LV.id === 'creek') setTimeout(() => S && say('roof', 'TOLD YOU. FLAT AS A PANCAKE.', 140), 900);
    }
  }
  // pebble phone: call the cousins
  for (const tk of L.tokens) if (!tk.got && Math.abs(tk.x - pcx) < 18 && Math.abs(tk.y - pcy) < 20) {
    tk.got = true; S.crew = 600; sfx('crew'); auMode('crew'); say('hero', 'CUZ! PULL UP!', 100); for (let i = 0; i < 6; i++) sparkle(tk.x + (Math.random() - .5) * 20, tk.y + (Math.random() - .5) * 20);
  }
  // sleeping cousins
  for (const c of L.cousins) {
    if (c.woke) { c.t++; continue; }
    if (Math.abs(c.x - pcx) < 22 && Math.abs(c.y - 8 - pcy) < 22) { c.woke = true; c.t = 0; S.woke++; sfx('wake'); if (c.dazed) { say(c, ['MY BAD. RIGHT BEHIND YOU.', 'WHICH WAY? OH. THAT WAY.', 'I WAS LOOKING AT A BUTTERFLY.'][S.woke % 3], 110); continue; } say(c, ['COOKOUT AT SUNDOWN? I\'M THERE.', 'HUH? OH, BET. SEE YOU TONIGHT.', 'WAS JUST RESTING MY EYES.', 'SAVE ME SOME COLLARDS.', 'IS IT RIBS? I\'M COMING.'][S.woke - 1] || 'I\'M UP, I\'M UP.', 150); }
  }
  // golden carrots and cameos (the secrets)
  for (let i = 0; i < L.golds.length; i++) { const gc = L.golds[i]; if (gc.got) continue; if (Math.abs(gc.x - pcx) < 16 && Math.abs(gc.y - pcy) < 18) { gc.got = true; S.golds++; dayRec(S.day).gold[i] = true; writeSave(); sfx('rock'); sfx('crew'); for (let k = 0; k < 8; k++) sparkle(gc.x + (Math.random() - .5) * 24, gc.y + (Math.random() - .5) * 20); popText(gc.x, gc.y - 22, 'GOLDEN CARROT!', '#f6c645'); } }
  for (const cm of L.cameos) { if (cm.seen) continue; if (Math.abs(cm.x - pcx) < (cm.r || 22) && Math.abs(cm.y - pcy) < (cm.r || 26)) { cm.seen = true; const first = !SAVE.stickers[cm.k]; SAVE.stickers[cm.k] = true; writeSave(); S.found.push(cm.k); sfx('wake'); popText(cm.x, cm.y - 30, (first ? 'NEW STICKER: ' : '') + CAMEOS[cm.k].name, '#7ad050'); if (CAMEOS[cm.k].line) say(cm, CAMEOS[cm.k].line, 150); } }
  if (LV.id !== 'creek') { if (LV.step) LV.step(S, p); if (LV.finale === 'goal' && S.mode === 'play' && p.x >= LV.goal) startGoal(); if (S.t % 14 === 0 && LV.leaves) part({ type: 'leaf', x: S.cam.x + Math.random() * NW, y: S.cam.y - 6, vx: -.4 - Math.random() * .5, vy: .5 + Math.random() * .4, life: 260, ph: LV.leaves === 'petal' ? 9 : Math.random() * 6 }); return; }
  // the Roof Bun
  if (!S.roofSaid && S.t > 40 && p.x < 900) { S.roofSaid = 1; say('roof', 'UP HERE, CUZ! FOUND A GOOD ONE.', 220); }
  // Sunny: rowdy near her tree means acorns
  const sn = S.sunny; if (sn.cool > 0) sn.cool--;
  if (p.x > 680 && p.x < 870 && plSpeed(p) > 4.6 && sn.cool === 0 && !perk('realeyes')) {
    sn.cool = 55; S.acorns.push({ x: clamp(p.x + (p.ground ? p.gsp : p.vx) * 26, 690, 860), y: 112, vy: 0, warn: 30 });
    if (sn.said < 2) { say('sunny', sn.said ? 'I SAID SLOW DOWN.' : 'SLOW DOWN, BOYS.', 120); sn.said++; }
  }
  for (const a of S.acorns) {
    if (a.warn > 0) { a.warn--; continue; }
    a.vy += .32; a.y += a.vy; if (a.rest) a.x += a.rest;
    const gy = groundY(a.x) - 4;
    if (!a.hit && Math.abs(a.x - pcx) < 12 && Math.abs(a.y - pcy) < 14 && p.inv === 0) {
      a.hit = true; a.vy = -3; a.rest = 1.5; sfx('bonk'); popText(p.x, p.y - 44, 'BONK'); p.inv = 50;
      const [vx] = curVel(p); airborne(p, vx * .9, -3.2); p.tumble = 20; p.ball = true;
    }
    if (a.y > gy) { a.y = gy; a.vy *= -.35; a.rest = (a.rest || (Math.random() - .5) * 2) * .9; a.n = (a.n || 0) + 1; }
    if (a.n > 3) a.dead = true;
  }
  S.acorns = S.acorns.filter(a => !a.dead);
  // fox
  if (!S.foxSaid && Math.abs(p.x - 3470) < 140) { S.foxSaid = true; say('fox', 'CREEK\'S THAT WAY. KEEP ON.', 160); }
  // Nibbin' Bun and the jam
  const J = S.jam; if (J.nib > 0) J.nib--;
  if (!J.open && p.x > 4130 && p.x < 4320) {
    if (S.carrots >= 10) openJam('pay');
    else { J.wait++; if (!J.said) { J.said = 1; say('nib', 'TEN CARROTS AND I NIB THROUGH. CARROTPAY ME.', 170); } if (J.wait > 480) openJam('free'); }
  }
  stepBobcat();
  stepOtter();
  // finale trigger: standing on the big flat rock
  if (p.ground && p.surf === PLATS[5] && S.mode === 'play' && !(MISSION && MISSION.noThrow)) startThrow();
  if (S.mode === 'play' && p.x > 8990 && !S.fadeTo && !(MISSION && MISSION.noThrow)) { S.fadeTo = 'rock'; say('otter', 'OTHER SIDE, CUZ. I GOT YOU.', 120); }
  for (const c of S.amb) { c.ph += .05; if (c.k === 'fly') { c.x += Math.sin(c.ph * .7) * .7 + .15; c.y += Math.cos(c.ph * 1.3) * .5; } else { c.x += Math.sin(c.ph * .4) * 1.6; c.y += Math.sin(c.ph * 2.2) * .4; } }
  // ambient leaves and fireflies
  if (S.t % 14 === 0 && p.x > 1000 && p.x < 7900) part({ type: 'leaf', x: S.cam.x + Math.random() * NW, y: S.cam.y - 6, vx: -.4 - Math.random() * .5, vy: .5 + Math.random() * .4, life: 260, ph: Math.random() * 6 });
}
function stepBobcat() {
  const b = S.bob, p = S.pl;
  if (b.t > 0) b.t--;
  switch (b.state) {
    case 'sleep':
      if (S.t % 50 === 0) part({ type: 'z', x: b.x + 14, y: b.y - 18, vx: .3, vy: -.4, life: 60 });
      if (p.x > 5185 && p.x < 5900) { b.state = 'drop'; b.vy = -2.5; b.vx = 1.2; sfx('growl'); say('bob', 'MRRRAOW!', 90); auMode('chase'); }
      break;
    case 'drop':
      b.vy += .3; b.x += b.vx; b.y += b.vy;
      if (b.y >= groundY(b.x)) { b.y = groundY(b.x); b.state = 'chase'; b.v = 2.5; }
      break;
    case 'chase': {
      const dx = p.x - b.x, ps = plSpeed(p);
      let want = clamp(ps * .96 + .8, 4.4, 10.5); if (dx > 250) want = ps + 2.2; if (dx < -30) want = 3;
      b.v = lerp(b.v, want * (dx >= 0 ? 1 : -1), .08); b.x += b.v; b.face = b.v >= 0 ? 1 : -1;
      b.y = groundY(b.x) - Math.abs(Math.sin(b.x * .045)) * 3;
      if (Math.abs(dx) < 22 && Math.abs((p.y - 12) - (b.y - 12)) < 26) catchBun();
      if (p.x > 7700) endChase();
      break; }
    case 'eat':
      for (const c of S.scat) if (c.t > 20 && Math.abs(c.x - b.x) < 60 && Math.random() < .05) { c.dead = true; sfx('crunch'); }
      if (S.t % 40 === 0) part({ type: 'text', x: b.x + 10, y: b.y - 30, s: 'NOM', col: '#f4e6c6', vy: -.5, life: 40 });
      if (b.t <= 0) { if (p.x > 7700) endChase(); else { b.state = 'chase'; say('bob', 'DOOO BA DEE...', 80); } }
      break;
    case 'dizzy':
      b.x += b.vx; b.vx *= .94; b.y = groundY(b.x);
      if (b.t <= 0) { if (p.x > 7700) endChase(); else b.state = 'chase'; }
      break;
    case 'swat':
      b.y = groundY(b.x); if (b.t <= 0) { if (p.x > 7700) endChase(); else b.state = 'chase'; }
      break;
    case 'done':
      if (Math.abs(b.tx - b.x) > 3) { b.x += sgn(b.tx - b.x) * 3; b.face = sgn(b.tx - b.x); b.y = groundY(b.x); } else { b.sit = true; b.face = -1; }
      if (S.t % 260 === 0 && Math.abs(p.x - b.x) < 300) say('bob', 'DOOO BA DEE DA DEE BA DA DOOO', 160);
      break;
  }
}
function endChase() { const b = S.bob; if (b.state === 'done') return; b.state = 'done'; say('bob', 'DOOO BA DEE DA DEE BA DA DOOO', 170); if (!S.crew) auMode(zoneMusic()); }
function catchBun() {
  const b = S.bob, p = S.pl;
  if (S.crew > 0) { b.state = 'dizzy'; b.t = 150; b.vx = -5; say('bob', 'MREOW?!', 90); sfx('bonk'); S.shake = 5; popText(b.x, b.y - 40, 'CREW!'); return; }
  if (p.inv > 0) return;
  const [vx] = curVel(p), dir = sgn(p.x - b.x) || 1;
  if (S.carrots > 0) {
    const n = Math.min(S.carrots, 24); S.carrots = 0;
    for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i % 2 ? 1 : -1) * (.3 + (i >> 1) * .22), sp = 3 + (i % 3); S.scat.push({ x: p.x, y: p.y - 14, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0 }); }
    airborne(p, Math.abs(vx) > 3 ? vx : dir * 4, -4.4); p.tumble = 30; p.inv = 120; p.ball = true;
    b.state = 'eat'; b.t = 170; b.v = 0; say('bob', 'DOOO BA DEE... CARROTS.', 120); sfx('hurt'); S.shake = 6;
  } else {
    airborne(p, dir * 7.5, -4.8); p.tumble = 30; p.inv = 100; p.ball = true;
    b.state = 'swat'; b.t = 90; b.v = 0; say('bob', 'BAP.', 70); sfx('bonk'); popText(p.x, p.y - 44, 'BAPPED!');
  }
}
function stepOtter() {
  const o = S.otter, p = S.pl; o.t++; if (o.sq > 0) o.sq--; if (o.cool > 0) o.cool--;
  if (p.x > 7950) { o.x += clamp(p.x - o.x, -1.5, 1.5); o.x = clamp(o.x, 8090, 8330); }
  if (!o.said && p.x > 7860) { o.said = true; say('otter', 'HOP ON. I GOT YOU.', 170); }
  if (S.mode !== 'play' || o.cool) return;
  if (Math.abs(p.x - o.x) < 24 && p.y > WATER.y - 28 && (p.ground || p.vy > 0) && p.surf !== PLATS[5]) {
    const T = 76, vx = clamp((8452 - p.x) / T, .6, 5.2);
    airborne(p, vx, -9.7); p.ball = false; p.spring = 40; p.jumping = false; p.face = 1;
    o.sq = 14; o.cool = 40; sfx('spring'); splash(o.x, WATER.y, 8);
    if (!o.gave) { o.gave = true; S.rocks[2] = true; S.L.rocks[2].got = true; sfx('rock'); popText(p.x, p.y - 50, '+ ROCK'); say('otter', 'TAKE THIS ONE TOO. IT SKIPS.', 150); }
  }
}

/* ---------- the finale: skipping rocks ---------- */
function startThrow() {
  const p = S.pl; S.mode = 'throw'; p.gsp = 0; p.roll = false; p.face = 1; p.x = clamp(p.x, 8420, 8496); p.y = platY(PLATS[5], p.x);
  S.thr = { i: 0, n: Math.max(1, S.rocks.filter(Boolean).length), phase: 'aim', t: 0, total: 0, rock: null, wait: 0, end: 0 };
  auMode('creek'); say('hero', 'HERE WE GO.', 90);
}
function stepThrow() {
  const T = S.thr, p = S.pl; T.t++;
  if (T.phase === 'aim') {
    if (IN.jumpP || IN.press) {
      IN.jumpP = IN.press = false;
      const m = .5 + .5 * Math.sin(T.t * .075), q = 1 - Math.abs(m - .5) * 2, skips = 1 + Math.round(Math.pow(q, 1.6) * 7);
      T.q = q; T.rock = { x: p.x + 10, y: p.y - 26, vx: 3 + q * 1.6, vy: 1.2, left: skips, count: 0 }; T.phase = 'fly'; p.throwT = 22; sfx('throw');
      if (q > .9) popText(p.x, p.y - 56, 'PERFECT!', '#7ad050');
    }
  } else if (T.phase === 'fly') {
    const r = T.rock; r.vy += .17; r.x += r.vx; r.y += r.vy;
    if (r.y >= WATER.y && r.vy > 0) {
      if (r.left > 0 && r.x < WATER.x1 - 12) { r.left--; r.count++; T.total++; r.vy = -(.8 + r.left * .2); r.vx *= .86; r.y = WATER.y; part({ type: 'ring', x: r.x, y: WATER.y, life: 34 }); splash(r.x, WATER.y, 3); sfx('plip'); popText(r.x, WATER.y - 18, String(r.count), r.count >= 6 ? '#7ad050' : '#ffffff'); }
      else { sfx('plop'); splash(r.x, WATER.y, 8); T.phase = 'wait'; T.wait = 70; T.rock = null;
        const c = r.count; say('hero', c >= 7 ? 'SEVEN?! SOMEBODY SAW THAT, RIGHT?' : c >= 5 ? 'OH, THAT\'S NICE.' : c >= 3 ? 'NOT BAD.' : 'IT COUNTS.', 90); }
    }
  } else if (T.phase === 'wait') {
    if (--T.wait <= 0) { T.i++; if (T.i < T.n) { T.phase = 'aim'; T.t = 0; } else { T.phase = 'done'; T.end = 0; say('hero', 'NOW THAT\'S A DAY. COOKOUT TIME.', 140); } }
  } else if (T.phase === 'done') {
    if (++T.end === 120) S.fadeTo = 'cook';
  }
}

/* ---------- cookout ---------- */
function startCook() {
  const roster = ['hero', 'roof', 'nib'].concat(S.L.cousins.filter(c => c.woke).map(c => c.fur), LV.credits ? LV.guests : []);
  const skips = S.thr ? S.thr.total : (S.score || 0);
  const res = { skips, carrots: S.carrots, cousins: roster.length, golds: dayRec(S.day).gold.filter(Boolean).length };
  const rec = dayRec(S.day); rec.done = true; rec.best = Math.max(rec.best || 0, skips);
  const best = SAVE.best, nb = { skips: skips > best.skips, carrots: S.carrots > best.carrots, cousins: roster.length > best.cousins };
  if (S.day === 'creek') best.skips = Math.max(best.skips, skips); best.carrots = Math.max(best.carrots, S.carrots); best.cousins = Math.max(best.cousins, roster.length);
  SAVE.runs++; writeSave();
  S.mode = 'cook'; S.cook = { t: 0, roster, res, nb, scene: LV.cook || 'home', credits: LV.credits ? 1 : 0 }; S.bubbles = []; S.sayQ = []; S.parts = [];
  auMode(LV.cookSong || 'cookout');
  if (window.onCookout) window.onCookout();
}

/* ---------- master update ---------- */
function update() {
  S.t++;
  if (S.fadeTo) { S.fade = Math.min(1, S.fade + .04); if (S.fade >= 1) { const to = S.fadeTo; S.fadeTo = null; if (to === 'cook') { if (MISSION) endRun(); else startCook(); } if (to === 'rock') { const p = S.pl; p.x = 8460; p.y = 478; p.ground = true; p.surf = PLATS[5]; p.gsp = 0; S.cam.x = 8330; S.cam.y = WATER.y - NH * .64; startThrow(); } } }
  else if (S.fade > 0) S.fade = Math.max(0, S.fade - .04);
  if (S.mode === 'title') { if (IN.press || IN.jumpP) { IN.press = IN.jumpP = false; IN.tapX = null; enterHub(); } }
  else if (S.mode === 'hub') stepHub();
  else if (S.mode === 'drive') stepDrive();
  else if (S.mode === 'saga') stepSaga();
  else if (S.mode === 'goal') { stepGoal(); missionStep(); camFollow(); }
  else if (S.mode === 'intro') { S.intro++; if (IN.press || IN.jumpP) { IN.press = IN.jumpP = false; if (S.intro < 175) S.intro = 175; if (S.card && S.card.t < 150) S.card.t = 150; } if (S.intro >= 175) beginPlay(); camFollow(); }
  else if (S.mode === 'play') { easyAssist(); stepPlayer(); stepWorld(); missionStep(); camFollow(); }
  else if (S.mode === 'throw') { stepThrow(); stepOtter(); camFollow(); }
  else if (S.mode === 'cook') { S.cook.t++; { const t = S.cook.t; for (let i = 0; i < 4; i++) { const t0 = 70 + i * 34; if (t >= t0 && t < t0 + 26 && t % 3 === 0) sfx('tick'); if (t === t0 + 26) sfx(i === 3 ? 'ding' : 'carrot', i === 3 ? 0 : 1); } } if (S.cook.t % 6 === 0) part({ type: 'smoke', x: 296 + Math.random() * 4, y: NH - 86, vx: .2 + Math.random() * .2, vy: -.5, life: 90 }); if (S.cook.credits) S.cook.credits++; }
  for (const b of S.bubbles) b.t++; stepSay(); if (S.card) { S.card.t++; if (S.card.t > 200) S.card = null; }
  S.bubbles = S.bubbles.filter(b => b.t < b.dur);
  for (const q of S.parts) { q.t++; q.vy += q.g; q.x += q.vx; q.y += q.vy; if (q.type === 'leaf') q.x += Math.sin(q.t * .05 + q.ph) * .6; }
  S.parts = S.parts.filter(q => q.t < q.life);
  IN.press = false; IN.jumpP = false; IN.tapX = null;
}
function zoneMusic() { return LV.music(S.pl.x); }
function startIntro() { S.mode = 'intro'; S.intro = 0; S.card = { t: 0 }; sfx('card'); auMode(LV.music(LV.start)); if (LV.burrow) { S.cam.x = 340 - NW / 2; S.cam.y = 345 - NH * .55; } else { S.cam.x = LV.start - NW * .55; S.cam.y = groundY(LV.start) - NH * .6; } }
function beginPlay() {
  const p = S.pl; S.mode = 'play'; p.x = LV.start; p.y = groundY(LV.start) - 1; airborne(p, 1.5, -6.2); p.spring = 30; p.face = 1;
  if (MISSION && MISSION.rev) { p.vx = -1.5; p.face = -1; }
  dust(p.x, p.y + 1, 8, 3); sfx('spring'); say('hero', (MISSION && MISSION.say) || LV.want, 190); S.easyHint = SAVE.easy ? 200 : 0;
}
function easyAssist() {
  if (!SAVE.easy) return; const p = S.pl;
  if (!p.ground || Math.abs(p.gsp) < 1) return;
  const d = sgn(p.gsp), look = 34 + Math.abs(p.gsp) * 5;
  for (const b of S.L.boulders) if (!b.broken && b.r > 16 && (b.x - p.x) * d > 0 && Math.abs(b.x - p.x) < look) IN.jumpP = true;
  if (LV.id === 'creek' && !S.jam.open && S.carrots < 10 && d > 0 && 4320 - p.x > 0 && 4320 - p.x < look) IN.jumpP = false;
}
function camFollow() {
  const p = S.pl, c = S.cam; let tx, ty, k = .14;
  if (S.mode === 'intro') { const ip = introPos(); tx = ip[0] - NW / 2; ty = ip[1] - NH * .55; k = .08; }
  else if (S.mode === 'throw') { tx = 8330; ty = WATER.y - NH * .64; k = .05; }
  else if (S.mode === 'goal' && LV.goalCam) { [tx, ty] = LV.goalCam(); k = .05; }
  else {
    const [vx] = curVel(p); S.lead = lerp(S.lead, clamp(vx * 17, -NW * .23, NW * .23), .06);
    tx = p.x - NW * .5 + S.lead;
    ty = p.y - NH * .63 - p.look + (p.crouch ? 30 : 0);
    if (p.surf === 'loop') ty = LOOP.cy - NH * .5;
    if (LV.camY) ty = LV.camY(ty, p);
  }
  c.x += (tx - c.x) * k; c.y += (ty - c.y) * (ty > c.y ? .2 : .12);
  c.x = clamp(c.x, 0, WW - NW - 100); c.y = clamp(c.y, -260, WBOT - NH - 10);
}
function introPos() {
  const t = S.intro;
  if (!LV.burrow) { const ex = Math.min(LV.start - 70, LV.start - 400 + t * 4); return [ex + 60, groundY(LV.start) - (t > 110 ? 10 : 0)]; }
  if (t < 60) return [262, 391];
  if (t < 105) return [lerp(262, 372, (t - 60) / 45), 391];
  const k = Math.min(1, (t - 105) / 45); return [lerp(372, 500, k), lerp(389, 302, k)];
}

/* ---------- generic day finale: reach the goal, celebrate, cookout ---------- */
function startGoal() {
  if (MISSION && !missionMayFinish()) return;
  const p = S.pl; S.mode = 'goal'; S.goalT = 0; p.gsp *= .3; p.face = MISSION && MISSION.rev ? -1 : 1; S.score = S.rocks.filter(Boolean).length * 10 + S.golds * 25 + S.carrots;
  if (MISSION && MISSION.mode !== 'fetch') missionGoalLine(); else if (LV.onGoal) LV.onGoal(S); else say('hero', LV.endLine || 'NOW THAT\'S A DAY.', 160);
}
function stepGoal() {
  const p = S.pl; S.goalT++;
  if (p.ground) { p.gsp *= .9; groundStep(p, 0, 0, PH.ACC, PH.TOP); } else airStep(p, 0, 0, PH.TOP);
  if (S.goalT % 40 === 20 && p.ground && S.goalT < 140) { airborne(p, 0, -5); p.spring = 20; sfx('jump'); }
  if (LV.goalStep) LV.goalStep(S);
  if (S.goalT === 170) S.fadeTo = 'cook';
}

function startClimb(p) {
  let wx = p.x; while (wx < p.x + 24 && groundY(wx + 1) > p.y - 12) wx++;
  let tx = wx + 2; while (tx < wx + 40 && groundY(tx + 1) < groundY(tx) - .5) tx++;
  p.climb = { x: wx - 7, top: groundY(tx + 4) }; p.ground = false; p.surf = null; p.vx = 0; p.vy = 0; p.ball = false; p.roll = false; p.gsp = 0;
  sfx('jump'); if (!S.climbSaid) { S.climbSaid = 1; popText(p.x, p.y - 50, 'CLIMB! (HOLD JUMP TO GO FASTER)', '#f6c645'); }
}
