// NUBBINS — gummy bear bodies.
// Each bear is grown from a handful of soft shapes (a signed distance field),
// meshed with surface nets, skinned to a small skeleton and dressed in a
// see-through jelly material.
import * as THREE from '../lib/three.module.min.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------- SDF bits
function sdEllipsoid(px, py, pz, rx, ry, rz) {
  const k0 = Math.sqrt((px / rx) ** 2 + (py / ry) ** 2 + (pz / rz) ** 2);
  const k1 = Math.sqrt((px / (rx * rx)) ** 2 + (py / (ry * ry)) ** 2 + (pz / (rz * rz)) ** 2);
  return k1 < 1e-9 ? -Math.min(rx, ry, rz) : k0 * (k0 - 1) / k1;
}
function smin(a, b, k) { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; }
function smax(a, b, k) { return -smin(-a, -b, k); }

// default proportions, in "bear units" (a standard bear is about 1 tall)
export const FACE_PAINT = false;

export const BASE_SHAPE = {
  head: [0.215, 0.19, 0.18], headY: 0.655,
  muzzle: [0.095, 0.07, 0.07], muzzleY: 0.61, muzzleZ: 0.125,
  ear: [0.07, 0.07, 0.05], earX: 0.15, earY: 0.815,
  body: [0.235, 0.25, 0.19], bodyY: 0.33,
  belly: [0.185, 0.175, 0.14], bellyY: 0.3, bellyZ: 0.055,
  shoulder: [0.175, 0.47, 0.025], armDir: [0.62, -0.72, 0.3], arm: [0.085, 0.145, 0.085],
  leg: [0.115, 0.13, 0.115], legX: 0.125, legY: 0.12,
  blend: 0.05,
};

function makeShape(over) {
  const s = JSON.parse(JSON.stringify(BASE_SHAPE));
  if (over) for (const k in over) s[k] = over[k];
  return s;
}

// one primitive = sdf fn + the bones that own it
function buildPrims(s) {
  const prims = [];
  const ell = (c, r, bone, q) => {
    // q: optional quaternion that rotates the ellipsoid (local -> model)
    const inv = q ? q.clone().invert() : null;
    const tmp = new THREE.Vector3();
    prims.push({
      bone, c: c.clone(), q,
      d(x, y, z) {
        let px = x - c.x, py = y - c.y, pz = z - c.z;
        if (inv) { tmp.set(px, py, pz).applyQuaternion(inv); px = tmp.x; py = tmp.y; pz = tmp.z; }
        return sdEllipsoid(px, py, pz, r[0], r[1], r[2]);
      },
    });
  };
  ell(V(0, s.headY, 0), s.head, 'head');
  ell(V(0, s.muzzleY, s.muzzleZ), s.muzzle, 'head');
  prims[prims.length - 1].k = s.blend * 0.45; // a moulded snout: a crisper edge than the rest of the body
  // the nose: a small bead on the top front of the snout
  ell(V(0, s.muzzleY + s.muzzle[1] * 0.42, s.muzzleZ + s.muzzle[2] * 0.82), [s.muzzle[0] * 0.34, s.muzzle[1] * 0.3, s.muzzle[2] * 0.34], 'head');
  prims[prims.length - 1].k = 0.012;
  ell(V(s.earX, s.earY, -0.01), s.ear, 'earL');
  ell(V(-s.earX, s.earY, -0.01), s.ear, 'earR');
  ell(V(0, s.bodyY, 0), s.body, 'body');
  ell(V(0, s.bellyY, s.bellyZ), s.belly, 'belly');
  for (const side of [1, -1]) {
    const sh = V(s.shoulder[0] * side, s.shoulder[1], s.shoulder[2]);
    const dir = V(s.armDir[0] * side, s.armDir[1], s.armDir[2]).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, -1, 0), dir);
    const c = sh.clone().addScaledVector(dir, s.arm[1] * 0.62);
    ell(c, s.arm, side > 0 ? 'armL' : 'armR', q);
    prims[prims.length - 1].limb = { from: sh, dir, len: s.arm[1] * 1.6 };
  }
  for (const side of [1, -1]) {
    const c = V(s.legX * side, s.legY, 0.005);
    prims.push({
      bone: side > 0 ? 'legL' : 'legR',
      limb: { from: V(s.legX * side, s.legY + 0.1, 0), dir: V(0, -1, 0), len: 0.22 },
      d(x, y, z) {
        const d = sdEllipsoid(x - c.x, y - c.y, z - c.z, s.leg[0], s.leg[1], s.leg[2]);
        return smax(d, -(y - 0.004), 0.035); // flat soles
      },
    });
  }
  return prims;
}

// prims melt together (each may have its own softness k); cuts are pressed in afterwards
function shapeSDF(prims, blend, cuts = []) {
  return (x, y, z) => {
    let d = prims[0].d(x, y, z);
    for (let i = 1; i < prims.length; i++) d = smin(d, prims[i].d(x, y, z), prims[i].k ?? blend);
    for (const c of cuts) d = smax(d, -c.d(x, y, z), c.k);
    return d;
  };
}

// A real gummy's face is moulded, not painted: a raised snout and nose
// (in buildPrims), two little raised eye beads just above the snout, and a
// shallow cupped dish in the front of each ear.
function sculptFace(prims, s) {
  const base = shapeSDF(prims, s.blend);
  const hc = V(0, s.headY, 0);
  for (const side of [1, -1]) {
    const d = V(0.4 * side, 0.3, 1).normalize();
    const p = marchToSurface(base, hc.clone().addScaledVector(d, 0.45), d.clone().negate());
    const n = gradient(base, p.x, p.y, p.z);
    const c = p.addScaledVector(n, -0.009), r = [0.021, 0.025, 0.017];
    prims.push({ bone: 'head', k: 0.012, c, d: (x, y, z) => sdEllipsoid(x - c.x, y - c.y, z - c.z, r[0], r[1], r[2]) });
  }
  const cuts = [1, -1].map(side => {
    const c = V(s.earX * side * 0.97, s.earY + s.ear[1] * 0.12, -0.01 + s.ear[2] * 1.05), r = [s.ear[0] * 0.6, s.ear[1] * 0.6, s.ear[2] * 0.55];
    return { k: 0.02, d: (x, y, z) => sdEllipsoid(x - c.x, y - c.y, z - c.z, r[0], r[1], r[2]) };
  });
  return shapeSDF(prims, s.blend, cuts);
}

// ---------------------------------------------------------- surface nets
export function surfaceNets(sdf, min, max, h) {
  const nx = Math.ceil((max.x - min.x) / h) + 1, ny = Math.ceil((max.y - min.y) / h) + 1, nz = Math.ceil((max.z - min.z) / h) + 1;
  const field = new Float32Array(nx * ny * nz);
  const idx = (i, j, k) => i + nx * (j + ny * k);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++)
    field[idx(i, j, k)] = sdf(min.x + i * h, min.y + j * h, min.z + k * h);
  const cellVert = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
  const cidx = (i, j, k) => i + (nx - 1) * (j + (ny - 1) * k);
  const pos = [];
  const corners = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const cv = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let mask = 0;
    for (let c = 0; c < 8; c++) { const o = corners[c]; cv[c] = field[idx(i + o[0], j + o[1], k + o[2])]; if (cv[c] < 0) mask |= 1 << c; }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of edges) {
      const va = cv[a], vb = cv[b];
      if ((va < 0) === (vb < 0)) continue;
      const t = va / (va - vb), oa = corners[a], ob = corners[b];
      sx += oa[0] + (ob[0] - oa[0]) * t; sy += oa[1] + (ob[1] - oa[1]) * t; sz += oa[2] + (ob[2] - oa[2]) * t; n++;
    }
    cellVert[cidx(i, j, k)] = pos.length / 3;
    pos.push(min.x + (i + sx / n) * h, min.y + (j + sy / n) * h, min.z + (k + sz / n) * h);
  }
  const tris = [];
  const quad = (a, b, c, d, flip) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (flip) { tris.push(a, d, c, a, c, b); } else { tris.push(a, b, c, a, c, d); }
  };
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const v0 = field[idx(i, j, k)] < 0;
    if (v0 !== (field[idx(i + 1, j, k)] < 0)) // x edge
      quad(cellVert[cidx(i, j - 1, k - 1)], cellVert[cidx(i, j, k - 1)], cellVert[cidx(i, j, k)], cellVert[cidx(i, j - 1, k)], !v0);
    if (v0 !== (field[idx(i, j + 1, k)] < 0)) // y edge
      quad(cellVert[cidx(i - 1, j, k - 1)], cellVert[cidx(i - 1, j, k)], cellVert[cidx(i, j, k)], cellVert[cidx(i, j, k - 1)], !v0);
    if (v0 !== (field[idx(i, j, k + 1)] < 0)) // z edge
      quad(cellVert[cidx(i - 1, j - 1, k)], cellVert[cidx(i, j - 1, k)], cellVert[cidx(i, j, k)], cellVert[cidx(i - 1, j, k)], !v0);
  }
  return { pos: new Float32Array(pos), index: tris };
}

export function gradient(sdf, x, y, z, e = 0.002) {
  return V(sdf(x + e, y, z) - sdf(x - e, y, z), sdf(x, y + e, z) - sdf(x, y - e, z), sdf(x, y, z + e) - sdf(x, y, z - e)).normalize();
}

function marchToSurface(sdf, from, dir) {
  const p = from.clone();
  for (let i = 0; i < 80; i++) { const d = sdf(p.x, p.y, p.z); if (Math.abs(d) < 0.0005) break; p.addScaledVector(dir, d * 0.8); }
  return p;
}

// ----------------------------------------------------------- bear builder
const BONES = ['root', 'hips', 'belly', 'chest', 'head', 'earL', 'earR', 'armL', 'pawL', 'armR', 'pawR', 'legL', 'footL', 'legR', 'footR'];
export const BONE_INDEX = Object.fromEntries(BONES.map((b, i) => [b, i]));

const geoCache = new Map();

export function buildBearGeometry(shapeOver, key, rainbow) {
  if (key && geoCache.has(key)) return geoCache.get(key);
  const s = makeShape(shapeOver);
  const prims = buildPrims(s);
  const sdf = sculptFace(prims, s);
  const h = 0.0115;
  const net = surfaceNets(sdf, V(-0.5, -0.06, -0.36), V(0.5, 1.02, 0.4), h);
  const n = net.pos.length / 3;
  const P = net.pos;
  // snap verts onto the true surface, compute smooth normals
  const normals = new Float32Array(n * 3);
  for (let v = 0; v < n; v++) {
    let x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
    for (let it = 0; it < 3; it++) {
      const d = sdf(x, y, z); const g = gradient(sdf, x, y, z);
      x -= g.x * d; y -= g.y * d; z -= g.z * d;
    }
    P[v * 3] = x; P[v * 3 + 1] = y; P[v * 3 + 2] = z;
    const g = gradient(sdf, x, y, z);
    normals[v * 3] = g.x; normals[v * 3 + 1] = g.y; normals[v * 3 + 2] = g.z;
  }

  // bind skeleton positions (model space)
  const sh = s.shoulder;
  const bind = {
    root: V(0, 0, 0), hips: V(0, 0.27, 0), belly: V(0, s.bellyY, s.bellyZ + 0.02), chest: V(0, 0.44, 0),
    head: V(0, 0.55, 0), earL: V(s.earX, s.earY - 0.03, -0.01), earR: V(-s.earX, s.earY - 0.03, -0.01),
    armL: V(sh[0], sh[1], sh[2]), armR: V(-sh[0], sh[1], sh[2]),
    legL: V(s.legX, s.legY + 0.11, 0), legR: V(-s.legX, s.legY + 0.11, 0),
  };
  const armDirL = V(s.armDir[0], s.armDir[1], s.armDir[2]).normalize();
  const armDirR = V(-s.armDir[0], s.armDir[1], s.armDir[2]).normalize();
  bind.pawL = bind.armL.clone().addScaledVector(armDirL, s.arm[1] * 0.95);
  bind.pawR = bind.armR.clone().addScaledVector(armDirR, s.arm[1] * 0.95);
  bind.footL = V(s.legX, 0.07, 0); bind.footR = V(-s.legX, 0.07, 0);

  // skin weights: softmax over which soft shape owns each vertex
  const skinIndex = new Uint16Array(n * 4), skinWeight = new Float32Array(n * 4);
  const tau = 0.022;
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const acc = new Float32Array(BONES.length);
  const colorAttr = new Float32Array(n * 3);
  for (let v = 0; v < n; v++) {
    const x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
    acc.fill(0);
    let dmin = Infinity; const ds = prims.map(p => { const d = p.d(x, y, z); if (d < dmin) dmin = d; return d; });
    for (let i = 0; i < prims.length; i++) {
      const w = Math.exp(-(ds[i] - dmin) / tau);
      if (w < 1e-4) continue;
      const p = prims[i];
      if (p.bone === 'body') {
        const t = smooth(0.29, 0.47, y); acc[BONE_INDEX.hips] += w * (1 - t); acc[BONE_INDEX.chest] += w * t;
      } else if (p.limb) {
        const rel = V(x, y, z).sub(p.limb.from); const t = rel.dot(p.limb.dir) / p.limb.len;
        const isArm = p.bone.startsWith('arm');
        const tip = isArm ? (p.bone === 'armL' ? 'pawL' : 'pawR') : (p.bone === 'legL' ? 'footL' : 'footR');
        const u = isArm ? smooth(0.42, 0.8, t) : smooth(0.55, 0.85, t);
        acc[BONE_INDEX[p.bone]] += w * (1 - u); acc[BONE_INDEX[tip]] += w * u;
      } else acc[BONE_INDEX[p.bone]] += w;
    }
    // top 4
    const order = [...acc.keys()].sort((a, b) => acc[b] - acc[a]).slice(0, 4);
    let sum = 0; for (const o of order) sum += acc[o];
    for (let q = 0; q < 4; q++) { skinIndex[v * 4 + q] = order[q]; skinWeight[v * 4 + q] = acc[order[q]] / sum; }
    // a whisper of colour variation: limbs and ears a touch lighter
    const core = Math.max(0, Math.min(1, -sdf(x * 0.6, y * 0.9 + 0.03, z * 0.6) * 4));
    if (rainbow) {
      const a = Math.atan2(z, x) * 0.5 + y * 9.0;
      const hue = ((a / (Math.PI * 2)) % 1 + 1) % 1;
      const c = new THREE.Color().setHSL(hue, 0.85, 0.62);
      colorAttr[v * 3] = c.r; colorAttr[v * 3 + 1] = c.g; colorAttr[v * 3 + 2] = c.b;
    } else colorAttr[v * 3] = colorAttr[v * 3 + 1] = colorAttr[v * 3 + 2] = 1 - core * 0.18;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndex, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeight, 4));
  geo.setAttribute('shade', new THREE.BufferAttribute(colorAttr, 3));
  geo.setIndex(net.index);
  geo.computeBoundingSphere();
  geo.boundingSphere.radius *= 2.2; // poses stretch well past the bind pose

  // face sockets
  const headC = V(0, s.headY, 0);
  const eyeDir = (side) => V(0.36 * side, 0.2, 1).normalize();
  const eyes = [1, -1].map(side => {
    const p = marchToSurface(sdf, headC.clone().addScaledVector(eyeDir(side), 0.4), eyeDir(side).negate());
    return { p, n: gradient(sdf, p.x, p.y, p.z) };
  });
  const top = marchToSurface(sdf, V(0, 1.2, 0), V(0, -1, 0));
  const nose = marchToSurface(sdf, V(0, s.muzzleY + 0.01, 0.6), V(0, 0, -1));
  const belt = marchToSurface(sdf, V(0, 0.3, 0.6), V(0, 0, -1));
  const out = { geo, bind, s, sockets: { eyes, top, nose, belt }, sdf, prims, blend: s.blend };
  if (key) geoCache.set(key, out);
  return out;
}

// --------------------------------------------------------------- material
// physical transmission + a few gummy-specific tweaks injected into the shader:
// thinner jelly at the silhouette, an inner glow, a squish dent and wobble,
// and (for sour bears) a sugar crust.
export function makeGummyMaterial(fl, opts = {}) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(fl.tint),
    roughness: (fl.rough ?? 0.22) + 0.08,   // satin, like a real gummy (was glossier before Nov 23 2026)
    metalness: 0,
    transmission: 1,
    thickness: fl.thick ?? 0.55,
    ior: 1.42,
    attenuationColor: new THREE.Color(fl.deep),
    attenuationDistance: fl.atten ?? 0.32,
    clearcoat: (fl.coat ?? 0.7) * 0.55,
    clearcoatRoughness: 0.3,
    specularIntensity: 1,
    sheen: fl.sugar ? 0.6 : 0,
    sheenColor: new THREE.Color(0xffffff),
    sheenRoughness: 0.4,
    envMapIntensity: 1.0,
  });
  const U = {
    uGlow: { value: new THREE.Color(fl.glow ?? fl.tint).multiplyScalar(fl.glowAmt ?? 0.22) },
    uRim: { value: new THREE.Color(fl.rim ?? fl.tint).multiplyScalar(fl.rimAmt ?? 0.55) },
    uSugar: { value: fl.sugar ? 1 : 0 },
    uWob: { value: 0 }, uWobT: { value: 0 }, uWobDir: { value: new THREE.Vector3(1, 0, 0) },
    uDentP: { value: new THREE.Vector3(0, -9, 0) }, uDentA: { value: 0 }, uDentR: { value: 0.12 },
    uFlash: { value: 0 }, uFlashC: { value: new THREE.Color(1, 1, 1) },
    uFade: { value: 1 },
  };
  mat.userData.u = U;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute vec3 shade; varying vec3 vShade; varying vec3 vObjP;
        uniform float uWob, uWobT; uniform vec3 uWobDir; uniform vec3 uDentP; uniform float uDentA, uDentR;`)
      .replace('#include <skinning_vertex>', `#include <skinning_vertex>
        vShade = shade; vObjP = position;
        {
          float ph = dot(transformed, uWobDir) * 13.0 + transformed.y * 7.0;
          transformed += objectNormal * (sin(uWobT * 26.0 + ph) * uWob * 0.028);
          vec3 dd = transformed - uDentP;
          float f = exp(-dot(dd, dd) / (uDentR * uDentR));
          transformed -= objectNormal * f * uDentA;
        }`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vShade; varying vec3 vObjP;
        uniform vec3 uGlow, uRim, uFlashC; uniform float uSugar, uFlash, uFade;
        float h31(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        if (uSugar > 0.5) {
          vec3 cell = floor(vObjP * 120.0);
          vec3 jit = vec3(h31(cell), h31(cell + 7.1), h31(cell + 13.7)) - 0.5;
          normal = normalize(normal + jit * 0.35);
        }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        diffuseColor.rgb *= vShade;`)
      .replace('material.thickness = thickness;', `material.thickness = thickness;
        material.thickness *= 0.18 + 0.82 * pow(abs(dot(normal, normalize(vViewPosition))), 0.9);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          float nv = clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0);
          totalEmissiveRadiance += uGlow * pow(nv, 1.6) * vShade + uRim * pow(1.0 - nv, 3.0);
          if (uSugar > 0.5) {
            float sp = h31(floor(vObjP * 120.0) + 3.3);
            totalEmissiveRadiance += vec3(step(0.96, sp)) * 0.9 * pow(1.0 - nv * 0.6, 2.0);
          }
          totalEmissiveRadiance += uFlashC * uFlash;
        }`);
  };
  mat.customProgramCacheKey = () => 'gummy' + (fl.sugar ? 's' : '');
  return mat;
}

// a flat, glossy candy finish for accessories and props
export function candyMat(color, o = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color), roughness: o.rough ?? 0.25, metalness: o.metal ?? 0,
    clearcoat: o.coat ?? 1, clearcoatRoughness: 0.1, emissive: new THREE.Color(o.emissive ?? 0x000000),
    emissiveIntensity: o.ei ?? 1, sheen: o.sheen ?? 0, transparent: !!o.opacity, opacity: o.opacity ?? 1,
  });
}

// -------------------------------------------------------------- the rig
// Poses are described by plain numbers: torso angles, limb directions in the
// chest's frame, limb stretch (rubber punches), squash, and a few face values.
export function neutralPose() {
  return {
    y: 0, x: 0, sq: 1, lean: 0, twist: 0, roll: 0,
    chest: [0, 0, 0], head: [0, 0, 0],
    armL: [0.62, -0.72, 0.3], armLs: 1, armLf: 1,
    armR: [-0.62, -0.72, 0.3], armRs: 1, armRf: 1,
    legL: [0.05, -1, 0], legLs: 1, legR: [-0.05, -1, 0], legRs: 1,
    brow: 0, eyeS: 1, earF: 0,
  };
}

export function lerpPose(a, b, t, out = {}) {
  for (const k in a) {
    const va = a[k], vb = b[k] ?? va;
    if (Array.isArray(va)) { out[k] = [va[0] + (vb[0] - va[0]) * t, va[1] + (vb[1] - va[1]) * t, va[2] + (vb[2] - va[2]) * t]; }
    else out[k] = va + (vb - va) * t;
  }
  return out;
}

const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _down = V(0, -1, 0);

export class GummyBear {
  constructor(def) {
    this.def = def;
    const g = buildBearGeometry(def.shape, def.key, def.flavor && def.flavor.rainbow);
    this.g = g;
    this.group = new THREE.Group();          // world placement (x, facing, scale)
    this.body = new THREE.Group();           // squash & stretch lives here
    this.group.add(this.body);
    this.mat = makeGummyMaterial(def.flavor);
    this.u = this.mat.userData.u;
    this.glowBase = this.u.uGlow.value.clone(); this.rimBase = this.u.uRim.value.clone();

    const bones = {};
    for (const name of BONES) { bones[name] = new THREE.Bone(); bones[name].name = name; }
    const parent = { hips: 'root', belly: 'hips', chest: 'hips', head: 'chest', earL: 'head', earR: 'head', armL: 'chest', pawL: 'armL', armR: 'chest', pawR: 'armR', legL: 'hips', footL: 'legL', legR: 'hips', footR: 'legR' };
    const b = g.bind;
    // limb bones get a bind rotation so their local -Y runs down the limb
    const limbDir = {
      armL: V(...g.s.armDir).normalize(), armR: V(-g.s.armDir[0], g.s.armDir[1], g.s.armDir[2]).normalize(),
      legL: V(0, -1, 0), legR: V(0, -1, 0),
    };
    this.limbBindQ = {};
    const worldQ = {};
    for (const name of BONES) {
      const bone = bones[name];
      const p = parent[name];
      const wq = limbDir[name] ? new THREE.Quaternion().setFromUnitVectors(_down, limbDir[name]) : (p ? worldQ[p] : new THREE.Quaternion());
      worldQ[name] = wq.clone();
      if (p) {
        bones[p].add(bone);
        const local = b[name].clone().sub(b[p]).applyQuaternion(worldQ[p].clone().invert());
        bone.position.copy(local);
        bone.quaternion.copy(worldQ[p].clone().invert().multiply(wq));
      } else bone.position.copy(b[name]);
      if (limbDir[name]) this.limbBindQ[name] = bone.quaternion.clone();
    }
    this.bones = bones;
    this.bindPos = Object.fromEntries(BONES.map(n => [n, bones[n].position.clone()]));
    this.bindQuat = Object.fromEntries(BONES.map(n => [n, bones[n].quaternion.clone()]));

    const mesh = new THREE.SkinnedMesh(g.geo, this.mat);
    mesh.frustumCulled = false;
    this.mesh = mesh;
    this.body.add(mesh);
    this.body.add(bones.root);
    this.body.updateMatrixWorld(true);
    const skel = new THREE.Skeleton(BONES.map(n => bones[n]));
    mesh.bind(skel);

    this._buildFace();
    this.springs = {
      head: { x: 0, v: 0, y: 0, vy: 0 }, ears: { x: 0, v: 0 }, belly: { x: 0, v: 0, y: 0, vy: 0 }, sq: { x: 0, v: 0 },
    };
    this.pose = neutralPose();
    this.wob = 0; this.dent = 0; this.flash = 0; this.time = Math.random() * 10; this.tickers = [];
  }

  // painted eyes and brows: switched off since Nov 23 2026 (the face is moulded into the jelly instead)
  _buildFace() {
    this.eyes = []; this.brows = []; this.xeyes = [];
    if (!FACE_PAINT) return;
    const head = this.bones.head;
    const hb = this.g.bind.head;
    const eyeMat = new THREE.MeshPhysicalMaterial({ color: 0x120a10, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02 });
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const browMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(this.def.flavor.deep).multiplyScalar(0.35), roughness: 0.3, clearcoat: 1 });
    this.eyes = []; this.brows = []; this.xeyes = [];
    const eyeGeo = new THREE.SphereGeometry(0.036, 20, 14);
    const glintGeo = new THREE.SphereGeometry(0.009, 8, 6);
    const browGeo = new THREE.CapsuleGeometry(0.011, 0.05, 4, 8); browGeo.rotateZ(Math.PI / 2);
    const xGeo = new THREE.CapsuleGeometry(0.008, 0.045, 3, 6);
    for (const [i, e] of this.g.sockets.eyes.entries()) {
      const side = i === 0 ? 1 : -1;
      const piv = new THREE.Group();
      piv.position.copy(e.p).sub(hb).addScaledVector(e.n, -0.008);
      piv.lookAt(piv.position.clone().add(e.n));
      const eye = new THREE.Mesh(eyeGeo, eyeMat); eye.scale.set(1, 1.25, 0.6);
      const gl = new THREE.Mesh(glintGeo, glintMat); gl.position.set(-0.008 * side, 0.012, 0.016);
      eye.add(gl);
      piv.add(eye);
      head.add(piv);
      this.eyes.push({ piv, eye, side, n: e.n.clone() });
      const brow = new THREE.Mesh(browGeo, browMat);
      brow.position.copy(piv.position).add(V(0.004 * side, 0.052, 0.006));
      head.add(brow); this.brows.push({ m: brow, side, base: brow.position.clone() });
      const xg = new THREE.Group(); xg.position.copy(piv.position).addScaledVector(e.n, 0.01); xg.lookAt(xg.position.clone().add(e.n));
      const a = new THREE.Mesh(xGeo, eyeMat); a.rotation.z = 0.785; const bb = new THREE.Mesh(xGeo, eyeMat); bb.rotation.z = -0.785;
      xg.add(a, bb); xg.visible = false; head.add(xg); this.xeyes.push(xg);
    }
  }

  socketLocal(boneName, worldModelPoint) { return worldModelPoint.clone().sub(this.g.bind[boneName]); }

  attach(boneName, obj, modelPos) {
    // modelPos: a point in bind (model) space; converted into the bone's frame
    const bone = this.bones[boneName];
    this.body.updateMatrixWorld(true);
    if (modelPos) {
      const local = modelPos.clone();
      // bind-space -> bone-local (bind pose): undo body transform then bone world
      const m = new THREE.Matrix4().copy(bone.matrixWorld).invert().multiply(this.body.matrixWorld);
      local.applyMatrix4(m);
      obj.position.copy(local);
    }
    bone.add(obj);
    return obj;
  }

  // hit reaction: dent where the hit landed and set the whole bear wobbling
  squish(worldPoint, strength = 1, dir = 1) {
    this.mesh.updateMatrixWorld();
    const local = this.mesh.worldToLocal(worldPoint.clone());
    this.u.uDentP.value.copy(local);
    this.dent = Math.min(0.09, 0.035 + 0.05 * strength);
    this.wob = Math.min(2.2, this.wob + 0.8 + strength);
    this.springs.head.v += -7 * strength;
    this.springs.belly.v += 9 * strength * dir;
    this.springs.sq.v -= 3.5 * strength;
    this.springs.ears.v += 14 * strength;
  }
  jolt(amount) { this.springs.sq.v += amount; this.springs.ears.v += amount * 4; this.springs.belly.vy += amount * 2; }

  setExpression(kind) { this.expr = kind; }

  update(dt, accel = 0) {
    this.time += dt;
    const S = this.springs;
    const step = (s, k, c, target = 0, key = 'x', vk = 'v') => { s[vk] += (-(s[key] - target) * k - s[vk] * c) * dt; s[key] += s[vk] * dt; };
    step(S.head, 160, 9, -accel * 0.02);
    step(S.ears, 220, 7, -accel * 0.03);
    step(S.belly, 120, 6, accel * 0.012);
    step(S.belly, 120, 6, 0, 'y', 'vy');
    step(S.sq, 180, 10, 0);
    this.wob *= Math.exp(-dt * 3.2);
    this.dent *= Math.exp(-dt * 7);
    this.flash *= Math.exp(-dt * 10);
    this.u.uWob.value = this.wob; this.u.uWobT.value = this.time;
    this.u.uDentA.value = this.dent; this.u.uFlash.value = this.flash;
    this.applyPose(this.pose);
    for (const tk of this.tickers) tk(this.time, dt, this);
  }

  applyPose(p) {
    const B = this.bones, S = this.springs;
    const sq = Math.max(0.45, Math.min(1.7, p.sq + S.sq.x * 0.25));
    const side = 1 / Math.sqrt(sq);
    this.body.scale.set(side, sq, side);
    this.body.position.set(0, p.y, p.x || 0);
    _e.set(p.lean, p.twist, p.roll); this.body.quaternion.setFromEuler(_e);
    // torso
    _e.set(p.chest[0], p.chest[1], p.chest[2]); B.chest.quaternion.setFromEuler(_e).premultiply(this.bindQuat.chest);
    _e.set(p.head[0] + S.head.x, p.head[1], p.head[2] + S.head.y * 0.5); B.head.quaternion.setFromEuler(_e);
    B.belly.position.copy(this.bindPos.belly).add(_v.set(0, S.belly.y * 0.01, S.belly.x * 0.02));
    const bs = 1 + S.belly.x * 0.06; B.belly.scale.set(bs, 1 / bs, bs);
    _e.set(S.ears.x * 0.25, 0, S.ears.x * 0.15); B.earL.quaternion.setFromEuler(_e);
    _e.set(S.ears.x * 0.25, 0, -S.ears.x * 0.15); B.earR.quaternion.setFromEuler(_e);
    // limbs: aim -Y down the requested direction, stretch along it
    this._limb('armL', 'pawL', p.armL, p.armLs, p.armLf);
    this._limb('armR', 'pawR', p.armR, p.armRs, p.armRf);
    this._limb('legL', 'footL', p.legL, p.legLs, 1);
    this._limb('legR', 'footR', p.legR, p.legRs, 1);
    // face
    const ex = this.expr || 'idle';
    const eyeS = p.eyeS;
    for (const e of this.eyes) { e.eye.scale.set(1, 1.25 * eyeS, 0.6); e.piv.visible = !this.hideEyes && ex !== 'ko'; }
    for (const x of this.xeyes) x.visible = ex === 'ko';
    const browAng = (ex === 'hurt' ? -0.45 : ex === 'happy' ? -0.2 : 0.42) + p.brow;
    for (const b of this.brows) {
      b.m.rotation.z = browAng * b.side;
      b.m.position.copy(b.base); b.m.position.y += ex === 'hurt' ? 0.012 : ex === 'happy' ? 0.01 : 0;
    }
  }

  _limb(name, tip, dir, stretch, fist) {
    const bone = this.bones[name];
    _v.set(dir[0], dir[1], dir[2]).normalize();
    bone.quaternion.setFromUnitVectors(_down, _v);
    const s = Math.max(0.5, stretch);
    const w = 1 / Math.sqrt(s);
    bone.scale.set(w, s, w);
    const t = this.bones[tip];
    t.scale.set(fist / w, fist / s, fist / w);
  }
}
