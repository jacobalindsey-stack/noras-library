// Life with Cats — things that belong to the cats (bowls, boxes, trees, toys),
// the messes they make, and the little presents they bring you.
import * as THREE from '../lib/three.module.min.js';
import * as T from './tex.js';
import { rbox, puff, wobble, cyl, lathe, sphere, mat, mesh, add, group, shadowBlob } from './geo.js';
import { PAL, M } from './furniture.js';
import { rng, shade, mix } from './util.js';

function info(g, o) { g.userData = { foot: o.foot || [0, 0], perches: o.perches || [], scratch: o.scratch || [], knock: [], chew: [], ...o.extra }; return g; }

// ------------------------------------------------------------ feeding
const kibbleGeo = new THREE.IcosahedronGeometry(0.05, 0);
export function bowl(col, o = {}) {
  const g = group();
  add(g, wobble(lathe([[0, 0], [0.32, 0], [0.42, 0.22], [0.44, 0.24], [0.4, 0.24], [0.3, 0.06], [0, 0.06]], 26), 0.008, 3), M.cer(col, { band: shade(col, -0.3), seed: o.seed || 2 }));
  if (o.water) {
    const w = add(g, new THREE.CircleGeometry(0.36, 24), M.water(), { pos: [0, 0.19, 0], rot: [-Math.PI / 2, 0, 0], cast: false });
    g.userData.fill = w;
  } else {
    const inst = new THREE.InstancedMesh(kibbleGeo, M.felt('#8a5a32', { rough: 0.7 }), 40);
    const r = rng(7), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    for (let i = 0; i < 40; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 0.3, h = 0.08 + (0.3 - d) * 0.35 + r() * 0.04; e.set(r() * 3, r() * 3, 0); q.setFromEuler(e); m.compose(new THREE.Vector3(Math.cos(a) * d, h, Math.sin(a) * d), q, new THREE.Vector3(1, 0.7, 1)); inst.setMatrixAt(i, m); }
    inst.castShadow = false; inst.count = 0; g.add(inst);
    g.userData.fill = inst;
  }
  return g;
}
export function feedingStation(o = {}) {
  const g = group();
  // a little placemat shaped like a fish
  const c = T.canvas(256, 160), x = c.getContext('2d');
  x.fillStyle = '#c8684a'; x.beginPath(); x.ellipse(110, 80, 100, 66, 0, 0, 6.3); x.fill(); x.beginPath(); x.moveTo(190, 80); x.lineTo(250, 20); x.lineTo(250, 140); x.fill();
  x.fillStyle = '#e8b08a'; for (let i = 0; i < 30; i++) { x.beginPath(); x.arc(40 + (i % 6) * 26, 40 + Math.floor(i / 6) * 20, 5, 0, 6.3); x.fill(); }
  const mt = new THREE.MeshStandardMaterial({ map: T.toTex(c, { clamp: true }), roughness: 0.8, transparent: true, alphaTest: 0.3 });
  add(g, new THREE.PlaneGeometry(2.0, 1.25), mt, { pos: [0, 0.015, 0], rot: [-Math.PI / 2, 0, 0], cast: false });
  const food = bowl(o.food || PAL.teal); food.position.set(-0.45, 0.02, 0); g.add(food);
  const water = bowl(o.water || PAL.cream, { water: true, seed: 4 }); water.position.set(0.5, 0.02, 0); g.add(water);
  return info(g, { foot: [0, 0], extra: { food, water, station: 'food' } });
}
export function fountain() {
  const g = group();
  add(g, wobble(lathe([[0, 0], [0.55, 0], [0.62, 0.35], [0.55, 0.4], [0, 0.4]], 28), 0.01), M.cer(PAL.sage, { band: PAL.cream }));
  const w = add(g, new THREE.CircleGeometry(0.5, 24), M.water(), { pos: [0, 0.38, 0], rot: [-Math.PI / 2, 0, 0], cast: false });
  const bub = add(g, sphere(0.16, 16, 10), M.water(), { pos: [0, 0.42, 0], cast: false });
  add(g, cyl(0.05, 0.05, 0.25, 8), M.cer(PAL.cream), { pos: [0, 0.45, 0] });
  shadowBlob(g, 1.6, 1.6, { a: 0.35 });
  return info(g, { foot: [1.1, 1.1], extra: { bubble: bub, fill: w, fountain: true } });
}
export function autoFeeder() {
  const g = group();
  add(g, rbox(0.9, 1.2, 0.8, 0.2), M.enamel('#e6ddc9'), { pos: [0, 0.6, -0.1] });
  add(g, cyl(0.32, 0.32, 0.6, 18), M.glass(), { pos: [0, 1.5, -0.1], cast: false });
  add(g, cyl(0.3, 0.3, 0.45, 18), M.felt('#8a5a32', { rough: 0.7 }), { pos: [0, 1.42, -0.1] });
  add(g, cyl(0.34, 0.34, 0.08, 18), M.enamel(PAL.terracotta), { pos: [0, 1.82, -0.1] });
  const light = add(g, sphere(0.04, 8, 6), M.glow('#7fe07a', 1.4), { pos: [0.3, 0.95, 0.31], cast: false });
  shadowBlob(g, 1.4, 1.4, { a: 0.35 });
  return info(g, { foot: [1.0, 1.0], extra: { autofeeder: true, light } });
}
// ------------------------------------------------------------ litter
export function litterBox(o = {}) {
  const g = group(), w = 1.9, d = 1.4, h = 0.6;
  const plast = M.enamel(o.color || PAL.dusty);
  if (o.robot) {
    const dome = add(g, wobble(new THREE.SphereGeometry(1.05, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), 0.01), M.enamel('#e8e2d4'), { pos: [0, 0.35, 0] });
    dome.scale.set(1, 1.05, 0.85);
    add(g, rbox(2.1, 0.4, 1.8, 0.15), M.enamel('#cfc6b4'), { pos: [0, 0.2, 0] });
    add(g, new THREE.CircleGeometry(0.42, 24), M.plain('#2b2522', 0.9), { pos: [0, 0.75, 0.88], cast: false });
    const led = add(g, sphere(0.05, 8, 6), M.glow('#7fe07a', 1.6), { pos: [0.6, 0.42, 0.9], cast: false });
    shadowBlob(g, 2.6, 2.3, { a: 0.4 });
    return info(g, { foot: [2.1, 1.8], extra: { litter: true, robot: true, clumps: [], led } });
  }
  add(g, rbox(w, 0.08, d, 0.06), plast, { pos: [0, 0.04, 0] });
  for (const s of [-1, 1]) { add(g, rbox(0.08, h, d, 0.04), plast, { pos: [s * (w / 2 - 0.04), h / 2, 0] }); add(g, rbox(w, h, 0.08, 0.04), plast, { pos: [0, h / 2, s * (d / 2 - 0.04)] }); }
  const sand = mat({ tex: T.carpet('#d8cdb3', 80), scale: 0.7, rough: 1, bumpScale: 1.5 });
  add(g, rbox(w - 0.16, 0.36, d - 0.16, 0.02), sand, { pos: [0, 0.2, 0], cast: false });
  // clumps that show up as it gets used
  const clumps = [];
  const r = rng(o.seed || 3);
  for (let i = 0; i < 6; i++) { const c = add(g, wobble(sphere(0.09, 8, 6), 0.03, 6, i), M.felt('#a99472'), { pos: [(r() - 0.5) * (w - 0.5), 0.4, (r() - 0.5) * (d - 0.5)] }); c.visible = false; clumps.push(c); }
  // a scoop leaning on the side
  const sc = group(); sc.position.set(w / 2 + 0.15, 0, 0.2); sc.rotation.z = 0.25;
  add(sc, rbox(0.4, 0.04, 0.4, 0.03), M.enamel(PAL.mustard), { pos: [0, 0.05, 0] });
  add(sc, rbox(0.06, 0.6, 0.06, 0.02), M.enamel(PAL.mustard), { pos: [0, 0.35, -0.15] });
  g.add(sc);
  shadowBlob(g, 2.5, 2.0, { a: 0.4 });
  return info(g, { foot: [w + 0.2, d], extra: { litter: true, clumps } });
}
// ------------------------------------------------------------ scratching
export function scratchPost(o = {}) {
  const g = group(), h = o.h || 2.6;
  const carp = mat({ tex: T.carpet(o.color || PAL.oat, 81), scale: 0.8, rough: 1, bumpScale: 1.5 });
  add(g, wobble(rbox(1.3, 0.2, 1.3, 0.06), 0.01), carp, { pos: [0, 0.1, 0] });
  const rp = mat({ tex: T.rope(), scale: [0.6, 0.35], rough: 1, bumpScale: 2.5 });
  const post = add(g, cyl(0.24, 0.24, h, 20), rp, { pos: [0, h / 2 + 0.2, 0] });
  post.material = rp;
  add(g, wobble(rbox(1.0, 0.16, 1.0, 0.06), 0.01), carp, { pos: [0, h + 0.28, 0] });
  // pom on a string
  const str = add(g, cyl(0.01, 0.01, 0.8, 4), M.plain('#efe3c8'), { pos: [0.45, h - 0.05, 0.3], cast: false });
  const pom = add(g, wobble(sphere(0.12, 12, 8), 0.05, 6), M.felt(PAL.rose), { pos: [0.45, h - 0.48, 0.3] });
  shadowBlob(g, 1.8, 1.8, { a: 0.45 });
  return info(g, {
    foot: [1.3, 1.3],
    perches: [{ x: 0, y: h + 0.36, z: 0, kind: 'post', cap: 1 }],
    scratch: [{ x: 0, y: 1.0, z: 0.26, nx: 0, nz: 1, post: true }],
    extra: { post: true, pom, str },
  });
}
export function scratchPad() {
  const g = group();
  const card = M.card('SCRATCH');
  const geo = new THREE.BufferGeometry();
  const shape = new THREE.Shape(); shape.moveTo(-0.8, 0); shape.lineTo(0.8, 0); shape.lineTo(0.8, 0.12); shape.lineTo(-0.8, 0.55); shape.closePath();
  const ex = new THREE.ExtrudeGeometry(shape, { depth: 0.9, bevelEnabled: false }); ex.translate(0, 0, -0.45);
  add(g, ex, card);
  const top = mat({ tex: T.rope('#b98b57', 82), scale: [0.3, 0.2], rough: 1, bumpScale: 2 });
  const t = add(g, new THREE.PlaneGeometry(1.66, 0.88), top, { pos: [0, 0.34, 0], cast: false }); t.rotation.set(-Math.PI / 2 + 0.27, 0, 0); t.rotation.order = 'XYZ'; t.rotation.z = 0;
  shadowBlob(g, 2.0, 1.4, { a: 0.35 });
  return info(g, { foot: [1.6, 0.9], scratch: [{ x: 0, y: 0.35, z: 0, nx: 0, nz: 1, post: true, low: true }], extra: { post: true } });
}
export function catTree(o = {}) {
  const big = !!o.big, g = group();
  const carp = mat({ tex: T.carpet(o.color || PAL.oat, 83), scale: 0.8, rough: 1, bumpScale: 1.5 });
  const carp2 = mat({ tex: T.carpet(o.color2 || PAL.sage, 84), scale: 0.8, rough: 1, bumpScale: 1.5 });
  const rp = mat({ tex: T.rope(), scale: [0.6, 0.35], rough: 1, bumpScale: 2.5 });
  add(g, wobble(rbox(2.4, 0.22, 2.0, 0.08), 0.01), carp, { pos: [0, 0.11, 0] });
  const levels = big ? [1.8, 3.4, 5.0, 6.4] : [1.6, 3.2];
  const perches = [];
  // condo
  add(g, wobble(rbox(1.2, 1.2, 1.2, 0.1), 0.02), carp2, { pos: [-0.5, 0.82, 0] });
  add(g, new THREE.CircleGeometry(0.34, 20), M.plain('#2d2420', 1), { pos: [-0.5, 0.78, 0.605], cast: false });
  for (let i = 0; i < levels.length; i++) {
    const y = levels[i], x = i % 2 ? -0.55 : 0.55;
    add(g, cyl(0.2, 0.2, y - (i ? levels[i - 1] : 0.2), 16), rp, { pos: [x * 0.6, (y + (i ? levels[i - 1] : 0.2)) / 2, -0.2] });
    if (i === levels.length - 1) {
      const bed = add(g, new THREE.TorusGeometry(0.55, 0.22, 12, 24), carp, { pos: [x, y + 0.2, 0], rot: [Math.PI / 2, 0, 0] });
      add(g, cyl(0.6, 0.6, 0.18, 22), carp2, { pos: [x, y + 0.08, 0] });
      perches.push({ x, y: y + 0.18, z: 0, kind: 'tree', cap: 1, nap: 3 });
    } else {
      add(g, wobble(rbox(1.5, 0.18, 1.4, 0.07), 0.01), i % 2 ? carp2 : carp, { pos: [x, y, 0] });
      perches.push({ x, y: y + 0.09, z: 0.1, kind: 'tree', cap: 1, nap: 1 });
    }
  }
  if (big) { // a hammock between two posts
    const hm = add(g, new THREE.SphereGeometry(0.7, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.fab(PAL.mustard, { pattern: 'stripe', scale: 0.7 }), { pos: [0.6, 2.4, 0.2] });
    hm.scale.set(1, 0.4, 0.8); hm.material = hm.material.clone(); hm.material.side = THREE.DoubleSide;
    perches.push({ x: 0.6, y: 2.25, z: 0.2, kind: 'tree', cap: 1, nap: 3 });
  }
  // dangling mouse
  const pom = add(g, wobble(sphere(0.12, 10, 8), 0.04, 6), M.felt(PAL.terracotta), { pos: [0.95, levels[0] - 0.5, 0.5] });
  shadowBlob(g, 3.0, 2.6, { a: 0.5 });
  return info(g, {
    foot: [2.4, 2.0], perches,
    scratch: [{ x: 0.33, y: 1.0, z: 0.05, nx: 0, nz: 1, post: true }],
    extra: { post: true, tree: true, pom, hide: { x: -0.5, z: 0.4 } },
  });
}
// ------------------------------------------------------------ comfort
export function catBed(o = {}) {
  const g = group();
  const kn = M.knit(o.color || PAL.terracotta, { b: o.b });
  const ring = new THREE.TorusGeometry(0.75, 0.3, 14, 28); ring.rotateX(Math.PI / 2);
  add(g, wobble(ring, 0.05, 2), kn, { pos: [0, 0.3, 0] });
  add(g, puff(new THREE.CylinderGeometry(0.8, 0.8, 0.2, 26), 0.2, 0.06, 0.02), M.fab(o.inner || PAL.cream, { pattern: 'gingham', scale: 0.6 }), { pos: [0, 0.12, 0] });
  if (o.heated) { add(g, cyl(0.02, 0.02, 1.2, 4), M.plain('#2b2522'), { pos: [0.9, 0.02, 0.2], rot: [0, 0, Math.PI / 2], cast: false }); add(g, sphere(0.05, 8, 6), M.glow('#ff8a5a', 1.6), { pos: [0.75, 0.34, 0.55], cast: false }); }
  shadowBlob(g, 2.3, 2.3, { a: 0.45 });
  return info(g, { foot: [0, 0], perches: [{ x: 0, y: 0.24, z: 0, kind: 'bed', cap: 1, nap: o.heated ? 5 : 3, low: true }], extra: { bed: true, heated: !!o.heated } });
}
export function windowPerch(o = {}) {
  const g = group();
  add(g, rbox(1.8, 0.12, 1.0, 0.05), M.wood(PAL.oak, 85), { pos: [0, 0, 0.5] });
  for (const s of [-1, 1]) { const b = add(g, rbox(0.08, 0.7, 0.08, 0.02), M.metal('#8c8a82'), { pos: [s * 0.7, -0.3, 0.55] }); b.rotation.x = 0.7; }
  add(g, puff(rbox(1.65, 0.16, 0.9, 0.07, 3), 0.16, 0.06, 0.02), M.fab(o.color || PAL.dusty, { pattern: 'stripe', b: PAL.cream, scale: 0.8 }), { pos: [0, 0.12, 0.5] });
  return info(g, { foot: [0, 0], perches: [{ x: 0, y: 0.22, z: 0.5, kind: 'perch', cap: 1, nap: 4, sunny: true }], extra: { perch: true } });
}
export function box(o = {}) {
  const g = group(), w = o.w || 1.5, d = o.d || 1.2, h = o.h || 0.85;
  const card = M.card(o.print);
  add(g, rbox(w, 0.04, d, 0.01), card, { pos: [0, 0.02, 0] });
  for (const s of [-1, 1]) { add(g, wobble(rbox(0.04, h, d, 0.01), 0.01), card, { pos: [s * w / 2, h / 2, 0] }); add(g, wobble(rbox(w, h, 0.04, 0.01), 0.01), card, { pos: [0, h / 2, s * d / 2] }); }
  // flaps flopped open
  for (const s of [-1, 1]) { const f = add(g, rbox(w, 0.03, d / 2, 0.01), card, { pos: [0, h, s * (d / 2 + d / 4 - 0.05)] }); f.rotation.x = s * 0.5; f.position.y += 0.12; }
  for (const s of [-1, 1]) { const f = add(g, rbox(w / 2, 0.03, d, 0.01), card, { pos: [s * (w / 2 + w / 4 - 0.05), h + 0.1, 0] }); f.rotation.z = -s * 0.6; }
  shadowBlob(g, w + 0.6, d + 0.6, { a: 0.45 });
  return info(g, { foot: [w, d], perches: [{ x: 0, y: 0.15, z: 0, kind: 'box', cap: 1, nap: 2, inside: true }], extra: { box: true } });
}
export function paperBag() {
  const g = group();
  const m = mat({ tex: T.weave('#c49a64', 86, { cell: 2 }), scale: 1, rough: 0.95, bumpScale: 0.6 });
  const geo = wobble(new THREE.CylinderGeometry(0.55, 0.55, 1.0, 4, 3, true), 0.06, 3); geo.rotateY(Math.PI / 4); geo.rotateZ(Math.PI / 2);
  const b = add(g, geo, m, { pos: [0, 0.45, 0] }); b.material = m.clone(); b.material.side = THREE.DoubleSide; b.scale.set(1.1, 0.9, 1.2);
  add(g, new THREE.PlaneGeometry(0.75, 0.75), M.plain('#2a201a'), { pos: [-0.55, 0.45, 0], rot: [0, -Math.PI / 2, 0], cast: false });
  shadowBlob(g, 1.6, 1.4, { a: 0.4 });
  return info(g, { foot: [1.1, 0.9], perches: [{ x: 0, y: 0.06, z: 0, kind: 'box', cap: 1, nap: 1, inside: true }], extra: { box: true, bag: true } });
}
export function tunnel() {
  const g = group();
  const pts = [new THREE.Vector3(-1.6, 0.42, 0), new THREE.Vector3(-0.5, 0.42, 0.35), new THREE.Vector3(0.6, 0.42, -0.2), new THREE.Vector3(1.6, 0.42, 0.1)];
  const curve = new THREE.CatmullRomCurve3(pts);
  const tm = M.fab(PAL.teal, { pattern: 'stripe', b: PAL.dusty, scale: 0.6 });
  const t = add(g, new THREE.TubeGeometry(curve, 40, 0.42, 16, false), tm); t.material = tm.clone(); t.material.side = THREE.DoubleSide;
  for (let i = 0; i <= 10; i++) { const p = curve.getPoint(i / 10), tn = curve.getTangent(i / 10); const ring = add(g, new THREE.TorusGeometry(0.43, 0.025, 6, 18), M.plain('#36504e'), { pos: [p.x, p.y, p.z], cast: false }); ring.lookAt(p.clone().add(tn)); }
  shadowBlob(g, 4, 1.6, { a: 0.4 });
  return info(g, { foot: [3.4, 1.0], extra: { tunnel: true, hide: { x: 0.6, z: -0.2 }, curve } });
}
export function fishTank() {
  const g = group(), wd = M.wood(PAL.walnut, 87);
  add(g, rbox(2.6, 1.9, 1.2, 0.05), wd, { pos: [0, 0.95, 0] });
  add(g, rbox(2.4, 1.3, 1.0, 0.04), M.glass(), { pos: [0, 2.55, 0], cast: false });
  add(g, rbox(2.3, 1.0, 0.9, 0.03), mat({ key: 'tankwater', color: '#7fb0b0', rough: 0.1, transparent: true, opacity: 0.35, depthWrite: false }), { pos: [0, 2.45, 0], cast: false });
  add(g, rbox(2.3, 0.15, 0.9, 0.03), mat({ tex: T.carpet('#b9a98c', 88), scale: 0.4 }), { pos: [0, 1.98, 0] });
  const lm = mat({ tex: T.leaf('#5f8a4a', 'long', 89), alphaTest: 0.5, side: THREE.DoubleSide, rough: 0.6, clampTex: true });
  for (let i = 0; i < 6; i++) add(g, new THREE.PlaneGeometry(0.15, 0.8), lm, { pos: [-0.9 + i * 0.35, 2.4, -0.3 + (i % 2) * 0.2], rot: [0, i, 0.1], cast: false });
  const fish = [];
  for (let i = 0; i < 4; i++) {
    const f = group();
    add(f, sphere(0.1, 10, 8), M.felt([PAL.mustard, PAL.terracotta, PAL.rose, '#e8813a'][i], { rough: 0.5 }), { scale: [1.6, 1, 0.6], cast: false });
    add(f, new THREE.ConeGeometry(0.08, 0.14, 4), M.felt(PAL.terracotta), { pos: [-0.18, 0, 0], rot: [0, 0, Math.PI / 2], cast: false });
    f.position.set(0, 2.4, 0); g.add(f); fish.push({ m: f, a: i * 1.6, s: 0.5 + i * 0.12, y: 2.2 + i * 0.12 });
  }
  add(g, rbox(2.5, 0.12, 1.1, 0.04), wd, { pos: [0, 3.27, 0] });
  shadowBlob(g, 3.2, 1.8, { a: 0.45 });
  return info(g, { foot: [2.6, 1.2], perches: [{ x: 0.5, y: 3.33, z: 0, kind: 'tank', cap: 1 }], extra: { fish, tv: true, watch: { x: 0, z: 1.1 } } });
}
export function birdFeeder() {
  // mounted outside a window; birds come and go
  const g = group();
  add(g, cyl(0.04, 0.04, 2.6, 6), M.wood('#5d4632', 90), { pos: [0, 1.3, 0] });
  add(g, rbox(0.7, 0.5, 0.5, 0.05), M.wood(PAL.pine, 91), { pos: [0, 2.6, 0] });
  const roof = add(g, new THREE.ConeGeometry(0.6, 0.4, 4), M.paint(PAL.terracotta, 92), { pos: [0, 3.05, 0], rot: [0, Math.PI / 4, 0] });
  const birds = [];
  for (let i = 0; i < 2; i++) {
    const b = group();
    add(b, sphere(0.13, 12, 10), M.felt(i ? '#c8684a' : '#7f98a5'), { scale: [1.2, 1, 1] });
    add(b, sphere(0.09, 10, 8), M.felt(i ? '#c8684a' : '#7f98a5'), { pos: [0.13, 0.1, 0] });
    add(b, new THREE.ConeGeometry(0.03, 0.08, 4), M.plain(PAL.mustard), { pos: [0.23, 0.1, 0], rot: [0, 0, -Math.PI / 2] });
    add(b, new THREE.ConeGeometry(0.06, 0.18, 4), M.felt(PAL.charcoal), { pos: [-0.16, 0.04, 0], rot: [0, 0, Math.PI / 2 + 0.4] });
    b.position.set(i ? -0.3 : 0.3, 2.4, 0.3); b.visible = false; g.add(b); birds.push(b);
  }
  return info(g, { foot: [0, 0], extra: { birds, feeder: true } });
}
export function wallShelves() {
  const g = group(), wd = M.wood(PAL.oak, 93), perches = [];
  const steps = [[-1.5, 2.2], [-0.4, 3.3], [0.7, 4.4], [1.8, 5.5], [0.4, 6.4]];
  for (const [x, y] of steps) { add(g, wobble(rbox(1.2, 0.14, 1.0, 0.05), 0.01), wd, { pos: [x, y, 0.5] }); add(g, rbox(0.9, 0.08, 0.95, 0.02), M.fab(PAL.sage, { scale: 0.6 }), { pos: [x, y + 0.1, 0.5] }); perches.push({ x, y: y + 0.14, z: 0.5, kind: 'shelf', cap: 1, nap: 1 }); }
  return info(g, { foot: [0, 0], perches, extra: { shelves: true } });
}
export function robotVacuum() {
  const g = group();
  add(g, cyl(0.6, 0.62, 0.25, 30), M.enamel('#3d3b3a'), { pos: [0, 0.15, 0] });
  add(g, cyl(0.5, 0.5, 0.03, 30), M.metal('#6b6a66'), { pos: [0, 0.29, 0] });
  const led = add(g, sphere(0.04, 8, 6), M.glow('#7fd0ff', 1.6), { pos: [0, 0.3, 0.42], cast: false });
  shadowBlob(g, 1.6, 1.6, { a: 0.45 });
  return info(g, { foot: [0, 0], perches: [{ x: 0, y: 0.3, z: 0, kind: 'ride', cap: 1 }], extra: { vacuum: true, led } });
}
export function catGrass() {
  const g = group();
  add(g, lathe([[0, 0], [0.3, 0], [0.34, 0.35], [0, 0.35]], 18), M.cer(PAL.cream, { band: PAL.sage }));
  const gm = M.plain('#86a453', 0.7);
  const r = rng(94);
  const blades = new THREE.InstancedMesh(new THREE.ConeGeometry(0.02, 0.5, 3), gm, 60);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < 60; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 0.27; e.set((r() - 0.5) * 0.5, 0, (r() - 0.5) * 0.5); q.setFromEuler(e); m.compose(new THREE.Vector3(Math.cos(a) * d, 0.55, Math.sin(a) * d), q, new THREE.Vector3(1, 0.7 + r() * 0.6, 1)); blades.setMatrixAt(i, m); }
  g.add(blades);
  shadowBlob(g, 1, 1, { a: 0.35 });
  return info(g, { foot: [0, 0], extra: { grass: true } });
}
export function toyBall(col) {
  const g = group();
  const c = T.canvas(128, 64), x = c.getContext('2d'); x.fillStyle = col; x.fillRect(0, 0, 128, 64); x.fillStyle = '#efe3c8'; for (let i = 0; i < 4; i++) x.fillRect(i * 32 + 8, 0, 10, 64);
  add(g, sphere(0.16, 16, 12), new THREE.MeshStandardMaterial({ map: T.toTex(c), roughness: 0.6 }), { pos: [0, 0.16, 0] });
  return info(g, { foot: [0, 0], extra: { toy: 'ball' } });
}
export function toyMouse(col = '#9c958b') {
  const g = group();
  const f = M.felt(col);
  add(g, sphere(0.16, 14, 10), f, { pos: [0, 0.12, 0], scale: [1, 0.75, 1.5] });
  for (const s of [-1, 1]) add(g, sphere(0.07, 10, 8), M.felt(PAL.rose), { pos: [s * 0.08, 0.22, 0.12], scale: [1, 1, 0.4] });
  add(g, new THREE.TorusGeometry(0.15, 0.012, 4, 12, Math.PI), M.plain('#d9c7a0'), { pos: [0, 0.08, -0.35], rot: [Math.PI / 2, 0, 0], cast: false });
  add(g, sphere(0.02, 6, 4), M.plain('#2e2622'), { pos: [0, 0.14, 0.24] });
  return info(g, { foot: [0, 0], extra: { toy: 'mouse' } });
}
// a woven basket full of toys, the room's toy supply
export function toyBasket() {
  const g = group();
  const wick = mat({ tex: T.weave('#c7a26a', 95, { cell: 8 }), scale: 0.6, rough: 0.9, bumpScale: 3 });
  add(g, wobble(lathe([[0, 0], [0.55, 0], [0.62, 0.6], [0.66, 0.64], [0.6, 0.64], [0.52, 0.06], [0, 0.06]], 24), 0.02, 2), wick);
  const b = toyBall(PAL.terracotta); b.position.set(-0.15, 0.45, 0); g.add(b);
  const m = toyMouse(); m.position.set(0.18, 0.5, 0.05); m.rotation.y = 0.7; g.add(m);
  add(g, cyl(0.012, 0.012, 1.2, 4), M.wood(PAL.pine, 96), { pos: [0.1, 0.9, -0.2], rot: [0.3, 0, -0.3] });
  shadowBlob(g, 1.6, 1.6, { a: 0.4 });
  return info(g, { foot: [1.2, 1.2], extra: { toys: true } });
}

// ------------------------------------------------------------ messes
const MESS_MATS = {};
function decal(col, alpha = 0.75, kind = 'puddle') {
  const key = col + alpha + kind; if (MESS_MATS[key]) return MESS_MATS[key];
  const c = T.canvas(128), x = c.getContext('2d'), r = rng(col.length * 13);
  x.fillStyle = col; x.beginPath();
  for (let i = 0; i <= 24; i++) { const a = i / 24 * 6.283, rr = 46 + (r() - 0.5) * 22; x.lineTo(64 + Math.cos(a) * rr, 64 + Math.sin(a) * rr * 0.8); }
  x.fill();
  x.fillStyle = 'rgba(255,255,255,.5)'; x.beginPath(); x.ellipse(50, 50, 14, 6, -0.4, 0, 6.3); x.fill();
  const m = new THREE.MeshStandardMaterial({ map: T.toTex(c, { clamp: true }), transparent: true, opacity: alpha, roughness: 0.08, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  return (MESS_MATS[key] = m);
}
export function mess(kind) {
  const g = group(), r = rng(Math.floor(Math.random() * 1e6));
  const flat = (col, s, a) => { const d = add(g, new THREE.PlaneGeometry(s, s * 0.8), decal(col, a), { rot: [-Math.PI / 2, 0, r() * 6], pos: [0, 0.025, 0], cast: false }); d.renderOrder = 2; return d; };
  if (kind === 'spill') { flat('#9fc0c8', 1.3, 0.55); }
  if (kind === 'shards' || kind === 'spill') {
    for (let i = 0; i < 7; i++) add(g, new THREE.TetrahedronGeometry(0.08 + r() * 0.06), M.glass(), { pos: [(r() - 0.5) * 0.9, 0.04, (r() - 0.5) * 0.7], rot: [r() * 3, r() * 3, r() * 3], cast: false });
  }
  if (kind === 'broken') { // ceramic pieces
    const col = [PAL.mustard, PAL.teal, PAL.rose, PAL.cream][Math.floor(r() * 4)];
    for (let i = 0; i < 6; i++) add(g, wobble(new THREE.SphereGeometry(0.12 + r() * 0.08, 6, 4, 0, 2, 0, 1.4), 0.03), M.cer(col), { pos: [(r() - 0.5) * 0.9, 0.04, (r() - 0.5) * 0.7], rot: [r() * 3, r() * 3, r() * 3] });
    flat('#8a6a4a', 0.9, 0.3);
  }
  if (kind === 'soil') {
    flat('#4a3424', 1.4, 0.85);
    add(g, wobble(sphere(0.35, 12, 8), 0.12, 3), M.felt('#4a3424'), { pos: [0, 0.02, 0], scale: [1.2, 0.35, 1] });
    for (let i = 0; i < 3; i++) add(g, wobble(new THREE.SphereGeometry(0.2, 6, 4, 0, 2, 0, 1.4), 0.03), M.cer(PAL.terracotta), { pos: [(r() - 0.5) * 1, 0.05, (r() - 0.5) * 0.8], rot: [r() * 3, r() * 3, r() * 3] });
    const lm = mat({ tex: T.leaf('#5f7d44', 'round', 5), alphaTest: 0.5, side: THREE.DoubleSide, rough: 0.6, clampTex: true });
    for (let i = 0; i < 4; i++) add(g, new THREE.PlaneGeometry(0.4, 0.5), lm, { pos: [(r() - 0.5) * 1.2, 0.04, (r() - 0.5) * 0.9], rot: [-Math.PI / 2, 0, r() * 6], cast: false });
  }
  if (kind === 'hairball') { add(g, wobble(sphere(0.16, 12, 8), 0.08, 5), M.felt('#7a6650', { rough: 1 }), { pos: [0, 0.08, 0], scale: [1.4, 0.7, 1] }); flat('#b8a27a', 0.6, 0.4); }
  if (kind === 'fur') { for (let i = 0; i < 4; i++) add(g, wobble(sphere(0.14 + r() * 0.1, 10, 8), 0.1, 4, i), M.felt(['#cdb9a0', '#e6dccb', '#8c7a68'][i % 3], { rough: 1 }), { pos: [(r() - 0.5) * 1.4, 0.1, (r() - 0.5) * 1], scale: [1, 0.7, 1] }); }
  if (kind === 'crumbs') { for (let i = 0; i < 14; i++) add(g, wobble(new THREE.BoxGeometry(0.08 + r() * 0.1, 0.06, 0.08 + r() * 0.1), 0.02), M.felt(i % 4 ? '#c98b4a' : '#efd9b0'), { pos: [(r() - 0.5) * 1.2, 0.04, (r() - 0.5) * 0.9], rot: [0, r() * 3, 0], cast: false }); }
  if (kind === 'kibble') { for (let i = 0; i < 26; i++) add(g, kibbleGeo, M.felt('#8a5a32', { rough: 0.7 }), { pos: [(r() - 0.5) * 1.8, 0.04, (r() - 0.5) * 1.2], rot: [r() * 3, r() * 3, 0], cast: false }); }
  if (kind === 'puddle') { flat('#d8c46a', 1.0, 0.55); }
  if (kind === 'yarn') { const k = add(g, new THREE.TorusKnotGeometry(0.22, 0.06, 64, 6, 2, 3), M.felt(PAL.rose), { pos: [0, 0.25, 0] }); add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.05, 0), new THREE.Vector3(0.6, 0.03, 0.3), new THREE.Vector3(1.0, 0.03, -0.2), new THREE.Vector3(1.4, 0.03, 0.2)]), 20, 0.03, 4), M.felt(PAL.rose), { cast: false }); }
  if (kind === 'trash') { for (let i = 0; i < 5; i++) add(g, wobble(sphere(0.13, 8, 6), 0.08, 5, i), M.plain(['#efe7d8', '#e0d3b8', '#c8b89a'][i % 3], 0.9), { pos: [(r() - 0.5) * 1.4, 0.1, (r() - 0.5) * 1] }); add(g, new THREE.TorusGeometry(0.15, 0.05, 6, 12, Math.PI), M.felt(PAL.mustard), { pos: [0.3, 0.05, 0.2], rot: [Math.PI / 2, 0, 1] }); }
  if (kind === 'books') { for (let i = 0; i < 4; i++) add(g, rbox(0.7, 0.14, 0.5, 0.02), M.plain([PAL.terracotta, PAL.teal, PAL.mustard, PAL.plum][i], 0.8), { pos: [(r() - 0.5) * 1, 0.07 + (i > 2 ? 0.14 : 0), (r() - 0.5) * 0.7], rot: [0, r() * 3, 0] }); }
  if (kind === 'leaves') { const lm = mat({ tex: T.leaf('#5f7d44', 'round', 5), alphaTest: 0.5, side: THREE.DoubleSide, rough: 0.6, clampTex: true }); for (let i = 0; i < 6; i++) add(g, new THREE.PlaneGeometry(0.3, 0.35), lm, { pos: [(r() - 0.5) * 1, 0.04, (r() - 0.5) * 0.8], rot: [-Math.PI / 2, 0, r() * 6], cast: false }); }
  if (kind === 'flowers') { flat('#9fc0c8', 1.1, 0.5); for (let i = 0; i < 5; i++) add(g, sphere(0.08, 8, 6), M.felt([PAL.mustard, PAL.rose, PAL.cream][i % 3]), { pos: [(r() - 0.5) * 1, 0.05, (r() - 0.5) * 0.8] }); }
  g.userData = { mess: kind };
  return g;
}
// torn-fabric scratch marks that stick to furniture
let clawTex = null;
export function clawMark(w = 0.6, h = 0.6) {
  if (!clawTex) {
    const c = T.canvas(128), x = c.getContext('2d'), r = rng(99);
    for (let k = 0; k < 4; k++) {
      const X = 28 + k * 22;
      x.strokeStyle = 'rgba(40,28,20,.75)'; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(X, 12 + r() * 10); x.quadraticCurveTo(X + 6, 64, X + 2, 112 - r() * 10); x.stroke();
      for (let i = 0; i < 18; i++) { x.strokeStyle = 'rgba(240,226,200,.9)'; x.lineWidth = 1.2; const yy = 16 + r() * 96; x.beginPath(); x.moveTo(X + 1, yy); x.lineTo(X + (r() - 0.5) * 18, yy + (r() - 0.3) * 10); x.stroke(); }
    }
    clawTex = T.toTex(c, { clamp: true });
  }
  const m = new THREE.MeshStandardMaterial({ map: clawTex, transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -4 });
  const d = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); d.renderOrder = 3; d.raycast = () => {};
  const fluff = new THREE.Mesh(wobble(sphere(0.06, 8, 6), 0.03, 6), M.felt('#efe3c8'));
  fluff.position.set(0.12, -0.18, 0.04); d.add(fluff);
  return d;
}

// ------------------------------------------------------------ presents
export const GIFTS = [
  { id: 'sock', name: 'A lone sock', note: 'Its partner is still out there.' },
  { id: 'cap', name: 'A bottle cap', note: 'Shiny, therefore precious.' },
  { id: 'tie', name: 'A hair tie', note: 'You had nine. Now you have this one.' },
  { id: 'leaf', name: 'A crunchy leaf', note: 'Hunted from the doormat.' },
  { id: 'feather', name: 'A feather', note: 'No birds were harmed. Probably.' },
  { id: 'mouse', name: 'A toy mouse', note: 'Proudly “caught”.' },
  { id: 'acorn', name: 'An acorn', note: 'Batted all the way from the garden.' },
  { id: 'button', name: 'A button', note: 'From your good coat.' },
  { id: 'ribbon', name: 'A ribbon', note: 'From a present that wasn’t theirs.' },
  { id: 'crayon', name: 'A crayon', note: 'Burnt orange. Their colour.' },
  { id: 'flower', name: 'A flower', note: 'Picked from your windowbox. For you!' },
  { id: 'shell', name: 'A snail shell', note: 'Empty, thankfully.' },
  { id: 'marble', name: 'A marble', note: 'Heard at 3am, rolling.' },
  { id: 'pinecone', name: 'A pine cone', note: 'Lightly chewed.' },
  { id: 'cork', name: 'A wine cork', note: 'The best toy money can’t buy.' },
  { id: 'duck', name: 'A rubber duck', note: 'Squeaks once, then never again.' },
  { id: 'string', name: 'A piece of string', note: 'Simply the best thing in the world.' },
  { id: 'twisty', name: 'A bread tie', note: 'Stolen from the Cat Bakery bag.' },
  { id: 'key', name: 'Your spare key', note: 'So that is where it went.' },
  { id: 'pompom', name: 'A pom-pom', note: 'Off the top of your winter hat.' },
];
export function giftMesh(id) {
  const g = group();
  const c = { sock: PAL.rose, cap: '#c9a54a', tie: PAL.plum, leaf: PAL.ochre, feather: '#efe3c8', mouse: '#9c958b', acorn: '#8a5a32', button: PAL.teal, ribbon: PAL.terracotta, crayon: '#c8683a', flower: PAL.mustard, shell: '#e6cfa8', marble: '#7fb0c0', pinecone: '#6b4a32', cork: '#c9a36a', duck: '#e8c33a', string: '#d9c7a0', twisty: '#d4a737', key: '#c9a54a', pompom: PAL.mustard }[id] || PAL.rose;
  const f = M.felt(c, { rough: 0.7 });
  if (id === 'sock') { add(g, rbox(0.5, 0.12, 0.2, 0.06), f, { pos: [0, 0.06, 0] }); add(g, rbox(0.2, 0.12, 0.35, 0.06), f, { pos: [0.2, 0.06, 0.15] }); }
  else if (id === 'cap') add(g, cyl(0.12, 0.12, 0.06, 14), M.metal(c), { pos: [0, 0.03, 0] });
  else if (id === 'tie' || id === 'ribbon') add(g, new THREE.TorusGeometry(0.12, 0.03, 6, 16), f, { pos: [0, 0.03, 0], rot: [Math.PI / 2, 0, 0] });
  else if (id === 'leaf' || id === 'feather') { const L = add(g, new THREE.PlaneGeometry(0.25, 0.4), mat({ tex: T.leaf(c, 'long', 97), alphaTest: 0.5, side: THREE.DoubleSide, clampTex: true }), { pos: [0, 0.03, 0], rot: [-Math.PI / 2, 0, 0.5] }); }
  else if (id === 'mouse') { const m = toyMouse(); g.add(m); }
  else if (id === 'duck') { add(g, sphere(0.15, 12, 10), f, { pos: [0, 0.12, 0], scale: [1.3, 0.9, 1] }); add(g, sphere(0.1, 10, 8), f, { pos: [0.12, 0.25, 0] }); add(g, new THREE.ConeGeometry(0.04, 0.1, 6), M.felt(PAL.terracotta), { pos: [0.24, 0.25, 0], rot: [0, 0, -Math.PI / 2] }); }
  else if (id === 'crayon' || id === 'cork' || id === 'key' || id === 'twisty' || id === 'string') add(g, cyl(0.05, 0.05, 0.4, 8), id === 'key' ? M.metal(c) : f, { pos: [0, 0.05, 0], rot: [0, 0.6, Math.PI / 2] });
  else add(g, wobble(sphere(0.12, 12, 10), id === 'pinecone' || id === 'pompom' ? 0.06 : 0.01, 6), f, { pos: [0, 0.12, 0] });
  // a little sparkle so it gets noticed
  g.userData = { gift: id };
  return g;
}
