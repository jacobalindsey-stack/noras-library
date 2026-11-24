// Life with Cats — shapes and materials. Everything is a little soft and a
// little uneven, like a handmade set: rounded boxes, puffed cushions, and a
// whisper of wobble in the surfaces.
import * as THREE from '../lib/three.module.min.js';
import { NOISE, hashStr } from './util.js';
import * as T from './tex.js';

const V = new THREE.Vector3(), N = new THREE.Vector3();

// rounded box with world-unit box-projected UVs (1 uv = 1 unit)
export function rbox(w, h, d, r = 0.08, seg = 3) {
  const s = seg * 2 + 1;
  r = Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3);
  const g = new THREE.BoxGeometry(1, 1, 1, s, s, s).toNonIndexed();
  const P = g.attributes.position.array, Nn = g.attributes.normal.array, U = g.attributes.uv.array;
  const half = 0.5 / s, bx = w / 2 - r, by = h / 2 - r, bz = d / 2 - r;
  for (let i = 0, j = 0; i < P.length; i += 3, j += 2) {
    V.fromArray(P, i);
    N.copy(V); N.x -= Math.sign(N.x) * half; N.y -= Math.sign(N.y) * half; N.z -= Math.sign(N.z) * half; N.normalize();
    const x = bx * Math.sign(V.x) + N.x * r, y = by * Math.sign(V.y) + N.y * r, z = bz * Math.sign(V.z) + N.z * r;
    P[i] = x; P[i + 1] = y; P[i + 2] = z; Nn[i] = N.x; Nn[i + 1] = N.y; Nn[i + 2] = N.z;
  }
  boxUV(g);
  return g;
}
// project UVs from the dominant normal axis, in world units
export function boxUV(g, scale = 1) {
  const P = g.attributes.position.array, Nn = g.attributes.normal.array;
  let U = g.attributes.uv ? g.attributes.uv.array : null;
  if (!U || U.length !== P.length / 3 * 2) { U = new Float32Array(P.length / 3 * 2); g.setAttribute('uv', new THREE.BufferAttribute(U, 2)); }
  for (let i = 0, j = 0; i < P.length; i += 3, j += 2) {
    const ax = Math.abs(Nn[i]), ay = Math.abs(Nn[i + 1]), az = Math.abs(Nn[i + 2]);
    let u, v;
    if (ax >= ay && ax >= az) { u = P[i + 2] * Math.sign(Nn[i]); v = P[i + 1]; }
    else if (ay >= az) { u = P[i]; v = P[i + 2] * -Math.sign(Nn[i + 1]); }
    else { u = P[i] * -Math.sign(Nn[i + 2]) * -1; v = P[i + 1]; }
    U[j] = u * scale; U[j + 1] = v * scale;
  }
  g.attributes.uv.needsUpdate = true;
  return g;
}
// puff the top face up like a cushion (and round its belly a bit)
export function puff(g, h, amt = 0.12, side = 0.04) {
  const P = g.attributes.position.array;
  g.computeBoundingBox(); const bb = g.boundingBox;
  const hw = (bb.max.x - bb.min.x) / 2, hd = (bb.max.z - bb.min.z) / 2;
  for (let i = 0; i < P.length; i += 3) {
    const nx = P[i] / hw, nz = P[i + 2] / hd, ny = (P[i + 1] - bb.min.y) / (bb.max.y - bb.min.y);
    const f = Math.max(0, 1 - nx * nx) * Math.max(0, 1 - nz * nz);
    P[i + 1] += amt * f * ny;
    const sideBulge = side * Math.sin(ny * Math.PI);
    P[i] += Math.sign(P[i]) * sideBulge * (1 - nz * nz * 0.5); P[i + 2] += Math.sign(P[i + 2]) * sideBulge * (1 - nx * nx * 0.5);
  }
  g.computeVertexNormals();
  return g;
}
// a handmade wobble: same offset for the same point, so seams stay shut
export function wobble(g, amt = 0.02, freq = 1.6, seed = 0) {
  const P = g.attributes.position.array;
  for (let i = 0; i < P.length; i += 3) {
    const x = P[i], y = P[i + 1], z = P[i + 2];
    const n1 = NOISE.n2(x * freq + seed * 7.1 + z * 0.7, y * freq + 3.3) - 0.5;
    const n2 = NOISE.n2(z * freq + 11.7 + seed, y * freq * 1.3 + x * 0.5) - 0.5;
    const n3 = NOISE.n2(x * freq + 5.1, z * freq + 9.9 + seed) - 0.5;
    P[i] += n1 * amt; P[i + 1] += n3 * amt * 0.6; P[i + 2] += n2 * amt;
  }
  g.computeVertexNormals();
  return g;
}
export function cyl(rt, rb, h, seg = 20, open = false) { const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1, open); return g; }
export function lathe(pts, seg = 28) { return new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg); }
export function sphere(r, ws = 24, hs = 16) { return new THREE.SphereGeometry(r, ws, hs); }

// ------------------------------------------------------------- materials
const MATS = new Map();
function texWith(t, scale, key) {
  if (!t) return null;
  const c = t.clone(); c.repeat.set(1 / scale[0], 1 / scale[1]); c.needsUpdate = true; return c;
}
// tex: a { map, bump } pair from tex.js. scale: units per tile.
export function mat(o = {}) {
  const key = o.key || (o.tex ? o.tex.map.uuid : 'plain') + '|' + (o.color || '') + '|' + (o.scale || 1) + '|' + (o.rough ?? 0.85) + '|' + (o.bumpScale ?? 1) + '|' + (o.metal || 0) + '|' + (o.emissive || '') + '|' + (o.side || 0) + '|' + (o.alphaTest || 0) + '|' + (o.transparent ? o.opacity : '');
  if (MATS.has(key) && !o.unique) return MATS.get(key);
  const sc = Array.isArray(o.scale) ? o.scale : [o.scale || 1, o.scale || 1];
  const m = new THREE.MeshStandardMaterial({
    color: o.color ? new THREE.Color(o.color) : 0xffffff,
    roughness: o.rough ?? 0.85, metalness: o.metal || 0,
    map: o.tex ? texWith(o.tex.map, sc) : null,
    bumpMap: o.tex && o.tex.bump && o.bumpScale !== 0 ? texWith(o.tex.bump, sc) : null,
    bumpScale: o.bumpScale ?? 1,
    side: o.side || THREE.FrontSide,
    transparent: !!o.transparent, opacity: o.opacity ?? 1,
    alphaTest: o.alphaTest || 0,
    emissive: o.emissive ? new THREE.Color(o.emissive) : 0x000000,
    emissiveIntensity: o.emissiveIntensity ?? 1,
    depthWrite: o.depthWrite ?? true,
  });
  if (o.tex && o.tex.map && o.clampTex) { m.map.wrapS = m.map.wrapT = THREE.ClampToEdgeWrapping; m.map.repeat.set(1, 1); if (m.bumpMap) { m.bumpMap.wrapS = m.bumpMap.wrapT = THREE.ClampToEdgeWrapping; m.bumpMap.repeat.set(1, 1); } }
  if (!o.unique) MATS.set(key, m);
  return m;
}
export const basic = (color, o = {}) => new THREE.MeshBasicMaterial({ color, ...o });

// shared felt bump for fabric-y and furry things
export function feltMat(color, o = {}) {
  const key = 'felt' + color + (o.rough || '') + (o.sheen || '');
  if (MATS.has(key)) return MATS.get(key);
  const b = T.feltBump().clone(); b.repeat.set(o.rep || 3, o.rep || 3); b.needsUpdate = true;
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: o.rough ?? 0.95, bumpMap: b, bumpScale: o.bumpScale ?? 1.2 });
  MATS.set(key, m); return m;
}

// --------------------------------------------------------------- building
export function mesh(geo, material, o = {}) {
  const m = new THREE.Mesh(geo, material);
  m.castShadow = o.cast ?? true; m.receiveShadow = o.receive ?? true;
  if (o.pos) m.position.set(o.pos[0], o.pos[1], o.pos[2]);
  if (o.rot) m.rotation.set(o.rot[0], o.rot[1], o.rot[2]);
  if (o.scale) { if (typeof o.scale === 'number') m.scale.setScalar(o.scale); else m.scale.set(o.scale[0], o.scale[1], o.scale[2]); }
  if (o.name) m.name = o.name;
  return m;
}
export function add(parent, geo, material, o) { const m = mesh(geo, material, o); parent.add(m); return m; }
export function group(o = {}) { const g = new THREE.Group(); if (o.pos) g.position.set(o.pos[0], o.pos[1], o.pos[2]); if (o.rot != null) g.rotation.y = o.rot; if (o.name) g.name = o.name; return g; }
// soft contact shadow under something
export function shadowBlob(parent, w, d, o = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: T.blob({ a: o.a ?? 0.5 }), transparent: true, depthWrite: false, opacity: o.opacity ?? 1, color: 0xffffff }));
  m.rotation.x = -Math.PI / 2; m.position.set(o.x || 0, (o.y || 0) + 0.012, o.z || 0); m.renderOrder = 1; m.castShadow = false; m.receiveShadow = false;
  m.material.blending = THREE.MultiplyBlending; m.material.premultipliedAlpha = true;
  // multiply blending wants a colour that is white where there is no shadow
  m.material.map = T.blob({ a: o.a ?? 0.5 }); m.material.blending = THREE.NormalBlending; m.material.premultipliedAlpha = false;
  parent.add(m); return m;
}
// seeded helper
export function seeded(str) { return hashStr(String(str)) % 100000; }
