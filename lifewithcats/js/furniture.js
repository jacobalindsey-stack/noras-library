// Life with Cats — the furniture of the house. Every builder returns a Group
// standing on the floor at its own origin, facing +z, with notes in userData:
//   foot      [w, d] floor footprint (for the cats' map of the room)
//   perches   places a cat can jump up to   {x, y, z, kind, cap}
//   scratch   places a cat can sink its claws into {x, y, z, nx, nz}
//   knock     things that can be pushed off the edge
//   chew      leaves a cat can nibble
import * as THREE from '../lib/three.module.min.js';
import * as T from './tex.js';
import { rbox, puff, wobble, cyl, lathe, sphere, mat, feltMat, mesh, add, group, shadowBlob, boxUV } from './geo.js';
import { rng, mix, shade, hashStr } from './util.js';

export const PAL = {
  cream: '#ece0c4', oat: '#d8c6a0', putty: '#b9a98c', sage: '#8d9c6e', moss: '#66744a', olive: '#7d7a45',
  ochre: '#c99a3e', mustard: '#d4a737', terracotta: '#b8613f', rust: '#9a4a2c', brick: '#a0563c',
  dusty: '#7f98a5', teal: '#4f7a7a', slate: '#5b676d', plum: '#6d4c5e', rose: '#d39b8c', blush: '#e6b7a6',
  umber: '#5c4230', walnut: '#6b4a32', oak: '#a77c4f', pine: '#c49a64', charcoal: '#3a3431', ink: '#2e2622',
  linen: '#e8dcc2', paper: '#f1e7d0',
};
export const M = {
  wood: (c = PAL.oak, seed = 4, sc = 1.8) => mat({ tex: T.grain(c, seed), scale: sc, rough: 0.68, bumpScale: 0.6 }),
  paint: (c, seed = 5) => mat({ tex: T.grain(PAL.oak, seed, { paint: c }), scale: 1.8, rough: 0.72, bumpScale: 0.5 }),
  fab: (c, o = {}) => mat({ tex: T.weave(c, o.seed || 5, o), scale: o.scale || 1.3, rough: 0.97, bumpScale: o.bump ?? 1.2 }),
  knit: (c, o = {}) => mat({ tex: T.knit(c, o.seed || 6, o), scale: o.scale || 1.1, rough: 0.98, bumpScale: 2.2 }),
  cer: (c, o = {}) => mat({ tex: T.ceramic(c, o.seed || 11, o), scale: o.scale || 1, rough: 0.35, bumpScale: 0.3 }),
  enamel: c => mat({ tex: T.enamel(c), scale: 2, rough: 0.32, bumpScale: 0.2 }),
  brass: () => mat({ tex: T.brass(), scale: 1, rough: 0.32, metal: 0.85, bumpScale: 0 }),
  metal: (c = '#9a9a92') => mat({ color: c, rough: 0.3, metal: 0.8 }),
  felt: (c, o) => feltMat(c, o),
  plain: (c, rough = 0.85) => mat({ color: c, rough }),
  glass: () => mat({ key: 'glass', color: '#e4f0ea', rough: 0.05, transparent: true, opacity: 0.32, depthWrite: false }),
  water: () => mat({ key: 'water', color: '#8fb8c4', rough: 0.05, transparent: true, opacity: 0.55, depthWrite: false }),
  glow: (c, i = 1.6) => mat({ key: 'glow' + c + i, color: c, emissive: c, emissiveIntensity: i, rough: 0.9 }),
  card: (print) => mat({ tex: T.cardboard(13, { print }), scale: 2.2, rough: 0.95, bumpScale: 0.8 }),
};

function legs(g, w, d, h, m, o = {}) {
  const r0 = o.r ?? 0.09, inset = o.inset ?? 0.25;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const L = add(g, cyl(r0 * 0.75, r0, h, 12), m, { pos: [sx * (w / 2 - inset), h / 2, sz * (d / 2 - inset)] });
    if (o.splay) L.rotation.set(sz * 0.08, 0, -sx * 0.08);
  }
}
function info(g, o) { g.userData = { foot: o.foot, perches: o.perches || [], scratch: o.scratch || [], knock: o.knock || [], chew: o.chew || [], ...o.extra }; return g; }

// ----------------------------------------------------------------- seating
export function sofa(o = {}) {
  const w = o.w || 6.4, d = o.d || 2.8, g = group(), seed = o.seed || 1;
  const cloth = M.fab(o.color || PAL.sage, { pattern: o.pattern || 'plain', b: o.b, c: o.c, scale: 1.6, seed });
  const legM = M.wood(PAL.walnut, 7);
  const legH = 0.32;
  legs(g, w - 0.2, d - 0.3, legH, legM, { r: 0.1, inset: 0.3 });
  add(g, wobble(rbox(w - 0.2, 0.85, d - 0.25, 0.14), 0.02), cloth, { pos: [0, legH + 0.42, 0.05] });
  // back
  const back = add(g, wobble(rbox(w - 0.3, 1.7, 0.65, 0.22), 0.025, 1.2, seed), cloth, { pos: [0, legH + 1.55, -d / 2 + 0.38] });
  back.rotation.x = -0.06;
  // arms
  const armW = 0.6;
  for (const s of [-1, 1]) add(g, wobble(rbox(armW, 1.65, d, 0.27), 0.025, 1.4, seed + s), cloth, { pos: [s * (w / 2 - armW / 2), legH + 0.82, 0] });
  // seat cushions
  const n = w > 4 ? 2 : 1, cw = (w - armW * 2 - 0.06) / n;
  for (let i = 0; i < n; i++) {
    const cg = puff(rbox(cw - 0.05, 0.5, d - 0.78, 0.16, 4), 0.5, 0.12, 0.03);
    add(g, wobble(cg, 0.02, 2, i), cloth, { pos: [-w / 2 + armW + 0.03 + cw * (i + 0.5), legH + 1.1, 0.27] });
    const bc = puff(rbox(cw - 0.12, 1.25, 0.48, 0.2, 4), 1.25, 0.04, 0.06);
    const b = add(g, wobble(bc, 0.03, 1.6, i + 4), cloth, { pos: [-w / 2 + armW + 0.03 + cw * (i + 0.5), legH + 1.8, -d / 2 + 0.85] });
    b.rotation.x = -0.18;
  }
  // throw pillows and a knitted throw over one arm
  const pill = M.fab(o.pillow || PAL.mustard, { pattern: 'floral', b: PAL.rust, c: PAL.cream, scale: 1.2, seed: seed + 3 });
  const pill2 = M.fab(o.pillow2 || PAL.rose, { pattern: 'check', b: PAL.plum, c: PAL.cream, scale: 0.9, seed: seed + 4 });
  for (const [s, m] of [[-1, pill], [1, pill2]]) {
    const pg = puff(rbox(1.05, 1.05, 0.34, 0.16, 4), 1, 0.0, 0.12);
    const p = add(g, wobble(pg, 0.03, 2, s + 9), m, { pos: [s * (w / 2 - armW - 0.6), legH + 1.85, -d / 2 + 1.05] });
    p.rotation.set(-0.3, s * 0.35, s * 0.18);
  }
  if (o.throw !== false) {
    const kn = M.knit(o.throwColor || PAL.cream, { b: PAL.terracotta });
    const t1 = add(g, wobble(rbox(armW + 0.2, 0.1, d * 0.8, 0.05), 0.04, 2), kn, { pos: [w / 2 - armW / 2, legH + 1.68, 0.1] });
    const t2 = add(g, wobble(rbox(0.1, 1.2, d * 0.8, 0.05), 0.04, 2), kn, { pos: [w / 2 + 0.06, legH + 1.1, 0.1] }); t2.rotation.z = -0.05;
  }
  shadowBlob(g, w + 0.8, d + 0.8, { a: 0.55 });
  const seatY = legH + 1.42;
  return info(g, {
    foot: [w, d],
    perches: [
      { x: -w / 4, y: seatY, z: 0.3, kind: 'seat', cap: 1, nap: 1 }, { x: w / 4, y: seatY, z: 0.3, kind: 'seat', cap: 1, nap: 1 },
      { x: 0, y: legH + 2.45, z: -d / 2 + 0.35, kind: 'top', cap: 1, nap: 1 },
      { x: w / 2 - armW / 2, y: legH + 1.68, z: 0.2, kind: 'arm', cap: 1 },
    ],
    scratch: [
      { x: -w / 2 + armW / 2, y: 1.0, z: d / 2 + 0.02, nx: 0, nz: 1 }, { x: w / 2 - armW / 2, y: 1.0, z: d / 2 + 0.02, nx: 0, nz: 1 },
      { x: -w / 2 - 0.02, y: 1.0, z: 0.2, nx: -1, nz: 0 },
    ],
    extra: { wearable: true, cloth },
  });
}
export function armchair(o = {}) { const g = sofa({ ...o, w: o.w || 3.0, d: o.d || 2.7, throw: false, pillow: o.pillow || PAL.ochre }); g.userData.perches = g.userData.perches.filter(p => p.kind !== 'arm').slice(0, 2); g.userData.perches[0].x = 0; return g; }

// ---------------------------------------------------------------- tables
export function coffeeTable(o = {}) {
  const w = o.w || 3.4, d = o.d || 1.9, h = 1.25, g = group();
  const wd = M.wood(o.wood || PAL.walnut, 8);
  add(g, wobble(rbox(w, 0.18, d, 0.07), 0.012), wd, { pos: [0, h - 0.09, 0] });
  legs(g, w, d, h - 0.18, wd, { r: 0.1, inset: 0.22, splay: true });
  add(g, rbox(w - 0.5, 0.08, d - 0.4, 0.03), wd, { pos: [0, 0.35, 0] });
  // magazines on the lower shelf and a little stack of books on top
  const cols = [PAL.terracotta, PAL.dusty, PAL.mustard, PAL.cream];
  for (let i = 0; i < 3; i++) add(g, rbox(1.0, 0.05, 0.75, 0.01), M.plain(cols[i], 0.7), { pos: [-0.6 + i * 0.12, 0.42 + i * 0.05, 0.05 * i], rot: [0, i * 0.3, 0] });
  for (let i = 0; i < 2; i++) add(g, rbox(0.9 - i * 0.1, 0.16, 0.65, 0.02), M.fab([PAL.teal, PAL.rust][i], { scale: 0.6 }), { pos: [-w / 2 + 0.75, h + 0.08 + i * 0.16, -0.2], rot: [0, i * 0.25, 0] });
  // mug at the edge
  const mug = mugMesh(o.mugColor || PAL.mustard);
  mug.position.set(w / 2 - 0.35, h, d / 2 - 0.35); g.add(mug);
  shadowBlob(g, w + 0.6, d + 0.6, { a: 0.35 });
  return info(g, {
    foot: [w, d],
    perches: [{ x: -0.1, y: h, z: 0, kind: 'table', cap: 1 }],
    knock: [{ obj: mug, kind: 'mug' }],
  });
}
export function mugMesh(col) {
  const g = group();
  add(g, lathe([[0, 0], [0.14, 0], [0.155, 0.02], [0.16, 0.3], [0.145, 0.3], [0.135, 0.04], [0, 0.04]], 20), M.cer(col, { band: shade(col, -0.3) }), { pos: [0, 0, 0] });
  add(g, new THREE.TorusGeometry(0.08, 0.022, 8, 16, Math.PI), M.cer(col), { pos: [0.16, 0.15, 0], rot: [0, 0, -Math.PI / 2] });
  add(g, cyl(0.13, 0.13, 0.01, 16), M.plain('#5a3a22', 0.2), { pos: [0, 0.25, 0] });
  return g;
}
export function glassMesh() {
  const g = group();
  add(g, lathe([[0, 0], [0.12, 0], [0.14, 0.42], [0.13, 0.42], [0.11, 0.02], [0, 0.02]], 18), M.glass(), { cast: false });
  add(g, cyl(0.115, 0.11, 0.28, 16), M.water(), { pos: [0, 0.16, 0], cast: false });
  return g;
}
export function sideTable(o = {}) {
  const g = group(), h = o.h || 2.1, r = 0.75;
  const wd = M.wood(o.wood || PAL.oak, 9);
  add(g, wobble(cyl(r, r, 0.14, 28), 0.01), wd, { pos: [0, h - 0.07, 0] });
  add(g, cyl(0.1, 0.14, h - 0.14, 12), wd, { pos: [0, (h - 0.14) / 2, 0] });
  add(g, cyl(0.5, 0.55, 0.1, 20), wd, { pos: [0, 0.05, 0] });
  let light = null;
  if (o.lamp !== false) { const L = tableLamp(o.lampColor || PAL.teal); L.position.set(-0.2, h, -0.2); g.add(L); light = L.userData.light; }
  const gl = glassMesh(); gl.position.set(0.42, h, 0.3); g.add(gl);
  shadowBlob(g, 1.9, 1.9, { a: 0.4 });
  return info(g, { foot: [1.5, 1.5], perches: [{ x: 0.35, y: h, z: 0.25, kind: 'table', cap: 1 }], knock: [{ obj: gl, kind: 'glass' }], extra: { light } });
}
export function tableLamp(col) {
  const g = group();
  add(g, lathe([[0, 0], [0.22, 0], [0.26, 0.15], [0.3, 0.45], [0.2, 0.75], [0.07, 0.85], [0.05, 1.0], [0, 1.0]], 24), M.cer(col), { pos: [0, 0, 0] });
  const shade = add(g, cyl(0.32, 0.5, 0.6, 24, true), M.fab(PAL.linen, { scale: 0.5 }), { pos: [0, 1.25, 0], cast: false });
  shade.material = shade.material.clone(); shade.material.side = THREE.DoubleSide; shade.material.emissive = new THREE.Color('#ffcf8a'); shade.material.emissiveIntensity = 0;
  const bulb = add(g, sphere(0.09, 10, 8), M.glow('#ffe2a8', 0), { pos: [0, 1.15, 0], cast: false });
  bulb.material = bulb.material.clone();
  const light = new THREE.PointLight('#ffc27a', 0, 9, 1.6); light.position.set(0, 1.15, 0); g.add(light);
  g.userData = { light, shade: shade.material, bulb: bulb.material };
  return g;
}
export function floorLamp(o = {}) {
  const g = group();
  const br = M.brass();
  add(g, cyl(0.45, 0.5, 0.08, 24), br, { pos: [0, 0.04, 0] });
  add(g, cyl(0.04, 0.04, 4.6, 10), br, { pos: [0, 2.3, 0] });
  const sh = add(g, cyl(0.45, 0.8, 0.85, 26, true), M.fab(o.color || PAL.cream, { pattern: 'stripe', b: PAL.ochre, scale: 0.8 }), { pos: [0, 4.75, 0], cast: false });
  sh.material = sh.material.clone(); sh.material.side = THREE.DoubleSide; sh.material.emissive = new THREE.Color('#ffcf8a'); sh.material.emissiveIntensity = 0;
  const bulb = add(g, sphere(0.1, 10, 8), M.glow('#ffe2a8', 0), { pos: [0, 4.6, 0], cast: false }); bulb.material = bulb.material.clone();
  const light = new THREE.PointLight('#ffc27a', 0, 13, 1.5); light.position.set(0, 4.5, 0); g.add(light);
  shadowBlob(g, 1.3, 1.3, { a: 0.45 });
  return info(g, { foot: [1, 1], extra: { light, shade: sh.material, bulb: bulb.material } });
}

// ------------------------------------------------------------- bookshelf
export function bookshelf(o = {}) {
  const w = o.w || 2.8, d = 1.0, h = o.h || 6.2, g = group(), r = rng(o.seed || 3);
  const wd = o.paint ? M.paint(o.paint, 21) : M.wood(PAL.walnut, 10);
  for (const s of [-1, 1]) add(g, rbox(0.14, h, d, 0.04), wd, { pos: [s * (w / 2 - 0.07), h / 2, 0] });
  add(g, rbox(w, 0.16, d + 0.08, 0.04), wd, { pos: [0, h - 0.08, 0.02] });
  add(g, rbox(w - 0.2, h - 0.2, 0.06, 0.02), M.paint(PAL.sage, 22), { pos: [0, h / 2, -d / 2 + 0.05] });
  const shelves = 5, gap = (h - 0.4) / shelves;
  const spineTex = T.spine('#ffffff');
  const spineM = mat({ tex: spineTex, scale: [1, 1], rough: 0.8, bumpScale: 0.4, key: 'spines' });
  spineM.map.repeat.set(1, 1); spineM.bumpMap.repeat.set(1, 1);
  const bookGeo = new THREE.BoxGeometry(1, 1, 1);
  const count = 120, inst = new THREE.InstancedMesh(bookGeo, spineM, count);
  inst.castShadow = true; inst.receiveShadow = true;
  const cols = [PAL.terracotta, PAL.teal, PAL.mustard, PAL.plum, PAL.moss, PAL.rust, PAL.dusty, PAL.cream, PAL.ochre, PAL.slate, PAL.rose];
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color();
  let k = 0; const knock = [];
  for (let s = 0; s < shelves; s++) {
    const y0 = 0.2 + s * gap;
    add(g, rbox(w - 0.2, 0.1, d - 0.08, 0.02), wd, { pos: [0, y0, 0] });
    let x = -w / 2 + 0.2; const decorAt = r() < 0.6 ? 0.3 + r() * 0.5 : 2;
    while (x < w / 2 - 0.25 && k < count) {
      if (Math.abs((x + w / 2) / w - decorAt) < 0.05 && s < shelves - 1) {
        const v = r() < 0.5 ? vase(pickc(r, [PAL.teal, PAL.rose, PAL.cream, PAL.mustard])) : smallPlant(r);
        v.position.set(x + 0.25, y0 + 0.05, 0.05); g.add(v); if (v.userData.knockable) knock.push({ obj: v, kind: 'vase' });
        x += 0.55; continue;
      }
      const bw = 0.1 + r() * 0.12, bh = gap * (0.55 + r() * 0.35), bd = d * (0.6 + r() * 0.25);
      const lean = r() < 0.08 ? 0.25 : 0;
      e.set(0, 0, lean); q.setFromEuler(e);
      mtx.compose(new THREE.Vector3(x + bw / 2 + (lean ? 0.1 : 0), y0 + 0.05 + bh / 2 - (lean ? 0.03 : 0), 0.05), q, new THREE.Vector3(bw, bh, bd));
      inst.setMatrixAt(k, mtx); inst.setColorAt(k, col.set(pickc(r, cols)).convertSRGBToLinear().multiplyScalar(1.0));
      k++; x += bw + 0.01 + (lean ? 0.18 : 0);
      if (r() < 0.04) x += 0.25;
    }
  }
  inst.count = k; inst.instanceMatrix.needsUpdate = true; if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  g.add(inst);
  // top decor: a little framed picture leaning
  const fr = frame({ w: 0.9, h: 0.7, art: 'shapes' }); fr.position.set(-0.5, h + 0.02, -0.15); fr.rotation.x = -0.12; g.add(fr);
  shadowBlob(g, w + 0.5, d + 0.8, { a: 0.4 });
  return info(g, { foot: [w, d], perches: [{ x: 0.6, y: h, z: 0.1, kind: 'high', cap: 1 }], knock });
}
function pickc(r, a) { return a[Math.floor(r() * a.length)]; }
export function vase(col, o = {}) {
  const g = group();
  add(g, lathe([[0, 0], [0.16, 0], [0.24, 0.18], [0.2, 0.42], [0.1, 0.55], [0.12, 0.62], [0.1, 0.62], [0, 0.55]], 22), M.cer(col, { band: shade(col, 0.3) }));
  if (o.flowers !== false) {
    const stem = M.plain('#5d6b3e', 0.9);
    const r = rng(hashStr(col));
    for (let i = 0; i < 5; i++) {
      const a = i * 1.26, L = 0.5 + r() * 0.35;
      const s = add(g, cyl(0.012, 0.012, L, 5), stem, { pos: [Math.cos(a) * 0.06, 0.6 + L / 2, Math.sin(a) * 0.06], rot: [Math.sin(a) * 0.25, 0, Math.cos(a) * 0.25], cast: false });
      const fl = add(g, sphere(0.07, 10, 8), M.felt(pickc(r, [PAL.mustard, PAL.rose, PAL.cream, PAL.terracotta])), { pos: [Math.cos(a) * (0.06 + L * 0.25), 0.6 + L * 0.97, Math.sin(a) * (0.06 + L * 0.25)] });
      fl.scale.set(1, 0.7, 1);
    }
  }
  g.userData = { knockable: true };
  return g;
}
export function smallPlant(r = Math.random) {
  const g = group();
  add(g, lathe([[0, 0], [0.18, 0], [0.22, 0.32], [0.24, 0.34], [0, 0.34]], 18), M.cer(PAL.terracotta, { seed: 3 }));
  const lm = mat({ tex: T.leaf('#6f8a4a', 'long', 3), alphaTest: 0.5, side: THREE.DoubleSide, rough: 0.7, bumpScale: 0.3, clampTex: true });
  for (let i = 0; i < 7; i++) {
    const L = add(g, new THREE.PlaneGeometry(0.16, 0.5), lm, { pos: [0, 0.55, 0], cast: true });
    L.rotation.set(-0.3 - r() * 0.4, i * 0.9, 0); L.translateY(0.1);
  }
  g.userData = { knockable: true };
  return g;
}

// ---------------------------------------------------------------- plants
export function bigPlant(o = {}) {
  const g = group(), r = rng(o.seed || 5), kind = o.kind || 'fig';
  const pot = M.cer(o.pot || PAL.terracotta, { band: shade(o.pot || PAL.terracotta, -0.2), seed: 7 });
  add(g, wobble(lathe([[0, 0], [0.42, 0], [0.52, 0.85], [0.58, 0.9], [0.58, 1.0], [0.5, 1.0], [0, 0.95]], 26), 0.015), pot);
  add(g, cyl(0.49, 0.49, 0.04, 20), M.plain('#3d2a1d', 1), { pos: [0, 0.95, 0] });
  const leaves = [];
  const lm = mat({ tex: T.leaf(o.leaf || '#5f7d44', kind === 'snake' ? 'long' : kind === 'monstera' ? 'monstera' : 'round', o.seed || 5), alphaTest: 0.5, side: THREE.DoubleSide, rough: 0.6, bumpScale: 0.4, clampTex: true });
  if (kind === 'snake') {
    for (let i = 0; i < 9; i++) { const L = add(g, new THREE.PlaneGeometry(0.28, 2.2 + r() * 0.8), lm, { pos: [Math.cos(i * 2.4) * 0.18, 2.0, Math.sin(i * 2.4) * 0.18], rot: [(r() - 0.5) * 0.3, i * 0.7, (r() - 0.5) * 0.3] }); leaves.push(L); }
  } else {
    const trunkH = kind === 'fig' ? 3.6 : 1.6;
    add(g, cyl(0.05, 0.08, trunkH, 8), M.wood('#6b5238', 2), { pos: [0, 1 + trunkH / 2, 0] });
    const n = kind === 'fig' ? 22 : 9;
    for (let i = 0; i < n; i++) {
      const t = i / n, a = i * 2.39996, yy = 1.6 + t * (trunkH + 0.2), out = kind === 'fig' ? 0.25 + (1 - t) * 0.5 : 0.6 + r() * 0.4;
      const sz = kind === 'fig' ? 0.75 + r() * 0.3 : 1.2 + r() * 0.4;
      const L = add(g, new THREE.PlaneGeometry(sz * 0.8, sz), lm, { pos: [Math.cos(a) * out, yy, Math.sin(a) * out] });
      L.rotation.set(-0.9 + r() * 0.5, -a + Math.PI / 2, (r() - 0.5) * 0.5, 'YXZ');
      leaves.push(L);
    }
  }
  shadowBlob(g, 1.6, 1.6, { a: 0.45 });
  return info(g, { foot: [1.1, 1.1], chew: leaves, extra: { plant: true } });
}

// ----------------------------------------------------------------- art
const ART = {};
export function artTex(kind, seed = 1) {
  const key = kind + seed; if (ART[key]) return ART[key];
  const W = 256, H = 200, c = T.canvas(W, H), x = c.getContext('2d'), r = rng(seed);
  const bg = { shapes: '#e7dcc2', hills: '#cfd8d2', cat: '#d8c09a', sea: '#c9d6d8', moon: '#2f3a4a', flowers: '#e8d9b5' }[kind] || '#e7dcc2';
  x.fillStyle = bg; x.fillRect(0, 0, W, H);
  const brush = (col, fn) => { x.fillStyle = col; x.beginPath(); fn(); x.fill(); };
  if (kind === 'shapes') { // a circle, a square and a triangle on a little island
    brush('#7c9a72', () => x.ellipse(W / 2, H * 0.82, W * 0.45, H * 0.16, 0, 0, 6.3));
    brush('#c8684a', () => x.rect(W * 0.18, H * 0.38, 46, 46));
    brush('#d9a441', () => x.arc(W * 0.52, H * 0.56, 26, 0, 6.3));
    brush('#4f7f86', () => { x.moveTo(W * 0.7, H * 0.72); x.lineTo(W * 0.82, H * 0.38); x.lineTo(W * 0.94, H * 0.72); });
  } else if (kind === 'hills') {
    for (let i = 0; i < 4; i++) brush(mix('#8fa77a', '#4d6448', i / 3), () => { x.moveTo(0, H); for (let t = 0; t <= W; t += 8) x.lineTo(t, H * (0.4 + i * 0.13) + Math.sin(t * 0.03 + i * 2) * 14); x.lineTo(W, H); });
    brush('#efe2b4', () => x.arc(W * 0.76, H * 0.25, 16, 0, 6.3));
  } else if (kind === 'cat') {
    brush('#3e3432', () => { x.ellipse(W / 2, H * 0.72, 52, 48, 0, 0, 6.3); });
    brush('#3e3432', () => { x.arc(W / 2, H * 0.38, 34, 0, 6.3); x.moveTo(W / 2 - 32, H * 0.3); x.lineTo(W / 2 - 26, H * 0.08); x.lineTo(W / 2 - 8, H * 0.24); x.moveTo(W / 2 + 32, H * 0.3); x.lineTo(W / 2 + 26, H * 0.08); x.lineTo(W / 2 + 8, H * 0.24); });
    brush('#e0b74a', () => { x.ellipse(W / 2 - 12, H * 0.38, 6, 8, 0, 0, 6.3); x.ellipse(W / 2 + 12, H * 0.38, 6, 8, 0, 0, 6.3); });
  } else if (kind === 'sea') {
    for (let i = 0; i < 6; i++) { x.strokeStyle = mix('#4f7f86', '#9cb8bc', i / 5); x.lineWidth = 6; x.beginPath(); for (let t = 0; t <= W; t += 6) x.lineTo(t, H * 0.5 + i * 14 + Math.sin(t * 0.06 + i) * 4); x.stroke(); }
    brush('#c8684a', () => { x.moveTo(W * 0.4, H * 0.5); x.lineTo(W * 0.5, H * 0.18); x.lineTo(W * 0.56, H * 0.5); });
  } else if (kind === 'moon') {
    for (let i = 0; i < 40; i++) brush('#efe2b4', () => x.arc(r() * W, r() * H * 0.7, 1 + r() * 1.5, 0, 6.3));
    brush('#efe2b4', () => x.arc(W * 0.65, H * 0.35, 28, 0, 6.3)); brush('#2f3a4a', () => x.arc(W * 0.7, H * 0.31, 26, 0, 6.3));
    brush('#1f2733', () => { x.moveTo(0, H); x.lineTo(0, H * 0.8); x.lineTo(W * 0.3, H * 0.7); x.lineTo(W * 0.6, H * 0.82); x.lineTo(W, H * 0.72); x.lineTo(W, H); });
  } else if (kind === 'flowers') {
    for (let i = 0; i < 12; i++) { const fx = 30 + r() * (W - 60), fy = 40 + r() * (H - 80); x.strokeStyle = '#6f8150'; x.lineWidth = 3; x.beginPath(); x.moveTo(fx, fy); x.lineTo(fx + (r() - 0.5) * 20, H); x.stroke(); brush(pickc(r, ['#c8684a', '#d9a441', '#e3a7a0', '#efe2b4']), () => x.arc(fx, fy, 9 + r() * 6, 0, 6.3)); }
  }
  // brush texture and canvas weave
  for (let i = 0; i < 1600; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},.05)`; x.fillRect(r() * W, r() * H, 2, 1); }
  const t = T.toTex(c, { clamp: true }); ART[key] = t; return t;
}
export function frame(o = {}) {
  const g = group(), w = o.w || 1.2, h = o.h || 0.95;
  const fm = o.gold ? M.brass() : M.wood(o.wood || PAL.walnut, 12, 1);
  const b = 0.1;
  add(g, rbox(w, b, 0.08, 0.02), fm, { pos: [0, h / 2 - b / 2, 0] });
  add(g, rbox(w, b, 0.08, 0.02), fm, { pos: [0, -h / 2 + b / 2, 0] });
  add(g, rbox(b, h, 0.08, 0.02), fm, { pos: [-w / 2 + b / 2, 0, 0] });
  add(g, rbox(b, h, 0.08, 0.02), fm, { pos: [w / 2 - b / 2, 0, 0] });
  const art = new THREE.MeshStandardMaterial({ map: artTex(o.art || 'hills', o.seed || 1), roughness: 0.9 });
  add(g, new THREE.PlaneGeometry(w - b * 1.6, h - b * 1.6), art, { pos: [0, 0, 0.0], cast: false });
  g.children.forEach(c => c.position.y += h / 2);
  return g;
}
export function wallClock() {
  const g = group();
  add(g, cyl(0.55, 0.55, 0.12, 32), M.wood(PAL.walnut, 13, 1), { rot: [Math.PI / 2, 0, 0] });
  const c = T.canvas(256), x = c.getContext('2d');
  x.fillStyle = '#efe5cf'; x.beginPath(); x.arc(128, 128, 120, 0, 6.3); x.fill();
  x.fillStyle = '#3a3431'; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; x.beginPath(); x.arc(128 + Math.sin(a) * 100, 128 - Math.cos(a) * 100, i % 3 ? 4 : 8, 0, 6.3); x.fill(); }
  add(g, new THREE.CircleGeometry(0.47, 32), new THREE.MeshStandardMaterial({ map: T.toTex(c, { clamp: true }), roughness: 0.6 }), { pos: [0, 0, 0.065], cast: false });
  const hand = (L, wdt) => { const m = add(g, new THREE.BoxGeometry(wdt, L, 0.02), M.plain('#2e2622'), { pos: [0, 0, 0.08], cast: false }); m.geometry.translate(0, L / 2, 0); return m; };
  g.userData = { hour: hand(0.26, 0.05), minute: hand(0.38, 0.03) };
  return g;
}

// ------------------------------------------------------------- fireplace
export function fireplace(o = {}) {
  const g = group(), w = 3.8, h = 4.0, d = 1.2;
  const br = mat({ tex: T.brick(PAL.brick, 4), scale: 2.2, rough: 0.92, bumpScale: 1.5 });
  // surround: two pillars, a lintel, and a hearth
  add(g, wobble(rbox(0.95, h, d, 0.05), 0.02), br, { pos: [-w / 2 + 0.475, h / 2, 0] });
  add(g, wobble(rbox(0.95, h, d, 0.05), 0.02), br, { pos: [w / 2 - 0.475, h / 2, 0] });
  add(g, wobble(rbox(w, 1.3, d, 0.05), 0.02), br, { pos: [0, h - 0.65, 0] });
  const inner = M.plain('#1d1714', 0.95);
  add(g, rbox(w - 1.9, h - 1.3, 0.3, 0.02), inner, { pos: [0, (h - 1.3) / 2, -d / 2 + 0.15] });
  add(g, rbox(0.1, h - 1.3, d, 0.02), inner, { pos: [-(w - 1.9) / 2 + 0.05, (h - 1.3) / 2, 0] });
  add(g, rbox(0.1, h - 1.3, d, 0.02), inner, { pos: [(w - 1.9) / 2 - 0.05, (h - 1.3) / 2, 0] });
  const stone = mat({ tex: T.plaster('#8d8578', 31), scale: 2, rough: 0.9, bumpScale: 1.2 });
  add(g, wobble(rbox(w + 0.6, 0.22, d + 1.0, 0.05), 0.02), stone, { pos: [0, 0.11, 0.45] });
  add(g, wobble(rbox(w + 0.5, 0.2, d + 0.35, 0.05), 0.015), M.wood(PAL.walnut, 14), { pos: [0, h + 0.1, 0.1] });
  // logs and fire
  const bark = M.wood('#5a4330', 15, 0.6);
  for (let i = 0; i < 3; i++) add(g, cyl(0.16, 0.16, 1.5, 10), bark, { pos: [(i - 1) * 0.18, 0.4 + (i === 1 ? 0.2 : 0), 0.0], rot: [0, 0.3 * (i - 1), Math.PI / 2] });
  const flames = [];
  for (let i = 0; i < 5; i++) {
    const fm = new THREE.MeshBasicMaterial({ color: i % 2 ? '#ffb347' : '#ff7a2a', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
    const f = add(g, new THREE.ConeGeometry(0.18, 0.9, 10), fm, { pos: [(i - 2) * 0.22, 0.95, 0.05], cast: false, receive: false });
    flames.push(f);
  }
  const light = new THREE.PointLight('#ff9a4a', 0, 10, 1.6); light.position.set(0, 1.2, 0.8); g.add(light);
  // on the mantel: a clock, candles and a little framed photo
  const clk = mantelClock(); clk.position.set(-1.1, h + 0.2, 0.15); g.add(clk);
  for (const cx of [0.9, 1.2]) { add(g, cyl(0.06, 0.06, 0.5 + (cx - 0.9), 10), M.cer('#f0e6cf'), { pos: [cx, h + 0.45 + (cx - 0.9) / 2, 0.2] }); }
  const fr = frame({ w: 0.8, h: 0.65, art: 'cat', gold: true }); fr.position.set(0.1, h + 0.2, -0.1); fr.rotation.x = -0.1; g.add(fr);
  return info(g, {
    foot: [w + 0.6, d + 0.6],
    perches: [{ x: -0.2, y: h + 0.2, z: 0.2, kind: 'high', cap: 1 }],
    knock: [{ obj: clk, kind: 'clock' }],
    extra: { fire: { flames, light } },
  });
}
function mantelClock() {
  const g = group();
  add(g, rbox(0.55, 0.55, 0.28, 0.12), M.wood(PAL.walnut, 16, 1));
  add(g, cyl(0.18, 0.18, 0.02, 20), M.cer('#efe5cf'), { pos: [0, 0.05, 0.15], rot: [Math.PI / 2, 0, 0] });
  g.children.forEach(c => c.position.y += 0.28);
  return g;
}

// ----------------------------------------------------------------- desk
export function desk(o = {}) {
  const g = group(), w = 3.2, d = 1.6, h = 2.35;
  const wd = M.wood(o.wood || PAL.oak, 17);
  add(g, wobble(rbox(w, 0.14, d, 0.04), 0.01), wd, { pos: [0, h - 0.07, 0] });
  add(g, rbox(1.0, h - 0.14, d - 0.1, 0.04), M.paint(PAL.dusty, 18), { pos: [w / 2 - 0.55, (h - 0.14) / 2, 0] });
  for (let i = 0; i < 3; i++) add(g, cyl(0.05, 0.05, 0.04, 10), M.brass(), { pos: [w / 2 - 0.55, 0.45 + i * 0.7, d / 2], rot: [Math.PI / 2, 0, 0] });
  for (const sz of [-1, 1]) add(g, cyl(0.06, 0.07, h - 0.14, 10), wd, { pos: [-w / 2 + 0.15, (h - 0.14) / 2, sz * (d / 2 - 0.15)] });
  // laptop: base and screen with a glowing page
  const lap = group(); lap.position.set(-0.3, h, 0.05);
  add(lap, rbox(1.2, 0.05, 0.82, 0.03), M.metal('#a9aba5'), { pos: [0, 0.025, 0] });
  const c = T.canvas(256, 170), x = c.getContext('2d');
  x.fillStyle = '#eef1ea'; x.fillRect(0, 0, 256, 170); x.fillStyle = '#c8684a'; x.fillRect(0, 0, 256, 18);
  for (let i = 0; i < 9; i++) { x.fillStyle = i % 3 ? '#9aa7a0' : '#4f7f86'; x.fillRect(16, 30 + i * 14, 80 + (i * 37) % 120, 6); }
  const scr = add(lap, rbox(1.2, 0.8, 0.04, 0.03), M.metal('#a9aba5'), { pos: [0, 0.42, -0.42] }); scr.rotation.x = -0.25;
  const glow = new THREE.MeshBasicMaterial({ map: T.toTex(c, { clamp: true }), color: 0xd8dcd4 });
  const sp = add(lap, new THREE.PlaneGeometry(1.08, 0.68), glow, { pos: [0, 0.42, -0.395], cast: false }); sp.rotation.x = -0.25;
  g.add(lap);
  const lamp = tableLamp(PAL.mustard); lamp.scale.setScalar(0.7); lamp.position.set(w / 2 - 0.4, h, -0.4); g.add(lamp);
  const cup = penCup(); cup.position.set(0.75, h, 0.35); g.add(cup);
  const chair = woodChair({ color: PAL.oak }); chair.position.set(-0.3, 0, 1.25); chair.rotation.y = Math.PI; g.add(chair);
  shadowBlob(g, w + 0.6, d + 1.6, { a: 0.35, z: 0.3 });
  return info(g, {
    foot: [w, d + 0.6],
    perches: [{ x: -0.3, y: h + 0.05, z: 0.1, kind: 'laptop', cap: 1 }],
    knock: [{ obj: cup, kind: 'pens' }],
    extra: { light: lamp.userData.light, shade: lamp.userData.shade, bulb: lamp.userData.bulb, laptop: lap },
  });
}
function penCup() {
  const g = group();
  add(g, cyl(0.12, 0.11, 0.35, 14), M.cer(PAL.teal));
  const cols = [PAL.terracotta, PAL.mustard, PAL.ink, PAL.dusty];
  for (let i = 0; i < 4; i++) add(g, cyl(0.015, 0.015, 0.5, 6), M.plain(cols[i]), { pos: [(i - 1.5) * 0.04, 0.35, (i % 2) * 0.03], rot: [0, 0, (i - 1.5) * 0.1] });
  g.children.forEach(c => c.position.y += c === g.children[0] ? 0.175 : 0);
  g.userData = { knockable: true };
  return g;
}
export function woodChair(o = {}) {
  const g = group(), wd = M.wood(o.color || PAL.oak, 19);
  add(g, wobble(rbox(1.3, 0.12, 1.25, 0.05), 0.01), wd, { pos: [0, 1.45, 0] });
  legs(g, 1.3, 1.25, 1.4, wd, { r: 0.06, inset: 0.1, splay: true });
  for (let i = 0; i < 4; i++) add(g, cyl(0.035, 0.035, 1.5, 8), wd, { pos: [-0.45 + i * 0.3, 2.2, -0.55] });
  add(g, rbox(1.3, 0.16, 0.12, 0.04), wd, { pos: [0, 2.95, -0.55] });
  if (o.cushion) add(g, puff(rbox(1.1, 0.14, 1.05, 0.06), 0.14, 0.05), M.fab(o.cushion, { pattern: 'check', scale: 0.7 }), { pos: [0, 1.55, 0.02] });
  shadowBlob(g, 1.6, 1.6, { a: 0.3 });
  return g;
}

// ---------------------------------------------------------------- rugs
export function rugMesh(kind, cols, w, d, seed = 8) {
  const t = T.rug(kind, cols, seed);
  const m = mat({ tex: t, rough: 0.98, bumpScale: 1.5, alphaTest: 0.4, clampTex: true, key: 'rug' + kind + cols.join() + seed });
  const geo = kind === 'braided' || kind === 'round' ? new THREE.CircleGeometry(0.5, 48) : new THREE.PlaneGeometry(1, 1);
  if (kind === 'braided' || kind === 'round') { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) { /* circle uv already 0..1 */ } }
  const r = mesh(geo, m, { cast: false, rot: [-Math.PI / 2, 0, 0] });
  r.scale.set(w, d, 1); r.position.y = 0.02;
  return r;
}

// ---------------------------------------------------------------- kitchen
export function counterRun(o = {}) {
  const g = group(), w = o.w || 7.6, d = 1.9, h = 2.7, wd = M.paint(o.paint || PAL.sage, 23);
  const top = M.wood(PAL.pine, 24, 2.4);
  add(g, rbox(w, h - 0.3, d - 0.15, 0.04), wd, { pos: [0, (h - 0.3) / 2 + 0.15, -0.05] });
  add(g, rbox(w - 0.1, 0.15, d - 0.4, 0.02), M.plain('#2c2420'), { pos: [0, 0.075, -0.1] });
  // cabinet doors with frames and knobs
  const doors = Math.round(w / 1.25), dw = w / doors;
  for (let i = 0; i < doors; i++) {
    const cx = -w / 2 + dw * (i + 0.5);
    add(g, rbox(dw - 0.18, h - 0.9, 0.06, 0.03), wd, { pos: [cx, 1.28, d / 2 - 0.08] });
    add(g, rbox(dw - 0.42, h - 1.3, 0.05, 0.02), M.paint(shade(o.paint || PAL.sage, -0.08), 25), { pos: [cx, 1.28, d / 2 - 0.05] });
    add(g, sphere(0.06, 10, 8), M.brass(), { pos: [cx + (i % 2 ? -1 : 1) * (dw / 2 - 0.28), 1.6, d / 2] });
  }
  add(g, wobble(rbox(w + 0.15, 0.18, d + 0.05, 0.04), 0.01), top, { pos: [0, h + 0.09, 0] });
  // sink
  const sx = o.sinkX ?? 0.8;
  add(g, rbox(1.5, 0.05, 1.0, 0.04), M.metal('#b8bab2'), { pos: [sx, h + 0.19, 0] });
  add(g, rbox(1.3, 0.04, 0.8, 0.02), M.plain('#53585a', 0.3), { pos: [sx, h + 0.2, 0] });
  const tap = group(); tap.position.set(sx, h + 0.18, -0.7);
  add(tap, cyl(0.05, 0.05, 0.7, 10), M.brass(), { pos: [0, 0.35, 0] });
  add(tap, new THREE.TorusGeometry(0.2, 0.045, 8, 16, Math.PI), M.brass(), { pos: [0, 0.7, 0.2], rot: [0, Math.PI / 2, 0] });
  g.add(tap);
  const knock = [];
  // things on the counter: bread from the Cat Bakery, a kettle, a jar, a plant
  const bread = breadBag(); bread.position.set(-w / 2 + 1.0, h + 0.18, 0.1); g.add(bread);
  const jar = add(g, cyl(0.2, 0.2, 0.5, 16), M.glass(), { pos: [-w / 2 + 2.0, h + 0.43, -0.4], cast: false });
  add(g, cyl(0.17, 0.17, 0.3, 14), M.felt('#c9a36a'), { pos: [-w / 2 + 2.0, h + 0.36, -0.4] });
  add(g, cyl(0.22, 0.22, 0.08, 16), M.wood(PAL.walnut, 26, 1), { pos: [-w / 2 + 2.0, h + 0.72, -0.4] });
  const mugs = []; for (let i = 0; i < 2; i++) { const m = mugMesh([PAL.teal, PAL.rose][i]); m.position.set(w / 2 - 1.3 + i * 0.45, h + 0.18, 0.45); g.add(m); mugs.push(m); }
  knock.push({ obj: mugs[0], kind: 'mug' });
  const pl = smallPlant(rng(31)); pl.position.set(w / 2 - 0.5, h + 0.18, -0.4); g.add(pl); knock.push({ obj: pl, kind: 'plant' });
  shadowBlob(g, w + 0.4, d + 0.6, { a: 0.3, z: 0.2 });
  return info(g, {
    foot: [w, d],
    perches: [{ x: -w / 2 + 1.5, y: h + 0.18, z: 0.3, kind: 'counter', cap: 1 }, { x: w / 2 - 2.2, y: h + 0.18, z: 0.3, kind: 'counter', cap: 1 }],
    knock, extra: { bread },
  });
}
export function breadBag() {
  const g = group();
  const bag = add(g, wobble(rbox(0.7, 0.75, 0.45, 0.06), 0.03, 3), M.card('THE CAT BAKERY'), { pos: [0, 0.375, 0] });
  const loaf = add(g, wobble(puff(rbox(0.75, 0.32, 0.4, 0.15, 4), 0.32, 0.1, 0.03), 0.02, 3), M.felt('#c98b4a', { rough: 0.8 }), { pos: [0.1, 0.8, 0.05], rot: [0, 0, -0.35] });
  // little cat ears on the loaf, as the Cat Bakery would bake it
  for (const s of [-1, 1]) add(g, new THREE.ConeGeometry(0.07, 0.14, 4), M.felt('#c98b4a'), { pos: [0.1 + s * 0.12 + 0.1, 1.02 - s * 0.04, 0.05], rot: [0, 0, -0.35] });
  g.userData = { loaf };
  return g;
}
export function stove(o = {}) {
  const g = group(), w = 2.1, d = 1.9, h = 2.85, en = M.enamel(o.color || PAL.cream);
  add(g, rbox(w, h, d - 0.1, 0.1), en, { pos: [0, h / 2, 0] });
  add(g, rbox(w - 0.4, 1.3, 0.08, 0.05), M.enamel(shade(o.color || PAL.cream, -0.08)), { pos: [0, 1.2, d / 2 - 0.05] });
  add(g, rbox(w - 0.8, 0.5, 0.04, 0.03), M.plain('#2a2522', 0.3), { pos: [0, 1.35, d / 2] });
  add(g, cyl(0.04, 0.04, w - 0.6, 8), M.metal(), { pos: [0, 1.95, d / 2 + 0.1], rot: [0, 0, Math.PI / 2] });
  for (let i = 0; i < 4; i++) add(g, cyl(0.07, 0.07, 0.08, 12), M.plain(PAL.charcoal, 0.5), { pos: [-0.6 + i * 0.4, 2.35, d / 2 - 0.02], rot: [Math.PI / 2, 0, 0] });
  for (const [bx, bz] of [[-0.5, -0.4], [0.5, -0.4], [-0.5, 0.4], [0.5, 0.4]]) add(g, new THREE.TorusGeometry(0.25, 0.04, 6, 18), M.plain('#2a2522', 0.5), { pos: [bx, h + 0.02, bz], rot: [Math.PI / 2, 0, 0] });
  const kettle = group(); kettle.position.set(-0.5, h + 0.02, 0.4);
  add(kettle, lathe([[0, 0], [0.32, 0], [0.36, 0.25], [0.28, 0.5], [0.1, 0.58], [0, 0.6]], 22), M.enamel(PAL.terracotta));
  add(kettle, new THREE.TorusGeometry(0.2, 0.03, 6, 14, Math.PI), M.plain(PAL.charcoal), { pos: [0, 0.6, 0] });
  g.add(kettle);
  shadowBlob(g, w + 0.4, d + 0.5, { a: 0.3 });
  return info(g, { foot: [w, d] });
}
export function fridge(o = {}) {
  const g = group(), w = 2.4, d = 2.0, h = 6.0, en = M.enamel(o.color || '#d9cfb3');
  add(g, wobble(rbox(w, h, d, 0.35, 4), 0.02), en, { pos: [0, h / 2, 0] });
  add(g, rbox(w - 0.1, 0.04, 0.05, 0.02), M.plain('#9a937f'), { pos: [0, h * 0.66, d / 2 + 0.01] });
  add(g, rbox(0.12, 1.2, 0.16, 0.05), M.metal('#cfcfc6'), { pos: [w / 2 - 0.3, h * 0.78, d / 2 + 0.08] });
  add(g, rbox(0.12, 1.6, 0.16, 0.05), M.metal('#cfcfc6'), { pos: [w / 2 - 0.3, h * 0.45, d / 2 + 0.08] });
  // notes and magnets
  const notes = [];
  for (let i = 0; i < 3; i++) {
    const c = ['#f3d77a', '#f0b8a8', '#bfe0c8'][i];
    const n = add(g, new THREE.PlaneGeometry(0.6, 0.6), M.plain(c, 0.9), { pos: [-0.45 + i * 0.3, h * 0.48 - i * 0.55, d / 2 + 0.02], rot: [0, 0, (i - 1) * 0.12], cast: false });
    add(g, sphere(0.06, 8, 6), M.plain([PAL.terracotta, PAL.teal, PAL.mustard][i], 0.4), { pos: [-0.45 + i * 0.3, h * 0.48 - i * 0.55 + 0.25, d / 2 + 0.05] });
    notes.push(n);
  }
  const art = frame({ w: 0.7, h: 0.55, art: 'flowers', seed: 4 }); art.position.set(-0.4, h * 0.72, d / 2 + 0.02); art.scale.z = 0.3; g.add(art);
  shadowBlob(g, w + 0.5, d + 0.5, { a: 0.4 });
  return info(g, { foot: [w, d], perches: [{ x: 0, y: h, z: 0, kind: 'high', cap: 1, nap: 1 }], extra: { notes } });
}
export function diningTable(o = {}) {
  const g = group(), w = 3.4, d = 2.4, h = 2.45, wd = M.wood(o.wood || PAL.pine, 27);
  add(g, wobble(rbox(w, 0.16, d, 0.05), 0.012), wd, { pos: [0, h - 0.08, 0] });
  legs(g, w, d, h - 0.16, wd, { r: 0.1, inset: 0.22 });
  // checked runner, a fruit bowl and a vase of flowers
  add(g, new THREE.PlaneGeometry(1.0, d + 0.4), M.fab(PAL.cream, { pattern: 'check', b: PAL.terracotta, scale: 0.6 }), { pos: [0, h + 0.005, 0], rot: [-Math.PI / 2, 0, 0], cast: false });
  const bowl = group(); bowl.position.set(-0.7, h, 0.2);
  add(bowl, lathe([[0, 0], [0.25, 0], [0.45, 0.25], [0.42, 0.26], [0.22, 0.04], [0, 0.04]], 22), M.cer(PAL.teal));
  for (let i = 0; i < 4; i++) add(bowl, sphere(0.15, 12, 10), M.felt([PAL.terracotta, PAL.mustard, '#9bb05a', PAL.rust][i], { rough: 0.6 }), { pos: [Math.cos(i * 1.6) * 0.17, 0.2 + (i === 3 ? 0.12 : 0), Math.sin(i * 1.6) * 0.17] });
  g.add(bowl);
  const v = vase(PAL.cream); v.position.set(0.7, h, -0.3); g.add(v);
  for (const s of [-1, 1]) { const ch = woodChair({ color: PAL.pine, cushion: s > 0 ? PAL.rose : PAL.mustard }); ch.position.set(s * (w / 2 + 0.6), 0, 0); ch.rotation.y = -s * Math.PI / 2; g.add(ch); }
  shadowBlob(g, w + 0.6, d + 0.6, { a: 0.3 });
  return info(g, { foot: [w + 2.2, d], perches: [{ x: 0.2, y: h, z: 0.4, kind: 'table', cap: 1 }], knock: [{ obj: v, kind: 'vase' }] });
}
export function trashCan() {
  const g = group();
  add(g, lathe([[0, 0], [0.42, 0], [0.48, 1.5], [0, 1.5]], 24), M.metal('#a6a59a'));
  add(g, lathe([[0, 0], [0.5, 0], [0.48, 0.12], [0.2, 0.22], [0, 0.24]], 24), M.metal('#b7b6aa'), { pos: [0, 1.5, 0] });
  add(g, rbox(0.3, 0.06, 0.2, 0.02), M.metal('#7f7e75'), { pos: [0, 0.05, 0.5] });
  shadowBlob(g, 1.2, 1.2, { a: 0.4 });
  return info(g, { foot: [1, 1], extra: { trash: true } });
}
export function foodSack() {
  const g = group();
  const s = add(g, wobble(puff(rbox(1.0, 1.4, 0.6, 0.2, 4), 1.4, 0.0, 0.1), 0.05, 2), M.card('KIBBLE'), { pos: [0, 0.7, 0] });
  add(g, rbox(1.0, 0.25, 0.3, 0.08), M.card(), { pos: [0, 1.45, 0], rot: [0.3, 0, 0] });
  shadowBlob(g, 1.4, 1.0, { a: 0.4 });
  return info(g, { foot: [1.0, 0.7], extra: { sack: true } });
}
export function shelfWall(o = {}) {
  // open shelves with jars and plates, hung on a wall
  const g = group(), w = o.w || 3.2, wd = M.wood(PAL.walnut, 28);
  const knock = [];
  for (let s = 0; s < 2; s++) {
    add(g, rbox(w, 0.12, 0.75, 0.03), wd, { pos: [0, s * 1.2, 0] });
    for (let i = 0; i < 5; i++) {
      const x = -w / 2 + 0.35 + i * (w - 0.7) / 4;
      if ((i + s) % 3 === 0) { const p = add(g, cyl(0.38, 0.38, 0.04, 22), M.cer([PAL.cream, PAL.teal][s], { band: PAL.terracotta }), { pos: [x, s * 1.2 + 0.45, -0.25], rot: [Math.PI / 2 - 0.15, 0, 0] }); }
      else { const j = group(); j.position.set(x, s * 1.2 + 0.06, 0.05); add(j, cyl(0.17, 0.17, 0.45, 14), M.cer([PAL.mustard, PAL.cream, PAL.rose, PAL.sage][(i + s) % 4]), { pos: [0, 0.225, 0] }); add(j, cyl(0.18, 0.18, 0.06, 14), M.wood(PAL.oak, 29, 1), { pos: [0, 0.48, 0] }); g.add(j); if (s === 0 && i === 4) knock.push({ obj: j, kind: 'jar' }); }
    }
  }
  return info(g, { foot: [0, 0], knock });
}

// --------------------------------------------------------------- bedroom
export function bed(o = {}) {
  const g = group(), w = o.w || 5.0, d = o.d || 6.4, wd = M.wood(o.wood || PAL.walnut, 30);
  add(g, wobble(rbox(w + 0.2, 4.0, 0.3, 0.12), 0.015), wd, { pos: [0, 2.0, -d / 2] });
  for (let i = 0; i < 5; i++) add(g, rbox(0.3, 2.3, 0.12, 0.05), M.wood(shade(o.wood || PAL.walnut, 0.08), 31), { pos: [-1.6 + i * 0.8, 2.3, -d / 2 + 0.2] });
  add(g, wobble(rbox(w + 0.2, 1.6, 0.25, 0.1), 0.015), wd, { pos: [0, 0.8, d / 2] });
  add(g, rbox(w, 0.5, d - 0.2, 0.06), wd, { pos: [0, 0.55, 0] });
  add(g, puff(rbox(w - 0.2, 0.7, d - 0.4, 0.2, 3), 0.7, 0.06, 0.02), M.fab('#efe6d4', { scale: 1.2 }), { pos: [0, 1.15, 0] });
  const q = T.quilt(o.quilt || [PAL.terracotta, PAL.mustard, PAL.sage, PAL.dusty, PAL.rose, PAL.cream], 7);
  const qm = mat({ tex: q, scale: 2.6, rough: 0.98, bumpScale: 2.0 });
  add(g, wobble(puff(rbox(w + 0.1, 0.35, d - 1.8, 0.14, 4), 0.35, 0.14, 0.02), 0.03, 1.4), qm, { pos: [0, 1.62, 0.75] });
  for (const s of [-1, 1]) add(g, wobble(rbox(0.1, 1.0, d - 1.8, 0.05), 0.03, 2), qm, { pos: [s * (w / 2 + 0.08), 1.25, 0.75] });
  for (const s of [-1, 1]) { const p = add(g, puff(rbox(1.9, 0.35, 1.1, 0.17, 4), 0.35, 0.18, 0.04), M.fab('#f2eadb', { pattern: 'ticking', b: PAL.dusty, scale: 0.9 }), { pos: [s * 1.15, 1.75, -d / 2 + 0.95] }); p.rotation.x = -0.35; }
  const kn = M.knit(PAL.mustard, { b: PAL.cream });
  add(g, wobble(rbox(w + 0.2, 0.18, 1.2, 0.08), 0.04, 2), kn, { pos: [0, 1.85, d / 2 - 1.0] });
  shadowBlob(g, w + 1, d + 1, { a: 0.5 });
  return info(g, {
    foot: [w + 0.3, d + 0.2],
    perches: [{ x: -1.2, y: 1.95, z: 0.4, kind: 'bed', cap: 1, nap: 2 }, { x: 1.2, y: 1.95, z: 0.6, kind: 'bed', cap: 1, nap: 2 }, { x: 0, y: 1.98, z: 2.0, kind: 'bed', cap: 1, nap: 2 }, { x: -0.3, y: 1.95, z: -1.0, kind: 'bed', cap: 1, nap: 2 }],
    scratch: [{ x: -1.0, y: 0.8, z: d / 2 + 0.15, nx: 0, nz: 1 }],
    extra: { wearable: true, cloth: qm },
  });
}
export function nightstand(o = {}) {
  const g = group(), wd = M.paint(o.paint || PAL.cream, 32), h = 2.1;
  add(g, wobble(rbox(1.4, h, 1.3, 0.06), 0.01), wd, { pos: [0, h / 2, 0] });
  add(g, rbox(1.2, 0.6, 0.05, 0.03), wd, { pos: [0, h - 0.55, 0.66] });
  add(g, sphere(0.06, 10, 8), M.brass(), { pos: [0, h - 0.55, 0.72] });
  const L = tableLamp(o.lamp || PAL.rose); L.scale.setScalar(0.75); L.position.set(-0.25, h, -0.2); g.add(L);
  const gl = glassMesh(); gl.position.set(0.38, h, 0.3); g.add(gl);
  shadowBlob(g, 1.8, 1.7, { a: 0.35 });
  return info(g, { foot: [1.4, 1.3], perches: [{ x: 0.3, y: h, z: 0.25, kind: 'table', cap: 1 }], knock: [{ obj: gl, kind: 'glass' }], extra: { light: L.userData.light, shade: L.userData.shade, bulb: L.userData.bulb } });
}
export function dresser(o = {}) {
  const g = group(), w = 3.2, d = 1.4, h = 3.0, wd = M.paint(o.paint || PAL.dusty, 33);
  add(g, wobble(rbox(w, h, d, 0.06), 0.012), wd, { pos: [0, h / 2 + 0.2, 0] });
  legs(g, w, d, 0.25, M.wood(PAL.walnut, 34), { r: 0.08, inset: 0.15 });
  for (let i = 0; i < 3; i++) { add(g, rbox(w - 0.3, 0.8, 0.06, 0.04), M.paint(shade(o.paint || PAL.dusty, 0.1), 35), { pos: [0, 0.75 + i * 0.95, d / 2] }); for (const s of [-1, 1]) add(g, sphere(0.07, 10, 8), M.brass(), { pos: [s * 0.8, 0.75 + i * 0.95, d / 2 + 0.06] }); }
  // mirror, perfume and a jewellery box
  const mir = group(); mir.position.set(0, h + 0.2, -0.3);
  add(mir, rbox(1.8, 2.2, 0.1, 0.4), M.wood(PAL.walnut, 36), { pos: [0, 1.15, 0] });
  add(mir, rbox(1.55, 1.95, 0.05, 0.32), mat({ key: 'mirror', color: '#b9c6c8', rough: 0.05, metal: 0.9 }), { pos: [0, 1.15, 0.05], cast: false });
  g.add(mir);
  const per = group(); per.position.set(1.15, h + 0.2, 0.25);
  add(per, sphere(0.16, 14, 10), M.glass(), { pos: [0, 0.16, 0], cast: false });
  add(per, cyl(0.04, 0.04, 0.12, 8), M.brass(), { pos: [0, 0.36, 0] });
  add(per, sphere(0.12, 10, 8), M.felt(PAL.rose), { pos: [0, 0.14, 0] });
  g.add(per);
  const box = group(); box.position.set(-1.1, h + 0.2, 0.2); add(box, rbox(0.6, 0.3, 0.4, 0.05), M.fab(PAL.plum, { scale: 0.5 }), { pos: [0, 0.15, 0] }); g.add(box);
  shadowBlob(g, w + 0.5, d + 0.6, { a: 0.35 });
  return info(g, { foot: [w, d], perches: [{ x: -0.3, y: h + 0.2, z: 0.35, kind: 'table', cap: 1 }], knock: [{ obj: per, kind: 'perfume' }] });
}
export function wardrobe(o = {}) {
  const g = group(), w = 3.0, d = 1.6, h = 6.4, wd = M.wood(o.wood || PAL.oak, 37);
  add(g, wobble(rbox(w, h, d, 0.08), 0.015), wd, { pos: [0, h / 2 + 0.25, 0] });
  for (const s of [-1, 1]) { add(g, rbox(w / 2 - 0.25, h - 0.9, 0.06, 0.05), M.wood(shade(o.wood || PAL.oak, -0.08), 38), { pos: [s * w / 4, h / 2 + 0.25, d / 2] }); add(g, cyl(0.035, 0.035, 0.5, 8), M.brass(), { pos: [s * 0.15, h / 2 + 0.25, d / 2 + 0.08] }); }
  add(g, rbox(w + 0.25, 0.25, d + 0.2, 0.05), wd, { pos: [0, h + 0.37, 0] });
  legs(g, w, d, 0.28, M.wood(PAL.walnut, 39), { r: 0.1, inset: 0.18 });
  // hat boxes on top
  add(g, cyl(0.6, 0.6, 0.6, 22), M.fab(PAL.rose, { pattern: 'stripe', b: PAL.cream, scale: 0.6 }), { pos: [-0.6, h + 0.8, 0] });
  shadowBlob(g, w + 0.6, d + 0.7, { a: 0.45 });
  return info(g, { foot: [w, d], perches: [{ x: 0.6, y: h + 0.5, z: 0, kind: 'high', cap: 1, nap: 1 }] });
}
export function laundryBasket() {
  const g = group();
  const wick = mat({ tex: T.weave('#c7a26a', 40, { cell: 8 }), scale: 0.6, rough: 0.9, bumpScale: 3 });
  add(g, wobble(lathe([[0, 0], [0.8, 0], [0.95, 1.0], [1.0, 1.05], [0.93, 1.05], [0.78, 0.06], [0, 0.06]], 26), 0.03, 2), wick);
  for (let i = 0; i < 5; i++) { const cl = add(g, wobble(puff(rbox(0.9, 0.3, 0.7, 0.14, 3), 0.3, 0.1, 0.05), 0.08, 2.4, i), M.fab([PAL.dusty, PAL.cream, PAL.rose, PAL.mustard, PAL.sage][i], { pattern: i % 2 ? 'stripe' : 'plain', scale: 0.6 }), { pos: [(i % 3 - 1) * 0.3, 0.75 + (i > 2 ? 0.25 : 0), (i % 2 - 0.5) * 0.3], rot: [0.3 * i, i, 0.2] }); }
  shadowBlob(g, 2.3, 2.3, { a: 0.45 });
  return info(g, { foot: [1.9, 1.9], perches: [{ x: 0, y: 1.0, z: 0, kind: 'basket', cap: 1, nap: 3 }] });
}
// --------------------------------------------------------------- sunroom
export function wickerChair(o = {}) {
  const g = group();
  const wick = mat({ tex: T.weave('#c49a5e', 41, { cell: 8 }), scale: 0.5, rough: 0.9, bumpScale: 3 });
  const body = lathe([[0, 0.4], [0.9, 0.4], [1.2, 1.4], [1.35, 3.4], [1.25, 3.5], [1.05, 1.5], [0.8, 1.2], [0, 1.2]], 30);
  const b = add(g, wobble(body, 0.03, 2), wick); b.scale.set(1, 1, 0.9);
  // cut the front open: a seat cushion fills it in visually
  add(g, cyl(0.6, 0.8, 0.4, 20), wick, { pos: [0, 0.2, 0] });
  add(g, puff(new THREE.CylinderGeometry(0.95, 0.95, 0.3, 24), 0.3, 0.1, 0.03), M.fab(o.cushion || PAL.teal, { pattern: 'floral', b: PAL.mustard, c: PAL.cream, scale: 1 }), { pos: [0, 1.35, 0.1] });
  shadowBlob(g, 2.8, 2.6, { a: 0.45 });
  return info(g, { foot: [2.4, 2.2], perches: [{ x: 0, y: 1.5, z: 0.15, kind: 'seat', cap: 1, nap: 2 }], scratch: [{ x: 0, y: 1.0, z: 1.05, nx: 0, nz: 1 }], extra: { wearable: true } });
}
export function plantStand(o = {}) {
  const g = group(), wd = M.wood(PAL.walnut, 42);
  for (let i = 0; i < 3; i++) {
    const h = 0.9 + i * 1.0, x = (i - 1) * 0.9;
    add(g, rbox(0.9, 0.1, 0.9, 0.03), wd, { pos: [x, h, 0] });
    for (const s of [-1, 1]) add(g, cyl(0.04, 0.04, h, 8), wd, { pos: [x + s * 0.35, h / 2, 0.35] }), add(g, cyl(0.04, 0.04, h, 8), wd, { pos: [x + s * 0.35, h / 2, -0.35] });
    const p = smallPlant(rng(50 + i)); p.scale.setScalar(1.4); p.position.set(x, h + 0.05, 0); g.add(p);
  }
  shadowBlob(g, 3.2, 1.4, { a: 0.35 });
  return info(g, { foot: [2.8, 1.0] });
}
export function hangingPlant(o = {}) {
  const g = group();
  const rope = M.plain('#d9c7a0', 1);
  for (let i = 0; i < 3; i++) { const a = i * 2.09; add(g, cyl(0.015, 0.015, 2.2, 4), rope, { pos: [Math.cos(a) * 0.25, 1.1, Math.sin(a) * 0.25], rot: [Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12], cast: false }); }
  add(g, lathe([[0, 0], [0.3, 0.05], [0.42, 0.45], [0, 0.45]], 18), M.cer(PAL.cream), { pos: [0, -0.45, 0] });
  const lm = mat({ tex: T.leaf('#6f8f4e', 'round', 61), alphaTest: 0.5, side: THREE.DoubleSide, rough: 0.6, bumpScale: 0.3, clampTex: true });
  const r = rng(61);
  for (let v = 0; v < 6; v++) { const a = v * 1.05; for (let k = 0; k < 6; k++) { const L = add(g, new THREE.PlaneGeometry(0.28, 0.32), lm, { pos: [Math.cos(a) * (0.35 + k * 0.03), -0.1 - k * 0.32, Math.sin(a) * (0.35 + k * 0.03)] }); L.rotation.set(r() - 0.5, a, r() - 0.5); } }
  return g;
}
// --------------------------------------------------------------- playroom
export function beanbag(o = {}) {
  const g = group();
  const geo = wobble(new THREE.SphereGeometry(1.2, 28, 18), 0.12, 1.2, 3);
  const P = geo.attributes.position.array; for (let i = 0; i < P.length; i += 3) { if (P[i + 1] < 0) P[i + 1] *= 0.35; else P[i + 1] *= 0.75; P[i + 1] -= Math.max(0, 0.35 - Math.hypot(P[i], P[i + 2]) * 0.35) * 0.8; }
  geo.computeVertexNormals();
  add(g, geo, M.fab(o.color || PAL.mustard, { pattern: 'herring', scale: 1 }), { pos: [0, 0.42, 0] });
  shadowBlob(g, 3, 3, { a: 0.5 });
  return info(g, { foot: [2.2, 2.2], perches: [{ x: 0, y: 0.95, z: 0.1, kind: 'seat', cap: 1, nap: 3 }], scratch: [{ x: 0, y: 0.5, z: 1.15, nx: 0, nz: 1 }], extra: { wearable: true } });
}
export function toyChest() {
  const g = group(), wd = M.paint(PAL.teal, 43);
  add(g, wobble(rbox(2.4, 1.4, 1.3, 0.08), 0.015), wd, { pos: [0, 0.7, 0] });
  const lid = add(g, rbox(2.5, 0.16, 1.4, 0.06), M.paint(PAL.mustard, 44), { pos: [0, 1.45, -0.6] });
  lid.geometry.translate(0, 0, 0.7); lid.rotation.x = -0.5;
  for (let i = 0; i < 4; i++) add(g, sphere(0.2, 12, 10), M.felt([PAL.terracotta, PAL.rose, PAL.sage, PAL.ochre][i]), { pos: [-0.7 + i * 0.45, 1.4, (i % 2) * 0.2] });
  shadowBlob(g, 2.8, 1.8, { a: 0.4 });
  return info(g, { foot: [2.4, 1.3], perches: [{ x: 0.5, y: 1.45, z: 0.3, kind: 'table', cap: 1 }] });
}
export function teepee() {
  const g = group();
  const cloth = M.fab(PAL.cream, { pattern: 'stripe', b: PAL.rose, scale: 1.2 });
  const cone = new THREE.ConeGeometry(1.5, 3.4, 5, 1, true, 0.6, Math.PI * 2 - 1.2);
  const c = add(g, cone, cloth, { pos: [0, 1.7, 0] }); c.material = cloth.clone(); c.material.side = THREE.DoubleSide;
  for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283; add(g, cyl(0.04, 0.04, 4.2, 6), M.wood(PAL.pine, 45), { pos: [Math.sin(a) * 0.9, 2.0, Math.cos(a) * 0.9], rot: [Math.cos(a) * -0.42, 0, Math.sin(a) * 0.42] }); }
  add(g, new THREE.CircleGeometry(1.3, 24), M.knit(PAL.sage), { pos: [0, 0.05, 0], rot: [-Math.PI / 2, 0, 0], cast: false });
  shadowBlob(g, 3.4, 3.4, { a: 0.45 });
  return info(g, { foot: [2.4, 2.4], extra: { hide: { x: 0, z: 0.1 } } });
}
export function playMats(w, d) {
  const g = group(), cols = [PAL.sage, PAL.mustard, PAL.rose, PAL.dusty, PAL.cream, PAL.terracotta];
  const n = Math.floor(w / 1.6), m = Math.floor(d / 1.6), r = rng(70);
  for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) add(g, rbox(1.58, 0.08, 1.58, 0.03), M.felt(cols[Math.floor(r() * cols.length)], { rough: 0.98 }), { pos: [-w / 2 + 0.8 + i * 1.6, 0.04, -d / 2 + 0.8 + j * 1.6], cast: false });
  return g;
}
export function stringLights(len, sag = 0.4) {
  const g = group(), n = Math.floor(len / 0.5);
  const wire = [];
  for (let i = 0; i <= n; i++) { const t = i / n; wire.push(new THREE.Vector3(-len / 2 + t * len, -Math.sin(t * Math.PI) * sag, 0)); }
  const curve = new THREE.CatmullRomCurve3(wire);
  add(g, new THREE.TubeGeometry(curve, n * 3, 0.012, 4), M.plain('#3a3431'), { cast: false });
  const bulbs = [];
  for (let i = 1; i < n; i++) { const p = curve.getPoint(i / n); const b = add(g, sphere(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: ['#ffd27a', '#ffb08a', '#ffe9b0'][i % 3] }), { pos: [p.x, p.y - 0.07, p.z], cast: false, receive: false }); bulbs.push(b); }
  g.userData = { bulbs };
  return g;
}
