// Life with Cats — the hands-on bits. Stroke a cat (chin scritches good,
// belly bad), wave a feather wand or a laser dot, brush out a cloud of fur,
// snip claws before patience runs out, and take the perfect photo.
import * as THREE from '../lib/three.module.min.js';
import { I } from './icons.js';
import { PERS, BREEDS, COATS, MEME } from './catdata.js';
import { hearts, PHOTO_KEY } from './game.js';
import { M, PAL } from './furniture.js';
import { roomX, RW, RD } from './house.js';
import { clamp, lerp, damp, dampAngle, fmt, rng } from './util.js';
import * as A from './audio.js';

const $ = (s, r = document) => r.querySelector(s);
function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

export class Play {
  constructor(w) { this.w = w; this.active = false; this.ray = new THREE.Raycaster(); }
  get g() { return this.w.game; }
  ui() { let el = $('#mini'); if (!el) { el = h('<div id="mini"></div>'); document.body.appendChild(el); } return el; }
  bar(title, hint, gauges) {
    const el = this.ui(); el.innerHTML = '';
    el.appendChild(h(`<div class="mbar paper"><h4>${title}</h4><p>${hint}</p><div class="gauges">${gauges.map(([k, label, col, mark]) => `<div class="gauge">${label}<div class="b"><i data-g="${k}" style="width:0%;background:${col}"></i>${mark ? `<em style="left:${mark}%"></em>` : ''}</div></div>`).join('')}</div></div>`));
    const done = h(`<button class="btn warm mdone">${I.check} Done</button>`); done.onclick = () => this.stop(); el.appendChild(done);
  }
  gauge(k, v) { const e = $(`[data-g="${k}"]`); if (e) e.style.width = clamp(v, 0, 100) + '%'; }
  // ------------------------------------------------------------ start / stop
  start(mode, a) {
    if (this.active) this.stop(true);
    this.active = true; this.finished = false; this.mode = mode; this.a = a; this.t = 0; this.gain = 0; this.tol = 0; this.strokes = 0; this.catches = 0; this.down = false; this.result = null;
    this.w.ui.closeCard();
    a.hold(mode);
    a.heldCycle = null; a.heldLook = null;
    this.shift = null;
    if (mode !== 'play' && !a.perch && a.y < 0.05 && a.z < 1.8) {
      // walk out to the open floor at the front, so nothing stands between you and the cat
      const t = this.w.house.nearestFree(a.x, 2.6);
      const path = this.w.house.path(a.x, a.z, t.x, t.z);
      if (path && path.length) this.shift = { path };
    }
    this.w.setFocus(a);
    for (const k of ['#dock', '#notes', '#pantry']) { const e = $(k); if (e) e.style.visibility = 'hidden'; }
    const n = a.name, P = PERS[a.d.pers];
    if (mode === 'pet') {
      this.belly = a.d.needs.love > 55 && Math.random() < 0.35;
      a.setPose(this.belly ? 'belly' : (a.perch ? 'loaf' : 'loaf'), { eyes: 0.7 });
      this.bar(`Petting ${n}`, this.belly ? 'Ooh, a belly. Careful: it might be a trap. Chin scritches are always safe.' : 'Stroke along the back. Chin scritches are best. Stop before the tail starts swishing!', [['love', 'Love', '#c14b56'], ['tol', 'Patience', '#c99a3e', 85]]);
      this.tolMax = 100;
    } else if (mode === 'play') {
      this.laser = !!this.g.s.upgrades.laser;
      if (a.perch) { a.leavePerch(); const p = this.w.house.nearestFree(a.x, a.z + 0.8); a.x = p.x; a.z = p.z; a.y = 0; }
      a.y = 0; a.setPose('crouch');
      this.toyPos = new THREE.Vector3(a.x + 1.6, 0.25, a.z + 1.2); this.toyVel = new THREE.Vector3(); this.lastToy = this.toyPos.clone(); this.toySpeed = 0;
      this.makeToy();
      this.bar(`Playtime with ${n}`, this.laser ? 'Drag the red dot around the floor. Cats never catch it, but oh, they try.' : 'Drag the feather around. Keep it moving, then let them pounce!', [['fun', 'Fun', '#4f7a7a'], ['time', 'Time', '#b9a98c']]);
      this.limit = 16; this.state = 'stalk'; this.cool = 0;
    } else if (mode === 'brush') {
      a.setPose(a.perch ? 'loaf' : 'loaf', { eyes: 0.6 });
      this.bar(`Brushing ${n}`, BREEDS[a.d.breed].fluff > 0.3 ? 'Long strokes along the back. Fluffy cats make a whole second cat of fur.' : 'Long strokes along the back and cheeks.', [['tidy', 'Groomed', '#6d4c5e'], ['tol', 'Patience', '#c99a3e', 85]]);
      this.tolMax = 100;
    } else if (mode === 'trim') {
      a.setPose('loaf', { eyes: 0.85, ears: 0.3 });
      this.trimGame();
    }
    A.soft();
  }
  stop(abort) {
    if (!this.active) return;
    const a = this.a, mode = this.mode, g = this.g, d = a.d;
    this.active = false;
    A.purr(false);
    if (this.toy) { this.w.scene.remove(this.toy); this.toy = null; }
    const el = $('#mini'); if (el) el.innerHTML = '';
    for (const k of ['#dock', '#notes', '#pantry']) { const e = $(k); if (e) e.style.visibility = ''; }
    this.w.setFocus(null);
    a.heldLook = null; a.heldCycle = null; a.heldTongue = 0;
    a.release();
    if (abort) return;
    const s = g.s;
    if (mode === 'pet') {
      if (this.gain > 2) {
        const perfect = this.tol > 60 && this.tol < 100 && !this.swatted;
        const bond = Math.round(this.gain / 5) + (perfect ? 2 : 0);
        d.bond += bond; s.stats.pets++; d.stats.pets++;
        g.xp(4 + Math.round(this.gain / 8) + (perfect ? 4 : 0));
        if (!this.swatted) { g.emit('pet', { cat: d.id }); if (perfect) this.w.ui.toast(`Perfect timing! ${a.name} loved that.`, 'good', 'love'); }
        a.plan = [{ do: 'pose', pose: this.swatted ? 'sheepish' : 'loaf', dur: 3, meme: this.swatted ? null : 'loaf' }];
      }
    } else if (mode === 'play') {
      if (this.gain > 3) { d.bond += 1 + this.catches; s.stats.plays++; d.stats.plays++; g.xp(5 + this.catches * 2); g.emit('play', { cat: d.id }); d.weight = Math.max(28, d.weight - 0.8 - this.gain * 0.02); }
      a.plan = [{ do: 'pose', pose: 'sploot', dur: 3, meme: 'sploot' }];
    } else if (mode === 'brush') {
      if (this.gain > 3) { d.bond += Math.round(this.gain / 10) + (PERS[d.pers].fav === 'brush' ? 2 : 0); s.stats.brushes++; d.stats.brushes++; g.xp(4 + Math.round(this.gain / 10)); g.emit('brush', { cat: d.id }); }
      if (this.furBalls) for (let i = 0; i < Math.min(2, this.furBalls); i++) this.w.addMess('fur', a.x + 0.8 + i * 0.5, a.z + 0.6, a.room);
    } else if (mode === 'trim') {
      if (this.snips > 0) { d.claws = Math.max(4, d.claws - this.snips * 10); s.stats.trims++; g.xp(3 + this.snips); d.bond += this.snips >= 10 ? 2 : 1; g.emit('trim', { cat: d.id }); this.w.ui.toast(this.snips >= 10 ? `All ten claws trimmed. ${a.name} is very brave.` : `${this.snips} claws trimmed before ${a.name} wriggled free.`, 'good', 'scissors'); }
    }
    g.emit('bond', { cat: d.id, value: hearts(d.bond) });
    this.w.ui.hud();
  }
  // ------------------------------------------------------------ pointer
  ndc(e) { return new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1); }
  pointer(type, e) {
    if (type === 'down') { this.down = true; this.last = e ? { x: e.clientX, y: e.clientY } : null; }
    if (type === 'up' || type === 'cancel') { this.down = false; this.last = null; if (this.mode === 'pet' || this.mode === 'brush') A.purr(false); }
    if (!e || !this.active) return;
    if (this.mode === 'play' && (type === 'down' || (type === 'move' && this.down))) {
      this.ray.setFromCamera(this.ndc(e), this.w.camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.25), p = new THREE.Vector3();
      if (this.ray.ray.intersectPlane(plane, p)) {
        const X = roomX(this.a.room);
        p.x = clamp(p.x, X - RW / 2 + 0.6, X + RW / 2 - 0.6); p.z = clamp(p.z, -RD / 2 + 0.6, RD / 2 - 0.4);
        this.toyPos.copy(p);
      }
    }
    if ((this.mode === 'pet' || this.mode === 'brush') && type === 'move' && this.down && this.last) {
      const dx = e.clientX - this.last.x, dy = e.clientY - this.last.y, dist = Math.hypot(dx, dy);
      if (dist < 4) return;
      this.last = { x: e.clientX, y: e.clientY };
      this.ray.setFromCamera(this.ndc(e), this.w.camera);
      const hits = this.ray.intersectObject(this.a.rig.root, true).filter(h => h.object.isMesh && h.object !== this.a.rig.shadow);
      if (!hits.length) return;
      const part = this.partOf(hits[0].object);
      this.strokeAcc = (this.strokeAcc || 0) + dist;
      if (this.strokeAcc > 38) { this.strokeAcc = 0; this.stroke(part, hits[0].point); }
    }
    if (this.mode === 'trim') {}
  }
  partOf(o) {
    const r = this.a.rig;
    let p = o; while (p) { if (p === r.head) return 'chin'; if (p === r.tailBase) return 'tail'; if (Object.values(r.legs).some(L => L.p === p)) return 'paws'; p = p.parent; }
    return this.belly ? 'belly' : 'back';
  }
  stroke(part, point) {
    const a = this.a, d = a.d, N = d.needs, P = PERS[d.pers], w = this.w;
    if (this.mode === 'pet') {
      const T = { chin: [1.4, 0.55], back: [1, 1], belly: [0.8, 3.4], tail: [0.2, 3], paws: [0.3, 2.2] }[part];
      const kit = d.age === 'kitten' ? 1.2 : 1;
      const love = 3.2 * T[0] * kit * (P.fav === 'pet' ? 1.3 : 1);
      N.love = Math.min(100, N.love + love); this.gain += love;
      this.tol += 4.2 * T[1] / P.tol * (d.needs.love > 90 ? 1.6 : 1) * (hearts(d.bond) >= 5 ? 0.8 : 1);
      if (part === 'chin' || part === 'back') { w.fx.hearts(a, 1); A.purr(true, 0.6 + this.gain / 120); }
      if (part === 'belly') { w.ui.floatyAt(this.tol > 50 ? 'Danger…' : 'Soft…', point); }
      if (part === 'tail') w.ui.floatyAt('Not the tail!', point);
      a.annoyed = this.tol / 100 * 1.4;
      if (this.tol >= 100) this.swat();
      else if (N.love >= 100 && this.gain > 10) { w.ui.toast(`${a.name} is a puddle of purrs.`, 'good', 'love'); this.stop(); }
    } else if (this.mode === 'brush') {
      const T = { chin: [0.8, 0.6], back: [1.2, 0.8], belly: [0.8, 2.6], tail: [0.4, 2.4], paws: [0.3, 2] }[part];
      const glove = this.g.s.upgrades.glove ? 1.5 : 1;
      const tidy = 5 * T[0] * glove; N.tidy = Math.min(100, N.tidy + tidy); this.gain += tidy;
      if (P.fav === 'brush') N.love = Math.min(100, N.love + 2);
      this.tol += 3.2 * T[1] / P.tol / glove;
      const fluffy = BREEDS[d.breed].fluff;
      w.fx.fur(point.x, point.y, point.z, COATS[d.coat].base, fluffy > 0.3 ? 4 : 2);
      this.furBalls = (this.furBalls || 0) + (fluffy > 0.3 ? 0.12 : 0.05);
      A.brush(); if (P.fav === 'brush') A.purr(true, 0.6);
      a.annoyed = this.tol / 100 * 1.3;
      if (this.tol >= 100) this.swat();
      else if (N.tidy >= 100) { w.ui.toast(`${a.name} is gleaming.`, 'good', 'brush'); this.stop(); }
    }
  }
  swat() {
    const a = this.a; this.swatted = true;
    A.purr(false); A.hiss();
    a.setPose('swat', { ears: 1, pupil: 1 }); a.heldCycle = 'swat';
    this.w.fx.bang(a);
    a.d.needs.love = Math.max(0, a.d.needs.love - 6);
    this.w.ui.toast(this.belly && this.mode === 'pet' ? `It was a trap! ${a.name} grabbed your hand.` : `${a.name} has had enough for now.`, 'bad', 'claws');
    setTimeout(() => this.stop(), 1100);
  }
  // ------------------------------------------------------------ the toy
  makeToy() {
    const g = new THREE.Group();
    if (this.laser) {
      const dot = new THREE.Mesh(new THREE.CircleGeometry(0.07, 16), new THREE.MeshBasicMaterial({ color: '#ff3a2a' }));
      dot.rotation.x = -Math.PI / 2; dot.position.y = -0.22; g.add(dot);
      const glow = new THREE.Mesh(new THREE.CircleGeometry(0.25, 20), new THREE.MeshBasicMaterial({ color: '#ff5a3a', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
      glow.rotation.x = -Math.PI / 2; glow.position.y = -0.21; g.add(glow);
    } else {
      const fm = M.felt(PAL.rose), fm2 = M.felt(PAL.mustard);
      for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 6), i === 1 ? fm2 : fm); f.rotation.set(Math.PI + (i - 1) * 0.5, 0, (i - 1) * 0.4); f.position.y = -0.1; f.castShadow = true; g.add(f); }
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), M.felt(PAL.teal)); g.add(bead);
      const str = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 4, 4), M.plain('#efe3c8')); str.position.y = 2; g.add(str);
      g.userData.str = str;
    }
    this.toy = g; this.w.scene.add(g); g.position.copy(this.toyPos);
  }
  // ------------------------------------------------------------ claws
  trimGame() {
    const a = this.a, P = PERS[a.d.pers];
    this.snips = 0; this.patience = 100; this.paw = 0; this.claws = [0, 1, 2, 3, 4].map(i => ({ i, ext: 0, done: false }));
    this.patienceRate = 7.5 / P.tol;
    const el = this.ui(); el.innerHTML = '';
    el.appendChild(h(`<div class="mbar paper"><h4>Trimming ${a.name}’s claws</h4><p>Tap each claw when it pokes out. Don’t snip the toe beans!</p><div class="gauges"><div class="gauge">Claws<div class="b"><i data-g="snip" style="width:0%;background:#6d4c5e"></i></div></div><div class="gauge">Patience<div class="b"><i data-g="pat" style="width:100%;background:#c99a3e"></i></div></div></div></div>`));
    const paw = h(`<div class="trim"><svg viewBox="0 0 200 200" data-paw></svg></div>`); el.appendChild(paw);
    const done = h(`<button class="btn warm mdone">${I.check} Done</button>`); done.onclick = () => this.stop(); el.appendChild(done);
    this.drawPaw();
  }
  drawPaw() {
    const svg = $('[data-paw]'); if (!svg) return;
    const col = COATS[this.a.d.coat], fur = col.pattern === 'tux' || col.pattern === 'calico' || col.mitts ? '#efe9de' : col.pattern === 'point' ? col.point : col.base;
    const toes = [[48, 70], [78, 48], [122, 48], [152, 70], [176, 112]];
    let s = `<ellipse cx="100" cy="125" rx="78" ry="64" fill="${fur}" stroke="#3b2f2a" stroke-width="4"/>`;
    s += `<path d="M65 150c0-24 16-38 35-38s35 14 35 38c0 14-14 18-35 18s-35-4-35-18z" fill="#d98a8a" stroke="#3b2f2a" stroke-width="3" data-bean="1"/>`;
    toes.forEach(([x, y], i) => {
      const c = this.claws[i];
      const L = c.done ? 8 : 8 + c.ext * 26;
      s += `<path d="M${x - 7} ${y - 12} Q${x} ${y - 12 - L * 1.4} ${x + 7} ${y - 12}" fill="${c.done ? '#cfc6b4' : '#f4efe2'}" stroke="#3b2f2a" stroke-width="2.5" data-claw="${i}" style="cursor:pointer"/>`;
      s += `<circle cx="${x}" cy="${y}" r="17" fill="#d98a8a" stroke="#3b2f2a" stroke-width="3" data-bean="1"/>`;
      s += `<circle cx="${x}" cy="${y - 30}" r="26" fill="transparent" data-claw="${i}"/>`;
    });
    s += `<text x="100" y="196" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="800" font-size="13" fill="#3b2f2a">${this.paw === 0 ? 'Left paw' : 'Right paw'}</text>`;
    svg.innerHTML = s;
    svg.querySelectorAll('[data-claw]').forEach(c => c.onpointerdown = e => { e.stopPropagation(); this.snip(+c.dataset.claw); });
    svg.querySelectorAll('[data-bean]').forEach(c => c.onpointerdown = e => { e.stopPropagation(); this.bean(); });
  }
  snip(i) {
    const c = this.claws[i]; if (c.done) return;
    if (c.ext < 0.5) { this.patience -= 6; A.tap(); return; }
    c.done = true; this.snips++; A.snip();
    const P = new THREE.Vector3(); this.a.rig.legs.fr.paw.getWorldPosition(P); this.w.fx.snip(P.x, P.y + 0.2, P.z);
    if (this.claws.every(c => c.done)) {
      if (this.paw === 0) { this.paw = 1; this.claws.forEach(c => { c.done = false; c.ext = 0; }); this.w.ui.toast('One paw done. Now the other!', 'good', 'scissors'); }
      else { this.finished = true; this.drawPaw(); setTimeout(() => this.stop(), 500); return; }
    }
    this.drawPaw();
  }
  bean() { this.patience -= 18; A.hiss(); this.w.fx.bang(this.a); this.w.ui.toast('Ouch, that was a toe bean!', 'bad', 'claws'); }
  // ------------------------------------------------------------ per frame
  update(dt) {
    if (!this.active) return;
    const a = this.a, w = this.w, d = a.d;
    this.t += dt;
    if (this.shift) {
      const s = this.shift;
      if (!s.pose) { s.pose = a.rig.poseName; s.over = a.rig.over; a.setPose('walk'); }
      const p = s.path[0], dx = p.x - a.x, dz = p.z - a.z, d = Math.hypot(dx, dz), step = 2.6 * dt;
      a.speed = 2.2; a.heading = dampAngle(a.heading, Math.atan2(dx, dz), 12, dt);
      if (d <= step) { a.x = p.x; a.z = p.z; s.path.shift(); } else { a.x += dx / d * step; a.z += dz / d * step; }
      if (!s.path.length || this.t > 8) { a.speed = 0; a.heading = dampAngle(a.heading, 0.3, 1, 1); a.setPose(s.pose, s.over); this.shift = null; }
      return;
    }
    if (this.mode === 'pet' || this.mode === 'brush') {
      if (!this.down) this.tol = Math.max(0, this.tol - dt * 4);
      this.gauge('love', d.needs.love); this.gauge('tidy', d.needs.tidy); this.gauge('tol', 100 - this.tol);
      a.heldLook = w.camera.position;
      a.heldCycle = this.swatted ? 'swat' : 'pet';
      if (!this.swatted) a.rig.over.eyes = this.down ? clamp(0.75 - this.gain / 200, 0.15, 0.75) : 0.7;
      a.annoyed = this.tol > 65;
      if (this.t > 30) this.stop();
    }
    if (this.mode === 'play') this.playTick(dt);
    if (this.mode === 'trim') {
      if (this.finished) return;
      this.patience -= dt * this.patienceRate;
      this.extT = (this.extT || 0) - dt;
      if (this.extT <= 0) { this.extT = 0.55 + Math.random() * 0.4; const open = this.claws.filter(c => !c.done); if (open.length) { const c = open[Math.floor(Math.random() * open.length)]; c.ext = 1; c.until = this.t + 1.0 + PERS[d.pers].tol * 0.3; } }
      let redraw = false; for (const c of this.claws) if (c.ext > 0 && this.t > c.until) { c.ext = 0; redraw = true; }
      if (redraw || this.lastExt !== this.claws.map(c => c.ext).join()) { this.lastExt = this.claws.map(c => c.ext).join(); this.drawPaw(); }
      this.gauge('snip', this.snips * 10); this.gauge('pat', this.patience);
      a.annoyed = this.patience < 40; a.heldLook = w.camera.position;
      if (this.patience <= 0) { w.ui.toast(`${a.name} wriggled free!`, 'bad', 'claws'); A.hiss(); this.stop(); }
    }
  }
  playTick(dt) {
    const a = this.a, w = this.w, d = a.d, toy = this.toy, laser = this.laser;
    // the toy itself: a feather that swings on its string, or a dot that jitters
    const tp = this.toyPos;
    const prev = this.lastToy.clone();
    this.lastToy.lerp(tp, 1 - Math.exp(-14 * dt));
    this.toySpeed = damp(this.toySpeed, this.lastToy.distanceTo(prev) / Math.max(dt, 1e-3), 6, dt);
    toy.position.copy(this.lastToy);
    if (laser) toy.position.x += Math.sin(this.t * 40) * 0.01;
    else { toy.position.y = 0.3 + Math.sin(this.t * 3) * 0.05 + Math.min(0.5, this.toySpeed * 0.06); toy.rotation.z = Math.sin(this.t * 2.2) * 0.25; }
    this.gauge('fun', d.needs.fun); this.gauge('time', (1 - this.t / this.limit) * 100);
    if (this.t > this.limit || d.needs.fun >= 100) { if (d.needs.fun >= 100) w.ui.toast(`${a.name} is happily worn out.`, 'good', 'play'); return this.stop(); }
    // the cat: stalk, chase, pounce
    const dx = toy.position.x - a.x, dz = toy.position.z - a.z, dist = Math.hypot(dx, dz);
    const want = Math.atan2(dx, dz);
    a.heldLook = toy.position;
    this.cool -= dt;
    const fast = this.toySpeed > 1.5;
    if (this.state === 'pounce') {
      const t = clamp((this.t - this.pt0) / 0.42, 0, 1);
      a.x = lerp(this.pFrom.x, this.pTo.x, t); a.z = lerp(this.pFrom.z, this.pTo.z, t); a.y = Math.sin(t * Math.PI) * 0.5;
      if (t >= 1) {
        a.y = 0; a.rig.squash = 0.7; this.state = 'stalk'; this.cool = 0.6;
        const hit = Math.hypot(toy.position.x - a.x, toy.position.z - a.z) < 0.75 && !laser;
        if (hit) { this.catches++; d.needs.fun = Math.min(100, d.needs.fun + 11); this.gain += 11; w.fx.sparkle(a.x, 0.6, a.z, 5); w.ui.floaty('Got it!', a); A.trill(a); a.setPose('stand'); a.heldCycle = 'bat'; }
        else { d.needs.fun = Math.min(100, d.needs.fun + 3); this.gain += 3; a.setPose('crouch'); a.heldCycle = null; }
      }
      return;
    }
    a.heading = dampAngle(a.heading, want, 8, dt);
    let speed = 0;
    if (dist > 1.6 && (fast || laser)) { speed = laser ? 4.2 : 3.0; a.setPose('run'); a.heldCycle = null; }
    else if (dist > 1.3) { speed = 0.9; a.setPose('crouch'); a.heldCycle = null; }
    else { speed = 0; a.setPose('crouch'); a.heldCycle = this.cool < 0.3 ? 'wiggle' : null; }
    if (laser && speed > 0) { d.needs.fun = Math.min(100, d.needs.fun + dt * 5); this.gain += dt * 5; a.d.memes = a.d.memes; }
    a.speed = damp(a.speed, speed, 6, dt);
    const nx = a.x + Math.sin(a.heading) * a.speed * dt, nz = a.z + Math.cos(a.heading) * a.speed * dt;
    const [i, j] = w.house.cellOf(nx, nz);
    if (w.house.free(i, j)) { a.x = nx; a.z = nz; }
    if (dist < 1.7 && dist > 0.3 && this.cool <= 0 && (this.toySpeed > 0.4 || Math.random() < dt * 0.8)) {
      this.state = 'pounce'; this.pt0 = this.t; this.pFrom = { x: a.x, z: a.z };
      const to = w.house.nearestFree(toy.position.x - Math.sin(want) * 0.3, toy.position.z - Math.cos(want) * 0.3);
      this.pTo = { x: to.x, z: to.z }; a.setPose('air'); a.heldCycle = null; a.speed = 0;
    }
    a.memes && laser && a.memes.add('zoomies');
  }
  // ------------------------------------------------------------ quick ones
  treat(a) {
    const s = this.g.s, d = a.d, P = PERS[d.pers];
    if (s.pantry.treats <= 0) return;
    s.pantry.treats--; d.treatsToday = (d.treatsToday || 0) + 1;
    const N = d.needs; N.love = Math.min(100, N.love + 8 * (P.fav === 'treat' ? 1.4 : 1)); N.food = Math.min(100, N.food + 4);
    d.weight += 0.8 * (P.gain || 1) * (d.treatsToday > 3 ? 2.6 : 1);
    d.bond += 2; s.stats.treats++; d.stats.treats++;
    a.cancel(); a.plan = [{ do: 'pose', pose: 'eat', cycle: 'eat', dur: 1.6 }, { do: 'pose', pose: 'sit', dur: 2, lookCam: true, purr: true }];
    this.w.fx.hearts(a, 3); A.trill(a);
    this.g.xp(2); this.g.emit('treat', { cat: d.id }); this.g.emit('bond', { cat: d.id, value: hearts(d.bond) });
    if (d.treatsToday === 4) this.w.ui.toast(`That’s a lot of treats today. ${a.name} is going to get chubby…`, 'bad', 'chonk');
    else if (d.weight > 74 && d.treatsToday > 1) this.w.ui.toast(`${a.name} is getting very round. Play burns it off!`, 'bad', 'chonk');
    this.w.ui.hud();
  }
  catnip(a) {
    const s = this.g.s; if (s.pantry.catnip <= 0) return; s.pantry.catnip--;
    a.cancel();
    a.setPlan([{ do: 'pose', pose: 'belly', dur: 2.5, meme: 'trap' }, { do: 'pose', pose: 'flop', dur: 2 }, { do: 'zoom', pts: [0, 1, 2, 3].map(() => this.w.house.randomFree(a.room)), meme: 'zoomies' }, { do: 'pose', pose: 'sploot', dur: 4, meme: 'sploot' }], 'catnip');
    a.d.needs.fun = Math.min(100, a.d.needs.fun + 35); a.d.needs.love = Math.min(100, a.d.needs.love + 5);
    this.w.fx.sparkle(a.x, 0.8, a.z, 10); this.g.xp(3); this.w.ui.toast(`${a.name} has gone completely silly.`, 'good', 'catnip'); this.w.ui.hud();
  }
  vet(a) {
    const g = this.g, d = a.d; if (!g.spend(40)) return;
    const heavy = d.weight > 70;
    d.health = 100; if (heavy) d.weight -= 10;
    this.w.fx.sparkle(a.x, 1, a.z, 10); A.chime();
    this.w.ui.toast(heavy ? `The vet on the lane put ${a.name} on a diet: fewer treats, more play.` : `The vet says ${a.name} is fit as a fiddle.`, 'good', 'vet');
    g.xp(3); this.w.ui.hud();
  }
  // ------------------------------------------------------------ photos
  evaluate(rect) {
    const w = this.w, cats = [], memes = new Set();
    const P = new THREE.Vector3();
    for (const a of w.agents) {
      a.rig.head.getWorldPosition(P);
      const s = w.screenOf(P); if (s.z > 1) continue;
      if (s.x < rect.left || s.x > rect.right || s.y < rect.top || s.y > rect.bottom) continue;
      // is the cat actually visible (not behind a wall)?
      if (Math.abs(a.room - w.camRoom) > 0 && !(a.perch && a.perch.room === w.camRoom)) continue;
      cats.push(a); for (const m of a.memes) memes.add(m);
    }
    const s = this.g.s, list = [...memes];
    const fresh = list.filter(m => !s.memes[m]);
    const reward = fresh.reduce((t, m) => t + Math.round(10 + MEME[m].stars * 8), 0);
    const title = list.length ? MEME[list.sort((x, y) => MEME[y].stars - MEME[x].stars)[0]].name : cats.length ? `${cats[0].name}, at home` : 'A quiet room';
    return { cats: cats.map(a => a.name), memes: list, fresh, reward, title };
  }
  shoot() {
    const w = this.w, ui = w.ui;
    const rect = ui.vfRect();
    const shot = this.evaluate(rect);
    A.shutter();
    w.captureNext = canvas => {
      const W = 420, H = Math.round(W * rect.height / rect.width);
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const sx = canvas.width / innerWidth, sy = canvas.height / innerHeight;
      c.getContext('2d').drawImage(canvas, rect.left * sx, rect.top * sy, rect.width * sx, rect.height * sy, 0, 0, W, H);
      const img = c.toDataURL('image/jpeg', 0.72);
      w.post.u.flash.value = 1;
      const s = this.g.s; s.stats.photos++;
      this.g.emit('photo', { memes: shot.memes });
      for (const m of shot.memes) this.g.emit('meme', { memes: [m] });
      ui.photoResult(shot, img, () => this.keep(shot, img));
    };
  }
  savePhoto(shot, img, posted, likes) {
    let list = []; try { list = JSON.parse(localStorage.getItem(PHOTO_KEY) || '[]'); } catch (e) {}
    const p = { id: 'p' + Date.now().toString(36), day: this.g.s.day, img, memes: shot.memes, cats: shot.cats, title: shot.title, posted, likes: likes || 0 };
    list.push(p);
    const firstOf = id => list.find(q => q.memes.includes(id));
    while (list.length > 40) { const k = list.findIndex(q => !Object.values(this.g.s.memes).includes(q.id)); list.splice(k >= 0 ? k : 0, 1); }
    for (const m of shot.memes) if (!this.g.s.memes[m]) this.g.s.memes[m] = p.id;
    for (let i = 0; i < 6; i++) { try { localStorage.setItem(PHOTO_KEY, JSON.stringify(list)); break; } catch (e) { list.splice(0, 2); } }
    return p;
  }
  keep(shot, img) {
    const g = this.g, s = g.s;
    const fresh = shot.memes.filter(m => !s.memes[m]);
    this.savePhoto(shot, img, false);
    s.today.moments = (s.today.moments || 0) + fresh.length;
    if (shot.reward) g.earn(shot.reward);
    g.xp(3 + fresh.length * 6);
    g.emit('keep');
    if (fresh.length) { A.chime(); this.w.ui.toast(`New in the scrapbook: ${fresh.map(m => MEME[m].name).join(', ')}! +${shot.reward} bleps.`, 'gold', 'sparkle'); }
    else { A.soft(); this.w.ui.toast('Saved to the scrapbook.', 'good', 'photo'); }
    this.w.ui.hud(); this.w.persist();
  }
}
