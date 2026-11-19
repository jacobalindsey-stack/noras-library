'use strict';
/* ================= Georgia Buns — art engine =================
   Everything is drawn in code at native resolution as indexed pixel
   sprites (Spr), auto-outlined, then turned into canvases per palette. */

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const sgn = v => v < 0 ? -1 : v > 0 ? 1 : 0;
function hash(x, y) {
  let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}
function mkC(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function mixRGB(a, b, t) { return [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))]; }
function css(c) { return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; }
let RS = 7;
function srand(s) { RS = (Math.imul((s | 0) + 1, 2654435761) >>> 0) || 1; for (let i = 0; i < 8; i++) rnd(); }
function rnd() { RS ^= RS << 13; RS >>>= 0; RS ^= RS >>> 17; RS ^= RS << 5; RS >>>= 0; return RS / 4294967296; }

class Spr {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8Array(w * h); }
  set(x, y, c) { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c; }
  get(x, y) { x = Math.floor(x); y = Math.floor(y); return (x >= 0 && y >= 0 && x < this.w && y < this.h) ? this.d[y * this.w + x] : 0; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  // ellipse, optionally rotated; c may be [base, shadow, light] for volume shading
  ell(cx, cy, rx, ry, c, ang = 0) {
    const ca = Math.cos(ang), sa = Math.sin(ang), R = Math.max(rx, ry) + 1;
    for (let y = Math.floor(cy - R); y <= cy + R; y++) for (let x = Math.floor(cx - R); x <= cx + R; x++) {
      const px = x + .5 - cx, py = y + .5 - cy;
      const u = (px * ca + py * sa) / rx, v = (-px * sa + py * ca) / ry;
      if (u * u + v * v <= 1) {
        let col = c;
        if (Array.isArray(c)) {
          const d = (px / R) * 0.55 + (py / R) * 0.85;
          col = d > 0.4 ? c[1] : (d < -0.52 && c[2]) ? c[2] : c[0];
        }
        this.set(x, y, col);
      }
    }
  }
  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy;
    for (let i = 0; i < 400; i++) { this.set(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  }
  tri(ax, ay, bx, by, cx, cy, c) {
    const x0 = Math.floor(Math.min(ax, bx, cx)), x1 = Math.ceil(Math.max(ax, bx, cx)), y0 = Math.floor(Math.min(ay, by, cy)), y1 = Math.ceil(Math.max(ay, by, cy));
    const f = (px, py, qx, qy, rx, ry) => (qx - px) * (ry - py) - (qy - py) * (rx - px);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + .5, py = y + .5, a = f(ax, ay, bx, by, px, py), b = f(bx, by, cx, cy, px, py), d = f(cx, cy, ax, ay, px, py);
      if ((a >= 0 && b >= 0 && d >= 0) || (a <= 0 && b <= 0 && d <= 0)) this.set(x, y, c);
    }
  }
  outline(oc) {
    const n = new Uint8Array(this.d);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.d[y * this.w + x]) continue;
      if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) n[y * this.w + x] = oc;
    }
    this.d = n; return this;
  }
  canvas(pal) {
    const c = mkC(this.w, this.h), g = c.getContext('2d'), id = g.createImageData(this.w, this.h);
    for (let i = 0; i < this.d.length; i++) {
      const k = this.d[i]; if (!k) continue; const p = pal[k]; if (!p) continue;
      id.data[i * 4] = p[0]; id.data[i * 4 + 1] = p[1]; id.data[i * 4 + 2] = p[2]; id.data[i * 4 + 3] = p.length > 3 ? p[3] : 255;
    }
    g.putImageData(id, 0, 0); return c;
  }
}
function palette(list) { return [null].concat(list.map(h => h ? rgb(h) : null)); }

/* ---------- bitmap font 5x7 ---------- */
const FONT = {
  A: [14, 17, 17, 31, 17, 17, 17], B: [30, 17, 17, 30, 17, 17, 30], C: [14, 17, 16, 16, 16, 17, 14], D: [30, 17, 17, 17, 17, 17, 30],
  E: [31, 16, 16, 30, 16, 16, 31], F: [31, 16, 16, 30, 16, 16, 16], G: [14, 17, 16, 23, 17, 17, 15], H: [17, 17, 17, 31, 17, 17, 17],
  I: [14, 4, 4, 4, 4, 4, 14], J: [7, 2, 2, 2, 2, 18, 12], K: [17, 18, 20, 24, 20, 18, 17], L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17], N: [17, 17, 25, 21, 19, 17, 17], O: [14, 17, 17, 17, 17, 17, 14], P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13], R: [30, 17, 17, 30, 20, 18, 17], S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14], V: [17, 17, 17, 17, 17, 10, 4], W: [17, 17, 17, 21, 21, 21, 10], X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 10, 4, 4, 4, 4], Z: [31, 1, 2, 4, 8, 16, 31],
  0: [14, 17, 19, 21, 25, 17, 14], 1: [4, 12, 4, 4, 4, 4, 14], 2: [14, 17, 1, 2, 4, 8, 31], 3: [31, 2, 4, 2, 1, 17, 14],
  4: [2, 6, 10, 18, 31, 2, 2], 5: [31, 16, 30, 1, 1, 17, 14], 6: [6, 8, 16, 30, 17, 17, 14], 7: [31, 1, 2, 4, 8, 8, 8],
  8: [14, 17, 17, 14, 17, 17, 14], 9: [14, 17, 17, 15, 1, 2, 12],
  '.': [0, 0, 0, 0, 0, 12, 12], ',': [0, 0, 0, 0, 12, 4, 8], '!': [4, 4, 4, 4, 4, 0, 4], '?': [14, 17, 1, 2, 4, 0, 4],
  "'": [4, 4, 8, 0, 0, 0, 0], ':': [0, 12, 12, 0, 12, 12, 0], '-': [0, 0, 0, 31, 0, 0, 0], '/': [1, 1, 2, 4, 8, 16, 16],
  '+': [0, 4, 4, 31, 4, 4, 0], '(': [2, 4, 8, 8, 8, 4, 2], ')': [8, 4, 2, 2, 2, 4, 8], '&': [12, 18, 20, 8, 21, 18, 13],
  '>': [16, 8, 4, 2, 4, 8, 16], '<': [1, 2, 4, 8, 4, 2, 1], '"': [10, 10, 0, 0, 0, 0, 0]
};
function textW(s, sc = 1) { let w = 0; for (const ch of s) w += (ch === ' ' ? 4 : 6); return Math.max(0, w - 1) * sc; }
function drawText(g, s, x, y, col, sc = 1, shadow) {
  s = String(s).toUpperCase();
  if (shadow) drawText(g, s, x + sc, y + sc, shadow, sc);
  g.fillStyle = col; let cx = Math.round(x); y = Math.round(y);
  for (const ch of s) {
    if (ch === ' ') { cx += 4 * sc; continue; }
    const gl = FONT[ch]; if (gl) for (let r = 0; r < 7; r++) { const row = gl[r]; for (let b = 0; b < 5; b++) if (row & (16 >> b)) g.fillRect(cx + b * sc, y + r * sc, sc, sc); }
    cx += 6 * sc;
  }
}
// outlined text: thick dark border then fill
function drawTextO(g, s, x, y, col, sc, oc, ow) {
  const o = ow || Math.min(sc, 2);
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) drawText(g, s, x + dx * o, y + dy * o, oc, sc);
  drawText(g, s, x, y, col, sc);
}
// text rendered once to a small canvas (for DOM buttons)
function textCanvas(s, col, sc, oc) {
  const w = textW(s.toUpperCase(), 1) + 4, h = 11, c = mkC(w, h), g = c.getContext('2d');
  if (oc) drawTextO(g, s, 2, 2, col, 1, oc); else drawText(g, s, 2, 2, col, 1);
  return c;
}

/* ---------- the buns ---------- */
// palette slots: 1 outline 2 fur 3 furD 4 furL 5 cream 6 creamD 7 pink 8 white 9 black 10 nose 11 gold 12 goldD 13 goldL 14 orange 15 green 16 shades
const BUN_FURS = {
  hero: ['#a8683a', '#764022', '#d79e64'],
  gray: ['#8f919c', '#616370', '#bfc1cc'],
  tan: ['#c79c6c', '#94704a', '#e8c696'],
  dark: ['#6a4430', '#432a1c', '#8f6248'],
  white: ['#e8e1d6', '#b9b0a2', '#ffffff'],
  ginger: ['#c97a3c', '#954f20', '#eda562'],
  smoke: ['#4a4046', '#2c2529', '#6e6168'],
  honey: ['#b8863e', '#82591f', '#e0b36a'],
  dexter: ['#e2c48e', '#b8955c', '#f6e2b6'],
  marsh: ['#9a8468', '#6e5a44', '#c2ad8e']
};
function bunPal(fur) {
  const f = BUN_FURS[fur] || BUN_FURS.hero;
  return palette(['#2a140c', f[0], f[1], f[2], '#f4e2bd', '#d4b88c', '#ef8e94', '#ffffff', '#1a0e0a', '#d95a72', '#f6c645', '#b8860b', '#fff3b0', '#ff8a1c', '#3fb04a', '#121018']);
}
const BW = 40, BH = 46, BAX = 19, BAY = 44; // sprite size and feet anchor
function bunSpr(o) {
  if (o.fat && !o.ball) o = Object.assign({}, o, { brx: o.brx + 2, bry: o.bry + 1, e1x: o.hx - 5, e1y: o.hy - 1, e1a: 1.2, el1: 7, e2x: o.hx - 8, e2y: o.hy - 2, e2a: 1.4, el2: 6.5 });
  const s = new Spr(BW, BH), Y = v => v + 3;
  const F = [2, 3, 4], C = [5, 6, 5], FD = [3, 3, 2];
  const hx = o.hx, hy = Y(o.hy);
  if (!o.ball) {
    s.ell(o.e2x, Y(o.e2y), 2.4, o.el2 || 7, FD, o.e2a);
    s.ell(o.bfx, Y(o.bfy), 4.4, 2.1, FD, o.bfa || 0);
    s.ell(o.tx, Y(o.ty), 3, 3, C);
    s.ell(o.bx, Y(o.by), o.brx, o.bry, F, o.ba || 0);
    s.ell(o.bx + (o.bellx || 3), Y(o.by + 1), o.brx * 0.52, o.bry * 0.7, C, o.ba || 0);
    if (o.blur) { // peel-out leg wheel
      s.ell(18, Y(38), 9, 3.6, FD);
      for (let i = 0; i < 6; i++) { const a = o.blur * 1.3 + i * 1.05; s.set(18 + Math.cos(a) * 7, Y(38) + Math.sin(a) * 2.6, 4); }
    } else s.ell(o.ffx, Y(o.ffy), 4.8, 2.3, F, o.ffa || 0);
    s.ell(hx, hy, 6.8, 6.2, F);
    s.ell(hx + 3.6, hy + 2.3, 3.4, 2.7, C);
    // eye
    if (o.eye === 'closed') s.line(hx + 1, hy - 1, hx + 3, hy - 1, 9);
    else if (o.eye === 'x') { s.set(hx + 1, hy - 2, 9); s.set(hx + 3, hy - 2, 9); s.set(hx + 2, hy - 1, 9); s.set(hx + 1, hy, 9); s.set(hx + 3, hy, 9); }
    else {
      const ey = o.eye === 'up' ? -2.5 : -1.5;
      s.ell(hx + 2, hy + ey, 1.7, 2.4, 8);
      s.set(hx + 2.6, hy + ey - 0.2, 9); s.set(hx + 2.6, hy + ey + 0.8, 9); s.set(hx + 1.6, hy + ey - 1.4, 8);
    }
    if (o.shades) { s.rect(hx - 0.5, hy - 3, 6, 2.5, 16); s.set(hx - 2, hy - 3, 16); s.set(hx + 1, hy - 3, 8); }
    s.set(hx + 6.6, hy + 0.6, 10); s.set(hx + 6.6, hy + 1.6, 10);
    if (o.teeth) { s.set(hx + 5, hy + 3.6, 8); s.set(hx + 5, hy + 4.6, 8); }
    if (o.mouth) { s.ell(hx + 4.6, hy + 4, 1.6, 1.4, 9); s.set(hx + 5, hy + 2.8, 8); }
    // front ear + inner
    s.ell(o.e1x, Y(o.e1y), 2.7, o.el1 || 7.8, F, o.e1a);
    s.ell(o.e1x + Math.cos(o.e1a) * 0.6, Y(o.e1y) + Math.sin(o.e1a) * 0.6, 1.1, (o.el1 || 7.8) - 2.6, 7, o.e1a);
    if (o.ax != null) s.ell(o.ax, Y(o.ay), 1.8, 3.1, [2, 3, 4], o.aa || 0);
    // chain (ice drip), carrot pendant for the hero
    if (o.chain !== false) {
      const x0 = hx - 5, y0 = hy + 5.5;
      for (let i = 0; i <= 7; i++) { const t = i / 7; s.set(x0 + i, y0 + Math.sin(t * Math.PI) * 1.8 + (o.chainTilt || 0) * t, (i % 2) ? 13 : 11); }
      if (o.pendant) { const px = x0 + 3.5, py = y0 + 2.8 + (o.chainTilt || 0) * .5;
        if (o.pendant === 'ice') { s.set(px, py, 8); s.set(px - 1, py + 1, 8); s.set(px + 1, py + 1, 13); s.set(px, py + 1, 8); s.set(px, py + 2, 8); }
        else if (o.pendant === 'rope') { for (let i = 0; i <= 7; i++) s.set(x0 + i, y0 + 1 + Math.sin(i / 7 * Math.PI) * 2.2, 12); s.set(px, py, 11); s.set(px + 1, py, 13); s.set(px, py + 1, 11); s.set(px + 1, py + 1, 11); }
        else { s.set(px, py, 15); s.set(px, py + 1, 14); s.set(px, py + 2, 14); s.set(px + 1, py + 1, 14); } }
    }
  } else {
    const ph = o.ball, cx = 19, cy = Y(32);
    s.ell(cx, cy, 10, 10, F);
    s.ell(cx + Math.cos(ph) * 4.5, cy + Math.sin(ph) * 4.5, 4, 4, C);
    s.ell(cx + Math.cos(ph + 2.4) * 6.5, cy + Math.sin(ph + 2.4) * 6.5, 2.2, 4, [3, 3, 2], ph + 2.4);
    for (let k = 0; k < 3; k++) { const a = ph + k * 2.09 + 1; for (let r = 3; r < 9; r++) s.set(cx + Math.cos(a + r * 0.18) * r, cy + Math.sin(a + r * 0.18) * r, 3); }
    s.set(cx + Math.cos(ph - 1.2) * 7, cy + Math.sin(ph - 1.2) * 7, 13);
  }
  return s.outline(1);
}
const BASE = { bx: 17, by: 30, brx: 8, bry: 9, hx: 21, hy: 18, e1x: 19, e1y: 6, e1a: -0.15, e2x: 15.5, e2y: 7, e2a: -0.45, tx: 9, ty: 31, bfx: 14, bfy: 39, ffx: 23, ffy: 39, ax: 22.5, ay: 28 };
const P = (o) => Object.assign({}, BASE, o);
const POSES = {
  idle: [P({}), P({ eye: 'closed' })],
  walk: [0, 1, 2, 3].map(i => {
    const ff = [[25, 39], [21, 40], [14, 39], [18, 40]][i], bf = [[13, 40], [17, 40], [24, 39], [20, 40]][i], b = i % 2 ? -1 : 0;
    return P({ by: 30 + b, ba: 0.08, hx: 22, hy: 18 + b, e1x: 18, e1y: 6 + b, e1a: -0.4, e2x: 14.5, e2y: 7 + b, e2a: -0.65, ffx: ff[0], ffy: ff[1], bfx: bf[0], bfy: bf[1], ax: 22 + (i < 2 ? 1 : -1), ay: 28 + b, aa: i < 2 ? .5 : -.5 });
  }),
  run: [0, 1, 2, 3].map(i => {
    const ff = [[28, 39], [23, 40], [12, 38], [17, 40]][i], bf = [[10, 38], [15, 40], [27, 39], [21, 40]][i], b = i % 2 ? -1 : 0;
    return P({ bx: 17, by: 31 + b, brx: 9, bry: 7, ba: 0.28, bellx: 2, hx: 25, hy: 22 + b, e1x: 15, e1y: 13 + b, e1a: -1.15, el1: 8, e2x: 12, e2y: 15 + b, e2a: -1.3, tx: 8, ty: 28 + b, ffx: ff[0], ffy: ff[1], bfx: bf[0], bfy: bf[1], ax: 24, ay: 30 + b, aa: i < 2 ? 1 : -0.2, chainTilt: 1.5 });
  }),
  dash: [0, 1, 2, 3].map(i => P({ bx: 17, by: 31, brx: 9, bry: 7, ba: 0.3, bellx: 2, hx: 26, hy: 23, e1x: 14, e1y: 15, e1a: -1.3, el1: 8.5, e2x: 11, e2y: 17, e2a: -1.4, tx: 8, ty: 28, blur: i + 1, ax: 25, ay: 30, aa: 1.2, chainTilt: 2 })),
  ball: [0, 1, 2, 3].map(i => P({ ball: 0.01 + i * Math.PI / 2 })),
  jump: [P({ bx: 18, by: 27, brx: 7, bry: 9.5, hx: 21, hy: 15, e1x: 21, e1y: 3, e1a: 0.15, e2x: 17, e2y: 4, e2a: -0.2, bfx: 15, bfy: 38, ffx: 22, ffy: 39, ax: 26, ay: 19, aa: -0.7, eye: 'up' })],
  fall: [P({ bx: 18, by: 28, brx: 7.5, bry: 9, hx: 21, hy: 17, e1x: 22, e1y: 4, e1a: 0.45, e2x: 15, e2y: 5, e2a: -0.6, bfx: 13, bfy: 38, ffx: 24, ffy: 38, ax: 27, ay: 25, aa: -1.2 })],
  hurt: [P({ bx: 17, by: 29, ba: -0.3, hx: 19, hy: 17, e1x: 23, e1y: 5, e1a: 0.8, e2x: 12, e2y: 7, e2a: -0.9, eye: 'x', bfx: 11, bfy: 38, ffx: 25, ffy: 37, ax: 27, ay: 22, aa: -1.1, mouth: 1 })],
  skid: [P({ bx: 15, by: 31, ba: -0.35, hx: 19, hy: 21, e1x: 24, e1y: 10, e1a: 0.55, e2x: 21, e2y: 11, e2a: 0.3, ffx: 28, ffy: 40, bfx: 12, bfy: 40, ax: 13, ay: 28, aa: 0.6, eye: 'x' })],
  crouch: [P({ bx: 18, by: 35, brx: 9, bry: 6, hx: 24, hy: 29, e1x: 15, e1y: 25, e1a: -1.35, el1: 7, e2x: 12, e2y: 27, e2a: -1.45, ffx: 25, ffy: 40, bfx: 13, bfy: 40, ax: 25, ay: 35, tx: 9, ty: 36 })],
  up: [P({ hy: 17, eye: 'up', e1x: 16, e1y: 7, e1a: -0.6, e2x: 13, e2y: 9, e2a: -0.8 })],
  sleep: [P({ bx: 19, by: 37, brx: 10, bry: 6, hx: 27, hy: 34, eye: 'closed', e1x: 17, e1y: 31, e1a: -1.5, el1: 7, e2x: 15, e2y: 33, e2a: -1.5, tx: 9, ty: 37, bfx: 13, bfy: 41, ffx: 25, ffy: 41, ax: null, chain: false })],
  wave: [P({ ax: 27, ay: 17, aa: -0.25 }), P({ ax: 28, ay: 18, aa: -0.75 })],
  chomp: [P({ teeth: 1 }), P({ teeth: 1, mouth: 1, hy: 19 })],
  cheer: [P({ by: 30, ax: 25, ay: 18, aa: -0.4, mouth: 1, e1a: 0.1, e2a: -0.25 }), P({ by: 28, hy: 16, ax: 26, ay: 16, aa: -0.2, mouth: 1, e1y: 4, e2y: 5, e1a: 0.15, e2a: -0.2, bfy: 37, ffy: 37 })],
  throw: [P({ ax: 28, ay: 25, aa: -1.4, hx: 22 }), P({ ax: 15, ay: 22, aa: 0.9, bx: 16, ba: -0.15 })],
  catsit: [P({ by: 29, brx: 6.5, bry: 10, hx: 20, hy: 15, ffx: 22, ffy: 40, bfx: 16, bfy: 40, ax: 21.5, ay: 31, aa: 0.1, e1x: 20, e1y: 3, e1a: -0.05, e2x: 17, e2y: 4, e2a: -0.25 }), P({ by: 29, brx: 6.5, bry: 10, hx: 20, hy: 15, ffx: 22, ffy: 40, bfx: 16, bfy: 40, ax: 21.5, ay: 31, aa: 0.1, e1x: 20, e1y: 3, e1a: -0.05, e2x: 17, e2y: 4, e2a: -0.25, eye: 'closed' })]
};
// build every pose for a fur/accessory combo
function buildBun(fur, extra) {
  const pal = bunPal(fur), out = {};
  for (const k in POSES) out[k] = POSES[k].map(o => bunSpr(Object.assign({}, o, extra || {})).canvas(pal));
  return out;
}

/* ---------- small sprites ---------- */
const PAL_GEN = palette(['#2a140c', '#ff8a1c', '#d0600c', '#ffc070', '#3fb04a', '#237a2e', '#8fe36a',
  '#9aa3ad', '#6c7580', '#d8e0e8', '#ffffff', '#c8913a', '#8a5a22', '#e8b85e', '#5a5f66', '#7e8b6a', '#4f6a3a', '#3a3f45',
  '#6b4a2e', '#4a311c', '#a07448', '#c2a070', '#5b9cff', '#bfe8ff', '#9a6e3a', '#c89a5a', '#e8c890', '#4a2e18', '#f2e6c8', '#d8a020', '#1a0e0a', '#7ad050', '#e03030']);
// index helper names
const G = { o: 1, or: 2, orD: 3, orL: 4, gr: 5, grD: 6, grL: 7, st: 8, stD: 9, stL: 10, wh: 11, ps: 12, psD: 13, psL: 14, bo: 15, moss: 16, mossD: 17, boD: 18, wd: 19, wdD: 20, wdL: 21, wdLL: 22, sc: 23, scL: 24, bc: 25, bcL: 26, bcLL: 27, bcD: 28, cream: 29, yel: 30, blk: 31, grB: 32, red: 33 };

function carrotFrames() {
  const fr = [];
  for (let i = 0; i < 8; i++) {
    const w = Math.cos(i / 8 * Math.PI * 2), k = Math.max(Math.abs(w), 0.22), s = new Spr(14, 20);
    for (let y = 7; y < 19; y++) {
      const t = (y - 7) / 11, hw = (4.3 * (1 - t) + 0.5) * k;
      for (let x = 0; x < 14; x++) {
        const px = x + .5 - 7;
        if (Math.abs(px) <= hw + 0.01) {
          let c = G.or; const side = px / Math.max(hw, .5) * (w >= 0 ? 1 : -1);
          if (side > 0.45) c = G.orD; else if (side < -0.35) c = G.orL;
          if ((y === 10 || y === 13 || y === 16) && Math.abs(px - hw * 0.3) < 1.2) c = G.orD;
          s.set(x, y, c);
        }
      }
    }
    const lk = Math.max(Math.abs(w), 0.5);
    s.ell(7 - 2 * lk, 4, 1.2, 3.2, G.gr, -0.5); s.ell(7 + 2 * lk, 4, 1.2, 3.2, G.grD, 0.5); s.ell(7, 3, 1.3, 3.6, G.grL);
    fr.push(s.outline(G.o).canvas(PAL_GEN));
  }
  return fr;
}
function rockItemSpr(glint) {
  const s = new Spr(16, 12); s.ell(8, 7, 6.5, 3.6, [G.st, G.stD, G.stL]); s.ell(6, 6, 2.5, 1, G.stL);
  if (glint) { s.set(5, 2, G.wh); s.set(5, 1, G.wh); s.set(4, 2, G.wh); s.set(6, 2, G.wh); s.set(5, 3, G.wh); }
  return s.outline(G.o).canvas(PAL_GEN);
}
function springSpr(squash) {
  const h = squash ? 9 : 14, s = new Spr(36, 16);
  s.ell(18, 16 - h / 2 + 1, 16, h / 2 + 1, [G.ps, G.psD, G.psL]);
  srand(squash ? 3 : 9);
  for (let i = 0; i < 46; i++) { const x = 4 + rnd() * 28, y = 16 - rnd() * h, a = rnd() * 3; s.line(x, y, x + Math.cos(a) * 4, y + Math.sin(a) * 2, rnd() < .5 ? G.psD : G.psL); }
  return s.outline(G.o).canvas(PAL_GEN);
}
function boulderSpr(r) {
  const d = r * 2 + 4, s = new Spr(d, d), c = r + 2;
  s.ell(c, c, r, r * 0.92, [G.bo, G.boD, G.stL]);
  s.ell(c - r * .2, c - r * .6, r * .7, r * .32, [G.moss, G.mossD, G.grL]);
  srand(r * 7);
  for (let i = 0; i < r / 3; i++) { const a = rnd() * 6.28, rr = rnd() * r * .7; s.set(c + Math.cos(a) * rr, c + Math.sin(a) * rr * .9 + 2, G.boD); }
  s.line(c + r * .2, c, c + r * .5, c + r * .4, G.boD);
  return s.outline(G.o).canvas(PAL_GEN);
}
function acornSpr() { const s = new Spr(9, 11); s.ell(4.5, 7, 3.3, 3.6, [G.bc, G.bcD, G.bcL]); s.ell(4.5, 3.6, 4, 2, [G.wdD, G.wdD, G.wd]); s.set(4, 0, G.wdD); s.set(4, 1, G.wdD); return s.outline(G.o).canvas(PAL_GEN); }
function phoneSpr(f) {
  const s = new Spr(26, 22); s.ell(13, 13, 7, 8, [G.st, G.stD, G.stL]); s.rect(10, 9, 6, 7, G.sc); s.rect(11, 10, 2, 2, G.scL);
  for (let k = 0; k < 2; k++) { const r = 9 + k * 3 + (f % 2); for (let a = -0.9; a <= 0.9; a += 0.15) { s.set(13 + Math.cos(a - Math.PI / 2) * r, 13 + Math.sin(a - Math.PI / 2) * r, G.scL); } }
  return s.outline(G.o).canvas(PAL_GEN);
}
function sparkleSpr(i) {
  const s = new Spr(9, 9), r = [1, 3, 4, 2][i];
  for (let k = -r; k <= r; k++) { s.set(4 + k, 4, G.wh); s.set(4, 4 + k, G.wh); }
  if (i === 2) { s.set(3, 3, G.yel); s.set(5, 5, G.yel); s.set(5, 3, G.yel); s.set(3, 5, G.yel); }
  return s.canvas(PAL_GEN);
}
// big flat creek rock (platform art)
function flatRockSpr() {
  const s = new Spr(160, 130);
  s.ell(80, 74, 72, 60, [G.bo, G.boD, G.stL]);
  s.rect(0, 120, 160, 10, 0);
  for (let x = 0; x < 160; x++) for (let y = 0; y < 18; y++) if (y < 10 && s.get(x, y + 14)) s.set(x, y + 4, 0);
  s.ell(80, 22, 70, 9, [G.stL, G.st, G.wh]);
  srand(77); for (let i = 0; i < 40; i++) { const x = 20 + rnd() * 120, y = 35 + rnd() * 80; if (s.get(x, y)) s.set(x, y, G.boD); }
  s.ell(40, 30, 18, 4, [G.moss, G.mossD, G.grL]);
  return s.outline(G.o).canvas(PAL_GEN);
}
function logJamSpr(open) {
  const s = new Spr(60, 96);
  const logs = open ? [[30, 88, 26]] : [[30, 88, 26], [30, 70, 24], [28, 52, 22], [32, 34, 20], [29, 17, 17]];
  for (const [x, y, w] of logs) {
    s.rect(x - w, y - 7, w * 2, 14, G.wd); s.rect(x - w, y - 7, w * 2, 3, G.wdL); s.rect(x - w, y + 4, w * 2, 3, G.wdD);
    for (let i = x - w + 3; i < x + w - 6; i += 7) s.line(i, y - 2, i + 4, y - 1, G.wdD);
    s.ell(x + w, y, 4.5, 7, [G.wdLL, G.wdL, G.cream]); s.ell(x + w, y, 2, 3.4, G.wdL); s.set(x + w, y, G.wdD);
  }
  if (open) for (let i = 0; i < 14; i++) s.set(8 + i * 3, 78 + (i % 3), G.wdLL);
  return s.outline(G.o).canvas(PAL_GEN);
}

/* ---------- critters ---------- */
function bobcatFrames() {
  const pal = palette(['#2a140c', '#c99a58', '#9a6c36', '#e8c68c', '#f4e6c6', '#5a3a1e', '#1a0e0a', '#c8e04a', '#ffffff', '#d97a7a', '#3a2412']);
  const mk = (pose) => {
    const s = new Spr(60, 40);
    const F = [2, 3, 4];
    const { by, hx, hy, legs, sleep, eat, sit, mouth } = pose;
    // tail stub
    s.ell(sit ? 14 : 9, by - 7 + (sit ? 12 : 0), 5, 2.3, F, sit ? 0.3 : -0.6); s.ell(sit ? 10 : 5.5, by - 9.5 + (sit ? 11 : 0), 1.8, 1.6, 11);
    if (sit) { s.ell(24, 26, 10, 10, F); s.ell(28, 28, 5, 7, [5, 4, 5]); s.ell(18, 36, 6, 3, F); s.ell(30, 37, 5, 2.6, F); }
    else {
      // back legs
      for (const L of legs.back) s.ell(L[0], L[1], 2.8, 5, [3, 3, 2], L[2]);
      s.ell(25, by, 16, 7.5, F);
      s.ell(27, by + 3, 10, 3.5, [5, 4, 5]);
      for (const L of legs.front) s.ell(L[0], L[1], 2.8, 5, F, L[2]);
    }
    // spots
    srand(5); for (let i = 0; i < 40; i++) { const x = 12 + rnd() * 26, y = (sit ? 18 : by - 5) + rnd() * 8; if (s.get(x, y) === 2) s.set(x, y, 6); }
    // head
    s.ell(hx, hy, 7.5, 6.8, F);
    s.ell(hx + 3.5, hy + 3, 4.2, 3, [5, 4, 5]);
    s.tri(hx - 6, hy - 3, hx - 2, hy - 13, hx + 1, hy - 4, 2); s.tri(hx + 1, hy - 4, hx + 4, hy - 13, hx + 6, hy - 3, 2);
    s.set(hx - 2, hy - 14, 11); s.set(hx - 2, hy - 15, 11); s.set(hx + 4, hy - 14, 11); s.set(hx + 4, hy - 15, 11);
    s.set(hx - 2, hy - 8, 10); s.set(hx + 3, hy - 8, 10);
    // ruff
    s.tri(hx - 8, hy + 1, hx - 4, hy + 4, hx - 6, hy + 8, 5);
    if (sleep) { s.line(hx + 1, hy - 1, hx + 4, hy - 1, 7); }
    else { s.ell(hx + 2.5, hy - 1.5, 1.8, 1.8, 8); s.set(hx + 3, hy - 2, 7); s.set(hx + 3, hy - 1, 7); }
    s.set(hx + 7, hy + 1, 10);
    if (mouth || eat) { s.ell(hx + 5, hy + 4.5, 2, 1.4, 7); s.set(hx + 5, hy + 3.4, 9); }
    for (let i = 0; i < 3; i++) s.set(hx + 8 + i, hy + 2 + (i % 2), 5);
    return s.outline(1).canvas(pal);
  };
  const run = [0, 1, 2, 3].map(i => {
    const a = i * Math.PI / 2, sw = Math.sin(a) * 0.7;
    return mk({ by: 22 + (i % 2 ? -1 : 0), hx: 44, hy: 16 + (i % 2 ? -1 : 0), legs: { back: [[15 - sw * 5, 31, sw], [19 + sw * 5, 31, -sw]], front: [[35 + sw * 5, 31, -sw], [39 - sw * 5, 31, sw]] } });
  });
  return {
    run,
    sleep: [mk({ by: 30, hx: 45, hy: 28, sleep: 1, legs: { back: [[16, 35, 1.4]], front: [[38, 35, 1.4]] } })],
    eat: [0, 1].map(i => mk({ by: 26, hx: 45, hy: 26 + i, eat: 1, legs: { back: [[16, 33, 0], [20, 33, 0]], front: [[36, 33, 0], [40, 33, 0]] } })),
    sit: [0, 1].map(i => mk({ sit: 1, hx: 30, hy: 12 - i, mouth: i, legs: {} }))
  };
}
function squirrelFrames() {
  const pal = palette(['#20161a', '#8c8c94', '#5f5f69', '#c4c4cc', '#f2eee6', '#1a0e0a', '#ffffff', '#8a5a22', '#5a3a14']);
  return [0, 1].map(i => {
    const s = new Spr(26, 26);
    for (let k = 0; k < 9; k++) { const t = k / 8, a = -0.3 - t * 2.9 + (i ? 0.2 : 0); s.ell(7 + Math.cos(a) * 6 - t * 1, 16 + Math.sin(a) * 8, 4.2 - t * .8, 4.2 - t * .8, [2, 3, 4]); }
    s.ell(15, 18, 5, 6, [2, 3, 4]); s.ell(16.5, 19, 2.6, 4, 5);
    s.ell(18, 11, 4.5, 4, [2, 3, 4]); s.ell(19.5, 9.5, 1.3, 1.6, 7); s.set(20, 9, 6); s.set(22.4, 11, 6);
    s.ell(16, 6.5, 1.3, 2.3, 2); s.ell(18.5, 18, 1.8, 1.8, 8); s.set(18.5, 16.5, 9);
    s.ell(14, 24, 3, 1.6, 2); s.ell(19, 24, 3, 1.6, 2);
    return s.outline(1).canvas(pal);
  });
}
function otterFrames() {
  const pal = palette(['#1e120a', '#7a5232', '#553620', '#a07450', '#c9a47a', '#1a0e0a', '#ffffff', '#9aa3ad', '#6c7580', '#d8e0e8']);
  return [0, 1, 2].map(i => {
    const s = new Spr(48, 24), sq = i === 2 ? 2 : 0, b = i === 1 ? 1 : 0;
    s.ell(22, 14 + b + sq * .5, 17, 5.5 - sq, [2, 3, 4]); s.ell(22, 12 + b + sq * .5, 12, 3 - sq * .5, [5, 4, 5]);
    s.ell(39, 11 + b, 5.5, 5, [2, 3, 4]); s.ell(41.5, 13 + b, 3, 2.2, 5); s.set(40, 9 + b, 6); s.set(44, 12 + b, 6);
    for (let k = 0; k < 3; k++) s.set(45 + k, 13 + b + (k % 2), 7);
    s.ell(37, 6.5 + b, 1.5, 1.5, 3);
    s.ell(4, 13 + b, 5, 2, [2, 3, 4], 0.3);
    if (i !== 2) { s.ell(24, 8 + b, 4, 2.4, [8, 9, 10]); }
    s.ell(19, 9 + b, 1.6, 2.2, 2); s.ell(29, 9 + b, 1.6, 2.2, 2);
    s.ell(9, 9 + b, 1.8, 2.4, 3); s.ell(13, 9 + b, 1.8, 2.4, 3);
    return s.outline(1).canvas(pal);
  });
}
function foxFrames() {
  const pal = palette(['#24120a', '#e0702a', '#a9481a', '#f6a060', '#fbf3e6', '#1a0e0a', '#ffffff', '#3a2016']);
  return [0, 1].map(i => {
    const s = new Spr(30, 34);
    for (let k = 0; k < 8; k++) { const t = k / 7; s.ell(6 + t * 12, 30 - Math.sin(t * 3) * 3 - (i ? t * 2 : 0), 3.6, 3, [2, 3, 4]); }
    s.ell(19, 30, 2.6, 2.6, 5);
    s.ell(14, 22, 6.5, 9, [2, 3, 4]); s.ell(16, 22, 3.5, 6.5, 5);
    s.ell(13, 31, 2, 3, 8); s.ell(17, 31, 2, 3, 8);
    s.ell(17, 10, 5.5, 5, [2, 3, 4]); s.tri(20, 9, 26, 11, 20, 14, 2); s.ell(21, 12, 3, 1.8, 5); s.set(26, 11, 6);
    s.tri(12, 7, 13, -1, 17, 6, 2); s.tri(16, 6, 19, -1, 21, 7, 2); s.set(14, 3, 8); s.set(18, 3, 8);
    if (i) s.line(17, 9, 19, 9, 6); else { s.ell(18.5, 9, 1.2, 1.5, 7); s.set(19, 9, 6); }
    return s.outline(1).canvas(pal);
  });
}

/* ---------- the Escalade ---------- */
function escaladeSpr(lights) {
  const pal = palette(['#08070a', '#1b1c24', '#2d3040', '#4a5068', '#c8ced8', '#ffffff', '#7a8090', '#d4a828', '#2a3a58', '#5a7ab0', '#fff2a0', '#e02828', '#3a3a3a']);
  const s = new Spr(112, 50);
  s.rect(6, 22, 100, 16, 2); s.rect(6, 22, 100, 3, 3); s.rect(6, 34, 100, 3, 1);
  s.rect(16, 8, 76, 15, 2); s.rect(18, 6, 72, 3, 3);
  s.rect(22, 10, 20, 11, 9); s.rect(45, 10, 20, 11, 9); s.rect(68, 10, 20, 11, 9); s.rect(23, 11, 6, 3, 10); s.rect(46, 11, 6, 3, 10); s.rect(69, 11, 6, 3, 10);
  s.rect(43, 10, 2, 13, 1); s.rect(66, 10, 2, 13, 1);
  s.rect(20, 4, 68, 2, 5); s.rect(24, 3, 2, 2, 5); s.rect(82, 3, 2, 2, 5);
  s.rect(6, 29, 100, 1, 5); s.rect(100, 22, 7, 12, 5); for (let y = 23; y < 33; y += 2) s.rect(100, y, 7, 1, 7);
  s.rect(103, 18, 5, 4, lights ? 11 : 6); s.rect(4, 24, 3, 6, 12);
  s.rect(46, 26, 6, 1, 6); s.rect(70, 26, 6, 1, 6);
  for (const wx of [26, 86]) {
    s.ell(wx, 39, 11, 11, 1); s.ell(wx, 39, 7.5, 7.5, [5, 7, 6]); s.ell(wx, 39, 4, 4, 8); s.ell(wx, 39, 1.8, 1.8, 5);
    for (let a = 0; a < 6.28; a += 1.05) s.line(wx, 39, wx + Math.cos(a) * 6.5, 39 + Math.sin(a) * 6.5, 8);
  }
  return s.outline(1).canvas(pal);
}
