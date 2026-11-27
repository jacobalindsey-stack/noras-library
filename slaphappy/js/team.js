// Slap Happy on a phone: join a show, pick a team name, colour and buzzer
// sound, then the whole phone becomes one big slappable buzzer.

import { $, esc, COLORS, colorOf, teamStyle, randomName, SPEED, stayAwake, confetti, rain, bindTaps } from './common.js';
import { Link, rid, isCode } from './net.js';
import { BUZZERS, buzzer, play, setSound, prefs } from './sound.js';
import { haptic } from './haptics.js';

const SAVE = 'slaphappy.team.v1';
export function savedTeam() {
  try { const s = JSON.parse(localStorage.getItem(SAVE) || 'null'); if (s && Date.now() - s.t < 6 * 3600e3 && isCode(s.room) && s.name) return s; } catch (e) {}
  return null;
}
const soundIcon = on => on
  ? '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>'
  : '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';

let T = null;

export function startTeam(app, { code, back }) {
  if (T && T.link) T.link.close();
  T = { app, back, room: null, id: null, name: '', color: null, sound: null, link: null, info: null, view: null, joined: false, hostOn: true,
    armed: false, armT: 0, slapped: false, lockUntil: 0, armTimer: null, countT: null, enteredAt: 0, lastTest: 0, lastV: null, judged: false };
  window.SLAP = window.SLAP || {}; window.SLAP.team = T;
  if (isCode(code)) connect(code); else letters();
}

function letters(err = '', code = '') {
  if (T.link) { T.link.close(); T.link = null; }
  T.app.innerHTML = `
  <div class="screen join scroll">
    <div class="rays"></div>
    <div class="inner">
      <h2>Join the show</h2>
      <p class="hint">Type the four letters on the big screen</p>
      <input class="letters" maxlength="4" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" enterkeyhint="go" placeholder="ABCD" value="${esc(code)}" aria-label="Room letters">
      <p class="err">${esc(err)}</p>
      <button class="btn big pink go" data-act="go">Join</button>
      <button class="btn ghost small back" data-act="back">Back</button>
    </div>
  </div>`;
  const inp = $('.letters', T.app);
  inp.addEventListener('input', () => { inp.value = inp.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4); });
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  const go = () => {
    const c = inp.value.toUpperCase();
    if (c.length < 4) { $('.err', T.app).textContent = 'The room has four letters.'; return; }
    if (!isCode(c)) { $('.err', T.app).textContent = `There's no show called ${c}. Room letters never have vowels.`; return; }
    connect(c);
  };
  bindTaps(T.app.firstElementChild, { go, back: () => { T.back(); } });
  setTimeout(() => { if (!code) inp.focus(); }, 60);
}

function waiting(msg) {
  T.app.innerHTML = `<div class="screen join"><div class="rays"></div><div class="inner"><h2>${esc(msg)}</h2><p class="hint">${esc(T.room)}</p></div></div>`;
}

function connect(code) {
  T.room = code;
  const s = savedTeam();
  if (s && s.room === code) { T.id = s.id; T.name = s.name; T.color = s.color; T.sound = s.sound; T.joined = true; }
  else { T.id = rid(12); T.joined = false; }
  waiting('Finding the show');
  T.link = new Link(`/room/${code}?team=${T.id}`, {
    message: onMsg,
    status: st => { const el = $('.tconn', T.app); if (el) { el.textContent = 'Reconnecting'; el.classList.toggle('show', st !== 'open'); } },
    fatal: why => {
      T.link = null;
      if (why === 'noroom') letters(`No show is using ${code} right now. Check the letters on the big screen.`, code);
      else if (why === 'full') letters('That show already has every seat filled.', code);
      else if (why === 'kicked') { try { localStorage.removeItem(SAVE); } catch (e) {} letters('The big screen took your team out of the show. You can join again.', code); }
      else letters('Something went wrong joining. Try again.', code);
    },
  });
  // the relay can't be reached at all (no internet, or not on noralindsey.com)
  T.failT = setTimeout(() => { if (T.link && !T.link.isOpen && !T.view) letters("Can't reach the show. Check that this phone is online.", code); }, 12000);
}

function onMsg(m) {
  if (m.t === 'hello') {
    clearTimeout(T.failT);
    T.hostOn = m.host;
    if (T.joined) { sendJoin(); if (!T.view) playScreen(); }
    else setup();
    hostPill();
  } else if (m.t === 'info') {
    T.info = m;
    if (!T.joined && $('.swatches', T.app)) refreshSetup();
  } else if (m.t === 'host') {
    T.hostOn = m.on; hostPill();
  } else if (m.t === 'ended') {
    T.link.close(); T.link = null;
    try { localStorage.removeItem(SAVE); } catch (e) {}
    T.app.innerHTML = `<div class="screen join"><div class="rays"></div><div class="inner"><h2>That's a wrap!</h2><p class="hint">Thanks for playing Slap Happy</p><button class="btn big pink go" data-act="again">Join another show</button></div></div>`;
    bindTaps(T.app.firstElementChild, { again: () => letters() });
  } else if (m.t === 'full') {
    T.link.close(); T.link = null; letters('That show already has eight teams.', T.room);
  } else if (m.t === 'view') {
    T.view = m;
    if (T.joined) { if (!$('.screen.team', T.app)) playScreen(); render(); }
  }
}

function sendJoin() { T.link && T.link.send({ t: 'join', name: T.name, color: T.color, sound: T.sound }); }
function save() { try { localStorage.setItem(SAVE, JSON.stringify({ t: Date.now(), room: T.room, id: T.id, name: T.name, color: T.color, sound: T.sound })); } catch (e) {} }

// ---------- pick a name, colour and buzzer ----------
export function setupForm({ title = 'Your team', name, color, sound, takenColors = [], takenNames = [], takenSounds = [], button = "We're ready" }) {
  name = name || randomName(takenNames);
  color = color && !takenColors.includes(color) ? color : (COLORS.find(c => !takenColors.includes(c.id)) || COLORS[0]).id;
  sound = sound || (BUZZERS.find(b => !takenSounds.includes(b.id)) || BUZZERS[0]).id;
  return `
    <div class="inner">
      <h2>${esc(title)}</h2>
      <div><div class="field-label">Team name</div>
        <div class="namebox"><input class="tn" maxlength="22" value="${esc(name)}" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="done" aria-label="Team name"><button class="dice" data-act="dice" aria-label="Pick a silly name">\u{1F3B2}</button></div></div>
      <div><div class="field-label">Team color</div>
        <div class="swatches">${COLORS.map(c => `<button class="swatch${c.id === color ? ' on' : ''}${takenColors.includes(c.id) ? ' taken' : ''}" data-act="color" data-arg="${c.id}" style="--c:${c.c}" aria-label="${c.id}"></button>`).join('')}</div></div>
      <div><div class="field-label">Buzzer sound</div>
        <div class="sounds">${BUZZERS.map(b => `<button class="snd${b.id === sound ? ' on' : ''}" data-act="sound" data-arg="${b.id}"><span class="e">${b.e}</span>${esc(b.name)}</button>`).join('')}</div></div>
      <p class="err"></p>
      <button class="btn big pink go" data-act="ready">${esc(button)}</button>
    </div>`;
}
export function wireSetup(root, { onReady, takenNames = () => [] }) {
  const pick = (sel, arg) => { root.querySelectorAll(sel).forEach(b => b.classList.toggle('on', b.dataset.arg === arg)); };
  const swatchInk = () => root.querySelectorAll('.swatch').forEach(b => b.style.setProperty('--k', ['lemon', 'lime', 'aqua', 'tangerine'].includes(b.dataset.arg) ? '#062027' : '#fff'));
  swatchInk();
  bindTaps(root, {
    dice: () => { $('.tn', root).value = randomName([...takenNames(), $('.tn', root).value]); play('pop'); haptic('tap'); },
    color: arg => { pick('.swatch', arg); play('pop'); haptic('tap'); },
    sound: arg => { pick('.snd', arg); buzzer(arg); haptic('tap'); },
    ready: () => {
      const name = $('.tn', root).value.trim().replace(/\s+/g, ' ').slice(0, 22);
      if (!name) { $('.err', root).textContent = 'Give your team a name (or roll the dice).'; return; }
      const color = (root.querySelector('.swatch.on:not(.taken)') || root.querySelector('.swatch:not(.taken)'))?.dataset.arg || 'cherry';
      const sound = root.querySelector('.snd.on')?.dataset.arg || 'boing';
      onReady({ name, color, sound });
    },
  });
}

function setup() {
  const i = T.info || {};
  T.app.innerHTML = `<div class="screen join scroll"><div class="rays"></div>${setupForm({ name: T.name, color: T.color, sound: T.sound, takenColors: i.taken || [], takenNames: i.names || [], takenSounds: i.sounds || [] })}</div>`;
  wireSetup(T.app.firstElementChild, {
    takenNames: () => (T.info && T.info.names) || [],
    onReady: ({ name, color, sound }) => {
      T.name = name; T.color = color; T.sound = sound; T.joined = true;
      save(); sendJoin(); stayAwake(); haptic('slap');
      playScreen(); render();
    },
  });
}
function refreshSetup() {
  const taken = (T.info.taken || []).filter(c => c !== T.color || false);
  T.app.querySelectorAll('.swatch').forEach(b => {
    const t = taken.includes(b.dataset.arg);
    b.classList.toggle('taken', t);
    if (t && b.classList.contains('on')) { b.classList.remove('on'); const free = T.app.querySelector('.swatch:not(.taken)'); if (free) free.classList.add('on'); }
  });
}

// ---------- the buzzer ----------
function playScreen() {
  T.app.innerHTML = `
  <div class="screen team">
    <div class="tbar">
      <div class="tname"><i></i><span></span></div>
      <div class="tround"></div>
      <div class="tscore">0</div>
      <button class="iconbtn snd-toggle" data-act="mute" aria-label="Sound on or off">${soundIcon(prefs.sound)}</button>
    </div>
    <div class="tstage"></div>
    <div class="tconn">Reconnecting</div>
  </div>`;
  const scr = T.app.firstElementChild;
  T.lastV = null;
  teamStyle(scr, T.color || 'cherry');
  $('.tname span', scr).textContent = T.name;
  const stage = $('.tstage', scr);
  // slaps register on finger-down, anywhere on the stage, for speed
  stage.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; e.preventDefault(); slap(); });
  stage.addEventListener('touchstart', e => { if (!e.target.closest('button')) e.preventDefault(); }, { passive: false });
  bindTaps(scr, {
    mute: (a, b) => { setSound(!prefs.sound); b.innerHTML = soundIcon(prefs.sound); b.classList.toggle('off', !prefs.sound); },
    reveal: () => { if (performance.now() - T.enteredAt < 500) return; T.link && T.link.send({ t: 'reveal', r: T.view.seq }); haptic('tap'); play('pop'); const b = $('.revealbtn', T.app); if (b) { b.disabled = true; b.textContent = 'Showing the answer'; } },
    yes: () => judge(true),
    no: () => judge(false),
    change: () => { T.joined = false; setup(); },
  });
  hostPill();
}

function judge(ok) {
  if (T.judged || !T.view) return;
  T.judged = true;
  T.link && T.link.send({ t: 'judge', r: T.view.seq, ok });
  // the feel-good (or oh-no) moment happens right under the thumb
  if (ok) { play('correct'); haptic('win'); confetti({ y: innerHeight * 0.75, n: 140 }); }
  else { play('wrong'); haptic('lose'); }
  T.app.querySelectorAll('.judge .btn').forEach(b => { b.disabled = true; });
}

function slap() {
  const v = T.view; if (!v) return;
  const now = performance.now();
  const dome = $('.dome', T.app);
  if (v.v === 'lobby') {
    if (now - T.lastTest < 350) return;
    T.lastTest = now;
    buzzer(T.sound); haptic('slap'); squish(dome);
    T.link && T.link.send({ t: 'slap', r: 0 });
    return;
  }
  if ((v.v === 'get' || v.v === 'next') && !T.armed) {
    if (now < T.lockUntil) return;
    T.lockUntil = now + 800;
    play('early'); haptic('out');
    const w = $('.dome-wrap', T.app); if (w) { w.classList.remove('shake'); void w.offsetWidth; w.classList.add('shake'); }
    setSub('Too early! Wait for the ding.');
    return;
  }
  if (T.armed && !T.slapped && (v.v === 'slap' || v.v === 'get')) {
    if (now < T.lockUntil) { const w = $('.dome-wrap', T.app); if (w) { w.classList.remove('shake'); void w.offsetWidth; w.classList.add('shake'); } return; }
    T.slapped = true;
    const rt = Math.round(now - T.armT);
    T.link && T.link.send({ t: 'slap', r: v.seq, rt });
    buzzer(T.sound); haptic('slap'); squish(dome, true);
    const wrap = $('.dome-wrap', T.app); if (wrap) wrap.classList.remove('live');
    if (dome) { dome.classList.remove('live'); dome.classList.add('wait'); $('.dome-label', dome).textContent = '!'; }
    setSub('Slapped! Is it you?');
  }
}
function squish(dome, stay) { if (!dome) return; dome.classList.add('squish'); setTimeout(() => dome.classList.remove('squish'), stay ? 160 : 120); }
function setSub(t) { const s = $('.tsub', T.app); if (s) s.textContent = t; }

function arm() {
  if (T.armed) return;
  clearTimeout(T.armTimer);
  T.armed = true; T.armT = performance.now();
  play('ding'); haptic('armed');
  const dome = $('.dome', T.app), wrap = $('.dome-wrap', T.app);
  if (dome && T.view && (T.view.v === 'get' || T.view.v === 'slap')) {
    dome.classList.remove('wait', 'dim'); dome.classList.add('live'); wrap.classList.add('live');
    $('.dome-label', dome).textContent = 'Slap!';
    setSub('');
  }
}

function hostPill() {
  const el = $('.tconn', T.app); if (!el) return;
  if (!T.hostOn) { el.textContent = 'The big screen is asleep. Waiting for it'; el.classList.add('show'); }
  else if (T.link && T.link.isOpen) el.classList.remove('show');
}

const chip = by => by ? `<span class="chip" style="--c:${colorOf(by.color)};--k:${by.color && ['lemon', 'lime', 'aqua', 'tangerine'].includes(by.color) ? '#062027' : '#fff'}">${esc(by.name)}</span>` : '';
const place = n => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');

function render() {
  const v = T.view, scr = $('.screen.team', T.app);
  if (!v || !scr) return;
  if (v.color && v.color !== T.color) { T.color = v.color; save(); }
  if (v.name && v.name !== T.name) { T.name = v.name; save(); }
  teamStyle(scr, T.color);
  $('.tname span', scr).textContent = T.name;
  $('.tscore', scr).textContent = v.score || 0;
  $('.tround', scr).textContent = v.total ? `${v.round} of ${v.total}` : '';
  const key = v.v + '|' + v.seq + '|' + (v.by ? v.by.name : '') + '|' + (v.answer || '') + '|' + (v.ok ?? '') + '|' + (v.revealing ? 1 : 0);
  const changed = key !== T.lastV;
  const prev = T.prevState;
  T.lastV = key; T.prevState = v.v;
  // arming: a new question resets the buzzer
  if (v.v === 'next' || v.v === 'get') { if (changed && prev !== 'get') { T.armed = false; T.slapped = false; T.judged = false; } }
  if (v.v === 'get') { clearTimeout(T.armTimer); if (!T.armed) T.armTimer = setTimeout(arm, Math.max(0, v.ms || 0)); }
  if (v.v !== 'slap' && v.v !== 'get') clearTimeout(T.armTimer);
  if (v.v === 'slap' && prev === 'paused') { T.armed = false; }
  if (!changed && v.v !== 'slap') return;
  if (!changed && v.v === 'slap') { if (!T.armed) arm(); return; }
  T.enteredAt = performance.now();
  clearInterval(T.countT);
  scr.classList.remove('flood');
  const st = $('.tstage', scr);
  const dome = (label, cls = '') => `<div class="dome-wrap ${cls.includes('live') ? 'live' : ''}"><div class="dome ${cls}"><span class="dome-label">${label}</span></div></div>`;
  let h = '';
  switch (v.v) {
    case 'lobby':
      h = dome('Slap!', 'live') + `<div class="tmsg">You're in!</div><div class="tsub">Slap the button to test it. The show starts soon.</div><button class="btn ghost small" data-act="change">Change team</button>`;
      break;
    case 'intro':
      h = dome('', 'wait') + `<div class="tmsg">Get ready!</div><div class="tsub">The show is starting</div>`;
      break;
    case 'next':
      h = dome('', 'wait') + `<div class="tmsg">${v.bonus ? 'Bonus round!' : 'Next question'}</div><div class="tsub">${v.bonus ? 'Double points for this one' : 'Eyes on the big screen'}</div>`;
      break;
    case 'get':
      h = dome('Wait', 'wait') + `<div class="tsub">Read the question. Slap at the ding!</div>`;
      break;
    case 'slap': {
      h = dome('Slap!', 'live') + `<div class="slapbar"><i></i></div><div class="tsub"></div>`;
      break;
    }
    case 'out': {
      const mine = T.slapped;
      if (changed && prev === 'slap') { play('thunk'); haptic('out'); }
      h = dome('', 'dim') + (v.answer
        ? `<div class="tsub">${chip(v.by)} is checking their answer</div><div class="tsub">The answer is<br><span class="ans">${esc(v.answer)}</span></div>`
        : `<div class="tmsg">${mine ? 'So close!' : 'Beaten!'}</div><div class="tsub">${chip(v.by)} slapped first</div>`);
      break;
    }
    case 'up':
      scr.classList.add('flood');
      if (v.revealing) h = `<div class="tmsg">And the answer is...</div>`;
      else {
        if (changed) haptic('up');
        h = `<div class="tmsg">You're up!</div><div class="tsub">Say your answer out loud</div><div class="bigcount">${Math.ceil((v.ms || 0) / 1000)}</div><button class="btn revealbtn" data-act="reveal">Said it? Tap to show the answer</button>`;
        const end = performance.now() + (v.ms || 0);
        T.countT = setInterval(() => { const c = $('.bigcount', T.app); if (!c) return; const s = Math.max(0, Math.ceil((end - performance.now()) / 1000)); c.textContent = s; }, 200);
      }
      break;
    case 'judge':
      scr.classList.add('flood');
      h = `<div class="tmsg">Did you get it?</div><div class="tsub">The answer is<br><span class="ans">${esc(v.answer)}</span></div>
        <div class="judge"><button class="btn yes" data-act="yes"><span class="mk">✓</span>We got it right</button><button class="btn no" data-act="no"><span class="mk">✗</span>We got it wrong</button></div>`;
      break;
    case 'res':
      if (v.mine) {
        scr.classList.add('flood');
        if (!T.judged) { if (v.ok) { play('correct'); confetti({ y: innerHeight * 0.75 }); } else play('wrong'); }
        h = v.ok ? `<div class="tmsg pop-in">Nailed it!</div><div class="bigcount pop-in">+${v.pts}</div>` : `<div class="tmsg">So close!</div><div class="tsub">The answer was<br><span class="ans">${esc(v.answer)}</span></div><div class="tsub">Get the next one!</div>`;
      } else {
        h = dome('', 'dim') + `<div class="tsub">${chip(v.by)} ${v.ok ? 'got it!' : 'missed that one'}</div><div class="tsub">The answer was<br><span class="ans">${esc(v.answer)}</span></div>`;
      }
      break;
    case 'timeup':
      if (changed) haptic('out');
      h = dome('', 'dim') + `<div class="tmsg">Time's up!</div>` + (v.answer ? `<div class="tsub">The answer was<br><span class="ans">${esc(v.answer)}</span></div>` : '');
      break;
    case 'paused':
      h = dome('', 'dim') + `<div class="tmsg">Paused</div><div class="tsub">Hang tight</div>`;
      break;
    case 'final':
      h = dome('', 'wait') + `<div class="tmsg">And the winner is...</div>`;
      break;
    case 'over': {
      const champ = v.place === 1;
      if (champ) { scr.classList.add('flood'); if (changed) { play('fanfare'); haptic('champ'); rain(160); } }
      else if (changed) play('tada');
      h = champ
        ? `<div class="bigcount pop-in">\u{1F3C6}</div><div class="tmsg pop-in">${v.tie ? 'Tied for the win!' : 'Champions!'}</div><div class="tsub">${v.score} points</div>`
        : `<div class="tmsg">${place(v.place)} place</div><div class="tsub">${v.score} points. Great playing!</div><div class="tsub">${chip(v.winner)} won the show</div>`;
      break;
    }
  }
  st.innerHTML = h;
  if (v.v === 'slap') {
    const bar = $('.slapbar i', st);
    if (bar) { bar.style.transition = 'none'; bar.style.transform = 'scaleX(1)'; void bar.offsetWidth; bar.style.transition = `transform ${Math.max(0, v.ms || 0)}ms linear`; bar.style.transform = 'scaleX(0)'; }
    if (!T.armed) arm();
    if (T.slapped) { const d = $('.dome', st); d.classList.remove('live'); d.classList.add('wait'); $('.dome-label', d).textContent = '!'; $('.dome-wrap', st).classList.remove('live'); setSub('Slapped! Is it you?'); }
  }
}
