// NUBBINS — NUBBINATIONS. Every finisher is brutal in the squishy way and
// nobody gets hurt: they get inflated, frozen into babies, shrunk, rolled,
// wrapped, stickered or sat on, and they are fine.
import * as THREE from '../lib/three.module.min.js';
import { P, POSES, mix, resolve } from './anim.js';
import { sfx, say } from './audio.js';
import { CONFETTI } from './fx.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);

// shared set-up: lock both bears into the script and remember how they looked
function stage(M, W, L) {
  for (const F of [W, L]) { F.go('script'); F.move = null; F.vx = 0; F.vy = 0; F.y = 0; }
  const bw = M.bear(W), bl = M.bear(L);
  const save = [bw, bl].map(b => ({ b, s: b.group.scale.clone(), r: b.group.rotation.clone() }));
  const props = [];
  const add = o => { M.root.add(o); props.push(o); return o; };
  const cam = (x, y, z, lx, ly, fov = 30, snap = 3) => { M.cam.override = { x, y, z, lx, ly, fov, snap }; };
  const dir = Math.sign(L.x - W.x) || W.f;
  W.f = dir; L.f = -dir;
  const pose = (F, p) => { F.scriptPose = p; };
  const posed = (F, on) => { F.posed = on; };
  const bodyPose = (F, p) => { const b = M.bear(F); b.pose = resolve(p, F.f, b.pose); };
  const cleanup = () => {
    for (const o of props) o.removeFromParent();
    for (const s of save) { s.b.group.scale.copy(s.s); s.b.group.rotation.copy(s.r); s.b.group.visible = true; s.b.body.visible = true; }
    for (const F of [W, L]) { F.posed = false; F.scriptPose = null; F.forceExpr = null; F.hideShadow = false; F.z = 0; }
  };
  return { bw, bl, add, cam, dir, pose, posed, bodyPose, cleanup, fx: M.G.fx };
}

// walk the winner into place
function approach(M, W, L, t, want = 0.8, frames = 30) {
  const target = L.x - W.f * want * (W.sc + L.sc) * 0.5;
  const u = seg(t, 0, frames);
  if (u < 1) { W.x += (target - W.x) * 0.18; W.scriptPose = (() => { const p = P(W.def.stance); const ph = t * 0.35; p.y = Math.abs(Math.sin(ph)) * 0.04; p.lN = [0.3, -1, Math.sin(ph) * 0.5]; p.lF = [0.25, -1, -Math.sin(ph) * 0.5]; return p; })(); }
  return u >= 1;
}

function dizzyPose(t) { const p = P(POSES.dizzy); p.roll = Math.sin(t * 0.07) * 0.2; p.head = [-0.1, Math.sin(t * 0.09) * 0.3, Math.sin(t * 0.07) * 0.2]; return p; }

// a quick static jelly bear in a flavor (for babies and tiny versions)
function miniBear(M, F, scale) {
  const b = M.bear(F);
  const m = new THREE.Mesh(b.g.geo, b.mat);
  m.scale.setScalar(scale);
  return m;
}

// ================================================================= POP
function pop(M, W, L, done) {
  const S = stage(M, W, L); let t = 0;
  const base = S.bl.group.scale.x;
  let chute = null, tiny = null;
  M.G.ui.finisherName(W.def.finisher.name);
  return {
    step() {
      t++;
      const mid = (W.x + L.x) / 2;
      approach(M, W, L, t, 0.85, 26);
      L.scriptPose = t < 40 ? dizzyPose(t) : null;
      if (t < 40) S.cam(mid + 0.4, 1.0, 3.6, mid, 0.6);
      if (t === 34) { sfx('inflate'); M.G.ui.flash('#ffc0d4', 0.2); }
      if (t >= 34 && t < 130) {
        W.scriptPose = P({ lean: 0.35, turn: 0.4, aN: [0.1, 0.2, 1], aF: [0.15, 0.25, 1], aNs: 1.7, aFs: 1.7, head: [0.2, 0, 0], sq: 1 + Math.sin(t * 0.6) * 0.05, brow: 0.6 });
        const u = ease(seg(t, 34, 120));
        L.scriptPose = P({ aN: [1, 0.15, 0], aF: [1, 0.15, 0], aNs: 1.2, aFs: 1.2, lN: [0.6, -0.8, 0], lF: [0.6, -0.8, 0], eyeS: 1.4, brow: -0.6, sq: 1 });
        L.forceExpr = 'hurt';
        const w = Math.sin(t * 0.9) * 0.04 * u;
        S.bl.group.scale.set(base * (1 + u * 1.4 + w), base * (1 + u * 1.15 - w), base * (1 + u * 1.4 + w));
        L.y = u * 0.35;
        if (t % 4 === 0) S.fx.glowPuff(V(W.x + W.f * 0.25 * W.sc, 0.65 * W.sc, 0.2), '#ffd0e0', 2, 0.25, 0.4, 0.4);
        S.cam(mid + 0.2, 1.1 + u * 0.4, 3.8 + u * 1.2, mid, 0.7 + u * 0.4);
      }
      if (t === 132) { sfx('slap'); sfx('squeak'); S.fx.burst(V(L.x, 0.9, 0.3), '#ffffff', 12, 2, 0.08, 0.3); }
      if (t >= 128 && t < 140) W.scriptPose = P({ turn: 0.3, aN: [0.1, 0.6, 1], aNs: 2.2, aNf: 1.5, lean: 0.2, brow: 0.6 });
      if (t >= 140) W.scriptPose = P(POSES.win);
      if (t >= 132 && t < 230) {
        const u = seg(t, 132, 230);
        L.y = Math.min(0.35 + u * u * 9, (M.G.stage.ceiling || 99) - 1.4); L.x += 0.012 * L.f * -1;
        S.bl.group.rotation.z = Math.sin(t * 0.1) * 0.3;
        if (t % 9 === 0) sfx('squeak');
        S.cam(W.x, 1.2 + u * 3.5, 5 + u * 3, (W.x + L.x) / 2, 1 + u * 6, 30, 2.5);
      }
      if (t === 230) {
        const p = V(L.x, L.y + 0.8, 0);
        for (const c of CONFETTI) S.fx.burst(p, c, 14, 5, 0.14, 1.4);
        S.fx.burst(p, '#ffffff', 40, 6, 0.16, 1); S.fx.glow(p, '#ff6080', 4, 0.4); S.fx.ring(p, '#ffd0e0', 2.4, 0.5);
        sfx('pop'); sfx('sparkle'); M.G.ui.comic('POP!', p, '#ff3a52', 2.2);
        S.bl.group.visible = false; L.hideShadow = true;
        // a tiny cherry-coloured parachute brings the little guy home
        tiny = S.add(miniBear(M, L, 0.3 * L.sc));
        chute = new THREE.Group();
        const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: '#ff3a52', roughness: 0.4, side: THREE.DoubleSide, sheen: 1 }));
        canopy.scale.set(1, 0.6, 1); canopy.position.y = 0.55; chute.add(canopy);
        for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.78; const line = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.45), new THREE.MeshBasicMaterial({ color: '#ffffff' })); line.position.set(Math.cos(a) * 0.13, 0.36, Math.sin(a) * 0.13); line.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); chute.add(line); }
        tiny.add(chute); chute.scale.setScalar(1 / (0.3 * L.sc));
        tiny.position.set(L.x, L.y, 0);
      }
      if (tiny && t > 230) {
        const u = seg(t, 230, 380);
        tiny.position.set(L.x + Math.sin(t * 0.05) * 0.3, Math.max(0, L.y * (1 - u)), 0.3);
        tiny.rotation.z = Math.sin(t * 0.05) * 0.25; tiny.rotation.y = Math.PI * 0.15 * -W.f;
        S.cam(W.x + 0.6 * W.f, 1.0 + (1 - u) * 3, 4.5 + (1 - u) * 2, (W.x + tiny.position.x) / 2, 0.7 + tiny.position.y * 0.6, 30, 2);
      }
      if (t === 390) { S.cleanup(); S.bl.group.visible = false; L.hideShadow = true; done(); }
    },
    dispose() { S.cleanup(); },
  };
}

// ============================================================ SNOW CONE
function freeze(M, W, L, done) {
  const S = stage(M, W, L); let t = 0;
  let block = null; const babies = [];
  M.G.ui.finisherName(W.def.finisher.name);
  return {
    step() {
      t++;
      const mid = (W.x + L.x) / 2;
      approach(M, W, L, t, 1.0, 24);
      if (t < 50) L.scriptPose = dizzyPose(t);
      if (t < 40) S.cam(mid, 0.9, 3.8, mid, 0.55);
      if (t >= 26 && t < 50) W.scriptPose = P({ aN: [0.3, 1, 0.4], aF: [0.3, 1, 0.4], aNs: 1.6, aFs: 1.6, sq: 1.1, lean: -0.15, brow: 0.6 });
      if (t === 50) {
        sfx('freeze'); M.G.ui.flash('#bfe8ff', 0.3);
        W.scriptPose = P({ aN: [0.0, 0.1, 1], aF: [0.05, 0.15, 1], aNs: 2, aFs: 2, lean: 0.25, turn: 0.2, brow: 0.6 });
        L.scriptPose = P(POSES.hurtHigh); L.forceExpr = 'hurt';
        const geo = new THREE.BoxGeometry(0.8, 1.15, 0.65); geo.translate(0, 0.55, 0);
        block = S.add(new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: '#f0faff', roughness: 0.18, transparent: true, opacity: 0.55, clearcoat: 1, iridescence: 0.4, depthWrite: false })));
        block.position.set(L.x, 0, 0); block.scale.setScalar(L.sc * 0.01); block.renderOrder = 3;
        for (let i = 0; i < 30; i++) S.fx.sparks.emit(L.x + (Math.random() - 0.5), Math.random() * 1.2, (Math.random() - 0.5) * 0.6, 0, 0.2, 0, new THREE.Color('#e0f6ff'), 0.08, 1, 0, 1);
      }
      if (block && t > 50 && t < 60) block.scale.setScalar(L.sc * ease(seg(t, 50, 58)));
      if (t > 50 && t < 120) { S.bl.wob = 0; S.cam(mid + 0.6, 1.1, 3.2, L.x, 0.6, 30, 3); if (t % 5 === 0) S.fx.sparks.emit(L.x + (Math.random() - 0.5) * 0.7, Math.random() * 1.1, 0.35, 0, 0.1, 0, new THREE.Color('#ffffff'), 0.06, 0.6, 0, 1); }
      if (t >= 80 && t < 104) W.scriptPose = P({ aN: [0.1, 1, 0.3], aNs: 1.8, sq: 1.15, lean: -0.2, turn: 0.3, brow: 0.8, y: 0.06 });
      if (t >= 104 && t < 112) W.scriptPose = P({ aN: [0.0, -0.3, 1], aNs: 2.3, aNf: 1.4, sq: 0.85, lean: 0.5, turn: 0.2, brow: 0.8 });
      if (t === 108) {
        sfx('shatter'); sfx('hit', 1.6); M.shake(0.3); M.G.ui.comic('HI-YAH!', V(L.x, 1.1, 0.2), '#2f8cff', 1.8);
        block.visible = false; S.bl.group.visible = false; L.hideShadow = true;
        S.fx.burst(V(L.x, 0.6, 0), '#e8f8ff', 60, 5, 0.12, 0.9); S.fx.beadsAt(V(L.x, 0.6, 0), '#d8f4ff', 20, 0, 1.4);
        const n = 12;
        for (let i = 0; i < n; i++) {
          const m = S.add(miniBear(M, L, 0.2 * L.sc));
          const a = (i / n) * Math.PI * 2 + Math.random() * 0.3;
          m.position.set(L.x, 0.3 + Math.random() * 0.3, 0);
          babies.push({ m, vx: Math.cos(a) * (1.6 + Math.random() * 1.5), vz: Math.sin(a) * (1.2 + Math.random()), vy: 3 + Math.random() * 3, hop: Math.random() * 6, spd: 2 + Math.random() * 2 });
        }
      }
      for (const b of babies) {
        b.vy -= 18 / 60; b.m.position.x += b.vx / 60; b.m.position.z += b.vz / 60; b.m.position.y += b.vy / 60;
        if (b.m.position.y < 0) { b.m.position.y = 0; b.vy = 2.2 + Math.random() * 0.8; if (Math.random() < 0.25) sfx('squeak'); }
        b.m.rotation.y = Math.atan2(b.vx, b.vz);
        const sq = 1 + Math.sin(t * 0.6 + b.hop) * 0.15; b.m.scale.set(0.2 * L.sc / Math.sqrt(sq), 0.2 * L.sc * sq, 0.2 * L.sc / Math.sqrt(sq));
      }
      if (t > 108 && t < 240) { S.cam(L.x, 1.6, 5.2, L.x, 0.4, 32, 2); if (t > 140) W.scriptPose = P(POSES.flex); }
      if (t === 250) { S.cleanup(); S.bl.group.visible = false; L.hideShadow = true; done(); }
    },
    dispose() { S.cleanup(); },
  };
}

// ========================================================== MEGA PUCKER
function pucker(M, W, L, done) {
  const S = stage(M, W, L); let t = 0;
  const base = S.bl.group.scale.x;
  let fly = null;
  M.G.ui.finisherName(W.def.finisher.name);
  return {
    step() {
      t++;
      const mid = (W.x + L.x) / 2;
      approach(M, W, L, t, 0.9, 24);
      if (t < 30) { L.scriptPose = dizzyPose(t); S.cam(mid, 0.9, 3.6, mid, 0.55); }
      if (t >= 24 && t < 70) {
        W.scriptPose = P({ lean: 0.4, sq: 0.92 + Math.sin(t * 0.8) * 0.04, head: [0.3, 0, 0], aN: [0.6, -0.5, 0.3], aF: [0.6, -0.5, 0.3], brow: 0.9, turn: 0.3 });
        if (t % 2 === 0) S.fx.glowPuff(V(W.x + W.f * 0.3 * W.sc, 0.6 * W.sc, 0.1), '#b0ff40', 2, 0.35, 0.7, 0.5);
        if (t === 26) sfx('puff');
      }
      if (t >= 40 && t < 130) {
        const u = ease(seg(t, 50, 120));
        L.forceExpr = 'hurt';
        L.scriptPose = P({ sq: 0.8 + Math.sin(t * 1.3) * 0.08, aN: [0.2, 0.8, 0.6], aF: [0.2, 0.8, 0.6], aNs: 0.7, aFs: 0.7, eyeS: 0.08, brow: -0.8, head: [0.3, Math.sin(t * 0.9) * 0.2, 0] });
        const j = (Math.random() - 0.5) * 0.03;
        const s = base * (1 - u * 0.86) + j;
        S.bl.group.scale.set(s, s, s);
        if (t % 6 === 0) sfx('squeak');
        S.cam(L.x - L.f * 0.1, 0.9 - u * 0.6, 3.6 - u * 2.2, L.x, 0.55 - u * 0.45, 30, 3);
        if (t === 120) M.G.ui.comic('SO SOUR', V(L.x, 0.5, 0.2), '#62d81a', 1.4);
      }
      if (t >= 70 && t < 140) W.scriptPose = P({ sq: 1.05, lean: 0.05, turn: 0.8, aN: [0.8, -0.2, 0.3], aF: [0.8, -0.2, 0.3], aNf: 1.4, aFf: 1.4, brow: 0.9 });
      if (t >= 130 && t < 170) { // the tiny bear shakes its fists
        L.scriptPose = P({ aN: [0.4, 1, 0.3], aF: [0.4, 1, 0.3], aNs: 1.2, aFs: 1.2, sq: 1 + Math.sin(t * 1.4) * 0.12, y: Math.abs(Math.sin(t * 0.7)) * 0.08, brow: 0.9, eyeS: 1.1 });
        L.forceExpr = 'idle';
        if (t % 5 === 0) sfx('squeak');
        S.cam(L.x - L.f * 0.3, 0.35, 1.5, L.x, 0.18, 30, 3);
      }
      if (t >= 160 && t < 178) W.scriptPose = P({ lean: 0.9, sq: 0.9, turn: 0.3, aN: [0.0, -0.75, 0.7], aNs: t < 168 ? 1.6 : 2.4, aNf: 0.7, brow: 0.8 });
      if (t === 170) { sfx('slap'); sfx('whistle'); fly = { vx: W.f * 6, vy: 6 }; M.G.ui.comic('FLICK!', V(L.x, 0.4, 0.2), '#62d81a', 1.6); }
      if (fly && t > 170) {
        fly.vy -= 4 / 60; L.x += fly.vx / 60; L.y += fly.vy / 60; S.bl.group.rotation.z += 0.35;
        S.cam(W.x, 1.4, 4.6, (W.x + L.x) / 2, 0.9 + L.y * 0.4, 32, 2);
        if (t > 178) W.scriptPose = P(POSES.taunt);
      }
      if (t === 236) { const p = V(L.x, L.y, 0); S.fx.burst(p, '#ffffff', 20, 2, 0.2, 0.8); S.fx.glow(p, '#ffffff', 1.4, 0.5); sfx('ding'); S.bl.group.visible = false; L.hideShadow = true; }
      if (t === 300) { S.cleanup(); S.bl.group.visible = false; L.hideShadow = true; done(); }
    },
    dispose() { S.cleanup(); },
  };
}

// ========================================================= FRUIT ROLL-UP
function rollup(M, W, L, done) {
  const S = stage(M, W, L); let t = 0;
  const base = S.bl.group.scale.x, wbase = S.bw.group.scale.x;
  let roll = null; const startX = W.x;
  M.G.ui.finisherName(W.def.finisher.name);
  return {
    step() {
      t++;
      const mid = (W.x + L.x) / 2;
      if (t < 60) L.scriptPose = t < 40 ? dizzyPose(t) : P({ head: [-0.9, 0, 0], lean: -0.2, eyeS: 1.4, brow: -0.6, aN: [0.6, 0.6, 0.2], aF: [0.6, 0.6, 0.2] });
      if (t < 30) { S.cam(mid, 1.0, 4.2, mid, 0.6); W.scriptPose = P({ sq: 0.7, lean: 0.3, brow: 0.8 }); }
      if (t >= 30 && t < 66) { // big jump
        const u = seg(t, 30, 66);
        W.x = startX + (L.x - startX) * ease(u); W.y = Math.sin(u * Math.PI * 0.62) * 3.2 * (u < 0.8 ? 1 : 1);
        W.scriptPose = P({ sq: 1.1, lean: -0.2, aN: [1, 0.8, 0], aF: [1, 0.8, 0], aNs: 1.3, aFs: 1.3, lN: [0.4, -0.6, 0.4], lF: [0.4, -0.6, -0.2], brow: 0.8 });
        S.cam(mid, 1.4 + W.y * 0.5, 5.5, mid, 0.8 + W.y * 0.6, 32, 3);
        if (t === 31) sfx('jump');
      }
      if (t >= 66 && t < 80) { const u = seg(t, 66, 78); W.y = (1 - u) * 2.1; W.x = L.x; W.scriptPose = P({ lean: 1.45, sq: 1.05, aN: [1, 0.3, 0], aF: [1, 0.3, 0], lN: [0.5, -0.4, -0.6], lF: [0.5, -0.4, -0.6] }); }
      if (t === 78) {
        sfx('stomp'); sfx('splat'); M.shake(0.45); M.G.ui.flash('#ffffff', 0.25);
        S.fx.burst(V(L.x, 0.1, 0), L.def.flavor.glow, 50, 5, 0.12, 0.8); S.fx.beadsAt(V(L.x, 0.2, 0), L.def.flavor.glow, 22, 0, 1.6); S.fx.ring(V(L.x, 0.03, 0), '#ffffff', 2.4, 0.5, true); S.fx.dust(L.x, M.G.stage.dust, 24, 3.5);
        M.G.ui.comic('SPLAT!', V(L.x, 0.6, 0.2), L.def.ui, 2.2);
        S.posed(L, true);
      }
      if (t >= 78 && t < 150) {
        S.bl.group.position.set(L.x, 0.02, 0); S.bl.group.rotation.set(-Math.PI / 2, 0, 0);
        const w = Math.sin(t * 0.8) * 0.06 * (1 - seg(t, 78, 110));
        S.bl.group.scale.set(base * (1.7 + w), base * (1.7 - w), base * 0.06);
        S.bodyPose(L, P({ aN: [1, 0.1, 0], aF: [1, 0.1, 0], lN: [0.6, -0.8, 0], lF: [0.6, -0.8, 0], turn: 1.5 })); L.forceExpr = 'ko';
        const u = seg(t, 78, 100); W.y = Math.sin(u * Math.PI) * 0.8; W.x = L.x - W.f * u * 1.2;
        W.scriptPose = P({ sq: 1.05, aN: [1, 0.6, 0], aF: [1, 0.6, 0], brow: 0.8 });
        S.cam(L.x, 2.4, 3.4, L.x, 0.1, 32, 3);
      }
      if (t >= 112 && t < 150) W.scriptPose = P({ sq: 0.75, lean: 0.6, aN: [0.1, -0.6, 0.8], aF: [0.1, -0.5, 0.8], aNs: 1.5, aFs: 1.5, brow: 0.6 });
      if (t === 150) {
        sfx('roll'); sfx('squeeze');
        // the roll-up: a jelly sheet wrapped round the bear, head poking out
        S.bl.group.scale.set(base * 0.9, base * 0.9, base * 0.9);
        const r = 0.2 * L.sc, len = 0.62 * L.sc;
        const mat = S.bl.mat.clone(); mat.onBeforeCompile = () => {}; mat.thickness = 0.4;
        mat.transmission = 0.7; mat.color = new THREE.Color(L.def.flavor.tint);
        const g = new THREE.Group();
        const cyl = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.15, r * 1.15, len, 32, 1), new THREE.MeshPhysicalMaterial({ color: L.def.ui, roughness: 0.22, clearcoat: 1, sheen: 0.5, emissive: new THREE.Color(L.def.flavor.deep).multiplyScalar(0.35) }));
        cyl.rotation.z = Math.PI / 2; cyl.position.x = -len / 2 * W.f; g.add(cyl);
        const spiralPts = []; for (let i = 0; i <= 80; i++) { const a = i * 0.5; const rr = r * (0.3 + 0.72 * i / 80); spiralPts.push(V(0, Math.cos(a) * rr, Math.sin(a) * rr)); }
        for (const end of [0, -len * W.f]) { const s = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spiralPts), 120, 0.006, 5), new THREE.MeshPhysicalMaterial({ color: L.def.flavor.deep, roughness: 0.3 })); s.position.x = end; g.add(s); }
        roll = S.add(g);
        roll.position.set(L.x, r, 0.1);
        roll.add(new THREE.Object3D());
      }
      if (roll && t >= 150) {
        const u = seg(t, 150, 240);
        const rx = L.x + W.f * u * 0.6;
        roll.position.set(rx, 0.2 * L.sc, 0.1);
        roll.rotation.x = -u * 6;
        S.bl.group.position.set(rx + W.f * 0.06, 0.2 * L.sc, 0.1);
        S.bl.group.rotation.set(0, W.f > 0 ? -Math.PI / 2 + 0.6 : Math.PI / 2 - 0.6, W.f * (Math.PI / 2));
        S.bodyPose(L, P({ aN: [0.2, -0.9, 0.2], aF: [0.2, -0.9, 0.2], aNs: 0.6, aFs: 0.6, lN: [0.1, -1, 0], lF: [0.1, -1, 0], lNs: 0.7, lFs: 0.7, sq: 0.9 + Math.sin(t * 0.5) * 0.05, head: [0, 0, Math.sin(t * 0.3) * 0.3] }));
        L.forceExpr = 'ko';
        W.x = rx - W.f * (0.55 * W.sc + 0.2);
        W.scriptPose = u < 1 ? P({ lean: 0.5, aN: [0.05, -0.3, 1], aF: [0.05, -0.25, 1], aNs: 1.6, aFs: 1.6, y: 0, brow: 0.6, lN: [0.3, -1, Math.sin(t * 0.4) * 0.5], lF: [0.3, -1, -Math.sin(t * 0.4) * 0.5] }) : P(POSES.flex);
        S.cam(rx, 0.8, 2.9, rx, 0.3, 30, 2.5);
        if (t === 200) M.G.ui.comic('ROLLED!', V(rx, 0.6, 0.2), '#ff8a1a', 1.8);
      }
      if (t === 290) { S.cleanup(); S.posed(L, false); L.state = 'ko'; done(); }
    },
    dispose() { S.cleanup(); },
  };
}

// ======================================================== CANDY WRAPPED
function wrap(M, W, L, done) {
  const S = stage(M, W, L); let t = 0;
  let wrapper = null, posts = null, kick = null;
  M.G.ui.finisherName(W.def.finisher.name);
  const foil = (() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
    for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#fff6c0' : '#ff4f7a'; g.fillRect(i * 16, 0, 16, 64); }
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = THREE.RepeatWrapping; tx.repeat.set(2, 1); return tx;
  })();
  return {
    step() {
      t++;
      const mid = (W.x + L.x) / 2;
      if (t < 70) L.scriptPose = dizzyPose(t);
      if (t < 20) S.cam(mid, 1.0, 4.2, mid, 0.6);
      if (t >= 20 && t < 70) { // zip round and round
        S.posed(W, true);
        const a = t * 0.55; const r = 0.6 * L.sc;
        S.bw.group.position.set(L.x + Math.cos(a) * r, 0.3, Math.sin(a) * r);
        S.bw.group.rotation.set(0, -a, 0);
        S.bw.body.visible = t % 3 !== 0;
        S.bodyPose(W, P({ lean: 0.8, aN: [0.6, 0.2, -0.6], aF: [0.6, 0.2, -0.6] }));
        S.fx.glowPuff(V(S.bw.group.position.x, 0.5, S.bw.group.position.z), '#fff6c0', 1, 0.3, 0.4, 0.2);
        if (t % 5 === 0) sfx('wrap');
        S.cam(L.x, 1.2, 3.4, L.x, 0.55, 30, 3);
      }
      if (t === 62) {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.9, 32, 1, true), new THREE.MeshPhysicalMaterial({ map: foil, roughness: 0.15, clearcoat: 1, iridescence: 0.8, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }));
        body.position.y = 0.5; g.add(body);
        for (const s of [1, -1]) {
          const cone = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.22, 24, 1, true), body.material); cone.position.y = 0.5 + s * 0.56; cone.rotation.x = s > 0 ? Math.PI : 0; g.add(cone);
          const twist = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.28, 12, 3, true), new THREE.MeshPhysicalMaterial({ color: '#ff4f7a', roughness: 0.3, iridescence: 1, side: THREE.DoubleSide, metalness: 0.4 }));
          twist.position.y = 0.5 + s * 0.78; twist.rotation.x = s > 0 ? 0 : Math.PI; g.add(twist);
        }
        g.scale.setScalar(L.sc);
        wrapper = S.add(g); wrapper.position.set(L.x, 0, 0); wrapper.renderOrder = 4;
        sfx('wrap'); sfx('ding'); S.fx.burst(V(L.x, 0.6, 0), '#fff6c0', 30, 3, 0.1, 0.6);
        M.G.ui.comic('WRAPPED!', V(L.x, 1.3, 0.2), '#ff4f7a', 1.8);
      }
      if (t === 70) { S.posed(W, false); S.bw.body.visible = true; W.x = L.x - W.f * 1.4; W.y = 0; W.scriptPose = P(POSES.taunt); L.scriptPose = P({ aN: [0.2, -0.9, 0.3], aF: [0.2, -0.9, 0.3], aNs: 0.7, aFs: 0.7, eyeS: 1.3, brow: -0.6 }); L.forceExpr = 'hurt'; }
      if (wrapper && t > 70 && t < 120) { // tip over
        const u = ease(seg(t, 80, 100));
        S.posed(L, true);
        wrapper.rotation.z = -W.f * u * Math.PI / 2; wrapper.position.y = u * 0.36 * L.sc; wrapper.position.x = L.x + W.f * u * 0.45 * L.sc;
        S.bl.group.position.copy(wrapper.position).add(V(0, 0, 0)); S.bl.group.rotation.set(0, W.f > 0 ? Math.PI / 2 : -Math.PI / 2, -W.f * u * Math.PI / 2);
        S.bl.group.position.set(wrapper.position.x - Math.sin(-W.f * u * Math.PI / 2) * 0.05, wrapper.position.y + (1 - u) * 0, 0);
        S.bodyPose(L, P({ aN: [0.2, -0.9, 0.3], aF: [0.2, -0.9, 0.3], aNs: 0.7, aFs: 0.7, lNs: 0.8, lFs: 0.8 }));
        S.cam(mid, 1.6, 5.2, L.x, 0.6, 32, 2.5);
        if (t === 100) { sfx('thunk'); posts = new THREE.Group(); const y = new THREE.MeshPhysicalMaterial({ color: '#ffd34f', roughness: 0.3, clearcoat: 1 }); const cb = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3), y); cb.rotation.z = Math.PI / 2; cb.position.y = 1.5; posts.add(cb); for (const s of [-1, 1]) { const u2 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.5), y); u2.position.set(s * 1.5, 3, 0); posts.add(u2); } const st = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.5), y); st.position.y = 0.75; posts.add(st); posts.position.set(L.x + W.f * 7, 0, -9); S.add(posts); }
      }
      if (t >= 112 && t < 128) { // run-up
        const u = seg(t, 112, 126); W.x += (L.x + W.f * 0.2 - W.f * 0.75 - W.x) * 0.3;
        W.scriptPose = P({ lean: 0.4, lN: [0.3, -0.6, -0.8], lNs: 1.2, turn: 0.2, brow: 0.8 }); void u;
      }
      if (t === 128) { kick = { vx: W.f * 5.5, vy: 9, vz: -6.2 }; sfx('thunk'); sfx('hit', 1.5); M.shake(0.2); M.G.ui.comic('BOOT!', V(L.x, 0.6, 0.2), '#f5e9a0', 1.6); }
      if (t >= 128 && t < 140) W.scriptPose = P({ lN: [-0.05, 0.4, 1], lNs: 2.2, lean: -0.5, turn: 0.1, aN: [0.9, 0.5, -0.3], aF: [0.8, 0.6, -0.4], brow: 0.8 });
      if (kick) {
        kick.vy -= 9 / 60;
        wrapper.position.x += kick.vx / 60; wrapper.position.y += kick.vy / 60; wrapper.position.z += kick.vz / 60; wrapper.rotation.x += 0.18;
        S.bl.group.position.copy(wrapper.position); S.bl.group.rotation.x = wrapper.rotation.x;
        L.hideShadow = true;
        S.cam(W.x - W.f * 0.6, 1.2, 4.5, (W.x + wrapper.position.x) / 2, 1 + Math.max(0, wrapper.position.y) * 0.5, 34, 2);
        if (t === 210) { M.G.ui.announce("IT'S GOOD!", 'small', 1.6); say("It's good!"); sfx('cheer'); }
        if (t > 150) W.scriptPose = P(POSES.win);
      }
      if (t === 300) { S.cleanup(); S.bl.group.visible = false; L.hideShadow = true; done(); }
    },
    dispose() { S.cleanup(); },
  };
}

// ============================================================ STICKERED
function sticker(M, W, L, done) {
  const S = stage(M, W, L); let t = 0;
  const base = S.bl.group.scale.x; const startX = W.x;
  M.G.ui.finisherName(W.def.finisher.name);
  let slapPos = null;
  return {
    step() {
      t++;
      const mid = (W.x + L.x) / 2;
      if (t < 62) L.scriptPose = dizzyPose(t);
      if (t < 26) { S.cam(mid, 1.0, 4.2, mid, 0.6); W.scriptPose = P({ sq: 0.72, lean: 0.3, brow: 0.5 }); }
      if (t >= 26 && t < 62) {
        const u = seg(t, 26, 62); W.x = startX + (L.x - startX) * ease(u); W.y = Math.sin(u * Math.PI) * 2.6 + (u > 0.5 ? 0.5 * (u - 0.5) : 0);
        W.scriptPose = P({ lean: -0.55, sq: 0.95, aN: [0.9, 0.8, 0], aF: [0.9, 0.8, 0], lN: [0.3, -0.2, 1], lF: [0.3, -0.25, 1], brow: 0.6 });
        S.cam(mid, 1.3 + W.y * 0.4, 5, mid, 0.8 + W.y * 0.5, 32, 3);
        if (t === 27) { sfx('jump'); say('Pardon me.', { pitch: 0.9, rate: 0.95, cancel: false }); }
      }
      if (t === 62) {
        W.y = 0; W.x = L.x; sfx('stomp'); sfx('splat'); M.shake(0.4); M.G.ui.flash('#ffffff', 0.25);
        S.fx.burst(V(L.x, 0.1, 0), L.def.flavor.glow, 40, 4, 0.12, 0.8); S.fx.ring(V(L.x, 0.03, 0), '#ffffff', 2.2, 0.5, true); S.fx.dust(L.x, M.G.stage.dust, 20, 3);
        M.G.ui.comic('SQUASH!', V(L.x, 0.5, 0.2), L.def.ui, 2);
        S.posed(L, true);
      }
      if (t >= 62 && t < 120) {
        S.bl.group.position.set(L.x, 0.02, 0.1); S.bl.group.rotation.set(-Math.PI / 2, 0, 0);
        S.bl.group.scale.set(base * 1.5, base * 1.5, base * 0.05);
        S.bodyPose(L, P({ aN: [1, 0.2, 0], aF: [1, 0.2, 0], lN: [0.7, -0.7, 0], lF: [0.7, -0.7, 0], turn: 1.5 })); L.forceExpr = 'ko';
        W.y = 0.1 * Math.max(0, 1 - (t - 62) / 10);
        W.scriptPose = t < 90 ? P({ sq: 0.8 + Math.sin(t) * 0.03, lean: -0.3, lN: [0.4, -0.2, 1], lF: [0.4, -0.2, 1], aN: [0.8, -0.3, 0.2], aF: [0.8, -0.3, 0.2] }) : P({ turn: 1.2, aN: [0.4, -0.6, 0.5], aF: [0.6, 0.3, 0.2], brow: 0.3 });
        if (t >= 90) W.x += (L.x - W.f * 0.7 - W.x) * 0.1;
        S.cam(L.x, 2.2, 3.4, L.x, 0.15, 32, 3);
      }
      if (t >= 120 && t < 160) { // peel it up off the floor
        const u = ease(seg(t, 120, 150));
        S.bl.group.rotation.set(-Math.PI / 2 * (1 - u), 0, 0);
        S.bl.group.position.set(L.x, 0.02 + u * 0.55 * L.sc, 0.1 + (1 - u) * 0.1);
        W.scriptPose = P({ aN: [0.1, 0.1 + u * 0.6, 1], aF: [0.1, 0.1 + u * 0.6, 1], aNs: 1.5, aFs: 1.5, lean: 0.2 - u * 0.3, turn: 0.6, brow: 0.3 });
        if (t === 121) sfx('wrap');
        S.cam(mid, 1.0, 3.6, mid, 0.6, 30, 3);
      }
      const lensSpot = (slide) => {
        const cam = M.G.camera;
        const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
        const d = 0.5, h = 2 * d * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2);
        const sc = (h * 0.62) / 0.92;
        const pos = cam.position.clone().addScaledVector(fwd, d).addScaledVector(up, -0.46 * 0.92 * sc - slide);
        return { pos, sc, q: cam.quaternion };
      };
      if (t >= 160 && t < 176) { // fling it at the camera
        const L2 = lensSpot(0);
        if (!slapPos) slapPos = S.bl.group.position.clone();
        const u = ease(seg(t, 160, 172));
        S.bl.group.position.lerpVectors(slapPos, L2.pos, u);
        S.bl.group.quaternion.copy(L2.q);
        const s = base * 1.5 * (1 - u) + L2.sc * u;
        S.bl.group.scale.set(s, s, base * 0.05);
        W.scriptPose = P({ aN: [0.1, 0.5, 1], aNs: 2.2, lean: 0.4, turn: 0.2, brow: 0.6 });
        M.cam.override.snap = 0.01;
        if (t === 172) { sfx('slap'); M.shake(0.15); M.G.ui.flash('#ffffff', 0.15); M.G.ui.comic('STICKERED!', V(W.x, 1.3, 0.2), '#a24cff', 2); }
      }
      if (t >= 176 && t < 300) { // stuck on the lens, then it slowly slides off
        const slide = Math.max(0, t - 236) / 60;
        const L2 = lensSpot(slide * slide * 0.09);
        S.bl.group.position.copy(L2.pos);
        S.bl.group.quaternion.copy(L2.q); S.bl.group.rotateZ(0.14 + slide * 0.25);
        S.bl.group.scale.set(L2.sc, L2.sc, base * 0.04);
        S.bl.group.position.add(new THREE.Vector3(Math.sin(t * 0.05) * 0.002, 0, 0));
        W.scriptPose = t > 200 ? P(POSES.win) : P(POSES.taunt);
        L.hideShadow = true;
      }
      if (t === 300) { S.cleanup(); S.bl.group.visible = false; L.hideShadow = true; done(); }
    },
    dispose() { S.cleanup(); },
  };
}

// ============================================================ THE BIG SIT
function sit(M, W, L, done) {
  const S = stage(M, W, L); let t = 0;
  const base = S.bl.group.scale.x;
  M.G.ui.finisherName(W.def.finisher.name);
  return {
    step() {
      t++;
      const mid = (W.x + L.x) / 2;
      approach(M, W, L, t, 0.9, 26);
      if (t < 70) L.scriptPose = dizzyPose(t);
      if (t < 30) S.cam(mid, 1.4, 6, mid, 0.9);
      if (t >= 26 && t < 50) { W.scriptPose = P({ turn: 2.6 * ease(seg(t, 26, 46)) + 1, head: [0, -0.9, 0], brow: 0.8 }); if (t === 40) M.G.ui.comic('heh.', V(W.x, 1.9, 0.2), '#ff5ad2', 1.2); }
      if (t >= 50 && t < 78) {
        const u = seg(t, 50, 78);
        W.y = Math.sin(u * Math.PI) * 1.6; W.x += (L.x - W.f * 0.15 - W.x) * 0.15;
        W.scriptPose = P({ turn: 3.6, sq: 1.1, lean: 0.3, aN: [1, 0.7, 0], aF: [1, 0.7, 0], lN: [0.4, -0.3, 0.8], lF: [0.4, -0.3, 0.8], brow: 0.8 });
        S.cam(mid, 1.8 + W.y * 0.4, 6.4, mid, 1 + W.y * 0.4, 32, 3);
        if (t === 51) sfx('jump');
      }
      if (t === 78) {
        W.y = 0; sfx('stomp'); sfx('stomp'); sfx('splat'); M.shake(0.6); M.G.ui.flash('#ffffff', 0.3);
        S.fx.burst(V(L.x, 0.1, 0), L.def.flavor.glow, 50, 5, 0.14, 0.9); S.fx.ring(V(L.x, 0.03, 0), '#ffffff', 3, 0.6, true); S.fx.dust(L.x, M.G.stage.dust, 30, 4);
        M.G.ui.comic('THOOM', V(L.x, 0.4, 0.3), '#ff5ad2', 2.4);
        S.posed(L, true);
      }
      if (t >= 78 && t < 130) {
        W.scriptPose = P({ turn: 3.6, sq: 0.8 + Math.sin(t * 0.3) * 0.03, lean: -0.1, lN: [0.5, -0.2, 1], lF: [0.5, -0.2, 1], aN: [0.9, -0.3, 0.3], aF: [0.9, -0.3, 0.3], brow: -0.4 });
        S.bl.group.position.set(L.x, 0.02, 0.15); S.bl.group.rotation.set(-Math.PI / 2, 0, 0); S.bl.group.scale.set(base * 1.5, base * 1.5, base * 0.05);
        S.bodyPose(L, P({ aN: [1, 0.2, 0], aF: [1, 0.2, 0], lN: [0.7, -0.7, 0], lF: [0.7, -0.7, 0], turn: 1.5 })); L.forceExpr = 'ko';
        S.cam(L.x + 0.6, 0.6, 3.8, L.x, 0.5, 30, 3);
      }
      if (t >= 130 && t < 250) { // stands up and turns round: the flat bear is stuck to his bottom
        const u = seg(t, 130, 150), turnU = ease(seg(t, 140, 165));
        const wig = t > 170 ? Math.sin(t * 0.45) * 0.45 : 0;
        S.posed(W, true);
        S.bw.group.position.set(W.x, 0, 0);
        S.bw.group.rotation.set(0, Math.PI * turnU + wig * 0.35, 0);
        S.bodyPose(W, P({ turn: 1, twist: wig * 0.6, head: [0.1, 0.9 * turnU, 0], lean: 0.08, brow: -0.2, aN: [0.7, -0.3, 0.3], aF: [0.7, -0.3, 0.3], sq: 1 + Math.sin(t * 0.45) * 0.03 }));
        const bx = W.x + Math.sin(wig * 0.35) * 0.27 * W.sc;
        const bz = Math.cos(Math.PI * turnU + wig * 0.35) * -0.27 * W.sc;
        S.bl.group.position.set(bx, (0.17 + u * 0.08) * W.sc, bz);
        S.bl.group.rotation.set(0, Math.PI * turnU - Math.PI + wig * 0.35, Math.sin(t * 0.45 + 1) * 0.12);
        S.bl.group.scale.set(base * 1.1, base * 1.1, base * 0.05);
        L.hideShadow = true;
        S.cam(W.x + 0.4, 1.1, 4.4, W.x, 0.75, 30, 2.5);
        if (t === 175) { M.G.ui.comic('HEY!', V(bx, 0.9, 0.6), L.def.ui, 1.4); sfx('squeak'); }
        if (t === 205) { M.G.ui.comic('get off!', V(bx, 0.7, 0.6), L.def.ui, 1.1); sfx('squeak'); }
      }
      if (t >= 250 && t < 310) { // it peels off and flops down
        const u = ease(seg(t, 250, 272));
        S.bw.group.rotation.set(0, Math.PI, 0);
        S.bodyPose(W, P({ turn: 1, head: [0.2, 0.9, 0], aN: [0.9, 0.5, 0], aF: [0.9, 0.5, 0], brow: 0.5 }));
        S.bl.group.position.set(W.x, 0.25 * (1 - u) * W.sc + 0.02, 0.27 * W.sc + u * 0.45);
        S.bl.group.rotation.set(-Math.PI / 2 * u, 0, 0); S.bl.group.scale.set(base * 1.25, base * 1.25, base * 0.05);
        if (t === 266) sfx('splat');
      }
      if (t === 310) { S.cleanup(); S.bl.group.visible = false; L.hideShadow = true; done(); }
    },
    dispose() { S.cleanup(); },
  };
}

export const FINISHERS = { pop, freeze, pucker, rollup, wrap, sticker, sit };
