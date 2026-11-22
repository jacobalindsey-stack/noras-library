// NUBBINS — the fighters. Flavors, shapes, stats, special moves, costumes.
import { P, kf, POSES, mix } from './anim.js';

const st = (m, keys) => t => kf(keys, t);
const total = m => m.start + m.active + m.rec;

// shared projectile spec maker: starts in front of the thrower at a height
function shot(F, type, o) {
  return Object.assign({ type, owner: F, x: F.x + F.f * 0.45 * F.sc, y: (o.hy ?? 0.6) * F.sc, vx: (o.vx ?? 5) * F.f, vy: o.vy ?? 0, g: o.g ?? 0, r: o.r ?? 0.12, dmg: 6, hs: 16, bs: 10, kb: 2.2, life: o.life ?? 160 }, o, { vx: (o.vx ?? 5) * F.f });
}

// Sugar Rush (the super): everybody has one, it glows in their flavor
function rushMove() {
  const m = { name: 'Sugar Rush', meter: 100, start: 14, active: 22, rec: 20, dmg: 6, hs: 40, bs: 14, kb: 1, box: [0.0, 0.7, 0.1, 0.95], lvl: 'mid', rush: true, invuln: [1, 14], sfx: 'rush', word: 'RUSH' };
  m.vx = t => (t >= m.start && t < m.start + m.active ? 8.5 : 0);
  m.onStart = (F, M) => M.rushFlash(F);
  m.onHit = (F, D, M) => M.startRush(F, D);
  m.pose = t => t < m.start ? mix(POSES.stance, P({ sq: 0.75, lean: 0.35, aN: [0.6, -0.5, -0.4], aF: [0.6, -0.5, -0.4], brow: 0.6, turn: 0.3 }), Math.min(1, t / 8))
    : P({ lean: 0.9, y: 0.12, turn: 0.1, aN: [0.1, 0, 1], aNs: 2.2, aNf: 1.8, aF: [0.2, 0.1, 1], aFs: 2, aFf: 1.6, lN: [0.2, -0.3, -1], lF: [0.2, -0.4, -0.9], brow: 0.6 });
  return m;
}

// ----------------------------------------------------------------- CHERRY
function cherryMoves() {
  const sp = { name: 'Cherry Bomb', start: 14, active: 1, rec: 22, lvl: 'mid', sfx: 'swish' };
  sp.proj = [{ at: 12, make: F => shot(F, 'cherry', { vx: 4.4, vy: 5.8, g: 15, hy: 0.75, r: 0.12, dmg: 9, burst: 0.55, lift: 6, kd: true, kb: 3, word: 'KABLOOEY' }) }];
  sp.pose = st(sp, [[0, POSES.stance], [8, P({ aN: [0.4, -0.9, -0.4], aNs: 1.1, lean: -0.1, turn: 0.4, twist: -0.3 })], [13, P({ aN: [0.1, 0.7, 0.8], aNs: 1.9, aNf: 1.4, lean: 0.25, turn: 0.2, twist: 0.3 })], [total(sp), POSES.stance]]);
  const fsp = { name: 'Cherry Rocket', start: 10, active: 22, rec: 16, dmg: 12, hs: 24, bs: 14, kb: 5, lift: 5.5, kd: true, box: [0.0, 0.6, 0.3, 0.95], lvl: 'mid', sfx: 'rocket', stopOnHit: true, word: 'ZOOM' };
  fsp.vx = (t, F) => (F.rocketStop ? 0 : t >= 8 && t < fsp.start + fsp.active ? 7.8 : 0);
  fsp.onStart = F => { F.rocketStop = false; };
  fsp.onHit = (F) => { F.rocketStop = true; F.mt = fsp.start + fsp.active - 1; };
  fsp.pose = st(fsp, [[0, POSES.stance], [9, P({ sq: 0.7, lean: 0.4, aN: [0.6, -0.6, -0.6], aF: [0.6, -0.6, -0.6] })], [12, P({ lean: 1.35, y: 0.32, turn: 0.1, aN: [0.3, -0.2, -1], aF: [0.3, -0.1, -1], aNs: 1.3, aFs: 1.3, lN: [0.15, -0.2, -1], lF: [0.15, -0.3, -1], lNs: 1.3, lFs: 1.3, brow: 0.6 })], [32, P({ lean: 1.35, y: 0.3, turn: 0.1, aN: [0.3, -0.2, -1], aF: [0.3, -0.1, -1], lN: [0.15, -0.2, -1], lF: [0.15, -0.3, -1], brow: 0.6 })], [total(fsp), POSES.stance]]);
  const dsp = { name: 'Stem Spin', start: 6, active: 24, rec: 16, dmg: 4, hs: 18, bs: 8, kb: 1.5, lift: 7, multi: 8, box: [-0.35, 0.5, 0.25, 1.3], lvl: 'mid', invuln: [1, 9], jump: { at: 5, vy: 8.5, vx: 0.8 }, airEnd: true, float: 26, sfx: 'whirl', word: 'WHIRR' };
  dsp.pose = t => { const p = P({ sq: 1.1, lean: -0.05, turn: 0.4, aN: [1, 0.2, 0], aF: [1, 0.2, 0], aNs: 1.5, aFs: 1.5, lN: [0.2, -1, 0.2], lF: [0.2, -1, -0.2], brow: 0.5 }); p.twist = t > 4 ? (t - 4) * 0.55 : 0; return t < 4 ? mix(POSES.stance, POSES.crouch, t / 4) : p; };
  return { sp, fsp, dsp, rush: rushMove() };
}

// ------------------------------------------------------------------- RAZZ
function razzMoves() {
  const sp = { name: 'Brain Freeze', start: 13, active: 1, rec: 20, lvl: 'mid', sfx: 'icecast' };
  sp.proj = [{ at: 12, make: F => shot(F, 'ice', { vx: 6.6, hy: 0.62, r: 0.13, dmg: 7, freeze: 56, hs: 56, kb: 0.5, word: 'BRRR' }) }];
  sp.pose = st(sp, [[0, POSES.stance], [8, P({ aN: [0.4, 0.2, -0.6], aF: [0.4, 0.2, -0.6], lean: -0.15, turn: 0.4, sq: 0.95 })], [13, P({ aN: [0.0, 0.1, 1], aF: [0.05, 0.15, 1], aNs: 2, aFs: 2, aNf: 1.3, aFf: 1.3, lean: 0.25, turn: 0.15 })], [total(sp), POSES.stance]]);
  const fsp = { name: 'Slush Slide', start: 7, active: 18, rec: 16, dmg: 9, hs: 22, bs: 12, kb: 2, lift: 4, kd: true, box: [0.05, 0.85, 0, 0.3], lvl: 'low', low: true, sfx: 'slide', word: 'SKRRT' };
  fsp.vx = t => (t >= 6 && t < 25 ? 7.4 * (1 - (t - 6) / 26) : 0);
  fsp.pose = st(fsp, [[0, POSES.stance], [6, POSES.crouch], [9, P({ sq: 0.62, lean: -0.55, y: 0.0, turn: 0.1, lN: [-0.05, -0.25, 1], lNs: 2.1, lF: [0.3, -0.7, 0.4], aN: [0.7, 0.5, -0.5], aF: [0.6, 0.2, -0.5], brow: 0.5 })], [25, P({ sq: 0.62, lean: -0.55, turn: 0.1, lN: [-0.05, -0.25, 1], lNs: 2.1, lF: [0.3, -0.7, 0.4], aN: [0.7, 0.5, -0.5], aF: [0.6, 0.2, -0.5] })], [total(fsp), POSES.stance]]);
  const dsp = { name: 'Icicle Rise', start: 16, active: 1, rec: 20, lvl: 'mid', sfx: 'icecast' };
  dsp.proj = [{ at: 14, make: (F, M) => { const o = M.fighters[1 - F.side]; const d = Math.min(2.4, Math.max(0.9, Math.abs(o.x - F.x))); return { type: 'pillar', owner: F, x: F.x + F.f * d, y: 0, vx: 0, vy: 0, g: 0, r: 0.3, h: 1.4, dmg: 10, hs: 22, bs: 12, kb: 1.5, lift: 10, life: 26, delay: 6, word: 'CRACK' }; } }];
  dsp.pose = st(dsp, [[0, POSES.stance], [10, P({ sq: 0.75, lean: 0.4, aN: [0.3, -1, 0.5], aF: [0.3, -1, 0.5], aNs: 1.5, aFs: 1.5 })], [16, P({ sq: 1.1, lean: -0.1, aN: [0.3, 1, 0.4], aF: [0.3, 1, 0.4], aNs: 1.6, aFs: 1.6, brow: 0.5 })], [total(dsp), POSES.stance]]);
  return { sp, fsp, dsp, rush: rushMove() };
}

// --------------------------------------------------------------- SOURPUSS
function sourMoves() {
  const sp = { name: 'Pucker Puff', start: 15, active: 1, rec: 22, lvl: 'mid', sfx: 'puff' };
  sp.proj = [{ at: 13, make: F => shot(F, 'sour', { vx: 2.7, hy: 0.6, r: 0.24, dmg: 6, stun: 52, hs: 52, kb: 0.3, life: 130, word: 'SOUR!' }) }];
  sp.pose = st(sp, [[0, POSES.stance], [9, P({ lean: -0.3, sq: 1.12, head: [-0.3, 0, 0], aN: [0.7, 0.4, -0.3], aF: [0.7, 0.4, -0.3], turn: 0.4 })], [14, P({ lean: 0.35, sq: 0.9, head: [0.25, 0, 0], aN: [0.6, -0.5, 0.3], aF: [0.6, -0.5, 0.3], turn: 0.2, brow: 0.6 })], [total(sp), POSES.stance]]);
  const fsp = { name: 'Sour Roll', start: 8, active: 26, rec: 14, dmg: 10, hs: 22, bs: 12, kb: 4, lift: 5, kd: true, box: [-0.2, 0.5, 0, 0.62], lvl: 'mid', low: true, sfx: 'roll', stopOnHit: true, word: 'ROLL' };
  fsp.vx = (t, F) => (F.rocketStop ? -1.5 : t >= 8 && t < 34 ? 6.8 : 0);
  fsp.onStart = F => { F.rocketStop = false; };
  fsp.onHit = F => { F.rocketStop = true; F.mt = 33; F.vy = 4; F.y = 0.001; };
  fsp.pose = t => { const p = mix(POSES.stance, P(POSES.tuck), Math.min(1, t / 7)); p.sq = 0.85; if (t >= 7 && t < 34) { p.lean = (t - 7) * 0.5; p.y = 0.05; } return p; };
  const dsp = { name: 'Sugar Storm', start: 6, active: 18, rec: 20, dmg: 3, hs: 16, bs: 8, kb: 2.4, multi: 6, box: [-0.6, 0.8, 0, 1.05], lvl: 'mid', invuln: [1, 10], sfx: 'sparkle', word: 'FIZZ' };
  dsp.onFrame = (F, t, M) => { if (t === 6) M.fxRing(F, '#eaffc0', 1.3); };
  dsp.pose = t => { const p = P({ sq: 1.05 + Math.sin(t) * 0.05, aN: [1, 0.4, 0.2], aF: [1, 0.5, 0.1], aNs: 1.4, aFs: 1.4, brow: 0.7, turn: 0.6 }); p.twist = t * 0.7; return t < 6 ? mix(POSES.stance, POSES.crouch, t / 6) : p; };
  return { sp, fsp, dsp, rush: rushMove() };
}

// ------------------------------------------------------------------ TANGO
function tangoMoves() {
  const sp = { name: 'Peel Boomerang', start: 14, active: 1, rec: 22, lvl: 'mid', sfx: 'swish2' };
  sp.proj = [{ at: 12, make: F => shot(F, 'peel', { vx: 6, hy: 0.55, r: 0.17, dmg: 8, boomerang: true, life: 150, word: 'THWACK' }) }];
  sp.pose = st(sp, [[0, POSES.stance], [9, P({ aN: [0.8, 0.3, -0.6], aNs: 1.2, twist: -0.6, turn: 0.4 })], [14, P({ aN: [0.0, 0.1, 1], aNs: 2, twist: 0.4, turn: 0.2, lean: 0.2 })], [total(sp), POSES.stance]]);
  const fsp = { name: 'Orange Crush', start: 10, active: 10, rec: 26, box: [0.05, 0.55, 0.1, 1.0], lvl: 'throw', grab: { dmg: 17, kind: 'crush' }, unblockable: true, sfx: 'swish2', word: 'GOTCHA' };
  fsp.vx = t => (t >= 6 && t < 20 ? 5.2 : 0);
  fsp.pose = st(fsp, [[0, POSES.stance], [8, P({ sq: 0.8, lean: 0.3, aN: [0.9, 0.2, -0.2], aF: [0.9, 0.2, -0.2], aNs: 1.2, aFs: 1.2 })], [11, P({ lean: 0.35, aN: [0.2, 0.1, 1], aF: [0.2, 0.15, 1], aNs: 2, aFs: 2, aNf: 1.4, aFf: 1.4, turn: 0.2, brow: 0.6 })], [total(fsp), POSES.stance]]);
  const dsp = { name: 'Belly Flop', start: 8, active: 40, rec: 16, dmg: 10, hs: 20, bs: 12, kb: 2, kd: true, lift: 4, box: [-0.3, 0.55, -0.1, 0.55], lvl: 'over', jump: { at: 7, vy: 9.5, vx: 2.4 }, airEnd: true, sfx: 'jump', word: 'FLOP' };
  dsp.landShock = (F) => ({ type: 'quake', owner: F, x: F.x, y: 0, vx: 0, vy: 0, g: 0, r: 1.5, dmg: 9, hs: 20, bs: 10, kb: 2.5, lift: 5, kd: true, life: 10, lvl: 'low', grounded: true, word: 'WHUMP' });
  dsp.onLand = (F, M) => { M.shake(0.25); M.fxRing(F, '#ffb060', 1.6); M.sfx('stomp', F); };
  dsp.pose = t => { if (t < 8) return mix(POSES.stance, POSES.crouch, t / 8); const p = P({ lean: Math.min(1.45, (t - 8) * 0.06), sq: 1.05, aN: [1, 0.6, 0], aF: [1, 0.6, 0], aNs: 1.3, aFs: 1.3, lN: [0.5, -0.5, -0.6], lF: [0.5, -0.5, -0.6], brow: 0.5 }); return p; };
  return { sp, fsp, dsp, rush: rushMove() };
}

// ---------------------------------------------------------------- GHOSTIE
function ghostMoves() {
  const sp = { name: 'Sugar Stars', start: 9, active: 1, rec: 16, lvl: 'mid', sfx: 'swish' };
  sp.proj = [
    { at: 8, make: F => shot(F, 'star', { vx: 9.5, hy: 0.68, r: 0.1, dmg: 5, hs: 14, kb: 1.2, word: 'TING' }) },
    { at: 11, make: F => shot(F, 'star', { vx: 9.5, hy: 0.45, r: 0.1, dmg: 5, hs: 14, kb: 1.2, word: 'TING' }) },
  ];
  sp.pose = st(sp, [[0, POSES.stance], [6, P({ aN: [0.5, 0.6, -0.4], twist: -0.4, turn: 0.4 })], [9, P({ aN: [0.0, 0.0, 1], aNs: 2, twist: 0.3, turn: 0.2, lean: 0.2 })], [12, P({ aF: [0.0, -0.1, 1], aFs: 2, twist: -0.2, turn: 0.2, lean: 0.2 })], [total(sp), POSES.stance]]);
  const fsp = { name: 'Pineapple Express', start: 6, active: 12, rec: 12, dmg: 10, hs: 22, bs: 12, kb: 3, lift: 3, box: [-0.25, 0.5, 0.15, 0.9], lvl: 'mid', passThrough: true, sfx: 'dash', word: 'ZIP' };
  fsp.vx = t => (t >= 5 && t < 18 ? 11.5 : 0);
  fsp.fade = [5, 18];
  fsp.pose = st(fsp, [[0, POSES.stance], [5, P({ sq: 0.8, lean: 0.5, aN: [0.4, -0.4, -0.8], aF: [0.4, -0.4, -0.8] })], [8, P({ lean: 0.85, y: 0.05, turn: 0.1, aN: [0.3, -0.3, -1], aF: [0.3, -0.3, -1], aNs: 1.4, aFs: 1.4, lN: [0.2, -0.5, -0.8], lF: [0.2, -0.6, -0.6] })], [18, P({ lean: 0.85, y: 0.05, turn: 0.1, aN: [0.3, -0.3, -1], aF: [0.3, -0.3, -1] })], [total(fsp), POSES.stance]]);
  const dsp = { name: "Now You Don't", start: 22, active: 5, rec: 16, dmg: 8, hs: 22, bs: 12, kb: 3.5, lift: 4, kd: true, box: [0.05, 0.8, 0.1, 0.75], lvl: 'mid', teleport: { at: 15 }, invuln: [3, 20], sfx: 'vanish', word: 'BOO' };
  dsp.fade = [3, 18];
  dsp.pose = st(dsp, [[0, POSES.stance], [3, P({ sq: 0.7, lean: 0.3, aN: [0.2, 0.9, 0.5], aF: [0.2, 0.9, 0.5] })], [17, P({ sq: 0.8 })], [21, P({ lN: [0.3, -0.6, -0.6], turn: 0.3 })], [23, P({ lN: [-0.05, -0.05, 1], lNs: 2.1, lean: -0.35, turn: 0.1, aN: [0.8, 0.2, -0.3] })], [total(dsp), POSES.stance]]);
  return { sp, fsp, dsp, rush: rushMove() };
}

// ------------------------------------------------------------------- DUKE
function dukeMoves() {
  const sp = { name: 'Grape Shot', start: 14, active: 1, rec: 20, lvl: 'mid', sfx: 'pop' };
  sp.proj = [0, 1, 2].map(i => ({ at: 12, make: F => shot(F, 'grape', { vx: 3.6 + i * 1.2, vy: 4 + i * 1.6, g: 14, hy: 1.0, r: 0.09, dmg: 4, hs: 14, kb: 1.5, word: 'SPLUT' }) }));
  sp.pose = st(sp, [[0, POSES.stance], [8, P({ lean: -0.3, head: [-0.5, 0, 0], aN: [0.5, 0.9, 0.2], aNs: 1.3, turn: 0.5 })], [13, P({ lean: 0.2, head: [0.3, 0, 0], aN: [0.3, 0.7, 0.6], aNs: 1.4, turn: 0.4, brow: 0.4 })], [total(sp), POSES.stance]]);
  const fsp = { name: 'Royal Lunge', start: 11, active: 5, rec: 18, dmg: 11, hs: 22, bs: 13, kb: 4, box: [0.2, 1.3, 0.42, 0.78], lvl: 'mid', sfx: 'swish2', cane: true, word: 'TOUCHÉ' };
  fsp.vx = t => (t >= 6 && t < 14 ? 4.5 : 0);
  fsp.pose = st(fsp, [[0, POSES.stance], [9, P({ aN: [0.5, 0.2, -0.7], aNs: 1.1, lean: -0.15, turn: 0.4, lN: [0.3, -1, 0.5] })], [12, P({ aN: [0.0, 0.05, 1], aNs: 2.1, aNf: 1.2, lean: 0.4, turn: 0.1, lN: [0.2, -0.8, 0.8], lNs: 1.3, lF: [0.25, -1, -0.5], brow: 0.5 })], [total(fsp), POSES.stance]]);
  const dsp = { name: 'Royal Bounce', start: 8, active: 40, rec: 18, dmg: 11, hs: 22, bs: 12, kb: 2.5, lift: 5, kd: true, box: [-0.35, 0.4, -0.12, 0.45], lvl: 'over', jump: { at: 7, vy: 10.5, vx: 1.6 }, airEnd: true, sfx: 'jump', word: 'BOUNCE' };
  dsp.landShock = (F) => ({ type: 'quake', owner: F, x: F.x, y: 0, vx: 0, vy: 0, g: 0, r: 1.1, dmg: 7, hs: 18, bs: 10, kb: 2, lift: 4, kd: true, life: 10, lvl: 'low', grounded: true, word: 'BOOM' });
  dsp.onLand = (F, M) => { M.shake(0.2); M.fxRing(F, '#c890ff', 1.2); M.sfx('stomp', F); };
  dsp.pose = t => { if (t < 8) return mix(POSES.stance, POSES.crouch, t / 8); return P({ lean: -0.55, sq: 0.95, aN: [0.9, 0.8, 0], aF: [0.9, 0.8, 0], lN: [0.3, -0.2, 1], lF: [0.3, -0.25, 1], brow: 0.4 }); };
  return { sp, fsp, dsp, rush: rushMove() };
}

// ---------------------------------------------------------------- GUMMOTH
function gummothMoves() {
  const sp = { name: 'Jelly Glob', start: 18, active: 1, rec: 22, lvl: 'mid', sfx: 'glob' };
  sp.proj = [{ at: 16, make: F => shot(F, 'glob', { vx: 4.6, hy: 0.5, r: 0.3, dmg: 12, hs: 22, kb: 3.5, lift: 3, word: 'SPLOOSH' }) }];
  sp.pose = st(sp, [[0, POSES.stance], [12, P({ aN: [0.6, 1, -0.2], aF: [0.6, 1, -0.2], aNs: 1.4, aFs: 1.4, lean: -0.3, sq: 1.1 })], [18, P({ aN: [0.1, -0.2, 1], aF: [0.1, -0.2, 1], aNs: 1.9, aFs: 1.9, lean: 0.4, sq: 0.9, brow: 0.6 })], [total(sp), POSES.stance]]);
  const fsp = { name: 'Stampede', start: 14, active: 30, rec: 22, dmg: 14, hs: 24, bs: 14, kb: 6, lift: 5, kd: true, box: [0, 0.6, 0, 1.0], lvl: 'mid', armor: true, sfx: 'roar', stopOnHit: true, word: 'STOMP' };
  fsp.vx = (t, F) => (F.rocketStop ? 0 : t >= 12 && t < 44 ? 6 : 0);
  fsp.onStart = F => { F.rocketStop = false; };
  fsp.onHit = F => { F.rocketStop = true; F.mt = 43; };
  fsp.pose = t => { if (t < 12) return mix(POSES.stance, P({ sq: 0.8, lean: 0.4 }), t / 12); const ph = t * 0.6; const p = P({ lean: 0.55, aN: [0.5, -0.2, 0.9], aF: [0.5, -0.2, 0.9], brow: 0.7 }); p.y = Math.abs(Math.sin(ph)) * 0.05; p.lN = [0.3, -1, Math.sin(ph) * 0.7]; p.lF = [0.3, -1, -Math.sin(ph) * 0.7]; return p; };
  const dsp = { name: 'Quake Stomp', start: 18, active: 1, rec: 26, lvl: 'low', armor: true, sfx: 'roar' };
  dsp.proj = [{ at: 18, make: F => ({ type: 'wave', owner: F, x: F.x + F.f * 0.5, y: 0, vx: 5.5 * F.f, vy: 0, g: 0, r: 0.28, h: 0.35, dmg: 12, hs: 22, bs: 12, kb: 3, lift: 6, kd: true, life: 70, lvl: 'low', grounded: true, word: 'QUAKE' }) }];
  dsp.onFrame = (F, t, M) => { if (t === 18) { M.shake(0.4); M.fxRing(F, '#ffd0ff', 2.0); M.sfx('stomp', F); } };
  dsp.pose = st(dsp, [[0, POSES.stance], [14, P({ lean: -0.2, sq: 1.08, lN: [0.4, 0.2, 0.6], lNs: 1.2, aN: [0.8, 0.6, 0], aF: [0.8, 0.6, 0], brow: 0.6 })], [18, P({ lean: 0.2, sq: 0.8, lN: [0.4, -1, 0.3], aN: [0.8, 0.2, 0], aF: [0.8, 0.2, 0], brow: 0.6 })], [total(dsp), POSES.stance]]);
  return { sp, fsp, dsp, rush: rushMove() };
}

// =================================================================== ROSTER
export const ROSTER = [
  {
    key: 'cherry', name: 'CHERRY BOMB', short: 'CHERRY', flavor: { tint: '#ff6a78', deep: '#c4001c', glow: '#ff2040', rim: '#ffb0b8' },
    ui: '#ff3a52', ui2: '#ffd0d6', stats: { speed: 1.05, power: 1.07, defense: 1.02, jump: 1 },
    title: 'The Hothead', bio: "Short fuse, big pop, 100% cherry. She trained at the Sugar Temple until they banned her for excessive popping.",
    moves: cherryMoves(), finisher: { key: 'pop', name: 'POP GOES THE GUMMY' },
    ending: "Cherry Bomb flattened Gummoth with one last Cherry Rocket. The Sugar Temple let her back in on one condition: no popping indoors. She popped indoors.",
    dress: 'cherry', winPose: 'win', stars: { POWER: 3, SPEED: 4, REACH: 3 },
  },
  {
    key: 'razz', name: 'RAZZ', short: 'RAZZ', flavor: { tint: '#78ccff', deep: '#0a3fd0', glow: '#1e7bff', rim: '#c8ecff' },
    ui: '#2f8cff', ui2: '#cfe9ff', stats: { speed: 1.02, power: 1.07, defense: 1.03, jump: 1 },
    title: 'The Cool One', bio: "Blue raspberry, and the coolest bear in the bag. Literally: he lives in the freezer. Never takes off the shades, not even to sleep.",
    moves: razzMoves(), finisher: { key: 'freeze', name: 'SNOW CONE' },
    ending: "With Gummoth chilled, Razz turned the Jar into the coolest ice rink in the kitchen. Admission is free. Sunglasses are required.",
    dress: 'razz', winPose: 'flex', stars: { POWER: 3, SPEED: 3, REACH: 4 },
  },
  {
    key: 'sour', name: 'SOURPUSS', short: 'SOURPUSS', flavor: { tint: '#c0ff70', deep: '#2f9a00', glow: '#6aff22', rim: '#eaffc8', sugar: true, rough: 0.4 },
    ui: '#62d81a', ui2: '#e4ffc8', stats: { speed: 0.95, power: 1.05, defense: 1.05, jump: 0.95 }, shape: { body: [0.24, 0.245, 0.2], belly: [0.19, 0.17, 0.15] },
    title: 'The Grump', bio: "Rolled in sour sugar and one bad mood. One look from him and your whole face scrunches up.",
    moves: sourMoves(), finisher: { key: 'pucker', name: 'MEGA PUCKER' },
    ending: "Sourpuss beat Gummoth. For one whole second he almost smiled. Then he remembered he was Sourpuss.",
    dress: 'sour', winPose: 'taunt', stars: { POWER: 3, SPEED: 3, REACH: 3 },
  },
  {
    key: 'tango', name: 'BIG TANGO', short: 'TANGO', flavor: { tint: '#ffb466', deep: '#ff6000', glow: '#ff8a1a', rim: '#ffe0b8' },
    ui: '#ff8a1a', ui2: '#ffe3c4', stats: { speed: 0.84, power: 1.1, defense: 1.06, jump: 0.92 }, scale: 1.16, wide: 1.12,
    shape: { body: [0.28, 0.265, 0.215], belly: [0.225, 0.19, 0.17], arm: [0.105, 0.16, 0.105], shoulder: [0.21, 0.48, 0.03], leg: [0.13, 0.13, 0.13], legX: 0.14, head: [0.205, 0.18, 0.17] },
    title: 'The Champ', bio: "Three-time Heavyweight Champion of the Candy Aisle. His belt is solid gold. (It is a chocolate coin.)",
    moves: tangoMoves(), finisher: { key: 'rollup', name: 'FRUIT ROLL-UP' },
    ending: "Tango added Gummoth's crown to his collection. He now wears two belts and a crown and walks very slowly so everybody can see.",
    dress: 'tango', winPose: 'flex', stars: { POWER: 5, SPEED: 2, REACH: 3 },
  },
  {
    key: 'ghost', name: 'GHOSTIE', short: 'GHOSTIE', flavor: { tint: '#fffdf0', deep: '#fff0a8', glow: '#fff4c0', rim: '#ffffff', atten: 2.5, glowAmt: 0.05, rimAmt: 0.45, rough: 0.12 },
    ui: '#f5e9a0', ui2: '#fffbe6', stats: { speed: 1.22, power: 1.0, defense: 1.0, jump: 1.1 },
    shape: { body: [0.215, 0.25, 0.175], belly: [0.165, 0.16, 0.125], arm: [0.078, 0.15, 0.078], leg: [0.105, 0.13, 0.105], legX: 0.115 },
    title: 'The Clear Ninja', bio: "A clear pineapple ninja. You can see right through her, which is exactly why you never see her coming.",
    moves: ghostMoves(), finisher: { key: 'wrap', name: 'CANDY WRAPPED' },
    ending: "Nobody saw Ghostie beat Gummoth. Nobody saw her take the crown. Nobody has seen the crown since.",
    dress: 'ghost', winPose: 'taunt', stars: { POWER: 2, SPEED: 5, REACH: 3 },
  },
  {
    key: 'duke', name: 'DUKE GRAPE', short: 'DUKE', flavor: { tint: '#cf98ff', deep: '#5a0aa8', glow: '#9a40ff', rim: '#ead8ff' },
    ui: '#a24cff', ui2: '#ecdcff', stats: { speed: 0.97, power: 1.15, defense: 1.05, jump: 1 }, shape: { belly: [0.215, 0.19, 0.17], bellyZ: 0.07 },
    title: 'The Gentlebear', bio: "Old money, older grapes. A cane, a monocle and perfect manners. \"Pardon me,\" he says, right before the Royal Bounce.",
    moves: dukeMoves(), finisher: { key: 'sticker', name: 'STICKERED' },
    ending: "\"Jolly good show,\" said Duke Grape, and he invited Gummoth to tea. Gummoth ate the teapot. They are friends now.",
    dress: 'duke', winPose: 'win', stars: { POWER: 4, SPEED: 3, REACH: 4 },
  },
  {
    key: 'gummoth', name: 'GUMMOTH', short: 'GUMMOTH', boss: true, flavor: { tint: '#ffffff', deep: '#ffd8f0', glow: '#ff80d0', rim: '#ffffff', atten: 1.4, glowAmt: 0.14, rainbow: true },
    ui: '#ff5ad2', ui2: '#ffe0f6', stats: { speed: 0.74, power: 1.0, defense: 1.02, jump: 0.85 }, scale: 1.65, wide: 1.1, hp: 100, reachK: 0.78,
    shape: { body: [0.27, 0.27, 0.21], belly: [0.23, 0.2, 0.18], arm: [0.1, 0.16, 0.1], shoulder: [0.205, 0.48, 0.03], leg: [0.13, 0.13, 0.13], legX: 0.14 },
    title: 'King of the Jar', bio: "The biggest gummy bear ever poured, every flavor at once. He rules the Jar, and he does not share.",
    moves: gummothMoves(), finisher: { key: 'sit', name: 'THE BIG SIT' },
    ending: "Gummoth already ruled the Jar. Now he rules the Jar and the shelf. Next: the whole kitchen.",
    dress: 'gummoth', winPose: 'flex', stars: { POWER: 5, SPEED: 1, REACH: 4 },
  },
];
export const BY_KEY = Object.fromEntries(ROSTER.map(r => [r.key, r]));
export const PLAYABLE = ROSTER.filter(r => !r.boss).map(r => r.key);

export const STANCES = {
  tango: { aN: [0.6, -0.4, 0.7], aF: [0.65, -0.3, 0.7], lean: 0.14 },
  ghost: { aN: [0.3, 0.1, 0.95], aF: [0.4, 0.25, 0.9], lean: 0.18, sq: 0.97 },
  duke: { aN: [0.5, -0.6, 0.5], aF: [0.3, 0.2, 0.9], lean: 0.02 },
  gummoth: { aN: [0.7, -0.6, 0.4], aF: [0.7, -0.5, 0.4], lean: 0.12 },
  razz: { aN: [0.5, -0.5, 0.6], aF: [0.4, 0.05, 0.9], lean: 0.06 },
};
for (const r of ROSTER) r.stance = STANCES[r.key] || null;
