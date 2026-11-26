// NUBBINS — one fighter: inputs, states, moves, physics.
// Runs at a fixed 60 steps a second. Distances are in bear heights.
import { P, kf, POSES, STANCE, mix } from './anim.js';

export const DT = 1 / 60;
export const GRAV = 30;
export const STAGE_W = 5.6;   // half width of every arena floor
export const MAX_SEP = 4.4;   // how far apart the camera lets fighters get

const BTN = ['p', 'k', 's', 'b', 'x', 'u'];

// ------------------------------------------------------------ shared moves
// pose helper: wind-up pose, strike pose, back to stance
function strike(m, wind, hit, extra) {
  const total = m.start + m.active + m.rec;
  const keys = [[0, POSES.stance], [Math.max(1, m.start * 0.75), wind], [m.start, hit], [m.start + m.active + Math.min(4, m.rec * 0.3), hit], [total, extra || POSES.stance]];
  return t => kf(keys, t);
}

export function makeNormals() {
  const N = {};
  N.jab = { name: 'Jelly Jab', start: 4, active: 3, rec: 8, dmg: 4, hs: 13, bs: 8, kb: 1.6, box: [0.1, 0.64, 0.6, 0.82], lvl: 'high', chain: { p: 'jab2', k: 'kick' }, cancel: true, sfx: 'swish', word: 'BOP' };
  N.jab.pose = strike(N.jab, P({ aN: [0.3, -0.2, 0.5], aNs: 0.8, twist: -0.15, turn: 0.35 }), P({ aN: [0.05, 0.08, 1], aNs: 2.35, aNf: 1.7, twist: 0.25, turn: 0.2, lean: 0.25, chest: [0.1, 0.3, 0], brow: 0.3 }));
  N.jab2 = { name: 'Jab Jab', start: 5, active: 3, rec: 10, dmg: 5, hs: 15, bs: 9, kb: 1.9, box: [0.1, 0.66, 0.56, 0.84], lvl: 'high', chain: { k: 'kick', p: 'upper' }, cancel: true, sfx: 'swish', word: 'BIP' };
  N.jab2.pose = strike(N.jab2, P({ aF: [0.4, -0.1, 0.4], aFs: 0.8, twist: 0.2, turn: 0.3 }), P({ aF: [0.05, 0.12, 1], aFs: 2.4, aFf: 1.7, twist: -0.3, turn: 0.2, lean: 0.25, brow: 0.3 }));
  N.kick = { name: 'Gummy Kick', start: 7, active: 4, rec: 13, dmg: 7, hs: 17, bs: 10, kb: 3.0, box: [0.15, 0.8, 0.12, 0.6], lvl: 'mid', cancel: true, sfx: 'swish', word: 'BOOT' };
  N.kick.pose = strike(N.kick, P({ lN: [0.3, -0.6, -0.6], lean: -0.1, turn: 0.3 }), P({ lN: [-0.05, -0.08, 1], lNs: 2.05, lean: -0.35, turn: 0.1, aN: [0.8, 0.2, -0.3], aF: [0.6, 0.4, -0.4], brow: 0.3 }));
  N.upper = { name: 'Gumdrop Uppercut', start: 8, active: 4, rec: 20, dmg: 10, hs: 20, bs: 12, kb: 1.4, lift: 10, box: [0.0, 0.58, 0.35, 1.35], lvl: 'mid', cancel: true, sfx: 'swish2', word: 'BOING' };
  N.upper.pose = strike(N.upper, P({ sq: 0.65, lean: 0.3, aN: [0.2, -0.9, 0.3], aNs: 0.8, turn: 0.3 }), P({ sq: 1.3, y: 0.1, lean: -0.2, aN: [0.0, 1, 0.3], aNs: 2.5, aNf: 1.8, turn: 0.2, twist: 0.3, brow: 0.4 }), POSES.crouch);
  N.sweep = { name: 'Taffy Sweep', start: 8, active: 4, rec: 18, dmg: 6, hs: 20, bs: 10, kb: 1.5, lift: 3.5, kd: true, box: [0.1, 0.88, 0, 0.24], lvl: 'low', cancel: true, sfx: 'swish', word: 'TRIP' };
  N.sweep.pose = strike(N.sweep, P({ sq: 0.62, lean: 0.4, lN: [0.5, -0.9, -0.4], turn: 0.4 }), P({ sq: 0.6, lean: 0.35, twist: 0.5, lN: [-0.1, -0.32, 1], lNs: 2.3, turn: 0.1, aN: [0.7, -0.6, 0.2], aF: [0.8, -0.5, 0.1] }), POSES.crouch);
  N.spin = { name: 'Jiggle Spin Kick', start: 11, active: 6, rec: 16, dmg: 10, hs: 22, bs: 12, kb: 5.2, lift: 4.5, kd: true, box: [0.0, 0.88, 0.25, 0.85], lvl: 'mid', sfx: 'swish2', word: 'WHAP' };
  {
    const m = N.spin, total = m.start + m.active + m.rec;
    const wind = P({ lean: -0.05, turn: 0.3, twist: -0.4, lN: [0.4, -0.8, -0.3] });
    const hit = P({ lean: -0.3, turn: 0.1, lN: [1, 0.15, 0.4], lNs: 2.1, aN: [0.9, 0.3, -0.2], aF: [0.9, 0.3, 0.1] });
    m.pose = t => {
      const p = t < m.start ? kf([[0, POSES.stance], [m.start, wind]], t) : t < m.start + m.active + 3 ? mix(hit, hit, 0) : kf([[m.start + m.active + 3, hit], [total, POSES.stance]], t);
      if (t >= m.start - 3 && t < m.start + m.active + 3) p.twist = -0.4 + ((t - m.start + 3) / (m.active + 6)) * Math.PI * 2;
      return p;
    };
  }
  N.bonk = { name: 'Bonk', start: 13, active: 4, rec: 14, dmg: 8, hs: 20, bs: 11, kb: 2.5, box: [0.1, 0.62, 0.5, 1.05], lvl: 'over', sfx: 'swish', word: 'BONK', vx: t => (t < 13 ? 1.2 : 0) };
  N.bonk.pose = strike(N.bonk, P({ lean: -0.35, sq: 1.15, y: 0.05, head: [-0.4, 0, 0], turn: 0.3, aN: [0.8, 0.3, -0.3], aF: [0.8, 0.3, -0.3] }), P({ lean: 0.75, sq: 0.85, head: [0.5, 0, 0], y: 0.04, turn: 0.2, brow: 0.4 }));
  N.airP = { name: 'Air Jab', start: 4, active: 9, rec: 6, dmg: 6, hs: 16, bs: 10, kb: 2.2, box: [0.05, 0.62, 0.22, 0.72], lvl: 'over', air: true, sfx: 'swish', word: 'POW' };
  N.airP.pose = t => kf([[0, POSES.tuck], [4, P({ aN: [0.05, -0.4, 1], aNs: 2.2, aNf: 1.6, lean: 0.3, turn: 0.2, lN: [0.3, -0.5, 0.6], lF: [0.3, -0.6, -0.2] })]], t);
  N.airK = { name: 'Dive Kick', start: 5, active: 11, rec: 6, dmg: 8, hs: 18, bs: 11, kb: 2.8, box: [0.0, 0.74, -0.08, 0.45], lvl: 'over', air: true, sfx: 'swish', word: 'THUD' };
  N.airK.pose = t => kf([[0, POSES.tuck], [5, P({ lN: [0, -0.6, 1], lNs: 2.1, lean: -0.2, turn: 0.15, aN: [0.8, 0.5, -0.2], aF: [0.7, 0.6, -0.3], lF: [0.3, -0.5, 0.4] })]], t);
  N.throw = { name: 'Bear Hug', start: 4, active: 3, rec: 20, box: [0.05, 0.42, 0.2, 0.9], lvl: 'throw', grab: { dmg: 12, kind: 'hug' }, sfx: 'swish', word: 'HUG' };
  N.throw.pose = strike(N.throw, P({ aN: [0.5, 0.1, 0.8], aF: [0.5, 0.2, 0.8], turn: 0.3 }), P({ aN: [0.1, 0.05, 1], aNs: 1.7, aF: [0.1, 0.1, 1], aFs: 1.7, lean: 0.2, turn: 0.2 }));
  for (const k in N) N[k].id = k;
  return N;
}

// --------------------------------------------------------------- Fighter
export class Fighter {
  constructor(def, side, M) {
    this.def = def; this.side = side; this.M = M;
    this.sc = def.scale || 1;
    this.st = def.stats || {};
    this.speed = this.st.speed || 1; this.power = this.st.power || 1; this.defense = this.st.defense || 1; this.jumpPow = this.st.jump || 1;
    this.maxhp = def.hp || 100; this.hp = this.maxhp;
    this.meter = 0;
    this.moves = Object.assign(makeNormals(), def.moves || {});
    for (const k in this.moves) this.moves[k].id = k;
    this.inp = { l: 0, r: 0, u: 0, d: 0, p: 0, k: 0, s: 0, b: 0, x: 0 };
    this.prevInp = { ...this.inp };
    this.buf = { p: -99, k: -99, s: -99, b: -99, x: -99, u: -99 };
    this.reset(side === 0 ? -1.6 : 1.6, side === 0 ? 1 : -1);
  }

  reset(x, f) {
    this.x = x; this.y = 0; this.vx = 0; this.vy = 0; this.f = f;
    this.state = 'idle'; this.t = 0; this.move = null; this.mt = 0;
    this.hitT = 0; this.combo = 0; this.juggle = 0; this.connected = false; this.hitDone = new Set();
    this.invuln = 0; this.alpha = 1; this.hitLvl = 'high'; this.airAtk = false; this.pushV = 0;
    this.grabbing = null; this.grabbedBy = null; this.lastHit = 0; this.ccw = 0; this.noJuggle = false;
    this.fx = {}; this.wobble = 0;
  }

  get w() { return 0.24 * this.sc * (this.def.wide || 1); }
  get grounded() { return this.y <= 0.0001 && this.vy <= 0; }
  // the bear to fight: the other one in 1 on 1, the nearest one still in the round in a party (set by the match)
  get opp() { return this._opp || this.M.fighters[1 - this.side] || this.M.fighters.find(G => G !== this); }
  get fwd() { return this.f > 0 ? this.inp.r : this.inp.l; }
  get back() { return this.f > 0 ? this.inp.l : this.inp.r; }
  get neutral() { return ['idle', 'walk', 'crouch', 'block', 'cblock', 'land'].includes(this.state); }
  get attacking() { return this.state === 'attack' && this.move && this.mt < this.move.start + this.move.active; }

  setInput(inp) {
    const fr = this.M.frame;
    for (const b of BTN) if (inp[b] && !this.inp[b]) this.buf[b] = fr;
    for (const k in this.inp) this.inp[k] = inp[k] ? 1 : 0;
  }
  pressed(b, win = 7) { return this.M.frame - this.buf[b] <= win; }
  consume(b) { this.buf[b] = -99; }

  go(state) { this.state = state; this.t = 0; }

  startMove(id) {
    const m = this.moves[id];
    if (!m) return false;
    if (m.meter && this.meter < m.meter) return false;
    if (m.meter) this.meter -= m.meter;
    this.move = m; this.mt = 0; this.go('attack'); this.connected = false; this.hitDone.clear(); this.hits = 0;
    this.airAtk = !!m.air;
    if (m.onStart) m.onStart(this, this.M);
    if (m.sfx) this.M.sfx(m.sfx, this);
    return true;
  }

  // choose an action from neutral
  act() {
    const M = this.M, o = this.opp.seen || this.opp; // the opponent as it was at the start of this step
    const close = Math.abs(o.x - this.x) < (this.w + o.w) + 0.3 * this.sc;
    if (this.pressed('x') && this.meter >= 100 && this.moves.rush) { this.consume('x'); return this.startMove('rush'); }
    if (this.pressed('s')) {
      this.consume('s');
      if (this.inp.b && this.meter >= 100 && this.moves.rush) return this.startMove('rush');
      const id = this.inp.d ? 'dsp' : this.fwd ? 'fsp' : 'sp';
      if (this.moves[id]) return this.startMove(id);
    }
    if (this.pressed('p')) {
      this.consume('p');
      if (close && this.fwd && o.grounded && o.neutral && o.state !== 'getup' && !o.invuln) return this.startMove('throw');
      return this.startMove(this.inp.d ? 'upper' : this.fwd ? 'bonk' : 'jab');
    }
    if (this.pressed('k')) { this.consume('k'); return this.startMove(this.inp.d ? 'sweep' : this.fwd ? 'spin' : 'kick'); }
    return false;
  }

  shouldAutoBlock() {
    if (!this.back || this.inp.u) return false;
    const o = this.opp.seen || this.opp;
    const d = Math.abs(o.x - this.x);
    if (o.state === 'attack' && o.move && o.move.lvl !== 'throw' && d < 2.6 * Math.max(1, o.sc)) return true;
    for (const pr of this.M.projectiles) if (pr.owner !== this && pr.dmg && Math.abs(pr.x - this.x) < 2.4 && Math.sign(pr.vx || 0) === Math.sign(this.x - pr.x)) return true;
    return false;
  }

  step() {
    const M = this.M, o = this.opp;
    this.t++;
    if (this.invuln > 0) this.invuln--;
    switch (this.state) {
      case 'idle': case 'walk': case 'crouch': case 'block': case 'cblock': case 'land': {
        if (this.state === 'land' && this.t < 4) break;
        if (this.act()) break;
        const wantBlock = this.inp.b || this.shouldAutoBlock();
        if (this.inp.u && !wantBlock) { this.go('jumpsquat'); break; }
        if (wantBlock) { const s = this.inp.d ? 'cblock' : 'block'; if (this.state !== s) this.go(s); this.vx = 0; break; }
        if (this.inp.d) { if (this.state !== 'crouch') this.go('crouch'); this.vx = 0; break; }
        if (this.fwd) { if (this.state !== 'walk') this.go('walk'); this.vx = 2.1 * this.speed * this.f * M.slowAt(this.x); this.walkDir = 1; }
        else if (this.back) { if (this.state !== 'walk') this.go('walk'); this.vx = -1.7 * this.speed * this.f * M.slowAt(this.x); this.walkDir = -1; }
        else { if (this.state !== 'idle') this.go('idle'); this.vx = 0; }
        break;
      }
      case 'jumpsquat':
        this.vx = 0;
        if (this.t >= 3) {
          const dir = this.fwd ? 1 : this.back ? -1 : 0;
          this.vy = 9.4 * this.jumpPow * Math.sqrt(this.sc > 1.3 ? 1.08 : 1);
          this.vx = dir * 2.7 * this.speed * this.f;
          this.y = 0.001; this.airAtk = false; this.go('air'); M.sfx('jump', this); M.bear(this).jolt(2.5);
        }
        break;
      case 'air':
        if (!this.airAtk) {
          if (this.pressed('p')) { this.consume('p'); this.startMove('airP'); break; }
          if (this.pressed('k')) { this.consume('k'); this.startMove('airK'); break; }
          if (this.pressed('s') && this.moves.asp) { this.consume('s'); this.startMove('asp'); break; }
        }
        break;
      case 'attack': this.runMove(); break;
      case 'hit': case 'blockstun': case 'stun':
        if (this.t >= this.hitT) this.go(this.state === 'blockstun' && (this.inp.b || this.back) ? (this.inp.d ? 'cblock' : 'block') : 'idle');
        break;
      case 'frozen':
        if (this.t >= this.hitT) { this.go('idle'); M.fxIceBreak(this); }
        break;
      case 'airhit': break;
      case 'down':
        if (this.hp <= 0 && !this.toDizzy && this.M.mode !== 'practice') break;
        if (this.t >= 34) { this.go('getup'); this.invuln = 22; }
        break;
      case 'getup': if (this.t >= 20) { this.go('idle'); this.juggle = 0; this.noJuggle = false; } break;
      case 'throw': this.runThrow(); break;
      default: break; // grabbed / dizzy / ko / win / intro / script: run by the match
    }
    this.physics();
  }

  runMove() {
    const m = this.move, M = this.M;
    if (!m) { this.go('idle'); return; }
    this.mt++;
    const t = this.mt;
    if (m.onFrame) m.onFrame(this, t, M);
    if (this.state !== 'attack' || this.move !== m) return; // onFrame changed things
    if (m.jump && t === m.jump.at) { this.vy = m.jump.vy; this.vx = (m.jump.vx || 0) * this.f; this.y = 0.001; }
    if (m.vx !== undefined && !m.jump) {
      const v = typeof m.vx === 'function' ? m.vx(t, this) : (t >= m.start && t < m.start + m.active ? m.vx : 0);
      this.vx = v * this.f;
    }
    if (m.proj) for (const pj of m.proj) if (t === pj.at) M.spawn(pj.make(this, M));
    if (m.teleport && t === m.teleport.at) {
      const o = this.opp; const nx = o.x + o.f * -0 + (o.x > this.x ? 0.75 : -0.75) * this.sc;
      this.x = Math.max(-STAGE_W + this.w, Math.min(STAGE_W - this.w, nx));
      this.f = Math.sign(o.x - this.x) || this.f; this.y = 0; this.vy = 0;
      M.fxPoof(this);
    }
    if (m.multi && t >= m.start && (t - m.start) % m.multi === 0) this.hitDone.clear();
    // chains and special cancels once the move has touched the opponent
    if (this.connected && t >= m.start) {
      if (m.cancel && this.pressed('s')) {
        this.consume('s');
        const id = this.inp.d ? 'dsp' : this.fwd ? 'fsp' : 'sp';
        if (this.moves[id] && !this.moves[id].air) { this.startMove(id); return; }
      }
      if (m.chain) {
        if (m.chain.p && this.pressed('p')) { this.consume('p'); this.startMove(m.chain.p); return; }
        if (m.chain.k && this.pressed('k')) { this.consume('k'); this.startMove(m.chain.k); return; }
      }
    }
    const total = m.start + m.active + m.rec;
    if (m.air || m.airEnd) {
      if (this.grounded && t > 2 && (m.air || t > (m.jump ? m.jump.at + 2 : 2))) {
        if (m.landShock) M.spawn(m.landShock(this, M));
        if (m.onLand) m.onLand(this, M);
        this.move = null; this.go('land'); this.vx = 0; M.sfx('land', this); M.bear(this).jolt(-3);
        return;
      }
      if (m.air && t >= total) { this.move = null; this.go('air'); this.airAtk = true; }
      return;
    }
    if (t >= total) { this.move = null; this.go(this.inp.d ? 'crouch' : 'idle'); }
  }

  // bear hug and toss (and command grabs)
  runThrow() {
    const o = this.grabbing, g = this.grabKind, M = this.M;
    if (!o) { this.go('idle'); return; }
    const t = this.t;
    const hold = 0.42 * (this.sc + o.sc) * 0.5 + 0.12;
    o.x = this.x + this.f * hold; o.y = g === 'crush' ? Math.min(0.5, t * 0.05) * this.sc : 0.05; o.vx = 0; o.vy = 0;
    if (t === 10 || t === 18 || t === 26) { M.bear(o).squish(M.worldPt(o, 0.45), 0.8, this.f); M.sfx('squeeze', o); M.shake(0.05); }
    if (t === 34) {
      const dmg = this.grabDmg * this.power / o.defense;
      o.grabbedBy = null; this.grabbing = null;
      if (g === 'crush') { // slam down in front
        o.y = 0.3; o.vx = this.f * 3; o.vy = -2; o.f = -this.f;
      } else { // toss over the shoulder
        o.vx = -this.f * 5.2; o.vy = 8; o.x = this.x - this.f * 0.15; o.f = this.f;
      }
      M.landHit(this, o, { dmg, kd: true, lift: o.vy, kb: Math.abs(o.vx), hs: 30, throwHit: true, word: g === 'crush' ? 'CRUSH' : 'TOSS' }, M.worldPt(o, 0.5), false);
      o.vx = g === 'crush' ? this.f * 2.6 : -this.f * 5.2; o.vy = g === 'crush' ? 3 : 8;
    }
    if (t >= 52) this.go('idle');
  }

  physics() {
    const M = this.M;
    if (['grabbed', 'script'].includes(this.state)) return;
    const air = this.y > 0 || this.vy > 0;
    if (air) {
      const grav = this.state === 'airhit' ? GRAV * (1 + this.juggle * 0.12) : GRAV;
      this.vy -= grav * DT * (this.move && this.move.float && this.mt < this.move.float ? 0.25 : 1);
      this.y += this.vy * DT;
      this.x += this.vx * DT;
      if (this.y <= 0) {
        this.y = 0; const impact = this.vy; this.vy = 0;
        if (this.state === 'air') { this.go('land'); this.vx = 0; M.sfx('land', this); M.bear(this).jolt(-3); }
        else if (this.state === 'airhit') {
          if (impact < -6 && !this.bounced) { this.bounced = true; this.vy = 3.2; this.y = 0.001; M.fxLand(this, 1); M.sfx('thud', this); M.sfx('boing', this); M.bear(this).jolt(-9); }
          else { this.bounced = false; this.go(this.kdPending === false && this.hp > 0 ? 'idle' : 'down'); this.vx = 0; M.fxLand(this, 0.6); M.sfx('land', this); M.sfx('wobble', this); M.bear(this).jolt(-7); if (this.state === 'down' && this.hp <= 0) M.onDowned(this); }
        } else if (this.state === 'attack' && this.move && !this.move.air && !this.move.airEnd) { /* grounded move that briefly hopped */ }
      }
    } else {
      if (['hit', 'blockstun', 'stun', 'down', 'land', 'frozen'].includes(this.state) || (this.state === 'attack' && this.move && this.move.vx === undefined)) this.vx *= 0.82;
      if (this.state === 'attack' && this.move && this.move.vx !== undefined && !this.move.jump) { /* velocity set by move */ }
      this.x += this.vx * DT;
    }
    // walls
    const lim = STAGE_W - this.w;
    if (this.x < -lim) { this.x = -lim; if (this.state === 'hit' || this.state === 'blockstun') this.wallPush = true; }
    if (this.x > lim) { this.x = lim; if (this.state === 'hit' || this.state === 'blockstun') this.wallPush = true; }
  }

  hurtbox() {
    const s = this.sc, w = this.w;
    if (this.out || this.outPending) return null;
    if (this.invuln > 0 || this.state === 'down' || this.state === 'getup' || this.state === 'grabbed' || this.alpha < 0.3) return null;
    if (this.state === 'airhit' && this.noJuggle) return null;
    if (this.move && this.move.invuln && this.mt >= this.move.invuln[0] && this.mt <= this.move.invuln[1]) return null;
    let h = 0.95 * s, y0 = 0;
    if (this.state === 'crouch' || this.state === 'cblock' || (this.move && this.move.low)) h = 0.58 * s;
    if (this.state === 'airhit') { y0 = 0.1 * s; h = 0.75 * s; }
    if (this.y > 0.001 && this.state !== 'airhit') { y0 = 0.05 * s; h = 0.85 * s; }
    return [this.x - w, this.x + w, this.y + y0, this.y + h];
  }

  attackBox() {
    const m = this.move;
    if (!m || !m.box || this.state !== 'attack') return null;
    if (this.mt < m.start || this.mt >= m.start + m.active) return null;
    const s = this.sc * (this.def.reachK || 1), b = m.box;
    const x0 = this.f > 0 ? this.x + b[0] * s : this.x - b[1] * s;
    const x1 = this.f > 0 ? this.x + b[1] * s : this.x - b[0] * s;
    return [x0, x1, this.y + b[2] * s, this.y + b[3] * s];
  }

  // the pose to draw this frame
  pose(time) {
    const st = this.state, t = this.t;
    if (this.scriptPose) return this.scriptPose;
    switch (st) {
      case 'idle': case 'intro': {
        const p = P(this.def.stance);
        const ph = time * 4.2 + this.side * 1.3;
        p.sq = 1 + Math.sin(ph) * 0.035; p.y = 0; p.lean += Math.sin(ph) * 0.03;
        p.aN = [p.aN[0], p.aN[1] + Math.sin(ph + 0.6) * 0.08, p.aN[2]];
        p.aF = [p.aF[0], p.aF[1] + Math.sin(ph + 1.1) * 0.08, p.aF[2]];
        return p;
      }
      case 'walk': {
        const p = P(this.def.stance);
        const ph = this.t * 0.32 * this.speed;
        p.y = Math.abs(Math.sin(ph)) * 0.04; p.roll = Math.sin(ph) * 0.12; p.sq = 1 + Math.cos(ph * 2) * 0.04;
        p.lean += (this.walkDir || 1) * 0.08;
        p.lN = [0.3, -1, 0.14 + Math.sin(ph) * 0.55]; p.lF = [0.25, -1, -0.14 - Math.sin(ph) * 0.55];
        return p;
      }
      case 'crouch': return t < 4 ? mix(POSES.stance, POSES.crouch, t / 4) : POSES.crouch;
      case 'block': return POSES.block;
      case 'cblock': return POSES.crouchBlock;
      case 'jumpsquat': return mix(POSES.stance, P({ sq: 0.72, lean: 0.2 }), Math.min(1, t / 3));
      case 'land': return mix(P({ sq: 0.72, lean: 0.2 }), POSES.stance, Math.min(1, t / 5));
      case 'air': {
        const u = Math.max(0, Math.min(1, 1 - this.vy / 9));
        const p = mix(POSES.jump, POSES.tuck, Math.min(1, u * 1.6));
        if (this.vx !== 0) p.lean += 0.15;
        return p;
      }
      case 'attack': return this.move && this.move.pose ? this.move.pose(this.mt, this) : POSES.stance;
      case 'hit': case 'blockstun': {
        const base = st === 'blockstun' ? (this.inp.d ? POSES.crouchBlock : POSES.block) : this.hitLvl === 'low' ? POSES.hurtLow : POSES.hurtHigh;
        const u = Math.min(1, t / 3), back = Math.max(0, 1 - (t - this.hitT * 0.6) / (this.hitT * 0.4));
        return mix(POSES.stance, base, u * Math.min(1, back));
      }
      case 'stun': {
        const p = P({ sq: 0.8 + Math.sin(t * 0.5) * 0.06, lean: 0.2, aN: [0.3, 0.6, 0.8], aF: [0.3, 0.7, 0.8], aNs: 0.8, aFs: 0.8, eyeS: 0.12, brow: -0.6, head: [0.2, 0, Math.sin(t * 0.4) * 0.2] });
        return p;
      }
      case 'frozen': return this.frozenPose || POSES.hurtHigh;
      case 'airhit': {
        const p = P(POSES.airHit); p.lean = -0.9 - (this.ccw || 0); return p;
      }
      case 'down': return POSES.down;
      case 'getup': return mix(POSES.down, POSES.stance, Math.min(1, t / 16));
      case 'throw': {
        const hug = P({ aN: [-0.25, 0.1, 1], aNs: 1.4, aF: [-0.25, 0.15, 1], aFs: 1.4, lean: -0.1, turn: 0.3, sq: 1 + Math.sin(t * 0.8) * 0.05, brow: 0.5 });
        if (t < 34) return hug;
        return mix(P({ lean: -0.6, twist: -0.8, aN: [0.6, 1, -0.4], aF: [0.6, 1, -0.4], aNs: 1.5, aFs: 1.5, turn: 0.4 }), POSES.stance, Math.min(1, (t - 34) / 18));
      }
      case 'grabbed': return P({ sq: 0.85 + Math.sin(t * 0.8) * 0.06, aN: [0.9, 0.5, 0], aF: [0.9, 0.6, 0], eyeS: 0.15, lean: -0.1, lN: [0.3, -0.6, 0.5], lF: [0.3, -0.7, 0.3] });
      case 'dizzy': {
        const p = P(POSES.dizzy); p.roll = Math.sin(time * 2.4) * 0.22; p.lean = -0.05 + Math.sin(time * 1.7) * 0.12; p.head = [-0.1, Math.sin(time * 3) * 0.3, Math.sin(time * 2.4) * 0.25]; return p;
      }
      case 'ko': return POSES.down;
      case 'win': {
        const w = this.def.winPose || 'win';
        const p = P(POSES[w]); const ph = time * 5;
        if (w === 'win') { p.y = Math.abs(Math.sin(ph)) * 0.18; p.sq = 1.05 + Math.sin(ph * 2) * 0.08; }
        else { p.sq = 1 + Math.sin(ph) * 0.04; }
        return p;
      }
      default: return POSES.stance;
    }
  }
}
