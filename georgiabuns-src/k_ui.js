/* ================= Georgia Buns — canvas menus =================
   Every saga screen draws itself and registers tappable spots with hot().
   Taps hit the topmost spot; arrow keys move a focus between spots and
   Enter/Space/Jump presses it. Text is rendered once and cached. */

/* ---------- cached text ---------- */
const TXC = new Map();
function txCanvas(s, col, oc, sc) {
  const key = s + '|' + col + '|' + (oc || '') + '|' + sc; let c = TXC.get(key); if (c) return c;
  if (TXC.size > 900) TXC.clear();
  const o = oc ? Math.min(sc, 2) : 0; c = mkC(Math.max(1, textW(s, sc) + o * 2 + sc), 7 * sc + o * 2 + sc); const x = c.getContext('2d');
  if (oc) drawTextO(x, s, o, o, col, sc, oc); else drawText(x, s, 0, 0, col, sc);
  c.o = o; TXC.set(key, c); return c;
}
// tx(text, x, y, color, {oc: outline, sc: scale, al: 'c'|'r'})
function tx(s, x, y, col, o) {
  o = o || {}; s = String(s).toUpperCase(); const sc = o.sc || 1, c = txCanvas(s, col || '#ffffff', o.oc, sc), w = textW(s, sc);
  const X = o.al === 'c' ? x - w / 2 : o.al === 'r' ? x - w : x;
  g.drawImage(c, Math.round(X - c.o), Math.round(y - c.o)); return w;
}
function txWrap(s, n) { return wrap(String(s).toUpperCase(), n); }
function txBlock(s, x, y, w, col, o) { o = o || {}; const lines = txWrap(s, Math.max(4, Math.floor(w / 6))), lh = o.lh || 9; lines.forEach((l, i) => tx(l, o.al === 'c' ? x + w / 2 : x, y + i * lh, col, o)); return lines.length * lh; }
const R_ = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

/* ---------- hot spots, focus and keys ---------- */
const UIH = { list: [], prev: [], focus: -1, kb: false, lk: 0, toast: null, scr: '' };
function hot(x, y, w, h, fn, o) { if (UIH.mute) return false; UIH.list.push({ x, y, w, h, fn, o: o || {} }); return UIH.kb && UIH.focus === UIH.list.length - 1; }
function uiFlush() { UIH.prev = UIH.list; UIH.list = []; if (UIH.focus >= UIH.prev.length) UIH.focus = UIH.prev.length - 1; }
function uiReset() { UIH.focus = UIH.kb ? 0 : -1; UIH.prev = []; }
function uiAct(h) {
  if (!h) return;
  if (h.o.off) { sfx('bonk'); if (h.o.why) toast(h.o.why); return; }
  sfx(h.o.snd || 'tap'); h.fn();
}
function toast(s) { UIH.toast = { s, t: 0 }; }
function uiInput() {
  const L = UIH.prev;
  if (IN.press && IN.tapX != null) {
    for (let i = L.length - 1; i >= 0; i--) { const h = L[i]; if (IN.tapX >= h.x && IN.tapX <= h.x + h.w && IN.tapY >= h.y && IN.tapY <= h.y + h.h) { UIH.kb = false; UIH.focus = i; uiAct(h); break; } }
    IN.press = false; IN.tapX = null; IN.jumpP = false; return;
  }
  // arrows: move to the nearest spot in that direction
  const dx = Math.abs(IN.ix) > .5 ? sgn(IN.ix) : 0, dy = Math.abs(IN.iy) > .5 ? sgn(IN.iy) : 0;
  if ((dx || dy) && !UIH.lk && L.length) {
    UIH.lk = 1; UIH.kb = true;
    if (UIH.focus < 0) UIH.focus = 0;
    else {
      const a = L[UIH.focus], ax = a.x + a.w / 2, ay = a.y + a.h / 2; let best = -1, bd = 1e9;
      L.forEach((h, i) => { if (i === UIH.focus || h.o.nokb) return; const hx = h.x + h.w / 2, hy = h.y + h.h / 2, vx = hx - ax, vy = hy - ay;
        const along = dx ? vx * dx : vy * dy, across = dx ? Math.abs(vy) : Math.abs(vx); if (along <= 2) return; const d = along + across * 2.2; if (d < bd) { bd = d; best = i; } });
      if (best >= 0) { UIH.focus = best; sfx('tap'); }
    }
  } else if (!dx && !dy) UIH.lk = 0;
  if (IN.jumpP || IN.press) { IN.jumpP = IN.press = false; if (UIH.focus >= 0 && L[UIH.focus]) uiAct(L[UIH.focus]); else { UIH.kb = true; const p = L.findIndex(h => h.o.gold && !h.o.off); UIH.focus = Math.max(0, p); if (p >= 0) uiAct(L[p]); } }
}
function drawToast() {
  const T = UIH.toast; if (!T) return; T.t++; if (T.t > 170) { UIH.toast = null; return; }
  const lines = txWrap(T.s, 40), w = Math.max(...lines.map(l => textW(l))) + 14, h = lines.length * 9 + 8, x = Math.round(NW / 2 - w / 2), y = Math.round(NH - h - 10 + Math.max(0, 8 - T.t) * 2);
  R_(x - 1, y - 1, w + 2, h + 2, '#2a140c'); R_(x, y, w, h, '#fff3b0'); lines.forEach((l, i) => tx(l, NW / 2, y + 5 + i * 9, '#2a140c', { al: 'c' }));
}

/* ---------- boxes and buttons ---------- */
function ubox(x, y, w, h, fill, hi, lo) { R_(x - 2, y - 2, w + 4, h + 4, '#2a140c'); R_(x, y, w, h, fill); if (hi) R_(x, y, w, 2, hi); if (lo) R_(x, y + h - 2, w, 2, lo); }
/* ---------- textures: wood grain, paper, the burrow wall ---------- */
const TEX = {};
function tile(tex, x, y, w, h) { g.save(); g.beginPath(); g.rect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); g.clip(); for (let ty = Math.round(y); ty < y + h; ty += tex.height) for (let tx2 = Math.round(x); tx2 < x + w; tx2 += tex.width) g.drawImage(tex, tx2, ty); g.restore(); }
function woodTex() {
  if (TEX.wood) return TEX.wood; const W = 128, H = 48, c = mkC(W, H), x = c.getContext('2d'), base = rgb('#7a5236'); srand(19);
  for (let yy = 0; yy < H; yy++) { const band = Math.sin(yy * .9) * .5 + Math.sin(yy * .23 + 1) * .5; for (let xx = 0; xx < W; xx++) { const gr = Math.sin(xx * .045 + yy * .6 + Math.sin(xx * .02) * 2) * .5 + band * .5 + (hash(xx >> 2, yy) - .5) * .25; const k = gr * .09; x.fillStyle = css(k < 0 ? mixRGB(base, [40, 20, 10], -k * 2) : mixRGB(base, [200, 150, 100], k)); x.fillRect(xx, yy, 1, 1); } }
  for (let i = 0; i < 2; i++) { const kx = 20 + rnd() * 90, ky = 8 + rnd() * 32; for (let r = 5; r > 0; r--) { x.fillStyle = r % 2 ? '#5a3a22' : '#6e4a2e'; x.beginPath(); x.ellipse(kx, ky, r * 1.6, r * .6, 0, 0, 7); x.fill(); } }
  x.fillStyle = 'rgba(30,14,6,.35)'; x.fillRect(0, 23, W, 1); x.fillStyle = 'rgba(255,220,170,.12)'; x.fillRect(0, 24, W, 1);
  return (TEX.wood = c);
}
function paperTex() {
  if (TEX.paper) return TEX.paper; const W = 64, H = 64, c = mkC(W, H), x = c.getContext('2d'); x.fillStyle = '#f4ead0'; x.fillRect(0, 0, W, H); srand(29);
  for (let i = 0; i < 260; i++) { x.fillStyle = rnd() < .5 ? 'rgba(160,120,70,.10)' : 'rgba(255,255,255,.35)'; x.fillRect(rnd() * W | 0, rnd() * H | 0, 1 + (rnd() < .2), 1); }
  for (let i = 0; i < 10; i++) { x.fillStyle = 'rgba(150,110,60,.08)'; const fx = rnd() * W, fy = rnd() * H; for (let k = 0; k < 6; k++) x.fillRect((fx + k) % W | 0, (fy + k * .4) % H | 0, 1, 1); }
  return (TEX.paper = c);
}
function nail(x, y) { R_(x - 1, y - 1, 3, 3, '#3a2416'); R_(x, y - 1, 1, 1, '#d8c8b0'); R_(x - 1, y, 1, 1, '#8a7a6a'); }
function woodPanel(x, y, w, h) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  g.globalAlpha = .35; R_(x + 1, y + 3, w + 4, h + 3, '#000000'); g.globalAlpha = 1;
  R_(x - 2, y - 2, w + 4, h + 4, '#2a140c'); tile(woodTex(), x, y, w, h);
  R_(x, y, w, 2, 'rgba(255,214,160,.32)'); R_(x, y, 1, h, 'rgba(255,214,160,.22)'); R_(x, y + h - 2, w, 2, 'rgba(20,8,2,.45)'); R_(x + w - 1, y, 1, h, 'rgba(20,8,2,.35)');
  R_(x + 2, y + 2, w - 4, 1, 'rgba(20,8,2,.18)');
  if (w > 40 && h > 24) { nail(x + 4, y + 4); nail(x + w - 5, y + 4); nail(x + 4, y + h - 5); nail(x + w - 5, y + h - 5); }
}
function paper(x, y, w, h) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  g.globalAlpha = .3; R_(x + 2, y + 3, w + 2, h + 2, '#000000'); g.globalAlpha = 1;
  R_(x - 1, y - 1, w + 2, h + 2, '#8a6a4a'); tile(paperTex(), x, y, w, h);
  R_(x, y, w, 1, '#fffaf0'); R_(x, y + h - 2, w, 2, '#e2d2ac'); R_(x + w - 1, y, 1, h, '#e8dcbc');
  if (w > 120 && h > 40) { g.globalAlpha = .7; R_(x + w / 2 - 18, y - 4, 36, 8, '#e8dca0'); g.globalAlpha = 1; R_(x + w / 2 - 18, y - 4, 36, 1, '#f6eec0'); }
}
// the backdrop for menu screens: a carved burrow wall, clay strata, roots, a lamp's glow and dark corners
function menuBG() {
  const key = NW + 'x' + NH; if (TEX.bg && TEX.bgk === key) { g.drawImage(TEX.bg, 0, 0); return; }
  const c = mkC(NW, NH), x = c.getContext('2d'), id = x.createImageData(NW, NH), d = id.data; srand(37);
  const strata = ['#3b1d10', '#42210f', '#381a0d', '#4a2614', '#3e1e10'].map(rgb), cx = NW / 2, cy = NH * .28;
  for (let yy = 0; yy < NH; yy++) for (let xx = 0; xx < NW; xx++) {
    const q = Math.floor((yy + Math.sin(xx * .03) * 4 + Math.sin(xx * .011 + 2) * 6) / 11); let col = strata[(q % 5 + 5) % 5];
    if (hash(xx >> 1, yy >> 1) < .03) col = mixRGB(col, [120, 70, 40], .5);
    const dx = (xx - cx) / NW, dy = (yy - cy) / NH, dist = Math.sqrt(dx * dx * 1.3 + dy * dy), th = (BAY4[(yy & 3) * 4 + (xx & 3)] + .5) / 16;
    const lit = Math.max(0, .5 - dist) * .55, dark = Math.max(0, dist - .38) * 1.1;
    if (lit > th * .6) col = mixRGB(col, [150, 80, 40], Math.min(.35, lit));
    if (dark > th) col = mixRGB(col, [10, 4, 2], .55);
    const o = (yy * NW + xx) * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255; }
  x.putImageData(id, 0, 0);
  for (let i = 0; i < 18; i++) { const sx = rnd() * NW, sy = rnd() * NH, r = 2 + rnd() * 4; x.fillStyle = '#5a4438'; x.beginPath(); x.ellipse(sx, sy, r, r * .7, 0, 0, 7); x.fill(); x.fillStyle = '#7a6458'; x.fillRect(sx - r * .5, sy - r * .4, Math.max(1, r * .6), 1); }
  x.strokeStyle = '#24120a'; x.lineWidth = 1; for (let i = 0; i < 9; i++) { let rx = rnd() * NW, ry = 0; x.beginPath(); x.moveTo(rx, ry); const len = 20 + rnd() * 50; for (let k = 0; k < len; k += 3) { rx += (rnd() - .5) * 3; ry += 3; x.lineTo(rx, ry); } x.stroke(); }
  TEX.bg = c; TEX.bgk = key; g.drawImage(c, 0, 0);
}
// btn(x, y, w, h, label, fn, {gold, off, why, sc, icon, small})
function btn(x, y, w, h, label, fn, o) {
  o = o || {}; o.label = label; x = Math.round(x); y = Math.round(y);
  const f = hot(x - 2, y - 2, w + 4, h + 4, fn, o), gold = o.gold && !o.off, pulse = gold && o.pulse && (S.t & 32);
  g.globalAlpha = .35; R_(x - 1, y + 1, w + 4, h + 3, '#000000'); g.globalAlpha = 1;
  R_(x - 2, y - 2, w + 4, h + 4, f ? '#ffffff' : '#2a140c');
  R_(x, y, w, h, o.off ? '#5a4a3e' : gold ? (pulse ? '#ffd860' : '#f6c645') : o.col || '#4e3220');
  R_(x, y, w, 2, o.off ? '#6e5a4c' : gold ? '#fff3b0' : '#7a5236'); R_(x, y + h - 2, w, 2, o.off ? '#4a3c32' : gold ? '#b8860b' : '#3a2416');
  if (!o.off) { R_(x, y + 2, 1, h - 4, gold ? '#ffe890' : '#6a4630'); R_(x + w - 1, y + 2, 1, h - 4, gold ? '#d8a020' : '#3a2416'); }
  if (gold) { const gp = (S.t * 2 + x) % (w + 160) - 20; if (gp > 0 && gp < w - 6) { g.globalAlpha = .45; for (let k = 0; k < h - 4; k++) R_(x + gp + k * .5, y + 2 + k, 3, 1, '#ffffff'); g.globalAlpha = 1; } }
  let lx = x + w / 2; const sc = o.sc || 1;
  if (o.icon) { const ic = o.icon, iw = ic.width; const tw = label ? textW(String(label).toUpperCase(), sc) : 0; const tot = iw + (label ? 4 + tw : 0); g.drawImage(ic, Math.round(x + w / 2 - tot / 2), Math.round(y + h / 2 - ic.height / 2)); lx = x + w / 2 - tot / 2 + iw + 4 + tw / 2; }
  if (label) tx(label, Math.round(lx), Math.round(y + h / 2 - 3.5 * sc), o.off ? '#a89888' : gold ? '#2a140c' : '#ffffff', { al: 'c', sc, oc: gold || o.off ? null : '#2a140c' });
  return f;
}
// a small round "X" / back button in a corner
function backBtn(fn, label) { label = label || 'BACK'; return btn(8, 4, textW(label) + 24, 13, label, fn, { icon: arrowIcon() }); }
let ARROW = null;
function arrowIcon() { if (ARROW) return ARROW; const c = mkC(7, 7), x = c.getContext('2d'); x.fillStyle = '#ffffff'; for (let i = 0; i < 4; i++) x.fillRect(i, 3 - i, 1, i * 2 + 1); x.fillRect(3, 2, 4, 3); return (ARROW = c); }
function sunIcon(on) { const k = on ? 'sunOn' : 'sunOff'; if (ICC[k]) return ICC[k]; const s = new Spr(11, 11); for (let a = 0; a < 8; a++) { const c = Math.cos(a * .785), d = Math.sin(a * .785); s.set(5 + c * 4.6, 5 + d * 4.6, 3); } s.ell(5.5, 5.5, 3.3, 3.3, [2, 3, 4]); return (ICC[k] = s.outline(1).canvas(palette(on ? ['#2a140c', '#ffc020', '#e08a10', '#fff3b0'] : ['#2a140c', '#6a5a4a', '#4a3e34', '#7a6a5a']))); }
function stars(x, y, n, of) { for (let i = 0; i < (of || 3); i++) g.drawImage(starIcon(i < n), Math.round(x + i * 13), Math.round(y)); }
function starIcon(on) { const k = on ? 'starOn' : 'starOff'; if (ICC[k]) return ICC[k]; const s = new Spr(12, 12); const P = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 2.4 : 5.6, a = -Math.PI / 2 + i * Math.PI / 5; P.push([6 + Math.cos(a) * r, 6.5 + Math.sin(a) * r]); } for (let i = 0; i < 10; i++) s.tri(6, 6.5, P[i][0], P[i][1], P[(i + 1) % 10][0], P[(i + 1) % 10][1], i < 5 ? 2 : 3); return (ICC[k] = s.outline(1).canvas(palette(on ? ['#2a140c', '#ffd040', '#f6a020'] : ['#2a140c', '#6a5a4a', '#5a4a3e']))); }
function carrotIcon() { return A.carrot[0]; }
// a number with a carrot in front
function carrots(n, x, y, o) { o = o || {}; const c = A.carrot[0]; g.drawImage(c, 0, 0, c.width, c.height, Math.round(x), Math.round(y - 3), 11, Math.round(c.height * 11 / c.width)); return 13 + tx(String(n), x + 13, y, o.col || '#ffffff', { oc: o.oc === undefined ? '#2a140c' : o.oc }); }

/* ---------- faces: a head-and-shoulders crop of a cousin ---------- */
const FAMSET = {};
function famSet(i) { if (i === 0) return A.roof; if (i === 1) return A.nib; if (i === 2 && SAVE.drip) return A.hero; return FAMSET[i] || (FAMSET[i] = buildBun(FAM[i].fur, FAM[i].look)); }
function face(i, x, y, o) { o = o || {}; const set = famSet(i), c = set.idle[o.blink ? 1 : 0]; g.drawImage(c, 6, 0, 30, 30, Math.round(x), Math.round(y), 30, 30); }
function guestSet(k) { return k === 'dexter' ? A.dexter : k === 'pontoon' ? A.pontoon : k === 'boulder' ? A.bb1 : null; }

/* ---------- item icons: 16x16, drawn once ---------- */
const ICC = {};
function shade(h, k) { const c = rgb(h); return css(k < 0 ? mixRGB(c, [0, 0, 0], -k) : mixRGB(c, [255, 255, 255], k)).replace(/rgb\((\d+),(\d+),(\d+)\)/, (m, r, g2, b) => '#' + [r, g2, b].map(v => (+v).toString(16).padStart(2, '0')).join('')); }
function icon(def) {
  if (!def) return null; const key = def.join('|'); if (ICC[key]) return ICC[key];
  const [shape, c1 = '#ff8a1c', c2 = '#f6c645'] = def, s = new Spr(16, 16), A3 = [2, 3, 4], B3 = [5, 6, 7];
  const pal = palette(['#2a140c', c1, shade(c1, -.35), shade(c1, .4), c2, shade(c2, -.35), shade(c2, .4), '#ffffff', '#1a1420', '#f6c645', '#b8860b', '#8a5a32', '#5a3a22', '#3fb04a', '#237a2e', '#e03030', '#9aa3ad', '#5a5f66', '#ff8a1c']);
  const ring = (cx, cy, rx, ry, a, b, st) => { for (let t = 0; t < 6.3; t += st || .22) s.set(cx + Math.cos(t) * rx, cy + Math.sin(t) * ry, (Math.round(t / (st || .22)) & 1) ? a : b); };
  const P = ICON_SHAPES[shape]; if (P) P(s, A3, B3, ring); else s.ell(8, 8, 5, 5, A3);
  return (ICC[key] = s.outline(1).canvas(pal));
}
const ICON_SHAPES = {
  chain: (s, A3, B3, ring) => { ring(8, 6.5, 6, 4.5, 2, 4); ring(8, 6.5, 5, 3.6, 3, 2); s.ell(8, 12, 1.6, 1.6, A3); },
  rope: (s, A3, B3, ring) => { for (let t = 0; t < 6.3; t += .36) s.ell(8 + Math.cos(t) * 5.6, 6.5 + Math.sin(t) * 4.2, 1.3, 1.1, A3); s.ell(8, 12.5, 2, 2, [10, 11, 2]); },
  pend: (s, A3, B3, ring) => { ring(8, 5.5, 5.6, 4, 2, 4); s.tri(6, 10, 10, 10, 8, 15, 5); s.tri(7, 10, 9, 10, 8, 13, 7); s.rect(7, 8, 2, 2, 14); },
  ice: (s, A3, B3, ring) => { ring(8, 5.5, 5.6, 4, 2, 4); s.tri(5, 10, 11, 10, 8, 15, 5); s.tri(6, 10, 8, 10, 8, 13, 8); s.rect(5, 9, 6, 1, 7); },
  ring: s => { for (let t = 0; t < 6.3; t += .2) { s.set(8 + Math.cos(t) * 4.5, 10 + Math.sin(t) * 3.5, 2); s.set(8 + Math.cos(t) * 3.6, 10 + Math.sin(t) * 2.6, 3); } s.ell(8, 5, 2.4, 2.2, [5, 6, 7]); s.set(7, 4, 8); },
  stud: s => { s.tri(8, 2, 3, 8, 13, 8, 4); s.tri(3, 8, 13, 8, 8, 14, 3); s.tri(8, 4, 5, 8, 8, 8, 8); s.rect(6, 8, 4, 1, 5); },
  sandch: (s, A3, B3, ring) => { ring(8, 5, 5.6, 3.8, 2, 4); s.ell(8, 11.5, 3.6, 3.4, [5, 6, 7]); s.set(8, 10, 6); s.set(7, 11, 6); s.set(9, 11, 6); s.set(8, 12, 6); },
  box: s => { s.rect(2, 5, 12, 9, 2); s.rect(2, 5, 12, 3, 4); s.rect(2, 8, 12, 1, 3); s.rect(7, 5, 2, 9, 5); s.line(4, 4, 7, 2, 5); s.line(12, 4, 9, 2, 5); s.set(8, 4, 5); },
  bag: s => { s.ell(8, 10, 7, 4.2, [2, 3, 4]); for (let t = 3.3; t < 6.2; t += .2) s.set(8 + Math.cos(t) * 4, 7 + Math.sin(t) * 4, 13); for (let i = 0; i < 6; i++) s.set(3 + i * 2, 9 + (i & 1) * 2, 5); s.rect(4, 13, 8, 1, 3); },
  trunk: s => { s.rect(2, 4, 12, 10, 2); s.rect(2, 4, 12, 2, 4); s.rect(2, 8, 12, 1, 3); s.rect(4, 4, 2, 10, 13); s.rect(10, 4, 2, 10, 13); s.rect(7, 7, 2, 3, 10); for (let i = 0; i < 4; i++) s.set(3 + i * 3, 11 + (i & 1), 5); },
  scarf: s => { for (let x = 1; x < 15; x++) { const y = 6 + Math.round(Math.sin(x * .7) * 2); s.rect(x, y, 1, 4, x % 3 ? 2 : 5); } s.rect(11, 9, 3, 6, 2); s.rect(11, 13, 3, 1, 5); },
  beret: s => { s.ell(8, 9, 7, 3.4, [2, 3, 4]); s.rect(7, 4, 2, 2, 3); s.rect(3, 11, 10, 1, 3); },
  beanie: s => { s.ell(8, 9, 6, 5, [2, 3, 4]); s.rect(2, 11, 12, 3, 3); for (let x = 3; x < 14; x += 2) s.set(x, 12, 4); s.ell(8, 3, 2, 2, 8); },
  rim: s => { s.ell(8, 8, 7, 7, 9); s.ell(8, 8, 5.4, 5.4, [2, 3, 4]); for (let a = 0; a < 5; a++) s.line(8, 8, 8 + Math.cos(a * 1.257) * 5, 8 + Math.sin(a * 1.257) * 5, 3); s.ell(8, 8, 1.6, 1.6, 5); },
  coil: s => { for (let i = 0; i < 6; i++) s.line(3, 3 + i * 2, 13, 4 + i * 2, i & 1 ? 3 : 2); s.rect(2, 1, 12, 2, 18); s.rect(2, 14, 12, 2, 18); },
  neon: s => { s.rect(1, 7, 14, 4, 2); s.rect(1, 7, 14, 1, 4); s.rect(1, 11, 14, 2, 5); s.rect(1, 13, 14, 1, 7); s.rect(3, 4, 10, 3, 9); s.ell(4, 6, 1.5, 1.5, 9); s.ell(12, 6, 1.5, 1.5, 9); },
  speaker: s => { s.rect(3, 1, 10, 14, 2); s.rect(3, 1, 10, 1, 4); s.ell(8, 10, 3.6, 3.6, 9); s.ell(8, 10, 2, 2, 5); s.ell(8, 4.5, 1.8, 1.8, 9); s.set(8, 4, 5); },
  grill: s => { s.ell(8, 7, 6.5, 4, [2, 3, 4]); s.rect(1, 7, 14, 1, 17); s.line(4, 10, 2, 15, 9); s.line(12, 10, 14, 15, 9); s.line(8, 10, 8, 15, 9); for (let x = 3; x < 13; x += 3) s.rect(x, 5, 1, 2, 5); s.set(8, 2, 17); },
  smoker: s => { s.ell(7, 9, 6, 3.6, [2, 3, 4]); s.rect(11, 2, 3, 5, 18); s.rect(1, 9, 12, 1, 9); s.ell(3, 14, 1.5, 1.5, 9); s.ell(11, 14, 1.5, 1.5, 9); s.set(12, 1, 17); },
  lights: s => { for (let x = 0; x < 16; x++) s.set(x, 3 + Math.round(Math.sin(x / 15 * Math.PI) * 4), 9); for (let i = 0; i < 5; i++) { const x = 1 + i * 3.4, y = 4 + Math.round(Math.sin(x / 15 * Math.PI) * 4); s.ell(x + 1, y + 3, 1.3, 2, i & 1 ? [5, 6, 7] : [2, 3, 4]); } },
  hammock: s => { s.rect(1, 2, 2, 13, 12); s.rect(13, 2, 2, 13, 12); for (let x = 3; x < 13; x++) { const y = 5 + Math.round(Math.sin((x - 3) / 10 * Math.PI) * 5); s.rect(x, y, 1, 2, x & 1 ? 2 : 3); } },
  disco: s => { s.sphere(8, 9, 6, 6, [3, 2, 4, 8]); for (let x = 3; x < 14; x += 3) for (let y = 4; y < 15; y += 3) if (s.get(x, y)) s.set(x, y, 9); s.rect(8, 0, 1, 3, 9); },
  swing: s => { s.line(3, 0, 3, 8, 5); s.line(13, 0, 13, 8, 5); s.rect(1, 8, 14, 3, 2); s.rect(1, 8, 14, 1, 4); s.rect(1, 4, 14, 2, 3); s.rect(2, 11, 1, 3, 3); s.rect(13, 11, 1, 3, 3); },
  pool: s => { s.ell(8, 10, 7.5, 4.5, [5, 6, 7]); s.ell(8, 10, 5.5, 3, [2, 3, 4]); s.set(6, 9, 8); s.set(10, 11, 8); },
  bumper: s => { s.rect(1, 6, 14, 5, 17); s.rect(1, 6, 14, 1, 8); s.rect(1, 10, 14, 1, 18); s.ell(10, 6, 2.2, 2, 0); s.ell(13, 6.5, 1.6, 1.6, 0); s.rect(3, 8, 4, 2, 9); },
  record: s => { s.ell(8, 8, 7, 7, 9); for (let r = 3; r < 7; r += 2) for (let t = 0; t < 6.3; t += .25) s.set(8 + Math.cos(t) * r, 8 + Math.sin(t) * r, 18); s.ell(8, 8, 2.6, 2.6, [2, 3, 4]); s.set(8, 8, 9); s.set(5, 4, 17); },
  cup: s => { s.ell(8, 5, 5.5, 4, [2, 3, 4]); s.rect(2, 2, 12, 3, 2); s.rect(2, 2, 12, 1, 4); s.rect(7, 8, 2, 4, 3); s.rect(4, 12, 8, 3, 3); s.rect(4, 12, 8, 1, 4); for (const x of [1, 14]) s.ell(x, 5, 1.2, 2, 3); s.set(6, 4, 8); },
  stone: s => { s.ell(8, 10, 7, 3.6, [2, 3, 4]); s.ell(6, 9, 2, 1, 8); },
  peach: s => { s.ell(8, 9, 5.6, 5.2, [2, 3, 4]); s.line(8, 5, 8, 13, 3); s.ell(11, 3.5, 2.6, 1.2, 14, -.5); s.set(8, 3, 12); },
  clip: s => { s.rect(3, 2, 10, 13, 12); s.rect(4, 4, 8, 10, 8); for (let y = 6; y < 13; y += 2) s.rect(5, y, 6, 1, 17); s.rect(6, 1, 4, 3, 17); s.set(5, 6, 15); s.set(5, 10, 14); },
  crown: s => { s.rect(2, 8, 12, 5, 2); for (const x of [2, 6, 10]) s.tri(x, 9, x + 4, 9, x + 2, 2, 4); s.rect(2, 11, 12, 1, 3); s.ell(8, 10, 1.4, 1.4, 5); },
  watch: s => { s.ell(8, 9, 6, 6, [17, 18, 8]); s.ell(8, 9, 4.6, 4.6, 8); s.rect(7, 1, 2, 2, 17); s.line(8, 9, 8, 5.5, 9); s.line(8, 9, 10.5, 10, 5); },
  ribbon: s => { s.line(6, 9, 4, 15, 2); s.line(10, 9, 12, 15, 2); s.line(7, 9, 5, 15, 3); s.line(9, 9, 11, 15, 3); s.ell(8, 7, 5.5, 5.5, [2, 3, 4]); s.ell(8, 7, 2.6, 2.6, [5, 6, 7]); },
  specs: s => { s.ell(4.5, 8, 3.6, 3.6, 2); s.ell(11.5, 8, 3.6, 3.6, 2); s.ell(4.5, 8, 2.5, 2.5, 5); s.ell(11.5, 8, 2.5, 2.5, 5); s.set(5, 8, 9); s.set(12, 8, 9); s.set(5, 9, 9); s.set(12, 9, 9); s.rect(7, 7, 2, 1, 2); },
  hammer: s => { s.line(4, 14, 10, 6, 5); s.line(5, 14, 11, 6, 6); s.rect(6, 2, 9, 4, 2); s.rect(6, 2, 9, 1, 4); s.rect(12, 6, 3, 1, 3); },
  tag: s => { s.rect(4, 4, 10, 10, 2); s.rect(4, 4, 10, 2, 5); s.ell(9, 8, 1, 1, 0); s.line(9, 8, 2, 1, 5); for (let y = 10; y < 13; y += 2) s.rect(6, y, 6, 1, 3); },
  hair: s => { srand(5); for (let i = 0; i < 40; i++) { const a = rnd() * 6.3, r = rnd() * 5.6; s.set(8 + Math.cos(a) * r, 9 + Math.sin(a) * r * .8, i % 3 ? 2 : 3); } for (let i = 0; i < 6; i++) s.line(8, 9, 8 + Math.cos(i) * 7, 9 + Math.sin(i) * 6, 4); },
  photo: s => { s.rect(2, 2, 12, 13, 8); s.rect(3, 3, 10, 8, 5); s.ell(8, 9, 2.4, 2, 8); s.ell(8, 6, 1.6, 1.6, 8); s.set(7, 4, 8); s.set(9, 4, 8); s.rect(3, 11, 10, 1, 7); },
  note: s => { s.rect(2, 4, 12, 9, 2); s.line(2, 4, 8, 9, 3); s.line(14, 4, 8, 9, 3); s.ell(8, 10.5, 1.6, 1.4, 5); s.set(7, 9, 5); s.set(9, 9, 5); },
  shoe: s => { for (let t = 0; t < 3.3; t += .12) { s.set(8 + Math.cos(t + 3.14) * 5.5, 8 - Math.sin(t + 3.14) * 6, 2); s.set(8 + Math.cos(t + 3.14) * 4.2, 8 - Math.sin(t + 3.14) * 4.8, 3); } s.rect(2, 8, 3, 6, 2); s.rect(11, 8, 3, 6, 2); s.set(3, 10, 9); s.set(12, 10, 9); },
  // food
  juice: s => { s.rect(4, 4, 8, 11, 8); s.rect(5, 6, 6, 8, 2); s.rect(5, 6, 6, 1, 4); s.line(10, 1, 8, 7, 15); s.rect(4, 4, 8, 1, 17); },
  greens: s => { s.ell(6, 9, 4.6, 5.6, [2, 3, 4], -.4); s.ell(10, 8, 4.4, 5.6, [2, 3, 4], .4); s.line(6, 13, 6, 5, 3); s.line(10, 13, 10, 4, 3); s.rect(7, 13, 3, 3, 14); },
  ribs: s => { s.ell(8, 9, 7, 4.5, [2, 3, 4]); for (let x = 3; x < 14; x += 3) { s.rect(x, 3, 1, 3, 8); s.set(x, 14, 8); } s.line(2, 9, 14, 9, 3); },
  pud: s => { s.rect(2, 8, 12, 6, 8); s.rect(3, 6, 10, 4, 2); s.rect(3, 6, 10, 1, 4); for (let x = 3; x < 13; x += 3) s.ell(x + 1, 6, 1.4, 1, 10); s.rect(2, 14, 12, 1, 17); },
  cobbler: s => { s.ell(8, 10, 7, 4, [17, 18, 8]); s.ell(8, 9, 6, 3, [2, 3, 4]); for (let x = 3; x < 14; x += 3) s.line(x, 7, x + 1, 11, 3); s.ell(7, 8, 1, .8, 16); s.ell(11, 9, 1, .8, 16); },
  corn: s => { s.rect(2, 5, 12, 9, 2); s.rect(2, 5, 12, 2, 4); s.rect(2, 12, 12, 2, 3); s.set(5, 8, 3); s.set(10, 9, 3); s.set(7, 10, 3); s.rect(9, 3, 4, 2, 10); },
  melon: s => { for (let t = 3.14; t < 6.3; t += .05) for (let r = 0; r < 7; r++) s.set(8 + Math.cos(t) * r, 12 + Math.sin(t) * r, r > 5.5 ? 14 : r > 4.6 ? 8 : 2); for (const [x, y] of [[6, 9], [9, 8], [11, 10], [7, 11]]) s.set(x, y, 9); },
  eggs: s => { s.ell(5, 10, 3.6, 3, 8); s.ell(11, 9, 3.6, 3, 8); s.ell(5, 9.5, 1.8, 1.4, [2, 3, 4]); s.ell(11, 8.5, 1.8, 1.4, [2, 3, 4]); s.set(5, 9, 16); s.set(11, 8, 16); },
  nuts: s => { s.ell(5, 7, 3, 2.4, [2, 3, 4]); s.ell(7.5, 9, 2.4, 2, [2, 3, 4]); s.ell(10, 11, 3, 2.4, [2, 3, 4], .6); s.ell(12, 6, 2.6, 2, [2, 3, 4], -.4); },
  croiss: s => { for (let t = 3.4; t < 6.0; t += .05) { const r = 3 + Math.sin((t - 3.4) / 2.6 * Math.PI) * 2.8; for (let k = -r; k <= r; k++) s.set(8 + Math.cos(t) * 5.4, 12 + Math.sin(t) * 7 + k * .55, k < -r / 2 ? 4 : k > r / 2 ? 3 : 2); } },
  mix: s => { s.rect(3, 3, 10, 12, 12); s.rect(3, 3, 10, 2, 13); s.rect(4, 7, 8, 6, 8); s.set(6, 9, 15); s.set(9, 10, 2); s.set(7, 11, 10); s.set(10, 8, 3); },
  potato: s => { s.ell(8, 9, 7, 3.6, [2, 3, 4], -.3); s.set(5, 8, 3); s.set(10, 10, 3); s.rect(1, 7, 2, 1, 14); },
  lettuce: s => { s.ell(8, 9, 6.4, 5.4, [2, 3, 4]); for (let t = 0; t < 6.3; t += .8) s.line(8, 9, 8 + Math.cos(t) * 5, 9 + Math.sin(t) * 4, 3); },
  stew: s => { s.ell(8, 10, 6.6, 4.2, [17, 18, 8]); s.rect(2, 7, 12, 4, 18); s.ell(8, 7, 6, 1.8, [2, 3, 4]); s.rect(0, 8, 2, 2, 18); s.rect(14, 8, 2, 2, 18); s.set(6, 7, 14); s.set(10, 6, 14); },
  icebag: s => { s.rect(3, 4, 10, 11, 4); s.rect(3, 4, 10, 1, 8); s.rect(6, 2, 4, 2, 2); for (const [x, y] of [[5, 7], [9, 8], [6, 11], [10, 12]]) s.rect(x, y, 2, 2, 8); s.rect(4, 9, 8, 2, 2); },
  // haul and hunt things
  shingles: s => { for (let i = 0; i < 4; i++) { s.rect(1 + (i & 1), 12 - i * 3, 14, 3, i & 1 ? 3 : 2); s.rect(1 + (i & 1), 12 - i * 3, 14, 1, 4); } },
  basket: s => { s.ell(8, 11, 7, 4, [12, 13, 12]); for (let x = 2; x < 15; x += 2) s.line(x, 8, x, 14, 13); for (let t = 3.2; t < 6.2; t += .15) s.set(8 + Math.cos(t) * 6, 9 + Math.sin(t) * 7, 13); s.tri(5, 8, 7, 8, 6, 3, 18); s.tri(9, 8, 11, 8, 10, 2, 18); s.set(6, 2, 14); s.set(10, 1, 14); },
  cooler: s => { s.rect(1, 5, 14, 10, 2); s.rect(1, 5, 14, 3, 8); s.rect(1, 8, 14, 1, 3); s.rect(5, 3, 6, 2, 17); s.rect(3, 10, 10, 3, 4); },
  wmelon: s => { s.ell(8, 9, 7.4, 5.4, [14, 15, 14]); for (let x = 2; x < 15; x += 3) for (let y = 5; y < 14; y++) if (s.get(x, y)) s.set(x, y, 15); s.ell(5, 7, 2, 1, 7); },
  acorn: s => { s.ell(8, 10, 4.6, 5, [10, 11, 8]); s.ell(8, 5.5, 5.5, 2.6, [12, 13, 12]); s.rect(8, 1, 1, 3, 13); s.set(6, 9, 8); },
  pebble: s => { s.ell(8, 9, 6, 5, [17, 18, 8]); s.ell(8, 9, 3.6, 2.6, 9); s.set(7, 8, 4); s.rect(12, 2, 1, 4, 18); s.set(12, 1, 15); }
};
