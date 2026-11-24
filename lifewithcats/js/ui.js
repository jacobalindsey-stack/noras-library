// Life with Cats — everything on paper: the clock tag, the to-do notes, the
// bubbles over the cats, the cat cards, the shop, the shelter, the album.
import * as THREE from '../lib/three.module.min.js';
import { I, NEED_ICON, NEED_COLOR } from './icons.js';
import * as T from './tex.js';
import { ROOMS, roomX } from './house.js';
import { ITEMS, SHOP_TABS } from './items.js';
import { COATS, BREEDS, PERS, SOURCES, MEMES, MEME, NAMES, catTitle, ageLabel, makeCat, BREEDER_LIST, COMMON_COATS } from './catdata.js';
import { hearts, xpFor, PHOTO_KEY, BOND } from './game.js';
import { GIFTS } from './catstuff.js';
import { MISCHIEF } from './cats.js';
import { portrait } from './catmodel.js';
import { clockStr, fmt, clamp, pick } from './util.js';
import * as A from './audio.js';

const $ = (sel, root = document) => root.querySelector(sel);
function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SEASON_ICON = { spring: 'leaf', summer: 'sun', autumn: 'leaf', winter: 'snow' };
const weightWord = w => w < 30 ? 'Slender' : w < 50 ? 'Just right' : w < 64 ? 'A bit chubby' : w < 78 ? 'Chonky' : 'Absolute unit';

export class UI {
  constructor(w) {
    this.w = w; this.root = $('#ui'); this.marksEl = $('#marks');
    this.portraits = new Map(); this.marks = new Map(); this.edges = {};
    document.documentElement.style.setProperty('--paperbg', `url(${T.paperURL()})`);
    this.photoMode = false; this.title_ = true;
  }
  game() { return this.w.game; }
  // ------------------------------------------------------------ title
  title() {
    const s = this.game().s, fresh = !s.cats.length && s.day === 1;
    const el = h(`<div id="title"><div class="card paper">
      <h1>Life with Cats<span>No. 9, Nine Lives Lane</span></h1>
      <p>${fresh ? 'A little house across the lane from the Cat Bakery. Feed them, play with them, love them, and keep them off the curtains.' : `Day ${s.day}. ${s.cats.length} cat${s.cats.length === 1 ? '' : 's'} waiting for you.`}</p>
      <div class="row center">${fresh ? `<button class="btn warm" data-go>${I.door} Move in</button>` : `<button class="btn warm" data-go>${I.door} Come home</button><button class="btn alt" data-new>New home</button>`}</div>
      <p class="kbd" style="font-size:12px;opacity:.6">Click to do things. Arrow keys change rooms. Space takes a photo.</p>
    </div></div>`);
    document.body.appendChild(el);
    $('[data-go]', el).onclick = () => { A.audioUnlock(); A.tap(); el.remove(); this.title_ = false; this.build(); if (fresh) this.firstMorning(); };
    const nb = $('[data-new]', el); if (nb) nb.onclick = () => this.confirm('Start a brand new home? Your cats and everything else will be gone for good.', 'Start over', () => this.w.newGame());
  }
  firstMorning() {
    const s = this.game().s;
    if (!s.strayPending && !s.cats.length) { s.strayPending = this.w.game.s.strayPending = (makeStray()); this.w.showStray(s.strayPending); }
    setTimeout(() => { A.meow(null); this.toast('Something is tapping on the living room window… (tap it)', 'gold', 'cat'); }, 900);
    function makeStray() { return makeCat({ source: 'cds', scruffy: true, age: 'adult', coat: pick(['orange', 'tuxedo', 'calico', 'grey', 'black', 'brown']), pers: pick(['cuddly', 'chaos', 'foodie', 'gentle', 'hunter']) }); }
  }
  // ------------------------------------------------------------ HUD
  build() {
    const r = this.root; r.innerHTML = '';
    r.appendChild(h(`<div id="top">
      <div id="clock" class="tag paper"><div class="l1"><span class="ico" style="width:22px;height:22px" data-sky></span><span data-day></span></div><div class="l2"><span data-time></span><span data-season></span></div></div>
      <div id="roomnav" class="paper"><button data-prev aria-label="Previous room">${I.left}</button><span class="nm" data-room></span><button data-next aria-label="Next room">${I.right}</button></div>
      <div class="right">
        <div class="tag paper" id="bleps" title="Bleps"><span class="ico" style="color:#c99a3e;width:24px;height:24px">${I.coin}</span><b data-bleps></b></div>
        <div class="tag paper" id="lvl"><svg class="ring" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" fill="none" stroke="rgba(59,47,42,.15)" stroke-width="5"/><circle data-ring cx="18" cy="18" r="15" fill="none" stroke="#b8613f" stroke-width="5" stroke-linecap="round" stroke-dasharray="94.2" stroke-dashoffset="94.2" transform="rotate(-90 18 18)"/></svg><small>Lv</small><b data-lvl></b></div>
        <div class="tag paper" id="fans"><span class="ico" style="color:#c14b56;width:22px;height:22px">${I.fans}</span><b data-fans></b><small>fans</small></div>
        <button id="gear" class="paper" aria-label="Settings">${I.gear}</button>
      </div></div>`));
    r.appendChild(h(`<div id="notes"></div>`));
    r.appendChild(h(`<div id="pantry"></div>`));
    r.appendChild(h(`<div id="dock">
      <button class="dk paper" id="notesBtn">${I.notes}<span>Notes</span></button>
      <button class="dk paper" data-cats>${I.cat}<span>Cats</span></button>
      <button class="dk paper" data-adopt>${I.catplus}<span>Find a cat</span></button>
      <button class="dk paper" data-shop>${I.shop}<span>Shop</span></button>
      <button class="dk paper" data-album>${I.album}<span>Album</span></button>
      <button class="dk cam" data-cam>${I.camera}<span>Photo</span></button></div>`));
    r.appendChild(h(`<div id="toasts"></div>`));
    $('[data-prev]', r).onclick = () => this.w.setRoom(this.w.camRoom - 1);
    $('[data-next]', r).onclick = () => this.w.setRoom(this.w.camRoom + 1);
    $('#gear').onclick = () => this.settings();
    $('[data-cats]', r).onclick = () => this.roster();
    $('[data-adopt]', r).onclick = () => this.adopt();
    $('[data-shop]', r).onclick = () => this.shop();
    $('[data-album]', r).onclick = () => this.album();
    $('[data-cam]', r).onclick = () => this.openPhoto();
    $('#notesBtn').onclick = () => { $('#notes').classList.toggle('open'); A.tap(); };
    this.hud(); this.goals(); this.roomChanged();
  }
  layout() { }
  hud() {
    if (this.title_ || !$('#top')) return;
    const g = this.game(), s = g.s;
    $('[data-bleps]').textContent = fmt(s.bleps);
    $('[data-lvl]').textContent = s.level;
    $('[data-ring]').setAttribute('stroke-dashoffset', 94.2 * (1 - s.xp / xpFor(s.level)));
    $('[data-fans]').textContent = fmt(s.followers);
    const P = s.pantry;
    $('#pantry').innerHTML = [['kibble', I.kibble, 'kibble'], ['wet', I.tin, 'tuna'], ['fancy', I.fish, 'salmon'], ['treats', I.treat, 'treats'], ['catnip', I.catnip, 'catnip']].filter(([k]) => k !== 'catnip' || P.catnip > 0).filter(([k]) => k !== 'fancy' || P.fancy > 0 || s.level >= 3)
      .map(([k, ic, nm]) => `<div class="tag paper ${P[k] <= 2 ? 'low' : ''}" title="${nm}">${ic}<b>${P[k]}</b><small>${nm}</small></div>`).join('');
    const room = this.w.camRoom;
    const open = s.rooms[room];
    $('[data-room]').textContent = ROOMS[room].name + (open ? '' : ' (for sale)');
    $('[data-prev]').style.visibility = room > 0 ? 'visible' : 'hidden';
    $('[data-next]').style.visibility = room < ROOMS.length - 1 ? 'visible' : 'hidden';
    const ab = $('[data-adopt]');
    let badge = ab.querySelector('.badge'); if (s.strayPending) { if (!badge) ab.appendChild(h('<span class="badge">1</span>')); } else if (badge) badge.remove();
  }
  clockTick() {
    const g = this.game(), s = g.s, env = this.w.env;
    $('[data-day]').textContent = `Day ${s.day}`;
    $('[data-time]').textContent = clockStr(s.minute);
    $('[data-season]').innerHTML = `· ${g.season}${s.weather !== 'clear' ? ' · ' + s.weather : ''}`;
    const icon = s.weather === 'rain' ? I.rain : s.weather === 'snow' ? I.snow : env.daylight > 0.4 ? I.sun : I.moon;
    const sk = $('[data-sky]'); if (sk.dataset.k !== icon.length + '') { sk.innerHTML = icon; sk.dataset.k = icon.length + ''; sk.style.color = env.daylight > 0.4 && s.weather === 'clear' ? '#c99a3e' : '#5b676d'; }
  }
  roomChanged() { this.hud(); if (this.card && this.card.dataset.kind === 'room') this.closeCard(); }
  goals() {
    const el = $('#notes'); if (!el) return;
    const s = this.game().s;
    el.innerHTML = s.goals.map(g => `<div class="note" data-id="${g.id}"><i class="pin"></i>${esc(g.text)}${g.n > 1 && g.type !== 'likes' ? `<div class="bar"><i style="width:${Math.min(100, g.prog / g.n * 100)}%"></i></div>` : ''}<div class="rw"><span class="ico" style="color:#c99a3e">${I.coin}</span>${g.reward.bleps}<span class="ico" style="color:#b8613f;margin-left:6px">${I.star}</span>${g.reward.xp}</div></div>`).join('');
    const nb = $('#notesBtn'); if (nb) { let b = nb.querySelector('.badge'); if (!b) nb.appendChild(b = h('<span class="badge"></span>')); b.textContent = s.goals.length; }
  }
  goalDone(g) {
    const el = $(`.note[data-id="${g.id}"]`);
    this.toast(`Done: ${g.text}. +${g.reward.bleps} bleps`, 'gold', 'check');
    if (el) { el.classList.add('done'); setTimeout(() => this.goals(), 900); } else this.goals();
    this.hud();
  }
  // ------------------------------------------------------------ per frame
  tick(dt) {
    if (this.title_ || !$('#top')) return;
    this.clkT = (this.clkT || 0) - dt; if (this.clkT <= 0) { this.clkT = 0.25; this.clockTick(); this.edgesTick(); }
    this.marksTick();
    if (this.card && this.card.dataset.kind === 'cat') { this.cardT = (this.cardT || 0) - dt; if (this.cardT <= 0) { this.cardT = 0.3; this.refreshCat(); } }
    if (this.photoMode) { this.photoT = (this.photoT || 0) - dt; if (this.photoT <= 0) { this.photoT = 0.25; this.photoMemes(); } }
  }
  marksTick() {
    const w = this.w, seen = new Set();
    const hideAll = this.photoMode || w.play.active || $('#sheet');
    const add = (key, cls, icon, v, onClick, color) => {
      seen.add(key);
      let m = this.marks.get(key);
      if (!m) { m = h(`<div class="mark ${cls}"><div class="bub"></div></div>`); m.onclick = e => { e.stopPropagation(); onClick(); }; this.marksEl.appendChild(m); this.marks.set(key, m); }
      if (m.dataset.icon !== icon) { m.firstChild.innerHTML = I[icon] || ''; m.dataset.icon = icon; m.firstChild.style.color = color || '#3b2f2a'; }
      const s = w.screenOf(v);
      m.style.display = s.z > 1 || hideAll ? 'none' : '';
      m.style.transform = `translate(${s.x}px,${s.y}px) translate(-50%,-100%)`;
      return m;
    };
    const P = new THREE.Vector3();
    for (const a of w.agents) {
      if (a.room !== w.camRoom && !(a.y > 0.1 && a.perch && a.perch.room === w.camRoom)) continue;
      a.rig.head.getWorldPosition(P); P.y += 0.55 * a.rig.size;
      if (a.alert && !a.held) { const m = add('a' + a.d.id, 'alert', MISCHIEF[a.alert.m.kind].icon, P, () => w.tapAgent(a), '#3b2f2a'); continue; }
      const wish = a.held ? null : a.wish();
      if (wish && !(this.card && this.card.dataset.id === a.d.id)) add('w' + a.d.id, 'want', NEED_ICON[wish], P, () => w.tapAgent(a), NEED_COLOR[wish]);
    }
    for (const m of w.messes) if (m.room === w.camRoom) add('m' + m.id, 'mess', 'sparkle', new THREE.Vector3(m.x, 0.9, m.z), () => w.cleanMess(m), '#4f7a7a');
    for (const g of w.gifts) if (g.room === w.camRoom) add('g' + g.x + g.z, 'gift', 'gift', new THREE.Vector3(g.x, 0.9, g.z), () => w.collectGift(g), '#b8613f');
    if (w.strayRig && w.camRoom === 0) { P.copy(w.strayRig.root.position); P.y += 1.6; add('stray', 'stray', 'love', P, () => this.strayCard(w.strayCat), '#c14b56'); }
    for (const [k, m] of this.marks) if (!seen.has(k)) { m.remove(); this.marks.delete(k); }
  }
  edgesTick() {
    const w = this.w;
    for (const side of ['l', 'r']) {
      const list = w.agents.filter(a => a.alert && !a.alert.m.uncatchable && (side === 'l' ? a.room < w.camRoom : a.room > w.camRoom));
      let el = this.edges[side];
      if (!list.length || this.photoMode || w.play.active) { if (el) { el.remove(); this.edges[side] = null; } continue; }
      if (!el) { el = this.edges[side] = h(`<button class="edge ${side} paper"></button>`); document.body.appendChild(el); }
      const a = list[0];
      el.innerHTML = side === 'l' ? `${I.left}<span>${esc(a.name)}!</span>` : `<span>${esc(a.name)}!</span>${I.right}`;
      el.onclick = () => w.setRoom(a.room);
    }
  }
  mischief(a) {
    A.oops();
    if (a.room !== this.w.camRoom && a.alert && !a.alert.m.uncatchable && a.alert.m.kind !== 'zoomies') this.toast(`${a.name} ${a.alert.m.label} in the ${ROOMS[a.room].name}!`, 'bad', a.alert.m.icon, a.room);
  }
  clearAlert(a) { const m = this.marks.get('a' + a.d.id); if (m) { m.remove(); this.marks.delete('a' + a.d.id); } }
  // ------------------------------------------------------------ toasts
  toast(msg, cls = '', icon, room) {
    const box = $('#toasts'); if (!box) return;
    const el = h(`<div class="toast paper ${cls}">${icon && I[icon] ? I[icon] : ''}<span>${esc(msg)}</span></div>`);
    if (room != null && room !== this.w.camRoom) { const b = h(`<button>Go</button>`); b.onclick = () => { this.w.setRoom(room); el.remove(); }; el.appendChild(b); }
    box.prepend(el);
    while (box.children.length > 3) box.lastChild.remove();
    setTimeout(() => { el.style.transition = 'opacity .4s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 400); }, room != null ? 6000 : 4200);
  }
  floaty(text, a) { const P = new THREE.Vector3(); a.rig.head.getWorldPosition(P); P.y += 0.6; this.floatyAt(text, P); }
  floatyAt(text, v) { const s = this.w.screenOf(v); const el = h(`<div class="floaty">${esc(text)}</div>`); el.style.left = s.x + 'px'; el.style.top = s.y + 'px'; document.body.appendChild(el); setTimeout(() => el.remove(), 1300); }

  // ------------------------------------------------------------ portraits
  portraitOf(cat, force) {
    if (!force && this.portraits.has(cat.id + cat.age)) return this.portraits.get(cat.id + cat.age);
    let url = '';
    try { url = portrait(this.w.renderer, cat); } catch (e) { console.warn(e); }
    this.portraits.set(cat.id + cat.age, url);
    return url;
  }
  pic(cat) { const u = this.portraitOf(cat); return u ? `<img src="${u}" alt="">` : ''; }

  // ------------------------------------------------------------ cards
  closeCard() { if (this.card) { this.card.remove(); this.card = null; } }
  showCard(html, kind, id) {
    this.closeCard();
    const el = h(`<div id="card" class="paper" data-kind="${kind}" data-id="${id || ''}"><button class="x" aria-label="Close">${I.x}</button>${html}</div>`);
    $('.x', el).onclick = () => { A.tap(); this.closeCard(); };
    document.body.appendChild(el); this.card = el;
    return el;
  }
  catCard(a) {
    const d = a.d, P = PERS[d.pers], s = this.game().s;
    const el = this.showCard(`
      <div class="cc-head"><div class="pic">${this.pic(d)}</div><div style="min-width:0">
        <h3><span data-name>${esc(d.name)}</span> <button data-rename style="width:26px;height:26px;vertical-align:middle;opacity:.6">${I.pencil}</button></h3>
        <div class="sub">${esc(catTitle(d))} · ${ageLabel(d)}${d.source === 'breeder' ? ' · pedigree' : ''}</div>
        <div><span class="chip" title="${esc(P.blurb)}">${esc(P.name)}</span><span class="chip" data-weight></span></div>
        <div class="hearts" data-hearts></div>
      </div></div>
      <div class="needs" data-needs></div>
      <div class="acts" data-acts></div>
      <p data-blurb style="margin:8px 2px 0;font-size:12.5px;opacity:.75;font-weight:700">${esc(P.blurb)}</p>`, 'cat', d.id);
    $('[data-rename]', el).onclick = () => this.nameDialog(d, n => { d.name = n; this.w.persist(); this.catCard(a); });
    this.cardAgent = a; this.refreshCat(true);
  }
  refreshCat(full) {
    const a = this.cardAgent, el = this.card; if (!a || !el) return;
    const d = a.d, N = d.needs, s = this.game().s;
    const need = (k, ic, v, label) => `<div class="need ${v < 25 ? 'low' : v < 50 ? 'mid' : ''}">${I[ic]}<span>${label}</span><div class="b"><i style="width:${Math.round(v)}%"></i></div></div>`;
    $('[data-needs]', el).innerHTML = need('food', 'food', N.food, 'Food') + need('fun', 'play', N.fun, 'Play') + need('love', 'love', N.love, 'Love') + need('tidy', 'tidy', N.tidy, 'Groom') + need('energy', 'energy', N.energy, 'Energy') + need('claws', 'claws', 100 - d.claws, 'Claws');
    const hs = hearts(d.bond);
    $('[data-hearts]', el).innerHTML = Array.from({ length: 10 }, (_, i) => `<span class="ico" style="color:${i < hs ? '#c14b56' : '#b9a98c'};width:14px;height:14px">${i < hs ? I.heartfill : I.heartempty}</span>`).join('');
    $('[data-weight]', el).textContent = weightWord(d.weight) + (d.health < 60 ? ' · feeling poorly' : '');
    if (full || !this.actsBuilt || this.actsKey !== this.actKey(a)) {
      this.actsKey = this.actKey(a); this.actsBuilt = true;
      const P = s.pantry, u = s.upgrades, sick = d.health < 65 || d.weight > 74;
      const acts = [
        ['pet', 'pet', 'Pet', ''], ['play', u.laser ? 'laser' : 'wand', 'Play', ''], ['treat', 'treat', 'Treat', `${P.treats} left`, P.treats <= 0], ['brush', 'brush', 'Brush', ''], ['trim', 'scissors', 'Claws', ''],
        sick ? ['vet', 'vet', 'Vet', '40 bleps', s.bleps < 40] : P.catnip > 0 ? ['catnip', 'catnip', 'Catnip', `${P.catnip} left`] : ['photo', 'camera', 'Photo', ''],
      ];
      const w = a.wish();
      const hot = { food: '', play: 'play', love: 'pet', brush: 'brush', claws: 'trim', sick: 'vet', chonk: 'play' }[w];
      $('[data-acts]', el).innerHTML = acts.map(([k, ic, nm, n, dis]) => `<button class="act ${k === hot ? 'hot' : ''}" data-a="${k}" ${dis ? 'disabled' : ''}>${I[ic]}<span>${nm}</span>${n ? `<span class="n">${n}</span>` : ''}</button>`).join('');
      el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { A.tap(); this.doAct(a, b.dataset.a); });
    }
  }
  actKey(a) { const s = this.game().s; return [s.pantry.treats, s.pantry.catnip, a.d.health < 65 || a.d.weight > 74, a.wish(), s.bleps >= 40].join(); }
  doAct(a, k) {
    const w = this.w;
    if (k === 'photo') { this.closeCard(); this.openPhoto(); return; }
    if (k === 'vet') { this.closeCard(); w.play.vet(a); return; }
    if (k === 'treat') { w.play.treat(a); this.refreshCat(true); return; }
    if (k === 'catnip') { this.closeCard(); w.play.catnip(a); return; }
    this.closeCard();
    w.play.start(k, a);
  }
  foodCard(st) {
    const s = this.game().s, P = s.pantry;
    const FOOD = { kibble: ['Crunchy kibble', 'kibble'], wet: ['Tuna pâté', 'tin'], fancy: ['Salmon supper', 'fish'] };
    const el = this.showCard(`<h3 style="margin:0 40px 4px 0;font-family:var(--display);font-size:24px">Food bowl</h3>
      <p style="margin:0 0 10px;font-size:14px;opacity:.8">${st.food > 0 ? `${st.food} of 6 servings of ${FOOD[st.type][0].toLowerCase()}.` : 'Empty! Fill it up:'} ${st.food >= 6 ? 'It’s full.' : ''}</p>
      <div class="acts" style="grid-template-columns:repeat(3,1fr)">${Object.entries(FOOD).map(([k, [nm, ic]]) => `<button class="act" data-f="${k}" ${P[k] <= 0 || st.food >= 6 ? 'disabled' : ''}>${I[ic]}<span>${nm}</span><span class="n">${P[k]} in the pantry</span></button>`).join('')}</div>
      <div class="row" style="margin-top:10px"><button class="btn alt" data-shopfood style="font-size:15px;padding:8px 14px">${I.shop} Buy food</button><span style="font-size:12px;opacity:.7">Tuna and salmon make cats happier. Divas turn up their noses at kibble.</span></div>`, 'food');
    el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { if (this.w.fillBowl(st, b.dataset.f)) { this.closeCard(); this.w.ui.floatyAt('Dinner!', st.pos); } });
    $('[data-shopfood]', el).onclick = () => { this.closeCard(); this.shop('food'); };
  }
  strayCard(cat) {
    const full = this.game().s.cats.length >= this.game().capacity;
    const el = this.showCard(`<div class="cc-head"><div class="pic">${this.pic(cat)}</div><div><h3>A cat at the window</h3><div class="sub">${esc(catTitle(cat))} · ${ageLabel(cat)} · ${esc(PERS[cat.pers].name)}</div></div></div>
      <p style="font-size:14px;margin:12px 0">The Cat Distribution System has chosen you. This little one has been watching your window and has decided you are their person now.</p>
      ${full ? `<p style="font-size:14px;color:#b8613f">Your house is full. Open another room to make space.</p>` : ''}
      <div class="row"><button class="btn warm" data-yes ${full ? 'disabled' : ''}>${I.love} Let them in</button><button class="btn alt" data-no>Not today</button></div>`, 'stray');
    $('[data-yes]', el).onclick = () => { this.closeCard(); this.nameDialog(cat, n => { cat.name = n; this.w.welcome(cat, 'cds'); this.hud(); this.toast(`Welcome home, ${n}!`, 'gold', 'love'); }); };
    $('[data-no]', el).onclick = () => { this.closeCard(); this.w.hideStray(); this.game().s.strayPending = null; this.hud(); this.toast('The cat wandered off to find another house.', '', 'cat'); };
  }
  repairCard(rec) {
    const cost = this.w.repairCost(rec);
    const el = this.showCard(`<h3 style="margin:0 40px 6px 0;font-family:var(--display);font-size:24px">Clawed to ribbons</h3><p style="font-size:14px;margin:0 0 10px">Mend the ${rec.kind === 'bed' ? 'quilt' : rec.kind === 'wickerChair' ? 'wicker chair' : rec.kind} for ${cost} bleps? A scratching post nearby stops this happening again.</p>
      <div class="row"><button class="btn" data-fix ${this.game().s.bleps < cost ? 'disabled' : ''}>${I.check} Repair (${cost})</button><button class="btn alt" data-post>${I.shop} Scratching posts</button></div>`, 'repair');
    $('[data-fix]', el).onclick = () => { if (this.w.repair(rec)) { this.closeCard(); this.toast('Good as new.', 'good', 'check'); this.hud(); } };
    $('[data-post]', el).onclick = () => { this.closeCard(); this.shop('furniture'); };
  }
  curtainCard(ref) {
    const el = this.showCard(`<h3 style="margin:0 40px 6px 0;font-family:var(--display);font-size:24px">Torn curtain</h3><p style="font-size:14px;margin:0 0 10px">Somebody climbed it. Mend it for 15 bleps? Lots of play keeps climbers on the floor.</p>
      <div class="row"><button class="btn" data-fix ${this.game().s.bleps < 15 ? 'disabled' : ''}>${I.check} Mend (15)</button></div>`, 'repair');
    $('[data-fix]', el).onclick = () => { if (this.w.repairCurtain(ref)) { this.closeCard(); this.hud(); } };
  }
  roomSale(i) {
    const R = ROOMS[i], s = this.game().s, ok = s.level >= R.level, prev = s.rooms[i - 1];
    const el = this.showCard(`<h3 style="margin:0 40px 6px 0;font-family:var(--display);font-size:26px">${esc(R.name)} · for sale</h3>
      <p style="font-size:14px;margin:0 0 10px">${roomBlurb(R.id)} Room for two more cats.</p>
      ${!ok ? `<p style="font-size:14px;color:#b8613f">Reach level ${R.level} first.</p>` : ''}${!prev ? `<p style="font-size:14px;color:#b8613f">Open the room next door first.</p>` : ''}
      <div class="row"><button class="btn warm" data-buy ${!ok || !prev || s.bleps < R.price ? 'disabled' : ''}>${I.room} Open it (${R.price} bleps)</button></div>`, 'room');
    $('[data-buy]', el).onclick = () => this.buyRoom(i);
  }
  buyRoom(i) {
    const g = this.game(), R = ROOMS[i];
    if (!g.spend(R.price)) return;
    g.s.rooms[i] = true; this.w.house.setUnlocked(i, true); this.w.house.buildNav();
    this.closeAll(); this.w.setRoom(i, true);
    A.fanfare(); this.toast(`The ${R.name} is yours! Room for two more cats.`, 'gold', 'room');
    g.emit('room'); g.xp(20); this.hud(); this.w.persist();
  }
  // ------------------------------------------------------------ sheets
  sheet(html, cls = '') {
    this.closeSheet(); this.closeCard();
    const el = h(`<div id="sheet"><div class="dim"></div><div class="panel paper ${cls}"><button class="x" aria-label="Close">${I.x}</button>${html}</div></div>`);
    $('.dim', el).onclick = () => this.closeSheet(); $('.x', el).onclick = () => { A.tap(); this.closeSheet(); };
    document.body.appendChild(el);
    return el;
  }
  closeSheet() { const s = $('#sheet'); if (s) s.remove(); if (this.onSheetClose) { const f = this.onSheetClose; this.onSheetClose = null; f(); } }
  closeAll() { this.closeSheet(); this.closeCard(); if (this.photoMode) this.closePhoto(); }
  busy() { return !!$('#sheet') || this.title_; }
  escape() { if ($('#sheet')) this.closeSheet(); else if (this.card) this.closeCard(); else if (this.photoMode) this.closePhoto(); else if (this.w.play.active) this.w.play.stop(); }
  confirm(msg, yes, fn) {
    const el = this.sheet(`<h2>Are you sure?</h2><p class="lede">${esc(msg)}</p><div class="row"><button class="btn warm" data-yes>${esc(yes)}</button><button class="btn alt" data-no>Cancel</button></div>`);
    el.querySelector('.panel').style.width = 'min(460px,100%)';
    $('[data-yes]', el).onclick = () => { this.closeSheet(); fn(); };
    $('[data-no]', el).onclick = () => this.closeSheet();
  }
  nameDialog(cat, done) {
    const sug = [cat.name, ...Array.from({ length: 6 }, () => pick(NAMES))].filter((v, i, a) => a.indexOf(v) === i).slice(0, 6);
    const el = this.sheet(`<h2>What’s their name?</h2>
      <div class="cc-head" style="margin:6px 0 10px"><div class="pic">${this.pic(cat)}</div><div><div class="sub">${esc(catTitle(cat))} · ${ageLabel(cat)}</div><div><span class="chip">${esc(PERS[cat.pers].name)}</span></div><p style="font-size:13px;margin:6px 0 0;opacity:.8">${esc(PERS[cat.pers].blurb)}</p></div></div>
      <input data-in maxlength="22" value="${esc(cat.name)}" style="width:100%;font:inherit;font-size:22px;padding:10px 14px;border-radius:12px;border:2px solid #c9b48e;background:#fbf6ea;color:var(--ink)">
      <div class="row" style="margin:10px 0">${sug.map(n => `<button class="chip" data-s="${esc(n)}" style="font-size:14px;padding:6px 10px">${esc(n)}</button>`).join('')}</div>
      <div class="row"><button class="btn warm" data-ok>${I.check} That’s the one</button></div>`);
    el.querySelector('.panel').style.width = 'min(520px,100%)';
    const inp = $('[data-in]', el);
    el.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { inp.value = b.dataset.s; A.tap(); });
    $('[data-ok]', el).onclick = () => { const n = inp.value.trim() || cat.name; this.closeSheet(); A.chime(); done(n.slice(0, 22)); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') $('[data-ok]', el).click(); e.stopPropagation(); });
  }
  // ------------------------------------------------------------ shop
  shop(tab = 'food') {
    const el = this.sheet(`<h2>The shop</h2><p class="lede">Everything is delivered at once, by a very fast cat.</p><div class="tabs">${SHOP_TABS.map(t => `<button data-t="${t.id}">${t.name}</button>`).join('')}</div><div class="scroll"><div class="grid" data-grid></div></div>`);
    const draw = t => {
      el.querySelectorAll('[data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === t));
      const g = this.game(), s = g.s, grid = $('[data-grid]', el);
      if (t === 'rooms') {
        grid.innerHTML = ROOMS.map((R, i) => {
          const own = s.rooms[i], lock = s.level < R.level, prev = i === 0 || s.rooms[i - 1];
          return `<div class="item ${lock ? 'locked' : ''}"><div class="top">${I.room}<b>${esc(R.name)}</b></div><p>${roomBlurb(R.id)}</p>${own ? `<span class="own">${I.check} Yours</span>` : `<button class="buy" data-room="${i}" ${lock || !prev || s.bleps < R.price ? 'disabled' : ''}>${lock ? `Level ${R.level}` : !prev ? 'Open the room before it first' : `${I.coin} ${R.price}`}</button>`}</div>`;
        }).join('');
        grid.querySelectorAll('[data-room]').forEach(b => b.onclick = () => this.buyRoom(+b.dataset.room));
        return;
      }
      const list = Object.entries(ITEMS).filter(([k, it]) => it.tab === t);
      grid.innerHTML = list.map(([k, it]) => {
        const lock = (it.level || 1) > s.level;
        let note = '', can = s.bleps >= it.price && !lock, label = `${I.coin} ${it.price}`;
        if (it.give) note = `In the pantry: ${Object.keys(it.give).map(p => s.pantry[p]).join(', ')}`;
        else if (it.upgrade) { if (s.upgrades[k]) { can = false; label = `${I.check} Owned`; } }
        else { const where = this.whereFor(k); const owned = this.w.placed.filter(p => p.kind === k).length; note = owned ? `You have ${owned}` : ''; if (where == null) { can = false; if (!lock) label = 'No space: open a room'; } }
        if (lock) label = `Level ${it.level}`;
        return `<div class="item ${lock ? 'locked' : ''}"><div class="top" style="color:var(--ink2)">${I[it.icon] || I.box}<b>${esc(it.name)}</b></div><p>${esc(it.desc)}</p>${note ? `<span class="own">${note}</span>` : ''}<button class="buy" data-k="${k}" ${can ? '' : 'disabled'}>${label}</button></div>`;
      }).join('');
      grid.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { this.buy(b.dataset.k); draw(t); });
    };
    el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { A.tap(); draw(b.dataset.t); });
    draw(tab);
  }
  whereFor(k) {
    const g = this.game(), open = g.roomsOpen();
    const order = [this.w.camRoom, ...open.filter(r => r !== this.w.camRoom)].filter(r => g.s.rooms[r]);
    for (const r of order) { const sl = this.w.freeSlot(k, r); if (sl != null) return { room: r, slot: sl }; }
    return null;
  }
  buy(k) {
    const g = this.game(), it = ITEMS[k], s = g.s;
    if (!g.can(it.price)) return;
    if (it.give) { g.spend(it.price); for (const p in it.give) s.pantry[p] += it.give[p]; A.coin(); this.toast(`${it.name} added to the pantry.`, 'good', it.icon); }
    else if (it.upgrade) { g.spend(it.price); s.upgrades[k] = true; this.w.applyUpgrades(); A.fanfare(); this.toast(`${it.name}: installed!`, 'gold', it.icon); }
    else {
      const where = this.whereFor(k); if (!where) return;
      g.spend(it.price);
      s.items.push({ kind: k, room: where.room, slot: where.slot, state: k === 'bowls' ? { food: 0, type: 'kibble', water: 100 } : {} });
      this.w.placeItem(k, where.room, where.slot, s.items[s.items.length - 1].state);
      if (where.room !== this.w.camRoom) this.toast(`${it.name} went in the ${ROOMS[where.room].name}.`, 'good', it.icon, where.room);
      else this.toast(`${it.name} is in place.`, 'good', it.icon);
      A.coin();
    }
    s.stats.bought = (s.stats.bought || 0) + 1;
    g.emit('buy', { kind: k }); g.xp(2); this.hud(); this.w.persist();
  }
  // ------------------------------------------------------------ find a cat
  adopt(tab) {
    const g = this.game(), s = g.s;
    tab = tab || (s.strayPending ? 'cds' : 'shelter');
    const el = this.sheet(`<h2>Find a cat</h2><p class="lede" data-cap></p><div class="tabs">${['cds', 'shelter', 'cafe', 'breeder'].map(k => `<button data-t="${k}">${SOURCES[k].short}</button>`).join('')}</div><div class="scroll"><p data-blurb style="margin:0 0 10px;font-size:14px"></p><div class="grid" data-grid></div></div>`);
    const draw = t => {
      el.querySelectorAll('[data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === t));
      const full = s.cats.length >= g.capacity;
      $('[data-cap]', el).innerHTML = `${s.cats.length} of ${g.capacity} cats. ${full ? 'Your house is full: open another room for two more.' : ''}`;
      $('[data-blurb]', el).innerHTML = `<b>${esc(SOURCES[t].name)}.</b> ${esc(SOURCES[t].blurb)}`;
      const grid = $('[data-grid]', el);
      if (t === 'cds') {
        if (s.strayPending) { const c = s.strayPending; grid.innerHTML = `<div class="item"><div class="top"><img src="${this.portraitOf(c)}"><div><b>A cat at your window</b><p>${esc(catTitle(c))} · ${esc(PERS[c.pers].name)}</p></div></div><button class="buy" data-stray ${full ? 'disabled' : ''}>${I.love} Free! Let them in</button></div>`; $('[data-stray]', grid).onclick = () => { this.closeSheet(); this.w.setRoom(0); this.strayCard(c); }; }
        else grid.innerHTML = `<p style="font-size:14px;grid-column:1/-1">Nobody is at the window today. Strays turn up on their own some mornings, more often when the house is cosy (chance tomorrow: about ${Math.round(g.strayChance() * 100)}%). A cardboard box helps. Nobody knows why.</p>`;
        return;
      }
      if (t === 'breeder' && s.level < 5) { grid.innerHTML = `<p style="font-size:14px;grid-column:1/-1">Duchess Featherstone only sees serious cat people. Reach level 5.</p>`; return; }
      const list = g.offersFor(t);
      grid.innerHTML = list.map((c, i) => `<div class="item"><div class="top"><img data-p="${i}" alt=""><div><b>${esc(c.name)}</b><p>${esc(catTitle(c))} · ${ageLabel(c)}</p><span class="chip" title="${esc(PERS[c.pers].blurb)}">${esc(PERS[c.pers].name)}</span></div></div><p>${esc(PERS[c.pers].blurb)}</p><button class="buy" data-i="${i}" ${full || s.bleps < c.price ? 'disabled' : ''}>${full ? 'House is full' : `${I.coin} ${c.price}`}</button></div>`).join('') || `<p style="font-size:14px">Everyone found a home today. Come back tomorrow.</p>`;
      // portraits arrive one by one so the sheet opens instantly
      let k = 0; const next = () => { if (!document.body.contains(grid) || k >= list.length) return; const img = grid.querySelector(`[data-p="${k}"]`); if (img) img.src = this.portraitOf(list[k]); k++; setTimeout(next, 10); }; setTimeout(next, 30);
      grid.querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
        const c = list[+b.dataset.i]; if (!g.spend(c.price)) return;
        s.adoptedToday[c.id + t] = true;
        this.closeSheet();
        this.nameDialog(c, n => { c.name = n; this.w.welcome(c, t); this.toast(`Welcome home, ${n}!`, 'gold', 'love'); this.hud(); });
      });
    };
    el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { A.tap(); draw(b.dataset.t); });
    draw(tab);
  }
  // ------------------------------------------------------------ the cats
  roster() {
    const g = this.game(), s = g.s;
    const el = this.sheet(`<h2>Your cats</h2><p class="lede">${s.cats.length} of ${g.capacity} · tap a cat to go to them</p><div class="scroll"><div class="grid" data-grid></div></div>`);
    const grid = $('[data-grid]', el);
    if (!s.cats.length) grid.innerHTML = `<p style="font-size:14px">No cats yet! Check the living room window, or find a cat.</p>`;
    grid.innerHTML += this.w.agents.map((a, i) => {
      const d = a.d, hs = hearts(d.bond), mood = a.mood();
      return `<button class="item" data-i="${i}"><div class="top"><img src="${this.portraitOf(d)}" alt=""><div><b>${esc(d.name)}</b><p>${esc(PERS[d.pers].name)} · ${ageLabel(d)}</p><p>${ROOMS[a.room].name}${a.alert ? ' · up to mischief!' : a.cur && a.cur.sleep ? ' · napping' : ''}</p></div></div>
        <div class="hearts">${Array.from({ length: 10 }, (_, k) => `<span class="ico" style="color:${k < hs ? '#c14b56' : '#b9a98c'};width:14px;height:14px">${k < hs ? I.heartfill : I.heartempty}</span>`).join('')}</div>
        <div class="meter">Mood<div class="b"><i style="width:${mood}%;background:${mood < 35 ? '#b8613f' : mood < 60 ? '#c99a3e' : '#8d9c6e'}"></i></div>${a.wish() ? `<span class="ico" style="width:18px;height:18px;color:${NEED_COLOR[a.wish()]}">${I[NEED_ICON[a.wish()]]}</span>` : ''}</div></button>`;
    }).join('');
    grid.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { const a = this.w.agents[+b.dataset.i]; this.closeSheet(); this.w.setRoom(a.room); setTimeout(() => this.catCard(a), 350); });
  }
  // ------------------------------------------------------------ album
  photos() { try { return JSON.parse(localStorage.getItem(PHOTO_KEY) || '[]'); } catch (e) { return []; } }
  album(tab = 'photos') {
    const s = this.game().s;
    const el = this.sheet(`<h2>The album</h2><div class="tabs"><button data-t="photos">Photos</button><button data-t="memes">Meme book</button><button data-t="gifts">Treasures</button><button data-t="cats">Cat-alogue</button><button data-t="stats">Records</button></div><div class="scroll"><div data-body></div></div>`);
    const draw = t => {
      el.querySelectorAll('[data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === t));
      const body = $('[data-body]', el), ph = this.photos();
      if (t === 'photos') {
        body.innerHTML = ph.length ? `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(170px,1fr))">${ph.slice().reverse().map(p => `<div class="polaroid" style="transform:rotate(${(p.id.charCodeAt(2) % 5 - 2) * 0.8}deg)"><img src="${p.img}" alt=""><div style="font-size:12px;margin-top:6px">${esc(p.title || '')}<br><span style="opacity:.7">Day ${p.day}${p.posted ? ` · ♥ ${fmt(p.likes)}` : ''}</span></div></div>`).join('')}</div>` : `<p style="font-size:14px">No photos yet. Tap the camera and catch a cat doing something silly.</p>`;
      } else if (t === 'memes') {
        const n = MEMES.filter(m => s.memes[m.id]).length;
        const byId = Object.fromEntries(ph.map(p => [p.id, p]));
        body.innerHTML = `<p style="margin:0 0 10px;font-size:14px">${n} of ${MEMES.length} famous cat moments caught on camera. The first photo of each is worth double likes.</p><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">${MEMES.map(m => { const p = byId[s.memes[m.id]]; return `<div class="item" style="${s.memes[m.id] ? '' : 'opacity:.7'}">${p ? `<img src="${p.img}" style="width:100%;border-radius:8px">` : `<div style="height:84px;border-radius:8px;background:#e4d6b8;display:flex;align-items:center;justify-content:center;color:#b9a98c">${s.memes[m.id] ? I.check : I.camera}</div>`}<b>${esc(m.name)}</b><p>${esc(m.hint)}</p></div>`; }).join('')}</div>`;
      } else if (t === 'gifts') {
        const n = GIFTS.filter(g => s.gifts[g.id]).length;
        body.innerHTML = `<p style="margin:0 0 10px;font-size:14px">${n} of ${GIFTS.length} treasures. Cats who love you (two hearts or more) bring presents.</p><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">${GIFTS.map(g => `<div class="item" style="${s.gifts[g.id] ? '' : 'opacity:.55'}"><b>${s.gifts[g.id] ? esc(g.name) : '???'}</b><p>${s.gifts[g.id] ? esc(g.note) + ` (×${s.gifts[g.id]})` : 'Not found yet.'}</p></div>`).join('')}</div>`;
      } else if (t === 'cats') {
        const rows = [['domestic', COMMON_COATS], ['longhair', COMMON_COATS], ...BREEDER_LIST.map(b => [b, BREEDS[b].coats])];
        let tot = 0, got = 0;
        body.innerHTML = rows.map(([b, coats]) => `<div style="margin:0 0 10px"><b style="font-family:var(--display);font-size:16px">${esc(BREEDS[b].name)}</b><div class="row" style="gap:6px;margin-top:4px">${coats.map(c => { tot++; const has = s.catalogue[b + ':' + c]; if (has) got++; return `<span class="chip" style="${has ? 'background:#d6e6c8' : 'opacity:.55'}"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${COATS[c].base};border:1px solid rgba(0,0,0,.2)"></span>${has ? esc(COATS[c].name) : '?'}</span>`; }).join('')}</div></div>`).join('');
        body.insertAdjacentHTML('afterbegin', `<p style="margin:0 0 10px;font-size:14px">${got} of ${tot} breeds and coats welcomed home.</p>`);
      } else {
        const st = s.stats;
        const rows = [['Days on Nine Lives Lane', st.days], ['Cats welcomed home', st.adopted], ['Petting sessions', st.pets], ['Play sessions', st.plays], ['Brushings', st.brushes], ['Claw trims', st.trims], ['Treats given', st.treats], ['Bowls filled', st.feeds], ['Litter scooped', st.scoops], ['Mischief caught', st.catches], ['Mischief missed', st.mischief], ['Messes cleaned', st.cleans], ['Photos taken', st.photos], ['Posts', st.posts], ['Total likes', fmt(st.likes)], ['Best post', fmt(st.bestPost)], ['Fans', fmt(s.followers)]];
        body.innerHTML = `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">${rows.map(([k, v]) => `<div class="item"><p>${k}</p><b style="font-size:24px">${v}</b></div>`).join('')}</div>`;
      }
    };
    el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { A.tap(); draw(b.dataset.t); });
    draw(tab);
  }
  // ------------------------------------------------------------ settings
  settings() {
    const s = this.game().s, st = s.settings;
    const el = this.sheet(`<h2>Settings</h2><div class="scroll">
      <div class="row" style="margin:6px 0 14px"><button class="btn ${st.music ? '' : 'alt'}" data-k="music">${I.music} Music ${st.music ? 'on' : 'off'}</button><button class="btn ${st.sfx ? '' : 'alt'}" data-k="sfx">${I.sound} Sounds ${st.sfx ? 'on' : 'off'}</button><button class="btn ${st.motion ? '' : 'alt'}" data-k="motion">Camera drift ${st.motion ? 'on' : 'off'}</button></div>
      <p style="margin:0 0 6px;font-size:14px">Picture quality</p>
      <div class="row" style="margin-bottom:14px">${['auto', 'low', 'high'].map(q => `<button class="btn ${st.quality === q ? '' : 'alt'}" data-q="${q}">${q[0].toUpperCase() + q.slice(1)}</button>`).join('')}</div>
      <h3 style="font-family:var(--display);margin:6px 0">How it works</h3>
      <p style="font-size:14px;line-height:1.45;margin:0 0 6px">Each day runs from 7am to 11pm (about two minutes). Tap a cat to pet, play, brush, give treats or trim claws. Tap the food bowl to fill it, the water bowl to refresh it and the litter box to scoop it. A bubble over a cat shows what they want most.</p>
      <p style="font-size:14px;line-height:1.45;margin:0 0 6px">Cats who are bored, lonely, hungry or itchy-clawed make their own fun: glasses off tables, claws in the sofa, curtains climbed. When a yellow <b>!</b> pops up, tap the cat quickly to stop them. Scratching posts, toys and a full bowl prevent most of it.</p>
      <p style="font-size:14px;line-height:1.45;margin:0 0 14px">Take photos of famous cat moments and post them to Purrgram for likes, fans and bleps. Your day job pays every evening, unless someone sits on the laptop.</p>
      <button class="btn alt" data-new>Start a new home</button></div>`);
    el.querySelector('.panel').style.width = 'min(640px,100%)';
    el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { st[b.dataset.k] = !st[b.dataset.k]; A.setAudio({ sfx: st.sfx, music: st.music }); this.w.persist(); this.settings(); });
    el.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { st.quality = b.dataset.q; this.w.autoPR = undefined; this.w.resize(); this.w.persist(); this.settings(); });
    $('[data-new]', el).onclick = () => this.confirm('Start a brand new home? Your cats, photos and everything else will be gone for good.', 'Start over', () => this.w.newGame());
  }
  // ------------------------------------------------------------ the evening
  daySummary(sum, next) {
    const s = this.game().s;
    const el = this.sheet(`<h2>Lights out · Day ${sum.day}</h2><p class="lede">The cats curl up. The lane goes quiet.</p><div class="scroll">
      <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">
        <div class="item"><p>Pay from work</p><b style="font-size:24px">+${sum.wage}</b>${sum.lost ? `<p>−${sum.lost} lost to a cat on the laptop</p>` : ''}</div>
        ${sum.sponsor ? `<div class="item"><p>Purrgram sponsors</p><b style="font-size:24px">+${sum.sponsor}</b></div>` : ''}
        <div class="item"><p>Purrs earned</p><b style="font-size:24px">${sum.purrs}</b></div>
        <div class="item"><p>Mischief caught · missed</p><b style="font-size:24px">${sum.catches} · ${sum.mischief}</b></div>
        ${sum.likes ? `<div class="item"><p>Likes today</p><b style="font-size:24px">${fmt(sum.likes)}</b><p>+${fmt(sum.followers)} fans</p></div>` : ''}
      </div>
      ${sum.events.length ? `<div style="margin:12px 0 0;font-size:15px;line-height:1.5">${sum.events.map(e => `<div>· ${esc(e)}</div>`).join('')}</div>` : ''}
      </div><div class="row center" style="margin-top:12px"><button class="btn warm" data-ok>${I.sun} Good morning</button></div>`);
    el.querySelector('.panel').style.width = 'min(640px,100%)';
    let done = false;
    const go = () => { if (done) return; done = true; this.onSheetClose = null; this.closeSheet(); next(); this.toast(`Day ${s.day} · ${this.game().dayName}. Rise and shine.`, '', 'sun'); };
    $('[data-ok]', el).onclick = go; this.onSheetClose = go;
    A.chime();
  }
  levelUp(d) {
    this.toast(`Level ${d.level}! +${d.gift} bleps.${d.unlocks.length ? ' New: ' + d.unlocks.join(', ') + '.' : ''}`, 'gold', 'star');
    this.hud();
  }
  // ------------------------------------------------------------ photos
  openPhoto() {
    if (this.photoMode || this.w.play.active) return;
    this.closeCard();
    this.photoMode = true;
    const el = h(`<div id="photo"><div class="vf"><i></i><i></i><i></i><i></i></div><div class="memes" data-m></div>
      <div class="hint paper" data-h>Wait for a cat to do something silly, then press the shutter</div>
      <button class="btn alt shut" data-close>${I.x} Done</button>
      <button class="shoot" data-shoot aria-label="Take photo"></button>
      <div class="pnav"><button class="btn alt" data-l style="padding:10px 14px">${I.left}</button><button class="btn alt" data-r style="padding:10px 14px">${I.right}</button></div></div>`);
    document.body.appendChild(el); this.photoEl = el;
    $('[data-close]', el).onclick = () => this.closePhoto();
    $('[data-shoot]', el).onclick = () => this.w.play.shoot();
    $('[data-l]', el).onclick = () => this.w.setRoom(this.w.camRoom - 1);
    $('[data-r]', el).onclick = () => this.w.setRoom(this.w.camRoom + 1);
    for (const k of ['#top', '#dock', '#notes', '#pantry']) { const e = $(k); if (e) e.style.visibility = 'hidden'; }
    this.photoMemes();
  }
  closePhoto() {
    this.photoMode = false; if (this.photoEl) this.photoEl.remove(); this.photoEl = null;
    for (const k of ['#top', '#dock', '#notes', '#pantry']) { const e = $(k); if (e) e.style.visibility = ''; }
  }
  vfRect() { const r = $('.vf', this.photoEl).getBoundingClientRect(); return r; }
  photoMemes() {
    if (!this.photoEl) return;
    const shot = this.w.play.evaluate(this.vfRect());
    $('[data-m]', this.photoEl).innerHTML = shot.memes.map(m => `<span>${esc(MEME[m].name)}${!this.game().s.memes[m] ? ' ★' : ''}</span>`).join('');
  }
  photoResult(shot, img, post, keep) {
    const s = this.game().s, posted = s.today.posts;
    const el = this.sheet(`<h2>${shot.title}</h2><div class="scroll"><div class="row" style="align-items:flex-start;gap:16px">
      <div class="polaroid" style="width:min(340px,100%)"><img src="${img}" alt=""></div>
      <div style="flex:1;min-width:200px">
        <p style="margin:0 0 6px;font-size:14px">${shot.cats.length ? 'Starring ' + shot.cats.map(esc).join(', ') + '.' : 'No cats in this one. Just a nice room.'}</p>
        <div class="row" style="gap:6px;margin-bottom:8px">${shot.memes.map(m => `<span class="chip" style="background:${s.memes[m] ? '#e4d6b8' : '#f3dc8a'}">${esc(MEME[m].name)}${s.memes[m] ? '' : ' · new!'}</span>`).join('') || '<span class="chip">No famous moments</span>'}</div>
        <p style="margin:0 0 12px;font-size:14px">Likely likes on Purrgram: about <b>${fmt(shot.likes)}</b>.${posted >= 4 ? ' You have posted four times today; your fans need a rest. Keep it for the album.' : ` (${4 - posted} post${4 - posted === 1 ? '' : 's'} left today)`}</p>
        <div class="row"><button class="btn warm" data-post ${posted >= 4 ? 'disabled' : ''}>${I.post} Post it</button><button class="btn" data-keep>${I.photo} Keep</button><button class="btn alt" data-bin>Bin it</button></div>
      </div></div></div>`);
    $('[data-post]', el).onclick = () => { this.closeSheet(); post(); };
    $('[data-keep]', el).onclick = () => { this.closeSheet(); keep(); };
    $('[data-bin]', el).onclick = () => this.closeSheet();
  }
}
function roomBlurb(id) {
  return { living: 'Sofa, fireplace, the good window onto the lane.', kitchen: 'Counters to surf, a fridge to sit on, a garden view. Room for a second feeding station.', bedroom: 'A big quilted bed (cat pile!), a laundry basket and a rooftop view.', sunroom: 'Three big windows, wicker chairs and sunbeams all day. Perfect for bird watching.', playroom: 'Soft mats, a teepee, a beanbag and space for the biggest cat towers.' }[id];
}
