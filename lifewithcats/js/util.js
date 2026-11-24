// Life with Cats — small shared helpers: maths, random numbers, noise, colour.

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
export const smooth = t => t * t * (3 - 2 * t);
export const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const TAU = Math.PI * 2;

export function angDiff(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
export function dampAngle(a, b, k, dt) { return a + angDiff(a, b) * (1 - Math.exp(-k * dt)); }

// xorshift random numbers with a seed
export function rng(seed) {
  let s = (seed >>> 0) || 0x9e3779b9;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
export function hashStr(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length) % arr.length];
export const range = (r, a, b) => a + (b - a) * r();
export function shuffle(arr, r = Math.random) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
export function weighted(items, weightOf, r = Math.random) {
  let tot = 0; for (const it of items) tot += Math.max(0, weightOf(it));
  if (tot <= 0) return null;
  let x = r() * tot; for (const it of items) { x -= Math.max(0, weightOf(it)); if (x <= 0) return it; }
  return items[items.length - 1];
}

// ---------------------------------------------------------------- noise
// Tileable value noise: period is in lattice cells, so a texture that spans
// exactly `period` cells wraps without a seam.
export function makeNoise(seed) {
  const r = rng(seed);
  const perm = new Uint8Array(512), vals = new Float32Array(256);
  for (let i = 0; i < 256; i++) { perm[i] = i; vals[i] = r(); }
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
  for (let i = 0; i < 256; i++) perm[256 + i] = perm[i];
  const lat = (x, y, p) => { x = ((x % p) + p) % p; y = ((y % p) + p) % p; return vals[perm[perm[x & 255] + (y & 255)]]; };
  function n2(x, y, p = 256) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = lat(xi, yi, p), b = lat(xi + 1, yi, p), c = lat(xi, yi + 1, p), d = lat(xi + 1, yi + 1, p);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, oct = 4, p = 256, gain = 0.5) {
    let s = 0, amp = 0.5, f = 1, norm = 0;
    for (let o = 0; o < oct; o++) { s += amp * n2(x * f, y * f, p * f); norm += amp; amp *= gain; f *= 2; }
    return s / norm;
  }
  return { n2, fbm };
}
export const NOISE = makeNoise(1337);

// ---------------------------------------------------------------- colour
export function hex2rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
export function rgb2hex(r, g, b) { return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
export function mix(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)); }
export function shade(h, amt) { return amt >= 0 ? mix(h, '#ffffff', amt) : mix(h, '#000000', -amt); }
export function warm(h, amt) { return mix(h, '#e0a060', amt); }
export function rgba(h, a) { const [r, g, b] = hex2rgb(h); return `rgba(${r},${g},${b},${a})`; }

export function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(n >= 1e10 ? 0 : 1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace(/\.0$/, '') + 'k';
  return String(Math.floor(n));
}
export function clockStr(min) {
  const h24 = Math.floor(min / 60) % 24, m = Math.floor(min % 60);
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'am' : 'pm'}`;
}
export const wait = ms => new Promise(r => setTimeout(r, ms));
