// Life with Cats — every surface is painted here, on canvases, at load.
// Each painter returns { map, bump } (sometimes more). Maps are sRGB colour,
// bumps are grey height. Everything tiles unless it is a one-off (rugs).
import * as THREE from '../lib/three.module.min.js';
import { makeNoise, rng, mix, shade, rgba, clamp, hex2rgb } from './util.js';

let ANISO = 4;
export function setAniso(a) { ANISO = a; }

export function canvas(w, h = w) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
export function toTex(c, o = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = o.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  t.colorSpace = o.data ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = o.aniso ?? ANISO;
  if (o.repeat) t.repeat.set(o.repeat[0], o.repeat[1]);
  return t;
}
const CACHE = new Map();
function cached(key, fn) { if (!CACHE.has(key)) CACHE.set(key, fn()); return CACHE.get(key); }

// ------------------------------------------------------------ noise tiles
const TILES = {};
function noiseTile(key, size, period, oct, seed, contrast = 2.2) {
  if (TILES[key]) return TILES[key];
  const N = makeNoise(seed);
  const c = canvas(size), x = c.getContext('2d'), img = x.createImageData(size, size), d = img.data;
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    let v = N.fbm(i / size * period, j / size * period, oct, period);
    v = clamp(0.5 + (v - 0.5) * contrast, 0, 1) * 255;
    const k = (j * size + i) * 4; d[k] = d[k + 1] = d[k + 2] = v; d[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return (TILES[key] = c);
}
export const NT = {
  get big() { return noiseTile('big', 256, 3, 5, 11, 2.6); },
  get mid() { return noiseTile('mid', 256, 8, 4, 23, 2.4); },
  get fine() { return noiseTile('fine', 128, 32, 2, 37, 2.0); },
  get grain() { return noiseTile('grain', 128, 64, 1, 41, 1.6); },
};
// draw a tiling tile across the whole canvas with a blend mode
function overlay(x, tile, alpha, op = 'overlay', scale = 1) {
  const W = x.canvas.width, H = x.canvas.height, s = tile.width * scale;
  x.save(); x.globalAlpha = alpha; x.globalCompositeOperation = op;
  for (let y = 0; y < H; y += s) for (let i = 0; i < W; i += s) x.drawImage(tile, i, y, s, s);
  x.restore();
}
// draw something so it wraps across the canvas edges (keeps things tiling)
function wrap(x, fn) {
  const W = x.canvas.width, H = x.canvas.height;
  for (const dy of [-H, 0, H]) for (const dx of [-W, 0, W]) { x.save(); x.translate(dx, dy); fn(); x.restore(); }
}
function grey(v) { v = clamp(Math.round(v * 255), 0, 255); return `rgb(${v},${v},${v})`; }
function speckle(x, n, colors, rmin, rmax, r, alpha = 1) {
  const W = x.canvas.width, H = x.canvas.height;
  x.save(); x.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    x.fillStyle = colors[Math.floor(r() * colors.length)];
    const rad = rmin + (rmax - rmin) * r() * r();
    x.beginPath(); x.arc(r() * W, r() * H, rad, 0, Math.PI * 2); x.fill();
  }
  x.restore();
}
function pair(S, H = S) { const a = canvas(S, H), b = canvas(S, H); return [a, a.getContext('2d'), b, b.getContext('2d')]; }
function done(c, b, o = {}) { return { map: toTex(c, o), bump: toTex(b, { ...o, data: true }), canvas: c, bumpCanvas: b }; }

// ------------------------------------------------------------------ walls
// limewash / plaster: mottled pigment, trowel strokes, specks of grit
export function plaster(base, seed = 1, o = {}) {
  return cached('plaster' + base + seed + (o.rough || ''), () => {
    const S = 512, r = rng(seed);
    const [c, x, b, y] = pair(S);
    x.fillStyle = base; x.fillRect(0, 0, S, S);
    overlay(x, NT.big, 0.26, 'overlay', 2);
    overlay(x, NT.mid, 0.16, 'soft-light', 1);
    y.fillStyle = grey(0.5); y.fillRect(0, 0, S, S);
    overlay(y, NT.big, 0.35, 'overlay', 2);
    for (let i = 0; i < 70; i++) {
      const cx = r() * S, cy = r() * S, rad = 30 + r() * 120, a0 = r() * 6.28, a1 = a0 + 0.6 + r() * 1.6;
      const light = r() < 0.6, lw = 6 + r() * 26, al = 0.03 + r() * 0.05;
      wrap(x, () => { x.strokeStyle = rgba(shade(base, light ? 0.16 : -0.12), al); x.lineWidth = lw; x.lineCap = 'round'; x.beginPath(); x.arc(cx, cy, rad, a0, a1); x.stroke(); });
      wrap(y, () => { y.strokeStyle = light ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)'; y.lineWidth = lw * 0.3; y.beginPath(); y.arc(cx, cy, rad, a0, a1); y.stroke(); });
    }
    speckle(x, 700, [shade(base, -0.22), shade(base, 0.2), shade(base, -0.1)], 0.4, 1.4, r, 0.4);
    speckle(y, 900, ['#000', '#fff'], 0.4, 1.5, r, 0.35);
    overlay(x, NT.fine, 0.12, 'overlay', 1);
    overlay(y, NT.fine, 0.25, 'overlay', 1);
    return done(c, b);
  });
}

// wallpaper on aged paper. kinds: flowers, stripes, leaves, diamond, dots, scallop, cats, gingham
export function wallpaper(kind, a, bcol, ccol, seed = 2) {
  return cached('wp' + kind + a + bcol + ccol + seed, () => {
    const S = 512, r = rng(seed);
    const [c, x, b, y] = pair(S);
    x.fillStyle = a; x.fillRect(0, 0, S, S);
    y.fillStyle = grey(0.5); y.fillRect(0, 0, S, S);
    const both = fn => { fn(x, false); fn(y, true); };
    const ink = (ctx, bump, col, lift = 0.62) => bump ? grey(lift) : col;
    if (kind === 'stripes') {
      const n = 8, w = S / n;
      for (let i = 0; i < n; i++) {
        if (i % 2) both((ctx, bump) => { ctx.fillStyle = ink(ctx, bump, bcol, 0.56); ctx.beginPath(); for (let j = 0; j <= 32; j++) ctx.lineTo(i * w + 6 + Math.sin(j * 1.3 + i) * 1.2, j * S / 32); for (let j = 32; j >= 0; j--) ctx.lineTo((i + 1) * w - 6 + Math.sin(j * 1.7 + i) * 1.2, j * S / 32); ctx.fill(); });
        both((ctx, bump) => { ctx.strokeStyle = ink(ctx, bump, ccol, 0.6); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(i * w + w / 2 * (i % 2 ? 1 : 0) + 2, 0); ctx.lineTo(i * w + w / 2 * (i % 2 ? 1 : 0) + 2, S); ctx.stroke(); });
      }
    } else if (kind === 'flowers' || kind === 'leaves' || kind === 'cats' || kind === 'dots') {
      const n = kind === 'dots' ? 8 : 4, cell = S / n;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) for (const off of [0, 0.5]) {
        const cx = (i + off + (r() - 0.5) * 0.12) * cell, cy = (j + off + (r() - 0.5) * 0.12) * cell;
        const rot = (r() - 0.5) * 0.8, sc = 0.85 + r() * 0.3;
        both((ctx, bump) => wrapDraw(ctx, cx, cy, () => {
          ctx.rotate(rot); ctx.scale(sc, sc);
          if (kind === 'flowers') {
            if (off) { // sprig of leaves
              ctx.strokeStyle = ink(ctx, bump, ccol); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-14, 12); ctx.quadraticCurveTo(0, 0, 14, -12); ctx.stroke();
              ctx.fillStyle = ink(ctx, bump, ccol); for (const t of [-0.6, 0, 0.6]) { ctx.save(); ctx.translate(t * 14, -t * 12); ctx.rotate(-0.7 + t); ctx.beginPath(); ctx.ellipse(6, 0, 7, 3, 0, 0, 6.3); ctx.fill(); ctx.restore(); }
            } else {
              ctx.fillStyle = ink(ctx, bump, bcol, 0.66);
              for (let p = 0; p < 5; p++) { ctx.save(); ctx.rotate(p * 1.2566); ctx.beginPath(); ctx.ellipse(0, -11, 7, 10, 0, 0, 6.3); ctx.fill(); ctx.restore(); }
              ctx.fillStyle = ink(ctx, bump, ccol, 0.7); ctx.beginPath(); ctx.arc(0, 0, 5, 0, 6.3); ctx.fill();
            }
          } else if (kind === 'leaves') {
            ctx.fillStyle = ink(ctx, bump, off ? ccol : bcol);
            ctx.beginPath(); ctx.moveTo(0, -22); ctx.quadraticCurveTo(16, 0, 0, 22); ctx.quadraticCurveTo(-16, 0, 0, -22); ctx.fill();
            ctx.strokeStyle = bump ? grey(0.45) : rgba(shade(a, 0.1), 0.7); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, 20); ctx.stroke();
          } else if (kind === 'cats') {
            ctx.fillStyle = ink(ctx, bump, off ? ccol : bcol);
            ctx.beginPath(); ctx.moveTo(-13, -4); ctx.lineTo(-11, -18); ctx.lineTo(-4, -10); ctx.lineTo(4, -10); ctx.lineTo(11, -18); ctx.lineTo(13, -4);
            ctx.quadraticCurveTo(15, 12, 0, 13); ctx.quadraticCurveTo(-15, 12, -13, -4); ctx.fill();
            if (!bump) { ctx.fillStyle = a; ctx.beginPath(); ctx.arc(-5, 0, 2, 0, 6.3); ctx.arc(5, 0, 2, 0, 6.3); ctx.fill(); }
          } else {
            ctx.fillStyle = ink(ctx, bump, off ? ccol : bcol); ctx.beginPath(); ctx.arc(0, 0, off ? 5 : 9, 0, 6.3); ctx.fill();
          }
        }));
      }
    } else if (kind === 'diamond') {
      const n = 4, w = S / n, h = S / 4;
      for (let j = 0; j <= 4; j++) for (let i = 0; i <= n; i++) {
        const cx = i * w + (j % 2) * w / 2, cy = j * h;
        both((ctx, bump) => { ctx.fillStyle = ink(ctx, bump, (i + j) % 2 ? bcol : a, 0.55); ctx.beginPath(); ctx.moveTo(cx, cy - h / 2); ctx.lineTo(cx + w / 2, cy); ctx.lineTo(cx, cy + h / 2); ctx.lineTo(cx - w / 2, cy); ctx.fill(); ctx.strokeStyle = ink(ctx, bump, ccol, 0.62); ctx.lineWidth = 1.6; ctx.stroke(); });
      }
    } else if (kind === 'scallop') {
      const n = 8, w = S / n;
      for (let j = -1; j <= n * 1.5; j++) for (let i = -1; i <= n; i++) {
        const cx = i * w + (j % 2 ? w / 2 : 0), cy = j * w * 0.5;
        both((ctx, bump) => { ctx.fillStyle = ink(ctx, bump, (j % 3 === 0) ? bcol : a, 0.55); ctx.strokeStyle = ink(ctx, bump, ccol, 0.62); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, w / 2, 0, Math.PI); ctx.fill(); ctx.stroke(); });
      }
    } else if (kind === 'gingham') {
      const n = 16, w = S / n;
      for (let i = 0; i < n; i += 2) both((ctx, bump) => { ctx.fillStyle = bump ? 'rgba(255,255,255,.1)' : rgba(bcol, 0.45); ctx.fillRect(i * w, 0, w, S); ctx.fillRect(0, i * w, S, w); });
    }
    // age the paper
    overlay(x, NT.big, 0.35, 'soft-light', 2);
    overlay(x, NT.fine, 0.14, 'overlay', 1);
    speckle(x, 300, [rgba(shade(a, -0.4), 0.5), rgba('#ffffff', 0.4)], 0.3, 1.2, r);
    overlay(y, NT.fine, 0.3, 'overlay', 1);
    return done(c, b);
  });
}
function wrapDraw(ctx, cx, cy, fn) {
  const S = ctx.canvas.width;
  for (const dy of [-S, 0, S]) for (const dx of [-S, 0, S]) {
    const X = cx + dx, Y = cy + dy; if (X < -60 || X > S + 60 || Y < -60 || Y > S + 60) continue;
    ctx.save(); ctx.translate(X, Y); fn(); ctx.restore();
  }
}

// ------------------------------------------------------------------- wood
function grainLines(x, y, W, H, col, r, dens = 1, vertical = false) {
  const n = Math.round(60 * dens);
  for (let i = 0; i < n; i++) {
    const p = r() * (vertical ? W : H), amp = 2 + r() * 6, f = 0.004 + r() * 0.01, ph = r() * 6.3;
    const dark = r() < 0.7, lw = 0.6 + r() * 1.8;
    x.strokeStyle = rgba(dark ? shade(col, -0.35) : shade(col, 0.18), 0.12 + r() * 0.22); x.lineWidth = lw;
    if (y) { y.strokeStyle = dark ? 'rgba(0,0,0,.25)' : 'rgba(255,255,255,.12)'; y.lineWidth = lw; }
    for (const ctx of y ? [x, y] : [x]) {
      ctx.beginPath();
      const L = vertical ? H : W;
      for (let t = 0; t <= L; t += 8) {
        const off = Math.sin(t * f + ph) * amp + Math.sin(t * f * 3.1 + ph * 2) * amp * 0.3;
        vertical ? ctx.lineTo(p + off, t) : ctx.lineTo(t, p + off);
      }
      ctx.stroke();
    }
  }
}
function knot(x, y, cx, cy, col, r) {
  const rx = 6 + r() * 10, ry = rx * (0.35 + r() * 0.2);
  for (let k = 5; k > 0; k--) {
    x.strokeStyle = rgba(shade(col, -0.45), 0.25); x.lineWidth = 1.2;
    x.beginPath(); x.ellipse(cx, cy, rx * k / 3, ry * k / 3, 0, 0, 6.3); x.stroke();
  }
  x.fillStyle = rgba(shade(col, -0.5), 0.6); x.beginPath(); x.ellipse(cx, cy, rx * 0.4, ry * 0.4, 0, 0, 6.3); x.fill();
  if (y) { y.fillStyle = 'rgba(0,0,0,.35)'; y.beginPath(); y.ellipse(cx, cy, rx * 0.5, ry * 0.5, 0, 0, 6.3); y.fill(); }
}

// floorboards running along U. rows planks per tile
export function planks(base, seed = 3, o = {}) {
  return cached('planks' + base + seed + JSON.stringify(o), () => {
    const S = 1024, rows = o.rows || 7, r = rng(seed);
    const [c, x, b, y] = pair(S);
    const h = S / rows;
    x.fillStyle = shade(base, -0.55); x.fillRect(0, 0, S, S);
    y.fillStyle = '#000'; y.fillRect(0, 0, S, S);
    for (let j = 0; j < rows; j++) {
      let pos = r() * S; const segs = [];
      let left = S; while (left > 0) { const L = Math.min(left, 260 + r() * 420); segs.push(L); left -= L; }
      for (const L of segs) {
        const tone = shade(mix(base, o.alt || base, r()), (r() - 0.5) * 0.22);
        const X0 = pos, Y0 = j * h;
        for (const dx of [0, -S]) {
          const X = X0 + dx; if (X > S || X + L < 0) continue;
          x.save(); x.beginPath(); x.rect(X + 1.5, Y0 + 2, L - 3, h - 4); x.clip();
          x.fillStyle = tone; x.fillRect(X, Y0, L, h);
          const g = x.createLinearGradient(0, Y0, 0, Y0 + h); g.addColorStop(0, rgba('#ffffff', 0.06)); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, rgba('#000000', 0.1));
          x.fillStyle = g; x.fillRect(X, Y0, L, h);
          y.save(); y.beginPath(); y.rect(X + 1.5, Y0 + 2, L - 3, h - 4); y.clip(); y.fillStyle = grey(0.62 + (r() - 0.5) * 0.08); y.fillRect(X, Y0, L, h);
          x.translate(X, Y0); y.translate(X, Y0);
          grainLines(x, y, L, h, tone, r, 0.55);
          if (r() < 0.35) knot(x, y, 30 + r() * (L - 60), h * (0.25 + r() * 0.5), tone, r);
          // nail heads
          for (const nx of [10, L - 10]) for (const ny of [h * 0.25, h * 0.75]) { x.fillStyle = rgba('#2a1a10', 0.55); x.beginPath(); x.arc(nx, ny, 2.2, 0, 6.3); x.fill(); y.fillStyle = grey(0.3); y.beginPath(); y.arc(nx, ny, 2.2, 0, 6.3); y.fill(); }
          x.restore(); y.restore();
        }
        pos = (pos + L) % S;
      }
    }
    overlay(x, NT.mid, 0.3, 'soft-light', 2);
    overlay(x, NT.fine, 0.12, 'overlay', 2);
    // wax wear: lighter path down the middle of the room
    overlay(y, NT.fine, 0.2, 'overlay', 2);
    return done(c, b);
  });
}

// furniture wood: long grain along V
export function grain(base, seed = 4, o = {}) {
  return cached('grain' + base + seed + (o.paint || ''), () => {
    const S = 512, r = rng(seed);
    const [c, x, b, y] = pair(S);
    x.fillStyle = base; x.fillRect(0, 0, S, S);
    y.fillStyle = grey(0.55); y.fillRect(0, 0, S, S);
    // grain wraps vertically because the waves are periodic in S
    for (let i = 0; i < 90; i++) {
      const p = r() * S, amp = 2 + r() * 7, ph = r() * 6.3, k = (1 + Math.floor(r() * 3)) * Math.PI * 2 / S;
      const dark = r() < 0.7, lw = 0.6 + r() * 2;
      x.strokeStyle = rgba(dark ? shade(base, -0.35) : shade(base, 0.15), 0.12 + r() * 0.2); x.lineWidth = lw;
      y.strokeStyle = dark ? 'rgba(0,0,0,.22)' : 'rgba(255,255,255,.1)'; y.lineWidth = lw;
      for (const ctx of [x, y]) wrap(ctx, () => { ctx.beginPath(); for (let t = 0; t <= S; t += 8) ctx.lineTo(p + Math.sin(t * k + ph) * amp, t); ctx.stroke(); });
    }
    if (o.paint) { // painted wood: paint layer with brush marks, worn through at random
      x.save(); x.globalAlpha = 0.86; x.fillStyle = o.paint; x.fillRect(0, 0, S, S); x.restore();
      for (let i = 0; i < 160; i++) { const px = r() * S, py = r() * S, L = 20 + r() * 80; x.strokeStyle = rgba(shade(o.paint, r() < 0.5 ? 0.1 : -0.08), 0.18); x.lineWidth = 2 + r() * 5; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 6, py + L); x.stroke(); y.strokeStyle = 'rgba(255,255,255,.06)'; y.lineWidth = 2; y.beginPath(); y.moveTo(px, py); y.lineTo(px, py + L); y.stroke(); }
      for (let i = 0; i < 18; i++) { const px = r() * S, py = r() * S; x.fillStyle = rgba(shade(base, -0.1), 0.85); x.beginPath(); x.ellipse(px, py, 3 + r() * 10, 2 + r() * 5, r() * 3, 0, 6.3); x.fill(); y.fillStyle = 'rgba(0,0,0,.25)'; y.beginPath(); y.ellipse(px, py, 3 + r() * 10, 2 + r() * 5, 0, 0, 6.3); y.fill(); }
    }
    overlay(x, NT.mid, 0.25, 'soft-light', 2);
    overlay(x, NT.fine, 0.12, 'overlay', 2);
    return done(c, b);
  });
}

// ----------------------------------------------------------------- fabric
function weaveBump(y, S, cell, depth = 0.35) {
  for (let j = 0; j < S; j += cell) for (let i = 0; i < S; i += cell) {
    const over = ((i + j) / cell) % 2 === 0;
    const g = over ? y.createLinearGradient(i, j, i + cell, j) : y.createLinearGradient(i, j, i, j + cell);
    g.addColorStop(0, grey(0.5 - depth * 0.5)); g.addColorStop(0.5, grey(0.5 + depth * 0.5)); g.addColorStop(1, grey(0.5 - depth * 0.5));
    y.fillStyle = g; y.fillRect(i, j, cell, cell);
  }
}
// upholstery / linen. pattern: plain, check, stripe, floral, herring, ticking
export function weave(base, seed = 5, o = {}) {
  return cached('weave' + base + seed + JSON.stringify(o), () => {
    const S = 512, r = rng(seed), pat = o.pattern || 'plain';
    const [c, x, b, y] = pair(S);
    x.fillStyle = base; x.fillRect(0, 0, S, S);
    weaveBump(y, S, o.cell || 4, 0.5);
    const b2 = o.b || shade(base, -0.2), c2 = o.c || shade(base, 0.25);
    if (pat === 'check') {
      const n = o.n || 8, w = S / n;
      for (let i = 0; i < n; i += 2) { x.fillStyle = rgba(b2, 0.4); x.fillRect(i * w, 0, w, S); x.fillRect(0, i * w, S, w); }
      x.strokeStyle = rgba(c2, 0.5); x.lineWidth = 2; for (let i = 0; i < n; i++) { x.beginPath(); x.moveTo(i * w + w / 2, 0); x.lineTo(i * w + w / 2, S); x.moveTo(0, i * w + w / 2); x.lineTo(S, i * w + w / 2); x.stroke(); }
    } else if (pat === 'stripe' || pat === 'ticking') {
      const n = o.n || 8, w = S / n;
      for (let i = 0; i < n; i++) { x.fillStyle = rgba(i % 2 ? b2 : c2, pat === 'ticking' ? 0.7 : 0.45); x.fillRect(i * w, 0, pat === 'ticking' ? w * 0.18 : w * 0.5, S); }
    } else if (pat === 'floral') {
      const n = 4, cell = S / n;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const cx = (i + 0.5 + (j % 2) * 0.5) * cell, cy = (j + 0.5) * cell;
        wrapDraw(x, cx, cy, () => {
          x.rotate(r() * 6.3);
          x.fillStyle = rgba(c2, 0.85); for (let p = 0; p < 6; p++) { x.save(); x.rotate(p * 1.047); x.beginPath(); x.ellipse(0, -14, 8, 13, 0, 0, 6.3); x.fill(); x.restore(); }
          x.fillStyle = rgba(b2, 0.9); x.beginPath(); x.arc(0, 0, 7, 0, 6.3); x.fill();
          x.fillStyle = rgba(o.leaf || '#6f8150', 0.8); for (const a of [0.8, 2.8, 4.6]) { x.save(); x.rotate(a); x.beginPath(); x.ellipse(0, -30, 6, 12, 0.3, 0, 6.3); x.fill(); x.restore(); }
        });
      }
    } else if (pat === 'herring') {
      const w = 32;
      for (let j = 0; j < S; j += w) for (let i = 0; i < S; i += w) {
        x.strokeStyle = rgba(((i / w) % 2) ? b2 : c2, 0.35); x.lineWidth = 3;
        for (let k = 0; k < w; k += 6) { x.beginPath(); if ((i / w) % 2) { x.moveTo(i, j + k); x.lineTo(i + w, j + k + w / 2); } else { x.moveTo(i, j + k + w / 2); x.lineTo(i + w, j + k); } x.stroke(); }
      }
    }
    // slubby thread variation
    for (let i = 0; i < 260; i++) { const yy = r() * S, xx = r() * S, L = 20 + r() * 100; x.strokeStyle = rgba(shade(base, r() < 0.5 ? 0.18 : -0.18), 0.18); x.lineWidth = 1.5; x.beginPath(); if (r() < 0.5) { x.moveTo(xx, yy); x.lineTo(xx + L, yy); } else { x.moveTo(xx, yy); x.lineTo(xx, yy + L); } x.stroke(); }
    overlay(x, NT.big, 0.3, 'soft-light', 2);
    overlay(x, NT.fine, 0.18, 'overlay', 1);
    overlay(y, NT.mid, 0.15, 'overlay', 2);
    return done(c, b);
  });
}

// chunky knit (blankets, cat beds)
export function knit(base, seed = 6, o = {}) {
  return cached('knit' + base + seed + (o.b || ''), () => {
    const S = 512, r = rng(seed), cw = 24, ch = 28;
    const [c, x, b, y] = pair(S);
    x.fillStyle = shade(base, -0.35); x.fillRect(0, 0, S, S);
    y.fillStyle = '#000'; y.fillRect(0, 0, S, S);
    for (let j = 0; j < S / ch + 1; j++) for (let i = 0; i < S / cw; i++) {
      const band = o.b && (Math.floor(j / 3) % 4 === 1);
      const col = shade(band ? o.b : base, (r() - 0.5) * 0.12);
      for (const side of [-1, 1]) {
        const cx = i * cw + cw / 2 + side * cw * 0.22, cy = j * ch;
        x.save(); x.translate(cx, cy); x.rotate(side * 0.55);
        const g = x.createRadialGradient(0, -2, 1, 0, 0, ch * 0.55); g.addColorStop(0, shade(col, 0.2)); g.addColorStop(0.7, col); g.addColorStop(1, shade(col, -0.3));
        x.fillStyle = g; x.beginPath(); x.ellipse(0, 0, cw * 0.27, ch * 0.62, 0, 0, 6.3); x.fill(); x.restore();
        y.save(); y.translate(cx, cy); y.rotate(side * 0.55);
        const gb = y.createRadialGradient(0, 0, 1, 0, 0, ch * 0.6); gb.addColorStop(0, '#fff'); gb.addColorStop(1, '#222');
        y.fillStyle = gb; y.beginPath(); y.ellipse(0, 0, cw * 0.27, ch * 0.62, 0, 0, 6.3); y.fill(); y.restore();
      }
    }
    overlay(x, NT.fine, 0.2, 'overlay', 1);
    return done(c, b);
  });
}

// patchwork quilt with running stitches
export function quilt(colors, seed = 7) {
  return cached('quilt' + colors.join() + seed, () => {
    const S = 512, n = 6, w = S / n, r = rng(seed);
    const [c, x, b, y] = pair(S);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const col = colors[(i * 3 + j * 5 + Math.floor(r() * 2)) % colors.length];
      x.fillStyle = col; x.fillRect(i * w, j * w, w, w);
      const kind = Math.floor(r() * 4);
      x.save(); x.beginPath(); x.rect(i * w, j * w, w, w); x.clip();
      if (kind === 0) { x.fillStyle = rgba(shade(col, 0.35), 0.8); for (let a = 0; a < 6; a++) for (let bb = 0; bb < 6; bb++) { x.beginPath(); x.arc(i * w + a * w / 6 + 7, j * w + bb * w / 6 + 7, 3, 0, 6.3); x.fill(); } }
      else if (kind === 1) { x.strokeStyle = rgba(shade(col, -0.25), 0.6); x.lineWidth = 4; for (let a = -w; a < w * 2; a += 14) { x.beginPath(); x.moveTo(i * w + a, j * w); x.lineTo(i * w + a + w, j * w + w); x.stroke(); } }
      else if (kind === 2) { x.fillStyle = rgba(shade(col, 0.3), 0.7); x.beginPath(); x.arc(i * w + w / 2, j * w + w / 2, w * 0.28, 0, 6.3); x.fill(); x.fillStyle = rgba(shade(col, -0.2), 0.8); x.beginPath(); x.arc(i * w + w / 2, j * w + w / 2, w * 0.1, 0, 6.3); x.fill(); }
      x.restore();
      const g = y.createRadialGradient(i * w + w / 2, j * w + w / 2, 4, i * w + w / 2, j * w + w / 2, w * 0.72);
      g.addColorStop(0, grey(0.85)); g.addColorStop(1, grey(0.25)); y.fillStyle = g; y.fillRect(i * w, j * w, w, w);
    }
    x.strokeStyle = 'rgba(250,240,220,.85)'; x.lineWidth = 1.6; x.setLineDash([5, 4]);
    for (let i = 0; i <= n; i++) { for (const off of [-4, 4]) { x.beginPath(); x.moveTo(i * w + off, 0); x.lineTo(i * w + off, S); x.moveTo(0, i * w + off); x.lineTo(S, i * w + off); x.stroke(); } }
    x.setLineDash([]);
    overlay(x, NT.big, 0.25, 'soft-light', 2);
    overlay(x, NT.fine, 0.2, 'overlay', 1);
    weaveBumpOver(y, S);
    return done(c, b);
  });
}
function weaveBumpOver(y, S) { y.save(); y.globalAlpha = 0.25; y.globalCompositeOperation = 'overlay'; const t = canvas(64); weaveBump(t.getContext('2d'), 64, 4, 0.6); for (let j = 0; j < S; j += 64) for (let i = 0; i < S; i += 64) y.drawImage(t, i, j); y.restore(); }

// ------------------------------------------------------------------- rugs
// one-off textures with transparent fringe. kinds: braided, persian, kilim, round
export function rug(kind, cols, seed = 8) {
  return cached('rug' + kind + cols.join() + seed, () => {
    const W = 1024, H = kind === 'round' || kind === 'braided' ? 1024 : 640, r = rng(seed);
    const [c, x, b, y] = pair(W, H);
    y.fillStyle = grey(0.5); y.fillRect(0, 0, W, H);
    const [c0, c1, c2, c3] = cols;
    if (kind === 'braided' || kind === 'round') {
      const rings = 18;
      for (let k = rings; k > 0; k--) {
        const rx = (W / 2 - 10) * k / rings, ry = (H / 2 - 10) * k / rings;
        const col = cols[k % cols.length];
        x.fillStyle = col; x.beginPath(); x.ellipse(W / 2, H / 2, rx, ry, 0, 0, 6.3); x.fill();
        // braid chevrons along the ring
        const n = Math.floor(rx * 0.35);
        for (let i = 0; i < n; i++) {
          const a = i / n * 6.283, px = W / 2 + Math.cos(a) * (rx - 12), py = H / 2 + Math.sin(a) * (ry - 12);
          x.save(); x.translate(px, py); x.rotate(a + (i % 2 ? 0.6 : -0.6)); x.fillStyle = rgba(shade(col, i % 2 ? 0.18 : -0.18), 0.7); x.beginPath(); x.ellipse(0, 0, 9, 4, 0, 0, 6.3); x.fill(); x.restore();
          y.save(); y.translate(px, py); y.rotate(a + (i % 2 ? 0.6 : -0.6)); y.fillStyle = grey(0.85); y.beginPath(); y.ellipse(0, 0, 9, 4, 0, 0, 6.3); y.fill(); y.restore();
        }
        y.strokeStyle = grey(0.1); y.lineWidth = 3; y.beginPath(); y.ellipse(W / 2, H / 2, rx, ry, 0, 0, 6.3); y.stroke();
      }
    } else {
      const m = 40; // fringe margin
      x.fillStyle = c0; x.fillRect(m, 0, W - 2 * m, H);
      if (kind === 'persian') {
        const bands = [[0, c1], [26, c2], [44, c3], [70, c1], [78, c0]];
        for (const [o, col] of bands) { x.fillStyle = col; x.fillRect(m + o, o, W - 2 * m - 2 * o, H - 2 * o); }
        // border motif
        x.fillStyle = c3; for (let i = m + 40; i < W - m - 40; i += 36) { for (const yy of [35, H - 35]) { x.save(); x.translate(i, yy); x.rotate(0.785); x.fillRect(-7, -7, 14, 14); x.restore(); } }
        for (let j = 40; j < H - 40; j += 36) for (const xx of [m + 35, W - m - 35]) { x.save(); x.translate(xx, j); x.rotate(0.785); x.fillRect(-7, -7, 14, 14); x.restore(); }
        // medallion
        const cx = W / 2, cy = H / 2;
        for (let k = 0; k < 5; k++) { x.fillStyle = [c1, c2, c3, c1, c2][k]; const s = 1 - k * 0.18; x.beginPath(); x.moveTo(cx - 200 * s, cy); x.lineTo(cx, cy - 150 * s); x.lineTo(cx + 200 * s, cy); x.lineTo(cx, cy + 150 * s); x.fill(); }
        for (const sx of [-1, 1]) for (const sy of [-1, 1]) { x.fillStyle = c2; x.beginPath(); x.moveTo(cx + sx * 290, cy + sy * 180); x.lineTo(cx + sx * 380, cy + sy * 180); x.lineTo(cx + sx * 380, cy + sy * 120); x.fill(); }
        for (let i = 0; i < 40; i++) { x.fillStyle = rgba([c1, c2, c3][i % 3], 0.8); x.beginPath(); x.arc(m + 120 + r() * (W - 2 * m - 240), 110 + r() * (H - 220), 4 + r() * 6, 0, 6.3); x.fill(); }
      } else { // kilim stripes with zigzags
        let yy = 0; let k = 0;
        while (yy < H) { const h = 30 + r() * 60; x.fillStyle = cols[k % cols.length]; x.fillRect(m, yy, W - 2 * m, h);
          if (k % 2) { x.fillStyle = cols[(k + 2) % cols.length]; for (let i = m; i < W - m; i += 40) { x.beginPath(); x.moveTo(i, yy + h); x.lineTo(i + 20, yy + 6); x.lineTo(i + 40, yy + h); x.fill(); } }
          yy += h; k++; }
      }
      // fringe
      for (const fx of [0, W - m]) for (let j = 4; j < H; j += 7) { x.strokeStyle = rgba('#efe3c8', 0.95); x.lineWidth = 3; x.beginPath(); x.moveTo(fx + (fx ? 0 : m), j); x.lineTo(fx + (fx ? m - 4 - r() * 8 : 4 + r() * 8), j + (r() - 0.5) * 4); x.stroke(); y.strokeStyle = grey(0.8); y.lineWidth = 3; y.beginPath(); y.moveTo(fx + (fx ? 0 : m), j); y.lineTo(fx + (fx ? m - 6 : 6), j); y.stroke(); }
      // knot rows (pile texture)
      const t = canvas(64); weaveBump(t.getContext('2d'), 64, 4, 0.8);
      y.save(); y.beginPath(); y.rect(m, 0, W - 2 * m, H); y.clip(); y.globalAlpha = 0.6; for (let j = 0; j < H; j += 64) for (let i = 0; i < W; i += 64) y.drawImage(t, i, j); y.restore();
    }
    // wool fuzz
    overlay(x, NT.mid, 0.25, 'soft-light', 2);
    overlay(x, NT.fine, 0.25, 'overlay', 1);
    overlay(y, NT.fine, 0.35, 'overlay', 1);
    const out = done(c, b, { clamp: true });
    return out;
  });
}

// ------------------------------------------------------------------ tiles
// kinds: checker, terracotta, subway, hex
export function tiles(a, bcol, seed = 9, o = {}) {
  return cached('tiles' + a + bcol + seed + JSON.stringify(o), () => {
    const S = 512, r = rng(seed), kind = o.kind || 'checker';
    const [c, x, b, y] = pair(S);
    const grout = o.grout || '#cfc4ad';
    x.fillStyle = grout; x.fillRect(0, 0, S, S);
    y.fillStyle = grey(0.15); y.fillRect(0, 0, S, S);
    const tile = (X, Y, w, h, col) => {
      const g = 3;
      const t = shade(col, (r() - 0.5) * 0.14);
      x.fillStyle = t; roundRect(x, X + g, Y + g, w - 2 * g, h - 2 * g, 4); x.fill();
      const gr = x.createLinearGradient(X, Y, X + w, Y + h); gr.addColorStop(0, rgba('#ffffff', 0.13)); gr.addColorStop(1, rgba('#000000', 0.08)); x.fillStyle = gr; roundRect(x, X + g, Y + g, w - 2 * g, h - 2 * g, 4); x.fill();
      if (r() < 0.12) { x.fillStyle = rgba(shade(t, -0.3), 0.5); x.beginPath(); x.arc(X + g + 2 + r() * 4, Y + g + 2 + r() * 4, 2 + r() * 3, 0, 6.3); x.fill(); }
      const gb = y.createRadialGradient(X + w / 2, Y + h / 2, 2, X + w / 2, Y + h / 2, Math.max(w, h) * 0.75); gb.addColorStop(0, grey(0.75)); gb.addColorStop(1, grey(0.55));
      y.fillStyle = gb; roundRect(y, X + g, Y + g, w - 2 * g, h - 2 * g, 4); y.fill();
    };
    if (kind === 'subway') {
      const n = o.n || 8, h = S / (n * 2), w = S / n * 2 / 2;
      for (let j = 0; j < n * 2; j++) for (let i = -1; i < n; i++) tile(i * w + (j % 2 ? w / 2 : 0), j * h, w, h, (r() < 0.12 && bcol) ? bcol : a);
    } else if (kind === 'terracotta') {
      const n = o.n || 4, w = S / n;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) tile(i * w, j * w, w, w, mix(a, bcol, r()));
    } else {
      const n = o.n || 8, w = S / n;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) tile(i * w, j * w, w, w, (i + j) % 2 ? bcol : a);
    }
    overlay(x, NT.big, 0.22, 'soft-light', 2);
    overlay(x, NT.fine, 0.1, 'overlay', 1);
    return done(c, b);
  });
}
export function roundRect(x, X, Y, w, h, rad) { x.beginPath(); x.moveTo(X + rad, Y); x.arcTo(X + w, Y, X + w, Y + h, rad); x.arcTo(X + w, Y + h, X, Y + h, rad); x.arcTo(X, Y + h, X, Y, rad); x.arcTo(X, Y, X + w, Y, rad); x.closePath(); }

// --------------------------------------------------------------- carpets
export function carpet(base, seed = 10) {
  return cached('carpet' + base + seed, () => {
    const S = 512, r = rng(seed);
    const [c, x, b, y] = pair(S);
    x.fillStyle = base; x.fillRect(0, 0, S, S);
    overlay(x, NT.big, 0.3, 'soft-light', 2);
    for (let i = 0; i < 9000; i++) { x.fillStyle = rgba(shade(base, (r() - 0.5) * 0.5), 0.35); x.fillRect(r() * S, r() * S, 1.5, 1.5); }
    y.fillStyle = grey(0.5); y.fillRect(0, 0, S, S);
    for (let i = 0; i < 12000; i++) { y.fillStyle = grey(0.3 + r() * 0.7); y.fillRect(r() * S, r() * S, 2, 2); }
    return done(c, b);
  });
}

// ----------------------------------------------------- ceramics, enamel, card
export function ceramic(base, seed = 11, o = {}) {
  return cached('cer' + base + seed + (o.band || ''), () => {
    const S = 256, r = rng(seed);
    const [c, x, b, y] = pair(S);
    x.fillStyle = base; x.fillRect(0, 0, S, S);
    overlay(x, NT.big, 0.35, 'soft-light', 1);
    if (o.band) { x.fillStyle = o.band; x.fillRect(0, S * 0.18, S, S * 0.08); x.fillRect(0, S * 0.3, S, S * 0.03); }
    speckle(x, 500, [shade(base, -0.45), shade(base, -0.25)], 0.4, 1.4, r, 0.7);
    y.fillStyle = grey(0.5); y.fillRect(0, 0, S, S); overlay(y, NT.mid, 0.3, 'overlay', 1);
    // drips of glaze
    for (let i = 0; i < 14; i++) { const px = r() * S, L = 10 + r() * 40; x.strokeStyle = rgba(shade(base, 0.15), 0.45); x.lineWidth = 3 + r() * 4; x.beginPath(); x.moveTo(px, 0); x.lineTo(px, L); x.stroke(); }
    return done(c, b);
  });
}
export function enamel(base, seed = 12) {
  return cached('enamel' + base + seed, () => {
    const S = 256, r = rng(seed);
    const [c, x, b, y] = pair(S);
    x.fillStyle = base; x.fillRect(0, 0, S, S);
    overlay(x, NT.big, 0.2, 'soft-light', 1);
    for (let i = 0; i < 10; i++) { x.fillStyle = rgba('#3a3028', 0.5); x.beginPath(); x.arc(r() * S, r() * S, 0.8 + r() * 2, 0, 6.3); x.fill(); }
    y.fillStyle = grey(0.5); y.fillRect(0, 0, S, S); overlay(y, NT.mid, 0.15, 'overlay', 1);
    return done(c, b);
  });
}
export function cardboard(seed = 13, o = {}) {
  return cached('card' + seed + (o.print || ''), () => {
    const S = 512, r = rng(seed), base = '#b98b57';
    const [c, x, b, y] = pair(S);
    x.fillStyle = base; x.fillRect(0, 0, S, S);
    overlay(x, NT.big, 0.4, 'soft-light', 2);
    y.fillStyle = grey(0.5); y.fillRect(0, 0, S, S);
    for (let i = 0; i < S; i += 6) { y.fillStyle = grey(0.42 + 0.16 * Math.sin(i)); y.fillRect(i, 0, 3, S); x.fillStyle = rgba('#7a5530', 0.05); x.fillRect(i, 0, 2, S); }
    speckle(x, 400, ['#6e4b28', '#d8b585'], 0.5, 1.5, r, 0.5);
    // tape and print
    x.fillStyle = rgba('#d7b37a', 0.9); x.fillRect(S * 0.42, 0, S * 0.16, S);
    x.strokeStyle = rgba('#e9cc96', 0.7); x.lineWidth = 2; x.strokeRect(S * 0.42, -2, S * 0.16, S + 4);
    y.fillStyle = grey(0.62); y.fillRect(S * 0.42, 0, S * 0.16, S);
    x.fillStyle = rgba('#3d2b1c', 0.55); x.font = 'bold 34px Georgia, serif'; x.textAlign = 'center';
    x.fillText(o.print || 'THIS SIDE UP', S * 0.22, S * 0.3);
    x.save(); x.translate(S * 0.78, S * 0.7); x.lineWidth = 7; x.strokeStyle = rgba('#3d2b1c', 0.5); x.beginPath(); x.moveTo(0, 50); x.lineTo(0, -30); x.moveTo(-26, -6); x.lineTo(0, -34); x.lineTo(26, -6); x.stroke(); x.restore();
    x.font = 'italic 22px Georgia, serif'; x.fillText('Nine Lives Lane', S * 0.22, S * 0.75);
    return done(c, b);
  });
}
export function brick(base, seed = 14) {
  return cached('brick' + base + seed, () => {
    const S = 512, r = rng(seed), rows = 12, h = S / rows, w = S / 4;
    const [c, x, b, y] = pair(S);
    x.fillStyle = '#d8cbb2'; x.fillRect(0, 0, S, S);
    y.fillStyle = grey(0.2); y.fillRect(0, 0, S, S);
    for (let j = 0; j < rows; j++) for (let i = -1; i < 4; i++) {
      const X = i * w + (j % 2 ? w / 2 : 0), Y = j * h, col = shade(mix(base, '#7a3e2a', r() * 0.6), (r() - 0.5) * 0.2);
      x.fillStyle = col; roundRect(x, X + 3, Y + 3, w - 6, h - 6, 3); x.fill();
      speckle(x, 0, [], 0, 0, r);
      y.fillStyle = grey(0.7 + (r() - 0.5) * 0.1); roundRect(y, X + 3, Y + 3, w - 6, h - 6, 3); y.fill();
    }
    overlay(x, NT.mid, 0.4, 'soft-light', 2); overlay(x, NT.fine, 0.25, 'overlay', 1);
    speckle(x, 700, ['#4a2a1a', '#e0b49a'], 0.5, 1.6, r, 0.5);
    overlay(y, NT.fine, 0.3, 'overlay', 1);
    return done(c, b);
  });
}
// sisal rope wound round a post
export function rope(base = '#c9ad7a', seed = 15) {
  return cached('rope' + base + seed, () => {
    const S = 256, r = rng(seed), turns = 10, h = S / turns;
    const [c, x, b, y] = pair(S);
    for (let j = 0; j < turns; j++) {
      const g = x.createLinearGradient(0, j * h, 0, (j + 1) * h); g.addColorStop(0, shade(base, -0.35)); g.addColorStop(0.5, shade(base, 0.12)); g.addColorStop(1, shade(base, -0.35));
      x.fillStyle = g; x.fillRect(0, j * h, S, h);
      const gb = y.createLinearGradient(0, j * h, 0, (j + 1) * h); gb.addColorStop(0, '#111'); gb.addColorStop(0.5, '#fff'); gb.addColorStop(1, '#111');
      y.fillStyle = gb; y.fillRect(0, j * h, S, h);
      for (let i = 0; i < 40; i++) { const px = r() * S; x.strokeStyle = rgba(shade(base, r() < 0.5 ? 0.25 : -0.3), 0.6); x.lineWidth = 1; x.beginPath(); x.moveTo(px, j * h + 2); x.lineTo(px + 8, (j + 1) * h - 2); x.stroke(); }
    }
    for (let i = 0; i < 160; i++) { x.strokeStyle = rgba('#f0dcae', 0.5); x.lineWidth = 0.8; const px = r() * S, py = r() * S; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 10, py + (r() - 0.5) * 10); x.stroke(); }
    return done(c, b);
  });
}
// felt fibres: the fur and felt bump that every cat shares
export function feltBump() {
  return cached('felt', () => {
    const S = 256, r = rng(16), c = canvas(S), x = c.getContext('2d');
    x.fillStyle = grey(0.5); x.fillRect(0, 0, S, S);
    overlay(x, NT.fine, 0.6, 'overlay', 2);
    for (let i = 0; i < 2600; i++) {
      const px = r() * S, py = r() * S, a = r() * 6.3, L = 2 + r() * 7;
      x.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.3)'; x.lineWidth = 0.8 + r();
      wrap(x, () => { x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * L, py + Math.sin(a) * L); x.stroke(); });
    }
    return toTex(c, { data: true });
  });
}
// leaves: alpha shape with veins. kind: fig, monstera, long, round
export function leaf(base, kind = 'fig', seed = 17) {
  return cached('leaf' + base + kind + seed, () => {
    const S = 256, r = rng(seed);
    const [c, x, b, y] = pair(S);
    const path = ctx => {
      ctx.beginPath();
      if (kind === 'long') { ctx.moveTo(S / 2, 4); ctx.quadraticCurveTo(S * 0.72, S * 0.5, S / 2, S - 4); ctx.quadraticCurveTo(S * 0.28, S * 0.5, S / 2, 4); }
      else if (kind === 'round') { ctx.ellipse(S / 2, S / 2, S * 0.4, S * 0.46, 0, 0, 6.3); }
      else { ctx.moveTo(S / 2, 6); ctx.bezierCurveTo(S * 0.95, S * 0.2, S * 0.95, S * 0.75, S / 2, S - 6); ctx.bezierCurveTo(S * 0.05, S * 0.75, S * 0.05, S * 0.2, S / 2, 6); }
    };
    const g = x.createLinearGradient(0, 0, S, S); g.addColorStop(0, shade(base, 0.15)); g.addColorStop(1, shade(base, -0.2));
    x.fillStyle = g; path(x); x.fill();
    x.save(); path(x); x.clip(); overlay(x, NT.mid, 0.35, 'soft-light', 1);
    if (kind === 'monstera') { x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { x.beginPath(); x.ellipse(S / 2 + s * S * (0.16 + i * 0.02), S * (0.25 + i * 0.16), S * 0.05, S * 0.025, s * 0.5, 0, 6.3); x.fill(); } x.globalCompositeOperation = 'source-over'; }
    x.strokeStyle = rgba(shade(base, 0.35), 0.7); x.lineWidth = 3; x.beginPath(); x.moveTo(S / 2, 8); x.lineTo(S / 2, S - 8); x.stroke();
    x.lineWidth = 1.5; for (let i = 1; i < 7; i++) for (const s of [-1, 1]) { const yy = S * i / 7.5; x.beginPath(); x.moveTo(S / 2, yy); x.quadraticCurveTo(S / 2 + s * S * 0.15, yy - 6, S / 2 + s * S * 0.33, yy - 22); x.stroke(); }
    x.restore();
    y.fillStyle = grey(0.5); y.fillRect(0, 0, S, S); y.strokeStyle = grey(0.85); y.lineWidth = 4; y.beginPath(); y.moveTo(S / 2, 8); y.lineTo(S / 2, S - 8); y.stroke();
    return done(c, b, { clamp: true });
  });
}
// book spines: one texture per colour, with bands and a title block
export function spine(base, seed = 18) {
  return cached('spine' + base + seed, () => {
    const W = 64, H = 256, r = rng(seed);
    const [c, x, b, y] = pair(W, H);
    x.fillStyle = base; x.fillRect(0, 0, W, H);
    overlay(x, NT.fine, 0.3, 'overlay', 1);
    const gold = r() < 0.5 ? '#d9b35a' : '#efe4c8';
    x.fillStyle = gold; for (const yy of [18, 26, H - 30, H - 22]) x.fillRect(4, yy, W - 8, 3);
    x.fillStyle = rgba(shade(base, -0.3), 0.9); x.fillRect(8, H * 0.3, W - 16, H * 0.28);
    x.fillStyle = gold; for (let i = 0; i < 4; i++) x.fillRect(14, H * 0.33 + i * 14, W - 28 - r() * 10, 4);
    y.fillStyle = grey(0.5); y.fillRect(0, 0, W, H); y.fillStyle = grey(0.75); for (const yy of [16, H - 32]) y.fillRect(0, yy, W, 12);
    const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(0.3, 'rgba(255,255,255,.08)'); g.addColorStop(1, 'rgba(0,0,0,.35)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    return done(c, b);
  });
}
// brushed brass
export function brass(seed = 19) {
  return cached('brass' + seed, () => {
    const S = 128, r = rng(seed);
    const [c, x, b, y] = pair(S);
    x.fillStyle = '#b58a3c'; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 300; i++) { x.strokeStyle = rgba(r() < 0.5 ? '#e7c77a' : '#7a5a24', 0.25); x.beginPath(); const yy = r() * S; x.moveTo(0, yy); x.lineTo(S, yy + (r() - 0.5) * 3); x.stroke(); }
    overlay(x, NT.mid, 0.3, 'soft-light', 0.5);
    y.fillStyle = grey(0.5); y.fillRect(0, 0, S, S);
    return done(c, b);
  });
}
// cheap soft round shadow / glow used under things
export function blob(o = {}) {
  return cached('blob' + JSON.stringify(o), () => {
    const S = 128, c = canvas(S), x = c.getContext('2d');
    const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    const col = o.color || '0,0,0';
    g.addColorStop(0, `rgba(${col},${o.a ?? 0.55})`); g.addColorStop(o.mid ?? 0.45, `rgba(${col},${(o.a ?? 0.55) * 0.5})`); g.addColorStop(1, `rgba(${col},0)`);
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    return toTex(c, { clamp: true });
  });
}
// paper background for the interface (returns a data URL)
export function paperURL(base = '#efe5cf', seed = 20, size = 256) {
  const r = rng(seed), c = canvas(size), x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, size, size);
  overlay(x, NT.big, 0.18, 'soft-light', size / 256);
  overlay(x, NT.fine, 0.18, 'overlay', size / 128);
  speckle(x, 160, [rgba('#6a5030', 0.25), rgba('#ffffff', 0.35)], 0.3, 1, r);
  for (let i = 0; i < 40; i++) { x.strokeStyle = rgba('#8a6a40', 0.06); x.lineWidth = 0.6; const px = r() * size, py = r() * size; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (r() - 0.5) * 20, py + (r() - 0.5) * 20); x.stroke(); }
  return c.toDataURL('image/png');
}
export function hexToThree(h) { const [r, g, b] = hex2rgb(h); return new THREE.Color(r / 255, g / 255, b / 255).convertSRGBToLinear(); }
