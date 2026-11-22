// NUBBINS — effects: sugar sparkles, sugar crystals, rings, shadows,
// projectiles, ice blocks, dizzy stars and comic words.
import * as THREE from '../lib/three.module.min.js';

const rand = (a, b) => a + Math.random() * (b - a);

function canvasTex(size, draw) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export const TEX = {};
function makeTextures() {
  if (TEX.glow) return;
  TEX.glow = canvasTex(64, (g, s) => { const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,0.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, s, s); });
  TEX.star = canvasTex(64, (g, s) => {
    const c = s / 2; const r = g.createRadialGradient(c, c, 0, c, c, c * 0.45); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, s, s);
    g.fillStyle = '#fff'; g.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? c * 0.12 : c * 0.98; g.lineTo(c + Math.cos(a) * rr, c + Math.sin(a) * rr); }
    g.closePath(); g.fill();
  });
}

// ------------------------------------------------------------ particles
class Particles {
  constructor(scene, tex, max, additive = true) {
    this.max = max; this.n = 0;
    this.p = new Float32Array(max * 3); this.v = new Float32Array(max * 3);
    this.c = new Float32Array(max * 3); this.s = new Float32Array(max); this.a = new Float32Array(max);
    this.life = new Float32Array(max); this.age = new Float32Array(max); this.grav = new Float32Array(max); this.drag = new Float32Array(max); this.grow = new Float32Array(max);
    const g = new THREE.BufferGeometry();
    this.ap = new THREE.BufferAttribute(new Float32Array(max * 3), 3); this.ac = new THREE.BufferAttribute(new Float32Array(max * 3), 3);
    this.as = new THREE.BufferAttribute(new Float32Array(max), 1); this.aa = new THREE.BufferAttribute(new Float32Array(max), 1);
    for (const at of [this.ap, this.ac, this.as, this.aa]) at.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', this.ap); g.setAttribute('color', this.ac); g.setAttribute('size', this.as); g.setAttribute('alpha', this.aa);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, uScale: { value: 600 } },
      vertexShader: `attribute float size; attribute float alpha; attribute vec3 color; varying vec3 vC; varying float vA;
        uniform float uScale;
        void main(){ vC = color; vA = alpha; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform sampler2D map; varying vec3 vC; varying float vA;
        void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC * t.rgb * vA, t.a * vA); }`,
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(g, this.mat); this.points.frustumCulled = false; this.points.renderOrder = 5;
    scene.add(this.points);
  }
  emit(x, y, z, vx, vy, vz, col, size, life, grav = 0, drag = 0, grow = 0) {
    let i = this.n < this.max ? this.n++ : (Math.random() * this.max) | 0;
    this.p[i * 3] = x; this.p[i * 3 + 1] = y; this.p[i * 3 + 2] = z;
    this.v[i * 3] = vx; this.v[i * 3 + 1] = vy; this.v[i * 3 + 2] = vz;
    this.c[i * 3] = col.r; this.c[i * 3 + 1] = col.g; this.c[i * 3 + 2] = col.b;
    this.s[i] = size; this.life[i] = life; this.age[i] = 0; this.grav[i] = grav; this.drag[i] = drag; this.grow[i] = grow;
  }
  update(dt) {
    let j = 0;
    for (let i = 0; i < this.n; i++) {
      this.age[i] += dt;
      if (this.age[i] >= this.life[i]) continue;
      if (j !== i) {
        for (let k = 0; k < 3; k++) { this.p[j * 3 + k] = this.p[i * 3 + k]; this.v[j * 3 + k] = this.v[i * 3 + k]; this.c[j * 3 + k] = this.c[i * 3 + k]; }
        this.s[j] = this.s[i]; this.life[j] = this.life[i]; this.age[j] = this.age[i]; this.grav[j] = this.grav[i]; this.drag[j] = this.drag[i]; this.grow[j] = this.grow[i];
      }
      const d = Math.exp(-this.drag[j] * dt);
      this.v[j * 3] *= d; this.v[j * 3 + 1] = this.v[j * 3 + 1] * d - this.grav[j] * dt; this.v[j * 3 + 2] *= d;
      this.p[j * 3] += this.v[j * 3] * dt; this.p[j * 3 + 1] += this.v[j * 3 + 1] * dt; this.p[j * 3 + 2] += this.v[j * 3 + 2] * dt;
      if (this.p[j * 3 + 1] < 0.01 && this.grav[j] > 0) { this.p[j * 3 + 1] = 0.01; this.v[j * 3 + 1] *= -0.3; }
      j++;
    }
    this.n = j;
    const P = this.ap.array, C = this.ac.array, S = this.as.array, A = this.aa.array;
    for (let i = 0; i < this.n; i++) {
      const u = this.age[i] / this.life[i];
      P[i * 3] = this.p[i * 3]; P[i * 3 + 1] = this.p[i * 3 + 1]; P[i * 3 + 2] = this.p[i * 3 + 2];
      C[i * 3] = this.c[i * 3]; C[i * 3 + 1] = this.c[i * 3 + 1]; C[i * 3 + 2] = this.c[i * 3 + 2];
      S[i] = this.s[i] * (1 + this.grow[i] * u) * (u < 0.1 ? u * 10 : 1);
      A[i] = u < 0.1 ? 1 : 1 - (u - 0.1) / 0.9;
    }
    for (let i = this.n; i < this.max; i++) { A[i] = 0; S[i] = 0; }
    this.ap.needsUpdate = this.ac.needsUpdate = this.as.needsUpdate = this.aa.needsUpdate = true;
    this.points.geometry.setDrawRange(0, Math.max(1, this.n));
  }
  clear() { this.n = 0; }
}

// ------------------------------------------------------------- the FX hub
export class FX {
  constructor(scene, opts = {}) {
    makeTextures();
    this.scene = scene;
    this.root = new THREE.Group(); scene.add(this.root);
    this.sparks = new Particles(this.root, TEX.star, 700, true);
    this.glows = new Particles(this.root, TEX.glow, 500, true);
    this.puffs = new Particles(this.root, TEX.glow, 260, false);
    // sugar crystals: faceted sugar bits that fly off a hit, bounce and twinkle out.
    // Nothing liquid and nothing left on the floor, so a red bear never looks like it is bleeding.
    const beadGeo = new THREE.OctahedronGeometry(1, 0); beadGeo.scale(0.8, 1.15, 0.8);
    this.beadMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.04, flatShading: true });
    this.beadMat.onBeforeCompile = sh => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += diffuseColor.rgb * (0.3 + 0.5 * pow(abs(dot(normal, normalize(vViewPosition))), 6.0));`);
    };
    this.maxBeads = 180;
    this.beads = new THREE.InstancedMesh(beadGeo, this.beadMat, this.maxBeads);
    this.beads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.beads.setColorAt(0, new THREE.Color(1, 1, 1)); this.beads.instanceColor.setUsage(THREE.DynamicDrawUsage);
    this.beads.frustumCulled = false; this.beads.count = 0;
    this.root.add(this.beads);
    this.beadList = [];
    this.white = new THREE.Color(1, 1, 1); this.twinkle = new THREE.Color('#fffbe8');
    // rings
    this.rings = [];
    const ringGeo = new THREE.RingGeometry(0.82, 1, 48);
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      m.visible = false; this.root.add(m); this.rings.push({ m, age: 0, life: 0, size: 1, flat: false });
    }
    this.tmpM = new THREE.Matrix4(); this.tmpQ = new THREE.Quaternion(); this.tmpS = new THREE.Vector3(); this.tmpP = new THREE.Vector3(); this.tmpC = new THREE.Color();
    this.ambient = null; // per-stage ambient emitter
    this.words = opts.wordLayer || null;
    this.camera = opts.camera;
    this.t = 0;
  }

  setScale(px) { for (const s of [this.sparks, this.glows, this.puffs]) s.mat.uniforms.uScale.value = px; }

  burst(pos, color, n = 20, speed = 3, size = 0.1, life = 0.5) {
    const c = new THREE.Color(color);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, b = rand(-1, 1), sp = speed * rand(0.4, 1.1);
      const k = Math.sqrt(1 - b * b);
      const cc = c.clone().lerp(new THREE.Color(1, 1, 1), Math.random() * 0.5);
      this.sparks.emit(pos.x, pos.y, pos.z, Math.cos(a) * k * sp, b * sp + 1, Math.sin(a) * k * sp * 0.6, cc, size * rand(0.6, 1.4), life * rand(0.6, 1.3), 4, 3);
    }
  }
  glow(pos, color, size = 0.6, life = 0.3) { this.glows.emit(pos.x, pos.y, pos.z, 0, 0, 0, new THREE.Color(color), size, life, 0, 0, 0.6); }
  puff(pos, color, n = 6, size = 0.35, life = 0.7, spread = 1) {
    const c = new THREE.Color(color);
    for (let i = 0; i < n; i++) this.puffs.emit(pos.x + rand(-0.1, 0.1), pos.y + rand(-0.05, 0.1), pos.z + rand(-0.1, 0.1), rand(-1, 1) * spread, rand(0.2, 1) * spread, rand(-0.3, 0.3), c, size * rand(0.7, 1.2), life * rand(0.7, 1.2), -0.3, 2, 1.2);
  }
  glowPuff(pos, color, n = 6, size = 0.35, life = 0.7, spread = 1) {
    const c = new THREE.Color(color);
    for (let i = 0; i < n; i++) this.glows.emit(pos.x + rand(-0.1, 0.1), pos.y + rand(-0.05, 0.1), pos.z + rand(-0.1, 0.1), rand(-1, 1) * spread, rand(0.1, 1) * spread, rand(-0.3, 0.3), c, size * rand(0.7, 1.2), life * rand(0.7, 1.2), 0, 2, 1);
  }
  dust(x, color = '#d8c0c8', n = 8, spread = 1.5) {
    const c = new THREE.Color(color);
    for (let i = 0; i < n; i++) this.puffs.emit(x + rand(-0.2, 0.2), 0.05, rand(-0.15, 0.15), rand(-1, 1) * spread, rand(0.1, 0.6), rand(-0.3, 0.3), c, rand(0.25, 0.45), rand(0.4, 0.8), -0.2, 2.5, 1.4);
  }

  // sugar crystals flying off a hit (pastel, never drops of liquid)
  beadsAt(pos, color, n = 8, dir = 1, power = 1) {
    const c = new THREE.Color(color);
    for (let i = 0; i < n; i++) {
      if (this.beadList.length >= this.maxBeads) this.beadList.shift();
      this.beadList.push({
        p: pos.clone(), v: new THREE.Vector3((dir || (Math.random() < 0.5 ? -1 : 1)) * rand(0.5, 3.2) * power, rand(1.5, 5) * power, rand(-0.9, 0.9)),
        r: rand(0.016, 0.038) * (0.8 + power * 0.3), c: c.clone().lerp(this.white, rand(0.5, 0.75)), age: 0, bounces: 0, land: -1,
        ax: new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize(), ang: rand(0, 6), w: rand(8, 18),
      });
    }
  }

  ring(pos, color, size = 1, life = 0.35, flat = false) {
    const r = this.rings.find(r => !r.m.visible) || this.rings[0];
    r.m.visible = true; r.age = 0; r.life = life; r.size = size; r.flat = flat;
    r.m.position.copy(pos); r.m.material.color.set(color);
    r.m.rotation.set(flat ? -Math.PI / 2 : 0, 0, 0);
  }

  // a hit: sparkle burst + ring + beads, sized by power
  hit(pos, color, power = 1, dir = 1, blocked = false) {
    if (blocked) {
      this.burst(pos, '#cfe8ff', 10, 2.2, 0.09, 0.3);
      this.ring(pos, '#bfe0ff', 0.25, 0.18);
      this.glow(pos, '#a0d0ff', 0.5, 0.15);
      return;
    }
    this.burst(pos, '#ffffff', 10 + power * 8, 2.5 + power * 1.5, 0.11, 0.45);
    this.burst(pos, color, 8 + power * 8, 2 + power, 0.09, 0.55);
    this.glow(pos, color, 0.8 + power * 0.5, 0.22);
    this.glow(pos, '#ffffff', 0.4 + power * 0.3, 0.12);
    this.ring(pos, '#ffffff', 0.2 + power * 0.16, 0.22);
    this.beadsAt(pos, color, Math.round(3 + power * 6), dir, 0.8 + power * 0.4);
  }

  update(dt) {
    this.t += dt;
    this.sparks.update(dt); this.glows.update(dt); this.puffs.update(dt);
    // sugar crystals
    let i = 0;
    for (const b of this.beadList) {
      b.age += dt;
      if (b.land < 0) {
        b.v.y -= 16 * dt; b.p.addScaledVector(b.v, dt); b.ang += b.w * dt;
        if (b.p.y < b.r) {
          b.p.y = b.r; b.bounces++; b.w *= 0.6;
          if (b.bounces > 2 || Math.abs(b.v.y) < 1.2) { b.land = b.age; if (Math.random() < 0.35) this.sparks.emit(b.p.x, b.p.y + 0.02, b.p.z, 0, 0.5, 0, this.twinkle, 0.05, 0.25, 0, 0); }
          else { b.v.y *= -0.4; b.v.x *= 0.55; b.v.z *= 0.55; }
        }
      } else if (b.age - b.land > 0.35) b.dead = true;
      if (b.age > 3) b.dead = true;
    }
    this.beadList = this.beadList.filter(b => !b.dead);
    for (const b of this.beadList) {
      const k = b.land < 0 ? 1 : Math.max(0, 1 - (b.age - b.land) / 0.35);
      this.tmpQ.setFromAxisAngle(b.ax, b.ang); this.tmpS.setScalar(b.r * k);
      this.tmpM.compose(b.p, this.tmpQ, this.tmpS);
      this.beads.setMatrixAt(i, this.tmpM); this.beads.setColorAt(i, b.c); i++;
    }
    this.beads.count = i;
    this.beads.instanceMatrix.needsUpdate = true; if (this.beads.instanceColor) this.beads.instanceColor.needsUpdate = true;
    // rings
    for (const r of this.rings) {
      if (!r.m.visible) continue;
      r.age += dt; const u = r.age / r.life;
      if (u >= 1) { r.m.visible = false; continue; }
      const s = r.size * (0.3 + u * 1.2); r.m.scale.set(s, s, s);
      r.m.material.opacity = (1 - u) * (r.flat ? 0.8 : 0.55);
      if (!r.flat && this.camera) r.m.quaternion.copy(this.camera.quaternion);
    }
    if (this.ambient) this.ambient(dt, this);
  }

  clear() {
    this.sparks.clear(); this.glows.clear(); this.puffs.clear(); this.beadList = [];
    for (const r of this.rings) r.m.visible = false;
    this.update(0);
  }
}

// ---------------------------------------------------- shadow + caustic
export function makeShadow(color) {
  const g = new THREE.Group();
  const geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);
  const sh = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uA: { value: 0.55 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying vec2 vUv; uniform float uA; void main(){ float d = length((vUv - 0.5) * 2.0); float a = smoothstep(1.0, 0.0, d); gl_FragColor = vec4(0.0, 0.0, 0.0, a * a * uA); }',
  }));
  sh.renderOrder = 1; sh.position.y = 0.003;
  const ca = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uC: { value: new THREE.Color(color) }, uT: { value: 0 }, uA: { value: 0.9 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec2 vUv; uniform vec3 uC; uniform float uT, uA;
      void main(){ vec2 p = (vUv - 0.5) * 2.0; float d = length(p);
        float c = sin(p.x * 9.0 + uT * 2.0 + sin(p.y * 7.0 - uT)) * sin(p.y * 8.0 - uT * 1.6 + sin(p.x * 6.0 + uT * 1.3));
        float k = pow(max(0.0, c), 3.0) * 0.9 + 0.35;
        float a = smoothstep(0.85, 0.1, d);
        gl_FragColor = vec4(uC * k * a * uA, 1.0); }`,
  }));
  ca.renderOrder = 2; ca.position.y = 0.005;
  g.add(sh, ca);
  g.userData = { sh, ca };
  return g;
}

// ------------------------------------------------------ projectile looks
function phys(color, o = {}) {
  return new THREE.MeshPhysicalMaterial(Object.assign({ color: new THREE.Color(color), roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.08 }, o));
}
function starShape(points = 5, r1 = 1, r0 = 0.45) {
  const s = new THREE.Shape();
  for (let i = 0; i <= points * 2; i++) { const a = i * Math.PI / points + Math.PI / 2, r = i % 2 ? r0 : r1; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? s.lineTo(x, y) : s.moveTo(x, y); }
  return s;
}

export function makeProjectileMesh(type, owner) {
  const g = new THREE.Group();
  const tint = owner && owner.def ? owner.def.flavor : { tint: '#fff', deep: '#fff' };
  switch (type) {
    case 'cherry': {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 16), phys('#ff1030', { transmission: 0.6, thickness: 0.2, attenuationColor: new THREE.Color('#a00010'), attenuationDistance: 0.12, emissive: new THREE.Color('#400008') }));
      const stem = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(0.02, 0.18, 0), new THREE.Vector3(0.07, 0.24, 0)]), 8, 0.012, 6), phys('#2f8a1a'));
      const fuse = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff3a0' })); fuse.position.set(0.07, 0.24, 0);
      g.add(m, stem, fuse); g.userData.spin = 6; g.userData.trail = '#ff6070'; g.userData.fuse = fuse; break;
    }
    case 'ice': {
      const geo = new THREE.OctahedronGeometry(0.13, 0); geo.scale(2.2, 0.8, 0.8);
      const m = new THREE.Mesh(geo, phys('#d8f2ff', { transmission: 1, thickness: 0.3, ior: 1.31, roughness: 0.05, attenuationColor: new THREE.Color('#6ab8ff'), attenuationDistance: 0.4, emissive: new THREE.Color('#103060') }));
      g.add(m); g.userData.roll = 8; g.userData.trail = '#bfe8ff'; break;
    }
    case 'pillar': {
      const geo = new THREE.ConeGeometry(0.26, 1.4, 6, 1); geo.translate(0, 0.7, 0);
      const m = new THREE.Mesh(geo, phys('#d8f2ff', { transmission: 1, thickness: 0.5, ior: 1.31, roughness: 0.06, attenuationColor: new THREE.Color('#4aa0ff'), attenuationDistance: 0.6, emissive: new THREE.Color('#0a2048') }));
      for (let i = 0; i < 4; i++) { const sg = new THREE.ConeGeometry(0.1, 0.6, 5); sg.translate(0, 0.3, 0); const s = new THREE.Mesh(sg, m.material); s.position.set(Math.cos(i * 1.7) * 0.22, 0, Math.sin(i * 1.7) * 0.22); s.rotation.set(Math.sin(i) * 0.4, 0, Math.cos(i * 2) * 0.4); m.add(s); }
      g.add(m); g.userData.rise = m; break;
    }
    case 'sour': {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), new THREE.MeshBasicMaterial({ color: '#b6ff5a', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
      g.add(m); g.userData.cloud = '#a8ff40'; g.userData.wobble = m; break;
    }
    case 'peel': {
      const geo = new THREE.TorusGeometry(0.15, 0.045, 8, 24, Math.PI * 1.35); geo.scale(1, 1, 0.55);
      const m = new THREE.Mesh(geo, phys('#ff8a1a', { roughness: 0.35 }));
      const inner = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 6, 24, Math.PI * 1.35), phys('#fff2dc', { roughness: 0.6 }));
      g.add(m, inner); g.userData.spinZ = 16; g.userData.trail = '#ffb060'; break;
    }
    case 'star': {
      const geo = new THREE.ExtrudeGeometry(starShape(4, 0.11, 0.035), { depth: 0.02, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 2 });
      geo.center();
      const m = new THREE.Mesh(geo, phys('#ffffff', { transmission: 0.85, thickness: 0.05, roughness: 0.25, emissive: new THREE.Color('#fff2b0'), emissiveIntensity: 0.4, sheen: 1 }));
      g.add(m); g.userData.spinZ = 30; g.userData.trail = '#fff6c8'; break;
    }
    case 'grape': {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 18, 12), phys('#8a2be2', { transmission: 0.55, thickness: 0.15, attenuationColor: new THREE.Color('#3a006a'), attenuationDistance: 0.1, emissive: new THREE.Color('#1a0030') }));
      g.add(m); g.userData.trail = '#c890ff'; break;
    }
    case 'glob': {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 28, 18), phys('#ffd8f4', { transmission: 1, thickness: 0.5, ior: 1.4, roughness: 0.15, attenuationColor: new THREE.Color('#ff40b0'), attenuationDistance: 0.35, emissive: new THREE.Color('#300020') }));
      g.add(m); g.userData.wobble = m; g.userData.trail = '#ff90e0'; break;
    }
    case 'wave': {
      const geo = new THREE.SphereGeometry(0.3, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2); geo.scale(1.2, 1.1, 0.9);
      const m = new THREE.Mesh(geo, phys('#ffd8f4', { transmission: 1, thickness: 0.4, roughness: 0.15, attenuationColor: new THREE.Color('#ff40b0'), attenuationDistance: 0.35 }));
      g.add(m); g.userData.wobble = m; g.userData.dust = true; break;
    }
    default: break; // quake: invisible hitbox, the ring sells it
  }
  return g;
}

// ------------------------------------------------------------ ice block
export function makeIceBlock() {
  const geo = new THREE.BoxGeometry(0.75, 1.1, 0.6, 1, 1, 1); geo.translate(0, 0.5, 0);
  const m = new THREE.Mesh(geo, phys('#e8f8ff', { transmission: 1, thickness: 0.4, ior: 1.31, roughness: 0.08, attenuationColor: new THREE.Color('#9ad4ff'), attenuationDistance: 1.2, clearcoat: 1 }));
  m.visible = false;
  return m;
}

// ---------------------------------------------------- dizzy stars
export function makeDizzyStars() {
  const g = new THREE.Group();
  const geo = new THREE.ExtrudeGeometry(starShape(5, 0.055, 0.024), { depth: 0.012, bevelEnabled: false }); geo.center();
  const mat = new THREE.MeshBasicMaterial({ color: '#ffe680' });
  for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(geo, mat); g.add(s); }
  g.visible = false;
  return g;
}

// ------------------------------------------------------------- confetti
export const CONFETTI = ['#ff4f7a', '#ffd34f', '#5ad1ff', '#9cff6a', '#c890ff', '#ffffff'];
