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
        if (Array.isArray(c) && c.length >= 4) {
          // a rounded volume lit from the upper left: [deep, shadow, base, light, (shine)]
          const nx = u * ca - v * sa, ny = u * sa + v * ca, nz = Math.sqrt(Math.max(0, 1 - u * u - v * v));
          const l = -0.5 * nx - 0.62 * ny + 0.6 * nz;
          if (c.length >= 5) col = l < -0.42 ? c[0] : l < -0.02 ? c[1] : l < 0.6 ? c[2] : l < 0.76 ? c[3] : c[4];
          else col = l < -0.38 ? c[0] : l < 0.02 ? c[1] : l < 0.66 ? c[2] : c[3];
        } else if (Array.isArray(c)) {
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
/* ---------- lit volumes: spheres, cylinders and cones with dithered shading ---------- */
const BAY4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function rampIdx(ramp, l, x, y) { const t = clamp(l, 0, .999) * ramp.length, i = Math.floor(t), f = t - i, th = (BAY4[(y & 3) * 4 + (x & 3)] + .5) / 16; return ramp[Math.min(ramp.length - 1, f > th ? i + 1 : i)]; }
Spr.prototype.sphere = function (cx, cy, rx, ry, ramp, bias = 0) {
  const R = Math.max(rx, ry) + 1;
  for (let y = Math.floor(cy - R); y <= cy + R; y++) for (let x = Math.floor(cx - R); x <= cx + R; x++) {
    const u = (x + .5 - cx) / rx, v = (y + .5 - cy) / ry, d = u * u + v * v; if (d > 1) continue;
    const nz = Math.sqrt(1 - d), l = (-u * .5 - v * .62 + nz * .62 + .3) / 1.5 + bias;
    this.set(x, y, rampIdx(ramp, l, x, y));
  }
};
Spr.prototype.cyl = function (x0, y0, w, h, ramp, grooves) {
  for (let i = 0; i < w; i++) { const u = (i + .5) / w * 2 - 1, nz = Math.sqrt(Math.max(0, 1 - u * u)), l = (-u * .6 + nz * .7 + .2) / 1.5;
    for (let j = 0; j < h; j++) { const X = Math.floor(x0 + i), Y = Math.floor(y0 + j); let L = l; if (grooves && hash(Math.floor((X - x0) / 3), Y >> 3) < .22) L -= .22; this.set(X, Y, rampIdx(ramp, L, X, Y)); } }
};
Spr.prototype.cone = function (cx, top, bot, hw, ramp) {
  for (let y = Math.floor(top); y < bot; y++) { const k = (y - top) / (bot - top), w = Math.max(1, hw * k);
    for (let x = Math.floor(cx - w); x <= cx + w; x++) { const u = (x + .5 - cx) / w, l = (-u * .62 + .62 - k * .18 + (hash(x >> 1, y >> 1) - .5) * .12) / 1.15; this.set(x, y, rampIdx(ramp, l, x, y)); } }
};
// a round broadleaf canopy built from lit clumps, back to front
Spr.prototype.canopy = function (cx, cy, rw, rh, n, ramp, seed) {
  srand(seed || 3); const pts = [];
  for (let i = 0; i < n; i++) { const a = rnd() * 6.283, r = Math.sqrt(rnd()); pts.push([cx + Math.cos(a) * r * rw, cy + Math.sin(a) * r * rh, 7 + rnd() * (rw * .28)]); }
  pts.sort((p, q) => (p[1] - q[1]) + (q[0] - p[0]) * .2);
  for (const [x, y, r] of pts) this.sphere(x, y, r, r * .86, ramp, (y - cy) / rh * -.12);
};
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
let beanieCol = null, accCol = null;
function bunPal(fur) {
  const f = BUN_FURS[fur] || BUN_FURS.hero, a = accCol || ['#c8302a', '#8a1a14', '#ff6a5a'];
  const hx = v => '#' + v.map(n => n.toString(16).padStart(2, '0')).join(''), deep = hx(mixRGB(rgb(f[1]), [30, 14, 10], .4)), shine = hx(mixRGB(rgb(f[2]), [255, 255, 255], .38));
  return palette(['#2a140c', f[0], f[1], f[2], '#f4e2bd', '#d4b88c', '#ef8e94', '#ffffff', '#1a0e0a', '#d95a72', '#f6c645', '#b8860b', '#fff3b0', '#ff8a1c', '#3fb04a', '#121018', beanieCol || '#c8302a', '#ffffff', a[0], a[1], a[2], deep, shine, '#b49468', '#fff8e8', '#c4606c', '#fffbe0']);
}
// cousin accessories, drawn relative to the head (hx, hy); slots 19-21 are the accessory's colors
function bunHat(s, o, hx, hy) {
  const A3 = [20, 20, 19, 21];
  switch (o.hat) {
    case 'cap': s.ell(hx - .5, hy - 4.2, 6.4, 3.3, A3); s.rect(hx - 6.6, hy - 3.6, 13, 1.4, 20); s.rect(hx - 11, hy - 3.2, 5, 1.6, 19); s.set(hx - 1, hy - 7.2, 21); break;
    case 'bucket': s.ell(hx, hy - 4.8, 5.4, 3.2, A3); s.rect(hx - 8, hy - 2.8, 16, 1.6, 20); s.rect(hx - 7, hy - 3.2, 14, 1, 19); break;
    case 'straw': s.ell(hx, hy - 5.2, 4.4, 2.8, A3); s.rect(hx - 10, hy - 3.2, 20, 1.6, 19); s.rect(hx - 9, hy - 2, 18, 1, 20); s.rect(hx - 4.2, hy - 4, 8.6, 1, 16); break;
    case 'hard': s.ell(hx - .4, hy - 4.6, 6.6, 3.7, A3); s.rect(hx + 2, hy - 2.6, 7, 1.4, 19); s.rect(hx - 1, hy - 8, 1.2, 4, 21); break;
    case 'band': s.rect(hx - 6.4, hy - 4.8, 12.6, 2.2, 19); s.rect(hx - 6.4, hy - 4.8, 12.6, 1, 21); break;
    case 'mask': s.rect(hx - 6.5, hy - 5.4, 13, 1.2, 20); s.ell(hx + 2.2, hy - 5.2, 2.6, 1.7, A3); s.ell(hx - 2.6, hy - 5.2, 2.2, 1.5, A3); break;
    case 'phones': for (let a = 3.3; a < 6.1; a += .12) s.set(hx - .5 + Math.cos(a) * 7.2, hy - .5 + Math.sin(a) * 7.4, 20); s.ell(hx - 2.2, hy + .4, 2.3, 3, A3); s.set(hx - 2.6, hy - .6, 21); break;
    case 'specs': for (let a = 0; a < 6.3; a += .35) s.set(hx + 2 + Math.cos(a) * 2.7, hy - 1.5 + Math.sin(a) * 3, 19); s.line(hx - .6, hy - 1.6, hx - 4.5, hy - 2.2, 19); break;
    case 'bandana': s.tri(hx - 5, hy + 4.6, hx + 2.6, hy + 4.6, hx - 1.4, hy + 9.4, 19); s.rect(hx - 5, hy + 4.4, 7.6, 1.2, 20); s.set(hx - 2, hy + 6, 8); s.set(hx, hy + 6, 8); s.set(hx - 1, hy + 7.5, 8); break;
    case 'scarf': s.rect(hx - 5.6, hy + 4.2, 8.6, 2.4, 19); for (let x = 0; x < 8; x += 3) s.rect(hx - 5.4 + x, hy + 4.2, 1, 2.4, 21); s.rect(hx - 6.6, hy + 5.4, 2.4, 5, 19); s.rect(hx - 6.6, hy + 8, 2.4, 1, 21); break;
  }
}
const BW = 40, BH = 46, BAX = 19, BAY = 44; // sprite size and feet anchor
// lit ramps: fur [deep, shadow, base, light, shine], cream, far-side fur, beanie
const BF = [22, 3, 2, 4, 23], BC = [24, 6, 5, 25], BFD = [22, 22, 3, 2];
function bunSpr(o) {
  if (o.fat && !o.ball) o = Object.assign({}, o, { brx: o.brx + 2, bry: o.bry + 1, e1x: o.hx - 5, e1y: o.hy - 1, e1a: 1.2, el1: 7, e2x: o.hx - 8, e2y: o.hy - 2, e2a: 1.4, el2: 6.5 });
  const s = new Spr(BW, BH), Y = v => v + 3;
  const F = BF, C = BC, FD = BFD;
  const hx = o.hx, hy = Y(o.hy);
  if (!o.ball) {
    s.ell(o.e2x, Y(o.e2y), 2.4, o.el2 || 7, FD, o.e2a);
    s.ell(o.bfx, Y(o.bfy), 4.4, 2.1, FD, o.bfa || 0);
    s.ell(o.tx, Y(o.ty), 3, 3, C);
    s.ell(o.bx, Y(o.by), o.brx, o.bry, F, o.ba || 0);
    s.ell(o.bx + (o.bellx || 3), Y(o.by + 1), o.brx * 0.52, o.bry * 0.7, C, o.ba || 0);
    if (o.hat === 'apron') { s.ell(o.bx + (o.bellx || 3), Y(o.by + 1.5), o.brx * 0.62, o.bry * 0.8, [19, 20, 21], o.ba || 0); s.line(o.bx + (o.bellx || 3) - 2, Y(o.by - 6), o.bx + (o.bellx || 3) + 1, Y(o.by - 8), 20); }
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
    if (o.beanie) { s.ell(hx - .5, hy - 4, 7, 3.6, 17); s.rect(hx - 7, hy - 3, 14, 2, 17); s.ell(hx - 6, hy - 8, 1.8, 1.8, 18); }
    if (o.hat && o.hat !== 'apron' && o.hat !== 'bandana' && o.hat !== 'scarf') bunHat(s, o, hx, hy);
    // front ear + inner
    s.ell(o.e1x, Y(o.e1y), 2.7, o.el1 || 7.8, F, o.e1a);
    s.ell(o.e1x + Math.cos(o.e1a) * 0.6, Y(o.e1y) + Math.sin(o.e1a) * 0.6, 1.1, (o.el1 || 7.8) - 2.6, 7, o.e1a);
    if (o.hat === 'bandana' || o.hat === 'scarf') bunHat(s, o, hx, hy);
    if (o.stud) { const ex = o.e1x + Math.cos(o.e1a + 1.57) * -1, ey = Y(o.e1y) + 4; s.set(ex, ey, 8); s.set(ex + 1, ey, 13); }
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
  balance: [P({ bx: 19, by: 31, ba: 0.42, hx: 27, hy: 21, e1x: 21, e1y: 8, e1a: 0.35, e2x: 17, e2y: 9, e2a: 0.1, eye: 'up', mouth: 1, ffx: 21, ffy: 40, bfx: 15, bfy: 40, ax: 30, ay: 18, aa: -2.2, tx: 11, ty: 31 }),
    P({ bx: 19, by: 31, ba: 0.38, hx: 27, hy: 21, e1x: 22, e1y: 8, e1a: 0.55, e2x: 18, e2y: 9, e2a: 0.3, eye: 'up', mouth: 1, ffx: 21, ffy: 40, bfx: 15, bfy: 40, ax: 29, ay: 26, aa: -0.4, tx: 11, ty: 31 })],
  land: [P({ bx: 18, by: 33, brx: 9.2, bry: 7.4, hx: 23, hy: 23, e1x: 17, e1y: 13, e1a: -0.9, el1: 7.4, e2x: 14, e2y: 15, e2a: -1.1, ffx: 26, ffy: 40, bfx: 12, bfy: 40, ax: 25, ay: 33, tx: 9, ty: 34 })],
  catsit: [P({ by: 29, brx: 6.5, bry: 10, hx: 20, hy: 15, ffx: 22, ffy: 40, bfx: 16, bfy: 40, ax: 21.5, ay: 31, aa: 0.1, e1x: 20, e1y: 3, e1a: -0.05, e2x: 17, e2y: 4, e2a: -0.25 }), P({ by: 29, brx: 6.5, bry: 10, hx: 20, hy: 15, ffx: 22, ffy: 40, bfx: 16, bfy: 40, ax: 21.5, ay: 31, aa: 0.1, e1x: 20, e1y: 3, e1a: -0.05, e2x: 17, e2y: 4, e2a: -0.25, eye: 'closed' })]
};
/* ---------- the other angles: front, three-quarter, back (for turns, spring flips, idling, cheering) ---------- */
// view: 'front' faces the camera; 'q' is three-quarter toward the camera, facing right; 'back' and 'qb' turn away
function bunView(view, o) {
  const s = new Spr(BW, BH), Y = v => v + 3, F = BF, C = BC, FD = BFD, A3 = [20, 20, 19, 21];
  const fat = !!o.fat, back = view === 'back' || view === 'qb', q = view === 'q', qb = view === 'qb';
  const cx = 19.5 + (q ? .5 : qb ? -.5 : 0), bw = fat ? 10 : 8.2, hx = cx + (q ? 2 : qb ? 1.4 : 0), hy = Y(o.cheer === 2 ? 16 : 17), up = o.cheer === 2 ? -1 : 0;
  // ears, behind the head
  const ear = (x, y, a, near) => { if (fat) { s.ell(x + (x < hx ? -4.4 : 4.4), hy + 1, 2.8, 7, near ? F : FD, x < hx ? 1.15 : -1.15); return; }
    s.ell(x, Y(5.5) + up, 2.7, 7.8, near ? F : FD, a); if (!back) s.ell(x + Math.sin(a) * .4, Y(6.3) + up, 1.1, 5.2, 7, a); if (o.stud && near) { s.set(x + .5, Y(9) + up, 8); s.set(x + 1.5, Y(9) + up, 13); } };
  if (q) { ear(hx - 2.8, 0, -0.42, false); ear(hx + 2.6, 0, 0.12, true); }
  else if (qb) { ear(hx + 2.6, 0, 0.36, false); ear(hx - 2.4, 0, -0.1, true); }
  else { ear(hx - 3.6, 0, -0.2, true); ear(hx + 3.6, 0, 0.2, true); }
  // feet and body
  const fy = Y(39.6), lift = k => (o.tap === k ? 1.6 : 0);
  if (q) { s.ell(cx - 3.6, fy, 3, 2.1, FD); s.ell(cx + 4.4, fy - lift(2), 3.8, 2.4, F); s.ell(cx + 5.4, fy + .6 - lift(2), 2, 1, C); }
  else if (qb) { s.ell(cx + 4, fy, 3, 2.1, FD); s.ell(cx - 3.6, fy, 3.4, 2.3, F); }
  else { s.ell(cx - 4.3, fy - lift(1), 3.5, 2.4, F); s.ell(cx + 4.3, fy - lift(2), 3.5, 2.4, F); if (!back) { s.ell(cx - 4.3, fy + .7 - lift(1), 2.1, 1, C); s.ell(cx + 4.3, fy + .7 - lift(2), 2.1, 1, C); } }
  if (back || qb) s.ell(cx - (qb ? 2.4 : 0), Y(35), 3.4, 3.2, C);
  s.ell(cx, Y(31) + up * .5, bw, 8.8, F);
  if (back || qb) s.ell(cx - (qb ? 2.4 : 0), Y(35.2), 3.4, 3.2, C);
  if (!back) s.ell(cx + (q ? 2.6 : 0), Y(32.6), q ? 4.4 : (fat ? 6.6 : 5.2), 6.4, C);
  if (o.hat === 'apron' && !back) { s.ell(cx + (q ? 2.6 : 0), Y(33), q ? 4.8 : 5.8, 6.8, A3); s.line(cx + (q ? 1 : -2), Y(25), cx + (q ? 4 : 2), Y(25), 20); }
  // arms
  const arm = (x, y, a, near) => s.ell(x, y, 1.9, 3.5, near ? F : FD, a);
  if (o.cheer) { const r = o.cheer === 2 ? 1.5 : 0; arm(cx - 8, Y(21 - r), -0.55, !qb); arm(cx + 8.4, Y(21 - r), 0.55, !back || qb); }
  else if (q) { arm(cx - 6.6, Y(30), 0.3, false); arm(cx + 7.6, Y(30), -0.2, true); }
  else if (qb) { arm(cx + 6.8, Y(30), -0.3, false); arm(cx - 7.4, Y(30), 0.25, true); }
  else { arm(cx - 7.6, Y(30), 0.28, true); arm(cx + 7.6, Y(30), -0.28, true); }
  // head
  s.ell(hx, hy, fat ? 8 : 7.4, 6.7, F);
  if (back) { s.ell(hx + (qb ? 5.4 : 0), hy + 3, qb ? 1.6 : 0, qb ? 2 : 0, C); }
  else {
    const mx = hx + (q ? 3.2 : 0); s.ell(mx, hy + 3.2, q ? 3.4 : 3.9, 2.6, C);
    s.set(mx - .5 + (q ? 1.4 : 0), hy + 1.8, 10); s.set(mx + .5 + (q ? 1.4 : 0), hy + 1.8, 10); s.set(mx + (q ? 1.4 : 0), hy + 2.6, 10);
    if (o.cheer || o.mouth) s.ell(mx + (q ? 1 : 0), hy + 4.4, 1.4, 1.2, 9);
    else { s.set(mx - 1 + (q ? 1 : 0), hy + 4, 9); s.set(mx + (q ? 1 : 0), hy + 4.4, 9); s.set(mx + 1 + (q ? 1 : 0), hy + 4, 9); }
    if (o.teeth) { s.set(mx - .5 + (q ? 1 : 0), hy + 5, 8); s.set(mx + .5 + (q ? 1 : 0), hy + 5, 8); s.set(mx - .5 + (q ? 1 : 0), hy + 6, 8); s.set(mx + .5 + (q ? 1 : 0), hy + 6, 8); }
    const eye = (ex, w) => { if (o.blink) { s.line(ex - 1, hy - 1.4, ex + 1, hy - 1.4, 9); return; } s.ell(ex, hy - 1.7, w, 2.6, 8); s.set(ex + .2, hy - 1.6, 9); s.set(ex + .2, hy - .6, 9); s.set(ex - .7, hy - 2.8, 8); };
    if (q) { eye(hx - 1.6, 1.05); eye(hx + 3.9, 1.75); } else { eye(hx - 3.1, 1.75); eye(hx + 3.1, 1.75); }
    if (o.shades) { if (q) { s.rect(hx - 3, hy - 3.2, 8.4, 2.6, 16); } else s.rect(hx - 6, hy - 3.2, 12, 2.6, 16); s.set(hx + (q ? 3 : 2), hy - 3, 8); }
  }
  // hats and neckwear
  hatView(s, o, hx, hy, view, A3);
  // the chain: everybody wears gold
  if (o.chain !== false) {
    const x0 = back ? hx - 3.5 : hx - 5 + (q ? 2 : 0), n = back ? 7 : 10, y0 = Y(23.8);
    for (let i = 0; i <= n; i++) s.set(x0 + i, y0 + (back ? 0 : Math.sin(i / n * Math.PI) * 2), (i % 2) ? 13 : 11);
    if (o.pendant && !back) { const px = x0 + n / 2, py = y0 + 2.6;
      if (o.pendant === 'ice') { s.set(px, py, 8); s.set(px - 1, py + 1, 8); s.set(px + 1, py + 1, 13); s.set(px, py + 1, 8); s.set(px, py + 2, 8); }
      else if (o.pendant === 'rope') { for (let i = 0; i <= n; i++) s.set(x0 + i, y0 + 1 + Math.sin(i / n * Math.PI) * 2.4, 12); s.set(px, py, 11); s.set(px + 1, py, 13); }
      else { s.set(px, py, 15); s.set(px, py + 1, 14); s.set(px, py + 2, 14); s.set(px + 1, py + 1, 14); } }
  }
  return s.outline(1);
}
function hatView(s, o, hx, hy, view, A3) {
  const back = view === 'back' || view === 'qb', q = view === 'q', sh = q ? 1 : view === 'qb' ? -1 : 0;
  if (o.beanie) { s.ell(hx, hy - 4.4, 7.6, 3.9, 17); s.rect(hx - 7.4, hy - 2.8, 14.8, 2.2, 17); for (let x = -6; x <= 6; x += 2) s.set(hx + x, hy - 2, 18); s.ell(hx - sh, hy - 8.8, 2, 1.9, 18); }
  switch (o.hat) {
    case 'cap': s.ell(hx, hy - 4.6, 7.3, 3.5, A3); s.rect(hx - 7.2, hy - 3, 14.4, 1.4, 20); if (back) s.ell(hx - sh * 2, hy - 2.2, 5, 1.5, 19); else s.rect(hx - 1 + sh * 2, hy - 3.4, 2, 1.4, 2); s.set(hx, hy - 7.8, 21); break;
    case 'bucket': s.ell(hx, hy - 2.6, 9.6, 1.9, 20); s.ell(hx, hy - 5, 6, 3.4, A3); s.rect(hx - 5.8, hy - 3.6, 11.6, 1, 20); break;
    case 'straw': s.ell(hx, hy - 3, 11.6, 2.1, 19); s.ell(hx, hy - 3.4, 11, 1.2, 21); s.ell(hx, hy - 5.6, 4.8, 2.9, A3); s.rect(hx - 4.6, hy - 4.4, 9.2, 1, 16); break;
    case 'hard': s.ell(hx, hy - 4.8, 7.4, 4.1, A3); if (!back) s.ell(hx + sh * 2, hy - 2.4, 7.4, 1.4, 19); s.rect(hx - .6, hy - 8.8, 1.2, 4.6, 21); break;
    case 'band': s.rect(hx - 7.3, hy - 5, 14.6, 2.2, 19); s.rect(hx - 7.3, hy - 5, 14.6, 1, 21); break;
    case 'mask': s.rect(hx - 7.3, hy - 5.8, 14.6, 1.3, 20); if (!back) { s.ell(hx - 3.2 + sh, hy - 5.4, 2.4, 1.6, A3); s.ell(hx + 3.2 + sh, hy - 5.4, 2.4, 1.6, A3); } break;
    case 'phones': for (let a = 3.25; a < 6.2; a += .1) s.set(hx + Math.cos(a) * 8, hy - .6 + Math.sin(a) * 8.4, 20); s.ell(hx - 7.6 + sh, hy + .6, 2.2, 3, A3); s.ell(hx + 7.6 + sh, hy + .6, 2.2, 3, A3); break;
    case 'specs': if (!back) { const ring = (ex, w) => { for (let a = 0; a < 6.3; a += .3) s.set(ex + Math.cos(a) * w, hy - 1.6 + Math.sin(a) * 3, 19); };
      if (q) { ring(hx - 1.4, 1.9); ring(hx + 3.6, 2.6); s.line(hx + .5, hy - 2, hx + 1, hy - 2, 19); } else { ring(hx - 3.1, 2.6); ring(hx + 3.1, 2.6); s.line(hx - .5, hy - 2, hx + .5, hy - 2, 19); } } break;
    case 'bandana': if (!back) { s.tri(hx - 4.4 + sh, hy + 5.2, hx + 4.4 + sh, hy + 5.2, hx + sh, hy + 10.4, 19); s.rect(hx - 4.4 + sh, hy + 4.8, 8.8, 1.2, 20); s.set(hx - 1 + sh, hy + 6.6, 8); s.set(hx + 1 + sh, hy + 6.6, 8); s.set(hx + sh, hy + 8.2, 8); } else s.ell(hx, hy + 5.4, 2, 1.4, 19); break;
    case 'scarf': s.rect(hx - 6.2, hy + 4.6, 12.4, 2.6, 19); for (let x = -5; x < 6; x += 3) s.rect(hx + x, hy + 4.6, 1, 2.6, 21); s.rect(hx + (back ? -5 : 3) + sh, hy + 6.6, 2.4, 5.4, 19); s.rect(hx + (back ? -5 : 3) + sh, hy + 10.6, 2.4, 1, 21); break;
  }
}
const VIEWS = { front: [['front', {}], ['front', { blink: 1 }]], tap: [['front', { tap: 1 }], ['front', { tap: 2 }]], q: [['q', {}]], back: [['back', {}]], qb: [['qb', {}]], fcheer: [['front', { cheer: 1, mouth: 1 }], ['front', { cheer: 2, mouth: 1 }]] };
// build every pose for a fur/accessory combo
function buildBun(fur, extra) {
  beanieCol = extra && extra.beanie; accCol = extra && extra.acc; const pal = bunPal(fur), out = {}; beanieCol = null; accCol = null;
  for (const k in POSES) out[k] = POSES[k].map(o => bunSpr(Object.assign({}, o, extra || {})).canvas(pal));
  for (const k in VIEWS) out[k] = VIEWS[k].map(([v, o]) => bunView(v, Object.assign({}, extra || {}, o)).canvas(pal));
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
const PAL_ROCK = palette(['#20140e', '#3e4248', '#565b62', '#70767e', '#8c939a', '#b0b7bd', '#d4d9dc', '#24501e', '#3a7a2c', '#5cae44', '#8ad860']);
function boulderSpr(r) {
  const d = r * 2 + 4, s = new Spr(d, d), c = r + 2;
  s.sphere(c, c + 1, r, r * 0.9, [2, 3, 4, 5, 6, 7]);
  srand(r * 7);
  for (let i = 0; i < r / 2; i++) { const a = rnd() * 6.28, rr = rnd() * r * .75, x = c + Math.cos(a) * rr, y = c + Math.sin(a) * rr * .9 + 2; if (s.get(x, y) > 1 && s.get(x, y) < 6) { s.set(x, y, 2); s.set(x + 1, y, 5); } }
  s.line(c + r * .15, c - r * .1, c + r * .45, c + r * .35, 2); s.line(c + r * .17, c - r * .1, c + r * .47, c + r * .35, 5);
  s.sphere(c - r * .25, c - r * .62, r * .62, r * .26, [8, 9, 10, 11]);
  return s.outline(1).canvas(PAL_ROCK);
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
  const W = 112, H = 50, c = mkC(W, H), x = c.getContext('2d');
  const R = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  const grad = (a, b, w, h, c1, c2) => { for (let i = 0; i < h; i++) R(a, b + i, w, 1, css(mixRGB(rgb(c1), rgb(c2), i / Math.max(1, h - 1)))); };
  // body
  R(15, 4, 80, 2, '#08080c'); R(13, 6, 84, 18, '#08080c'); R(4, 20, 104, 20, '#08080c');
  grad(15, 6, 80, 17, '#3a3f50', '#1c1f2a'); grad(5, 21, 102, 18, '#343a4a', '#0c0e14');
  x.globalAlpha = .22; for (let i = 0; i < 16; i++) R(20 + i * 5, 21 + (i % 3), 3, 16, '#ffffff'); x.globalAlpha = 1;
  R(5, 28, 102, 1, '#c8ced8'); R(5, 29, 102, 1, '#4a505c');
  // windows with reflection
  for (const [wx, ww] of [[19, 22], [44, 22], [69, 22]]) { R(wx, 8, ww, 12, '#06070c'); grad(wx + 1, 9, ww - 2, 10, '#3a4a70', '#0e1422'); x.globalAlpha = .4; R(wx + 2, 9, 5, 2, '#ffffff'); R(wx + 3, 11, 3, 1, '#ffffff'); x.globalAlpha = 1; }
  R(42, 8, 2, 14, '#08080c'); R(67, 8, 2, 14, '#08080c'); R(17, 3, 76, 2, '#c8ced8'); R(22, 2, 2, 2, '#9aa2ae'); R(86, 2, 2, 2, '#9aa2ae');
  // grille, lights, handles
  R(100, 20, 8, 14, '#9aa2ae'); for (let y = 21; y < 33; y += 2) R(101, y, 6, 1, '#4a505c'); R(98, 17, 10, 3, lights ? '#fff6c0' : '#c8ced8');
  if (lights) { x.globalAlpha = .25; R(104, 14, 8, 10, '#fff6c0'); x.globalAlpha = 1; }
  R(4, 18, 4, 16, '#2a0808'); R(5, 19, 2, 14, lights ? '#ff4a3a' : '#a01818');
  R(46, 24, 6, 1, '#c8ced8'); R(71, 24, 6, 1, '#c8ced8');
  // wheels: chrome rims, gold centers
  for (const wx of [26, 86]) { pixRing(x, wx, 39, 11, '#08080c'); pixRing(x, wx, 39, 10, '#1a1a20'); pixRing(x, wx, 39, 7, '#c8ced8'); pixRing(x, wx, 39, 5, '#7a808a');
    for (let a = 0; a < 6.28; a += 1.047) for (let r = 2; r < 7; r++) R(Math.round(wx + Math.cos(a) * r), Math.round(39 + Math.sin(a) * r), 1, 1, '#e8eef4'); R(wx - 1, 38, 3, 3, '#f6c645'); }
  return c;
}
function pixRing(x, cx, cy, r, col) { x.fillStyle = col; for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y)); x.fillRect(cx - w, cy + y, w * 2 + 1, 1); } }
