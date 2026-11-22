// NUBBINS — the computer opponent. It sees the world a few frames late
// (slower on Easy), keeps a short plan, and presses the same buttons a player would.
const LEVELS = [
  { name: 'Easy', react: 30, block: 0.12, aggro: 0.35, combo: 0.08, special: 0.18, anti: 0.1, think: 34, jump: 0.08 },
  { name: 'Normal', react: 18, block: 0.38, aggro: 0.55, combo: 0.4, special: 0.3, anti: 0.4, think: 22, jump: 0.14 },
  { name: 'Hard', react: 10, block: 0.66, aggro: 0.7, combo: 0.8, special: 0.42, anti: 0.75, think: 14, jump: 0.16 },
];

export class CPU {
  constructor(F, level, boss) {
    this.F = F;
    this.L = Object.assign({}, LEVELS[Math.max(0, Math.min(2, level))]);
    if (boss && level > 0) { this.L.block += 0.1; this.L.aggro += 0.1; this.L.special += 0.1; }
    this.hist = [];
    this.plan = null; this.planT = 0;
    this.taps = [];
    this.out = { l: 0, r: 0, u: 0, d: 0, p: 0, k: 0, s: 0, b: 0, x: 0 };
    this.cool = 0;
  }

  snap(M) {
    const o = this.F.opp;
    this.hist.push({ x: o.x, y: o.y, vy: o.vy, state: o.state, atk: o.attacking, move: o.move && o.move.id, proj: M.projectiles.filter(p => p.owner === o && p.dmg).map(p => ({ x: p.x, vx: p.vx, y: p.y })) });
    if (this.hist.length > 60) this.hist.shift();
    return this.hist[Math.max(0, this.hist.length - 1 - this.L.react)];
  }

  tap(btn, dirs = {}, delay = 0, hold = 1) { this.taps.push({ at: this.F.M.frame + delay, btn, dirs, hold }); }

  think(M) {
    const F = this.F, o = F.opp, L = this.L;
    const seen = this.snap(M);
    const o2 = this.out; for (const k in o2) o2[k] = 0;
    if (!seen || M.phase !== 'fight') return o2;
    const dx = seen.x - F.x, d = Math.abs(dx), toward = Math.sign(dx) || F.f;
    const fwdKey = toward > 0 ? 'r' : 'l', backKey = toward > 0 ? 'l' : 'r';
    const R = Math.random;

    // scheduled presses (combos, specials)
    for (const t of this.taps) if (M.frame >= t.at && M.frame < t.at + t.hold) { o2[t.btn] = 1; for (const k in t.dirs) o2[t.dirs[k] === 'fwd' ? fwdKey : t.dirs[k] === 'back' ? backKey : k] = 1; }
    this.taps = this.taps.filter(t => M.frame < t.at + t.hold + 1);

    // keep combos going when a hit lands
    if (F.state === 'attack' && F.connected && F.move && !this.comboing && R() < L.combo) {
      this.comboing = true;
      const m = F.move;
      if (m.chain && m.chain.p && R() < 0.5) this.tap('p', {}, 2);
      else if (m.chain && m.chain.k) this.tap('k', {}, 2);
      else if (m.cancel && F.moves.sp && R() < 0.6) this.tap('s', {}, 2);
    }
    if (F.state !== 'attack') this.comboing = false;

    if (!F.neutral && F.state !== 'air') return o2;
    if (this.cool > 0) this.cool--;

    // react to danger
    const incoming = seen.proj.find(p => Math.sign(p.vx) === -toward && Math.abs(p.x - F.x) < 3);
    if (incoming && this.plan !== 'block' && this.plan !== 'jump') {
      if (R() < L.block * 0.9) this.setPlan('block', 22);
      else if (R() < L.jump * 3) { this.setPlan('jump', 20); this.jumpDir = 1; }
    }
    if (seen.atk && d < 2.2 && this.plan !== 'block' && R() < L.block * 0.35) this.setPlan('block', 16 + (R() * 10 | 0));
    if (seen.y > 0.5 && seen.vy < 2 && d < 1.7 && F.grounded && F.neutral && R() < L.anti * 0.3 && !this.cool) { this.tap('p', { d: 1 }, 0, 2); this.cool = 30; }

    if (--this.planT <= 0) this.choose(M, d, seen);

    switch (this.plan) {
      case 'approach': o2[fwdKey] = 1; break;
      case 'retreat': o2[backKey] = 1; break;
      case 'block': o2[backKey] = 1; o2.b = 1; if (R() < 0.3) o2.d = 1; break;
      case 'crouch': o2.d = 1; break;
      case 'jump': o2.u = 1; if (this.jumpDir > 0) o2[fwdKey] = 1; else if (this.jumpDir < 0) o2[backKey] = 1; if (F.state === 'air' && F.vy < 1 && d < 1.4 && !F.airAtk) o2[R() < 0.5 ? 'k' : 'p'] = 1; break;
      default: break;
    }
    return o2;
  }

  setPlan(p, t) { this.plan = p; this.planT = t; }

  choose(M, d, seen) {
    const F = this.F, L = this.L, R = Math.random;
    const w = (F.w + F.opp.w) / F.sc;
    this.setPlan('idle', L.think * (0.5 + R()));
    if (F.meter >= 100 && d < 2.2 && R() < 0.5) { this.tap('x', {}, 0, 2); return; }
    if (d > 2.6) {
      const r = R();
      if (r < L.special && F.moves.sp && !M.projectiles.some(p => p.owner === F)) { this.tap('s', {}, 0, 2); this.cool = 20; }
      else if (r < L.special + 0.12 && F.moves.fsp && d < 3.6) this.tap('s', { f: 'fwd' }, 0, 2);
      else if (r < L.special + 0.12 + L.jump) { this.setPlan('jump', 30); this.jumpDir = 1; }
      else this.setPlan('approach', 18 + R() * 24);
      return;
    }
    if (d > w + 0.55) {
      const r = R();
      if (r < L.aggro * 0.5) this.setPlan('approach', 10 + R() * 14);
      else if (r < L.aggro * 0.5 + 0.18) { this.tap(R() < 0.6 ? 'k' : 's', R() < 0.4 ? { d: 1 } : {}, 0, 2); }
      else if (r < L.aggro * 0.5 + 0.3 && F.moves.fsp) this.tap('s', { f: 'fwd' }, 0, 2);
      else if (r < 0.85) this.setPlan(R() < 0.5 ? 'retreat' : 'block', 10 + R() * 12);
      else { this.setPlan('jump', 30); this.jumpDir = 1; }
      return;
    }
    // up close
    const r = R();
    if (r < L.aggro * 0.45) this.tap('p', {}, 0, 2);
    else if (r < L.aggro * 0.6) this.tap('p', { f: 'fwd' }, 0, 2); // throw when it can
    else if (r < L.aggro * 0.75) this.tap('k', { d: 1 }, 0, 2);
    else if (r < L.aggro * 0.88) this.tap('k', {}, 0, 2);
    else if (r < L.aggro * 0.95 && F.moves.dsp) this.tap('s', { d: 1 }, 0, 2);
    else if (r < 0.8) this.setPlan('block', 12 + R() * 14);
    else this.setPlan('retreat', 12);
  }
}
