// Which way is the phone facing?
//
// Everything works from one thing: the direction of "up" as the phone sees
// it (x across the screen, y along it, z straight out of the glass). On a
// forehead the screen stands upright, so up lies in the screen's plane.
// Nod forward (screen tips toward the floor) and up swings behind the
// glass: z goes negative. Tip your head back (screen toward the ceiling)
// and z goes positive. "pitch" is that angle in degrees.

const D = Math.PI / 180;
const T = {
  up: [0, 0, 1], raw: null, t: 0, src: null, listening: false,
  flip: 1, flipSet: false, motionT: 0,
};
export const tiltState = T;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const now = () => performance.now();

function feed(v, src) {
  const n = Math.hypot(v[0], v[1], v[2]);
  if (!(n > 0.2)) return;
  const u = [v[0] / n, v[1] / n, v[2] / n];
  const t = now();
  const dt = T.t ? Math.min(0.2, (t - T.t) / 1000) : 1;
  const a = 1 - Math.exp(-dt / 0.05); // about 50 ms of smoothing
  if (!T.raw || src !== T.src) T.up = u.slice();
  else for (let i = 0; i < 3; i++) T.up[i] += (u[i] - T.up[i]) * a;
  T.raw = u; T.t = t; T.src = src;
}

function onOrient(e) {
  if (e.beta == null || e.gamma == null) return;
  const b = e.beta * D, g = e.gamma * D;
  // up, in the phone's own axes, from its tilt angles
  feed([-Math.cos(b) * Math.sin(g), Math.sin(b), Math.cos(b) * Math.cos(g)], 'orient');
}

function onMotion(e) {
  const a = e.accelerationIncludingGravity;
  if (!a || a.x == null) return;
  T.motionT = now();
  // only used when the tilt angles never arrive
  if (T.src === 'orient' && now() - T.t < 600) return;
  let v = [a.x, a.y, a.z];
  // Some phones report this upside down. The player has just tapped the
  // screen, so it faces them (z points up): if z reads down, flip.
  if (!T.flipSet) { const n = Math.hypot(...v) || 1; if (Math.abs(v[2] / n) > 0.35) { T.flip = v[2] < 0 ? -1 : 1; T.flipSet = true; } }
  v = v.map(x => x * T.flip);
  feed(v, 'motion');
}

function listen() {
  if (T.listening) return;
  T.listening = true;
  window.addEventListener('deviceorientation', onOrient);
  window.addEventListener('devicemotion', onMotion);
}

// Must be called straight from a tap (iPhone asks the player once).
// Resolves to 'granted', 'denied' or 'none' (no motion sensor in this browser).
export function askMotion() {
  const DO = window.DeviceOrientationEvent, DM = window.DeviceMotionEvent;
  if (!DO && !DM) return Promise.resolve('none');
  T.flipSet = false;
  let p;
  try {
    if (DO && typeof DO.requestPermission === 'function') p = DO.requestPermission();
    else if (DM && typeof DM.requestPermission === 'function') p = DM.requestPermission();
  } catch (e) { p = Promise.resolve('denied'); }
  if (!p) { listen(); return Promise.resolve('granted'); }
  return p.then(r => {
    if (r === 'granted') {
      listen();
      try { if (DM && typeof DM.requestPermission === 'function') DM.requestPermission().catch(() => {}); } catch (e) {}
    }
    return r === 'granted' ? 'granted' : 'denied';
  }).catch(() => 'denied');
}

// true once real readings are coming in
export const hasTilt = () => !!T.raw && now() - T.t < 800;

export function reading() {
  const [x, y, z] = T.up;
  return { x, y, z, pitch: Math.asin(clamp(z, -1, 1)) / D, fresh: hasTilt() };
}

// Upright screen, held still enough: on a forehead (or held up to start).
export function screenUpright() {
  const r = reading();
  return r.fresh && Math.abs(r.z) < 0.5;
}

// When the browser did not turn the page (the phone's rotation lock is on),
// the page is still upright-portrait while the phone is held sideways. This
// says how far to turn the play screen so the word reads the right way up.
let lastTurn = 0;
export function contentTurn() {
  if (window.innerWidth > window.innerHeight) { lastTurn = 0; return 0; }
  const r = reading();
  if (!r.fresh) return lastTurn;
  const ax = Math.abs(r.x), ay = Math.abs(r.y);
  if (ax > 0.62 && ax > ay * 1.25) lastTurn = r.x > 0 ? 90 : -90;
  else if (ay > 0.62 && ay > ax * 1.25) lastTurn = 0;
  return lastTurn;
}

// ------------------------------------------------------------ nod reader
// Feed it every frame during a round. It calls back 'ok' or 'pass' once per
// nod, then waits for the head to come back level before it listens again.
export class NodReader {
  // th: { ok, pass } degrees from level for a nod down and a tip up
  constructor(th = { ok: 36, pass: 20 }) {
    this.th = th; this.neutral = 0; this.samples = [];
    this.armed = false; this.over = null; this.overT = 0; this.levelT = 0;
  }
  // during the countdown: learn how this player holds their head
  learn() { const r = reading(); if (r.fresh) { this.samples.push(r.pitch); if (this.samples.length > 40) this.samples.shift(); } }
  begin() {
    const s = this.samples.slice(-20);
    this.neutral = s.length ? clamp(s.reduce((a, b) => a + b, 0) / s.length, -30, 30) : 0;
    this.armed = true; this.over = null; this.levelT = 0;
  }
  // stop listening until the head is level again (after a pause, say)
  wait() { this.armed = false; this.over = null; this.levelT = 0; }
  // returns 'ok', 'pass', 'level' (back to neutral after a nod) or null
  step() {
    const r = reading();
    if (!r.fresh) return null;
    const d = r.pitch - this.neutral;
    const t = now();
    if (this.armed) {
      const dir = d < -this.th.ok ? 'ok' : d > this.th.pass ? 'pass' : null;
      if (dir !== this.over) { this.over = dir; this.overT = t; }
      if (dir && t - this.overT > 70) { this.armed = false; this.levelT = 0; return dir; }
      return null;
    }
    if (d > -this.th.ok * 0.5 && d < this.th.pass * 0.5) {
      if (!this.levelT) this.levelT = t;
      if (t - this.levelT > 140) { this.armed = true; this.over = null; return 'level'; }
    } else this.levelT = 0;
    return null;
  }
}
