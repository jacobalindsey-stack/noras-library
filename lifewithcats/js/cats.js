// Life with Cats — how a cat lives. Needs drain, and each cat decides what to
// do next: eat, nap in the sunbeam, bat a toy, groom, come and ask for love.
// Ignore a need for too long and the cat finds its own solution, usually at
// the expense of your sofa, your water glass or your houseplants.
import * as THREE from '../lib/three.module.min.js';
import { CatRig } from './catmodel.js';
import { PERS, BREEDS, COATS } from './catdata.js';
import { hearts } from './game.js';
import { roomX, RW, RD } from './house.js';
import { clamp, lerp, damp, dampAngle, angDiff, pick, weighted, rng } from './util.js';
import { GIFTS } from './catstuff.js';

const RATE = { food: 6.2, fun: 7.2, love: 4.8, tidy: 2.3 }; // points lost per game hour
export const MISCHIEF = {
  knock: { label: 'is pushing something off the table', icon: 'glass', windup: 4.2 },
  scratch: { label: 'is clawing the furniture', icon: 'claw', windup: 4.2 },
  curtain: { label: 'is climbing the curtains', icon: 'curtain', windup: 4.5 },
  plant: { label: 'is chewing a houseplant', icon: 'leaf', windup: 4.0 },
  zoomies: { label: 'has the zoomies', icon: 'zoom', windup: 0 },
  laptop: { label: 'is sitting on your laptop', icon: 'laptop', windup: 0 },
  counter: { label: 'is on the kitchen counter', icon: 'bread', windup: 4.2 },
  sack: { label: 'is raiding the kibble sack', icon: 'kibble', windup: 4.0 },
  trash: { label: 'is tipping over the bin', icon: 'trash', windup: 4.0 },
  yowl: { label: 'is yowling for attention', icon: 'meow', windup: 4.5 },
  shelf: { label: 'is knocking books off the shelf', icon: 'book', windup: 4.2 },
  accident: { label: 'is about to have an accident', icon: 'puddle', windup: 3.6 },
  hairball: { label: 'is coughing up a hairball', icon: 'hairball', windup: 2.6, uncatchable: true },
};
const UPV = new THREE.Vector3(0, 1, 0);

export class Agent {
  constructor(w, d) {
    this.w = w; this.d = d;
    this.rig = new CatRig(d);
    w.scene.add(this.rig.root);
    this.x = 0; this.z = 0; this.y = 0; this.heading = 0; this.room = 0;
    this.plan = []; this.cur = null; this.st = 0;
    this.perch = null; this.alert = null; this.want = null;
    this.memes = new Set(); this.flags = {};
    this.cool = { mischief: 14 + Math.random() * 20, gift: 40 + Math.random() * 60, blep: 8 + Math.random() * 20, meow: 3, attention: 0, think: 0 };
    this.held = null; this.speed = 0; this.look = null; this.annoyed = 0;
    this.lift = 0; this.air = null; this.meow = 0; this.slowBlink = 0; this.tongue = 0;
    this.r = rng(d.seed ^ 0x5bd1);
  }
  get P() { return PERS[this.d.pers]; }
  get name() { return this.d.name; }
  place(x, z, room) {
    const p = this.w.house.nearestFree(x, z);
    this.x = p.x; this.z = p.z; this.y = 0; this.room = room ?? this.w.house.roomOf(p.x);
    this.heading = Math.PI * (this.r() - 0.5); this.leavePerch(); this.plan = []; this.cur = null;
    this.rig.root.position.set(this.x, 0, this.z);
  }
  rebuild() { // after growing up
    const old = this.rig; this.w.scene.remove(old.root); old.dispose();
    this.rig = new CatRig(this.d); this.w.scene.add(this.rig.root);
  }
  remove() { this.w.scene.remove(this.rig.root); this.rig.dispose(); this.leavePerch(); }

  // ------------------------------------------------------------ needs
  drain(dtMin) {
    const d = this.d, N = d.needs, P = this.P, h = dtMin / 60, dec = P.decay || {};
    const kit = d.age === 'kitten', sen = d.age === 'senior';
    const cozyK = 1.12 - this.w.game.cozy / 300;
    N.food = clamp(N.food - RATE.food * (dec.food || 1) * h * (kit ? 1.15 : 1), 0, 100);
    N.fun = clamp(N.fun - RATE.fun * (dec.fun || 1) * h * (kit ? 1.3 : sen ? 0.7 : 1) * cozyK, 0, 100);
    N.love = clamp(N.love - RATE.love * (dec.love || 1) * h * cozyK, 0, 100);
    N.tidy = clamp(N.tidy - RATE.tidy * (dec.tidy || 1) * h * (BREEDS[d.breed].fluff > 0.5 ? 1.3 : 1), 0, 100);
    const sleeping = this.cur && this.cur.sleep;
    N.energy = clamp(N.energy + (sleeping ? 34 * (this.cur.napQ || 1) : -6.5 * (dec.energy || 1) * (sen ? 1.2 : 1)) * h, 0, 100);
    d.claws = clamp((d.claws || 0) + 4.6 * h, 0, 100);
    d.bladder = clamp((d.bladder || 0) + 10.5 * h, 0, 100);
    // feeling poorly when very hungry or very round
    if (N.food < 3) d.health = clamp(d.health - 3 * h, 20, 100);
    else if (d.weight > 82) d.health = clamp(d.health - 0.8 * h, 20, 100);
    else d.health = clamp(d.health + 1.5 * h, 0, 100);
    if (sleeping && this.cur.pile) d.bond += 0.02 * h;
  }
  mood() { const N = this.d.needs; return (N.food + N.fun + N.love + N.tidy + N.energy) / 5; }
  // the thing the cat wants most, for the little thought bubble
  wish() {
    const d = this.d, N = d.needs;
    if (this.alert) return null;
    const list = [];
    if (d.bladder > 70 && this.w.litterDirty(this.room)) list.push(['litter', 100 - (100 - d.bladder)]);
    if (N.food < 32) list.push(['food', 100 - N.food]);
    if (N.fun < 30) list.push(['play', 100 - N.fun]);
    if (N.love < 30) list.push(['love', 100 - N.love]);
    if (d.claws > 75 && !this.w.hasPost(this.room)) list.push(['claws', d.claws]);
    if (N.tidy < 30) list.push(['brush', 100 - N.tidy]);
    if (d.health < 55) list.push(['sick', 100]);
    if (d.weight > 80) list.push(['chonk', 50]);
    list.sort((a, b) => b[1] - a[1]);
    return list.length ? list[0][0] : null;
  }

  // ------------------------------------------------------------ deciding
  think() {
    const d = this.d, N = d.needs, w = this.w;
    if (d.bladder > 72) return this.planLitter();
    const food = w.findFood(this);
    if (N.food < 45 && food) return this.planEat(food);
    if (N.energy < 26) return this.planNap();
    if (d.claws > 74) return this.planScratch();
    if (N.food < 20 && this.naughty(1 - N.food / 20, 'food')) return;
    if (N.fun < 32) { if (this.naughty(1 - N.fun / 32, 'fun')) return; if (this.planToy()) return; }
    if (N.love < 28) { if (this.cool.attention <= 0) return this.planAttention(); if (this.naughty(1 - N.love / 28, 'love')) return; }
    if (N.tidy < 22 && this.r() < 0.3 && this.cool.mischief <= 0) { this.startMischief('hairball'); return; }
    if (N.tidy < 45 && this.r() < 0.35) return this.planGroom();
    if (N.energy < 60 && this.r() < 0.35) return this.planNap();
    if (N.fun < 70 && this.r() < 0.35 && this.planToy()) return;
    return this.planIdle();
  }
  // should the cat take matters into its own paws?
  naughty(sev, why) {
    if (this.cool.mischief > 0 || this.w.calm) return false;
    const P = this.P, d = this.d, day = this.w.game.s.day;
    const early = clamp(0.35 + day * 0.2, 0.35, 1);
    const p = clamp(0.2 + sev * 0.75, 0, 0.95) * P.mischief * (d.age === 'kitten' ? 1.2 : d.age === 'senior' ? 0.6 : 1) * early;
    this.cool.mischief = 6;
    if (this.r() > p) return false;
    const kinds = this.mischiefOptions(why);
    const k = weighted(Object.keys(kinds), k => kinds[k] * ((P.kinds || {})[k] || 0.5), this.r);
    if (!k) return false;
    return this.startMischief(k);
  }
  mischiefOptions(why) {
    const w = this.w, h = w.house, out = {};
    const here = r => r === this.room ? 2.5 : 1;
    const open = r => w.game.s.rooms[r];
    if (why === 'fun' || why === 'love') {
      if (h.knock.some(k => k.state === 'ok' && open(k.room) && k.kind !== 'plant')) out.knock = 2;
      out.zoomies = why === 'fun' ? 1.6 : 0.3;
      if (h.rooms.some(r => r.unlocked && r.windows.length)) out.curtain = why === 'fun' ? 1 : 0.4;
      if (h.chew.some(c => open(c.room) && c.eaten < c.leaves.length - 2 && !w.hasGrass(c.room))) out.plant = 0.8;
      if (h.perches.some(p => p.kind === 'high' && p.rec && p.rec.kind === 'bookshelf' && open(p.room))) out.shelf = 0.7;
      if (open(1)) out.trash = 0.5;
    }
    if (why === 'love') { if (open(0)) out.laptop = 2; out.yowl = 1.4; }
    if (why === 'food') { if (open(1)) { if (w.breadReady()) out.counter = 2; out.sack = 1.4; out.trash = 1; } out.yowl = 1; if (h.knock.some(k => k.state === 'ok' && open(k.room) && k.kind === 'glass')) out.knock = 0.6; }
    return out;
  }
  startMischief(kind) {
    const w = this.w, h = w.house, r = this.r;
    const pickNear = list => { if (!list.length) return null; const same = list.filter(e => e.room === this.room); return pick(same.length && r() < 0.75 ? same : list, r); };
    const M = { kind, ...MISCHIEF[kind] };
    const steps = [];
    if (kind === 'knock') {
      const k = pickNear(h.knock.filter(k => k.state === 'ok' && w.game.s.rooms[k.room] && k.kind !== 'plant'));
      if (!k) return false;
      const perch = this.perchNear(k);
      if (!perch) return false;
      k.state = 'targeted';
      steps.push(...this.goPerch(perch), { do: 'face', x: k.world.x, z: k.world.z }, { do: 'mischief', m: M, pose: 'swat', cycle: 'swat', target: k, meme: 'regret', onFail: () => { if (k.state === 'targeted') k.state = 'ok'; } }, { do: 'pose', pose: 'judge', dur: 2.2, lookCam: true }, { do: 'down' });
    } else if (kind === 'scratch') {
      const s = pickNear(h.scratch.filter(s => !s.post && w.game.s.rooms[s.room]));
      if (!s) return false;
      steps.push(...this.goFloor(s.ax, s.az), { do: 'face', x: s.x, z: s.z }, { do: 'mischief', m: M, pose: s.y < 0.7 ? 'scratchLow' : 'scratch', cycle: s.y < 0.7 ? 'scratchLow' : 'scratch', target: s });
    } else if (kind === 'curtain') {
      const wins = h.rooms.filter(rm => rm.unlocked).flatMap(rm => rm.windows);
      const win = pick(wins.filter(x => x.room === this.room).length ? wins.filter(x => x.room === this.room) : wins, r);
      if (!win) return false;
      const c = win.curtains[r() < 0.5 ? 0 : 1]; const cp = new THREE.Vector3(); c.getWorldPosition(cp);
      const a = h.nearestFree(cp.x, cp.z + 0.9);
      steps.push(...this.goFloor(a.x, a.z), { do: 'face', x: cp.x, z: cp.z - 2 }, { do: 'mischief', m: M, pose: 'climb', cycle: 'climb', target: { win, curtain: c, x: cp.x, z: cp.z + 0.45 }, climb: true });
    } else if (kind === 'plant') {
      const p = pickNear(h.chew.filter(c => w.game.s.rooms[c.room] && c.eaten < c.leaves.length - 2));
      if (!p) return false;
      const pp = new THREE.Vector3(); p.rec.group.getWorldPosition(pp);
      const a = h.nearestFree(pp.x, pp.z + 1);
      steps.push(...this.goFloor(a.x, a.z), { do: 'face', x: pp.x, z: pp.z }, { do: 'mischief', m: M, pose: 'stand', over: { headPitch: -0.5, hipY: 0.75 }, cycle: 'eat', target: p });
    } else if (kind === 'zoomies') {
      const pts = []; for (let i = 0; i < 5; i++) pts.push(h.randomFree(this.room, r));
      steps.push({ do: 'mischief', m: M, zoom: pts, meme: 'zoomies' });
    } else if (kind === 'laptop') {
      const perch = h.perches.find(p => p.kind === 'laptop' && p.occ < p.cap && w.game.s.rooms[p.room]);
      if (!perch) return false;
      steps.push(...this.goPerch(perch), { do: 'mischief', m: M, pose: 'loaf', sitOn: true, dur: 26, meme: 'keyboard' }, { do: 'down' });
    } else if (kind === 'counter') {
      const perch = h.perches.find(p => p.kind === 'counter' && p.occ < p.cap && p.room === 1);
      if (!perch || !w.breadReady()) return false;
      const bread = w.breadSpot();
      steps.push(...this.goPerch(perch), { do: 'face', x: bread.x, z: bread.z }, { do: 'mischief', m: M, pose: 'eat', cycle: 'eat', target: bread }, { do: 'down' });
    } else if (kind === 'sack' || kind === 'trash') {
      const t = w.kitchenThing(kind); if (!t) return false;
      steps.push(...this.goFloor(t.ax, t.az), { do: 'face', x: t.x, z: t.z }, { do: 'mischief', m: M, pose: kind === 'trash' ? 'scratch' : 'scratchLow', cycle: kind === 'trash' ? 'scratch' : 'scratchLow', target: t });
    } else if (kind === 'yowl') {
      const p = this.frontSpot();
      steps.push(...this.goFloor(p.x, p.z), { do: 'mischief', m: M, pose: 'sit', yowl: true, lookCam: true, meme: 'meow' });
    } else if (kind === 'shelf') {
      const perch = h.perches.find(p => p.kind === 'high' && p.rec && p.rec.kind === 'bookshelf' && p.occ < p.cap && w.game.s.rooms[p.room]);
      if (!perch) return false;
      steps.push(...this.goPerch(perch), { do: 'mischief', m: M, pose: 'swat', cycle: 'swat', target: perch, meme: 'perch' }, { do: 'down' });
    } else if (kind === 'accident') {
      const box = w.nearestLitter(this); const base = box ? box.pos : { x: this.x, z: this.z };
      const a = h.nearestFree(base.x + (r() - 0.5) * 3, base.z + 1.6);
      steps.push(...this.goFloor(a.x, a.z), { do: 'mischief', m: M, pose: 'crouch', target: a });
    } else if (kind === 'hairball') {
      steps.push(...this.downIfUp(), { do: 'mischief', m: M, pose: 'crouch', over: { headPitch: 0.3 }, cycle: 'eat' });
    }
    this.cool.mischief = 30 + r() * 25;
    this.setPlan(steps, 'mischief');
    return true;
  }
  perchNear(k) {
    const h = this.w.house;
    let best = null, bd = 1e9;
    for (const p of h.perches) {
      if (p.room !== k.room || p.occ >= p.cap || p.inside) continue;
      if (p.rec && k.rec && p.rec !== k.rec && Math.abs(p.y - k.world.y) > 0.4) continue;
      const dd = Math.hypot(p.x - k.world.x, p.z - k.world.z) + Math.abs(p.y - k.world.y) * 2;
      if (dd < bd && dd < 2.5) { bd = dd; best = p; }
    }
    return best;
  }
  frontSpot() { const cr = this.w.game.s.rooms[this.w.camRoom] && Math.abs(this.w.camRoom - this.room) <= 1 ? this.w.camRoom : this.room; return this.w.house.nearestFree(roomX(cr) + (this.r() - 0.5) * 6, 3.4); }

  // ------------------------------------------------------------ good plans
  planEat(st) {
    const steps = [...this.goFloor(st.ax, st.az), { do: 'face', x: st.pos.x, z: st.pos.z }, { do: 'pose', pose: 'eat', cycle: 'eat', dur: 4.5, eat: st }];
    if (this.w.game.s.upgrades.fountain || st.water > 0) steps.push({ do: 'pose', pose: 'eat', cycle: 'eat', dur: 1.6, drink: st });
    this.setPlan(steps, 'eat');
  }
  planLitter() {
    const w = this.w, box = w.nearestLitter(this);
    const picky = this.P.picky;
    if (!box || box.dirt > (picky ? 50 : 75)) { if (this.startMischief('accident')) return; this.d.bladder = 40; return this.planIdle(); }
    this.setPlan([...this.goFloor(box.pos.x, box.pos.z + 0.05), { do: 'face', x: box.pos.x, z: box.pos.z - 2 }, { do: 'pose', pose: 'crouch', dur: 2.6, over: { tailUp: 0.4 } }, { do: 'pose', pose: 'scratchLow', cycle: 'scratchLow', dur: 1.2, litter: box }], 'litter');
  }
  planNap() {
    const w = this.w, h = w.house, r = this.r;
    const opts = [];
    const sun = w.sunSpot(this.room);
    for (const p of h.perches) {
      if (!p.nap || p.occ >= p.cap || !w.game.s.rooms[p.room]) continue;
      if (p.kind === 'high' && !this.P.climber && r() < 0.7) continue;
      let sc = p.nap * 1.5 + (p.room === this.room ? 2 : 0) - Math.abs(p.room - this.room) * 0.8;
      if (p.rec && p.rec.group.userData.heated) sc += 3;
      if (sun && Math.hypot(p.x - sun.x, p.z - sun.z) < 1.6) sc += 3;
      const sleeper = w.agents.find(a => a !== this && a.cur && a.cur.sleep && Math.hypot(a.x - p.x, a.z - p.z) < 2);
      if (sleeper) sc += 2;
      opts.push({ p, sc: sc + r() * 2 });
    }
    if (sun) opts.push({ floor: sun, sc: 5 + r() * 2, sunny: true });
    const fire = w.fireSpot(); if (fire && fire.room === this.room) opts.push({ floor: fire, sc: 4 + r() * 2 });
    opts.push({ floor: h.randomFree(this.room, r), sc: 1 });
    opts.sort((a, b) => b.sc - a.sc);
    const o = opts[0];
    const dur = 16 + r() * 16;
    const poseName = r() < 0.2 ? 'flop' : r() < 0.25 ? 'loaf' : 'sleep';
    if (o.p) { this.setPlan([...this.goPerch(o.p), { do: 'pose', pose: poseName, dur, sleep: true, napQ: 1 + o.p.nap * 0.15, sunny: o.sunny || (sun && Math.hypot(o.p.x - sun.x, o.p.z - sun.z) < 1.6), perchKind: o.p.kind }], 'nap'); }
    else this.setPlan([...this.goFloor(o.floor.x, o.floor.z), { do: 'pose', pose: poseName, dur, sleep: true, napQ: o.sunny ? 1.3 : 1, sunny: o.sunny }], 'nap');
  }
  planScratch() {
    const w = this.w, h = w.house, r = this.r;
    const posts = h.scratch.filter(s => s.post && w.game.s.rooms[s.room]);
    const near = posts.filter(s => s.room === this.room);
    const naughtyAnyway = this.P.mischief * 0.12;
    if ((near.length || (posts.length && r() < 0.5)) && r() > naughtyAnyway) {
      const s = pick(near.length ? near : posts, r);
      this.setPlan([...this.goFloor(s.ax, s.az), { do: 'face', x: s.x, z: s.z }, { do: 'pose', pose: s.low ? 'scratchLow' : 'scratch', cycle: s.low ? 'scratchLow' : 'scratch', dur: 3.2, post: s }], 'scratch');
      return;
    }
    if (this.cool.mischief > 0) this.cool.mischief = 0;
    if (!this.startMischief('scratch')) { this.d.claws -= 20; this.planIdle(); }
  }
  planToy() {
    const w = this.w, r = this.r, list = [];
    for (const it of w.placed) {
      if (!w.game.s.rooms[it.room]) continue;
      const def = it.def;
      if (!def.fun) continue;
      list.push({ it, sc: def.fun + (it.room === this.room ? 2 : 0) + r() * 2 });
    }
    // window watching is always there
    const sill = w.house.perches.filter(p => (p.kind === 'sill' || p.kind === 'perch') && p.occ < p.cap && w.game.s.rooms[p.room]);
    if (sill.length) list.push({ sill: pick(sill, r), sc: 1.5 + r() });
    if (this.P.climber || r() < 0.3) { const hi = w.house.perches.filter(p => (p.kind === 'tree' || p.kind === 'shelf' || p.kind === 'high') && p.occ < p.cap && w.game.s.rooms[p.room]); if (hi.length) list.push({ high: pick(hi, r), sc: 2 + r() * 2 + (this.P.climber ? 2 : 0) }); }
    if (!list.length) return false;
    list.sort((a, b) => b.sc - a.sc);
    const o = list[0];
    if (o.sill) { this.setPlan([...this.goPerch(o.sill), { do: 'pose', pose: 'sit', dur: 7 + r() * 5, watch: true, fun: 1.5, meme: o.sill.kind === 'perch' ? 'tv' : null }], 'watch'); return true; }
    if (o.high) { this.setPlan([...this.goPerch(o.high), { do: 'pose', pose: r() < 0.5 ? 'loaf' : 'sit', dur: 8 + r() * 6, fun: 1.6, meme: 'perch' }], 'climb'); return true; }
    const it = o.it, k = it.def.build;
    const p = it.pos;
    if (k === 'fishTank' || k === 'birdFeeder') {
      const spot = k === 'fishTank' ? w.house.nearestFree(p.x, p.z + 1.4) : null;
      if (spot) { this.setPlan([...this.goFloor(spot.x, spot.z), { do: 'face', x: p.x, z: p.z }, { do: 'pose', pose: 'sit', over: { headPitch: -0.35, pupil: 1, tailWave: 0.3, tailSpeed: 7 }, dur: 9, fun: 2.4, meme: 'tv', lookAt: { x: p.x, y: 2.5, z: p.z } }], 'tv'); return true; }
      const sill = w.house.perches.find(pp => pp.window && pp.window === it.win && pp.occ < pp.cap) || w.house.perches.find(pp => pp.kind === 'perch' && pp.room === it.room && pp.occ < pp.cap);
      if (sill) { this.setPlan([...this.goPerch(sill), { do: 'pose', pose: 'sit', over: { pupil: 1, tailWave: 0.3, tailSpeed: 7 }, dur: 9, fun: 2.4, meme: 'tv', lookAt: { x: p.x, y: 3, z: p.z - 2 } }], 'tv'); return true; }
      return false;
    }
    if (k === 'tunnel') { const hs = it.hide; this.setPlan([...this.goFloor(hs.x, hs.z), { do: 'pose', pose: 'loaf', dur: 7, fun: 1.8, meme: 'hide' }], 'hide'); return true; }
    if (k === 'wallShelves') { const perch = w.house.perches.filter(pp => pp.rec === it.rec && pp.occ < pp.cap); if (perch.length) { const pp = pick(perch, r); this.setPlan([...this.goPerch(pp), { do: 'pose', pose: r() < 0.5 ? 'loaf' : 'sit', dur: 8, fun: 1.8, meme: 'perch' }], 'climb'); return true; } return false; }
    if (k === 'catTree') { const perch = w.house.perches.filter(pp => pp.rec === it.rec && pp.occ < pp.cap); if (perch.length) { const pp = pick(perch, r); this.setPlan([...this.goPerch(pp), { do: 'pose', pose: r() < 0.5 ? 'loaf' : 'sit', dur: 8, fun: 1.8, meme: pp.y > 3 ? 'perch' : null }], 'climb'); return true; } }
    if (k === 'box' || k === 'paperBag') { const perch = w.house.perches.find(pp => pp.rec === it.rec && pp.occ < pp.cap); if (perch) { this.setPlan([...this.goPerch(perch), { do: 'pose', pose: r() < 0.6 ? 'loaf' : 'sit', dur: 8 + r() * 6, fun: 1.2, meme: 'fits' }], 'box'); return true; } }
    // bat a toy around
    const a = w.house.nearestFree(p.x + (r() - 0.5), p.z + 0.9);
    this.setPlan([...this.goFloor(a.x, a.z), { do: 'face', x: p.x, z: p.z }, { do: 'pose', pose: 'crouch', cycle: 'wiggle', dur: 1.2 }, { do: 'pounce', x: p.x, z: p.z + 0.3 }, { do: 'pose', pose: 'stand', cycle: 'bat', dur: 3.5, fun: 2.6, toy: it }], 'toy');
    return true;
  }
  planGroom() { this.setPlan([...this.downIfUp(false), { do: 'pose', pose: 'groom', cycle: 'groom', dur: 5.5, groom: true, meme: 'groom' }], 'groom'); }
  planAttention() {
    const p = this.frontSpot();
    this.cool.attention = 50;
    this.setPlan([...this.goFloor(p.x, p.z), { do: 'pose', pose: 'sit', dur: 8, lookCam: true, meowing: true, asking: true, meme: 'meow' }], 'attention');
  }
  planIdle() {
    const w = this.w, h = w.house, r = this.r, d = this.d, N = d.needs, P = this.P;
    const opts = {
      wander: 2.2, sit: 1.6, loaf: 1.2, sploot: 0.6, belly: N.love > 60 ? 0.7 : 0.1, stretch: 0.5, groom: 0.8, judge: P === PERS.grump ? 1.5 : 0.4,
      blink: hearts(d.bond) >= 3 && w.camRoom === this.room ? 0.9 : 0, gift: hearts(d.bond) >= 2 && this.cool.gift <= 0 ? 1.2 * (P.gifts || 1) : 0,
      zoom: N.fun > 60 && (d.pers === 'chaos' || d.age === 'kitten') ? 0.5 : 0.08, knead: N.love > 65 ? 0.7 : 0, visit: w.agents.length > 1 ? 0.6 : 0, explore: 0.8,
      prank: this.cool.mischief <= 0 && !w.calm ? 0.35 * P.mischief * clamp(0.3 + w.game.s.day * 0.18, 0.3, 1) : 0,
    };
    const k = weighted(Object.keys(opts), x => opts[x], r);
    const here = () => this.downIfUp(false);
    if (k === 'prank') { const kinds = this.mischiefOptions(this.r() < 0.5 ? 'fun' : 'love'); delete kinds.yowl; const kk = weighted(Object.keys(kinds), x => kinds[x] * ((P.kinds || {})[x] || 0.5), r); if (kk && this.startMischief(kk)) return; this.cool.mischief = 20; return this.planIdle(); }
    if (k === 'wander') { const p = h.randomFree(this.pickRoom(), r); this.setPlan([...this.goFloor(p.x, p.z), { do: 'pose', pose: 'stand', dur: 1 + r() * 2, lookAround: true }], 'wander'); }
    else if (k === 'sit') this.setPlan([{ do: 'pose', pose: 'sit', dur: 4 + r() * 5, lookAround: true, lookCam: r() < 0.4 }], 'sit');
    else if (k === 'loaf') this.setPlan([{ do: 'pose', pose: 'loaf', dur: 6 + r() * 6, meme: 'loaf' }], 'loaf');
    else if (k === 'sploot') this.setPlan([...here(), { do: 'pose', pose: 'sploot', dur: 5 + r() * 4, meme: 'sploot' }], 'sploot');
    else if (k === 'belly') this.setPlan([...here(), { do: 'pose', pose: 'belly', dur: 5 + r() * 4, meme: 'trap', lookCam: true }], 'belly');
    else if (k === 'stretch') this.setPlan([...here(), { do: 'pose', pose: 'stretch', dur: 1.8 }], 'stretch');
    else if (k === 'groom') this.planGroom();
    else if (k === 'judge') this.setPlan([{ do: 'pose', pose: 'judge', dur: 5 + r() * 3, lookCam: true, meme: 'judge' }], 'judge');
    else if (k === 'blink') this.setPlan([{ do: 'pose', pose: 'sit', dur: 4, lookCam: true, slowBlink: true, meme: 'blink' }], 'blink');
    else if (k === 'gift') this.planGift();
    else if (k === 'zoom') { const pts = []; for (let i = 0; i < 4; i++) pts.push(h.randomFree(this.room, r)); this.setPlan([...here(), { do: 'zoom', pts, meme: 'zoomies' }], 'zoomies'); }
    else if (k === 'knead') { const beds = h.perches.filter(p => (p.kind === 'bed' || p.kind === 'seat' || p.kind === 'basket') && p.occ < p.cap && w.game.s.rooms[p.room]); if (beds.length) { const b = pick(beds, r); this.setPlan([...this.goPerch(b), { do: 'pose', pose: 'knead', cycle: 'knead', dur: 5, meme: 'biscuits', purr: true }, { do: 'pose', pose: 'loaf', dur: 6, meme: 'loaf' }], 'knead'); } else this.setPlan([{ do: 'pose', pose: 'loaf', dur: 6 }], 'loaf'); }
    else if (k === 'visit') { const o = pick(w.agents.filter(a => a !== this), r); const p = h.nearestFree(o.x + (r() - 0.5) * 1.6, o.z + 1.0); this.setPlan([...this.goFloor(p.x, p.z), { do: 'face', x: o.x, z: o.z }, { do: 'pose', pose: 'sit', dur: 4, lookAgent: o }], 'visit'); }
    else if (k === 'explore') { const ps = h.perches.filter(p => p.occ < p.cap && w.game.s.rooms[p.room] && !p.nap && p.kind !== 'laptop' && p.kind !== 'counter' && (p.kind !== 'high' || P.climber)); if (ps.length) { const p = pick(ps, r); this.setPlan([...this.goPerch(p), { do: 'pose', pose: r() < 0.5 ? 'sit' : 'loaf', dur: 5 + r() * 5, lookAround: true, meme: p.y > 3 ? 'perch' : null }], 'explore'); } else this.setPlan([{ do: 'pose', pose: 'sit', dur: 3 }], 'sit'); }
    // little extras
    if (this.cool.blep <= 0 && r() < 0.25) { this.cool.blep = 30 + r() * 40; this.tongueT = 3.5; }
  }
  pickRoom() { const open = this.w.game.roomsOpen(); if (this.r() < 0.65) return this.room; return pick(open, this.r); }
  planGift() {
    const id = pick(GIFTS, this.r).id;
    this.cool.gift = 120 + this.r() * 120;
    const p = this.frontSpot();
    this.setPlan([...this.goFloor(p.x, p.z), { do: 'call', fn: () => this.w.dropGift(id, this.x + Math.sin(this.heading) * 0.7, this.z + Math.cos(this.heading) * 0.7, this) }, { do: 'pose', pose: 'sit', dur: 4, lookCam: true, meme: 'gift', meowing: true }], 'gift');
  }

  // ------------------------------------------------------------ movement helpers
  downIfUp(force = true) { return this.perch || this.y > 0.05 ? [{ do: 'down' }] : []; }
  goFloor(x, z, run) { return [...this.downIfUp(), { do: 'go', x, z, run }]; }
  goPerch(p) {
    if (this.perch === p) return [];
    return [...this.downIfUp(), { do: 'go', x: p.ax, z: p.az }, { do: 'up', perch: p }];
  }
  setPlan(steps, label) { this.plan = steps; this.cur = null; this.label = label; this.st = 0; }
  leavePerch() { if (this.perch) { this.perch.occ = Math.max(0, this.perch.occ - 1); this.perch = null; } }
  cancel(soft) {
    if (this.cur && this.cur.onFail) this.cur.onFail();
    if (this.cur && this.cur.do === 'up' && this.cur.reserved && this.perch !== this.cur.perch) { this.cur.perch.occ = Math.max(0, this.cur.perch.occ - 1); this.y = 0; const p = this.w.house.nearestFree(this.x, this.z); this.x = p.x; this.z = p.z; }
    if (this.alert) this.w.mischiefEnd(this, false);
    this.alert = null; this.plan = []; this.cur = null; this.air = null; this.speed = 0;
    if (this.climbY) { this.y = 0; this.climbY = 0; }
    if (!this.perch && this.y > 0.05) { this.y = 0; const p = this.w.house.nearestFree(this.x, this.z); this.x = p.x; this.z = p.z; }
  }

  // ------------------------------------------------------------ player actions
  catchIt() {
    if (!this.alert || this.alert.m.uncatchable) return false;
    const kind = this.alert.m.kind;
    this.cancel();
    this.w.game.s.today.catches++; this.w.game.s.stats.catches++; this.d.stats.catches++;
    this.cool.mischief = 26 + this.r() * 15;
    const steps = [];
    if (this.perch && this.perch.kind !== 'laptop') steps.push({ do: 'pose', pose: 'sheepish', dur: 1.6, lookCam: true });
    steps.push({ do: 'down' });
    if (kind === 'accident') { const box = this.w.nearestLitter(this); if (box) steps.push({ do: 'go', x: box.pos.x, z: box.pos.z }, { do: 'pose', pose: 'crouch', dur: 2.2 }, { do: 'pose', pose: 'scratchLow', cycle: 'scratchLow', dur: 1, litter: box }); }
    else steps.push({ do: 'pose', pose: 'sheepish', dur: 1.6, lookCam: true });
    if (kind === 'yowl' || kind === 'laptop') this.d.needs.love = Math.min(100, this.d.needs.love + 8);
    this.setPlan(steps, 'caught');
    return kind;
  }
  // a minigame takes over the cat
  hold(mode) {
    this.cancel(); this.held = mode;
    if (this.perch && (mode === 'play')) { this.leavePerch(); this.y = 0; const p = this.w.house.nearestFree(this.x, this.z + 0.6); this.x = p.x; this.z = p.z; }
  }
  release() { this.held = null; this.cur = null; this.plan = []; this.st = 0; this.cool.think = 0.5; }

  // ------------------------------------------------------------ per frame
  update(dt, gm) {
    const w = this.w, d = this.d, rig = this.rig;
    this.drain(gm);
    for (const k in this.cool) this.cool[k] -= dt;
    this.annoyed = Math.max(0, this.annoyed - dt * 0.3);
    if (this.tongueT > 0) this.tongueT -= dt;
    this.memes.clear();
    if (!this.held) this.step(dt);
    // look target
    let look = null, lookW = 1;
    const cur = this.cur;
    if (this.heldLook) look = this.heldLook;
    else if (cur && (cur.lookCam || cur.asking)) look = w.camera.position;
    else if (cur && cur.lookAt) look = new THREE.Vector3(cur.lookAt.x, cur.lookAt.y, cur.lookAt.z);
    else if (cur && cur.lookAgent) look = new THREE.Vector3(cur.lookAgent.x, cur.lookAgent.y + 0.8, cur.lookAgent.z);
    else if (cur && cur.lookAround) { if (!this.lookPt || this.st > (this.lookUntil || 0)) { this.lookPt = new THREE.Vector3(this.x + (this.r() - 0.5) * 8, 0.5 + this.r() * 3, this.z + (this.r() - 0.3) * 8); if (this.r() < 0.3) this.lookPt = w.camera.position.clone(); this.lookUntil = this.st + 1.5 + this.r() * 2; } look = this.lookPt; }
    if (cur && cur.sleep) look = null;
    // meowing now and then when asking
    if (cur && (cur.meowing || cur.yowl) && this.cool.meow <= 0 && !this.held) { this.cool.meow = cur.yowl ? 1.1 : 2.2 + this.r() * 2; this.meow = 1; w.audio && w.audio.meow(this, cur.yowl ? 1.3 : 1); }
    this.meow = Math.max(0, this.meow - dt * 2.2);
    if (cur && cur.purr && !this.held) w.audio && w.audio.purrNear && w.audio.purrNear(this);
    // pose and placement
    rig.root.position.set(this.x, this.y + (this.lift || 0), this.z);
    rig.root.rotation.y = this.heading;
    rig.update(dt, {
      speed: this.speed, look, lookWeight: lookW, cycle: this.held ? this.heldCycle : cur && cur.cycle, airPitch: this.air ? this.air.pitch : null,
      night: w.env.night * 0.7, meow: this.meow * 0.9, tongue: (this.tongueT > 0 ? 1 : 0) + (this.heldTongue || 0), slowBlink: this.slowBlink,
      annoyed: this.annoyed > 0.5, twitch: !!this.alert, lift: 0,
    });
    // memes visible right now
    this.updateMemes();
  }
  setPose(name, over) { this.rig.setPose(name, over); this.poseName = name; }
  step(dt) {
    const w = this.w;
    if (!this.cur) {
      if (!this.plan.length) {
        if (this.cool.think > 0) { this.speed = damp(this.speed, 0, 8, dt); return; }
        this.think(); this.cool.think = 0.2;
        if (!this.plan.length) { this.setPose('sit'); return; }
      }
      this.cur = this.plan.shift(); this.st = 0; this.begin(this.cur);
    }
    const c = this.cur;
    this.st += dt;
    const done = this.run(c, dt);
    if (done) { this.finish(c); this.cur = null; }
  }
  begin(c) {
    const w = this.w;
    if (c.do === 'go') {
      const path = w.house.path(this.x, this.z, c.x, c.z);
      c.path = path || [];
      if (!path) c.fail = true;
      this.setPose(c.run ? 'run' : 'walk');
    } else if (c.do === 'up') {
      const p = c.perch;
      if (p.occ >= p.cap) { c.fail = true; return; }
      p.occ++; c.reserved = true;
      c.from = { x: this.x, y: this.y, z: this.z }; c.to = { x: p.x, y: p.y, z: p.z };
      c.dur = 0.45 + Math.min(0.5, p.y * 0.06); c.h = Math.max(0.5, p.y * 0.25);
      this.heading = Math.atan2(p.x - this.x, p.z - this.z);
      this.setPose('air');
      w.audio && w.audio.hop && w.audio.hop(this);
    } else if (c.do === 'down') {
      if (!this.perch && this.y < 0.05 && !this.climbY) { c.skip = true; return; }
      const p = this.perch;
      const to = p ? { x: p.ax, z: p.az } : w.house.nearestFree(this.x, this.z + 0.6);
      c.from = { x: this.x, y: this.y, z: this.z }; c.to = { x: to.x, y: 0, z: to.z };
      c.dur = 0.4 + Math.min(0.4, this.y * 0.06); c.h = 0.35;
      this.leavePerch();
      if (Math.hypot(to.x - this.x, to.z - this.z) > 0.05) this.heading = Math.atan2(to.x - this.x, to.z - this.z);
      this.setPose('air');
    } else if (c.do === 'face') {
      c.h = Math.atan2(c.x - this.x, c.z - this.z);
    } else if (c.do === 'pose') {
      this.setPose(c.pose, c.over || {});
      if (c.sleep) { c.pile = false; }
      if (c.slowBlink) c.sb = 0;
    } else if (c.do === 'pounce') {
      c.from = { x: this.x, y: this.y, z: this.z }; c.to = { x: c.x, y: 0, z: c.z }; c.dur = 0.4; c.h = 0.45;
      this.setPose('air');
    } else if (c.do === 'zoom') {
      c.i = 0; c.path = null; this.setPose('run');
      w.audio && w.audio.patter && w.audio.patter(this);
    } else if (c.do === 'mischief') {
      this.w.mischiefBegin(this, c);
      if (c.m.kind === 'zoomies') { c.i = 0; this.setPose('run'); }
      else this.setPose(c.pose || 'sit', c.over || {});
      c.dur = c.dur || c.m.windup;
    } else if (c.do === 'call') { c.fn(); c.skip = true; }
  }
  run(c, dt) {
    const w = this.w;
    if (c.skip || c.fail) return true;
    if (c.do === 'go') return this.walk(c, dt, c.run ? 3.6 : 1.55);
    if (c.do === 'up' || c.do === 'down' || c.do === 'pounce') {
      const t = clamp(this.st / c.dur, 0, 1), e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      this.x = lerp(c.from.x, c.to.x, e); this.z = lerp(c.from.z, c.to.z, e);
      this.y = lerp(c.from.y, c.to.y, e) + Math.sin(t * Math.PI) * c.h;
      this.air = { pitch: (0.5 - t) * (c.do === 'down' ? -0.6 : 0.6) };
      this.speed = 0;
      if (t >= 1) {
        this.air = null; this.rig.squash = 0.6;
        if (c.do === 'up') { this.perch = c.perch; this.y = c.perch.y; this.room = c.perch.room; this.heading = this.restHeading(c.perch); }
        else { this.y = 0; this.room = w.house.roomOf(this.x); }
        this.setPose(c.do === 'pounce' ? 'stand' : 'sit');
        return true;
      }
      return false;
    }
    if (c.do === 'face') { this.heading = dampAngle(this.heading, c.h, 8, dt); this.speed = damp(this.speed, 0, 10, dt); return Math.abs(angDiff(this.heading, c.h)) < 0.08 || this.st > 1.2; }
    if (c.do === 'pose') {
      this.speed = damp(this.speed, 0, 10, dt);
      const N = this.d.needs;
      const dm = dt * 60 / 7.5;
      if (c.fun) N.fun = Math.min(100, N.fun + c.fun * dm * 0.9);
      if (c.groom) N.tidy = Math.min(100, N.tidy + dm * 2.5);
      if (c.watch) N.fun = Math.min(100, N.fun + dm * 0.6);
      if (c.slowBlink) { this.slowBlink = this.st > 1.2 && this.st < 2.6 ? Math.sin((this.st - 1.2) / 1.4 * Math.PI) : 0; if (this.st > 2.6 && !c.sbDone) { c.sbDone = true; N.love = Math.min(100, N.love + 4); w.fx && w.fx.hearts(this, 2); } }
      if (c.sleep) { c.pile = w.agents.some(a => a !== this && a.cur && a.cur.sleep && Math.hypot(a.x - this.x, a.z - this.z) < 1.9 && Math.abs(a.y - this.y) < 0.6); if (N.energy >= 99 && this.st > 6) return true; if (this.r() < dt * 0.15) w.fx && w.fx.zzz(this); }
      if (c.asking && N.love > 55) return true;
      return this.st >= c.dur;
    }
    if (c.do === 'zoom') {
      if (!c.path || !c.path.length) {
        if (c.i >= c.pts.length) return true;
        const p = c.pts[c.i++]; c.path = w.house.path(this.x, this.z, p.x, p.z) || [];
      }
      this.walk(c, dt, 4.6, true);
      this.d.needs.fun = Math.min(100, this.d.needs.fun + dt * 6);
      return false;
    }
    if (c.do === 'mischief') {
      const kind = c.m.kind;
      if (kind === 'zoomies') {
        if (!c.path || !c.path.length) {
          if (c.i >= c.zoom.length) { w.mischiefDone(this, c); return true; }
          const p = c.zoom[c.i++]; c.path = w.house.path(this.x, this.z, p.x, p.z) || [];
        }
        this.walk(c, dt, 4.6, true);
        return false;
      }
      this.speed = damp(this.speed, 0, 10, dt);
      if (c.climb) { this.climbY = Math.min(2.6, this.st * 0.7); this.y = this.climbY; this.x = damp(this.x, c.target.x, 4, dt); this.z = damp(this.z, c.target.z, 4, dt); }
      if (c.sitOn) { w.game.laptopBlocked = true; this.d.needs.love = Math.min(100, this.d.needs.love + dt * 0.4); }
      if (this.st >= c.dur) { w.mischiefDone(this, c); if (c.climb) { this.climbY = 0; this.plan.unshift({ do: 'down' }); this.perch = null; } return true; }
      return false;
    }
    return true;
  }
  finish(c) {
    const w = this.w, d = this.d, N = d.needs;
    if (c.do === 'go' && c.fail) { this.plan = []; }
    if (c.do === 'up' && c.fail) { this.plan = []; }
    if (c.do === 'pose') {
      if (c.eat) w.eatAt(this, c.eat);
      if (c.drink) w.drinkAt(this, c.drink);
      if (c.litter) w.useLitter(this, c.litter);
      if (c.post) { d.claws = Math.max(0, d.claws - 60); N.fun = Math.min(100, N.fun + 5); }
      if (c.toy) w.toyBump(c.toy);
      this.slowBlink = 0;
    }
    if (c.do === 'mischief') w.game.laptopBlocked = w.agents.some(a => a !== this && a.alert && a.alert.m.kind === 'laptop');
  }
  restHeading(p) {
    if (p.kind === 'sill') return Math.PI * (this.r() < 0.5 ? 0.15 : -0.15) + (this.r() < 0.35 ? Math.PI : 0);
    if (p.rec) return p.rec.group.rotation.y + (this.r() - 0.5) * 1.2;
    return (this.r() - 0.5) * 1.5;
  }
  walk(c, dt, spd, fast) {
    const p = c.path;
    if (!p || !p.length) { this.speed = damp(this.speed, 0, 10, dt); return true; }
    const tgt = p[0];
    const dx = tgt.x - this.x, dz = tgt.z - this.z, dist = Math.hypot(dx, dz);
    const want = Math.atan2(dx, dz);
    this.heading = dampAngle(this.heading, want, fast ? 12 : 9, dt);
    const turnSlow = clamp(1 - Math.abs(angDiff(this.heading, want)) / 1.6, 0.25, 1);
    const sz = this.rig.size;
    const v = spd * Math.max(0.75, sz) * (this.d.weight > 75 ? 0.8 : 1) * (this.d.age === 'senior' ? 0.85 : 1);
    this.speed = damp(this.speed, v * turnSlow, 6, dt);
    const stepLen = Math.min(dist, this.speed * dt);
    if (dist > 1e-4) { this.x += dx / dist * stepLen; this.z += dz / dist * stepLen; }
    if (dist < 0.12) { p.shift(); if (!p.length) { this.room = this.w.house.roomOf(this.x); return !fast; } }
    this.room = this.w.house.roomOf(this.x);
    if (this.st > 40) { c.path = []; return true; }
    return false;
  }
  updateMemes() {
    const M = this.memes, d = this.d, c = this.cur, pose = this.poseName, w = this.w;
    if (this.held === 'brush' && BREEDS[d.breed].fluff > 0.3) M.add('floof');
    if (!c && !this.held) return;
    if (c && c.meme) M.add(c.meme);
    if (pose === 'loaf' || pose === 'ride') M.add('loaf');
    if (pose === 'sploot') M.add('sploot');
    if (pose === 'belly') M.add('trap');
    if (pose === 'judge') M.add('judge');
    if (pose === 'arch') M.add('cucumber');
    if (pose === 'knead') M.add('biscuits');
    if (pose === 'groom') M.add('groom');
    if (this.tongueT > 0) M.add('blep');
    if (this.meow > 0.3) M.add('meow');
    if (c && c.sleep && c.sunny) M.add('sunbeam');
    if (c && c.sleep && c.pile) M.add('pile');
    if (this.perch && this.perch.inside) M.add('fits');
    if (this.perch && this.perch.kind === 'basket') M.add('laundry');
    if (this.perch && this.y > 3) M.add('perch');
    if (this.perch && this.perch.kind === 'laptop') M.add('keyboard');
    if (this.perch && this.perch.kind === 'ride') M.add('ride');
    if (d.weight > 74) M.add('chonk');
    if (d.age === 'kitten') M.add('kitten');
    if (d.coat === 'black' && w.env.night > 0.6) M.add('void');
    if ((d.coat === 'orange' || d.coat === 'orangewhite') && (this.alert || (c && c.do === 'zoom'))) M.add('brain');
    if (c && c.do === 'zoom') M.add('zoomies');
    if (pose === 'loaf' && w.agents.some(a => a !== this && a.poseName === 'loaf' && Math.hypot(a.x - this.x, a.z - this.z) < 2.4)) M.add('loafpile');
  }
}
