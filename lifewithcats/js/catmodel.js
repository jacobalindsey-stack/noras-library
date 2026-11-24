// Life with Cats — the cats themselves: soft felted shapes with painted
// coats, big round eyes, and a rig of simple joints posed by hand-written
// motion (sit, loaf, sploot, belly-up, knead, scratch, zoom...).
import * as THREE from '../lib/three.module.min.js';
import * as T from './tex.js';
import { COATS, BREEDS } from './catdata.js';
import { makeNoise, rng, mix, shade, clamp, lerp, damp, hex2rgb, rgb2hex, smooth } from './util.js';
import { wobble } from './geo.js';

// ------------------------------------------------------------ coat painting
const S2 = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function mixRGB(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
const WHITE = hex2rgb('#efe9de'), PINK = hex2rgb('#e2a99c');
function painter(w, h, fn) {
  const c = T.canvas(w, h), x = c.getContext('2d'), img = x.createImageData(w, h), d = img.data;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const col = fn((i + 0.5) / w, (j + 0.5) / h);
    const k = (j * w + i) * 4; d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return c;
}
// patches for calico / tortie / van
function patchCol(C, N, u, v, s = 3) {
  const n = N.fbm(u * s * 4, v * s * 2.2, 3, 256);
  if (C.pattern === 'tortie') { const t = N.fbm(u * 18 + 3, v * 11, 2, 256); return hex2rgb(C.patches[t > 0.55 ? 0 : t > 0.45 ? 1 : 2]); }
  if (n > 0.56) return hex2rgb(C.patches[0]);
  if (n < 0.4 && C.patches[1]) return hex2rgb(C.patches[1]);
  return null;
}
function furGrain(col, N, u, v) { const g = 0.93 + 0.12 * N.n2(u * 140, v * 70, 256); return [col[0] * g, col[1] * g, col[2] * g]; }

export function paintCoat(cat) {
  const C = COATS[cat.coat], N = makeNoise(cat.seed % 9973 + 7);
  const base = hex2rgb(C.base), stripe = hex2rgb(C.stripe || shade(C.base, -0.35)), point = C.point ? hex2rgb(C.point) : null;
  const tabby = C.pattern === 'tabby' || C.tabby;
  const belly = mixRGB(base, WHITE, C.pattern === 'skin' ? 0.1 : 0.32);
  const white = C.white || 0;
  // body: u wraps round the spine (0.75 = spine, 0.25 = belly), v runs chest (0) to rump (1)
  const body = painter(256, 128, (u, v) => {
    let ds = Math.abs(u - 0.75); ds = Math.min(ds, 1 - ds); const side = ds * 2; // 0 spine .. 1 belly
    let col = mixRGB(base, belly, S2(0.55, 1, side));
    if (tabby && C.pattern !== 'tux') {
      const wob = N.n2(u * 8, v * 6, 256) * 1.4 + side * 1.1;
      const s = Math.sin((v * 7.5 + wob) * Math.PI * 2);
      const k = S2(0.25, 0.75, s) * (1 - S2(0.55, 0.85, side)) * (C.faint ? 0.35 : 0.85);
      col = mixRGB(col, stripe, k);
      col = mixRGB(col, stripe, (1 - S2(0.03, 0.09, side)) * 0.8);
    }
    if (C.pattern === 'spotted') {
      const n = N.n2(u * 16, v * 9, 256), n2 = N.n2(u * 16 + 0.5, v * 9 + 0.3, 256);
      if (n > 0.64 && side < 0.85) col = mixRGB(col, stripe, S2(0.64, 0.72, n) * (n2 > 0.55 ? 0.55 : 1));
      col = mixRGB(col, stripe, (1 - S2(0.02, 0.07, side)) * 0.6);
    }
    if (C.pattern === 'ticked') { col = mixRGB(col, stripe, N.n2(u * 90, v * 50, 256) * 0.35); col = mixRGB(col, stripe, (1 - S2(0.02, 0.08, side)) * 0.5); }
    if (C.pattern === 'smoke') col = mixRGB(col, stripe, S2(0.4, 1, side) * 0.6);
    if (C.pattern === 'skin') { col = mixRGB(col, hex2rgb('#c98a7a'), S2(0.6, 0.8, N.fbm(u * 6, v * 4, 3, 256)) * 0.5); const wr = Math.abs(Math.sin(v * 40 + N.n2(u * 4, v * 4, 256) * 3)); col = mixRGB(col, hex2rgb('#b97a6a'), (1 - S2(0, 0.15, wr)) * 0.25 * (1 - side)); }
    if (C.pattern === 'tux') {
      const w = S2(1 - white * 1.25, 1.05 - white * 1.25, side) + (v < 0.3 ? S2(0.35, 0.5, side) * (1 - S2(0.22, 0.32, v)) : 0);
      col = mixRGB(col, WHITE, clamp(w, 0, 1));
    }
    if (C.pattern === 'calico' || C.pattern === 'tortie') { const p = patchCol(C, N, u, v); if (p && (C.pattern === 'tortie' || side < 0.7)) col = p; if (C.pattern === 'calico' && side > 0.62) col = WHITE; }
    if (C.pattern === 'van') { col = WHITE; if (v > 0.82 && side < 0.4) col = hex2rgb(C.patches[0]); }
    if (C.pattern === 'point') col = mixRGB(col, point, S2(0.6, 1.0, v) * 0.25 * (1 - side));
    return furGrain(col, N, u, v);
  });
  // head: u = 0.25 is the face, v runs top (0) to chin (1)
  const head = painter(256, 128, (u, v) => {
    let df = Math.abs(u - 0.25); df = Math.min(df, 1 - df);
    let col = base;
    if (tabby && C.pattern !== 'tux') {
      if (df > 0.22) { const s = Math.sin((v * 6 + N.n2(u * 6, v * 5, 256)) * Math.PI * 2); col = mixRGB(col, stripe, S2(0.3, 0.8, s) * (C.faint ? 0.3 : 0.7)); }
      // the M on the forehead
      if (v > 0.1 && v < 0.38 && df < 0.09) { const bars = Math.abs(Math.sin((u - 0.25) * Math.PI * 2 * 8)); col = mixRGB(col, stripe, (1 - S2(0.15, 0.45, bars)) * (C.faint ? 0.3 : 0.8) * (1 - S2(0.3, 0.38, v))); }
      // cheek lines
      if (df > 0.1 && df < 0.2 && v > 0.48 && v < 0.62) { const l = Math.abs(Math.sin(v * 50)); col = mixRGB(col, stripe, (1 - S2(0.2, 0.6, l)) * 0.6); }
    }
    if (C.pattern === 'spotted' && df > 0.08) { const n = N.n2(u * 20 + 9, v * 10, 256); if (n > 0.66) col = mixRGB(col, stripe, 0.8); }
    if (C.pattern === 'ticked') col = mixRGB(col, stripe, N.n2(u * 90, v * 50, 256) * 0.3);
    if (C.pattern === 'skin') col = mixRGB(col, hex2rgb('#c98a7a'), S2(0.6, 0.8, N.fbm(u * 6 + 3, v * 4, 3, 256)) * 0.5);
    // lighter muzzle and chin for most cats
    const md = Math.hypot(df * 2.2, (v - 0.74) * 1.4);
    if (C.pattern !== 'point') col = mixRGB(col, mixRGB(base, WHITE, 0.45), (1 - S2(0.12, 0.26, md)) * 0.6);
    if (C.pattern === 'tux') { const w = (1 - S2(0.16, 0.24 + white * 0.08, md)) + (df < 0.03 + white * 0.03 && v > 0.32 ? 1 : 0); col = mixRGB(col, WHITE, clamp(w, 0, 1)); }
    if (C.pattern === 'calico' || C.pattern === 'tortie') { const p = patchCol(C, N, u + 0.31, v * 0.6 + 0.2, 2); if (p) col = p; else if (C.pattern === 'calico') col = WHITE; if (C.pattern === 'calico' && md < 0.25) col = WHITE; }
    if (C.pattern === 'van') { col = WHITE; if (v < 0.32 && df > 0.04) col = hex2rgb(C.patches[0]); }
    if (C.pattern === 'point') { const m = 1 - S2(0.1, 0.34, Math.hypot(df * 1.8, (v - 0.62) * 1.2)); col = mixRGB(col, point, m * 0.95); }
    return furGrain(col, N, u, v);
  });
  // legs: v runs top (0) to paw (1)
  const legTex = front => painter(32, 64, (u, v) => {
    let col = base;
    if (tabby && C.pattern !== 'tux') col = mixRGB(col, stripe, S2(0.3, 0.8, Math.sin((v * 4 + u * 0.2) * Math.PI * 2)) * (C.faint ? 0.3 : 0.6));
    if (C.pattern === 'spotted' && N.n2(u * 8, v * 10 + (front ? 0 : 40), 256) > 0.65) col = stripe;
    if (C.pattern === 'tux') col = mixRGB(col, WHITE, S2(front ? 0.55 - white * 0.4 : 0.6 - white * 0.5, front ? 0.62 - white * 0.4 : 0.68 - white * 0.5, v));
    if (C.pattern === 'calico') col = v > 0.3 ? WHITE : (patchCol(C, N, u + (front ? 0.2 : 0.7), 0.5, 2) || WHITE);
    if (C.pattern === 'tortie') col = patchCol(C, N, u + (front ? 0.2 : 0.7), v, 2);
    if (C.pattern === 'van') col = WHITE;
    if (C.pattern === 'point') col = mixRGB(col, point, C.mitts ? (v > 0.75 ? 0 : S2(0, 0.5, v)) : S2(0, 0.6, v));
    if (C.mitts && v > 0.75) col = WHITE;
    if (C.pattern === 'smoke') col = mixRGB(col, stripe, 0.2);
    return furGrain(col, N, u, v);
  });
  const pawCol = rgb2hex(...(C.pattern === 'tux' || C.pattern === 'calico' || C.pattern === 'van' || C.mitts ? WHITE : C.pattern === 'point' ? point : base));
  // paw with pink toe beans underneath
  const paw = (() => { const c = T.canvas(64, 32), x = c.getContext('2d'); x.fillStyle = pawCol; x.fillRect(0, 0, 64, 32); x.fillStyle = C.coat === 'black' || C.base === '#2a2627' ? '#4a3a3a' : '#d98a8a'; for (let i = 0; i < 4; i++) { x.beginPath(); x.ellipse(8 + i * 16, 27, 5, 3, 0, 0, 6.3); x.fill(); } return c; })();
  // tail segment colours
  const tail = [];
  for (let k = 0; k < 8; k++) {
    let col = C.base;
    if (tabby && C.pattern !== 'tux') col = k % 2 ? C.stripe : C.base;
    if (C.pattern === 'spotted' || C.pattern === 'ticked') col = k % 2 ? mix(C.base, C.stripe, 0.6) : C.base;
    if (C.pattern === 'point') col = mix(C.base, C.point, clamp(k / 4, 0, 1));
    if (C.pattern === 'van') col = C.patches[0];
    if (C.pattern === 'calico') col = k < 4 ? C.patches[(cat.seed >> 3) % 2] : C.patches[(cat.seed >> 4) % 2];
    if (C.pattern === 'tortie') col = C.patches[(k + cat.seed) % 3];
    if (C.pattern === 'tux' && k === 7 && cat.seed % 3 === 0) col = '#efe9de';
    if (C.pattern === 'tux' && C.tabby) col = k % 2 ? C.stripe : C.base;
    tail.push(col);
  }
  const earOuter = C.pattern === 'point' ? C.point : C.pattern === 'van' ? C.patches[0] : C.pattern === 'calico' ? C.patches[cat.seed % 2] : C.pattern === 'tortie' ? C.patches[0] : C.base;
  const dark = hex2rgb(C.base)[0] < 70;
  return {
    body, head, legF: legTex(true), legH: legTex(false), paw, tail, earOuter,
    earInner: dark ? '#9a6a66' : '#e0a49a', nose: dark ? '#3a2a2a' : C.pattern === 'skin' ? '#d48a8a' : C.base.startsWith('#d9') ? '#c8705a' : '#d98a8a',
    muzzle: C.pattern === 'tux' || C.pattern === 'calico' || C.pattern === 'van' ? '#efe9de' : C.pattern === 'point' ? C.point : mix(C.base, '#efe9de', 0.45),
    base: C.base, skin: C.pattern === 'skin', whisk: dark ? '#e8e2d8' : '#f4efe6',
  };
}
function eyeTex(col) {
  const c = T.canvas(128), x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, shade(col, 0.35)); g.addColorStop(0.55, col); g.addColorStop(0.88, shade(col, -0.35)); g.addColorStop(1, '#2a2020');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 1.5;
  for (let i = 0; i < 40; i++) { const a = i / 40 * 6.283; x.beginPath(); x.moveTo(64 + Math.cos(a) * 16, 64 + Math.sin(a) * 16); x.lineTo(64 + Math.cos(a) * 52, 64 + Math.sin(a) * 52); x.stroke(); }
  return T.toTex(c, { clamp: true });
}

// ------------------------------------------------------------ poses
// angles in radians. f*/h*: front/hind leg swing (negative = paw forward).
// fl/hl null length = reach for the floor.
const BASE = { hipY: 0.68, pitch: 0, roll: 0, sway: 0, headPitch: 0.05, headYaw: 0, headRoll: 0, fl: 0, fr: 0, hl: 0, hr: 0, fLen: -1, hLen: -1, frLen: -1, tailUp: 0.85, tailCurl: 0.14, tailSide: 0, tailWave: 0.22, tailSpeed: 2.2, ears: 0, eyes: 1, pupil: 0.45, mouth: 0, tongue: 0, puff: 1, tall: 1 };
export const POSES = {
  stand: {},
  walk: { tailUp: 1.1, tailCurl: 0.18, tailWave: 0.12 },
  run: { tailUp: 0.35, tailCurl: 0.05, tailWave: 0.1, ears: 0.3, pupil: 0.9 },
  sit: { hipY: 0.25, pitch: 0.82, fl: -0.06, fr: -0.06, hl: -1.42, hr: -1.42, hLen: 0.44, tailUp: -0.32, tailSide: 0.3, tailCurl: 0, tailWave: 0.05, headPitch: 0.05 },
  judge: { hipY: 0.24, pitch: 0.86, fl: -0.02, fr: -0.02, hl: -1.42, hr: -1.42, hLen: 0.44, tailUp: -0.32, tailSide: 0.32, tailCurl: 0, tailWave: 0.02, headPitch: -0.05, eyes: 0.42, ears: 0.15 },
  loaf: { hipY: 0.34, pitch: 0.02, fl: -1.45, fr: -1.45, fLen: 0.16, frLen: 0.16, hl: -1.4, hr: -1.4, hLen: 0.14, tailUp: -0.1, tailSide: 0.36, tailCurl: 0, tailWave: 0.03, eyes: 0.55, headPitch: 0.1 },
  sleep: { hipY: 0.32, pitch: 0.0, fl: -1.45, fr: -1.45, fLen: 0.16, frLen: 0.16, hl: -1.4, hr: -1.4, hLen: 0.14, tailUp: -0.1, tailSide: 0.42, tailCurl: 0, tailWave: 0.0, eyes: 0, headPitch: 0.55, headYaw: 0.55, headRoll: 0.25, ears: 0.15, roll: 0.12 },
  flop: { hipY: 0.36, roll: 1.35, fl: -0.5, fr: -0.4, fLen: 0.42, frLen: 0.42, hl: 0.2, hr: 0.35, hLen: 0.46, tailUp: -0.05, tailSide: 0.1, tailWave: 0.02, eyes: 0, headPitch: 0.1, headRoll: -0.6, ears: 0.1 },
  sploot: { hipY: 0.3, pitch: -0.04, fl: -1.35, fr: -1.35, fLen: 0.42, frLen: 0.42, hl: 1.5, hr: 1.5, hLen: 0.5, tailUp: -0.04, tailSide: 0, tailCurl: 0, tailWave: 0.08, eyes: 0.8, headPitch: 0.15 },
  belly: { hipY: 0.38, roll: 2.55, fl: -0.7, fr: -0.4, fLen: 0.36, frLen: 0.36, hl: 0.4, hr: 0.2, hLen: 0.42, tailUp: 0.0, tailSide: 0.15, tailWave: 0.1, eyes: 0.75, headPitch: -0.1, headRoll: -1.9, headYaw: 0.2 },
  stretch: { hipY: 0.74, pitch: -0.4, fl: -0.9, fr: -0.9, hl: 0.12, hr: 0.12, tailUp: 1.25, tailCurl: 0.1, headPitch: -0.25, eyes: 0.4, mouth: 0.5 },
  crouch: { hipY: 0.42, pitch: -0.06, headPitch: -0.12, tailUp: -0.12, tailCurl: 0.02, tailWave: 0.18, tailSpeed: 8, ears: 0.25, pupil: 1 },
  scratch: { hipY: 0.5, pitch: 1.12, hl: 0.12, hr: 0.12, fl: -1.5, fr: -1.5, fLen: 0.56, frLen: 0.56, tailUp: 0.5, tailCurl: 0.1, headPitch: 0.25, ears: 0.15 },
  scratchLow: { hipY: 0.6, pitch: -0.18, fl: -0.7, fr: -0.7, tailUp: 1.0, headPitch: 0.3 },
  swat: { hipY: 0.26, pitch: 0.8, fl: -0.06, fr: -1.2, frLen: 0.5, hl: -1.42, hr: -1.42, hLen: 0.44, tailUp: -0.25, tailSide: 0.25, tailWave: 0.15, tailSpeed: 6, headPitch: 0.2, pupil: 0.9 },
  eat: { hipY: 0.62, pitch: -0.15, headPitch: 0.85, tailUp: 0.1, tailWave: 0.05, eyes: 0.7 },
  groom: { hipY: 0.25, pitch: 0.82, fl: -1.7, fLen: 0.34, fr: -0.06, hl: -1.42, hr: -1.42, hLen: 0.44, tailUp: -0.32, tailSide: 0.3, tailWave: 0.04, headPitch: 0.45, headYaw: -0.35, eyes: 0.35 },
  knead: { hipY: 0.46, pitch: 0.22, tailUp: 0.6, tailWave: 0.1, eyes: 0.25, headPitch: 0.15 },
  arch: { hipY: 0.84, pitch: 0, tailUp: 1.45, tailCurl: 0, tailWave: 0.02, ears: 1, pupil: 1, mouth: 0.5, puff: 1.32, tall: 1.18, headPitch: 0.15 },
  climb: { hipY: 0.42, pitch: 1.5, fl: -1.55, fr: -1.55, fLen: 0.5, frLen: 0.5, hl: -0.5, hr: -0.5, hLen: 0.45, tailUp: -1.3, tailCurl: 0, tailWave: 0.15, headPitch: 0.2, ears: 0.2 },
  air: { hipY: 0.6, pitch: 0, fl: -1.0, fr: -1.0, fLen: 0.55, frLen: 0.55, hl: 0.9, hr: 0.9, hLen: 0.55, tailUp: 0.2, tailCurl: 0, tailWave: 0, pupil: 1 },
  sheepish: { hipY: 0.28, pitch: 0.7, fl: -0.06, fr: -0.06, hl: -1.42, hr: -1.42, hLen: 0.44, tailUp: -0.35, tailSide: 0.35, tailWave: 0.02, ears: 0.85, eyes: 0.7, headPitch: 0.35 },
  ride: { hipY: 0.34, pitch: 0.02, fl: -1.45, fr: -1.45, fLen: 0.16, frLen: 0.16, hl: -1.4, hr: -1.4, hLen: 0.14, tailUp: -0.1, tailSide: 0.36, tailCurl: 0, tailWave: 0.03, eyes: 0.42, headPitch: 0 },
};
for (const k in POSES) POSES[k] = { ...BASE, ...POSES[k] };
const KEYS = Object.keys(BASE);

// ------------------------------------------------------------ the rig
const UP = new THREE.Vector3(0, 1, 0);
const TMP = new THREE.Vector3(), TMP2 = new THREE.Vector3(), MAT = new THREE.Matrix4();
const feltBumpCache = {};
function furMat(map, o = {}) {
  const key = (o.rep || 3) + '';
  if (!feltBumpCache[key]) { const b = T.feltBump().clone(); b.repeat.set(o.rep || 3, o.rep || 3); b.needsUpdate = true; feltBumpCache[key] = b; }
  const m = new THREE.MeshStandardMaterial({ map: map || null, color: o.color ? new THREE.Color(o.color) : 0xffffff, roughness: o.rough ?? 0.96, bumpMap: o.noBump ? null : feltBumpCache[key], bumpScale: o.bump ?? 1.6 });
  return m;
}

export class CatRig {
  constructor(cat) {
    this.cat = cat;
    const B = BREEDS[cat.breed], coat = paintCoat(cat);
    this.coat = coat;
    this.B = B;
    const fluff = Math.max(0, B.fluff), skin = coat.skin;
    const kit = cat.age === 'kitten';
    const fur = (canvas, o = {}) => furMat(T.toTex(canvas), { bump: skin ? 0.3 : 1.6 + fluff, rough: skin ? 0.7 : 0.96, ...o });
    const plain = (col, o = {}) => furMat(null, { color: col, bump: skin ? 0.3 : 1.4 + fluff, rough: skin ? 0.7 : 0.96, ...o });
    this.mats = [];
    const keep = m => { this.mats.push(m); return m; };
    const bodyM = keep(fur(coat.body)), headM = keep(fur(coat.head)), legFM = keep(fur(coat.legF)), legHM = keep(fur(coat.legH));
    const pawM = keep(furMat(T.toTex(coat.paw), { bump: 0.8 })), baseM = keep(plain(coat.base));
    const root = this.root = new THREE.Group();
    this.size = B.size * (kit ? 0.62 : cat.age === 'senior' ? 0.98 : 1);
    root.scale.setScalar(this.size);
    const hip = this.hip = new THREE.Group(); hip.position.set(0, 0.68, -0.35); root.add(hip);
    const body = this.body = new THREE.Group(); body.position.set(0, 0, 0.35); hip.add(body);
    const slim = B.slim || 1, round = B.round || 1;
    // torso: a soft bean, rump a bit broader than the chest
    const tg = new THREE.SphereGeometry(1, 36, 22); tg.rotateX(Math.PI / 2);
    { const P = tg.attributes.position.array; for (let i = 0; i < P.length; i += 3) { const z = P[i + 2]; const k = 1 + (z < 0 ? -z * 0.1 : -z * 0.06); P[i] *= k; P[i + 1] *= k; if (P[i + 1] > 0.5 && z > 0.2) P[i + 1] -= (z - 0.2) * 0.12; } }
    if (fluff > 0) wobble(tg, 0.05 * fluff, 5, cat.seed % 50);
    tg.computeVertexNormals();
    this.torso = new THREE.Mesh(tg, bodyM); this.torsoBase = new THREE.Vector3(0.335 * slim * round, 0.33 * round, 0.6);
    body.add(this.torso);
    // fluffy ruff and bloomers
    if (fluff > 0.3) { const ruff = new THREE.Mesh(wobble(new THREE.SphereGeometry(1, 20, 14), 0.08, 4, cat.seed % 13), keep(plain(coat.muzzle === '#efe9de' ? '#efe9de' : mix(coat.base, '#efe9de', 0.25)))); ruff.scale.set(0.3, 0.3, 0.26); ruff.position.set(0, 0.02, 0.42); body.add(ruff); this.ruff = ruff; }
    // haunches
    this.haunches = [];
    for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), baseM); h.scale.set(0.14 * round, 0.22 * (1 + fluff * 0.15), 0.24 * (1 + fluff * 0.15)); h.position.set(s * 0.19 * slim * round, -0.04, -0.36); body.add(h); this.haunches.push(h); }
    // neck and head
    const neck = this.neck = new THREE.Group(); neck.position.set(0, 0.2, 0.52); body.add(neck);
    const head = this.head = new THREE.Group(); neck.add(head);
    const hs = kit ? 1.28 : 1;
    head.scale.setScalar(hs);
    const hg = new THREE.SphereGeometry(0.33, 32, 22);
    { const P = hg.attributes.position.array; for (let i = 0; i < P.length; i += 3) { if (P[i + 1] < 0) { P[i] *= 1 + (-P[i + 1]) * 0.6; } if (B.flat && P[i + 2] > 0.1) P[i + 2] = 0.1 + (P[i + 2] - 0.1) * 0.55; } }
    if (fluff > 0.5) wobble(hg, 0.02 * fluff, 8, 3);
    hg.computeVertexNormals();
    const hm = new THREE.Mesh(hg, headM); hm.scale.set(1.1 * slim, 0.94, 0.98); hm.position.set(0, 0.08, 0.1); head.add(hm); this.headMesh = hm;
    // ears
    this.ears = [];
    const es = B.ears * (kit ? 1.1 : 1);
    const earOut = keep(plain(coat.earOuter)), earIn = keep(furMat(null, { color: coat.earInner, bump: 0.6 }));
    for (const s of [-1, 1]) {
      const ep = new THREE.Group(); ep.position.set(s * 0.16 * slim, 0.3, 0.06); head.add(ep);
      const eg = new THREE.ConeGeometry(0.12 * es, 0.24 * es, 14); eg.scale(1, 1, 0.42); eg.translate(0, 0.1 * es, 0);
      const eo = new THREE.Mesh(eg, earOut); ep.add(eo);
      const ig = new THREE.ConeGeometry(0.085 * es, 0.18 * es, 12); ig.scale(1, 1, 0.3); ig.translate(0, 0.085 * es, 0.025);
      ep.add(new THREE.Mesh(ig, earIn));
      if (B.tufts) { const tf = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.12, 6), earOut); tf.position.set(0, 0.26 * es, 0); ep.add(tf); }
      ep.userData = { s, baseZ: -s * (0.32 + (es - 1) * 0.3), baseX: -0.08 };
      if (B.fold) { ep.scale.set(1, 0.6, 1); ep.userData.baseX = 0.9; }
      this.ears.push(ep);
    }
    // eyes: big round painted irises, black pupils, a lid that blinks
    this.eyes = [];
    const irisM = new THREE.MeshStandardMaterial({ map: eyeTex(cat.eye), roughness: 0.25, emissive: new THREE.Color(cat.eye), emissiveIntensity: 0.08 });
    const pupilM = new THREE.MeshStandardMaterial({ color: 0x120c0c, roughness: 0.15 });
    const glintM = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const lidM = keep(plain(coat.pattern === 'point' ? coat.base : coat.base));
    const lidC = coat.base; this.mats.push(irisM);
    const eyeR = 0.074 * (kit ? 1.12 : 1);
    for (const s of [-1, 1]) {
      const eg = new THREE.Group(); eg.position.set(s * 0.112 * slim, 0.12, B.flat ? 0.325 : 0.352); eg.rotation.y = s * 0.32; head.add(eg);
      const iris = new THREE.Mesh(new THREE.SphereGeometry(eyeR, 20, 14), irisM); iris.scale.set(1, 1, 0.55); eg.add(iris);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(eyeR * 0.92, 16, 10), pupilM); pupil.position.z = 0.018; pupil.scale.set(0.35, 0.85, 0.42); eg.add(pupil);
      const glint = new THREE.Mesh(new THREE.SphereGeometry(eyeR * 0.22, 8, 6), glintM); glint.position.set(-0.022, 0.026, eyeR * 0.6); eg.add(glint);
      const lid = new THREE.Mesh(new THREE.SphereGeometry(eyeR * 1.13, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2), keep(furMat(null, { color: coat.head ? sampleColor(coat.head, 0.25 + s * 0.04, 0.42) : lidC, bump: 0.6 })));
      lid.scale.set(1, 1, 0.66); eg.add(lid);
      this.eyes.push({ g: eg, pupil, lid, glint });
    }
    // muzzle, nose, mouth, tongue, whiskers
    const muzM = keep(furMat(null, { color: coat.muzzle, bump: 1.2 }));
    for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), muzM); m.scale.set(1, 0.78, 0.8); m.position.set(s * 0.048, -0.045, B.flat ? 0.3 : 0.335); head.add(m); }
    const chin = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), muzM); chin.position.set(0, -0.11, 0.29); chin.scale.set(1, 0.7, 0.9); head.add(chin);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 8), new THREE.MeshStandardMaterial({ color: coat.nose, roughness: 0.4 })); nose.scale.set(1.1, 0.72, 0.6); nose.position.set(0, 0.015, B.flat ? 0.37 : 0.405); head.add(nose);
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), new THREE.MeshStandardMaterial({ color: 0x3a1a1c, roughness: 0.6 })); mouth.position.set(0, -0.08, B.flat ? 0.33 : 0.37); mouth.scale.set(1, 0.01, 0.4); head.add(mouth); this.mouth = mouth;
    const tongue = new THREE.Mesh(new THREE.CapsuleGeometry(0.026, 0.05, 4, 8), new THREE.MeshStandardMaterial({ color: '#e07f8c', roughness: 0.4 })); tongue.position.set(0, -0.09, B.flat ? 0.34 : 0.38); tongue.scale.set(1, 0.2, 0.5); tongue.visible = false; head.add(tongue); this.tongue = tongue;
    const wv = [];
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const y = -0.03 - k * 0.022, z = B.flat ? 0.33 : 0.36; wv.push(s * 0.08, y, z, s * (0.36 + k * 0.02), y + 0.04 - k * 0.04, z - 0.04); }
    const wgeo = new THREE.BufferGeometry(); wgeo.setAttribute('position', new THREE.Float32BufferAttribute(wv, 3));
    head.add(new THREE.LineSegments(wgeo, new THREE.LineBasicMaterial({ color: coat.whisk, transparent: true, opacity: 0.85 })));
    // legs (a pivot each, a stretched cylinder, and a paw that isn't stretched)
    const legR = (kit ? 0.068 : 0.078) * (B.slim ? 0.92 : 1) * (fluff > 0.5 ? 1.12 : 1);
    const legGeo = new THREE.CylinderGeometry(legR, legR * 1.08, 1, 12); legGeo.translate(0, -0.5, 0);
    this.legs = {};
    const mkLeg = (key, x, y, z, m) => {
      const p = new THREE.Group(); p.position.set(x, y, z); body.add(p);
      const L = new THREE.Mesh(legGeo, m); p.add(L);
      const paw = new THREE.Mesh(new THREE.SphereGeometry(legR * 1.25, 14, 10), pawM); paw.scale.set(1, 0.62, 1.3); p.add(paw);
      this.legs[key] = { p, L, paw, len: 0.5 };
    };
    mkLeg('fl', -0.15 * slim, -0.1, 0.38, legFM); mkLeg('fr', 0.15 * slim, -0.1, 0.38, legFM);
    mkLeg('hl', -0.18 * slim, -0.06, -0.36, legHM); mkLeg('hr', 0.18 * slim, -0.06, -0.36, legHM);
    this.legScale = B.legs * (kit ? 0.88 : 1);
    // tail: eight segments, each a pivot
    this.tail = [];
    const segL = (kit ? 0.11 : 0.135) * (B.legs < 0.7 ? 0.9 : 1), tr = (fluff > 0 ? 0.075 + fluff * 0.05 : 0.06) * (kit ? 0.85 : 1);
    let parent = new THREE.Group(); parent.position.set(0, 0.12, -0.56); body.add(parent); this.tailBase = parent;
    const tailMats = {};
    for (let k = 0; k < 8; k++) {
      const col = coat.tail[k];
      const m = tailMats[col] || (tailMats[col] = keep(plain(col)));
      const r0 = tr * (1 - k * 0.055);
      const seg = new THREE.Group(); if (k > 0) seg.position.y = segL; parent.add(seg);
      const g = new THREE.CapsuleGeometry(r0, segL * 0.9, 4, 10); g.translate(0, segL / 2, 0);
      const mesh = new THREE.Mesh(g, m); seg.add(mesh);
      this.tail.push(seg); parent = seg;
    }
    root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    // a soft contact shadow that follows the cat
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.9), new THREE.MeshBasicMaterial({ map: T.blob({ a: 0.5 }), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.015; sh.castShadow = false; sh.receiveShadow = false; sh.renderOrder = 1;
    sh.raycast = () => {}; this.shadow = sh; root.add(sh);
    // state
    this.P = { ...POSES.stand }; this.target = POSES.stand; this.over = {};
    this.phase = 0; this.t = Math.random() * 10; this.blinkT = 2; this.blink = 0;
    this.lookYaw = 0; this.lookPitch = 0;
    this.squash = 0;
    this.weightNow = cat.weight;
  }
  setPose(name, over = {}) { this.target = POSES[name] || POSES.stand; this.poseName = name; this.over = over; }
  // s: { speed, look (Vector3 world or null), cycle, jumpLift, airPitch }
  update(dt, s = {}) {
    this.t += dt;
    const t = this.t, P = this.P, tg = this.target, ov = this.over;
    const k = s.snap ? 1 : 1 - Math.exp(-(s.blendRate || 9) * dt);
    for (const key of KEYS) { const want = ov[key] ?? tg[key]; P[key] += (want - P[key]) * k; }
    // live body shape from weight: chonk grows sideways and sags a little
    this.weightNow = damp(this.weightNow, this.cat.weight, 2, dt);
    const ch = clamp((this.weightNow - 42) / 40, -0.25, 1.1);
    const tb = this.torsoBase, puff = P.puff, breathe = 1 + Math.sin(t * (this.poseName === 'sleep' ? 1.6 : 2.6)) * 0.018;
    this.torso.scale.set(tb.x * (1 + ch * 0.55) * puff, tb.y * (1 + ch * 0.3) * puff * breathe * P.tall, tb.z * (1 + ch * 0.12) * puff);
    this.torso.position.y = -ch * 0.05;
    for (const h of this.haunches) h.position.x = Math.sign(h.position.x) * (0.19 * (this.B.slim || 1) + ch * 0.12);
    // cycles on top of the pose
    let fl = P.fl, fr = P.fr, hl = P.hl, hr = P.hr, hipY = P.hipY, pitch = P.pitch, roll = P.roll, headPitch = P.headPitch, headYaw = P.headYaw, sway = 0;
    let fLen = P.fLen, frLen = P.frLen, hLen = P.hLen;
    const speed = s.speed || 0;
    if (speed > 0.05) {
      const run = speed > 2.6;
      this.phase += dt * speed * (run ? 2.6 : 3.4) / this.size;
      const ph = this.phase;
      if (!run) { const a = 0.48; fl += Math.sin(ph) * a; hr += Math.sin(ph) * a; fr += Math.sin(ph + Math.PI) * a; hl += Math.sin(ph + Math.PI) * a; hipY += Math.abs(Math.sin(ph)) * 0.03; headPitch += Math.sin(ph * 2) * 0.03; sway = Math.sin(ph) * 0.03; }
      else { const a = 0.85; fl += Math.sin(ph) * a; fr += Math.sin(ph + 0.3) * a; hl += Math.sin(ph + 2.4) * a; hr += Math.sin(ph + 2.7) * a; pitch += Math.sin(ph + 1.2) * 0.13; hipY += Math.sin(ph + 2) * 0.07 + 0.03; }
    }
    const cyc = s.cycle;
    if (cyc === 'knead') { const a = Math.sin(t * 6.5); fl = -0.35 + a * 0.32; fr = -0.35 - a * 0.32; }
    if (cyc === 'scratch') { const a = Math.sin(t * 10); fl += a * 0.28; fr -= a * 0.28; fLen = 0.56 + a * 0.08; frLen = 0.56 - a * 0.08; }
    if (cyc === 'scratchLow') { const a = Math.sin(t * 10); fl += a * 0.3; fr -= a * 0.3; }
    if (cyc === 'swat') { fr = -1.2 + Math.max(0, Math.sin(t * 6)) * -0.3; frLen = 0.5 + Math.max(0, Math.sin(t * 6)) * 0.12; }
    if (cyc === 'groom') { headPitch += Math.sin(t * 9) * 0.12; fl += Math.sin(t * 9) * 0.1; }
    if (cyc === 'eat') headPitch += Math.sin(t * 8) * 0.07;
    if (cyc === 'wiggle') { sway = Math.sin(t * 20) * 0.06; roll += Math.sin(t * 20) * 0.04; }
    if (cyc === 'bat') { fr = -0.4 - Math.max(0, Math.sin(t * 9)) * 1.0; }
    if (cyc === 'climb') { const a = Math.sin(t * 8); fl += a * 0.3; fr -= a * 0.3; hl -= a * 0.2; hr += a * 0.2; }
    if (cyc === 'pet') headPitch += Math.sin(t * 2) * 0.05;
    if (s.airPitch != null) pitch += s.airPitch;
    // squash on landing
    this.squash = damp(this.squash, 0, 10, dt);
    hipY -= this.squash * 0.12;
    // apply: hips, body
    const ls = this.legScale;
    const hipYs = hipY > 0.33 ? 0.33 + (hipY - 0.33) * ls : hipY;
    this.hip.position.set(sway, Math.max(0.12, hipYs) + (s.lift || 0), -0.35);
    this.hip.rotation.set(-pitch, 0, roll);
    // head: hold it level against the body's pitch, then look around
    const lookW = s.lookWeight ?? 1;
    if (s.look) {
      TMP.copy(s.look); this.root.worldToLocal(TMP);
      const hx = 0, hy = hipYs + 0.3 + Math.sin(pitch) * 0.9, hz = -0.35 + Math.cos(pitch) * 0.9;
      const dx = TMP.x - hx, dy = TMP.y - hy, dz = TMP.z - hz;
      let yaw = Math.atan2(dx, dz), pit = -Math.atan2(dy, Math.hypot(dx, dz));
      yaw = clamp(yaw, -1.1, 1.1); pit = clamp(pit, -0.7, 0.6);
      this.lookYaw = damp(this.lookYaw, yaw * lookW, 6, dt); this.lookPitch = damp(this.lookPitch, pit * lookW, 6, dt);
    } else { this.lookYaw = damp(this.lookYaw, 0, 4, dt); this.lookPitch = damp(this.lookPitch, 0, 4, dt); }
    this.neck.rotation.set(headPitch + pitch + this.lookPitch * 0.8, (headYaw + this.lookYaw) * (Math.abs(roll) > 1.5 ? -1 : 1), P.headRoll, 'YXZ');
    this.neck.position.y = 0.2 - (this.poseName === 'sleep' || this.poseName === 'loaf' ? 0.05 : 0);
    // legs: swing, and plant on the floor when asked to
    const setLeg = (key, swing, len, plant) => {
      const L = this.legs[key];
      const lp = L.p.position;
      const ly = lp.y, lz = lp.z + 0.35; // relative to the hip pivot
      const shoulderY = Math.max(0.12, hipYs) + ly * Math.cos(pitch) + lz * Math.sin(pitch);
      let length;
      if (len > 0) length = len * (0.6 + 0.4 * ls);
      else length = clamp((shoulderY - 0.05) / Math.max(0.35, Math.cos(swing)), 0.12, 1.25);
      if (Math.abs(roll) > 0.8 && len < 0) length = 0.4;
      L.len = damp(L.len, length, 14, dt);
      L.L.scale.set(1, L.len, 1); L.paw.position.set(0, -L.len, 0.02);
      L.p.rotation.set(swing + pitch, 0, 0);
    };
    setLeg('fl', fl, fLen, true); setLeg('fr', fr, frLen >= 0 ? frLen : fLen, true); setLeg('hl', hl, hLen, true); setLeg('hr', hr, hLen, true);
    // tail
    const up = P.tailUp, n = this.tail.length;
    this.tail[0].parent.rotation.set(-Math.PI / 2 + up + pitch * 0.6, 0, 0);
    const waveSpeed = P.tailSpeed * (s.annoyed ? 3 : 1), wave = P.tailWave * (s.annoyed ? 2.5 : 1);
    for (let i = 0; i < n; i++) {
      const seg = this.tail[i], f = i / (n - 1);
      seg.rotation.set(P.tailCurl * (0.3 + f * 1.6), 0, P.tailSide + Math.sin(t * waveSpeed - i * 0.55) * wave * (0.3 + f), 'XZY');
      const fp = 1 + (P.puff - 1) * 2.2; seg.scale.set(fp, 1, fp);
    }
    // ears
    for (const e of this.ears) { const u = e.userData; e.rotation.set(u.baseX - P.ears * 0.6, 0, u.baseZ - u.s * P.ears * 0.75 + Math.sin(t * 0.7 + u.s) * 0.02 * (s.twitch ? 6 : 1), 'XYZ'); }
    // eyes: blink, squint, pupils
    this.blinkT -= dt;
    if (this.blinkT < 0) { this.blink = 1; this.blinkT = 2 + Math.random() * 5; }
    this.blink = Math.max(0, this.blink - dt * 7);
    const slow = s.slowBlink || 0;
    const closed = clamp(1 - P.eyes + (this.blink > 0 ? 1 : 0) + slow, 0, 1);
    const night = s.night || 0;
    const pupil = clamp(P.pupil + night * 0.4, 0.2, 1);
    for (const e of this.eyes) {
      e.lid.rotation.x = lerp(-Math.PI * 0.55, Math.PI * 0.5, closed);
      e.pupil.scale.set(0.28 + pupil * 0.6, 0.86, 0.42);
      e.pupil.position.x = this.lookYaw * 0.012; e.pupil.position.y = -this.lookPitch * 0.01;
      e.glint.visible = closed < 0.7;
    }
    // mouth and tongue
    const mo = clamp(P.mouth + (s.meow || 0), 0, 1.2);
    this.mouth.scale.set(1, 0.01 + mo * 0.9, 0.45);
    const tongueOut = clamp(P.tongue + (s.tongue || 0), 0, 1);
    this.tongue.visible = tongueOut > 0.05;
    this.tongue.scale.set(1, 0.2 + tongueOut * 0.6, 0.5); this.tongue.position.y = -0.09 - tongueOut * 0.03; this.tongue.position.z = (this.B.flat ? 0.34 : 0.38) + tongueOut * 0.015;
    // contact shadow sits on whatever is under the cat
    this.shadow.position.set(0, -((s.lift || 0)) / 1 + 0.015, 0);
    this.shadow.material.opacity = Math.abs(roll) > 1 ? 0.7 : 1;
    this.shadow.scale.set(1 + ch * 0.4, 1, 1);
  }
  dispose() { this.root.traverse(o => { if (o.isMesh) { o.geometry.dispose(); } }); for (const m of this.mats) { if (m.map) m.map.dispose(); m.dispose(); } }
}
function sampleColor(canvas, u, v) { const x = canvas.getContext('2d'); const d = x.getImageData(Math.floor(u * canvas.width), Math.floor(v * canvas.height), 1, 1).data; return rgb2hex(d[0], d[1], d[2]); }

// ------------------------------------------------------------ portraits
let PSCENE = null;
export function portrait(renderer, cat, size = 192, pose = 'sit') {
  if (!PSCENE) {
    const sc = new THREE.Scene();
    const key = new THREE.DirectionalLight('#fff0d8', 2.6); key.position.set(-2, 3, 4); sc.add(key);
    const rim = new THREE.DirectionalLight('#b8d0ff', 1.2); rim.position.set(3, 2, -3); sc.add(rim);
    sc.add(new THREE.HemisphereLight('#f4ead8', '#8a6a4a', 1.2));
    const cam = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
    const rt = new THREE.WebGLRenderTarget(size, size, { samples: 4 });
    rt.texture.colorSpace = THREE.SRGBColorSpace;
    PSCENE = { sc, cam, rt, buf: new Uint8Array(size * size * 4), size };
  }
  const { sc, cam, rt, buf } = PSCENE;
  const rig = new CatRig(cat);
  rig.shadow.visible = false;
  rig.setPose(pose); rig.update(0, { snap: true }); rig.update(0.016, { snap: true });
  rig.root.rotation.y = 0.55;
  sc.add(rig.root);
  rig.root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(rig.root);
  const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
  const h = Math.max(sz.y, sz.x * 0.8) * 1.15;
  cam.position.set(c.x + 0.4 * h, c.y + 0.15 * h, c.z + h / (2 * Math.tan(13 * Math.PI / 180)));
  cam.lookAt(c.x, c.y + 0.02 * h, c.z);
  const prevT = renderer.getRenderTarget(), prevC = renderer.getClearColor(new THREE.Color()), prevA = renderer.getClearAlpha();
  renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear();
  const tm = renderer.toneMapping; renderer.toneMapping = THREE.NoToneMapping;
  renderer.render(sc, cam);
  renderer.toneMapping = tm;
  renderer.readRenderTargetPixels(rt, 0, 0, PSCENE.size, PSCENE.size, buf);
  renderer.setRenderTarget(prevT); renderer.setClearColor(prevC, prevA);
  sc.remove(rig.root); rig.dispose();
  const cv = T.canvas(PSCENE.size), x = cv.getContext('2d'), img = x.createImageData(PSCENE.size, PSCENE.size);
  const S = PSCENE.size;
  for (let j = 0; j < S; j++) img.data.set(buf.subarray((S - 1 - j) * S * 4, (S - j) * S * 4), j * S * 4);
  x.putImageData(img, 0, 0);
  return cv.toDataURL('image/png');
}
