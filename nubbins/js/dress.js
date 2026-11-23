// NUBBINS — costumes. Bands are fitted to each bear's own shape by
// feeling for its surface, then baked onto the bone they ride on.
import * as THREE from '../lib/three.module.min.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const C = c => new THREE.Color(c);
function smin(a, b, k) { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; }

const mat = (color, o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color: C(color), roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12 }, o));
const gold = () => mat('#ffc23a', { metalness: 1, roughness: 0.22, clearcoat: 0.6 });

function partSDF(g, bones) {
  const ps = g.prims.filter(p => bones.includes(p.bone));
  return (x, y, z) => { let d = ps[0].d(x, y, z); for (let i = 1; i < ps.length; i++) d = smin(d, ps[i].d(x, y, z), g.blend); return d; };
}
function grad(sdf, p, e = 0.002) {
  return V(sdf(p.x + e, p.y, p.z) - sdf(p.x - e, p.y, p.z), sdf(p.x, p.y + e, p.z) - sdf(p.x, p.y - e, p.z), sdf(p.x, p.y, p.z + e) - sdf(p.x, p.y, p.z - e)).normalize();
}
// walk inward from outside until we touch the surface
function feel(sdf, from, dir) {
  const p = from.clone();
  for (let i = 0; i < 100; i++) { const d = sdf(p.x, p.y, p.z); if (Math.abs(d) < 0.0004) break; p.addScaledVector(dir, d * 0.85); }
  return p;
}
function ring(sdf, cy, tilt = 0, n = 64, cz = 0) {
  const pts = [], nrm = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const dir = V(Math.cos(a), 0, Math.sin(a));
    const y = cy + tilt * Math.sin(a);
    const p = feel(sdf, V(dir.x * 0.6, y, cz + dir.z * 0.6), V(-dir.x, 0, -dir.z));
    pts.push(p); nrm.push(grad(sdf, p));
  }
  return { pts, nrm };
}
function ribbonGeo({ pts, nrm }, h, off) {
  const n = pts.length, pos = [], nor = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const p = pts[i % n], q = nrm[i % n];
    const up = V(0, 1, 0);
    const o = p.clone().addScaledVector(q, off);
    const bulge = q.clone().multiplyScalar(off * 0.6);
    for (const [k, s] of [[0, -1], [1, 0], [2, 1]]) {
      const v = o.clone().addScaledVector(up, s * h / 2).add(k === 1 ? bulge : V(0, 0, 0));
      pos.push(v.x, v.y, v.z);
      const nn = q.clone().addScaledVector(up, s * 0.6).normalize(); nor.push(nn.x, nn.y, nn.z);
    }
  }
  for (let i = 0; i < n; i++) for (let k = 0; k < 2; k++) {
    const a = i * 3 + k, b = (i + 1) * 3 + k;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

// put a model-space mesh onto a bone
function bake(bear, bone, mesh) {
  const b = bear.bones[bone];
  bear.body.updateMatrixWorld(true);
  const inv = b.matrixWorld.clone().invert().multiply(bear.body.matrixWorld);
  mesh.geometry = mesh.geometry.clone();
  mesh.updateMatrix();
  mesh.geometry.applyMatrix4(inv.clone().multiply(mesh.matrix));
  mesh.position.set(0, 0, 0); mesh.rotation.set(0, 0, 0); mesh.scale.set(1, 1, 1);
  b.add(mesh);
  return mesh;
}
// put a group (posed in model space) onto a bone, keeping it movable
function pin(bear, bone, obj) {
  const b = bear.bones[bone];
  bear.body.updateMatrixWorld(true);
  const inv = b.matrixWorld.clone().invert().multiply(bear.body.matrixWorld);
  obj.updateMatrix();
  obj.matrix.premultiply(inv); obj.matrix.decompose(obj.position, obj.quaternion, obj.scale);
  b.add(obj);
  return obj;
}

function tails(bear, at, color, len = 0.16, spread = 0.35) {
  const geo = new THREE.CapsuleGeometry(0.024, len, 4, 10); geo.translate(0, -len / 2, 0); geo.scale(1.9, 1, 0.42);
  const m = mat(color);
  const ts = [];
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.copy(at);
    const t = new THREE.Mesh(geo, m); piv.add(t);
    piv.rotation.set(0.9, 0, s * spread);
    pin(bear, 'head', piv); ts.push({ piv, s, base: piv.rotation.clone() });
  }
  bear.tickers.push((time) => { for (const t of ts) { t.piv.rotation.x = t.base.x + Math.sin(time * 9 + t.s) * 0.18 + bear.springs.head.x * 0.8; t.piv.rotation.z = t.base.z + Math.sin(time * 7 + t.s * 2) * 0.1; } });
}

// Costumes are switched off since Nov 23 2026: the bears are bare gummies, and
// only Gummoth keeps his crown. Set COSTUMES to true to bring the rest back.
export const COSTUMES = false;

export function dress(bear, kind) {
  if (!COSTUMES && kind !== 'gummoth') return;
  const g = bear.g;
  const head = partSDF(g, ['head']);
  const torso = partSDF(g, ['body', 'belly']);
  const neck = partSDF(g, ['body', 'head']);
  const sk = g.sockets;
  const eyeMid = sk.eyes[0].p.clone().add(sk.eyes[1].p).multiplyScalar(0.5);

  if (kind === 'cherry') {
    const band = new THREE.Mesh(ribbonGeo(ring(head, 0.725, -0.03), 0.055, 0.012), mat('#ffffff', { roughness: 0.45, sheen: 1 }));
    bake(bear, 'head', band);
    tails(bear, V(0.03, 0.72, -0.17), '#ffffff', 0.17);
    const stemCurve = new THREE.CatmullRomCurve3([V(0, sk.top.y - 0.02, -0.01), V(0.005, sk.top.y + 0.06, -0.01), V(0.04, sk.top.y + 0.13, -0.02), V(0.1, sk.top.y + 0.16, -0.03)]);
    const stem = new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 16, 0.013, 8), mat('#3a8a1a', { roughness: 0.4 }));
    bake(bear, 'head', stem);
    const leafG = new THREE.SphereGeometry(1, 16, 8); leafG.scale(0.055, 0.008, 0.026);
    const leaf = new THREE.Mesh(leafG, mat('#4ec02a', { roughness: 0.35 })); leaf.position.set(0.07, sk.top.y + 0.1, -0.02); leaf.rotation.set(0.2, 0.4, 0.5);
    bake(bear, 'head', leaf);
  }

  if (kind === 'razz') {
    const shades = new THREE.Group();
    const glass = mat('#0a0a18', { roughness: 0.05, iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [200, 600], clearcoat: 1 });
    const lensG = new THREE.CylinderGeometry(0.05, 0.05, 0.016, 24); lensG.rotateX(Math.PI / 2); lensG.scale(1.25, 0.95, 1);
    for (const e of sk.eyes) {
      const l = new THREE.Mesh(lensG, glass);
      l.position.copy(e.p).addScaledVector(e.n, 0.022); l.position.y += 0.004;
      l.lookAt(l.position.clone().add(e.n.clone().setY(0).normalize()));
      shades.add(l);
    }
    const br = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, Math.abs(sk.eyes[0].p.x - sk.eyes[1].p.x) - 0.08, 3, 6), glass);
    br.rotation.z = Math.PI / 2; br.position.copy(eyeMid).add(V(0, 0.02, 0.035)); shades.add(br);
    for (const e of sk.eyes) {
      const s = Math.sign(e.p.x);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.012, 0.16), glass);
      arm.position.set(e.p.x + s * 0.055, e.p.y + 0.01, e.p.z - 0.06); arm.rotation.y = s * 0.45; shades.add(arm);
    }
    pin(bear, 'head', shades);
    for (const e of bear.eyes) e.piv.visible = false;
    bear.hideEyes = true;
  }

  if (kind === 'sour') {
    const wedge = new THREE.Group();
    const flesh = new THREE.Mesh(new THREE.CircleGeometry(0.135, 32, 0, Math.PI), mat('#e8ffb0', { roughness: 0.3, side: THREE.DoubleSide, emissive: C('#304010'), transmission: 0.3, thickness: 0.02 }));
    const rind = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.02, 8, 32, Math.PI), mat('#3aa010', { roughness: 0.35 }));
    const segs = new THREE.Group();
    for (let i = 1; i < 5; i++) { const a = i / 5 * Math.PI; const s = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.006, 0.026), mat('#ffffff', { roughness: 0.4 })); s.position.set(Math.cos(a) * 0.055, Math.sin(a) * 0.055, 0); s.rotation.z = a; segs.add(s); }
    wedge.add(flesh, rind, segs);
    wedge.rotation.y = Math.PI / 2 - 0.75; wedge.position.set(0.02, sk.top.y - 0.04, -0.01); wedge.rotation.x = 0; wedge.rotation.z = 0.0;
    const tilt = new THREE.Group(); tilt.add(wedge); tilt.rotation.z = -0.25;
    tilt.position.set(0, 0, 0);
    pin(bear, 'head', tilt);
  }

  if (kind === 'tango') {
    const r = ring(torso, 0.255, 0, 72);
    const belt = new THREE.Mesh(ribbonGeo(r, 0.07, 0.014), mat('#1a1a2a', { roughness: 0.3 }));
    bake(bear, 'hips', belt);
    const front = r.pts.reduce((a, p) => (p.z > a.z ? p : a), r.pts[0]);
    const buckle = new THREE.Group();
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.022, 32), gold()); plate.rotation.x = Math.PI / 2; plate.scale.set(1.35, 1, 1);
    const gem = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 10), mat('#ff2a2a', { roughness: 0.05, transmission: 0.6, thickness: 0.03 })); gem.position.z = 0.016;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.083, 0.008, 8, 32), gold()); rim.scale.set(1.35, 1, 1); rim.position.z = 0.012;
    buckle.add(plate, gem, rim); buckle.position.copy(front).add(V(0, 0, 0.022));
    pin(bear, 'hips', buckle);
    for (const [paw, arm] of [['pawL', 'armL'], ['pawR', 'armR']]) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.022, 10, 24), mat('#ff2a3a', { roughness: 0.4 }));
      const bp = g.bind[paw];
      const dir = (arm === 'armL' ? V(...g.s.armDir) : V(-g.s.armDir[0], g.s.armDir[1], g.s.armDir[2])).normalize();
      band.position.copy(bp).addScaledVector(dir, -0.03);
      band.quaternion.setFromUnitVectors(V(0, 0, 1), dir);
      pin(bear, paw, band);
    }
  }

  if (kind === 'ghost') {
    const eyeY = (sk.eyes[0].p.y + sk.eyes[1].p.y) / 2;
    const band = new THREE.Mesh(ribbonGeo(ring(head, eyeY + 0.004, -0.015), 0.085, 0.01), mat('#141838', { roughness: 0.45, sheen: 1, sheenColor: C('#6a7aff') }));
    bake(bear, 'head', band);
    tails(bear, V(0.02, eyeY, -0.17), '#141838', 0.2, 0.3);
    for (const e of bear.eyes) e.piv.position.addScaledVector(e.n, 0.022);
    for (const b of bear.brows) { b.base.addScaledVector(V(0, 0, 1), 0.01); b.base.y += 0.012; }
    const scarf = new THREE.Mesh(ribbonGeo(ring(neck, 0.535, 0.02, 64), 0.065, 0.02), mat('#e03050', { roughness: 0.6, sheen: 1 }));
    bake(bear, 'chest', scarf);
    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.14, 4, 8), mat('#e03050', { roughness: 0.6 }));
    tail.scale.set(1.8, 1, 0.5); tail.position.set(-0.08, 0.45, -0.17); tail.rotation.set(0.5, 0, 0.3);
    bake(bear, 'chest', tail);
  }

  if (kind === 'duke') {
    const hat = new THREE.Group();
    const black = mat('#140a1a', { roughness: 0.2 });
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.014, 32), black);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.1, 0.17, 32), black); crown.position.y = 0.09;
    const ribbonM = new THREE.Mesh(new THREE.CylinderGeometry(0.102, 0.102, 0.035, 32), mat('#8a2be2', { roughness: 0.4 })); ribbonM.position.y = 0.03;
    hat.add(brim, crown, ribbonM);
    hat.position.set(0.03, sk.top.y - 0.025, -0.02); hat.rotation.z = -0.22; hat.rotation.x = -0.08;
    pin(bear, 'head', hat);
    const e = sk.eyes[1];
    const mono = new THREE.Group();
    const ringM = new THREE.Mesh(new THREE.TorusGeometry(0.047, 0.007, 8, 28), gold());
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.045, 24), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0, transmission: 1, thickness: 0.01, transparent: true, opacity: 0.25 }));
    mono.add(ringM, lens);
    mono.position.copy(e.p).addScaledVector(e.n, 0.024);
    mono.lookAt(mono.position.clone().add(e.n));
    pin(bear, 'head', mono);
    const chain = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([e.p.clone().add(V(-0.04, -0.03, 0.03)), e.p.clone().add(V(-0.09, -0.12, 0.02)), V(-0.15, 0.45, 0.12)]), 20, 0.004, 5), gold());
    bake(bear, 'head', chain);
    const stache = new THREE.Group();
    const black2 = mat('#1a0a10', { roughness: 0.35 });
    for (const s of [-1, 1]) {
      const pts = [V(0, 0, 0), V(s * 0.04, -0.008, 0), V(s * 0.075, 0.002, -0.005), V(s * 0.085, 0.022, -0.01), V(s * 0.07, 0.03, -0.012)];
      const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.013, 8), black2);
      stache.add(m);
    }
    stache.position.copy(sk.nose).add(V(0, -0.03, 0.005));
    pin(bear, 'head', stache);
    // the cane, held in whichever paw is nearer the camera during the lunge
    bear.canes = [];
    for (const paw of ['pawL', 'pawR']) {
      const cane = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.55, 10), black); shaft.position.y = -0.2;
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), gold()); knob.position.y = 0.08;
      cane.add(shaft, knob);
      cane.position.copy(g.bind[paw]);
      const dir = (paw === 'pawL' ? V(...g.s.armDir) : V(-g.s.armDir[0], g.s.armDir[1], g.s.armDir[2])).normalize();
      cane.quaternion.setFromUnitVectors(V(0, 1, 0), dir);
      cane.visible = false;
      pin(bear, paw, cane); bear.canes.push(cane);
    }
  }

  if (kind === 'gummoth') {
    const crown = new THREE.Group();
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.125, 0.06, 32, 1, true), mat('#ffc23a', { metalness: 1, roughness: 0.22, side: THREE.DoubleSide }));
    crown.add(band);
    const gemCols = ['#ff2a6a', '#2ad1ff', '#9cff3a', '#ffd34f', '#c070ff'];
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.09, 8), gold()); spike.position.set(Math.cos(a) * 0.12, 0.07, Math.sin(a) * 0.12); crown.add(spike);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), gold()); ball.position.set(Math.cos(a) * 0.12, 0.12, Math.sin(a) * 0.12); crown.add(ball);
      const gem = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 8), mat(gemCols[i], { roughness: 0.05, emissive: C(gemCols[i]).multiplyScalar(0.3) })); gem.position.set(Math.cos(a + 0.6) * 0.125, 0.005, Math.sin(a + 0.6) * 0.125); crown.add(gem);
    }
    crown.position.set(0, sk.top.y + 0.005, -0.01); crown.rotation.z = 0.08;
    pin(bear, 'head', crown);
  }
}
