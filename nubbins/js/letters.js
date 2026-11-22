// NUBBINS — puffy 3D gummy letters for the title, grown from the font itself.
import * as THREE from '../lib/three.module.min.js';
import { surfaceNets, gradient, makeGummyMaterial } from './gummy.js';

// 1D squared distance transform (Felzenszwalb & Huttenlocher)
function edt1(f, n, d, v, z) {
  let k = 0; v[0] = 0; z[0] = -1e20; z[1] = 1e20;
  for (let q = 1; q < n; q++) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
    k++; v[k] = q; z[k] = s; z[k + 1] = 1e20;
  }
  k = 0;
  for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
}
function edt2(grid, w, h) {
  const n = Math.max(w, h), f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  for (let x = 0; x < w; x++) { for (let y = 0; y < h; y++) f[y] = grid[y * w + x]; edt1(f, h, d, v, z); for (let y = 0; y < h; y++) grid[y * w + x] = d[y]; }
  for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) f[x] = grid[y * w + x]; edt1(f, w, d, v, z); for (let x = 0; x < w; x++) grid[y * w + x] = Math.sqrt(d[x]); }
}

const cache = new Map();
function letterGeo(ch, font) {
  if (cache.has(ch)) return cache.get(ch);
  const W = 150, H = 170, pad = 14;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#fff'; g.font = `150px ${font}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const m = g.measureText(ch);
  g.fillText(ch, W / 2, H - pad - 6);
  const img = g.getImageData(0, 0, W, H).data;
  const inside = new Float64Array(W * H), outside = new Float64Array(W * H);
  for (let i = 0; i < W * H; i++) { const on = img[i * 4] > 127; inside[i] = on ? 1e20 : 0; outside[i] = on ? 0 : 1e20; }
  edt2(inside, W, H); edt2(outside, W, H);
  const sd = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) sd[i] = outside[i] - inside[i]; // + outside, - inside (pixels)
  const px = 0.0062; // world units per pixel
  const sample = (x, y) => {
    const fx = x / px + W / 2, fy = H - pad - 6 - y / px;
    const ix = Math.floor(fx), iy = Math.floor(fy);
    if (ix < 0 || iy < 0 || ix >= W - 1 || iy >= H - 1) return 40 * px;
    const tx = fx - ix, ty = fy - iy;
    const a = sd[iy * W + ix], b = sd[iy * W + ix + 1], cc = sd[(iy + 1) * W + ix], d = sd[(iy + 1) * W + ix + 1];
    return ((a * (1 - tx) + b * tx) * (1 - ty) + (cc * (1 - tx) + d * tx) * ty) * px;
  };
  const depth = 0.11, round = 0.06;
  const sdf = (x, y, z) => {
    const d2 = sample(x, y) + round * 0.35;
    const dz = Math.abs(z) - depth;
    const ax = Math.max(d2, 0), az = Math.max(dz, 0);
    return Math.sqrt(ax * ax + az * az) + Math.min(Math.max(d2, dz), 0) - round;
  };
  const halfW = (m.width / 2 + 10) * px;
  const net = surfaceNets(sdf, new THREE.Vector3(-halfW - 0.1, -0.12, -0.25), new THREE.Vector3(halfW + 0.1, (H - pad) * px + 0.05, 0.25), 0.012);
  const n = net.pos.length / 3, P = net.pos, N = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    let x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
    for (let it = 0; it < 2; it++) { const dd = sdf(x, y, z); const gr = gradient(sdf, x, y, z); x -= gr.x * dd; y -= gr.y * dd; z -= gr.z * dd; }
    P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
    const gr = gradient(sdf, x, y, z); N[i * 3] = gr.x; N[i * 3 + 1] = gr.y; N[i * 3 + 2] = gr.z;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  geo.setAttribute('shade', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
  geo.setIndex(net.index);
  geo.computeBoundingSphere();
  const out = { geo, w: m.width * px };
  cache.set(ch, out);
  return out;
}

const FLAVORS = [
  { tint: '#ff6a78', deep: '#c4001c', glow: '#ff2040' },
  { tint: '#ffb466', deep: '#ff6000', glow: '#ff8a1a' },
  { tint: '#fff2a0', deep: '#ffc800', glow: '#ffd020', atten: 0.6 },
  { tint: '#c0ff70', deep: '#2f9a00', glow: '#6aff22' },
  { tint: '#78ccff', deep: '#0a3fd0', glow: '#1e7bff' },
  { tint: '#cf98ff', deep: '#5a0aa8', glow: '#9a40ff' },
  { tint: '#ff8ad0', deep: '#c0108a', glow: '#ff40b0' },
];

export function buildWord(word, font) {
  const group = new THREE.Group();
  const letters = [];
  let x = 0; const gap = 0.02;
  const parts = [...word].map((ch, i) => { const L = letterGeo(ch, font); return { ch, L, i }; });
  const total = parts.reduce((s, p) => s + p.L.w + gap, -gap);
  x = -total / 2;
  for (const p of parts) {
    const fl = Object.assign({ thick: 0.25, atten: 0.22, glowAmt: 0.25 }, FLAVORS[p.i % FLAVORS.length]);
    const mat = makeGummyMaterial(fl);
    const mesh = new THREE.Mesh(p.L.geo, mat);
    const piv = new THREE.Group(); piv.add(mesh);
    piv.position.x = x + p.L.w / 2; x += p.L.w + gap;
    group.add(piv);
    letters.push({ piv, mesh, mat, i: p.i, base: piv.position.clone(), s: 1, v: 0, y: 0, vy: 0 });
  }
  return { group, letters, width: total };
}
