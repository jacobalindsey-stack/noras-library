// NUBBINS — a match: two bears, rounds, hits, projectiles, the camera,
// NUB 'EM time and the finishers.
import * as THREE from '../lib/three.module.min.js';
import { Fighter, DT, STAGE_W, MAX_SEP } from './fighter.js';
import { GummyBear } from './gummy.js';
import { dress } from './dress.js';
import { resolve, P, POSES, mix } from './anim.js';
import { CPU } from './ai.js';
import { makeShadow, makeProjectileMesh, makeIceBlock, makeDizzyStars, CONFETTI } from './fx.js';
import { FINISHERS } from './finishers.js';
import { sfx, say, playMusic, jingle } from './audio.js';
import { encodeInput, decodeInput, simHash, snapshot, restore } from './net.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

const bearCache = new Map();
export function getBear(def, slot) {
  const k = def.key + ':' + slot;
  if (!bearCache.has(k)) { const b = new GummyBear(def); dress(b, def.dress); b.group.scale.setScalar(def.scale || 1); bearCache.set(k, b); }
  const b = bearCache.get(k);
  b.wob = 0; b.dent = 0; b.flash = 0; b.group.visible = true; b.body.visible = true; b.group.position.set(0, 0, 0); b.group.rotation.set(0, 0, 0);
  b.group.scale.setScalar(def.scale || 1); b.mesh.visible = true;
  for (const k2 in b.springs) Object.assign(b.springs[k2], { x: 0, v: 0, y: 0, vy: 0 });
  return b;
}

export class Match {
  constructor(game, cfg) {
    this.G = game; this.cfg = cfg;
    this.scene = game.world;
    this.mode = cfg.mode;
    this.toWin = 2;
    this.frame = 0; this.time = 0; this.acc = 0;
    this.hitstop = 0; this.slow = 0; this.slowK = 1; this.shakeAmt = 0;
    this.projectiles = [];
    this.wins = [0, 0]; this.round = 1;
    this.phase = 'intro'; this.pt = 0;
    const defs = [cfg.p1def, cfg.p2def];
    this.fighters = defs.map((d, i) => new Fighter(d, i, this));
    if (cfg.bossHp && defs[1].boss) { this.fighters[1].maxhp = Math.round(this.fighters[1].maxhp * cfg.bossHp); this.fighters[1].hp = this.fighters[1].maxhp; }
    this.bears = defs.map((d, i) => getBear(d, i));
    // mirror match: player 2 gets a darker, deeper batch of the same flavor
    if (defs[0].key === defs[1].key) {
      const m = this.bears[1].mat; this.mirrorSave = { c: m.color.clone(), d: m.attenuationDistance };
      m.color.multiplyScalar(0.72); m.attenuationDistance *= 0.45;
    }
    this.root = new THREE.Group(); this.scene.add(this.root);
    this.vis = this.fighters.map((F, i) => {
      const b = this.bears[i];
      this.root.add(b.group);
      const sh = makeShadow(F.def.flavor.glow); this.root.add(sh);
      const ice = makeIceBlock(); this.root.add(ice);
      const stars = makeDizzyStars(); this.root.add(stars);
      return { b, sh, ice, stars, lastVx: 0, turn: 1 };
    });
    this.cpus = [0, 1].map(i => (cfg.humans[i] ? null : new CPU(this.fighters[i], cfg.level, defs[i].boss && cfg.mode === 'arcade')));
    this.cam = { x: 0, y: 0.8, z: 5, lx: 0, ly: 0.6, fov: 30, override: null };
    // online: both players' buttons come through the lockstep (see net.js)
    this.net = cfg.net || null;
    if (this.net) { this.netCpu = cfg.netBot ? new CPU(this.fighters[this.net.local], 2, false) : null; this.stallT = 0; }
    this.roundStart();
    if (this.G.stage && this.G.stage.name) setTimeout(() => this.G.ui.finisherName(this.G.stage.name), 150);
    playMusic(cfg.music || 'fight1');
  }

  bear(F) { return this.bears[F.side]; }
  slowAt(x) { const s = this.G.stage; return s && s.slowAt ? s.slowAt(x) : 1; }
  onDowned() {}
  worldPt(F, h = 0.5) { return V(F.x, F.y + h * F.sc, 0.1); }
  sfx(n, F) { sfx(n); }
  shake(a) { this.shakeAmt = Math.max(this.shakeAmt, a); }

  roundStart() {
    const [a, b] = this.fighters;
    a.reset(-1.55, 1); b.reset(1.55 * (b.sc > 1.3 ? 1.12 : 1), -1);
    a.hp = a.maxhp; b.hp = b.maxhp;
    for (const p of this.projectiles) this.root.remove(p.mesh);
    this.projectiles = [];
    for (const F of this.fighters) { F.state = 'intro'; F.toDizzy = false; F.scriptPose = null; F.roundDmg = 0; }
    this.phase = this.mode === 'practice' ? 'fight' : 'intro'; this.pt = 0;
    this.timer = 60; this.timerAcc = 0;
    this.winner = null; this.loser = null; this.finisher = null;
    this.G.fx.clear();
    this.cam.override = null;
    this.G.ui.hud(this, true);
    if (this.mode === 'practice') { for (const F of this.fighters) F.state = 'idle'; this.G.ui.announce('PRACTICE', 'small', 1.4); }
  }

  // ------------------------------------------------------------ main step
  update(dt) {
    if (this.net) { this.netUpdate(dt); return; }
    if (this.paused) { this.syncVisuals(0); return; }
    this.time += dt;
    const k = this.slow > 0 ? this.slowK : 1;
    if (this.slow > 0) this.slow -= dt;
    this.acc += dt * k;
    let steps = 0;
    while (this.acc >= DT && steps < 4) { this.acc -= DT; this.step(); steps++; }
    if (steps === 4) this.acc = 0;
    this.syncVisuals(dt * k);
    this.updateCamera(dt);
    this.G.ui.hud(this);
  }

  // ---------------------------------------------------------- online
  netLocal() {
    const me = this.fighters[this.net.local];
    if (this.netCpu) return encodeInput(this.phase === 'nubem' && this.winner === me ? this.cpuNubInput(me) : this.netCpu.think(this));
    return encodeInput(this.G.input.read(0, false));
  }
  netUpdate(dt) {
    const N = this.net, L = N.ls;
    this.time += dt;
    const k = this.slow > 0 ? this.slowK : 1;
    if (this.slow > 0) this.slow -= dt;
    if (!N.go && L.peerLoaded && N.loaded) N.go = true;
    let steps = 0, blocked = false;
    if (N.go) {
      this.acc += dt * k;
      if (L.fixAt && this.frame > L.fixAt) { L.fixAt = 0; L.fixSnap = null; }
      while (this.acc >= DT && steps < 8) {
        const f = this.frame + 1;
        while (L.mine < f + L.D) L.addMine(L.mine + 1, this.netLocal());
        if (N.role === 'guest' && L.fixAt && f === L.fixAt + 1) {
          if (!L.fixSnap) { blocked = true; break; }
          restore(this, L.fixSnap); L.fixedAt = L.fixAt; L.fixAt = 0; L.fixSnap = null; L.desyncs++;
        }
        if (!L.ready(f)) { blocked = true; break; }
        this.acc -= DT; this.step(); steps++;
        this.netAfterStep();
      }
      if (blocked) this.acc = Math.min(this.acc, DT * 2);
    }
    this.stallT = (blocked || !N.go) && !steps ? this.stallT + dt : 0;
    L.flush(false);
    this.syncVisuals(dt * k);
    this.updateCamera(dt);
    this.G.ui.hud(this);
  }
  netAfterStep() {
    const N = this.net, L = N.ls, f = this.frame;
    if (f % 30 === 0) { const h = simHash(this); L.hash.set(f, h); L.link.send({ t: 'h', m: L.mid, f, h }); }
    if (L.peerHash.size) for (const [hf, ph] of L.peerHash) {
      const mh = L.hash.get(hf); if (mh === undefined) continue;
      L.peerHash.delete(hf);
      if (mh !== ph && hf > (L.fixedAt || 0) && N.role === 'host' && !L.fixAt) {
        L.fixAt = f + L.D + 2; L.link.send({ t: 'fixAt', m: L.mid, f: L.fixAt });
      }
    }
    if (N.role === 'host' && L.fixAt && f === L.fixAt) { L.link.send({ t: 'fix', m: L.mid, f, s: snapshot(this) }); L.fixedAt = f; L.fixAt = 0; L.desyncs++; }
    L.prune(f);
  }

  readInputs() {
    if (this.net) {
      const L = this.net.ls, none = { l: 0, r: 0, u: 0, d: 0, p: 0, k: 0, s: 0, b: 0, x: 0 };
      this.fighters.forEach((F, i) => {
        let inp = decodeInput(L.get(this.frame, i));
        if (this.phase !== 'fight' && this.phase !== 'nubem') inp = none;
        if (this.phase === 'nubem' && F === this.loser) inp = none;
        F.setInput(inp);
      });
      return;
    }
    const I = this.G.input, duo = this.cfg.humans[0] && this.cfg.humans[1];
    this.fighters.forEach((F, i) => {
      let inp;
      if (this.cpus[i]) inp = this.cpus[i].think(this);
      else inp = I.read(i, duo);
      if (this.mode === 'practice' && i === 1 && this.cfg.dummy !== 'cpu') inp = this.dummyInput(F);
      if (this.phase !== 'fight' && this.phase !== 'nubem') inp = { l: 0, r: 0, u: 0, d: 0, p: 0, k: 0, s: 0, b: 0, x: 0 };
      if (this.phase === 'nubem' && F === this.loser) inp = { l: 0, r: 0, u: 0, d: 0, p: 0, k: 0, s: 0, b: 0, x: 0 };
      if (this.phase === 'nubem' && F === this.winner && this.cpus[i]) inp = this.cpuNubInput(F);
      F.setInput(inp);
    });
  }
  dummyInput(F) { const o = { l: 0, r: 0, u: 0, d: 0, p: 0, k: 0, s: 0, b: 0, x: 0 }; if (this.cfg.dummy === 'block') { o.b = 1; } if (this.cfg.dummy === 'crouch') o.d = 1; if (this.cfg.dummy === 'jump') o.u = 1; return o; }

  step() {
    this.frame++;
    this.pt += DT;
    this.readInputs();
    this.phaseLogic();
    if (this.hitstop > 0) { this.hitstop--; return; }
    if (this.finisher) { this.finisher.step(); return; }
    if (this.rush) { this.rushStep(); return; }
    const [a, b] = this.fighters;
    for (const F of this.fighters) if (F.state !== 'dizzy' && F.state !== 'script') F.step();
    // arena weather: the birthday wish blows everybody sideways (worked out on the fight's own clock)
    if (this.G.stage && this.G.stage.simStep) this.G.stage.simStep(this);
    const wind = (this.G.stage && this.G.stage.wind) || 0;
    if (wind && this.phase === 'fight') for (const F of this.fighters) {
      if (['grabbed', 'script', 'throw', 'dizzy', 'ko'].includes(F.state)) continue;
      F.x += wind * DT * (F.grounded ? 1 : 0.6) / Math.max(1, F.sc * 0.8);
      const lim = STAGE_W - F.w; F.x = clamp(F.x, -lim, lim);
    }
    if (wind) for (const p of this.projectiles) if (!p.grounded) p.vx += wind * DT * 0.6;
    this.pushApart(a, b);
    this.collide(a, b); this.collide(b, a);
    this.stepProjectiles();
    // face each other
    for (const F of this.fighters) {
      if (F.grounded && (F.neutral || F.state === 'intro' || F.state === 'dizzy')) { const s = Math.sign(F.opp.x - F.x); if (s && Math.abs(F.opp.x - F.x) > 0.05) F.f = s; }
    }
    // practice: refill
    if (this.mode === 'practice') for (const F of this.fighters) { if (this.frame - (F.lastHitFrame || 0) > 90 && F.hp < F.maxhp) F.hp = Math.min(F.maxhp, F.hp + 1.5); }
    for (const F of this.fighters) {
      if (F.toDizzy && F.grounded && (F.neutral || F.state === 'idle')) { F.toDizzy = false; F.go('dizzy'); F.vx = 0; this.startNubEm(); }
    }
  }

  pushApart(a, b) {
    if (a.state === 'grabbed' || b.state === 'grabbed') return;
    if ((a.move && a.move.passThrough && a.state === 'attack') || (b.move && b.move.passThrough && b.state === 'attack')) return;
    const minD = a.w + b.w;
    const dx = b.x - a.x;
    const over = Math.abs(a.y - b.y) < 0.8 * Math.min(a.sc, b.sc);
    if (over && Math.abs(dx) < minD) {
      const push = (minD - Math.abs(dx)) / 2 * (Math.sign(dx) || (a.side ? -1 : 1));
      a.x -= push; b.x += push;
      const lim = STAGE_W;
      if (a.x - a.w < -lim) { const s = -lim - (a.x - a.w); a.x += s; b.x += s; }
      if (b.x + b.w > lim) { const s = b.x + b.w - lim; a.x -= s; b.x -= s; }
      if (b.x - b.w < -lim) { const s = -lim - (b.x - b.w); a.x += s; b.x += s; }
      if (a.x + a.w > lim) { const s = a.x + a.w - lim; a.x -= s; b.x -= s; }
    }
    // camera wall
    const sep = b.x - a.x;
    if (Math.abs(sep) > MAX_SEP) {
      const over2 = Math.abs(sep) - MAX_SEP, s = Math.sign(sep);
      const am = Math.abs(a.vx) > Math.abs(b.vx);
      if (am) a.x += over2 * s; else b.x -= over2 * s;
    }
  }

  collide(A, D) {
    const ab = A.attackBox(); if (!ab) return;
    if (A.hitDone.has(D.side)) return;
    const hb = D.hurtbox(); if (!hb) return;
    if (ab[1] < hb[0] || ab[0] > hb[1] || ab[3] < hb[2] || ab[2] > hb[3]) return;
    if (A.move.grab && (!D.grounded || D.state === 'hit' || D.state === 'airhit' || D.state === 'blockstun')) return;
    A.hitDone.add(D.side);
    const pt = V((Math.max(ab[0], hb[0]) + Math.min(ab[1], hb[1])) / 2, (Math.max(ab[2], hb[2]) + Math.min(ab[3], hb[3])) / 2, 0.15);
    const m = A.move;
    const res = this.landHit(A, D, m, pt, false);
    if (m.onHit && res === 'hit') m.onHit(A, D, this);
    if (m.stopOnHit && res === 'block') { A.rocketStop = true; A.mt = Math.max(A.mt, m.start + m.active - 1); }
  }

  // ------------------------------------------------------------ the hit
  landHit(A, D, h, pt, isProj) {
    if (this.phase === 'nubem') { if (D === this.loser && A === this.winner) this.loserFalls(A, pt); return 'hit'; }
    if (this.phase !== 'fight') return 'none';
    const dir = Math.sign(D.x - A.x) || A.f;
    const blockable = !h.unblockable && h.lvl !== 'throw' && !h.throwHit;
    const autoBlock = D.grounded && D.neutral && D.state !== 'land' && D.back && !D.inp.u;
    if (blockable && (D.state === 'block' || D.state === 'cblock' || D.state === 'blockstun' || autoBlock)) {
      const crouching = D.state === 'cblock' || D.inp.d;
      D.go('blockstun'); D.hitT = h.bs || 10; D.vx = dir * (h.kb || 2) * 0.85; D.f = -dir;
      const chip = (isProj || ['sp', 'fsp', 'dsp', 'rush'].includes(A.move && A.move.id)) ? (h.dmg || 0) * 0.12 : 0;
      D.hp = Math.max(1, D.hp - chip);
      A.meter = Math.min(100, A.meter + 2); D.meter = Math.min(100, D.meter + 3);
      if (!isProj && Math.abs(D.x) > STAGE_W - D.w - 0.05) A.vx = -dir * 2.4;
      A.connected = true;
      this.hitstop = 5;
      this.G.fx.hit(pt, '#ffffff', 0.5, dir, true);
      this.bear(D).squish(pt, 0.35, dir);
      sfx('block');
      this.G.ui.comic('BLOCK', pt, '#bfe0ff', 0.8);
      D.lastHitFrame = this.frame;
      void crouching;
      return 'block';
    }
    if (h.grab && !isProj) {
      A.go('throw'); A.grabbing = D; A.grabKind = h.grab.kind; A.grabDmg = h.grab.dmg; A.move = null; A.vx = 0;
      D.go('grabbed'); D.grabbedBy = A; D.move = null; D.f = -A.f;
      this.hitstop = 6; sfx('squeeze'); this.G.ui.comic(h.word || 'HUG', pt, '#ffe08a', 1);
      return 'grab';
    }
    const comboing = ['hit', 'airhit', 'stun', 'frozen', 'grabbed'].includes(D.state);
    A.combo = comboing ? (A.combo || 0) + 1 : 1;
    const scale = Math.max(0.35, 1 - 0.12 * (A.combo - 1));
    const dmg = (h.dmg || 0) * A.power / D.defense * scale;
    const wasFrozen = D.state === 'frozen';
    const prePose = h.freeze ? D.pose(this.time) : null;
    D.hp = Math.max(0, D.hp - dmg); D.roundDmg = (D.roundDmg || 0) + dmg;
    D.lastHitFrame = this.frame;
    A.meter = Math.min(100, A.meter + dmg * 1.6); D.meter = Math.min(100, D.meter + dmg * 1.1);
    A.connected = true;
    D.move = null; if (D.grabbing) { D.grabbing.go('airhit'); D.grabbing = null; }
    if (wasFrozen) this.fxIceBreak(D);
    if (h.freeze && D.hp > 0 && D.grounded) {
      D.frozenPose = prePose; D.go('frozen'); D.hitT = h.freeze; D.vx = dir * 0.6; sfx('freeze');
    } else if (h.stun && D.hp > 0 && D.grounded) {
      D.go('stun'); D.hitT = h.stun; D.vx = dir * 0.5;
      this.G.fx.glowPuff(this.worldPt(D, 0.7), '#b0ff40', 10, 0.35, 0.8, 0.6);
    } else if (!D.grounded || h.lift || h.kd) {
      D.go('airhit'); D.vy = Math.max(h.lift || 4.5, 3); D.y = Math.max(D.y, 0.002); D.vx = dir * (h.kb || 2); D.juggle++; D.f = -dir;
      if (D.juggle > 4) D.noJuggle = true;
      D.kdPending = !!(h.kd || h.lift > 5 || !D.grounded || D.juggle > 1);
      D.ccw = 0; D.bounced = false;
    } else {
      D.go('hit'); D.hitT = h.hs || 14; D.vx = dir * (h.kb || 2); D.hitLvl = h.lvl === 'low' ? 'low' : 'high'; D.f = -dir;
    }
    const power = clamp(dmg / 7, 0.45, 2.2);
    this.hitstop = Math.round(4 + power * 4);
    const b = this.bear(D);
    b.squish(pt, power * 0.9, dir); b.flash = 0.3;
    this.G.fx.hit(pt, D.def.flavor.glow, power, dir);
    sfx('hit', power);
    this.shake(0.03 + power * 0.05);
    if (h.word) this.G.ui.comic(h.word, pt, D.def.ui, 0.8 + power * 0.25);
    if (A.combo >= 2) this.G.ui.combo(A.side, A.combo);
    if (D.hp <= 0) this.onKO(A, D);
    return 'hit';
  }

  onKO(A, D) {
    if (this.mode === 'practice') { D.hp = D.maxhp; return; }
    const deciding = this.wins[A.side] + 1 >= this.toWin;
    this.slow = 1.1; this.slowK = 0.25;
    this.hitstop = 14; this.shake(0.25);
    sfx('ko');
    this.winner = A; this.loser = D;
    this.G.fx.burst(this.worldPt(D, 0.5), '#ffffff', 40, 5, 0.14, 0.9);
    for (const c of CONFETTI) this.G.fx.burst(this.worldPt(D, 0.5), c, 6, 4, 0.1, 1);
    if (deciding) {
      this.phase = 'koDizzy'; this.pt = 0;
      D.toDizzy = true;
      if (D.state === 'airhit') { D.kdPending = true; }
      else { D.go('hit'); D.hitT = 26; }
    } else {
      this.phase = 'ko'; this.pt = 0;
      if (D.state !== 'airhit') { D.go('airhit'); D.vy = 6.5; D.y = 0.002; D.vx = Math.sign(D.x - A.x) * 3; }
      D.kdPending = true;
      this.G.ui.announce('K.O.!', 'ko', 1.6);
      say('K. O.');
    }
  }

  phaseLogic() {
    const P1 = this.fighters[0], P2 = this.fighters[1];
    switch (this.phase) {
      case 'intro':
        if (this.frame % 1 === 0 && this.pt > 0 && Math.abs(this.pt - 0.35) < DT / 2) { this.G.ui.announce('ROUND ' + this.round, 'round', 1.4); say('Round ' + ['one', 'two', 'three', 'four', 'five'][this.round - 1]); sfx('gong'); }
        if (Math.abs(this.pt - 1.9) < DT / 2) { this.G.ui.announce('SQUISH!', 'go', 0.9); say('Squish!'); sfx('boing'); }
        if (this.pt > 2.35) { this.phase = 'fight'; for (const F of this.fighters) if (F.state === 'intro') F.go('idle'); }
        break;
      case 'fight':
        if (this.mode !== 'practice' && !this.rush) {
          this.timerAcc += DT;
          if (this.timerAcc >= 1) { this.timerAcc -= 1; this.timer--; if (this.timer <= 0) this.timeUp(); }
        }
        break;
      case 'ko': {
        const D = this.loser;
        if (D.grounded && D.state !== 'down' && D.state !== 'airhit' && D.state !== 'ko') { D.go('down'); D.vx = 0; }
        if ((D.state === 'down' || D.state === 'getup') && this.pt > 1.4 && !this.roundOver) {
          this.roundOver = true; this.wins[this.winner.side]++;
          this.winner.go('win'); this.winner.vx = 0;
          D.go('down'); D.state = 'ko';
          const perfect = (this.winner.roundDmg || 0) < 0.01;
          this.G.ui.announce(this.winner.def.name + ' WINS', 'name', 2.0);
          if (perfect) setTimeout(() => this.G.ui.announce('NOT A SCRATCH!', 'small', 1.6), 900);
          say(this.winner.def.name.toLowerCase() + ' wins');
          this.pt = 0; this.phase = 'roundEnd';
        }
        break;
      }
      case 'time': if (this.pt > 2.4) this.nextRound(); break;
      case 'roundEnd': if (this.pt > 2.6) this.nextRound(); break;
      case 'koDizzy': if (this.pt > 6) { this.loser.toDizzy = false; this.loser.go('dizzy'); this.startNubEm(); } break;
      case 'nubem': {
        const W = this.winner;
        // the finisher: down + special
        if (W.state !== 'attack' && W.pressed('s') && W.inp.d) { W.consume('s'); this.startFinisher(); break; }
        if (this.pt > 7.5) this.loserFalls(null, null);
        break;
      }
      case 'fall':
        if (this.pt > 1.2 && !this.fallDone) { this.fallDone = true; this.endMatch(false); }
        break;
      case 'matchEnd':
        if (this.pt > 4.2 && !this.ended) { this.ended = true; this.cfg.onEnd && this.cfg.onEnd(this.result); }
        break;
      default: break;
    }
  }

  cpuNubInput(W) {
    const o = { l: 0, r: 0, u: 0, d: 0, p: 0, k: 0, s: 0, b: 0, x: 0 };
    if (this.cpuFinish === undefined) this.cpuFinish = Math.random() < [0.45, 0.7, 0.9][this.cfg.level || 0];
    if (this.pt < 1.4 || !W.neutral) return o;
    if (this.cpuFinish) { o.d = 1; if (this.frame % 16 < 2) o.s = 1; return o; }
    const d = Math.abs(this.loser.x - W.x);
    if (d > 0.95 * (W.sc + this.loser.sc) * 0.5 + 0.3) o[W.f > 0 ? 'r' : 'l'] = 1; else if (this.frame % 16 < 2) o.k = 1;
    return o;
  }

  timeUp() {
    const [a, b] = this.fighters;
    this.G.ui.announce('TIME!', 'ko', 1.2); say('Time!');
    const ra = a.hp / a.maxhp, rb = b.hp / b.maxhp;
    if (Math.abs(ra - rb) < 0.005) { this.phase = 'time'; this.pt = 0; this.G.ui.announce('DRAW', 'name', 1.6); return; }
    const W = ra > rb ? a : b, L = W.opp;
    this.winner = W; this.loser = L;
    if (this.wins[W.side] + 1 >= this.toWin) { this.phase = 'koDizzy'; this.pt = 4.5; L.go('hit'); L.hitT = 20; L.toDizzy = true; return; }
    this.wins[W.side]++; W.go('win'); L.go('hit'); L.hitT = 40;
    setTimeout(() => this.G.ui.announce(W.def.name + ' WINS', 'name', 1.8), 700);
    this.phase = 'time'; this.pt = 0;
  }

  nextRound() {
    this.round++; this.roundOver = false;
    if (this.round > 5) { this.endMatch(false); return; }
    this.roundStart();
  }

  startNubEm() {
    if (this.phase === 'nubem') return;
    this.phase = 'nubem'; this.pt = 0;
    this.G.ui.announce("NUB 'EM!", 'nub', 2.4);
    say("Nub 'em!", { pitch: 0.2, rate: 0.75 });
    playMusic('finish');
    const W = this.winner;
    if (W.state !== 'attack') W.go('idle');
    if (!this.cpus[W.side]) this.G.ui.hint(W.side, true);
  }

  loserFalls(A, pt) {
    if (this.phase !== 'nubem') return;
    const L = this.loser;
    this.G.ui.hint(0, false); this.G.ui.hint(1, false);
    L.go('airhit'); L.vy = 6; L.y = 0.002; L.vx = (A ? Math.sign(L.x - A.x) : -L.f) * 2.5; L.kdPending = true;
    if (pt) { this.G.fx.hit(pt, L.def.flavor.glow, 1.4, Math.sign(L.vx)); this.bear(L).squish(pt, 1.2, 1); sfx('hit', 1.4); }
    else sfx('ko');
    this.phase = 'fall'; this.pt = 0; this.fallDone = false;
  }

  startFinisher() {
    const W = this.winner, L = this.loser;
    this.G.ui.hint(0, false); this.G.ui.hint(1, false);
    const f = FINISHERS[W.def.finisher.key];
    if (!f) { this.loserFalls(W, this.worldPt(L, 0.5)); return; }
    this.phase = 'finisher'; this.pt = 0;
    for (const p of this.projectiles) this.root.remove(p.mesh);
    this.projectiles = [];
    sfx('drumroll');
    this.finisher = f(this, W, L, () => { this.finisher = null; this.endMatch(true); });
  }

  endMatch(nubbed) {
    const W = this.winner || (this.wins[0] >= this.wins[1] ? this.fighters[0] : this.fighters[1]);
    if (this.phase !== 'finisher' || nubbed) {
      this.wins[W.side] = Math.max(this.wins[W.side], this.toWin);
    }
    this.phase = 'matchEnd'; this.pt = 0;
    W.scriptPose = null; W.go('win');
    if (this.loser && !nubbed) { this.loser.state = 'ko'; }
    this.cam.override = null;
    const perfect = (W.roundDmg || 0) < 0.01;
    this.result = { winner: W.side, nubbed, perfect, wins: this.wins.slice(), winnerKey: W.def.key, loserKey: W.opp.def.key };
    if (nubbed) { this.G.ui.announce('NUBBINATION!', 'nub', 2.2); say('Nubbination!', { pitch: 0.2, rate: 0.8 }); setTimeout(() => { this.G.ui.announce(W.def.name + ' WINS', 'name', 2.2); say(W.def.name.toLowerCase() + ' wins'); }, 2100); }
    else { this.G.ui.announce(W.def.name + ' WINS', 'name', 2.4); say(W.def.name.toLowerCase() + ' wins'); }
    if (perfect) setTimeout(() => this.G.ui.announce('NOT A SCRATCH!', 'small', 1.6), nubbed ? 3600 : 1200);
    sfx('cheer');
    const humanWon = !!this.cfg.humans[W.side];
    jingle(humanWon || (this.cfg.humans[0] && this.cfg.humans[1]) ? 'win' : 'lose');
    if (nubbed) this.pt = -1.6;
  }

  // --------------------------------------------------------- projectiles
  spawn(spec) {
    if (!spec) return;
    if (Array.isArray(spec)) { spec.forEach(s => this.spawn(s)); return; }
    const p = Object.assign({ age: 0, alive: true, lvl: 'mid' }, spec);
    p.mesh = makeProjectileMesh(p.type, p.owner);
    p.mesh.position.set(p.x, p.y, 0.05);
    if (p.type === 'pillar') p.mesh.scale.set(1, 0.01, 1);
    this.root.add(p.mesh);
    this.projectiles.push(p);
  }

  kill(p, pop = true) {
    p.alive = false; this.root.remove(p.mesh);
    if (pop) { const c = p.mesh.userData.trail || p.mesh.userData.cloud || '#ffffff'; this.G.fx.burst(V(p.x, p.y, 0.05), c, 10, 2, 0.08, 0.35); }
  }

  explode(p) {
    const fx = this.G.fx, pos = V(p.x, Math.max(0.1, p.y), 0.05);
    fx.burst(pos, '#ff3050', 30, 4, 0.12, 0.6); fx.burst(pos, '#ffffff', 16, 3, 0.1, 0.4); fx.glow(pos, '#ff4060', 2.2, 0.3); fx.ring(pos, '#ffb0c0', 1.2, 0.35);
    for (const c of CONFETTI) fx.burst(pos, c, 4, 3, 0.08, 0.8);
    fx.beadsAt(pos, '#ffc8d8', 10, 0, 1.2);
    sfx('pop'); sfx('hit', 1); this.shake(0.12);
    const D = p.owner.opp, hb = D.hurtbox();
    if (hb && !p.didHit) {
      const cx = clamp(p.x, hb[0], hb[1]), cy = clamp(p.y, hb[2], hb[3]);
      if ((cx - p.x) * (cx - p.x) + (cy - p.y) * (cy - p.y) < p.burst * p.burst) { p.didHit = true; this.landHit(p.owner, D, p, V(cx, cy, 0.15), true); }
    }
    this.kill(p, false);
  }

  stepProjectiles() {
    const fx = this.G.fx;
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      p.age++;
      const owner = p.owner, D = owner.opp;
      if (p.type === 'pillar') {
        const u = clamp((p.age - p.delay) / 5, 0, 1);
        p.mesh.scale.set(1, Math.max(0.01, u), 1); p.mesh.position.set(p.x, 0, 0);
        if (p.age === p.delay) { fx.dust(p.x, '#d8f0ff', 10, 2); fx.burst(V(p.x, 0.2, 0), '#d8f4ff', 16, 3, 0.09, 0.5); sfx('icecast'); this.shake(0.08); }
        if (p.age >= p.delay && p.age < p.delay + 8 && !p.didHit) {
          const hb = D.hurtbox();
          if (hb && hb[1] > p.x - p.r && hb[0] < p.x + p.r && hb[2] < p.h) { p.didHit = true; this.landHit(owner, D, p, V(p.x, Math.min(hb[3], 0.6), 0.15), true); }
        }
        if (p.age > p.life) { this.kill(p, true); fx.burst(V(p.x, 0.5, 0), '#e0f6ff', 20, 2.5, 0.09, 0.5); }
        continue;
      }
      if (p.type === 'quake') {
        if (!p.didHit && D.grounded && D.hurtbox() && Math.abs(D.x - p.x) < p.r) { p.didHit = true; this.landHit(owner, D, p, this.worldPt(D, 0.15), true); }
        if (p.age === 1) fx.dust(p.x, this.G.stage.dust, 16, 3);
        if (p.age > p.life) this.kill(p, false);
        continue;
      }
      p.vy -= p.g * DT; p.x += p.vx * DT; p.y += p.vy * DT;
      if (p.boomerang) {
        p.vx -= Math.sign(p.vx0 ?? (p.vx0 = p.vx)) * 8.5 * DT;
        if (Math.sign(p.vx) !== Math.sign(p.vx0) && Math.abs(p.x - owner.x) < 0.35) { this.kill(p, false); continue; }
      }
      // visuals
      const m = p.mesh, u = m.userData;
      m.position.set(p.x, p.y, 0.05);
      if (u.spin) m.rotation.z -= u.spin * DT * Math.sign(p.vx || 1);
      if (u.spinZ) m.rotation.z += u.spinZ * DT;
      if (u.roll) m.rotation.x += u.roll * DT;
      if (p.type === 'ice') m.rotation.y = p.vx > 0 ? 0 : Math.PI;
      if (u.wobble) { const w = Math.sin(this.time * 18) * 0.08; u.wobble.scale.set(1 + w, 1 - w, 1 + w); }
      if (u.trail && this.frame % 2 === 0) fx.sparks.emit(p.x, p.y, 0.05, -p.vx * 0.05, 0.2, 0, new THREE.Color(u.trail), 0.09, 0.35, 0, 1);
      if (u.cloud && this.frame % 3 === 0) fx.glowPuff(V(p.x, p.y, 0.05), u.cloud, 1, 0.26, 0.5, 0.25);
      if (u.fuse && this.frame % 3 === 0) fx.sparks.emit(p.x + 0.07, p.y + 0.24, 0.05, Math.random() - 0.5, 1, 0, new THREE.Color('#ffd070'), 0.06, 0.3, 2, 0);
      if (u.dust && this.frame % 3 === 0) fx.dust(p.x, '#ffd0f0', 2, 0.8);
      // ground
      if (p.g && p.y <= p.r * 0.6) {
        if (p.burst) { this.explode(p); continue; }
        fx.ring(V(p.x, 0.03, 0.05), u.trail || '#fff', 0.45, 0.3, true); sfx('splat'); this.kill(p, true); continue;
      }
      // fighters
      const hb = D.hurtbox();
      if (hb) {
        let hit = false, pt;
        if (p.grounded) { hit = hb[2] < p.h + 0.05 && Math.abs(D.x - p.x) < p.r + D.w; pt = V(p.x, 0.2, 0.15); }
        else { const cx = clamp(p.x, hb[0], hb[1]), cy = clamp(p.y, hb[2], hb[3]); hit = (cx - p.x) * (cx - p.x) + (cy - p.y) * (cy - p.y) < p.r * p.r; pt = V(cx, cy, 0.15); }
        if (hit) {
          if (p.burst) { this.explode(p); continue; }
          this.landHit(owner, D, p, pt, true);
          this.kill(p, true); continue;
        }
      }
      // clash with the other side's projectiles
      for (const q of this.projectiles) {
        if (q === p || !q.alive || q.owner === owner || q.grounded || p.grounded || q.type === 'pillar' || q.type === 'quake') continue;
        if ((q.x - p.x) * (q.x - p.x) + (q.y - p.y) * (q.y - p.y) < (p.r + q.r) * (p.r + q.r)) { this.kill(p, true); this.kill(q, true); sfx('pop'); fx.ring(V(p.x, p.y, 0.1), '#ffffff', 0.6, 0.3); break; }
      }
      if (!p.alive) continue;
      if (p.age > p.life || Math.abs(p.x) > STAGE_W + 2) this.kill(p, false);
    }
    this.projectiles = this.projectiles.filter(p => p.alive);
  }

  // ---------------------------------------------------- rush (the super)
  rushFlash(F) {
    this.hitstop = 14; this.bear(F).flash = 1.2; this.bear(F).u.uFlashC.value.set(F.def.flavor.glow);
    this.G.fx.glowPuff(this.worldPt(F, 0.5), F.def.flavor.glow, 14, 0.6, 0.6, 1.2);
    this.G.fx.burst(this.worldPt(F, 0.5), '#ffffff', 30, 4, 0.12, 0.6);
    this.G.ui.announce('SUGAR RUSH!', 'rush', 1.1);
    this.G.ui.flash(F.def.ui, 0.35);
    this.cam.zoom = 1;
  }
  startRush(A, D) {
    this.rush = { A, D, t: 0, hits: 0 };
    A.go('script'); D.go('script'); D.move = null;
    A.vx = 0; D.vx = 0; D.y = 0; A.y = 0;
    this.slow = 0;
  }
  rushStep() {
    const R = this.rush, { A, D } = R; R.t++;
    const t = R.t;
    D.x = A.x + A.f * (0.55 * (A.sc + D.sc) * 0.5 + 0.12); D.f = -A.f;
    const near = t % 24 < 12;
    const k = t % 12;
    const punch = P({ turn: 0.2, lean: 0.3, [near ? 'aN' : 'aF']: [0.05, 0.1 + Math.sin(t) * 0.2, 1], [near ? 'aNs' : 'aFs']: k < 4 ? 1 + k * 0.4 : 2.4 - (k - 4) * 0.12, [near ? 'aNf' : 'aFf']: 1.7, twist: near ? 0.3 : -0.3, brow: 0.7 });
    A.scriptPose = t < 96 ? punch : null;
    D.scriptPose = t < 96 ? mix(POSES.hurtHigh, P({ lean: -0.6, sq: 0.8 }), (k % 6) / 6) : null;
    if (t < 96 && k === 4) {
      R.hits++;
      const pt = this.worldPt(D, 0.45 + Math.random() * 0.3); pt.x -= A.f * 0.12;
      const dmg = 4.2 * A.power / D.defense; D.hp = Math.max(0, D.hp - dmg); D.roundDmg = (D.roundDmg || 0) + dmg;
      this.bear(D).squish(pt, 1.4, A.f); this.bear(D).flash = 0.18;
      this.G.fx.hit(pt, D.def.flavor.glow, 1.3, A.f); this.G.fx.burst(pt, A.def.flavor.glow, 12, 3, 0.1, 0.5);
      sfx('hit', 1.3); this.shake(0.12); this.G.ui.combo(A.side, R.hits);
      this.G.ui.comic(['SQUISH', 'SPLAT', 'BLOOP', 'GLORP', 'BOING', 'WOBBLE', 'SQUELCH', 'BONK'][R.hits % 8], pt, A.def.ui, 1.1);
    }
    if (t === 96) {
      A.scriptPose = null; A.go('attack'); A.move = A.moves.upper; A.mt = A.move.start; A.connected = true; A.hitDone.clear();
      D.scriptPose = null;
      const pt = this.worldPt(D, 0.6);
      this.rush = null;
      this.landHitRaw(A, D, { dmg: 6, lift: 11, kb: 3.5, kd: true, word: 'SUGAR RUSH!' }, pt);
      this.slow = 0.8; this.slowK = 0.3; this.G.fx.ring(pt, A.def.flavor.glow, 1.8, 0.5);
    }
  }
  landHitRaw(A, D, h, pt) { D.go('idle'); return this.landHit(A, D, Object.assign({ unblockable: true }, h), pt, false); }

  // ------------------------------------------------------------ effects
  fxIceBreak(F) { const p = this.worldPt(F, 0.5); this.G.fx.burst(p, '#e0f6ff', 30, 3.5, 0.1, 0.6); this.G.fx.beadsAt(p, '#cfeeff', 8, 0, 1); sfx('shatter'); }
  fxPoof(F) { const p = this.worldPt(F, 0.5); this.G.fx.glowPuff(p, '#fff8d0', 12, 0.4, 0.5, 1); this.G.fx.burst(p, '#ffffff', 16, 2.5, 0.08, 0.4); }
  fxRing(F, col, size) { this.G.fx.ring(V(F.x, 0.03, 0), col, size, 0.45, true); this.G.fx.dust(F.x, this.G.stage.dust, 10, 2); }
  fxLand(F, k) { this.G.fx.dust(F.x, this.G.stage.dust, Math.round(6 * k), 1.5 * k); this.shake(0.04 * k); }

  // ------------------------------------------------------------ visuals
  syncVisuals(dt) {
    const fx = this.G.fx;
    this.fighters.forEach((F, i) => {
      const v = this.vis[i], b = v.b;
      if (!F.posed) {
        const ap = F.pose(this.time);
        const turnTarget = ap.turn ?? 1;
        v.turn += (turnTarget - v.turn) * Math.min(1, dt * 14);
        b.pose = resolve(ap, F.f, b.pose);
        b.group.position.set(F.x, F.y, F.z || 0);
        const ry = F.f * (Math.PI / 2 - 0.42 * v.turn);
        const curY = b.group.rotation.y;
        b.group.rotation.y = Math.abs(ry - curY) > 2 ? ry : curY + (ry - curY) * Math.min(1, dt * 18);
        if (F.state === 'airhit') { F.ccw = (F.ccw || 0) + dt * 6; }
      }
      const accel = (F.vx - v.lastVx) / Math.max(dt, 1e-3) * F.f; v.lastVx = F.vx;
      const st = F.state;
      b.setExpression(st === 'ko' ? 'ko' : ['hit', 'airhit', 'down', 'stun', 'grabbed', 'frozen', 'dizzy', 'blockstun', 'getup'].includes(st) ? 'hurt' : st === 'win' ? 'happy' : 'idle');
      if (F.forceExpr) b.setExpression(F.forceExpr);
      const lightsOut = (this.G.stage && this.G.stage.bearGlow) || 0;
      if (lightsOut || b._lo) { b._lo = lightsOut; b.u.uGlow.value.copy(b.glowBase).multiplyScalar(1 + lightsOut * 4.5); b.u.uRim.value.copy(b.rimBase).multiplyScalar(1 + lightsOut * 1.2); }
      if (st !== 'frozen') b.update(dt, clamp(accel, -60, 60));
      // Ghostie's vanishing moves
      const m = F.move;
      const faded = F.state === 'attack' && m && m.fade && F.mt >= m.fade[0] && F.mt <= m.fade[1];
      b.body.visible = !faded || (F.mt % 6 < 1);
      if (faded && this.frame % 2 === 0) fx.glowPuff(this.worldPt(F, 0.5), '#fff6c0', 1, 0.3, 0.4, 0.3);
      if (b.canes) { const show = st === 'attack' && m && m.cane; b.canes[0].visible = show && F.f < 0; b.canes[1].visible = show && F.f > 0; }
      // shadow + caustic
      const h = F.y;
      const s = (0.62 * F.sc) * (1 / (1 + h * 0.8));
      v.sh.position.set(F.x, 0, 0.02); v.sh.scale.set(s * 1.25, 1, s);
      v.sh.userData.ca.material.uniforms.uT.value = this.time;
      v.sh.userData.ca.material.uniforms.uA.value = (0.75 + lightsOut * 1.6) / (1 + h * 2);
      v.sh.userData.sh.material.uniforms.uA.value = 0.5 / (1 + h * 1.5);
      v.sh.visible = b.group.visible && !faded && !F.hideShadow;
      // ice
      v.ice.visible = st === 'frozen';
      if (v.ice.visible) { v.ice.position.set(F.x, 0, 0); v.ice.scale.setScalar(F.sc); }
      // dizzy stars
      v.stars.visible = st === 'dizzy' || st === 'stun';
      if (v.stars.visible) {
        const hy = F.y + 1.0 * F.sc;
        v.stars.children.forEach((sObj, k) => { const a = this.time * 4 + k * Math.PI / 2; sObj.position.set(F.x + Math.cos(a) * 0.25 * F.sc, hy + Math.sin(a * 2) * 0.03, Math.sin(a) * 0.25 * F.sc); sObj.rotation.z = a * 2; });
      }
    });
    if (this.finisher && this.finisher.visual) this.finisher.visual(dt);
  }

  // ------------------------------------------------------------- camera
  updateCamera(dt) {
    const cam = this.G.camera, C = this.cam, [a, b] = this.fighters;
    const aspect = cam.aspect;
    let tx, ty, tz, lx, ly, fov = 30;
    if (C.override) {
      ({ x: tx, y: ty, z: tz, lx, ly, fov = 30 } = C.override);
    } else if (this.rush) {
      const R = this.rush, mx = (R.A.x + R.D.x) / 2, big = Math.max(R.A.sc, R.D.sc), ang = Math.sin(R.t * 0.03) * 0.5;
      tx = mx + Math.sin(ang) * 2.4 * big; tz = Math.cos(ang) * 2.4 * big; ty = 0.75 * big; lx = mx; ly = 0.5 * big; fov = 34;
    } else {
      const midX = (a.x + b.x) / 2, sep = Math.abs(a.x - b.x);
      const big = Math.max(a.sc, b.sc);
      const vf = THREE.MathUtils.degToRad(30);
      const hf = 2 * Math.atan(Math.tan(vf / 2) * aspect);
      const halfW = sep / 2 + (aspect < 1 ? 0.72 : 0.95) * big;
      const maxY = Math.max(a.y + a.sc, b.y + b.sc);
      const halfH = Math.max(0.95 * big, maxY * 0.62 + 0.3);
      let dist = Math.max(halfW / Math.tan(hf / 2), halfH / Math.tan(vf / 2), 3.3 * big);
      dist = Math.min(dist, 11);
      const viewHalfW = Math.tan(hf / 2) * dist;
      tx = clamp(midX, -STAGE_W - 0.6 + viewHalfW, STAGE_W + 0.6 - viewHalfW);
      if (viewHalfW > STAGE_W + 0.6) tx = 0;
      const touchShift = this.G.touchShift || 0;
      ly = 0.55 * big + Math.max(0, maxY - 1.2 * big) * 0.55 - touchShift * Math.tan(vf / 2) * dist;
      ty = ly + 0.22 + dist * 0.035;
      tz = dist; lx = tx;
      if (this.phase === 'matchEnd' || this.phase === 'roundEnd') {
        const W = this.winner || a; tx = W.x; lx = W.x; tz = 3.2 * W.sc; ly = 0.55 * W.sc - touchShift * 0.5; ty = ly + 0.15;
      }
    }
    // a low arena (under the couch) has a ceiling the camera must stay beneath
    const ceil = this.G.stage && this.G.stage.ceiling;
    if (ceil) { ty = Math.min(ty, ceil - 0.45); ly = Math.min(ly, ceil - 0.6); }
    const k = 1 - Math.exp(-dt * (C.override ? (C.override.snap || 4) : this.rush ? 7 : 5));
    C.x = lerp(C.x, tx, k); C.y = lerp(C.y, ty, k); C.z = lerp(C.z, tz, k); C.lx = lerp(C.lx, lx, k); C.ly = lerp(C.ly, ly, k); C.fov = lerp(C.fov, fov, k);
    this.shakeAmt *= Math.exp(-dt * 9);
    const s = this.shakeAmt;
    cam.position.set(C.x + (Math.random() - 0.5) * s, C.y + (Math.random() - 0.5) * s, C.z);
    if (Math.abs(cam.fov - C.fov) > 0.01) { cam.fov = C.fov; cam.updateProjectionMatrix(); }
    cam.lookAt(C.lx + (Math.random() - 0.5) * s * 0.5, C.ly, 0);
  }

  dispose() {
    if (this.mirrorSave) { const m = this.bears[1].mat; m.color.copy(this.mirrorSave.c); m.attenuationDistance = this.mirrorSave.d; }
    for (const p of this.projectiles) this.root.remove(p.mesh);
    this.scene.remove(this.root);
    for (const v of this.vis) { v.b.group.removeFromParent(); }
    if (this.finisher && this.finisher.dispose) this.finisher.dispose();
    if (this.cleanup) for (const c of this.cleanup) c();
    const cam = this.G.camera; cam.fov = 30; cam.updateProjectionMatrix();
  }
}
