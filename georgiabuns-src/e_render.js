/* ================= Georgia Buns — drawing ================= */
const SKY = [[0, '#5aa8ff', '#ffe2bf', '#fff6ee'], [.35, '#3f8fef', '#b4e2ff', '#ffffff'], [.72, '#4f7fd6', '#ffd890', '#ffecd2'], [1, '#3a2c6e', '#ff9a50', '#f8d6c4']].map(k => [k[0], rgb(k[1]), rgb(k[2]), rgb(k[3])]);
function skyAt(pr) { let i = 0; while (i < SKY.length - 2 && SKY[i + 1][0] <= pr) i++; const a = SKY[i], b = SKY[i + 1], t = clamp((pr - a[0]) / (b[0] - a[0]), 0, 1); return [mixRGB(a[1], b[1], t), mixRGB(a[2], b[2], t), mixRGB(a[3], b[3], t)]; }
function drawSpr(cv, x, y, ang, face, ax, ay) {
  g.save(); g.translate(Math.round(x), Math.round(y));
  if (ang) { const q = Math.PI / 8; g.rotate(Math.round(ang / q) * q); }
  if (face < 0) g.scale(-1, 1);
  g.drawImage(cv, -ax, -ay); g.restore();
}
function pixCircle(cx, cy, r, col) { g.fillStyle = col; for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y)); g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); } }
function progress() { if (!S || S.mode === 'title' || S.mode === 'hub' || S.mode === 'saga') return .05; { const mp = missionProgress(); if (mp != null && S.mode !== 'goal') return mp; } if (S.mode === 'intro') return 0; if (S.mode === 'throw' || S.mode === 'goal') return 1; return clamp((S.pl.x - LV.start) / (LV.goal - LV.start), 0, 1); }

const SKYC = new Map(), BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function skyCanvas(pr) {
  const k = Math.round(pr * 48), key = k + '_' + NH; let c = SKYC.get(key); if (c) return c;
  if (SKYC.size > 10) SKYC.delete(SKYC.keys().next().value);
  c = mkC(NW, NH); const x2 = c.getContext('2d'), id = x2.createImageData(NW, NH), d = id.data, [top, bot] = skyAt(k / 48), hz = NH * .8, L = 22;
  const pal = []; for (let i = 0; i < L; i++) pal.push(mixRGB(top, bot, i / (L - 1)));
  for (let y = 0; y < NH; y++) { const v = Math.min(1, y / hz) * (L - 1), i = Math.floor(v), f = v - i;
    for (let x = 0; x < NW; x++) { const th = (BAYER[(y & 3) * 4 + (x & 3)] + .5) / 16, col = pal[Math.min(L - 1, f > th ? i + 1 : i)], o = (y * NW + x) * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255; } }
  x2.putImageData(id, 0, 0); SKYC.set(key, c); return c;
}
function drawBackdrop(cx, cy, pr) {
  g.drawImage(skyCanvas(pr), 0, 0);
  // sun travels with the day
  const sx = NW * (.12 + pr * .72), sy = NH * .62 - Math.sin((.12 + pr * .8) * Math.PI) * NH * .46, r = Math.round(10 + pr * 7);
  const sc = mixRGB(rgb('#fff6c8'), rgb('#ff8a3a'), Math.max(0, pr - .6) / .4);
  g.globalAlpha = .25; pixCircle(sx, sy, r + 5, css(sc)); g.globalAlpha = 1; pixCircle(sx, sy, r, css(sc));
  const forestK = LV.forestFrom != null ? clamp((cx - LV.forestFrom) / 400, 0, 1) : 1;
  for (const L of LAYERS) {
    const C = L.frames ? L.frames[(S.t >> 4) % L.frames.length] : L.c, w = C.width, h = C.height;
    const dr = L.drift ? S.t * L.drift : 0;
    let ox = -((cx * L.fx + dr) % w); if (ox > 0) ox -= w;
    const y = Math.round(NH * .5 + L.base - (cy - 140) * L.fy - h * .5);
    if (y > NH || y + h < 0) { if (L.fill && y + h < NH) { g.fillStyle = L.fill; g.fillRect(0, Math.max(0, y + h), NW, NH - Math.max(0, y + h)); } continue; }
    if (L.alpha) { if (forestK <= 0) continue; g.globalAlpha = forestK; }
    if (L.rows) {
      // line scroll: each row slides at its own speed, far rows slow, near rows fast
      for (let r = 0; r < h; r++) { const yy = y + r; if (yy < 0 || yy >= NH) continue; const k = r / (h - 1), f = L.rows[0] + (L.rows[1] - L.rows[0]) * k * k;
        let o = -((cx * f + dr) % w); if (o > 0) o -= w; for (let x = Math.round(o); x < NW; x += w) g.drawImage(C, 0, r, w, 1, x, yy, w, 1); }
    } else for (let x = Math.round(ox); x < NW; x += w) g.drawImage(C, x, y);
    if (L.fill && y + h < NH) { g.fillStyle = L.fill; g.fillRect(0, y + h, NW, NH - y - h); }
    if (L.lake) { g.fillStyle = '#ffffff'; for (let i = 0; i < 16; i++) { const lx = (i * 53 + S.t * (.2 + (i % 3) * .1) - cx * L.fx) % NW, ly = y + 113 + (i * 7) % 24; if ((S.t + i * 17) % 50 < 26) g.fillRect(Math.round((lx + NW) % NW), ly, 2 + (i % 2), 1); } }
    if (L.city) { const bt = S.t % 1400; if (bt < 700) { g.fillStyle = '#3a3048'; for (let i = 0; i < 4; i++) { const bx = Math.round(NW + 20 - bt * .7 + i * 9 - (i % 2) * 4), by = Math.round(NH * .18 + i * 4 - (i % 2) * 3 + Math.sin((S.t + i * 9) * .2) * 1.5), w = (S.t + i * 5) % 16 < 8; g.fillRect(bx, by, 1, 1); g.fillRect(bx - 1, by - (w ? 1 : 0), 1, 1); g.fillRect(bx + 1, by - (w ? 1 : 0), 1, 1); g.fillRect(bx - 2, by - (w ? 2 : -1), 1, 1); g.fillRect(bx + 2, by - (w ? 2 : -1), 1, 1); } } }
    g.globalAlpha = 1;
  }
  // light shafts through the trees
  if (forestK > 0 && pr < .95) {
    g.globalAlpha = .07 * forestK; g.fillStyle = '#fff6c8';
    for (let i = 0; i < 3; i++) { const bx = ((i * 190 - cx * .5) % 570 + 570) % 570 - 70; g.beginPath(); g.moveTo(bx, -10); g.lineTo(bx + 40, -10); g.lineTo(bx + 120, NH); g.lineTo(bx + 70, NH); g.fill(); }
    g.globalAlpha = 1;
  }
}
function bunFrame(set, p) {
  const sp = Math.abs(p.gsp), ph = Math.floor(p.animPh) & 3;
  if (p.climb) return (S.t >> 3) & 1 ? set.jump[0] : set.fall[0];
  if (p.throwT > 0) return set.throw[p.throwT > 12 ? 0 : 1];
  if (S.mode === 'throw') return set.idle[(S.t % 200 < 8) ? 1 : 0];
  if (p.surf === 'loop') return p.roll ? set.ball[(S.t >> 1) & 3] : sp > 8 ? set.dash[ph] : set.run[ph];
  if (!p.ground) {
    if (p.tumble > 0 && p.inv > 90) return set.hurt[0];
    if (p.ball) return set.ball[(S.t >> 1) & 3];
    if (p.spring > 0) return set.jump[0];
    return p.vy < 0 ? set.jump[0] : set.fall[0];
  }
  if (p.roll) return set.ball[Math.floor(p.animPh * 1.5) & 3];
  if (p.crouch) return p.charge > .5 ? set.ball[(S.t) & 3] : set.crouch[0];
  if (p.skid > 0) return set.skid[0];
  if (sp < .15) { if (p.look > 10) return set.up[0]; return set.idle[(p.idleT % 220 > 210) ? 1 : 0]; }
  if (sp < 3.4) return set.walk[ph];
  if (sp < 8.5) return set.run[ph];
  return set.dash[ph];
}
function drawWorld(cx, cy) {
  const p = S.pl, L = S.L, vis = (x, m = 80) => x > cx - m && x < cx + NW + m;
  g.save(); g.translate(-cx, -cy);
  // props behind the ground
  const home = LV.id === 'creek' || LV.home, creek = LV.id === 'creek';
  for (const k of home ? (creek ? ['house', 'oak', 'pine'] : ['house', 'oak']) : []) { const pr = PROPS[k]; if (vis(pr.x + pr.c.width / 2, pr.c.width)) g.drawImage(pr.c, pr.x, pr.y); }
  if (LV.drawBack) LV.drawBack(g, vis, cx, cy);
  if (PROPS.loop && vis(LOOP.cx, 120)) g.drawImage(PROPS.loop.c, PROPS.loop.x, PROPS.loop.y);
  for (const lg of PROPS.logs) if (vis(lg.x + lg.c.width / 2, lg.c.width)) g.drawImage(lg.c, lg.x, lg.y);
  if (creek) for (const sx of [1010, 7820]) if (vis(sx)) g.drawImage(PROPS.sign, sx - 22, groundY(sx) - 38);
  if (creek && vis(7300, 120)) g.drawImage(PROPS.hollow.c, PROPS.hollow.x, groundY(7300) - 34);
  if (home && vis(190, 200)) g.drawImage(S.mode === 'cook' ? A.escL : A.esc, 128, 251);
  // terrain
  for (const ch of TERR.chunks) if (ch.x + TERR.CW > cx && ch.x < cx + NW) g.drawImage(ch.c, ch.x, ch.y);
  // burrow chamber details
  if (home && vis(300, 200)) {
    g.fillStyle = '#c8913a'; for (let i = 0; i < 18; i++) g.fillRect(236 + i * 3, 386 - (i % 3), 3, 1 + (i % 2));
    g.fillStyle = '#e8b85e'; g.fillRect(240, 388, 46, 3); g.fillStyle = '#8a5a22'; g.fillRect(238, 390, 50, 2);
    g.fillStyle = '#9aa3ad'; g.fillRect(318, 386, 6, 4); g.fillStyle = (S.t % 60 < 30) ? '#bfe8ff' : '#5b9cff'; g.fillRect(319, 387, 4, 2);
    g.fillStyle = '#5a3a22'; g.fillRect(352, 372, 22, 3); g.fillRect(355, 375, 2, 16); g.fillRect(369, 375, 2, 16);
    g.fillStyle = '#ffe9a0'; g.fillRect(359, 366, 6, 6); g.globalAlpha = .12; pixCircle(362, 369, 18, '#ffe9a0'); g.globalAlpha = 1;
    g.fillStyle = '#1e0e06'; g.beginPath(); g.ellipse(500, 301, 11, 4, 0, 0, 7); g.fill();
  }
  for (const d of L.decor) if (vis(d.x, 30)) { const c = PROPS.decor[d.k]; g.drawImage(c, Math.round(d.x - c.width / 2), Math.round(groundY(d.x) - c.height + 2)); }
  if (creek && vis(8450, 120)) g.drawImage(A.flat, 8370, 465);
  // springs, boulders, jam
  const SA = LV.springArt ? A[LV.springArt] : A.spring; for (const sp of L.springs) if (vis(sp.x)) { const c = SA[sp.t > 0 ? 1 : 0]; g.drawImage(c, Math.round(sp.x - c.width / 2), Math.round(sp.y - c.height + 1)); }
  for (const b of L.boulders) if (!b.broken && vis(b.x)) { const c = boulderC(b.r); g.drawImage(c, Math.round(b.x - c.width / 2), Math.round(b.y - c.height / 2)); }
  if (creek && vis(4346, 100)) g.drawImage(A.jam[S.jam.open ? 1 : 0], 4316, Math.round(groundY(4346) - 94));
  // rocks, tokens, carrots
  for (const rk of L.rocks) if (rk.shown && !rk.got && vis(rk.x)) { const gl = ((S.t >> 3) + rk.id * 3) % 10 === 0; g.drawImage(A.items[LV.item][gl ? 1 : 0], Math.round(rk.x - 8), Math.round(rk.y - 6 + Math.sin(S.t * .08) * 1.5)); }
  for (const tk of L.tokens) if (!tk.got && vis(tk.x)) g.drawImage(A.phone[(S.t >> 4) & 1], Math.round(tk.x - 13), Math.round(tk.y - 11 + Math.sin(S.t * .1) * 2));
  const cf = (S.t >> 2) & 7;
  for (const c of L.carrots) if (!c.got && vis(c.x, 20)) g.drawImage(A.carrot[cf], Math.round(c.x - 7), Math.round(c.y - 10));
  for (const c of S.scat) if (c.t < 230 || (S.t & 4)) g.drawImage(A.carrot[(cf + 3) & 7], Math.round(c.x - 7), Math.round(c.y - 10));
  for (const gc of L.golds) if (!gc.got && vis(gc.x, 20)) { g.drawImage(A.gold[cf], Math.round(gc.x - 7), Math.round(gc.y - 10 + Math.sin(S.t * .08) * 2)); if (S.t % 20 === 0) sparkle(gc.x + (Math.random() - .5) * 12, gc.y - 8 + (Math.random() - .5) * 14); }
  for (const cm of L.cameos) if (vis(cm.x, 60)) CAMEOS[cm.k].draw(g, cm, S.t);
  // characters
  if (creek) {
  const roofY = platY(PLATS[0], 300);
  if (vis(300)) drawSpr(A.roof.wave[(S.t >> 4) & 1], 300, roofY, 0, -1, BAX, BAY);
  if (vis(735)) g.drawImage(A.sq[(S.t % 90 < 10) ? 1 : 0], 724, 152);
  if (vis(4290)) { const fr = S.jam.nib > 0 ? A.nib.chomp[(S.t >> 2) & 1] : A.nib.chomp[(S.t % 120 < 12) ? 1 : 0]; drawSpr(fr, 4292, groundY(4292), 0, 1, BAX, BAY); }
  if (vis(3470)) g.drawImage(A.fox[(S.t % 160 < 10) ? 1 : 0], 3455, Math.round(groundY(3470) - 33));
  }
  for (const c of L.cousins) {
    if (!vis(c.x)) continue;
    const set = c.fam != null ? famSet(c.fam) : A.cuz[c.fur];
    if (c.dazed && !c.woke) { drawSpr(set.idle[0], c.x, c.y, 0, -1, BAX, BAY); if (S.t % 40 < 26) tx('?', c.x - 2, c.y - 54, '#fff3b0', { oc: '#2a140c' }); continue; }
    if (!c.woke) { drawSpr(set.sleep[0], c.x, c.y, 0, -1, BAX, BAY); if (S.t % 70 === (c.x | 0) % 70) part({ type: 'z', x: c.x - 6, y: c.y - 16, vx: -.2, vy: -.4, life: 60 }); }
    else if (c.t < 150) drawSpr(set.cheer[(S.t >> 3) & 1], c.x, c.y, 0, -1, BAX, BAY);
    else if (c.t < 190) { g.globalAlpha = 1 - (c.t - 150) / 40; drawSpr(set.run[(S.t >> 2) & 3], c.x + (c.t - 150) * 4, c.y, 0, 1, BAX, BAY); g.globalAlpha = 1; }
  }
  if (LV.drawActors) LV.drawActors(g, vis, cx, cy);
  // otter
  const o = S.otter;
  if (creek && vis(o.x)) g.drawImage(A.otter[o.sq > 0 ? 2 : ((S.t >> 5) & 1)], Math.round(o.x - 24), Math.round(WATER.y - 15 + Math.sin(o.t * .06) * 1.5));
  // bobcat
  const b = S.bob;
  if (creek && vis(b.x, 100)) {
    let fr, ax = 30, ay = 37;
    if (b.state === 'sleep') { fr = A.bob.sleep[0]; ay = 36; }
    else if (b.state === 'eat') fr = A.bob.eat[(S.t >> 3) & 1];
    else if (b.state === 'done' && b.sit) fr = A.bob.sit[(S.t % 260 < 160 && (S.t >> 4) & 1) ? 1 : 0];
    else if (b.state === 'swat' || b.state === 'dizzy') fr = A.bob.sit[0];
    else fr = A.bob.run[Math.floor(Math.abs(b.x) / 9) & 3];
    drawSpr(fr, b.x, b.y, 0, b.face, ax, ay);
    if (b.state === 'dizzy' && (S.t & 8)) drawText(g, '*', b.x - 4, b.y - 46, '#fff3b0');
  }
  // acorns (with warning shadows)
  for (const a of S.acorns) { const gy = groundY(a.x); if (a.warn > 0 || a.y < gy - 20) { g.globalAlpha = .35; g.fillStyle = '#000'; const w = a.warn > 0 ? 4 + (30 - a.warn) / 5 : 8; g.fillRect(Math.round(a.x - w / 2), Math.round(gy - 1), Math.round(w), 2); g.globalAlpha = 1; } if (a.warn <= 0) g.drawImage(A.acorn, Math.round(a.x - 4), Math.round(a.y - 5)); }
  // cousin crew stampede
  if (S.crew > 0 && S.mode === 'play' && (S.crew > 60 || (S.t & 4))) {
    const furs = ['white', 'ginger', 'dark', 'smoke', 'honey', 'white'];
    for (let i = 5; i >= 0; i--) { const h = S.hist[S.hist.length - 1 - (i + 1) * 4]; if (!h) continue; const cs = MISSION ? famSet([3, 4, 5, 6, 7, 8, 9][(i + (MISSION.runner || 0)) % 7]) : A.cuz[furs[i]]; drawSpr(cs.run[((S.t >> 2) + i) & 3], h[0], h[1], h[2], h[3], BAX, BAY); }
  }
  for (const c of S.amb) if (vis(c.x)) { const fl = (S.t >> 2) & 1, x = Math.round(c.x), y = Math.round(c.y);
    if (c.k === 'fly') { g.fillStyle = c.c; g.fillRect(x - 2, y - (fl ? 2 : 0), 2, 2); g.fillRect(x + 1, y - (fl ? 2 : 0), 2, 2); g.fillStyle = '#2a140c'; g.fillRect(x, y - 1, 1, 3); }
    else { g.fillStyle = '#2a8ad8'; g.fillRect(x - 3, y, 7, 1); g.fillStyle = '#bfe8ff'; g.fillRect(x - 1, y - (fl ? 1 : 0), 1, 1); g.fillRect(x + 1, y - (fl ? 1 : 0), 1, 1); g.fillRect(x - 1, y + (fl ? 0 : 1), 1, 1); g.fillRect(x + 1, y + (fl ? 0 : 1), 1, 1); } }
  if ((S.mode === 'play' || S.mode === 'throw') && p.surf !== 'loop' && !p.inWater) {
    let sy = groundY(p.x); for (const pl of PLATS) { const py = platY(pl, p.x); if (py != null && py >= p.y - 2 && py < sy) sy = py; }
    const hgt = sy - p.y; if (hgt < 140) { const k = 1 - hgt / 140, w = Math.round(6 + 6 * k); g.globalAlpha = .28 * k; g.fillStyle = '#1a0a04'; g.fillRect(Math.round(p.x - w), Math.round(sy - 1), w * 2, 2); g.fillRect(Math.round(p.x - w + 2), Math.round(sy - 2), w * 2 - 4, 1); g.globalAlpha = 1; }
  }
  if (S.mode === 'play' && (plSpeed(p) > 8.5 || S.crew > 0) && S.hist.length > 8) {
    const fr = bunFrame(heroSet(), p); [[3, .3], [6, .14]].forEach(([b, al]) => { const h = S.hist[S.hist.length - 1 - b]; if (!h) return; g.globalAlpha = al; drawSpr(fr, h[0], h[1], (p.ground || p.surf === 'loop') && Math.abs(h[2]) > .3 ? h[2] : 0, h[3], BAX, BAY); }); g.globalAlpha = 1;
  }
  missionDrawBack(vis);
  // the hero
  if (S.mode === 'intro' && !creek) {
    const t = S.intro, ex = Math.min(LV.start - 120, LV.start - 520 + t * 5), gy0 = groundY(LV.start);
    g.drawImage(A.escL, Math.round(ex - 56), Math.round(groundY(ex) - 49));
    if (t > 90) { const k = Math.min(1, (t - 90) / 30); drawSpr(heroSet().jump[0], lerp(ex + 30, LV.start, k), gy0 - Math.sin(k * Math.PI) * 30, 0, 1, BAX, BAY); }
  } else if (S.mode === 'intro') {
    const [ix, iy] = introPos(), t = S.intro;
    const HS = heroSet(), fr = t < 50 ? HS.sleep[0] : t < 62 ? HS.up[0] : HS.run[(t >> 2) & 3];
    const ang = t >= 105 ? -0.55 : 0;
    drawSpr(fr, ix, iy, ang, 1, BAX, BAY);
    if (t < 50 && t % 30 === 0) part({ type: 'z', x: ix + 8, y: iy - 16, vx: .2, vy: -.4, life: 60 });
    if (t === 52) popText(ix + 4, iy - 44, '!', '#fff3b0');
  } else if (S.mode !== 'title' && !(p.inv > 0 && p.inv < 100 && (S.t & 2))) {
    const fr = (S.mode === 'goal' && p.catsit) ? heroSet().catsit[0] : bunFrame(heroSet(), p);
    const onG = p.ground || p.surf === 'loop';
    let ang = onG && !p.roll && !p.crouch ? p.ang : 0; if (onG && Math.abs(ang) < .3 && p.surf !== 'loop') ang = 0;
    if (S.ride) drawSpr(heroSet().cheer[(S.t >> 3) & 1], p.x - 4 + Math.sin(ang) * 26, p.y - 24 * Math.cos(ang) - ((S.t >> 2) & 1), ang, 1, BAX, BAY);
    else drawSpr(fr, p.x, p.y + (p.inWater && p.ground ? 1 : 0), ang, p.face, BAX, BAY);
  }
  if (S.mode === 'play' || S.mode === 'goal') missionDrawFront();
  if (S.mode === 'title') drawSpr(A.hero.idle[(S.t % 200 > 192) ? 1 : 0], 540, 300, 0, -1, BAX, BAY);
  // easy-mode hint: a finger pressing ahead of the bun
  if (S.easyHint > 0 && S.mode === 'play') {
    const k = S.t % 80, fx = Math.round(p.x + p.face * (70 + Math.min(40, k)) ), fy = Math.round(p.y - 24), press = k > 30 && k < 70;
    if (press) { g.globalAlpha = .6; g.strokeStyle = '#fff3b0'; g.beginPath(); g.ellipse(fx, fy + 2, 4 + (k - 30) * .3, 2 + (k - 30) * .12, 0, 0, 7); g.stroke(); g.globalAlpha = 1; }
    g.drawImage(A.finger, fx - 5, fy - (press ? 14 : 18));
  }
  // throw rock in flight
  if (S.thr && S.thr.rock) g.drawImage(A.rock, Math.round(S.thr.rock.x - 8), Math.round(S.thr.rock.y - 6));
  // particles
  for (const q of S.parts) drawPart(q);
  // the creek
  if (vis((WATER.x0 + WATER.x1) / 2, 600)) {
    const x0 = Math.max(WATER.x0, cx - 2), x1 = Math.min(WATER.x1, cx + NW + 2);
    if (x1 > x0) {
      g.globalAlpha = .62; g.fillStyle = '#3c8ed0';
      for (let x = Math.floor(x0); x < x1; x++) { const d = groundY(x) - WATER.y; if (d > 0) g.fillRect(x, WATER.y, 1, Math.ceil(d) + 1); }
      g.globalAlpha = 1; g.fillStyle = '#bfe8ff'; for (let x = Math.floor(x0); x < x1; x += 2) { if (groundY(x) <= WATER.y) continue; const w = Math.sin(x * .09 + S.t * .07) * 1.2; g.fillRect(x, Math.round(WATER.y + w), 2, 1); }
      g.fillStyle = '#ffffff'; for (let i = 0; i < 14; i++) { const x = x0 + ((i * 97 + S.t * .4) % (x1 - x0)), y = WATER.y + 4 + (i * 37 % 20); if ((S.t + i * 13) % 40 < 20) g.fillRect(Math.round(x), y, 3, 1); }
    }
  }
  // ferns in front
  for (const f of L.ferns) if (vis(f.x)) g.drawImage(PROPS.ferns[f.k], Math.round(f.x - 15), Math.round(groundY(f.x) - 12));
  g.restore();
}
function drawPart(q) {
  const k = q.t / q.life, x = Math.round(q.x), y = Math.round(q.y);
  switch (q.type) {
    case 'dust': g.globalAlpha = 1 - k; g.fillStyle = '#e8d8b8'; const r = 1 + k * 4; g.fillRect(x - r, y - r, r * 2, r * 2); g.globalAlpha = 1; break;
    case 'spark': g.drawImage(A.spark[Math.min(3, (q.t / 4) | 0)], x - 4, y - 4); break;
    case 'chip': g.fillStyle = q.col; g.fillRect(x, y, 3, 2); break;
    case 'drop': g.fillStyle = '#bfe8ff'; g.fillRect(x, y, 2, 2); break;
    case 'ring': g.strokeStyle = '#e6f6ff'; g.globalAlpha = 1 - k; g.beginPath(); g.ellipse(x, y, 3 + k * 16, 1 + k * 3, 0, 0, 7); g.stroke(); g.globalAlpha = 1; break;
    case 'text': g.globalAlpha = k > .7 ? (1 - k) / .3 : 1; drawTextO(g, q.s, x - textW(q.s) / 2, y, q.col, 1, '#2a140c'); g.globalAlpha = 1; break;
    case 'z': g.globalAlpha = 1 - k; drawText(g, 'Z', x, y, '#ffffff', 1, '#2a140c'); g.globalAlpha = 1; break;
    case 'leaf': g.fillStyle = (q.ph > 3) ? '#c8913a' : '#7cc85a'; g.fillRect(x, y, 2, 1); g.fillRect(x + 1, y + 1, 1, 1); break;
    case 'snow': g.fillStyle = '#ffffff'; g.fillRect(x, y, (q.t & 64) ? 2 : 1, 1); break;
    case 'smoke': g.globalAlpha = .35 * (1 - k); g.fillStyle = '#d8d0c8'; const s = 2 + k * 6; g.fillRect(x - s / 2, y - s / 2, s, s); g.globalAlpha = 1; break;
  }
}
function speakerPos(w) {
  const p = S.pl;
  if (w === 'hero') { if (S.mode === 'intro') { const ip = introPos(); return [ip[0], ip[1] - 38]; } return [p.x, p.y - 40]; }
  if (w === 'roof') return [300, platY(PLATS[0], 300) - 40];
  if (w === 'sunny') return [737, 150];
  if (w === 'nib') return [4292, groundY(4292) - 40];
  if (w === 'fox') return [3470, groundY(3470) - 36];
  if (w === 'bob') return [S.bob.x, S.bob.y - 36];
  if (w === 'otter') return [S.otter.x + 10, WATER.y - 18];
  if (w && w.x != null) return [w.x, w.y - (w.h || 30)];
  return [p.x, p.y - 40];
}
function wrap(s, n) { const out = []; let line = ''; for (const w of s.split(' ')) { if ((line + ' ' + w).trim().length > n) { out.push(line.trim()); line = w; } else line += ' ' + w; } if (line.trim()) out.push(line.trim()); return out; }
function drawBubbles(cx, cy) {
  for (const b of S.bubbles) {
    const [wx, wy] = speakerPos(b.who); let sx = wx - cx, sy = wy - cy;
    const lines = wrap(b.text, 22), w = Math.max(...lines.map(l => textW(l))) + 8, h = lines.length * 9 + 5;
    const off = sx < -10 || sx > NW + 10 || sy < -40 || sy > NH + 40;
    if (off) continue;
    let bx = Math.round(clamp(sx - w / 2, 3, NW - w - 3)), by = Math.round(clamp(sy - h - 4, 18, NH - h - 6));
    const pop = Math.min(1, b.t / 6);
    if (pop < 1) { by += Math.round((1 - pop) * 4); }
    g.fillStyle = '#2a140c'; g.fillRect(bx - 1, by, w + 2, h); g.fillRect(bx, by - 1, w, h + 2);
    g.fillStyle = b.who === 'bob' ? '#ffe9c8' : '#ffffff'; g.fillRect(bx, by, w, h);
    const tx = clamp(Math.round(sx), bx + 4, bx + w - 6);
    g.fillStyle = '#2a140c'; g.fillRect(tx - 1, by + h, 5, 1); g.fillRect(tx, by + h + 1, 3, 1); g.fillRect(tx + 1, by + h + 2, 1, 1);
    g.fillStyle = g.fillStyle; g.fillStyle = b.who === 'bob' ? '#ffe9c8' : '#ffffff'; g.fillRect(tx, by + h - 1, 3, 1); g.fillRect(tx + 1, by + h, 1, 1);
    let left = Math.floor(b.t * .95); // typed out, about 57 letters a second
    lines.forEach((l, i) => { if (left <= 0) return; drawText(g, l.slice(0, left), bx + 4, by + 3 + i * 9, '#2a140c'); left -= l.length + 1; });
  }
}
function drawHUD() {
  const p = S.pl, pr = progress(), mid = Math.round(NW / 2);
  // carrots
  const cx0 = mid - 118;
  g.drawImage(A.carrot[0], cx0, 3);
  const flash = S.payFlash > 0 && (S.t & 4);
  drawTextO(g, String(S.carrots), cx0 + 15, 8, flash ? '#7ad050' : '#ffffff', 1, '#2a140c');
  // trip meter: home ... creek
  const x0 = mid - 62, x1 = mid + 52, y = 11;
  g.fillStyle = '#2a140c'; g.fillRect(x0 - 1, y - 1, x1 - x0 + 2, 4); g.fillStyle = '#e8d8b8'; g.fillRect(x0, y, x1 - x0, 2); g.fillStyle = '#7ad050'; g.fillRect(x0, y, Math.round((x1 - x0) * pr), 2);
  g.fillStyle = '#2a140c'; g.fillRect(x0 - 10, y - 5, 8, 9); g.fillStyle = '#c9a06a'; g.fillRect(x0 - 9, y - 1, 6, 4); g.fillStyle = '#4a3648'; g.fillRect(x0 - 10, y - 4, 8, 3);
  g.fillStyle = '#2a140c'; g.fillRect(x1 + 2, y - 4, 10, 8); g.fillStyle = LV.meter || '#3c8ed0'; g.fillRect(x1 + 3, y - 3, 8, 6); g.fillStyle = '#bfe8ff'; g.fillRect(x1 + 4, y - 1, 3, 1); g.fillRect(x1 + 7, y + 1, 3, 1);
  const hx = Math.round(x0 + (x1 - x0) * pr); g.fillStyle = '#2a140c'; g.fillRect(hx - 3, y - 5, 7, 7); g.fillStyle = '#a8683a'; g.fillRect(hx - 2, y - 4, 5, 5); g.fillStyle = '#2a140c'; g.fillRect(hx - 2, y - 9, 2, 4); g.fillRect(hx + 1, y - 9, 2, 4); g.fillStyle = '#ef8e94'; g.fillRect(hx + 1, y - 8, 1, 2);
  missionMeterMarks(x0, x1, y);
  if (!missionHUD(mid)) for (let i = 0; i < 3; i++) {
    const rx = mid + 70 + i * 15, used = S.thr && i < S.thr.i;
    const ic = A.items[LV.item][0]; if (S.rocks[i] && !used) g.drawImage(ic, rx - 2, 4); else { g.globalAlpha = .35; g.drawImage(ic, rx - 2, 4); g.globalAlpha = 1; }
  }
  if (S.crew > 0) {
    const w = Math.round(80 * S.crew / 600);
    drawTextO(g, 'COUSIN CREW!', mid - 34, 20, (S.t & 8) ? '#fff3b0' : '#f6c645', 1, '#2a140c');
    g.fillStyle = '#2a140c'; g.fillRect(mid - 41, 30, 82, 4); g.fillStyle = '#f6c645'; g.fillRect(mid - 40, 31, w, 2);
  }
}
function drawThrowUI() {
  const T = S.thr; if (!T || T.phase !== 'aim') return;
  const w = 130, x = Math.round(NW / 2 - w / 2), y = NH - 38;
  drawTextO(g, 'TAP TO SKIP!', NW / 2 - textW('TAP TO SKIP!') / 2, y - 14, (S.t & 16) ? '#ffffff' : '#fff3b0', 1, '#2a140c');
  g.fillStyle = '#2a140c'; g.fillRect(x - 2, y - 2, w + 4, 12);
  for (let i = 0; i < w; i++) { const q = 1 - Math.abs(i / w - .5) * 2; g.fillStyle = q > .9 ? '#7ad050' : q > .6 ? '#f6c645' : q > .3 ? '#ff8a1c' : '#c84a2a'; g.fillRect(x + i, y, 1, 8); }
  const m = .5 + .5 * Math.sin(T.t * .075), mx = Math.round(x + m * w);
  g.fillStyle = '#ffffff'; g.fillRect(mx - 1, y - 4, 3, 16); g.fillStyle = '#2a140c'; g.fillRect(mx, y - 3, 1, 14);
  drawTextO(g, 'ROCK ' + (T.i + 1) + ' OF ' + T.n, NW / 2 - textW('ROCK ' + (T.i + 1) + ' OF ' + T.n) / 2, y + 13, '#ffffff', 1, '#2a140c');
}
function drawTitle() {
  const t = S.t, s1 = 'GEORGIA', s2 = 'BUNS';
  const by = Math.round(NH * .1) + Math.round(Math.sin(t * .05) * 2);
  const w1 = textW(s1, 4), w2 = textW(s2, 7);
  const gold = (s, x, y, sc) => { drawTextO(g, s, x, y + 2, '#2a140c', sc, '#2a140c', 2); drawTextO(g, s, x, y, '#f6c645', sc, '#2a140c', 2); g.save(); g.beginPath(); g.rect(0, y, NW, sc * 2); g.clip(); drawText(g, s, x, y, '#fff3b0', sc); g.restore(); };
  gold(s1, Math.round(NW / 2 - w1 / 2), by, 4);
  gold(s2, Math.round(NW / 2 - w2 / 2), by + 34, 7);
  const sg = SAVE.saga, sub = sg && sg.started ? 'DAY ' + sg.day + '   ' + knownCount() + ' OF 17 COUSINS KNOWN' + (sg.finale ? '   BIGGEST COOKOUT: DONE' : '') : 'SEVENTEEN COUSINS. ONE ESCALADE.';
  drawTextO(g, sub, Math.round(NW / 2 - textW(sub) / 2), by + 90, '#ffffff', 1, '#2a140c');
  if ((t >> 4) & 1 || t < 20) { const cta = 'TAP TO PLAY'; drawTextO(g, cta, Math.round(NW / 2 - textW(cta, 2) / 2), NH - 34, '#ffffff', 2, '#2a140c'); }
}
const CREDITS = ['GEORGIA BUNS', '', 'STARRING', 'SEVENTEEN COUSINS', 'THE ROOF BUN', 'THE NIBBIN\' BUN', 'SUNNY THE SQUIRREL', 'THE BOBCAT', 'DEXTER, SEVEN AND MISS ELLI', 'PONTOON THE MARSH BUN', 'LES ESCARGOTS DISCO', '', 'MUSIC', 'THE GEORGIA BUNS ALBUM', 'IN 16-BIT', '', 'MADE IN GEORGIA', 'IN SPIRIT', '', 'THANKS FOR PLAYING', '', '', 'PSST. CHECK THE BURROW WINDOW.'];
function drawCredits(t) { const y0 = NH - t * .35; g.globalAlpha = .65; g.fillStyle = '#0a0612'; g.fillRect(NW / 2 - 90, 0, 180, NH); g.globalAlpha = 1; CREDITS.forEach((l, i) => { const y = Math.round(y0 + i * 14); if (y < -10 || y > NH) return; drawTextO(g, l, NW / 2 - textW(l) / 2, y, i === 0 ? '#f6c645' : (CREDITS[i - 1] === '' ? '#7ad050' : '#ffffff'), 1, '#2a140c'); }); }
function drawCook() { drawCookScene(S.cook); drawCookBoard(S.cook); }
function drawCookScene(C) {
  const t = C.t, gy = NH - 40;
  // dusk sky
  const top = rgb('#2a2058'), mid = rgb('#8a3a6a'), bot = rgb('#ff9a50');
  for (let i = 0; i < 22; i++) { const k = i / 21; g.fillStyle = css(k < .55 ? mixRGB(top, mid, k / .55) : mixRGB(mid, bot, (k - .55) / .45)); g.fillRect(0, Math.floor(gy * i / 22), NW, Math.ceil(gy / 22) + 1); }
  for (let i = 0; i < 30; i++) if ((t + i * 17) % 120 < 100) { g.fillStyle = '#fff6d0'; g.fillRect((i * 137) % NW, (i * 53) % (gy * .45), 1, 1); }
  pixCircle(60, gy - 6, 18, '#ff7a3a');
  if (C.scene !== 'home' && C.scene !== 'garden') COOKSCENES[C.scene](t, gy); else {
  g.globalAlpha = .9; { const city = forestBase().find(l => l.city).c; g.drawImage(city, -40, gy - 120); g.drawImage(city, 520, gy - 120); } g.globalAlpha = 1;
  g.fillStyle = '#2a1830'; g.globalAlpha = .55; g.fillRect(0, 0, NW, gy); g.globalAlpha = 1;
  // ground
  for (let x = 0; x < NW; x++) { g.fillStyle = '#3f7a2a'; g.fillRect(x, gy, 1, 6); g.fillStyle = (hash(x, 1) < .4) ? '#5aa03a' : '#3f7a2a'; g.fillRect(x, gy - (hash(x, 2) < .4 ? 1 : 0), 1, 1); g.fillStyle = '#9a3a22'; g.fillRect(x, gy + 6, 1, NH - gy); }
  // house (right half) with warm windows
  g.drawImage(PROPS.house.c, -250, gy - 170);
  g.globalAlpha = .18 + .05 * Math.sin(t * .1); pixCircle(80, gy - 52, 30, '#ffd68a'); g.globalAlpha = 1;
  drawSpr(A.roof.wave[(t >> 4) & 1], 60, gy - 170 + (platY(PLATS[0], 390) - 130) + 2, 0, 1, BAX, BAY);
  // string lights
  const L0 = [150, gy - 96], L1 = [404, gy - 120];
  for (let i = 0; i <= 26; i++) { const k = i / 26, x = lerp(L0[0], L1[0], k), y = lerp(L0[1], L1[1], k) + Math.sin(k * Math.PI) * 26; g.fillStyle = '#2a140c'; g.fillRect(Math.round(x), Math.round(y), 1, 1); if (i % 2 === 0) { g.fillStyle = ((i + (t >> 4)) % 3) ? '#ffd86a' : '#ff9a5a'; g.fillRect(Math.round(x) - 1, Math.round(y) + 1, 3, 3); } }
  // Escalade with the lights on, the bobcat lounging on the roof
  g.drawImage(A.escL, 300, gy - 49);
  drawSpr(A.bob.sleep[0], 358, gy - 47, 0, -1, 30, 36);
  // oak edge with Sunny
  g.fillStyle = '#4a2e1e'; g.fillRect(404, gy - 160, 20, 160); g.fillStyle = '#2c5a24'; for (let i = 0; i < 9; i++) pixCircle(410 + (i % 3) * 8, gy - 170 + i * 4, 14, i % 2 ? '#2c5a24' : '#3f7a2a');
  g.drawImage(A.sq[(t % 80 < 10) ? 1 : 0], 392, gy - 138);
  // grill and table
  g.fillStyle = '#1a1a1e'; g.fillRect(272, gy - 30, 44, 18); g.fillStyle = '#34343a'; g.fillRect(272, gy - 30, 44, 4); g.fillRect(276, gy - 12, 3, 12); g.fillRect(309, gy - 12, 3, 12); g.fillRect(300, gy - 44, 5, 14);
  g.fillStyle = '#ff6a2a'; if (t & 8) g.fillRect(280, gy - 33, 28, 2);
  g.fillStyle = '#8a3a22'; g.fillRect(278, gy - 35, 10, 3); g.fillRect(292, gy - 35, 10, 3);
  g.fillStyle = '#2a140c'; g.fillRect(176, gy - 22, 84, 4); g.fillStyle = '#e03030'; g.fillRect(176, gy - 24, 84, 4); for (let x = 176; x < 260; x += 6) { g.fillStyle = '#ffffff'; g.fillRect(x, gy - 24, 3, 2); g.fillRect(x + 3, gy - 22, 3, 2); }
  g.fillStyle = '#4e3220'; g.fillRect(180, gy - 18, 3, 18); g.fillRect(253, gy - 18, 3, 18);
  g.fillStyle = '#3a3a3a'; g.fillRect(186, gy - 34, 18, 10); g.fillStyle = '#2f7a2a'; g.fillRect(187, gy - 36, 16, 3); if (t % 30 < 15) { g.fillStyle = '#e8e8e8'; g.globalAlpha = .4; g.fillRect(192, gy - 44, 2, 6); g.globalAlpha = 1; }
  g.fillStyle = '#ffffff'; g.fillRect(210, gy - 27, 18, 3); g.fillStyle = '#8a3a1a'; g.fillRect(212, gy - 30, 14, 3);
  g.fillStyle = '#ffffff'; g.fillRect(236, gy - 38, 10, 14); g.fillStyle = '#ff8a1c'; g.fillRect(237, gy - 34, 8, 10); g.fillStyle = '#ffb060'; g.fillRect(250, gy - 31, 4, 7);
  }
  // the crew
  const homeish = C.scene === 'home' || C.scene === 'garden';
  const R = C.roster.filter(k => k !== 'roof' && k !== 0 && ((k !== 'nib' && k !== 1) || !homeish));
  if (homeish) drawSpr(A.nib.chomp[(t >> 3) & 1], 266, gy + 1, 0, -1, BAX, BAY);
  if (C.extra) C.extra(t, gy);
  for (let i = 0; i < R.length; i++) {
    const k = R[i], set = typeof k === 'number' ? famSet(k) : k === 'hero' ? heroSet() : k === 'nib' ? A.nib : (A[k] && A[k].idle) ? A[k] : A.cuz[k];
    const x = 26 + i * Math.min(40, (C.wide || 230) / Math.max(1, R.length - 1)), y = gy + 1, fr = (k === 'pontoon' ? set.catsit : set.cheer)[((t >> 3) + i) & 1];
    drawSpr(fr, x, y, 0, 1, BAX, BAY);
  }
  for (const q of S.parts) drawPart(q);
  if (t % 200 === 40 && homeish) say('bobck', 'DOOO BA DEE DA DEE BA DA DOOO', 150);
  for (const b of S.bubbles) { const lines = wrap(b.text, 22), w = Math.max(...lines.map(l => textW(l))) + 8, h = lines.length * 9 + 5, bx = 290, by = gy - 100; g.fillStyle = '#2a140c'; g.fillRect(bx - 1, by - 1, w + 2, h + 2); g.fillStyle = '#ffe9c8'; g.fillRect(bx, by, w, h); lines.forEach((l, i) => drawText(g, l, bx + 4, by + 3 + i * 9, '#2a140c')); }
  // fireflies
  for (let i = 0; i < 14; i++) { const x = (i * 71 + Math.sin(t * .02 + i) * 20 + 424) % 424, y = gy - 20 - (i * 29 % 70) + Math.sin(t * .03 + i * 2) * 6; if ((t + i * 11) % 50 < 30) { g.fillStyle = '#e8ff8a'; g.fillRect(Math.round(x), Math.round(y), 1, 1); } }
}
function drawCookBoard(C) {
  const t = C.t, gy = NH - 40;
  // results board
  if (t > 30 && !(C.credits && t > 420)) {
    const res = C.res, rows = [[LV.scoreName || 'SKIPS', res.skips, C.nb.skips], ['CARROTS', res.carrots, C.nb.carrots], ['COUSINS', res.cousins, C.nb.cousins], ['GOLDEN CARROTS', res.golds + '/3', false]];
    const w = 160, h = 87, bx = Math.round(NW / 2 - w / 2), by = 8 + Math.round(Math.max(0, 40 - (t - 30) * 2));
    g.fillStyle = '#2a140c'; g.fillRect(bx - 2, by - 2, w + 4, h + 4); g.fillStyle = '#7a5236'; g.fillRect(bx, by, w, h); g.fillStyle = '#a07450'; g.fillRect(bx, by, w, 3); g.fillStyle = '#4e3220'; g.fillRect(bx, by + h - 3, w, 3);
    const head = 'DAY ' + LV.day + ' DONE'; drawTextO(g, head, NW / 2 - textW(head) / 2, by + 7, '#f6c645', 1, '#2a140c');
    rows.forEach(([k, v, nb], i) => { const y = by + 22 + i * 13, t0 = 70 + i * 34; if (t < t0) return; const kk = Math.min(1, (t - t0) / 26); drawText(g, k, bx + 12, y, '#f4e2bd', 1, '#2a140c'); let vs = String(v); if (typeof v === 'number' && kk < 1) vs = String(Math.round(v * kk)); else if (typeof v === 'string' && kk < 1) vs = '0/3'; drawText(g, vs, bx + w - 12 - textW(vs), y, '#ffffff', 1, '#2a140c'); if (nb && SAVE.runs > 1 && S.day === 'creek') drawText(g, 'BEST!', bx + 70, y, (t & 8) ? '#7ad050' : '#f6c645', 1, '#2a140c'); });
    drawText(g, LV.title, NW / 2 - textW(LV.title) / 2, by + h - 13, '#d8b080');
  }
  if (C.credits && t > 420) drawCredits(t - 420);
}
const TUFT = { 0: ['#2f8a26', '#5cb83e', '#8ad860'], 1: ['#2a6a1e', '#3e8a2c', '#6aae44'], 9: ['#2f7a26', '#4c9c38', '#7cc458'], 15: ['#8a7440', '#b8a060', '#d8c080'], 4: ['#8a8a40', '#b8b060', '#d8d088'] };
let FGSET = null, FGKEY = '';
function drawForeground(cx, cy) {
  if (S.mode === 'title' || !LV) return;
  // grass blades on the ground lip, in front of the bunny's feet
  for (let wx = Math.floor(cx / 7) * 7; wx < cx + NW; wx += 7) {
    const h0 = hash(wx, 5); if (h0 > .55) continue; const T = TUFT[LV.zone(wx)]; if (!T) continue;
    const gy = Math.round(groundY(wx)) - cy, sx = wx - cx; if (gy < -8 || gy > NH + 8) continue;
    const sway = Math.round(Math.sin(S.t * .05 + wx * .07) * .6);
    for (let b = 0; b < 3; b++) { const bx = sx + b * 2 - 2, bh = 2 + ((hash(wx + b, 6) * 4) | 0); g.fillStyle = T[0]; g.fillRect(bx, gy - bh + 2, 1, bh); g.fillStyle = T[b === 1 ? 2 : 1]; g.fillRect(bx + (b === 1 ? sway : 0), gy - bh + 1, 1, 2); }
  }
  // the foreground layer: closer than the bunny, so it slides by faster
  const key = LV.id; if (FGKEY !== key) { FGKEY = key; FGSET = buildFG(LV.id === 'garden' ? 'garden' : LV.theme); }
  const F = FGSET, fx = 1.45, P = 150, x0 = cx * fx, p = S.pl, psx = p.x - cx;
  const forestOK = LV.forestFrom == null || cx > LV.forestFrom - 200;
  for (let i = Math.floor((x0 - 260) / P); i <= Math.floor((x0 + NW + 120) / P); i++) {
    const sx = Math.round(i * P + hash(i, 77) * 110 - x0), r = hash(i, 78);
    const wx = clamp(cx + sx / fx, 0, WW - 1), gsy = groundY(wx) - cy, bottom = Math.max(NH + 6, Math.round(gsy + 64));
    let spr = null, tall = false;
    if (F.tall.length && r < .14 && forestOK) { spr = F.tall[i % F.tall.length | 0]; tall = true; }
    else if (F.hang.length && r < .32) { const hs = F.hang[0]; g.globalAlpha = .92; g.drawImage(hs, sx, Math.round(-8 - Math.max(0, cy - p.y + NH) * 0)); g.globalAlpha = 1; continue; }
    else if (F.low.length && r < .85) spr = F.low[Math.floor(hash(i, 79) * F.low.length)];
    if (!spr) continue;
    const y = bottom - spr.height; if (y > NH) continue;
    const near = Math.abs(sx + spr.width / 2 - psx) < spr.width / 2 + 14;
    g.globalAlpha = tall ? (near ? .4 : .95) : (near && p.y - cy > y ? .7 : 1);
    g.drawImage(spr, sx, y); g.globalAlpha = 1;
  }
}
const CARDCOL = { creek: ['#2a7a3a', '#f6c645'], farm: ['#b8302a', '#ffe08a'], marsh: ['#2a78a8', '#ffe9b0'], paris: ['#34307a', '#f6c645'], garden: ['#d8661a', '#fff3b0'], boulder: ['#6a4a8a', '#bfe8ff'], icebox: ['#2a2058', '#9ae8ff'] };
// Sonic-style act card: a colour bar drops in, the day's name slides across, then it all whips away
function drawCard() {
  const C = S.card; if (!C) return; const t = C.t, [col, hi] = CARDCOL[LV.id] || ['#2a7a3a', '#f6c645'];
  const inK = k => Math.min(1, Math.max(0, k)), ease = k => 1 - Math.pow(1 - inK(k), 3);
  const out = ease((t - 150) / 24), a = ease(t / 16) * (1 - out), b = ease((t - 6) / 18) * (1 - out), c = ease((t - 14) / 18) * (1 - out);
  // the bar down the left
  const bw = 54, bh = NH; g.fillStyle = col; g.fillRect(30, Math.round(-bh + bh * a), bw, bh); g.fillStyle = hi; g.fillRect(30 + bw - 4, Math.round(-bh + bh * a), 4, bh);
  g.fillStyle = '#2a140c'; g.fillRect(30 + bw, Math.round(-bh + bh * a), 2, bh);
  for (let i = 0; i < 6; i++) { const yy = Math.round(-bh + bh * a + 30 + i * 46); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(30, yy, bw - 4, 18); }
  // the name banner from the right
  const name = MISSION && MISSION.title ? MISSION.title : LV.title, sc = textW(name) * 2 > NW - 110 ? 1 : 2, tw = textW(name) * sc, bnW = tw + 40, by = Math.round(NH * .36);
  const bx = Math.round(NW - bnW * b + (1 - b) * 40);
  g.fillStyle = '#2a140c'; g.fillRect(bx - 2, by - 2, bnW + 60, 10 * sc + 16); g.fillStyle = '#fff6e0'; g.fillRect(bx, by, bnW + 60, 10 * sc + 12);
  g.fillStyle = col; g.fillRect(bx, by + 10 * sc + 8, bnW + 60, 4);
  drawTextO(g, name, bx + 18, by + 6, '#2a140c', sc, '#fff6e0', 1);
  // the day tag from below
  const dt = 'DAY ' + (MISSION && SAVE.saga ? SAVE.saga.day : LV.day), dw = textW(dt) * 2 + 20, dx = Math.round(NW - dw - 26), dy = Math.round(by + 10 * sc + 22 + (1 - c) * (NH - by));
  g.fillStyle = '#2a140c'; g.fillRect(dx - 2, dy - 2, dw + 4, 28); g.fillStyle = col; g.fillRect(dx, dy, dw, 24); g.fillStyle = hi; g.fillRect(dx, dy, dw, 2);
  drawTextO(g, dt, dx + 10, dy + 5, hi, 2, '#2a140c', 1);
}
function render() {
  if (!S) return;
  if (S.mode === 'saga') { drawSaga(); if (S.fade > 0) { g.globalAlpha = S.fade; g.fillStyle = '#000'; g.fillRect(0, 0, NW, NH); g.globalAlpha = 1; } return; }
  if (S.mode === 'hub') { drawHub(); if (S.fade > 0) { g.globalAlpha = S.fade; g.fillStyle = '#000'; g.fillRect(0, 0, NW, NH); g.globalAlpha = 1; } return; }
  if (S.mode === 'drive') { drawDrive(); if (S.fade > 0) { g.globalAlpha = S.fade; g.fillStyle = '#000'; g.fillRect(0, 0, NW, NH); g.globalAlpha = 1; } return; }
  if (S.mode === 'cook') { drawCook(); if (S.fade > 0) { g.globalAlpha = S.fade; g.fillStyle = '#000'; g.fillRect(0, 0, NW, NH); g.globalAlpha = 1; } return; }
  let cx = Math.round(S.cam.x), cy = Math.round(S.cam.y);
  if (S.shake) { cx += (S.t & 1) ? 1 : -1; cy += (S.t & 2) ? 1 : -1; }
  const pr = progress();
  drawBackdrop(cx, cy, pr);
  drawWorld(cx, cy);
  drawForeground(cx, cy);
  const tint = skyAt(pr)[2]; g.globalCompositeOperation = 'multiply'; g.fillStyle = css(tint); g.fillRect(0, 0, NW, NH); g.globalCompositeOperation = 'source-over';
  if (pr > .85 && S.mode !== 'title') for (let i = 0; i < 10; i++) { if ((S.t + i * 9) % 60 < 34) { g.fillStyle = '#e8ff8a'; g.fillRect((i * 97 + Math.sin(S.t * .02 + i) * 30 + 424) % 424 | 0, (NH * .3 + (i * 41) % (NH * .5)) | 0, 1, 1); } }
  if (S.mode === 'title') drawTitle();
  else { drawBubbles(cx, cy); drawHUD(); drawThrowUI(); drawCard(); }
  if (S.fade > 0) { g.globalAlpha = S.fade; g.fillStyle = '#000'; g.fillRect(0, 0, NW, NH); g.globalAlpha = 1; }
}
