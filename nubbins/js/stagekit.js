// NUBBINS — the arena toolkit: seeded randomness, painted canvases (with a
// Safari-safe soft focus), rounded boxes, lumpy blobs, instancing, contact
// shadows, flames, light beams, caustics and a reflection room per arena.
import * as THREE from '../lib/three.module.min.js';

export const C = c => new THREE.Color(c);
export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ------------------------------------------------------------ randomness
let rs = 1;
export function seed(s) { rs = (s * 9301 + 49297) % 233280 || 1; }
export function rr(a = 0, b = 1) { rs = (rs * 16807) % 2147483647; return a + (rs / 2147483647) * (b - a); }
export const pick = arr => arr[Math.floor(rr(0, arr.length)) % arr.length];

// ------------------------------------------------------------- canvases
export function canvas(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  return c;
}
export function ctex(cv, rep, o = {}) {
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = o.linear ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
}
// soft focus by stepping the picture down and back up (works on every Safari)
export function soften(src, k) {
  let cur = src, w = src.width, h = src.height;
  const tw = Math.max(2, Math.round(w / k)), th = Math.max(2, Math.round(h / k));
  while (w / 2 >= tw) {
    w = Math.round(w / 2); h = Math.round(h / 2);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(cur, 0, 0, w, h); cur = c;
  }
  while (w * 2 <= src.width) {
    w *= 2; h *= 2;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(cur, 0, 0, w, h); cur = c;
  }
  return cur;
}
export function noiseDots(g, w, h, n, color, a0, a1, s0 = 0.5, s1 = 2) {
  for (let i = 0; i < n; i++) { g.globalAlpha = rr(a0, a1); g.fillStyle = color; const s = rr(s0, s1); g.fillRect(rr(0, w), rr(0, h), s, s); }
  g.globalAlpha = 1;
}
export function blob(g, x, y, r, wob = 0.25, n = 14) {
  g.beginPath();
  const ph = rr(0, TAU);
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU, k = r * (1 + wob * Math.sin(a * 3 + ph) * Math.cos(a * 2 - ph));
    const px = x + Math.cos(a) * k, py = y + Math.sin(a) * k;
    i ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.closePath();
}
export function rrect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

const radialCache = {};
export function radialTex(kind = 'shadow') {
  if (radialCache[kind]) return radialCache[kind];
  const c = canvas(128, 128, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    if (kind === 'shadow') { r.addColorStop(0, 'rgba(0,0,0,0.85)'); r.addColorStop(0.45, 'rgba(0,0,0,0.45)'); r.addColorStop(1, 'rgba(0,0,0,0)'); }
    else { r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,0.45)'); r.addColorStop(0.6, 'rgba(255,255,255,0.08)'); r.addColorStop(1, 'rgba(255,255,255,0)'); }
    g.fillStyle = r; g.fillRect(0, 0, w, w);
  });
  radialCache[kind] = new THREE.CanvasTexture(c);
  return radialCache[kind];
}

// -------------------------------------------------------------- geometry
export function roundedBox(w, h, d, r, s = 3) {
  const N = 2 * s + 2;
  const g = new THREE.BoxGeometry(1, 1, 1, N, N, N);
  const p = g.attributes.position, nrm = g.attributes.normal;
  const map = (u, H) => { // u in [-.5,.5] on a grid of N steps; first and last s steps hug the edges
    const t = Math.round((u + 0.5) * N);
    if (t <= s) return -H + r * (t / s);
    if (t >= N - s) return H - r * ((N - t) / s);
    return (-H + r) + ((t - s) / (N - 2 * s)) * (2 * H - 2 * r);
  };
  const v = new THREE.Vector3(), c = new THREE.Vector3(), dir = new THREE.Vector3();
  const hx = w / 2, hy = h / 2, hz = d / 2;
  for (let i = 0; i < p.count; i++) {
    v.set(map(p.getX(i), hx), map(p.getY(i), hy), map(p.getZ(i), hz));
    c.set(clamp(v.x, -hx + r, hx - r), clamp(v.y, -hy + r, hy - r), clamp(v.z, -hz + r, hz - r));
    dir.subVectors(v, c);
    if (dir.lengthSq() < 1e-10) dir.set(nrm.getX(i), nrm.getY(i), nrm.getZ(i));
    dir.normalize();
    v.copy(c).addScaledVector(dir, r);
    p.setXYZ(i, v.x, v.y, v.z); nrm.setXYZ(i, dir.x, dir.y, dir.z);
  }
  return g;
}
export function lumpy(r, amt, freq, ws = 28, hs = 18) {
  const g = new THREE.SphereGeometry(r, ws, hs);
  const p = g.attributes.position, n = new THREE.Vector3();
  const a = [rr(0, 6), rr(0, 6), rr(0, 6)];
  for (let i = 0; i < p.count; i++) {
    n.set(p.getX(i), p.getY(i), p.getZ(i)).normalize();
    const k = Math.sin(n.x * freq + a[0]) * Math.sin(n.y * freq * 1.3 + a[1]) * Math.sin(n.z * freq * 0.9 + a[2])
      + 0.5 * Math.sin(n.x * freq * 2.1 + a[1]) * Math.sin(n.z * freq * 1.7 + a[0]);
    n.multiplyScalar(r * (1 + amt * k)); p.setXYZ(i, n.x, n.y, n.z);
  }
  g.computeVertexNormals();
  return g;
}
export function lathe(pts, segs = 48) { return new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), segs); }
export function tube(pts, r, seg = 64, rad = 10, closed = false) { return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => (Array.isArray(p) ? V3(...p) : p)), closed), seg, r, rad, closed); }

// ------------------------------------------------------------- materials
export const std = (color, rough = 0.5, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: C(color), roughness: rough, metalness: 0 }, o));
export const phys = (color, rough = 0.3, o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color: C(color), roughness: rough, metalness: 0 }, o));
export const basic = (color, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color: C(color) }, o));
// a floor whose shine you can turn down, so low back lights don't glare
export const floorMat = (map, rough = 0.6, spec = 0.35, o = {}) => { const { env, ...rest } = o; return new THREE.MeshPhysicalMaterial(Object.assign({ color: C('#ffffff'), map, roughness: rough, metalness: 0, specularIntensity: spec, envMapIntensity: env ?? 0.5 }, rest)); };
// candy, popcorn and the like glow a little from inside, in their own colour
export function selfLit(mat, k = 0.3) {
  mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
    totalEmissiveRadiance += diffuseColor.rgb * ${k.toFixed(3)};`); };
  mat.customProgramCacheKey = () => 'selfLit' + k;
  return mat;
}
export const glass = (o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color: C('#f2faff'), roughness: 0.03, metalness: 0, transparent: true, opacity: 0.16, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide }, o));

// ---------------------------------------------------------------- meshes
export function mesh(geo, mat, o = {}) {
  const m = new THREE.Mesh(geo, mat);
  if (o.p) m.position.set(...o.p);
  if (o.r) m.rotation.set(...o.r);
  if (o.s !== undefined) Array.isArray(o.s) ? m.scale.set(...o.s) : m.scale.setScalar(o.s);
  m.castShadow = !!o.cast; m.receiveShadow = !!o.recv;
  return m;
}
export function castAll(obj, cast = true, recv = false) { obj.traverse(o => { if (o.isMesh) { o.castShadow = cast; o.receiveShadow = recv; } }); return obj; }

const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
export function instanced(geo, mat, items, o = {}) {
  const m = new THREE.InstancedMesh(geo, mat, Math.max(1, items.length));
  items.forEach((it, i) => {
    _p.set(...it.p); _e.set(...(it.r || [0, 0, 0])); _q.setFromEuler(_e);
    const sc = it.s ?? 1; Array.isArray(sc) ? _s.set(...sc) : _s.set(sc, sc, sc);
    _m4.compose(_p, _q, _s); m.setMatrixAt(i, _m4);
    if (it.c) m.setColorAt(i, C(it.c));
  });
  m.count = items.length;
  m.castShadow = !!o.cast; m.receiveShadow = !!o.recv; m.frustumCulled = false;
  m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true;
  return m;
}
export function setInstance(m, i, p, r, s) {
  _p.set(...p); _e.set(...(r || [0, 0, 0])); _q.setFromEuler(_e); Array.isArray(s) ? _s.set(...s) : _s.set(s, s, s);
  _m4.compose(_p, _q, _s); m.setMatrixAt(i, _m4);
}

// a soft dark patch that grounds a prop on the floor
export function contact(x, z, sx, sz, a = 0.6, y = 0.006, rot = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: radialTex('shadow'), transparent: true, opacity: a, depthWrite: false, color: 0x000000 }));
  m.rotation.set(-Math.PI / 2, 0, rot); m.scale.set(sx, sz, 1); m.position.set(x, y, z); m.renderOrder = 1;
  return m;
}
export function glow(color, size, opacity = 1, o = {}) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex('glow'), color: C(color), blending: THREE.AdditiveBlending, depthWrite: false, depthTest: o.depthTest ?? true, transparent: true, opacity, fog: false }));
  s.scale.set(size, size * (o.aspect || 1), 1); if (o.p) s.position.set(...o.p);
  return s;
}
// a painted picture far away (sky, rooms, crowds)
export function backdrop(cv, w, h, pos, o = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: ctex(cv), fog: !!o.fog, color: C(o.tint || '#ffffff'), toneMapped: o.toneMapped ?? true, transparent: !!o.transparent, depthWrite: !o.transparent }));
  m.position.set(...pos); if (o.ry) m.rotation.y = o.ry;
  return m;
}

// --------------------------------------------------------------- shaders
const BILL_VS = `varying vec2 vUv; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(0.0,0.0,0.0,1.0);
  mv.xy += position.xy * vec2(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz)); gl_Position = projectionMatrix * mv; }`;
export function flame(seedv = 0) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uOn: { value: 1 }, uSeed: { value: seedv } },
    vertexShader: BILL_VS,
    fragmentShader: `uniform float uT, uOn, uSeed; varying vec2 vUv;
      void main(){
        vec2 p = vUv;
        float sway = sin(uT * 7.0 + uSeed) * 0.05 + sin(uT * 13.0 + uSeed * 2.0) * 0.025;
        p.x -= sway * p.y * p.y;
        float w = mix(0.3, 0.02, smoothstep(0.1, 1.0, p.y)) * (1.0 + 0.08 * sin(uT * 21.0 + uSeed));
        float dx = abs(p.x - 0.5) / max(w, 0.001);
        float body = smoothstep(1.0, 0.0, dx) * smoothstep(0.0, 0.14, p.y) * smoothstep(1.0, 0.5, p.y);
        float core = smoothstep(0.55, 0.0, dx) * smoothstep(0.08, 0.26, p.y) * smoothstep(0.7, 0.3, p.y);
        float base = smoothstep(0.3, 0.0, length(vec2((p.x - 0.5) * 3.2, p.y - 0.16)));
        vec3 col = vec3(1.0, 0.42, 0.08) * body + vec3(1.0, 0.86, 0.55) * core * 1.3 + vec3(0.25, 0.4, 1.0) * base * 0.7;
        gl_FragColor = vec4(col * uOn * 2.2, clamp(body + core, 0.0, 1.0) * uOn);
      }`,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  m.geometry.translate(0, 0.5, 0); m.frustumCulled = false; m.renderOrder = 6;
  return m;
}
// a soft shaft of light (projector, flashlight): brightest where you look through the most of it
export function beam(from, to, r0, r1, color, strength = 0.12) {
  const dir = to.clone().sub(from); const len = dir.length(); dir.normalize();
  const geo = new THREE.CylinderGeometry(r1, r0, len, 40, 8, true); geo.translate(0, len / 2, 0);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    uniforms: { uC: { value: C(color) }, uS: { value: strength }, uT: { value: 0 }, uLen: { value: len } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying float vT;
      void main(){ vT = position.y / ${len.toFixed(3)}; vec4 wp = modelMatrix * vec4(position,1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: `uniform vec3 uC; uniform float uS, uT; varying vec3 vN; varying vec3 vV; varying float vT;
      void main(){
        float d = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
        float fl = 0.85 + 0.15 * sin(uT * 23.0) * sin(uT * 7.3);
        float a = d * smoothstep(0.0, 0.08, vT) * (1.0 - vT * 0.55) * uS * fl;
        gl_FragColor = vec4(uC * a, a);
      }`,
  });
  const m = new THREE.Mesh(geo, mat);
  m.position.copy(from); m.quaternion.setFromUnitVectors(V3(0, 1, 0), dir);
  m.frustumCulled = false; m.renderOrder = 7;
  return m;
}
// shimmering light on a floor (fishbowl, water)
export function caustic(x, z, w, d, color, strength = 0.7, y = 0.012) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uC: { value: C(color) }, uS: { value: strength }, uT: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 uC; uniform float uS, uT; varying vec2 vUv;
      float web(vec2 p, float t){
        float c = 0.0; vec2 q = p;
        for (int i = 0; i < 3; i++) {
          q += vec2(sin(q.y * 1.3 + t * 0.8 + float(i) * 1.7), cos(q.x * 1.1 - t * 0.6 + float(i) * 2.3)) * 0.55;
          c += 0.06 / (0.05 + abs(sin(q.x * 1.6) * sin(q.y * 1.6)));
        }
        return c / 3.0;
      }
      void main(){
        vec2 p = (vUv - 0.5) * 2.0;
        float m = smoothstep(1.0, 0.25, length(p));
        float c = web(vUv * vec2(9.0, 6.0), uT);
        gl_FragColor = vec4(uC * pow(c, 1.6) * m * uS, 1.0);
      }`,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.renderOrder = 2;
  return m;
}

// ----------------------------------------------------- reflections room
// a little invisible room around the fight whose bright panels become the
// highlights and reflections on the jelly
export function makeEnv(renderer, o) {
  const s = new THREE.Scene();
  const bgC = canvas(4, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, o.top); gr.addColorStop(0.5, o.mid); gr.addColorStop(1, o.bot);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  const bgT = ctex(bgC);
  const sph = new THREE.Mesh(new THREE.SphereGeometry(30, 32, 16), new THREE.MeshBasicMaterial({ map: bgT, side: THREE.BackSide }));
  s.add(sph);
  for (const [pos, w, h, col, k] of o.panels) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: C(col).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 1, 0); s.add(m);
  }
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, 0.03);
  pm.dispose();
  s.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material) { if (x.material.map) x.material.map.dispose(); x.material.dispose(); } });
  return rt;
}

// lights: a back light that throws real (once-computed) soft shadows,
// a front fill, rims and the odd point light
export function rig(g, o) {
  const L = {};
  L.hemi = new THREE.HemisphereLight(C(o.hemi[0]), C(o.hemi[1]), o.hemi[2]); g.add(L.hemi);
  const s = o.sun;
  L.sun = new THREE.DirectionalLight(C(s.c), s.i);
  L.sun.position.set(...s.p); L.sun.target.position.set(...(s.t || [0, 0, -2]));
  g.add(L.sun, L.sun.target);
  L.sun.castShadow = true;
  L.sun.shadow.mapSize.set(2048, 2048);
  const sc = L.sun.shadow.camera; const b = s.box || [24, 14, 120];
  sc.left = -b[0]; sc.right = b[0]; sc.top = b[1]; sc.bottom = -b[1]; sc.near = 0.5; sc.far = b[2];
  L.sun.shadow.bias = s.bias ?? -0.0006; L.sun.shadow.normalBias = s.nb ?? 0.04;
  L.fill = new THREE.DirectionalLight(C(o.fill.c), o.fill.i); L.fill.position.set(...o.fill.p); g.add(L.fill);
  L.rims = (o.rims || []).map(([c, i, p]) => { const l = new THREE.DirectionalLight(C(c), i); l.position.set(...p); g.add(l); return l; });
  L.points = (o.points || []).map(([c, i, d, p]) => { const l = new THREE.PointLight(C(c), i, d, 2); l.position.set(...p); g.add(l); return l; });
  L.spots = (o.spots || []).map(([c, i, d, ang, p, t]) => { const l = new THREE.SpotLight(C(c), i, d, ang, 0.6, 1.5); l.position.set(...p); l.target.position.set(...t); g.add(l, l.target); return l; });
  for (const k of ['sun', 'fill']) L[k].userData.i0 = L[k].intensity;
  for (const l of [...L.rims, ...L.points, ...L.spots, L.hemi]) l.userData.i0 = l.intensity;
  return L;
}
