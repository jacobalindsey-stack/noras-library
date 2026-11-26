// Life with Cats — the world: renderer, camera, the house and its cats, the
// bowls and boxes, the messes, the clock, the taps, and the save file.
import * as THREE from '../lib/three.module.min.js';
import * as T from './tex.js';
import { House, Lighting, ROOMS, roomX, RW, RD, STRIDE, WT } from './house.js';
import * as C from './catstuff.js';
import { PAL } from './furniture.js';
import { Agent, MISCHIEF } from './cats.js';
import { CatRig, portrait } from './catmodel.js';
import { Game, loadSave, SAVE_KEY, PHOTO_KEY, DAY_START, DAY_END, hearts } from './game.js';
import { ITEMS, START_ITEMS } from './items.js';
import { stray, COATS, BREEDS, PERS } from './catdata.js';
import { Post } from './post.js';
import { FX } from './fx.js';
import * as A from './audio.js';
import { UI } from './ui.js';
import { Play } from './play.js';
import { clamp, lerp, damp, rng, pick, wait } from './util.js';

const BUILD = {
  toyBall: o => C.toyBall(o.color || PAL.terracotta), toyMouse: () => C.toyMouse(), box: () => C.box(), paperBag: () => C.paperBag(), toyBasket: () => C.toyBasket(),
  tunnel: () => C.tunnel(), birdFeeder: () => C.birdFeeder(), fishTank: () => C.fishTank(), scratchPost: () => C.scratchPost(), scratchPad: () => C.scratchPad(),
  catBed: o => C.catBed(o), windowPerch: () => C.windowPerch(), catTree: o => C.catTree(o), wallShelves: () => C.wallShelves(), feedingStation: () => C.feedingStation(),
  litterBox: o => C.litterBox(o), catGrass: () => C.catGrass(),
};
const KNOCK_MESS = { glass: 'spill', mug: 'broken', vase: 'flowers', clock: 'broken', perfume: 'broken', pens: 'broken', jar: 'broken', plant: 'soil' };
const FOOD = { kibble: { name: 'Crunchy kibble', amt: 46, love: 0, col: '#8a5a32' }, wet: { name: 'Tuna pâté', amt: 54, love: 5, col: '#b5705e' }, fancy: { name: 'Salmon supper', amt: 62, love: 9, fun: 4, col: '#d9805a' } };
export { FOOD };

class World {
  constructor() {
    this.save = loadSave();
    this.game = new Game(this.save);
    this.view = document.getElementById('view');
    this.agents = []; this.placed = []; this.stations = []; this.litters = []; this.messes = []; this.gifts = []; this.falling = []; this.pickables = [];
    this.camRoom = 0; this.t = 0; this.env = this.game.env(); this.lost = false;
    this.touch = matchMedia('(pointer: coarse)').matches;
    if (this.touch) document.body.classList.add('touch');
  }
  // ------------------------------------------------------------ boot
  async boot() {
    const prog = (f, msg) => { document.getElementById('lbar').style.width = Math.round(f * 100) + '%'; if (msg) document.getElementById('lmsg').textContent = msg; };
    prog(0.05, 'Opening the door…'); await wait(30);
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', stencil: false, preserveDrawingBuffer: false });
    r.toneMapping = THREE.NoToneMapping; r.outputColorSpace = THREE.SRGBColorSpace;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    T.setAniso(Math.min(8, r.capabilities.getMaxAnisotropy()));
    this.view.appendChild(r.domElement);
    r.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); this.lost = true; });
    r.domElement.addEventListener('webglcontextrestored', () => { this.lost = false; this.post.rebuild(); this.resize(); });
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#2c2420');
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.5, 140);
    this.post = new Post(r);
    this.fx = new FX(this.scene);
    this.audio = A;
    this.ui = new UI(this);
    this.play = new Play(this);
    prog(0.12, 'Painting the walls…'); await wait(20);
    this.house = new House(this.scene);
    // build room by room so the bar moves
    for (let i = 0; i < ROOMS.length; i++) { this.house.buildRoom(i); prog(0.15 + 0.6 * (i + 1) / ROOMS.length, ['Laying the floorboards…', 'Tiling the kitchen…', 'Making the bed…', 'Watering the sunroom…', 'Hanging the string lights…'][i]); await wait(16); }
    this.house.buildExterior();
    this.house.root.updateMatrixWorld(true);
    for (const rm of this.house.rooms) this.house.registerRoom(rm);
    this.light = new Lighting(this.scene, this.house);
    this.weather = this.makeWeather();
    this.motes = this.makeMotes();
    prog(0.8, 'Fluffing the cushions…'); await wait(16);
    this.applyRooms();
    this.loadWorld();
    prog(0.92, 'Waking up the cats…'); await wait(16);
    this.resize();
    addEventListener('resize', () => this.resize());
    addEventListener('orientationchange', () => setTimeout(() => this.resize(), 250));
    this.input();
    const unlock = () => A.audioUnlock();
    for (const ev of ['pointerdown', 'touchend', 'keydown']) addEventListener(ev, unlock, { passive: true });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { A.audioSuspend(true); A.purr(false); this.persist(); } else A.audioSuspend(false); });
    addEventListener('pagehide', () => this.persist());
    for (const ev of ['gesturestart', 'gesturechange', 'dblclick']) document.addEventListener(ev, e => e.preventDefault(), { passive: false });
    A.setAudio({ sfx: this.game.s.settings.sfx, music: this.game.s.settings.music });
    this.frame(true);
    // warm up the shaders before the curtain goes up
    this.render(0);
    prog(1, 'Ready!'); await wait(60);
    document.getElementById('loading').remove();
    this.last = performance.now();
    requestAnimationFrame(t => this.loop(t));
    this.ui.title();
    this.hooks();
  }
  applyRooms() { this.game.s.rooms.forEach((o, i) => this.house.setUnlocked(i, !!o)); this.house.buildNav(); }

  // ------------------------------------------------------------ save -> world
  loadWorld() {
    const s = this.game.s;
    if (!s.items.length) for (const it of START_ITEMS) { const slot = this.freeSlot(it.kind, it.room); if (slot != null) s.items.push({ kind: it.kind, room: it.room, slot, state: it.kind === 'bowls' ? { food: 0, type: 'kibble', water: 100 } : {} }); }
    for (const it of s.items) this.placeItem(it.kind, it.room, it.slot, it.state || (it.state = {}), true);
    this.applyUpgrades();
    this.house.buildNav();
    for (const c of s.cats) this.spawnAgent(c);
    for (const m of s.messes) this.addMess(m.kind, m.x, m.z, m.room, null, true);
    for (const g of s.floorGifts) this.dropGift(g.id, g.x, g.z, null, true);
    for (const key in s.wear) this.restoreWear(key, s.wear[key]);
    if (s.strayPending) this.showStray(s.strayPending);
    this.game.fillGoals();
  }
  spawnAgent(c, x, z) {
    const a = new Agent(this, c);
    const room = Math.min(this.game.roomsOpen().length - 1, Math.floor(Math.random() * this.game.roomsOpen().length));
    const p = x != null ? { x, z } : this.house.randomFree(this.game.roomsOpen()[room]);
    a.place(p.x, p.z);
    this.agents.push(a);
    return a;
  }
  persist() {
    const s = this.game.s;
    if (!this.house) return;
    s.messes = this.messes.map(m => ({ kind: m.kind, x: m.x, z: m.z, room: m.room }));
    s.floorGifts = this.gifts.map(g => ({ id: g.id, x: g.x, z: g.z }));
    for (const st of this.stations) Object.assign(st.it.state, { food: st.food, type: st.type, water: st.water });
    for (const b of this.litters) b.it.state.dirt = b.dirt;
    this.game.persist();
  }

  // ------------------------------------------------------------ placing things
  freeSlot(kind, room) {
    const def = ITEMS[kind]; if (!def || !def.slot) return null;
    const slots = ROOMS[room].slots;
    for (let i = 0; i < slots.length; i++) {
      const sl = slots[i];
      if (sl.type !== def.slot) continue;
      if (this.placed.some(p => p.room === room && p.slot === i)) continue;
      if (this.game.s.items.some(p => p.room === room && p.slot === i) && !this.placed.length) continue;
      return i;
    }
    return null;
  }
  placeItem(kind, room, slotIdx, state, quiet) {
    const def = ITEMS[kind], sl = ROOMS[room].slots[slotIdx], R = this.house.rooms[room];
    let opts = { ...(def.opts || {}) };
    if (kind === 'litter' && this.game.s.upgrades.robolitter) opts.robot = true;
    const g = BUILD[def.build](opts);
    const rr = rng(room * 31 + slotIdx * 7);
    if (sl.type === 'window' || sl.type === 'outside') {
      const w = ROOMS[room].windows[sl.win];
      if (sl.type === 'window') g.position.set(w.x, w.sill - 0.18, -RD / 2);
      else { g.position.set(w.x + w.w * 0.22, w.sill + w.h * 0.3 - 2.6, -RD / 2 - WT - 1.4); }
    } else if (sl.type === 'wall') g.position.set(sl.x, 0, -RD / 2);
    else { g.position.set(sl.x, 0, sl.z); g.rotation.y = sl.rot ?? (sl.type === 'l' ? (sl.x > 0 ? -0.5 : 0.5) : (rr() - 0.5) * 0.8); }
    if (kind === 'bowls' || kind === 'litter') g.rotation.y = 0;
    R.furniture.add(g);
    const rec = { id: this.house.nextId++, kind: 'item:' + kind, room, group: g, wear: 0, wearable: false, decals: [] };
    g.userData.rec = rec;
    this.house.items.push(rec); this.house.registerItem(rec);
    const pos = new THREE.Vector3(); g.getWorldPosition(pos);
    const it = { kind, def, room, slot: slotIdx, rec, pos, state, win: sl.win != null ? R.windows[sl.win] : null, hide: g.userData.hide ? { x: pos.x + g.userData.hide.x, z: pos.z + g.userData.hide.z } : null };
    this.placed.push(it);
    if (kind === 'bowls') this.addStation(it);
    if (kind === 'litter') this.addLitter(it);
    if (kind === 'feeder') { it.birds = g.userData; g.userData.birdsOn = 0; }
    if (!quiet) { this.house.buildNav(); this.fx.sparkle(pos.x, 0.5, pos.z, 8); A.sparkle(); }
    return it;
  }
  addStation(it) {
    const ud = it.rec.group.userData, fp = new THREE.Vector3(), wp = new THREE.Vector3();
    ud.food.getWorldPosition(fp); ud.water.getWorldPosition(wp);
    const a = this.house.nearestFree((fp.x + wp.x) / 2, fp.z + 1.0);
    const st = { it, room: it.room, pos: fp, wpos: wp, ax: a.x, az: a.z, food: it.state.food ?? 0, type: it.state.type || 'kibble', water: it.state.water ?? 100, foodMesh: ud.food.userData.fill, waterMesh: ud.water.userData.fill, bowl: ud.food, waterBowl: ud.water };
    st.foodMesh.material = st.foodMesh.material.clone();
    this.stations.push(st); this.stationVisual(st);
    this.pickables.push({ obj: ud.food, type: 'food', ref: st }, { obj: ud.water, type: 'water', ref: st });
  }
  stationVisual(st) {
    st.foodMesh.count = Math.min(40, Math.round(st.food * 7));
    st.foodMesh.material.color.set(FOOD[st.type].col);
    st.waterMesh.visible = this.game.s.upgrades.fountain || st.water > 2;
    st.waterMesh.position.y = 0.08 + 0.11 * (this.game.s.upgrades.fountain ? 1 : st.water / 100);
    st.waterMesh.scale.setScalar(0.75 + 0.25 * (this.game.s.upgrades.fountain ? 1 : st.water / 100));
  }
  addLitter(it) {
    const p = new THREE.Vector3(); it.rec.group.getWorldPosition(p);
    const b = { it, room: it.room, pos: p, dirt: it.state.dirt || 0, clumps: it.rec.group.userData.clumps || [], robot: !!it.rec.group.userData.robot };
    this.litters.push(b); this.litterVisual(b);
    this.pickables.push({ obj: it.rec.group, type: 'litter', ref: b });
  }
  litterVisual(b) { b.clumps.forEach((c, i) => c.visible = b.dirt > 12 + i * 15); }
  applyUpgrades() {
    const u = this.game.s.upgrades;
    for (const st of this.stations) {
      if (u.fountain && !st.fountain) { const f = C.fountain(); f.scale.setScalar(0.62); f.position.copy(st.waterBowl.position); st.waterBowl.parent.add(f); st.waterBowl.visible = false; st.fountain = f; f.userData.rec = st.it.rec; this.house.items.push({ id: this.house.nextId++, kind: 'fountain', room: st.room, group: f, decals: [] }); }
      if (u.autofeeder && !st.feeder) { const f = C.autoFeeder(); f.position.set(-0.45, 0, -0.75); f.scale.setScalar(0.8); st.it.rec.group.add(f); st.feeder = f; }
      this.stationVisual(st);
    }
    if (u.robolitter) for (const b of this.litters) if (!b.robot) {
      const it = b.it, g = it.rec.group, parent = g.parent;
      const ng = C.litterBox({ robot: true }); ng.position.copy(g.position); ng.rotation.copy(g.rotation); parent.add(ng); parent.remove(g);
      this.house.removeItem(it.rec);
      const rec = { id: this.house.nextId++, kind: 'item:litter', room: it.room, group: ng, wear: 0, decals: [] }; ng.userData.rec = rec; this.house.items.push(rec); this.house.registerItem(rec);
      it.rec = rec; b.robot = true; b.clumps = []; b.dirt = 0;
      const pk = this.pickables.find(p => p.ref === b); if (pk) pk.obj = ng;
    }
    if (u.vacuum && !this.vacuum) this.makeVacuum();
    this.house.buildNav();
  }

  // ------------------------------------------------------------ what agents ask the world
  findFood(a) {
    const open = this.game.s.rooms;
    const list = this.stations.filter(s => s.food > 0 && open[s.room]);
    if (!list.length) return null;
    list.sort((p, q) => Math.abs(p.room - a.room) - Math.abs(q.room - a.room));
    return list[0];
  }
  eatAt(a, st) {
    if (st.food <= 0) { a.d.needs.love = Math.max(0, a.d.needs.love - 2); return; }
    st.food = Math.max(0, st.food - 1); this.stationVisual(st);
    const F = FOOD[st.type], N = a.d.needs, P = a.P;
    let amt = F.amt, love = F.love;
    if (P.picky && st.type === 'kibble') { amt -= 8; love -= 3; }
    const over = N.food > 80 ? 1.6 : 1;
    N.food = Math.min(100, N.food + amt); N.love = clamp(N.love + love, 0, 100); if (F.fun) N.fun = Math.min(100, N.fun + F.fun);
    a.d.weight += (st.type === 'fancy' ? 0.6 : st.type === 'wet' ? 0.45 : 0.35) * (P.gain || 1) * over;
  }
  drinkAt(a, st) { if (!this.game.s.upgrades.fountain) { st.water = Math.max(0, st.water - 10); this.stationVisual(st); } else a.d.needs.fun = Math.min(100, a.d.needs.fun + 2); }
  useLitter(a, b) {
    a.d.bladder = 0; b.dirt = Math.min(100, b.dirt + 22 * (a.d.weight > 70 ? 1.2 : 1)); this.litterVisual(b);
    if (b.robot) setTimeout(() => { b.dirt = 0; this.litterVisual(b); }, 2500);
  }
  litterDirty(room) { return this.litters.some(b => this.game.s.rooms[b.room] && b.dirt > 60) || !this.litters.length; }
  nearestLitter(a) {
    const list = this.litters.filter(b => this.game.s.rooms[b.room]);
    if (!list.length) return null;
    list.sort((p, q) => (p.dirt > 70) - (q.dirt > 70) || Math.abs(p.room - a.room) - Math.abs(q.room - a.room));
    return list[0];
  }
  hasPost(room) { return this.placed.some(p => p.room === room && p.def.post); }
  hasGrass(room) { return this.placed.some(p => p.room === room && p.def.grass); }
  sunSpot(room) {
    const e = this.env; if (e.daylight < 0.55 || e.weather !== 'clear' || !this.light.sunDir) return null;
    const R = this.house.rooms[room]; if (!R || !R.unlocked) return null;
    const d = this.light.sunDir;
    for (const w of R.windows) {
      const c = w.center, t = -(w.def.sill + w.def.h * 0.4) / d.y;
      const x = c.x + d.x * t, z = c.z + d.z * t;
      if (Math.abs(x - R.X) > RW / 2 - 1 || z > RD / 2 - 1 || z < -RD / 2 + 0.6) continue;
      const [i, j] = this.house.cellOf(x, z);
      if (this.house.free(i, j)) return { x, z };
    }
    return null;
  }
  fireSpot() { return this.env.fire > 0.3 && this.game.s.rooms[0] ? { x: roomX(0) + 4.4, z: -2.6, room: 0 } : null; }
  breadReady() { const b = this.bread(); return b && b.loaf.visible; }
  bread() { const it = this.house.items.find(i => i.kind === 'counterRun'); return it ? { loaf: it.group.userData.bread.userData.loaf, bag: it.group.userData.bread, rec: it } : null; }
  breadSpot() { const b = this.bread(); const p = new THREE.Vector3(); b.bag.getWorldPosition(p); return { x: p.x, z: p.z, y: p.y }; }
  kitchenThing(kind) {
    const it = this.house.items.find(i => i.kind === (kind === 'sack' ? 'foodSack' : 'trashCan'));
    if (!it || !this.game.s.rooms[it.room] || it.knocked) return null;
    const p = new THREE.Vector3(); it.group.getWorldPosition(p);
    const a = this.house.nearestFree(p.x, p.z + 1.1);
    return { x: p.x, z: p.z, ax: a.x, az: a.z, rec: it };
  }
  toyBump(it) { const g = it.rec.group; if (it.def.build === 'toyBall' || it.def.build === 'toyMouse') { g.position.x += (Math.random() - 0.5) * 0.5; g.position.z += (Math.random() - 0.5) * 0.4; g.rotation.y += Math.random() * 2; } }

  // ------------------------------------------------------------ mischief
  mischiefBegin(a, step) {
    a.alert = { m: step.m, t: 0, dur: step.dur || step.m.windup || 0, step };
    if (step.m.kind === 'laptop') this.game.laptopBlocked = true;
    this.ui.mischief(a);
  }
  mischiefEnd(a, ok) { this.ui.clearAlert(a); if (a.alert && a.alert.m.kind === 'laptop') this.game.laptopBlocked = this.agents.some(b => b !== a && b.alert && b.alert.m.kind === 'laptop'); }
  mischiefDone(a, step) {
    const kind = step.m.kind, s = this.game.s, t = step.target, d = a.d;
    a.alert = null; this.ui.clearAlert(a);
    s.today.mischief++; s.stats.mischief++; d.stats.mischief = (d.stats.mischief || 0) + 1;
    let msg = null;
    if (kind === 'knock') { this.knockOff(t, a); msg = `${a.name} knocked ${t.kind === 'glass' ? 'your water glass' : t.kind === 'mug' ? 'your mug' : t.kind === 'clock' ? 'the clock' : 'something'} onto the floor.`; d.needs.fun = Math.min(100, d.needs.fun + 22); d.needs.love = Math.min(100, d.needs.love + 6); }
    else if (kind === 'scratch') { this.wear(t.rec, 24, t); d.claws = Math.max(0, d.claws - 50); msg = `${a.name} shredded the ${niceName(t.rec.kind)}.`; }
    else if (kind === 'curtain') { this.curtainWear(t.win, t.curtain, 30); d.needs.fun = Math.min(100, d.needs.fun + 25); msg = `${a.name} climbed the curtains.`; }
    else if (kind === 'plant') { t.eaten = Math.min(t.leaves.length, t.eaten + 3); this.chewVisual(t); d.needs.fun = Math.min(100, d.needs.fun + 12); msg = `${a.name} munched a houseplant.`; if (Math.random() < 0.6) setTimeout(() => { if (this.agents.includes(a)) this.addMess('leaves', a.x, a.z + 0.4, a.room); }, 9000); }
    else if (kind === 'zoomies') { d.needs.fun = Math.min(100, d.needs.fun + 30); const plants = this.house.items.filter(i => i.kind === 'bigPlant' && i.room === a.room && !i.toppled); if (plants.length && Math.random() < 0.5) { const p = pick(plants); const pp = new THREE.Vector3(); p.group.getWorldPosition(pp); p.group.rotation.z = 0.25; p.toppled = true; this.addMess('soil', pp.x + 0.6, pp.z + 0.8, a.room, { plantTip: p }); A.crash('pot'); msg = `${a.name} zoomed into the plant pot!`; } else msg = null; }
    else if (kind === 'laptop') { msg = null; }
    else if (kind === 'counter') { const b = this.bread(); b.loaf.visible = false; d.needs.food = Math.min(100, d.needs.food + 35); d.weight += 1.6 * (a.P.gain || 1); const sp = this.breadSpot(); this.addMess('crumbs', sp.x, sp.z + 1.6, 1); msg = `${a.name} stole the bread from the Cat Bakery!`; A.thud(); }
    else if (kind === 'sack') { t.rec.knocked = true; t.rec.group.rotation.z = 1.2; t.rec.group.position.y = 0.4; this.addMess('kibble', t.x, t.z + 1.0, t.rec.room); const lost = Math.min(3, s.pantry.kibble); s.pantry.kibble -= lost; d.needs.food = Math.min(100, d.needs.food + 30); d.weight += 1.2 * (a.P.gain || 1); msg = `${a.name} raided the kibble sack${lost ? ` (−${lost} kibble)` : ''}.`; A.kibble(); }
    else if (kind === 'trash') { t.rec.knocked = true; t.rec.group.rotation.x = 1.45; t.rec.group.position.y = 0.45; this.addMess('trash', t.x + 0.4, t.z + 1.4, t.rec.room); msg = `${a.name} tipped over the bin.`; A.crash('pot'); }
    else if (kind === 'yowl') { msg = `${a.name} yowled at the top of their lungs.`; d.needs.love = Math.min(100, d.needs.love + 5); }
    else if (kind === 'shelf') { this.addMess('books', a.x + 0.3, a.z + 1.2, a.room); A.thud(); msg = `${a.name} pushed books off the shelf.`; d.needs.fun = Math.min(100, d.needs.fun + 20); }
    else if (kind === 'accident') { this.addMess('puddle', a.x, a.z, a.room); d.bladder = 0; msg = `${a.name} had an accident. ${this.litters.some(b => b.dirt > 60) ? 'The litter box needs scooping!' : ''}`; }
    else if (kind === 'hairball') { this.addMess('hairball', a.x + Math.sin(a.heading) * 0.6, a.z + Math.cos(a.heading) * 0.6, a.room); d.needs.tidy = Math.min(100, d.needs.tidy + 12); msg = `${a.name} coughed up a hairball. A brushing would help.`; }
    if (msg) this.ui.toast(msg, 'bad', MISCHIEF[kind].icon, a.room !== this.camRoom ? a.room : null);
    this.game.emit('mischief', { cat: d.id, kind });
  }
  knockOff(k, a) {
    const o = k.obj;
    this.scene.attach(o);
    const p = new THREE.Vector3(); o.getWorldPosition(p);
    let dx = p.x - a.x, dz = p.z - a.z; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
    this.falling.push({ o, k, v: new THREE.Vector3(dx * 1.8, 1.4, dz * 1.8), spin: new THREE.Vector3((Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 8) });
    k.state = 'falling';
  }
  updateFalling(dt) {
    for (let i = this.falling.length - 1; i >= 0; i--) {
      const f = this.falling[i];
      f.v.y -= 11 * dt; f.o.position.addScaledVector(f.v, dt);
      f.o.rotation.x += f.spin.x * dt; f.o.rotation.z += f.spin.z * dt;
      if (f.o.position.y <= 0.05) {
        this.falling.splice(i, 1);
        f.o.visible = false; f.k.state = 'fallen';
        const kind = KNOCK_MESS[f.k.kind] || 'broken';
        A.crash(f.k.kind === 'glass' || f.k.kind === 'perfume' ? 'glass' : 'pot');
        const p = this.house.nearestFree(f.o.position.x, f.o.position.z);
        this.addMess(kind, f.o.position.x, Math.max(-RD / 2 + 0.6, f.o.position.z), f.k.room, { knock: f.k });
        this.fx.puff(f.o.position.x, 0.2, f.o.position.z, 5);
      }
    }
  }
  respawnKnock(k) {
    const o = k.obj; k.home.parent.add(o); o.position.copy(k.home.pos); o.rotation.copy(k.home.rot); o.visible = true; k.state = 'ok';
  }
  wear(rec, amt, spot) {
    if (!rec) return;
    rec.wear = Math.min(100, (rec.wear || 0) + amt);
    this.game.s.wear[rec.wearKey || this.wearKey(rec)] = rec.wear;
    this.addDecal(rec, spot);
    if (!this.pickables.some(p => p.ref === rec)) this.pickables.push({ obj: rec.group, type: 'repair', ref: rec });
  }
  wearKey(rec) { const list = this.house.items.filter(i => i.room === rec.room && i.kind === rec.kind); rec.wearKey = `f:${rec.room}:${rec.kind}:${list.indexOf(rec)}`; return rec.wearKey; }
  addDecal(rec, spot) {
    const pts = this.house.scratch.filter(s => s.rec === rec);
    const s = spot || pick(pts); if (!s) return;
    const d = C.clawMark(0.55 + Math.random() * 0.2, 0.6 + Math.random() * 0.2);
    d.position.set(s.x + s.nx * 0.05 + (Math.random() - 0.5) * 0.4, s.y + (Math.random() - 0.5) * 0.35, s.z + s.nz * 0.05);
    d.rotation.y = Math.atan2(s.nx, s.nz);
    if (s.low) { d.rotation.x = -Math.PI / 2 + 0.3; d.position.y = s.y + 0.05; }
    this.scene.add(d); rec.decals.push(d);
  }
  curtainWear(win, curtain, amt) {
    const key = `c:${win.room}:${win.wi}:${win.curtains.indexOf(curtain)}`;
    const v = Math.min(100, (this.game.s.wear[key] || 0) + amt); this.game.s.wear[key] = v;
    this.curtainVisual(curtain, v);
    if (!this.pickables.some(p => p.obj === curtain)) this.pickables.push({ obj: curtain, type: 'curtain', ref: { win, curtain, key } });
  }
  curtainVisual(c, v) {
    c.rotation.z = (c.position.x > 0 ? 1 : -1) * 0.08 * (v / 30); c.scale.y = 1 - v * 0.0015;
    if (!c.userData.decal && v > 0) { const d = C.clawMark(0.7, 0.9); d.position.set(0, -0.6, 0.18); c.add(d); c.userData.decal = d; }
    if (c.userData.decal) c.userData.decal.visible = v > 0;
  }
  chewVisual(ch) { ch.leaves.forEach((l, i) => l.visible = i >= ch.eaten); }
  restoreWear(key, v) {
    if (key.startsWith('f:')) {
      const [, room, kind, idx] = key.split(':');
      const rec = this.house.items.filter(i => i.room === +room && i.kind === kind)[+idx];
      if (rec) { rec.wear = v; rec.wearKey = key; for (let k = 0; k < Math.ceil(v / 24); k++) this.addDecal(rec); this.pickables.push({ obj: rec.group, type: 'repair', ref: rec }); }
    } else if (key.startsWith('c:')) {
      const [, room, wi, ci] = key.split(':');
      const win = this.house.rooms[+room].windows[+wi]; const c = win && win.curtains[+ci];
      if (c) { this.curtainVisual(c, v); this.pickables.push({ obj: c, type: 'curtain', ref: { win, curtain: c, key } }); }
    }
  }
  repairCost(rec) { return Math.round(10 + (rec.wear || 0) * 0.35); }
  repair(rec) {
    const cost = this.repairCost(rec); if (!this.game.spend(cost)) return false;
    for (const d of rec.decals) this.scene.remove(d);
    rec.decals = []; rec.wear = 0; delete this.game.s.wear[rec.wearKey];
    this.pickables = this.pickables.filter(p => p.ref !== rec);
    const p = new THREE.Vector3(); rec.group.getWorldPosition(p); this.fx.sparkle(p.x, 1.2, p.z, 10); A.sparkle();
    return true;
  }
  repairCurtain(ref) {
    if (!this.game.spend(15)) return false;
    delete this.game.s.wear[ref.key]; this.curtainVisual(ref.curtain, 0);
    this.pickables = this.pickables.filter(p => p.obj !== ref.curtain); A.sparkle();
    return true;
  }

  // ------------------------------------------------------------ messes & presents
  addMess(kind, x, z, room, link, quiet) {
    const p = this.house.nearestFree(x, z);
    if (Math.abs(p.x - x) < 1.2 && Math.abs(p.z - z) < 1.2) { x = p.x; z = p.z; }
    z = clamp(z, -RD / 2 + 0.5, RD / 2 - 0.6);
    const g = C.mess(kind); g.position.set(x, 0, z); g.rotation.y = Math.random() * 6; g.add(hitDisc(0.75));
    this.scene.add(g);
    const m = { id: Math.random().toString(36).slice(2), kind, x, z, room, g, link };
    this.messes.push(m);
    this.pickables.push({ obj: g, type: 'mess', ref: m });
    if (!quiet) this.game.cozyDirty = true;
    return m;
  }
  cleanMess(m, byVacuum) {
    this.scene.remove(m.g); this.messes = this.messes.filter(x => x !== m); this.pickables = this.pickables.filter(p => p.ref !== m);
    this.fx.sparkle(m.x, 0.3, m.z, 6);
    if (!byVacuum) { A.sparkle(); this.game.xp(2); this.game.s.stats.cleans++; this.game.emit('clean'); }
    if (m.link && m.link.knock) setTimeout(() => this.respawnKnock(m.link.knock), 6000);
    if (m.link && m.link.plantTip) { m.link.plantTip.group.rotation.z = 0; m.link.plantTip.toppled = false; }
  }
  dropGift(id, x, z, a, quiet) {
    const g = C.giftMesh(id); g.position.set(x, 0, z); g.rotation.y = Math.random() * 6; g.add(hitDisc(0.6)); this.scene.add(g);
    const gift = { id, x, z, room: this.house.roomOf(x), g, from: a ? a.name : null };
    this.gifts.push(gift); this.pickables.push({ obj: g, type: 'gift', ref: gift });
    if (!quiet && a) { this.ui.toast(`${a.name} brought you a present!`, 'gold', 'gift', gift.room !== this.camRoom ? gift.room : null); A.trill(a); }
  }
  collectGift(gift) {
    this.scene.remove(gift.g); this.gifts = this.gifts.filter(x => x !== gift); this.pickables = this.pickables.filter(p => p.ref !== gift);
    const s = this.game.s, first = !s.gifts[gift.id];
    s.gifts[gift.id] = (s.gifts[gift.id] || 0) + 1;
    const G = C.GIFTS.find(g => g.id === gift.id);
    this.fx.sparkle(gift.x, 0.3, gift.z, 8); A.chime();
    this.game.xp(4); if (first) this.game.earn(10);
    this.ui.toast(`${first ? 'New treasure! ' : ''}${G.name}. ${G.note}`, 'gold', 'gift');
    this.game.emit('gift');
  }

  // ------------------------------------------------------------ the stray at the window
  showStray(cat) {
    this.hideStray();
    const rig = new CatRig(cat); rig.setPose('sit'); rig.update(0, { snap: true });
    const w = this.house.rooms[0].windows[0];
    rig.root.position.set(roomX(0) + w.def.x + 0.3, w.def.sill - 0.02, -RD / 2 - WT - 0.35);
    rig.root.rotation.y = 0.2;
    this.scene.add(rig.root);
    this.strayRig = rig; this.strayCat = cat;
    this.pickables.push({ obj: rig.root, type: 'stray', ref: cat });
  }
  hideStray() { if (this.strayRig) { this.scene.remove(this.strayRig.root); this.strayRig.dispose(); this.pickables = this.pickables.filter(p => p.type !== 'stray'); this.strayRig = null; } }
  welcome(cat, source) {
    const s = this.game.s;
    cat.adoptedDay = s.day; cat.source = source;
    s.cats.push(cat); s.stats.adopted++;
    s.catalogue[cat.breed + ':' + cat.coat] = true;
    let a;
    if (source === 'cds' && this.strayRig) {
      const w = this.house.rooms[0].windows[0];
      a = this.spawnAgent(cat, roomX(0) + w.def.x, -2.5);
      a.x = roomX(0) + w.def.x; a.z = -RD / 2 + 0.25; a.y = w.def.sill + 0.1; a.perch = null;
      a.plan = [{ do: 'down' }, { do: 'pose', pose: 'sit', dur: 2, lookCam: true, meowing: true }];
      this.hideStray(); s.strayPending = null;
    } else {
      const room = this.game.s.rooms[this.camRoom] ? this.camRoom : 0;
      a = this.spawnAgent(cat, roomX(room) + (Math.random() - 0.5) * 3, 3.2);
      a.plan = [{ do: 'pose', pose: 'sit', dur: 2.5, lookCam: true, meowing: true }];
    }
    this.fx.sparkle(a.x, 1, a.z, 10); this.fx.hearts(a, 4); A.meow(a);
    this.ui.portraitOf(cat, true);
    this.game.emit('adopt', { cat: cat.id });
    this.persist();
    return a;
  }
  // ------------------------------------------------------------ the robot vacuum
  makeVacuum() {
    const g = C.robotVacuum(); this.scene.add(g);
    const p = this.house.randomFree(0); g.position.set(p.x, 0, p.z);
    const perch = this.house.addPerch({ room: 0, x: p.x, y: 0.3, z: p.z, kind: 'ride', cap: 1, nap: 0, moving: true, ax: p.x, az: p.z + 0.6 });
    this.vacuum = { g, perch, target: null, wait: 0, room: 0 };
  }
  updateVacuum(dt) {
    const v = this.vacuum; if (!v) return;
    const busy = this.agents.some(a => a.cur && a.cur.do === 'up' && a.cur.perch === v.perch) || this.agents.some(a => a.plan.some(s => s.perch === v.perch) && !a.perch);
    if (v.wait > 0) v.wait -= dt;
    if (!busy && v.wait <= 0) {
      if (!v.target || Math.hypot(v.target.x - v.g.position.x, v.target.z - v.g.position.z) < 0.2) {
        const m = this.messes.find(m => ['fur', 'hairball', 'crumbs', 'kibble', 'leaves'].includes(m.kind) && this.game.s.rooms[m.room]);
        if (v.target && v.target.mess && this.messes.includes(v.target.mess)) { this.cleanMess(v.target.mess, true); }
        v.target = m ? { x: m.x, z: m.z, mess: m } : (() => { const p = this.house.randomFree(this.game.roomsOpen()[Math.floor(Math.random() * this.game.roomsOpen().length)]); return { x: p.x, z: p.z }; })();
        v.path = this.house.path(v.g.position.x, v.g.position.z, v.target.x, v.target.z) || [];
        if (Math.random() < 0.3) v.wait = 3;
      }
      const p = v.path && v.path[0];
      if (p) {
        const dx = p.x - v.g.position.x, dz = p.z - v.g.position.z, d = Math.hypot(dx, dz);
        const sp = 0.9 * dt;
        if (d < 0.1) v.path.shift(); else { v.g.position.x += dx / d * Math.min(d, sp); v.g.position.z += dz / d * Math.min(d, sp); v.g.rotation.y = Math.atan2(dx, dz); }
      } else v.target = null;
    }
    v.perch.x = v.g.position.x; v.perch.z = v.g.position.z; v.perch.room = this.house.roomOf(v.perch.x);
    // now and then an idle cat hops on for a ride
    v.invite = (v.invite ?? 25) - dt;
    if (v.invite <= 0 && v.perch.occ === 0) {
      v.invite = 35 + Math.random() * 40;
      const a = this.agents.find(a => !a.held && !a.alert && !a.perch && a.room === v.perch.room && (!a.cur || a.cur.do === 'pose') && !(a.cur && a.cur.sleep));
      if (a) { a.cancel(); a.setPlan([...a.goPerch(v.perch), { do: 'pose', pose: 'ride', dur: 12, meme: 'ride' }, { do: 'down' }], 'ride'); v.wait = 6; }
    }
    const ap = this.house.nearestFree(v.perch.x, v.perch.z + 0.7); v.perch.ax = ap.x; v.perch.az = ap.z;
    for (const a of this.agents) if (a.perch === v.perch && !a.cur?.do?.startsWith?.('d')) { a.x = v.perch.x; a.z = v.perch.z; a.y = 0.3; a.heading = v.g.rotation.y; a.room = v.perch.room; }
  }

  // ------------------------------------------------------------ weather & dust
  makeWeather() {
    const n = 500, pos = new Float32Array(n * 6);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const rain = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#c8d6e0', transparent: true, opacity: 0.5, depthWrite: false }));
    rain.frustumCulled = false; this.scene.add(rain);
    const sp = new Float32Array(n * 3), sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    const snow = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 0.12, transparent: true, opacity: 0.9, depthWrite: false, map: T.blob({ color: '255,255,255', a: 1, mid: 0.6 }) }));
    snow.frustumCulled = false; this.scene.add(snow);
    const seeds = Array.from({ length: n }, () => [Math.random(), Math.random(), Math.random()]);
    return { rain, snow, seeds, n };
  }
  updateWeather(dt) {
    const W = this.weather, w = this.env.weather, X = roomX(this.camRoom);
    W.rain.visible = w === 'rain'; W.snow.visible = w === 'snow';
    if (!W.rain.visible && !W.snow.visible) return;
    const P = (w === 'rain' ? W.rain : W.snow).geometry.attributes.position.array, t = this.t;
    for (let i = 0; i < W.n; i++) {
      const s = W.seeds[i];
      const x = X + (s[0] - 0.5) * 16, z = -RD / 2 - WT - 0.25 - s[2] * 2.2;
      if (w === 'rain') { const y = 9 - ((t * 9 + s[1] * 9) % 9); P[i * 6] = x; P[i * 6 + 1] = y; P[i * 6 + 2] = z; P[i * 6 + 3] = x - 0.05; P[i * 6 + 4] = y - 0.35; P[i * 6 + 5] = z; }
      else { const y = 9 - ((t * 0.7 + s[1] * 9) % 9); P[i * 3] = x + Math.sin(t + s[2] * 9) * 0.3; P[i * 3 + 1] = y; P[i * 3 + 2] = z; }
    }
    (w === 'rain' ? W.rain : W.snow).geometry.attributes.position.needsUpdate = true;
  }
  makeMotes() {
    const n = 90, p = new Float32Array(n * 3), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const m = new THREE.Points(g, new THREE.PointsMaterial({ color: '#fff0c8', size: 0.05, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, map: T.blob({ color: '255,240,200', a: 1, mid: 0.4 }) }));
    m.frustumCulled = false; this.scene.add(m);
    return { m, seeds: Array.from({ length: n }, () => [Math.random(), Math.random(), Math.random(), Math.random()]) };
  }
  updateMotes() {
    const M = this.motes, R = this.house.rooms[this.camRoom];
    const op = this.env.daylight * (this.env.weather === 'clear' ? 0.85 : 0.2);
    M.m.material.opacity = R.unlocked ? op : 0;
    if (!op || !R.windows.length) return;
    const P = M.m.geometry.attributes.position.array, t = this.t, d = this.light.sunDir;
    M.seeds.forEach((s, i) => {
      const w = R.windows[i % R.windows.length].def;
      const u = (s[0] + t * 0.004 * (0.5 + s[3])) % 1;
      const L = (w.sill + w.h * 0.5) / Math.max(0.2, -d.y) * u;
      P[i * 3] = R.X + w.x + (s[1] - 0.5) * w.w + d.x * L + Math.sin(t * 0.3 + i) * 0.15;
      P[i * 3 + 1] = Math.max(0.2, w.sill + s[2] * w.h + d.y * L + Math.sin(t * 0.5 + i * 2) * 0.1);
      P[i * 3 + 2] = -RD / 2 + d.z * L;
    });
    M.m.geometry.attributes.position.needsUpdate = true;
  }

  // ------------------------------------------------------------ camera
  resize() {
    const w = Math.max(1, innerWidth), h = Math.max(1, innerHeight);
    const pr = this.pixelRatio();
    this.renderer.setPixelRatio(pr); this.renderer.setSize(w, h, false);
    this.post.setSize(w, h, pr);
    this.portrait = h > w * 1.05;
    this.camera.fov = this.portrait ? 46 : 36;
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.frame(false);
    this.ui && this.ui.layout();
  }
  pixelRatio() { const dpr = devicePixelRatio || 1; const q = this.game.s.settings.quality; if (q === 'low') return Math.min(dpr, 1); if (q === 'high') return Math.min(dpr, this.touch ? 1.75 : 2); return this.autoPR ?? Math.min(dpr, 1.5); }
  get zoomed() { return this.portrait || (this.ui && this.ui.photoMode); }
  get halfWP() { return this.portrait ? 3.9 : 4.4; }
  panLimit() { return RW / 2 - this.halfWP + 0.5; }
  roomView(i) {
    const a = this.camera.aspect;
    if (this.zoomed) {
      const X = roomX(i) + (this.panX || 0);
      const hf = Math.atan(Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2) * a);
      const dist = this.halfWP / Math.tan(hf);
      if (!this.portrait) return { pos: new THREE.Vector3(X, 5.6, 5.4 + dist), look: new THREE.Vector3(X, 1.7, -1.4) };
      return { pos: new THREE.Vector3(X, 9.2, 5.4 + dist), look: new THREE.Vector3(X, 2.1, -1.6) };
    }
    const X = roomX(i);
    const vf = THREE.MathUtils.degToRad(this.camera.fov) / 2, hf = Math.atan(Math.tan(vf) * a);
    const halfW = 7.5, halfH = this.portrait ? 5.0 : 4.3;
    const dist = Math.max(halfW / Math.tan(hf), halfH / Math.tan(vf));
    const up = this.portrait ? 4.0 : 2.4;
    return { pos: new THREE.Vector3(X, 4.0 + up, 5.4 + dist), look: new THREE.Vector3(X, 2.9 - (this.portrait ? 0.4 : 0), 5.4 - 8) };
  }
  frame(snap) {
    if (!this.camera) return;
    const v = this.focus ? this.focusView() : this.roomView(this.camRoom);
    this.camTarget = v;
    if (snap || !this.camPos) { this.camPos = v.pos.clone(); this.camLook = v.look.clone(); }
  }
  focusView() {
    const a = this.focus, s = a.rig.size;
    const p = new THREE.Vector3(a.x, a.y + 0.7 * s, a.z);
    const dist = (this.portrait ? 5.6 : 4.4) * Math.max(0.8, s);
    return { pos: new THREE.Vector3(p.x + 0.3, p.y + dist * 0.95 + 0.4, Math.min(p.z + dist, 9)), look: p.clone().add(new THREE.Vector3(0, this.portrait ? -0.2 : 0.05, 0)) };
  }
  setRoom(i, quiet, pan = 0) {
    i = clamp(i, 0, ROOMS.length - 1); if (i === this.camRoom && !quiet) return;
    this.camRoom = i; this.panX = pan; this.frame(); this.ui.roomChanged(); if (!quiet) A.soft();
  }
  // on a tall phone screen you drag through the room; past the edge you slide into the next one
  dragPan(dx) {
    const upp = (this.halfWP * 2) / innerWidth, lim = this.panLimit();
    this.panX = (this.panX || 0) - dx * upp;
    if (this.panX > lim) { this.panOver = (this.panOver || 0) + this.panX - lim; this.panX = lim; }
    else if (this.panX < -lim) { this.panOver = (this.panOver || 0) + this.panX + lim; this.panX = -lim; }
    else this.panOver = 0;
    if (this.panOver > 1.6 && this.camRoom < ROOMS.length - 1) { this.panOver = 0; this.setRoom(this.camRoom + 1, false, -lim); return; }
    if (this.panOver < -1.6 && this.camRoom > 0) { this.panOver = 0; this.setRoom(this.camRoom - 1, false, lim); return; }
    this.frame();
    const v = this.camTarget; this.camPos.x = v.pos.x; this.camLook.x = v.look.x;
  }
  setFocus(a) { this.focus = a; this.frame(); }
  updateCamera(dt) {
    if (this.focus) this.camTarget = this.focusView();
    const k = 1 - Math.exp(-(this.focus ? 5 : 3.6) * dt);
    this.camPos.lerp(this.camTarget.pos, k); this.camLook.lerp(this.camTarget.look, k);
    const sway = this.game.s.settings.motion ? 0.025 : 0;
    this.camera.position.set(this.camPos.x + Math.sin(this.t * 0.31) * sway, this.camPos.y + Math.sin(this.t * 0.23) * sway, this.camPos.z);
    this.camera.lookAt(this.camLook);
    // keep the sharp band of the miniature on the cats
    const ly = this.camLook.clone().project(this.camera).y * 0.5 + 0.5;
    this.post.u.focusY.value = damp(this.post.u.focusY.value, this.focus ? ly : clamp(ly - 0.08, 0.3, 0.6), 4, dt);
    this.post.u.band.value = this.focus ? 0.16 : (this.portrait ? 0.17 : 0.22);
  }

  // ------------------------------------------------------------ input
  input() {
    const el = this.renderer.domElement;
    let down = null;
    el.addEventListener('pointerdown', e => {
      el.setPointerCapture && el.setPointerCapture(e.pointerId);
      down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
      if (this.play.active) this.play.pointer('down', e);
    });
    el.addEventListener('pointermove', e => {
      if (this.play.active) { this.play.pointer('move', e); return; }
      if (!down || !this.zoomed || this.focus) return;
      if (!down.pan && Math.abs(e.clientX - down.x) > 12 && Math.abs(e.clientX - down.x) > Math.abs(e.clientY - down.y)) { down.pan = true; down.lx = e.clientX; this.panOver = 0; }
      if (down.pan) { this.dragPan(e.clientX - down.lx); down.lx = e.clientX; }
    });
    const up = e => {
      if (this.play.active) { this.play.pointer('up', e); down = null; return; }
      if (!down) return;
      if (down.pan) { down = null; this.panOver = 0; return; }
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.4) { this.setRoom(this.camRoom + (dx < 0 ? 1 : -1)); }
      else if (Math.hypot(dx, dy) < 14) this.tap(e.clientX, e.clientY);
      down = null;
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', () => { down = null; if (this.play.active) this.play.pointer('cancel'); });
    addEventListener('keydown', e => {
      if (e.target && e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft') this.setRoom(this.camRoom - 1);
      if (e.key === 'ArrowRight') this.setRoom(this.camRoom + 1);
      if (e.key === 'Escape') this.ui.escape();
      if (e.key === ' ' && !this.play.active && !this.ui.busy()) { e.preventDefault(); this.ui.openPhoto(); }
    });
  }
  screenOf(v) { const p = v.clone().project(this.camera); return { x: (p.x * 0.5 + 0.5) * innerWidth, y: (-p.y * 0.5 + 0.5) * innerHeight, z: p.z }; }
  agentAt(px, py) {
    let best = null, bd = 1e9;
    for (const a of this.agents) {
      const c = new THREE.Vector3(a.x, a.y + 0.55 * a.rig.size, a.z);
      const s = this.screenOf(c); if (s.z > 1) continue;
      const edge = this.screenOf(c.clone().add(new THREE.Vector3(0.9 * a.rig.size, 0, 0)));
      const rad = Math.max(34, Math.abs(edge.x - s.x) * 1.1);
      const d = Math.hypot(px - s.x, py - s.y);
      if (d < rad && d / rad < bd) { bd = d / rad; best = a; }
    }
    return best ? { a: best, k: bd } : null;
  }
  tap(px, py) {
    if (this.ui.photoMode || this.ui.busy()) return;
    const a = this.agentAt(px, py);
    const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(px / innerWidth * 2 - 1, -py / innerHeight * 2 + 1), this.camera);
    const objs = this.pickables.filter(p => p.obj.visible !== false).map(p => p.obj);
    const hits = ray.intersectObjects(objs, true);
    let pk = null, pt = null;
    for (const h of hits) {
      let o = h.object;
      while (o && !pk) { pk = this.pickables.find(p => p.obj === o); o = o.parent; }
      if (pk) { pt = h.point; break; }
    }
    // small things on the floor win over a cat standing next to them, unless you tapped the cat itself
    const small = pk && ['mess', 'gift', 'food', 'water', 'litter', 'stray'].includes(pk.type);
    if (a && (!small || a.k < 0.45)) return this.tapAgent(a.a);
    if (pk) return this.tapThing(pk, pt);
    if (a) return this.tapAgent(a.a);
    // a room that's still for sale
    const rooms = this.house.rooms.filter(r => !r.unlocked).map(r => r.reno);
    const rh = ray.intersectObjects(rooms, true);
    if (rh.length) { const ri = this.house.roomOf(rh[0].point.x); this.ui.roomSale(ri); return; }
    this.ui.closeCard();
  }
  tapAgent(a) {
    A.tap();
    if (a.alert && !a.alert.m.uncatchable) {
      const k = a.catchIt();
      if (k) {
        this.fx.bang(a); A.oops(); this.game.xp(6); this.game.emit('catch', { cat: a.d.id });
        this.ui.floaty('Caught!', a);
        this.ui.toast(k === 'laptop' ? `${a.name} hopped off the laptop.` : k === 'yowl' ? `${a.name} quietened down. They wanted attention.` : `Caught ${a.name} in the act! ${this.hintFor(a)}`, 'good', 'check');
        return;
      }
    }
    this.ui.catCard(a);
  }
  hintFor(a) {
    const w = a.wish();
    return { food: 'They are hungry.', play: 'They need to play.', love: 'They want some love.', brush: 'They need a brush.', claws: 'A scratching post would help.', litter: 'The litter box needs scooping.' }[w] || '';
  }
  tapThing(pk, point) {
    A.tap();
    const r = pk.ref;
    if (pk.type === 'food') return this.ui.foodCard(r);
    if (pk.type === 'water') { r.water = 100; this.stationVisual(r); A.pop(); this.ui.floatyAt('Fresh water', r.wpos); this.game.xp(1); return; }
    if (pk.type === 'litter') { if (r.robot) { this.ui.toast('The self-cleaning box takes care of itself.', 'good', 'litter'); return; } if (r.dirt < 5) { this.ui.toast('The litter box is already clean.', '', 'litter'); return; } r.dirt = 0; this.litterVisual(r); A.scoop(); this.fx.sparkle(r.pos.x, 0.6, r.pos.z, 6); this.game.xp(3); this.game.s.stats.scoops++; this.game.emit('scoop'); this.ui.floatyAt('Scooped!', r.pos); return; }
    if (pk.type === 'mess') return this.cleanMess(r);
    if (pk.type === 'gift') return this.collectGift(r);
    if (pk.type === 'stray') return this.ui.strayCard(r);
    if (pk.type === 'repair') return this.ui.repairCard(r);
    if (pk.type === 'curtain') return this.ui.curtainCard(r);
  }

  // ------------------------------------------------------------ day cycle
  hooks() {
    const g = this.game;
    g.on('dayend', () => this.endDay());
    g.on('meal', h => { if (g.s.upgrades.autofeeder) this.autoFeed(); });
    g.on('levelup', d => { this.ui.levelUp(d); A.fanfare(); });
    g.on('goaldone', goal => { this.ui.goalDone(goal); A.chime(); });
    g.on('workdone', d => this.ui.toast(`Work's done for the day. You earned ${d.wage} bleps (paid tonight).`, 'good', 'laptop'));
    g.on('money', () => this.ui.hud());
    g.on('xp', n => { this.ui.hud(); });
    setInterval(() => this.persist(), 5000);
  }
  autoFeed() {
    const P = this.game.s.pantry;
    for (const st of this.stations) {
      if (!this.game.s.rooms[st.room] || st.food >= 3) continue;
      const type = P.wet > 0 ? 'wet' : P.kibble > 0 ? 'kibble' : P.fancy > 0 ? 'fancy' : null; if (!type) continue;
      const n = Math.min(3 - st.food, P[type]); P[type] -= n; st.food += n; st.type = type; this.stationVisual(st);
    }
    this.ui.toast('The automatic feeder topped up the bowls.', 'good', 'feeder'); this.ui.hud();
  }
  fillBowl(st, type) {
    const P = this.game.s.pantry;
    const n = Math.min(6 - st.food, P[type]);
    if (n <= 0) return false;
    if (st.food > 0 && st.type !== type) { /* topping up with something new: it all becomes the new food */ }
    st.food += n; st.type = type; P[type] -= n; this.stationVisual(st);
    if (type === 'kibble') A.kibble(); else A.tin();
    this.game.xp(3); this.game.s.stats.feeds++; this.game.emit('feed');
    this.fx.sparkle(st.pos.x, 0.4, st.pos.z, 4);
    // the sound of a tin brings everyone running
    if (type !== 'kibble') for (const a of this.agents) if (!a.held && !a.alert && a.d.needs.food < 90 && Math.abs(a.room - st.room) <= 2) { a.cancel(); a.meow = 1; A.meow(a); a.planEat(st); }
    this.ui.hud();
    return true;
  }
  endDay() {
    this.play.stop(true);
    this.ui.closeAll();
    this.game.paused = true;
    for (const a of this.agents) a.cancel();
    const sum = this.game.endDay(this.agents);
    this.ui.daySummary(sum, () => this.morning());
  }
  morning() {
    const g = this.game, s = g.s;
    g.startDay();
    // overnight: cats wake up around the house, the bread is restocked, plants regrow
    for (const a of this.agents) {
      if (a.d.grew) { a.d.grew = false; a.rebuild(); }
      const room = pick(g.roomsOpen()); const p = this.house.randomFree(room); a.place(p.x, p.z);
    }
    const b = this.bread(); if (b) b.loaf.visible = true;
    for (const it of this.house.items) if (it.knocked) { it.knocked = false; it.group.rotation.set(0, it.group.rotation.y, 0); it.group.position.y = 0; }
    for (const ch of this.house.chew) { ch.eaten = Math.max(0, ch.eaten - 2); this.chewVisual(ch); }
    for (const k of this.house.knock) if (k.state === 'fallen' && !this.messes.some(m => m.link && m.link.knock === k)) this.respawnKnock(k);
    if (Math.random() < 0.35 && s.cats.length) { const a = pick(this.agents); const p = this.house.nearestFree(roomX(a.room) + 1, 3.2); this.dropGift(pick(C.GIFTS).id, p.x, p.z, null, true); }
    // shedding
    for (const a of this.agents) if (a.d.needs.tidy < 40 && Math.random() < 0.5) this.addMess('fur', a.x + 1, a.z + 0.5, a.room);
    // the Cat Distribution System
    if (!s.strayPending && Math.random() < g.strayChance()) { s.strayPending = stray(s.day); this.showStray(s.strayPending); this.ui.toast('A cat is sitting on the living room windowsill…', 'gold', 'cat', this.camRoom !== 0 ? 0 : null); A.meow(null); }
    if (s.upgrades.autofeeder) this.autoFeed();
    g.paused = false;
    g.fillGoals(); this.ui.goals(); this.ui.hud();
    this.persist();
  }

  // ------------------------------------------------------------ the frame
  loop(now) {
    requestAnimationFrame(t => this.loop(t));
    let dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    if (document.hidden || this.lost) return;
    const speed = window.LWC_SPEED || 1;
    dt *= speed > 1 ? 1 : 1;
    this.t += dt;
    const steps = Math.max(1, Math.min(20, Math.round(speed)));
    for (let k = 0; k < steps; k++) this.step(dt);
    this.updateCamera(dt);
    this.ui.tick(dt);
    this.frameN = (this.frameN || 0) + 1;
    if (!window.LWC_NORENDER || this.frameN % 20 === 0 || this.captureNext) this.render(dt);
    this.monitor(dt);
    A.musicTick(this.env);
  }
  step(dt) {
    const g = this.game;
    const busy = this.ui.title_ || g.paused;
    const gm = busy ? 0 : g.tick(dt);
    this.env = g.env();
    for (const a of this.agents) a.update(dt, gm);
    this.updateFalling(dt);
    this.updateVacuum(dt);
    this.play.update(dt);
    this.fx.update(dt);
    // the cosiness of the house, now and then
    this.cozyT = (this.cozyT || 0) - dt;
    if (this.cozyT <= 0) { this.cozyT = 1.5; this.computeCozy(); this.checkHappy(); }
    // birds visit the feeders by day
    for (const it of this.placed) if (it.birds) { it.birdT = (it.birdT || 0) - dt; if (it.birdT <= 0) { it.birdT = 4 + Math.random() * 8; it.birds.birdsOn = this.env.daylight > 0.5 ? Math.floor(Math.random() * 3) : 0; } }
    // a cucumber, once in a while, in the kitchen
    this.cucT = (this.cucT ?? 40) - dt * (busy ? 0 : 1);
    if (this.cucT <= 0) { this.cucT = 70 + Math.random() * 90; this.cucumber(); }
  }
  cucumber() {
    if (this.camRoom !== 1 || !this.game.s.rooms[1]) return;
    const a = this.agents.find(a => a.room === 1 && !a.perch && !a.alert && !a.held && a.y < 0.05);
    if (!a) return;
    const cu = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.6, 4, 10), new THREE.MeshStandardMaterial({ color: '#5f8a4a', roughness: 0.6 }));
    cu.rotation.z = Math.PI / 2; cu.rotation.y = a.heading; cu.position.set(a.x - Math.sin(a.heading) * 0.9, 0.12, a.z - Math.cos(a.heading) * 0.9); cu.castShadow = true;
    this.scene.add(cu);
    a.cancel();
    a.setPlan([{ do: 'pose', pose: 'stand', dur: 1.2 }, { do: 'face', x: cu.position.x, z: cu.position.z }, { do: 'pose', pose: 'arch', dur: 2.6, meme: 'cucumber' }, { do: 'pounce', x: a.x + Math.sin(a.heading) * 1.4, z: a.z + Math.cos(a.heading) * 1.4 }], 'cucumber');
    setTimeout(() => A.hiss(), 1500);
    this.ui.toast('A cucumber rolled off the counter…', '', 'leaf');
    setTimeout(() => { this.scene.remove(cu); cu.geometry.dispose(); }, 9000);
  }
  computeCozy() {
    const s = this.game.s;
    let c = 34 + 6 * s.rooms.filter(Boolean).length;
    c += Math.min(36, this.placed.reduce((t, p) => t + (p.def.cozy || 0), 0));
    c -= this.messes.length * 5;
    c -= Object.values(s.wear).reduce((t, v) => t + v, 0) / 14;
    c -= this.litters.filter(b => b.dirt > 60).length * 6;
    this.game.cozy = clamp(Math.round(c), 0, 100);
  }
  checkHappy() {
    if (!this.agents.length) return;
    const ok = this.agents.every(a => { const N = a.d.needs; return N.food > 60 && N.fun > 60 && N.love > 60 && N.tidy > 50; });
    if (ok && !this.happyNow) this.game.emit('happy');
    this.happyNow = ok;
  }
  render(dt) {
    const env = this.env;
    this.light.update(env, this.camRoom, this.camPos ? this.camPos.x : 0, this.t);
    this.bdT = (this.bdT || 0) - dt;
    for (const R of this.house.rooms) R.backdrop.group.visible = R.i === this.camRoom;
    if (this.bdT <= 0) { this.bdT = 0.4; for (const R of this.house.rooms) R.backdrop.apply(env); }
    this.house.update(dt, this.t, env);
    this.updateWeather(dt); this.updateMotes();
    this.post.u.exposure.value = 1.05 + (1 - env.daylight) * 0.25;
    this.post.u.warm.value = 0.6 + env.warmth;
    this.post.u.flash.value = Math.max(0, this.post.u.flash.value - dt * 3);
    this.post.render(this.scene, this.camera, this.t);
    if (this.captureNext) { const f = this.captureNext; this.captureNext = null; f(this.renderer.domElement); }
  }
  monitor(dt) {
    if (this.game.s.settings.quality !== 'auto') return;
    this.mAcc = (this.mAcc || 0) + dt; this.mN = (this.mN || 0) + 1;
    if (this.mAcc < 3) return;
    const avg = this.mAcc / this.mN; this.mAcc = 0; this.mN = 0;
    const pr = this.pixelRatio(), dpr = devicePixelRatio || 1;
    if (avg > 1 / 40 && pr > 0.75) { this.autoPR = Math.max(0.75, pr - 0.25); this.resize(); }
    else if (avg < 1 / 57 && pr < Math.min(dpr, this.touch ? 1.5 : 1.75)) { this.autoPR = Math.min(Math.min(dpr, this.touch ? 1.5 : 1.75), pr + 0.25); this.resize(); }
  }

  // ------------------------------------------------------------ fresh start
  newGame() {
    for (const a of this.agents) a.remove();
    this.agents = [];
    for (const m of [...this.messes]) { this.scene.remove(m.g); } this.messes = [];
    for (const g of [...this.gifts]) this.scene.remove(g.g); this.gifts = [];
    try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(PHOTO_KEY); } catch (e) {}
    location.reload();
  }
}
const HIT_MAT = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });
function hitDisc(r) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.4, 12), HIT_MAT); m.position.y = 0.2; m.castShadow = false; m.receiveShadow = false; return m; }
function niceName(k) { return { sofa: 'sofa', armchair: 'armchair', bed: 'bed', wickerChair: 'wicker chair', beanbag: 'beanbag' }[k] || 'furniture'; }

const world = new World();
window.LWC = world;
world.boot().catch(e => { console.error(e); const m = document.getElementById('lmsg'); if (m) m.textContent = 'Something went wrong: ' + e.message; });
