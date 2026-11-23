// NUBBINS — menus, HUD, announcer text and comic words (all plain DOM).
import { ROSTER, BY_KEY, PLAYABLE } from './roster.js';

import { sfx } from './audio.js';
import { ALPHA } from './net.js';
import * as THREE from '../lib/three.module.min.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const K = (t, c = '') => `<span class="k ${c}">${t}</span>`;
const IN = { s: K('★', 's'), p: K('P', 'p'), k: K('K', 'kk'), b: K('BLOCK', 'b'), x: K('RUSH', 'x'), f: K('→'), d: K('↓'), u: K('↑'), bk: K('←') };

export class UI {
  constructor(G) {
    this.G = G;
    this.root = $('#ui');
    this.root.innerHTML = `<div id="scr"></div><div id="fightLayer" hidden><div id="hud"></div><div id="words"></div><div id="ann"></div><div id="netb" hidden></div></div><div id="flash"></div><div id="over"></div><div id="toast" hidden></div>`;
    this.scr = $('#scr'); this.fight = $('#fightLayer'); this.words = $('#words'); this.ann = $('#ann'); this.flashEl = $('#flash'); this.over = $('#over');
    this.nav = { items: [], i: 0, cols: 1, back: null };
    this.tmpV = new THREE.Vector3();
  }

  // --------------------------------------------------------- navigation
  setNav(items, cols = 1, back = null, start = 0) {
    this.nav = { items: items.filter(Boolean), i: Math.min(start, Math.max(0, items.length - 1)), cols, back };
    this.paintNav();
  }
  paintNav() { this.nav.items.forEach((el, i) => el.classList.toggle('sel', !!(i === this.nav.i && this.keyboardUsed))); }
  onNav(a) {
    const N = this.nav;
    this.keyboardUsed = true;
    if (this.customNav && this.customNav(a) !== undefined) return true;
    if (!N.items.length && a !== 'back' && a !== 'pause') return false;
    const n = N.items.length;
    if (a === 'left') N.i = (N.i - 1 + n) % n;
    else if (a === 'right') N.i = (N.i + 1) % n;
    else if (a === 'up') N.i = N.cols > 1 ? (N.i - N.cols + n) % n : (N.i - 1 + n) % n;
    else if (a === 'down') N.i = N.cols > 1 ? (N.i + N.cols) % n : (N.i + 1) % n;
    else if (a === 'ok') { const el = N.items[N.i]; if (el) { el.classList.add('press'); setTimeout(() => el.classList.remove('press'), 120); el.click(); } return true; }
    else if (a === 'back') { if (N.back) { sfx('back'); N.back(); } return true; }
    else if (a === 'pause') { if (this.G.match) this.G.togglePause(); return true; }
    sfx('move');
    this.paintNav();
    return true;
  }

  screen(html, cls = '') {
    this.customNav = null; this.G.input.typeHook = null; this.G.netMenu = false;
    this.scr.innerHTML = `<div class="screen ${cls}">${html}</div>`;
    const s = this.scr.firstElementChild;
    for (const b of s.querySelectorAll('button')) b.addEventListener('pointerdown', () => { this.keyboardUsed = false; this.paintNav(); });
    return s;
  }
  clear() { this.scr.innerHTML = ''; this.customNav = null; this.G.input.typeHook = null; this.G.netMenu = false; this.nav = { items: [], i: 0, cols: 1, back: null }; }
  btn(el, fn) { el.addEventListener('click', e => { e.preventDefault(); sfx('confirm'); fn(); }); return el; }

  // ------------------------------------------------------------ loading
  loading(p, msg) {
    let s = $('#loading');
    if (!s) { s = this.screen(`<h1 class="candy">NUBBINS</h1><div class="loadbar"><i></i></div><p></p>`); s.id = 'loading'; }
    $('.loadbar i', s).style.width = Math.round(p * 100) + '%';
    $('p', s).textContent = msg || 'Pouring the gummies…';
  }

  // -------------------------------------------------------------- title
  title() {
    const G = this.G;
    const s = this.screen(`
      <p class="tagline">Squishy. See-through. Totally brutal.</p>
      <div class="menus"><div class="menu">
        <button class="btn gold start" id="mArcade">ARCADE</button>
        <button class="btn mint" id="mVs">VERSUS</button>
        <button class="btn lime" id="mPractice">PRACTICE</button>
        <button class="btn berry" id="mOnline">ONLINE</button>
      </div>
      <div class="menu two">
        <button class="btn alt small" id="mMoves">MOVES</button>
        <button class="btn alt small" id="mSettings">SETTINGS</button>
      </div></div>
      <div class="foot">A game dreamed up for Nora's Library</div>`);
    s.id = 'title';
    this.btn($('#mArcade', s), () => G.flowArcade());
    this.btn($('#mVs', s), () => G.flowVersus());
    this.btn($('#mPractice', s), () => G.flowPractice());
    this.btn($('#mOnline', s), () => G.flowOnline());
    this.btn($('#mMoves', s), () => this.moves(null, () => G.toTitle()));
    this.btn($('#mSettings', s), () => this.settings(() => G.toTitle()));
    this.setNav([...s.querySelectorAll('.btn')], 1, null);
  }

  // --------------------------------------------------- character select
  select(o) {
    // o: { heading, picker: 0|1, locked: {}, other: key, toggleP2: bool, p2human, onPick(key), onBack(), onHover(key) }
    const G = this.G;
    const keys = ROSTER.map(r => r.key);
    const unlocked = k => !BY_KEY[k].boss || G.save.unlocked.gummoth;
    let cur = Math.max(0, keys.indexOf(o.start || 'cherry'));
    const s = this.screen(`
      <div class="top">
        <button class="btn small alt" id="sBack">◀ BACK</button>
        <h2 class="candy" style="--c1:${o.picker ? '#9ae8ff' : '#ff9ac0'};--c2:${o.picker ? '#1a8ad8' : '#ff3a6e'}">${esc(o.heading)}</h2>
        ${o.toggleP2 ? `<button class="btn small mint" id="sP2">P2: ${o.p2human ? 'PLAYER' : 'COMPUTER'}</button>` : '<span style="width:96px"></span>'}
      </div>
      <div class="info"><div class="who p1"></div><div class="who p2"></div></div>
      <div style="width:100%;display:flex;flex-direction:column;align-items:center">
        <div class="grid">${keys.map((k, i) => {
          const r = BY_KEY[k];
          return `<button class="card ${unlocked(k) ? '' : 'locked'}" data-k="${k}" style="--cc:${r.ui}" aria-label="${esc(r.name)}"><img src="${G.portraits[k] || ''}" alt=""><span class="lbl">${unlocked(k) ? esc(r.short) : '???'}</span></button>`;
        }).join('')}</div>
        <div class="selfoot"><button class="btn gold" id="sPick">PICK</button></div>
      </div>`);
    s.id = 'select';
    const cards = [...s.querySelectorAll('.card')];
    const whoMine = $(o.picker ? '.who.p2' : '.who.p1', s), whoOther = $(o.picker ? '.who.p1' : '.who.p2', s);
    const fill = (el, k) => {
      if (!k) { el.hidden = true; return; } el.hidden = false;
      const r = BY_KEY[k];
      if (!unlocked(k)) { el.innerHTML = `<div class="nm candy">???</div><div class="tt">Locked</div><p class="bio">Beat Arcade mode with anyone to unlock this one.</p>`; return; }
      el.innerHTML = `<div class="nm candy" style="--c1:${r.ui2};--c2:${r.ui}">${esc(r.name)}</div><div class="tt">${esc(r.title)}</div><p class="bio">${esc(r.bio)}</p>
        <div class="stars">${Object.entries(r.stars).map(([a, n]) => `<span>${a}</span><b>${'★'.repeat(n)}${'☆'.repeat(5 - n)}</b>`).join('')}</div>`;
    };
    const paint = () => {
      cards.forEach((c, i) => { c.classList.toggle(o.picker ? 'c2' : 'c1', i === cur); c.classList.toggle(o.picker ? 'c1' : 'c2', !!o.other && c.dataset.k === o.other); c.querySelector('.tag')?.remove(); });
      const mine = cards[cur]; mine.insertAdjacentHTML('beforeend', `<span class="tag ${o.picker ? 't2' : 't1'}">${o.youTag ? 'YOU' : o.picker ? (o.p2human ? 'P2' : 'CPU') : 'P1'}</span>`);
      if (o.other) { const oc = cards.find(c => c.dataset.k === o.other); if (oc && oc !== mine) oc.insertAdjacentHTML('beforeend', `<span class="tag ${o.picker ? 't1' : 't2'}">${o.picker ? 'P1' : 'P2'}</span>`); }
      const k = keys[cur];
      fill(whoMine, k); fill(whoOther, o.other || null);
      const pick = $('#sPick', s);
      pick.disabled = !unlocked(k);
      pick.textContent = unlocked(k) ? 'PICK ' + BY_KEY[k].short + '!' : 'LOCKED';
      o.onHover && o.onHover(k);
    };
    cards.forEach((c, i) => c.addEventListener('click', () => {
      if (i === cur && unlocked(keys[i])) { sfx('confirm'); o.onPick(keys[i]); return; }
      cur = i; sfx('select'); paint();
    }));
    this.btn($('#sPick', s), () => { if (unlocked(keys[cur])) o.onPick(keys[cur]); });
    this.btn($('#sBack', s), () => o.onBack());
    if (o.toggleP2) this.btn($('#sP2', s), () => o.onToggleP2());
    this.setNav([], 1, o.onBack);
    this.customNav = a => {
      const n = keys.length;
      if (a === 'left') { cur = (cur - 1 + n) % n; sfx('move'); paint(); return true; }
      if (a === 'right') { cur = (cur + 1) % n; sfx('move'); paint(); return true; }
      if (a === 'up' || a === 'down') return true;
      if (a === 'ok') { if (unlocked(keys[cur])) { sfx('confirm'); o.onPick(keys[cur]); } return true; }
      if (a === 'back') { sfx('back'); o.onBack(); return true; }
      return undefined;
    };
    paint();
  }

  stageSelect(list, onPick, onBack) {
    const s = this.screen(`<div class="panel"><h2 class="candy">PICK AN ARENA</h2>
      <div class="stages">${list.map(st => `<button class="stg" data-k="${st.key}" style="background:linear-gradient(160deg,${st.thumb[0]},${st.thumb[1]} 60%,${st.thumb[2]})"><span>${esc(st.name)}</span><small>${esc(st.blurb || '')}</small></button>`).join('')}
      <button class="stg" data-k="random" style="background:linear-gradient(135deg,#ff4f7a,#ffd34f,#5ad1ff,#9cff6a)">RANDOM</button></div>
      <div class="row" style="margin-top:14px"><button class="btn small alt" id="stBack">◀ BACK</button></div></div>`);
    const items = [...s.querySelectorAll('.stg')];
    items.forEach(b => this.btn(b, () => onPick(b.dataset.k === 'random' ? list[Math.random() * list.length | 0].key : b.dataset.k)));
    this.btn($('#stBack', s), onBack);
    this.setNav([...items, $('#stBack', s)], 1, onBack);
  }

  versus(a, b, ms = 2200) {
    const A = BY_KEY[a], B = BY_KEY[b], G = this.G;
    const s = this.screen(`<div class="half l" style="--a1:${A.ui};--a2:#1a0620"><img src="${G.portraits[a]}" alt=""><div class="nm candy" style="--c1:${A.ui2};--c2:${A.ui}">${esc(A.name)}</div></div>
      <div class="half r" style="--b1:${B.ui};--b2:#1a0620"><img src="${G.portraits[b]}" alt=""><div class="nm candy" style="--c1:${B.ui2};--c2:${B.ui}">${esc(B.name)}</div></div>
      <div class="vsword candy">VS</div>`);
    s.id = 'vs';
    this.setNav([], 1, null);
    return new Promise(r => setTimeout(r, ms));
  }

  ladder(player, list, at, onGo, onQuit, stageNames = []) {
    const G = this.G;
    const s = this.screen(`<div class="panel" style="max-width:520px"><h2 class="candy">THE CLIMB</h2>
      <div class="ladder">${list.map((k, i) => `<div class="rung ${i < at ? 'done' : ''} ${i === at ? 'now' : ''} ${BY_KEY[k].boss ? 'boss' : ''}"><img src="${G.portraits[k]}" alt=""><span class="n">${i + 1}. ${esc(BY_KEY[k].name)}</span></div>`).join('')}</div>
      <p style="text-align:center;font-weight:900;margin:14px 0 6px">${at === list.length - 1 ? 'The King of the Jar is waiting on top of the fridge.' : `Fight ${at + 1} of ${list.length}`}${stageNames[at] && at < list.length - 1 ? ` · <span style="color:var(--gold)">${esc(stageNames[at])}</span>` : ''}</p>
      <div class="row"><button class="btn small alt" id="lQuit">QUIT</button><button class="btn gold" id="lGo">FIGHT!</button></div></div>`);
    this.btn($('#lGo', s), onGo); this.btn($('#lQuit', s), onQuit);
    this.setNav([$('#lGo', s), $('#lQuit', s)], 1, onQuit);
    void player;
  }

  continueScreen(onYes, onNo) {
    let n = 9;
    const s = this.screen(`<div class="panel" style="max-width:420px;text-align:center"><h2 class="candy" style="--c1:#ff9ac0;--c2:#ff3a6e">CONTINUE?</h2><div class="count candy">9</div>
      <div class="row" style="margin-top:12px"><button class="btn gold" id="cYes">YES!</button><button class="btn small alt" id="cNo">NO</button></div></div>`);
    const tick = setInterval(() => { n--; const c = $('.count', s); if (!c) { clearInterval(tick); return; } c.textContent = n; sfx('select'); if (n <= 0) { clearInterval(tick); onNo(); } }, 1000);
    this.btn($('#cYes', s), () => { clearInterval(tick); onYes(); });
    this.btn($('#cNo', s), () => { clearInterval(tick); onNo(); });
    this.setNav([$('#cYes', s), $('#cNo', s)], 1, () => { clearInterval(tick); onNo(); });
  }

  ending(key, unlockedNow, onDone) {
    const r = BY_KEY[key], G = this.G;
    const s = this.screen(`<div class="panel ending" style="text-align:center"><h2 class="candy" style="--c1:${r.ui2};--c2:${r.ui}">${esc(r.name)} WINS IT ALL</h2>
      <img src="${G.portraits[key]}" alt=""><p>${esc(r.ending)}</p>
      ${unlockedNow ? `<p style="color:var(--gold);font-family:var(--display);font-size:22px">GUMMOTH is now playable!</p>` : ''}
      <div class="row"><button class="btn gold" id="eOk">THE END</button></div></div>`);
    this.btn($('#eOk', s), onDone);
    this.setNav([$('#eOk', s)], 1, onDone);
  }

  results(res, onAgain, onSelect, onTitle) {
    const W = BY_KEY[res.winnerKey];
    const s = this.screen(`<div class="panel" style="max-width:480px;text-align:center"><h2 class="candy" style="--c1:${W.ui2};--c2:${W.ui}">${esc(W.name)} WINS</h2>
      ${res.nubbed ? '<p style="font-family:var(--display);font-size:22px;color:#ffb0f0;margin:0 0 10px">with a NUBBINATION!</p>' : ''}
      <div class="row" style="flex-direction:column"><button class="btn gold" id="rAgain">REMATCH</button><button class="btn mint small" id="rSel">CHANGE BEARS</button><button class="btn alt small" id="rTitle">TITLE</button></div></div>`);
    this.btn($('#rAgain', s), onAgain); this.btn($('#rSel', s), onSelect); this.btn($('#rTitle', s), onTitle);
    this.setNav([$('#rAgain', s), $('#rSel', s), $('#rTitle', s)], 1, onTitle);
  }

  // ------------------------------------------------------------- online
  onlineMenu(h) {
    const s = this.screen(`<div class="panel online"><h2 class="candy">PLAY ONLINE</h2>
      <p class="onote">Fight a friend on their own iPad or computer. One of you makes a room, then tells the other its four letters.</p>
      <div class="row ocol"><button class="btn gold" id="oMake">MAKE A ROOM</button><button class="btn mint" id="oJoin">JOIN A ROOM</button><button class="btn alt small" id="oBack">◀ BACK</button></div></div>`);
    this.btn($('#oMake', s), h.onMake); this.btn($('#oJoin', s), h.onJoin); this.btn($('#oBack', s), h.onBack);
    this.setNav([$('#oMake', s), $('#oJoin', s), $('#oBack', s)], 1, h.onBack);
  }
  onlineRoom(code, onBack) {
    const s = this.screen(`<div class="panel online"><h2 class="candy">YOUR ROOM</h2>
      <div class="codebig">${[...code].map(c => `<b>${esc(c)}</b>`).join('')}</div>
      <p class="onote">Tell your friend these four letters. They press <b>ONLINE</b>, then <b>JOIN A ROOM</b>.</p>
      <p class="owait"><i></i><i></i><i></i> Waiting for your friend</p>
      <div class="row ocol"><button class="btn alt small" id="oBack">◀ CLOSE THE ROOM</button></div></div>`);
    this.btn($('#oBack', s), onBack);
    this.setNav([$('#oBack', s)], 1, onBack);
  }
  onlineJoin(o) {
    let code = (o.code || '').slice(0, 4);
    const s = this.screen(`<div class="panel online"><h2 class="candy">JOIN A ROOM</h2>
      <p class="onote">Type the four letters your friend sees.</p>
      <div class="codebig entry">${[0, 1, 2, 3].map(() => '<b></b>').join('')}</div>
      <p class="oerr" ${o.error ? '' : 'hidden'}>${esc(o.error || '')}</p>
      <div class="lpad">${[...ALPHA].map(c => `<button data-c="${c}">${c}</button>`).join('')}<button data-c="del" class="del" aria-label="Rub out">⌫</button></div>
      <div class="row"><button class="btn alt small" id="oBack">◀ BACK</button><button class="btn gold" id="oGo" disabled>JOIN</button></div></div>`);
    const slots = [...s.querySelectorAll('.codebig b')], go = $('#oGo', s);
    const paint = () => { slots.forEach((b, i) => { b.textContent = code[i] || ''; b.classList.toggle('now', i === code.length); }); go.disabled = code.length < 4; };
    const add = c => { if (code.length < 4) { code += c; sfx('select'); paint(); } };
    const del = () => { if (code.length) { code = code.slice(0, -1); sfx('back'); paint(); } };
    const join = () => { if (code.length === 4) { sfx('confirm'); o.onJoin(code); } };
    for (const b of s.querySelectorAll('.lpad button')) b.addEventListener('click', e => { e.preventDefault(); if (b.dataset.c === 'del') del(); else add(b.dataset.c); });
    go.addEventListener('click', e => { e.preventDefault(); join(); });
    this.btn($('#oBack', s), o.onBack);
    this.setNav([$('#oBack', s), go], 2, o.onBack, 1);
    this.G.input.typeHook = e => {
      const m = /^Key([A-Z])$/.exec(e.code);
      if (m) { if (ALPHA.includes(m[1])) add(m[1]); return true; }
      if (e.code === 'Backspace') { del(); return true; }
      if (e.code === 'Enter' || e.code === 'NumpadEnter') { join(); return true; }
      if (e.code === 'Escape') { sfx('back'); o.onBack(); return true; }
      return false;
    };
    paint();
  }
  // a message with buttons: buttons = [[label, class, fn], ...]
  onlineMsg(title, text, buttons = [], wait = false) {
    const s = this.screen(`<div class="panel online"><h2 class="candy">${esc(title)}</h2>
      ${text ? `<p class="onote">${esc(text)}</p>` : ''}${wait ? '<p class="owait"><i></i><i></i><i></i></p>' : ''}
      <div class="row ocol">${buttons.map((b, i) => `<button class="btn ${b[1] || ''}" data-i="${i}">${esc(b[0])}</button>`).join('')}</div></div>`);
    const els = [...s.querySelectorAll('.ocol .btn')];
    els.forEach((el, i) => this.btn(el, buttons[i][2]));
    const back = buttons.find(b => /BACK|LEAVE|OK|CLOSE/.test(b[0]));
    this.setNav(els, 1, back ? back[2] : null);
    return s;
  }
  // both bears side by side while the other player decides
  onlinePair(keys, local, text, buttons = []) {
    const G = this.G;
    const card = (k, i) => { const r = k && BY_KEY[k]; return `<div class="opick ${i === local ? 'me' : ''}">${r ? `<img src="${G.portraits[k]}" alt=""><b class="candy" style="--c1:${r.ui2};--c2:${r.ui}">${esc(r.short)}</b>` : '<div class="q">?</div><b>…</b>'}<small>${i === local ? 'YOU' : 'FRIEND'}</small></div>`; };
    const s = this.screen(`<div class="panel online"><div class="opair">${card(keys[0], 0)}<span class="candy ovs">VS</span>${card(keys[1], 1)}</div>
      <p class="owait"><i></i><i></i><i></i> ${esc(text)}</p>
      <div class="row ocol">${buttons.map((b, i) => `<button class="btn ${b[1] || ''}" data-i="${i}">${esc(b[0])}</button>`).join('')}</div></div>`);
    const els = [...s.querySelectorAll('.ocol .btn')];
    els.forEach((el, i) => this.btn(el, buttons[i][2]));
    this.setNav(els, 1, buttons.length ? buttons[buttons.length - 1][2] : null);
  }
  onlineResults(res, local, h) {
    const W = BY_KEY[res.winnerKey], won = res.winner === local;
    const s = this.screen(`<div class="panel online"><h2 class="candy" style="--c1:${W.ui2};--c2:${W.ui}">${won ? 'YOU WIN!' : 'YOUR FRIEND WINS'}</h2>
      <p class="onote">${esc(W.name)}${res.nubbed ? ' with a NUBBINATION!' : ' takes it.'}</p>
      <p class="owait" hidden><i></i><i></i><i></i> <span></span></p>
      <div class="row ocol"><button class="btn gold" id="rAgain">REMATCH</button><button class="btn mint small" id="rSel">NEW BEARS</button><button class="btn alt small" id="rLeave">LEAVE</button></div></div>`);
    this.btn($('#rAgain', s), h.onAgain); this.btn($('#rSel', s), h.onRepick); this.btn($('#rLeave', s), h.onLeave);
    this.setNav([$('#rAgain', s), $('#rSel', s), $('#rLeave', s)], 1, h.onLeave);
    return t => { const w = $('.owait', s); if (!w) return; w.hidden = !t; $('span', w).textContent = t || ''; };
  }
  // the fight can't stop online, so this menu floats over it while it carries on
  fightMenu(h) {
    const G = this.G;
    const s = this.screen(`<div class="panel online fm"><h2 class="candy">MENU</h2><p class="onote">The fight keeps going while this is open!</p>
      <div class="row ocol"><button class="btn gold" id="fRes">KEEP FIGHTING</button><button class="btn alt small" id="fSet">SETTINGS</button>
      ${G.canFullscreen() ? '<button class="btn alt small" id="fFull">FULL SCREEN</button>' : ''}<button class="btn small" id="fLeave">LEAVE THE MATCH</button></div></div>`, 'fmenu');
    G.netMenu = true;
    this.btn($('#fRes', s), h.onResume);
    this.btn($('#fSet', s), () => { this.settings(() => this.fightMenu(h)); G.netMenu = true; });
    if ($('#fFull', s)) this.btn($('#fFull', s), () => G.toggleFullscreen());
    this.btn($('#fLeave', s), h.onLeave);
    this.setNav([...s.querySelectorAll('.btn')], 1, h.onResume);
  }
  netBanner(text) {
    const b = $('#netb'); if (!b) return;
    if (this.netText === text) return; this.netText = text;
    b.hidden = !text; if (text) b.innerHTML = `<i></i><i></i><i></i> ${esc(text)}`;
  }
  toast(text, sec = 2.6) {
    const t = $('#toast'); if (!t) return;
    t.textContent = text; t.hidden = false; t.classList.remove('go'); void t.offsetWidth; t.classList.add('go');
    clearTimeout(this.toastT); this.toastT = setTimeout(() => { t.hidden = true; }, sec * 1000);
  }

  // -------------------------------------------------------------- pause
  pause(o) {
    const G = this.G;
    const practice = o.practice;
    const s = this.screen(`<div class="dim"></div><div class="panel" style="max-width:440px;position:relative"><h2 class="candy">PAUSED</h2>
      <div class="row" style="flex-direction:column;align-items:stretch">
        <button class="btn gold" id="pRes">KEEP FIGHTING</button>
        ${practice ? `<button class="btn mint small" id="pDummy">DUMMY: ${({ none: 'STANDS STILL', block: 'BLOCKS', cpu: 'FIGHTS BACK', crouch: 'CROUCHES', jump: 'JUMPS' })[o.dummy] || 'STANDS STILL'}</button>` : ''}
        <button class="btn alt small" id="pMoves">MOVES</button>
        <button class="btn alt small" id="pSet">SETTINGS</button>
        ${G.canFullscreen() ? `<button class="btn alt small" id="pFull">FULL SCREEN</button>` : ''}
        <button class="btn small" id="pQuit">QUIT TO TITLE</button>
      </div></div>`);
    this.btn($('#pRes', s), o.onResume);
    if (practice) this.btn($('#pDummy', s), o.onDummy);
    this.btn($('#pMoves', s), () => this.moves(o.charKey, () => this.pause(o)));
    this.btn($('#pSet', s), () => this.settings(() => this.pause(o)));
    if ($('#pFull', s)) this.btn($('#pFull', s), () => G.toggleFullscreen());
    this.btn($('#pQuit', s), o.onQuit);
    this.setNav([...s.querySelectorAll('.btn')], 1, o.onResume);
  }

  // -------------------------------------------------------------- moves
  moves(key, onBack) {
    const keys = ROSTER.filter(r => !r.boss || this.G.save.unlocked.gummoth).map(r => r.key);
    let k = key && keys.includes(key) ? key : keys[0];
    const render = () => {
      const r = BY_KEY[k], m = r.moves;
      const s = this.screen(`<div class="panel"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><button class="btn small alt" id="mvBack2">◀ BACK</button><h2 class="candy" style="--c1:${r.ui2};--c2:${r.ui};margin:0;flex:1">${esc(r.name)}</h2><span style="width:90px"></span></div>
        <div class="mvchar">${keys.map(x => `<button data-k="${x}" class="${x === k ? 'sel' : ''}">${esc(BY_KEY[x].short)}</button>`).join('')}</div>
        <table class="mv">
          <tr class="sec"><td colspan="2">SPECIAL MOVES</td></tr>
          <tr><td>${esc(m.sp.name)}</td><td class="in">${IN.s}</td></tr>
          <tr><td>${esc(m.fsp.name)}</td><td class="in">${IN.f} + ${IN.s}</td></tr>
          <tr><td>${esc(m.dsp.name)}</td><td class="in">${IN.d} + ${IN.s}</td></tr>
          <tr><td>Sugar Rush <small style="opacity:.7">(when the rainbow bar is full)</small></td><td class="in">${IN.x}</td></tr>
          <tr class="sec"><td colspan="2">NUB 'EM! <small style="opacity:.7">(when the other bear is wobbly at the end)</small></td></tr>
          <tr><td>${esc(r.finisher.name)}</td><td class="in">${IN.d} + ${IN.s}</td></tr>
          <tr class="sec"><td colspan="2">EVERYBODY CAN</td></tr>
          <tr><td>Jab, jab, kick combo</td><td class="in">${IN.p} ${IN.p} ${IN.k}</td></tr>
          <tr><td>Gumdrop Uppercut</td><td class="in">${IN.d} + ${IN.p}</td></tr>
          <tr><td>Taffy Sweep</td><td class="in">${IN.d} + ${IN.k}</td></tr>
          <tr><td>Bonk (hits crouchers)</td><td class="in">${IN.f} + ${IN.p}</td></tr>
          <tr><td>Jiggle Spin Kick</td><td class="in">${IN.f} + ${IN.k}</td></tr>
          <tr><td>Bear Hug (up close)</td><td class="in">${IN.f} + ${IN.p}</td></tr>
          <tr><td>Block</td><td class="in">${IN.b} or hold ${IN.bk}</td></tr>
          <tr><td>Jump</td><td class="in">${IN.u}</td></tr>
        </table>
        <p class="keys"><b>Keyboard:</b> arrows or WASD to move, J punch, K kick, L special, I or Space block, U rush. <b>Two players on one keyboard:</b> P1 WASD + F G H, R block, T rush; P2 arrows + 1 2 3 on the number pad, 0 block. Gamepads work too.</p>
        <div class="row"><button class="btn small alt" id="mvBack">◀ BACK</button></div></div>`);
      for (const b of s.querySelectorAll('.mvchar button')) b.addEventListener('click', () => { k = b.dataset.k; sfx('select'); render(); });
      this.btn($('#mvBack', s), onBack); this.btn($('#mvBack2', s), onBack);
      this.setNav([$('#mvBack2', s)], 1, onBack);
      this.customNav = a => { if (a === 'left' || a === 'right') { const i = keys.indexOf(k); k = keys[(i + (a === 'left' ? -1 : 1) + keys.length) % keys.length]; sfx('move'); render(); return true; } return undefined; };
    };
    render();
  }

  // ----------------------------------------------------------- settings
  settings(onBack) {
    const G = this.G, st = G.save.settings;
    const seg = (id, opts, val) => `<div class="seg" data-id="${id}">${opts.map(([v, l]) => `<button data-v="${v}" class="${String(v) === String(val) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    const s = this.screen(`<div class="panel" style="max-width:560px"><h2 class="candy">SETTINGS</h2>
      <div class="setrow"><span>Computer</span>${seg('difficulty', [[0, 'EASY'], [1, 'NORMAL'], [2, 'HARD']], st.difficulty)}</div>
      <div class="setrow"><span>Music</span>${seg('music', [[1, 'ON'], [0, 'OFF']], +st.music)}</div>
      <div class="setrow"><span>Sounds</span>${seg('sfx', [[1, 'ON'], [0, 'OFF']], +st.sfx)}</div>
      <div class="setrow"><span>Announcer voice</span>${seg('voice', [[1, 'ON'], [0, 'OFF']], +st.voice)}</div>
      <div class="setrow"><span>Graphics</span>${seg('quality', [['auto', 'AUTO'], ['high', 'FANCY'], ['low', 'FAST']], st.quality)}</div>
      <div class="setrow"><span>Erase progress</span><button class="btn small" id="sErase" style="min-height:38px">ERASE</button></div>
      <div id="eraseBox"></div>
      <div class="row" style="margin-top:14px"><button class="btn gold" id="sDone">DONE</button></div></div>`);
    for (const sg of s.querySelectorAll('.seg')) for (const b of sg.querySelectorAll('button')) b.addEventListener('click', () => {
      const id = sg.dataset.id; let v = b.dataset.v;
      if (id === 'difficulty') v = +v; else if (id !== 'quality') v = v === '1';
      G.setSetting(id, v); sfx('select');
      sg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    });
    this.btn($('#sErase', s), () => {
      const box = $('#eraseBox', s);
      box.innerHTML = `<div class="confirm"><b>Erase unlocks and records? Settings stay.</b><div class="row"><button class="btn small" id="eYes">YES, ERASE</button><button class="btn small alt" id="eNo">KEEP THEM</button></div></div>`;
      this.btn($('#eYes', box), () => { G.eraseProgress(); box.innerHTML = '<p style="text-align:center;font-weight:900">Erased.</p>'; });
      this.btn($('#eNo', box), () => { box.innerHTML = ''; });
    });
    this.btn($('#sDone', s), onBack);
    this.setNav([$('#sDone', s)], 1, onBack);
  }

  // ------------------------------------------------------------- the HUD
  enterFight(on) {
    this.fight.hidden = !on;
    if (on) {
      this.clear();
      $('#hud').innerHTML = [0, 1].map(i => `<div class="side p${i + 1}"><div class="nameRow"><span class="nm"></span><span class="wins"><i></i><i></i></span></div>
        <div class="bar"><div class="drain"></div><div class="fill"></div></div><span class="meter"><i></i></span></div>`).join('<div class="mid"><div id="timer" class="candy">60</div><button id="pauseBtn" aria-label="Pause">II</button></div>');
      $('#pauseBtn').addEventListener('click', () => this.G.togglePause());
      this.ann.innerHTML = ''; this.words.innerHTML = '';
      this.hudCache = null;
    }
  }

  hud(M, reset) {
    const sides = document.querySelectorAll('#hud .side');
    if (!sides.length) return;
    if (reset || !this.hudCache) {
      this.hudCache = [{}, {}];
      M.fighters.forEach((F, i) => {
        const s = sides[i];
        $('.nm', s).textContent = F.def.name;
        s.classList.toggle('you', !!(M.net && M.net.local === i));
        const c1 = F.def.flavor.tint, c2 = F.def.ui;
        $('.fill', s).style.setProperty('--hc1', c1); $('.fill', s).style.setProperty('--hc2', c2);
      });
    }
    M.fighters.forEach((F, i) => {
      const s = sides[i], c = this.hudCache[i];
      const hp = Math.round((F.hp / F.maxhp) * 1000) / 10;
      if (c.hp !== hp) { c.hp = hp; $('.fill', s).style.width = hp + '%'; $('.drain', s).style.width = hp + '%'; $('.bar', s).classList.toggle('low', hp < 25); }
      const mt = Math.round(F.meter);
      if (c.mt !== mt) { c.mt = mt; $('.meter i', s).style.width = mt + '%'; $('.meter', s).classList.toggle('full', mt >= 100); const ri = M.net ? (i === M.net.local ? 0 : -1) : i; if (ri >= 0) this.G.input.setRush(ri, mt >= 100); }
      const w = M.wins[i];
      if (c.w !== w) { c.w = w; s.querySelectorAll('.wins i').forEach((d, k) => d.classList.toggle('on', k < w)); }
    });
    const tm = M.mode === 'practice' ? '∞' : String(Math.max(0, M.timer));
    if (this.hudTimer !== tm) { this.hudTimer = tm; const t = $('#timer'); if (t) t.textContent = tm; }
  }

  announce(text, kind = 'round', dur = 1.4) {
    const el = document.createElement('div');
    el.className = 'announce candy ' + kind; el.textContent = text;
    if (kind !== 'small') for (const o of this.ann.querySelectorAll('.announce:not(.small)')) o.remove();
    this.ann.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 380); }, dur * 1000);
  }

  finisherName(name) {
    const el = document.createElement('div'); el.className = 'finName candy'; el.textContent = name;
    this.ann.appendChild(el); setTimeout(() => el.remove(), 3200);
  }

  comic(word, pt, color = '#fff', scale = 1) {
    if (this.words.childElementCount > 10) this.words.firstElementChild.remove();
    const cam = this.G.camera; const v = this.tmpV.copy(pt).project(cam);
    const rect = this.G.viewRect();
    const x = rect.left + (v.x * 0.5 + 0.5) * rect.width, y = rect.top + (-v.y * 0.5 + 0.5) * rect.height - 30;
    const el = document.createElement('div');
    el.className = 'comic candy'; el.textContent = word;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    el.style.setProperty('--s', scale); el.style.setProperty('--r', ((Math.random() - 0.5) * 22).toFixed(1) + 'deg');
    el.style.setProperty('--c1', '#fff'); el.style.setProperty('--c2', color);
    this.words.appendChild(el);
    setTimeout(() => el.remove(), 850);
  }

  combo(side, n) {
    let el = this.ann.querySelector('.combo.p' + (side + 1));
    if (el) el.remove();
    el = document.createElement('div'); el.className = 'combo candy p' + (side + 1);
    el.innerHTML = `${n} HIT<small>COMBO!</small>`;
    this.ann.appendChild(el);
    clearTimeout(this['ct' + side]); this['ct' + side] = setTimeout(() => el.remove(), 1100);
  }

  flash(color, a = 0.3) {
    const f = this.flashEl; f.style.transition = 'none'; f.style.background = color; f.style.opacity = a;
    requestAnimationFrame(() => { f.style.transition = 'opacity .35s'; f.style.opacity = 0; });
  }

  hint(side, on) {
    const el = this.ann.querySelector('.nubHint.p' + (side + 1));
    if (!on) { if (el) el.remove(); document.querySelectorAll('.tb.spec').forEach(b => b.classList.remove('hintme')); return; }
    if (el) return;
    const h = document.createElement('div'); h.className = 'nubHint p' + (side + 1);
    h.innerHTML = this.G.input.usedTouch ? `Hold <b>↓</b> and tap <b>★</b>!` : `Press <b>↓</b> + <b>★ SPECIAL</b>!`;
    this.ann.appendChild(h);
    const cl = document.querySelectorAll('.tpad')[side]; if (cl) cl.querySelector('.tb.spec').classList.add('hintme');
  }
}
