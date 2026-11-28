// Slap Happy on a phone: join a show, pick a team name, colour and buzzer
// sound, then the whole phone becomes one big slappable buzzer. The team that
// slaps first picks its answer here.
//
// Phones only make sounds for their own taps (the buzzer, a too-early honk).
// Everything the show itself says comes from the big screen: several phones
// echoing it a split second apart sounded like a dripping tap.

import { $, esc, COLORS, colorOf, teamStyle, randomName, stayAwake, confetti, rain, bindTaps } from './common.js';
import { Link, rid, isCode } from './net.js';
import { BUZZERS, buzzer, play, setSound, prefs } from './sound.js';
import { haptic } from './haptics.js';
import { t, tn, lang, setLang, onLang, langSwitch, langInfo, LANGS, loc, placeText } from './i18n.js';

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
    armed: false, armT: 0, slapped: false, lockUntil: 0, countT: null, enteredAt: 0, lastTest: 0, lastV: null, ak: '', picked: null, pickT: null };
  window.SLAP = window.SLAP || {}; window.SLAP.team = T;
  // a language switch redraws whatever is showing, in the new language
  if (startTeam.off) startTeam.off();
  startTeam.off = onLang(() => { if (T && T.redraw) T.redraw(); });
  if (isCode(code)) connect(code); else letters();
}

// err is [key, vars] so it can be said again in another language
function letters(err = null, code = '') {
  if (T.link) { T.link.close(); T.link = null; }
  T.redraw = () => letters(err, ($('.letters', T.app) || {}).value || code);
  T.app.innerHTML = `
  <div class="screen join scroll">
    <div class="rays"></div>
    ${langSwitch('corner')}
    <div class="inner">
      <h2>${t('join_title')}</h2>
      <p class="hint">${t('type_letters')}</p>
      <input class="letters" maxlength="4" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" enterkeyhint="go" placeholder="ABCD" value="${esc(code)}" aria-label="${t('room_letters')}">
      <p class="err">${err ? esc(t(err[0], err[1])) : ''}</p>
      <button class="btn big pink go" data-act="go">${t('join')}</button>
      <button class="btn ghost small back" data-act="back">${t('back')}</button>
    </div>
  </div>`;
  const inp = $('.letters', T.app);
  inp.addEventListener('input', () => { inp.value = inp.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4); });
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  const go = () => {
    const c = inp.value.toUpperCase();
    if (c.length < 4) { err = ['err_four']; $('.err', T.app).textContent = t('err_four'); return; }
    if (!isCode(c)) { err = ['err_vowels', { code: c }]; $('.err', T.app).textContent = t('err_vowels', { code: c }); return; }
    connect(c);
  };
  bindTaps(T.app.firstElementChild, { go, back: () => { T.redraw = null; T.back(); }, lang: id => { play('pop'); setLang(id); } });
  setTimeout(() => { if (!code) inp.focus(); }, 60);
}

function waiting(key) {
  T.redraw = () => waiting(key);
  T.app.innerHTML = `<div class="screen join"><div class="rays"></div><div class="inner"><h2>${t(key)}</h2><p class="hint">${esc(T.room)}</p></div></div>`;
}

function connect(code) {
  T.room = code;
  const s = savedTeam();
  if (s && s.room === code) { T.id = s.id; T.name = s.name; T.color = s.color; T.sound = s.sound; T.joined = true; }
  else { T.id = rid(12); T.joined = false; }
  waiting('finding');
  T.link = new Link(`/room/${code}?team=${T.id}`, {
    message: onMsg,
    status: st => { const el = $('.tconn', T.app); if (el) { el.textContent = t('reconnecting'); el.classList.toggle('show', st !== 'open'); } },
    fatal: why => {
      T.link = null;
      if (why === 'noroom') letters(['err_noroom', { code }], code);
      else if (why === 'full') letters(['err_seats'], code);
      else if (why === 'kicked') { try { localStorage.removeItem(SAVE); } catch (e) {} letters(['err_kicked'], code); }
      else letters(['err_join'], code);
    },
  });
  // the relay can't be reached at all (no internet, or not on noralindsey.com)
  T.failT = setTimeout(() => { if (T.link && !T.link.isOpen && !T.view) letters(['err_offline'], code); }, 12000);
}

function onMsg(m) {
  if (m.t === 'ping') { T.link && T.link.send({ t: 'pong', s: m.s }); return; } // lets the big screen measure the trip
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
    const wrap = () => {
      T.redraw = wrap;
      T.app.innerHTML = `<div class="screen join"><div class="rays"></div>${langSwitch('corner')}<div class="inner"><h2>${t('wrap')}</h2><p class="hint">${t('thanks')}</p><button class="btn big pink go" data-act="again">${t('join_another')}</button></div></div>`;
      bindTaps(T.app.firstElementChild, { again: () => letters(), lang: id => setLang(id) });
    };
    wrap();
  } else if (m.t === 'full') {
    T.link.close(); T.link = null; letters(['err_eight'], T.room);
  } else if (m.t === 'view') {
    T.view = m; T.viewAt = performance.now();
    if (T.joined) { if (!$('.screen.team', T.app)) playScreen(); render(); }
  }
}

function sendJoin() { T.link && T.link.send({ t: 'join', name: T.name, color: T.color, sound: T.sound }); }
function save() { try { localStorage.setItem(SAVE, JSON.stringify({ t: Date.now(), room: T.room, id: T.id, name: T.name, color: T.color, sound: T.sound })); } catch (e) {} }

// ---------- pick a name, colour and buzzer ----------
export function setupForm({ title = t('your_team'), name, color, sound, takenColors = [], takenNames = [], takenSounds = [], button = t('ready'), langs = false }) {
  name = name || randomName(takenNames);
  color = color && !takenColors.includes(color) ? color : (COLORS.find(c => !takenColors.includes(c.id)) || COLORS[0]).id;
  sound = sound || (BUZZERS.find(b => !takenSounds.includes(b.id)) || BUZZERS[0]).id;
  return `
    ${langs ? langSwitch('corner') : ''}
    <div class="inner">
      <h2>${esc(title)}</h2>
      <div><div class="field-label">${t('team_name')}</div>
        <div class="namebox"><input class="tn" maxlength="22" value="${esc(name)}" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="done" aria-label="${t('team_name')}"><button class="dice" data-act="dice" aria-label="${t('silly_name')}">\u{1F3B2}</button></div></div>
      <div><div class="field-label">${t('team_color')}</div>
        <div class="swatches">${COLORS.map(c => `<button class="swatch${c.id === color ? ' on' : ''}${takenColors.includes(c.id) ? ' taken' : ''}" data-act="color" data-arg="${c.id}" style="--c:${c.c}" aria-label="${t('c_' + c.id)}"></button>`).join('')}</div></div>
      <div><div class="field-label">${t('buzzer_sound')}</div>
        <div class="sounds">${BUZZERS.map(b => `<button class="snd${b.id === sound ? ' on' : ''}" data-act="sound" data-arg="${b.id}"><span class="e">${b.e}</span>${esc(t('bz_' + b.id))}</button>`).join('')}</div></div>
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
      if (!name) { $('.err', root).textContent = t('name_needed'); return; }
      const color = (root.querySelector('.swatch.on:not(.taken)') || root.querySelector('.swatch:not(.taken)'))?.dataset.arg || 'cherry';
      const sound = root.querySelector('.snd.on')?.dataset.arg || 'boing';
      onReady({ name, color, sound });
    },
  });
}

function setup(draft) {
  const i = T.info || {};
  const d = draft || { name: T.name, color: T.color, sound: T.sound };
  // switching language keeps whatever the team had already typed and picked
  T.redraw = () => {
    const root = T.app.firstElementChild;
    setup({ name: ($('.tn', root) || {}).value, color: (root.querySelector('.swatch.on') || {}).dataset?.arg, sound: (root.querySelector('.snd.on') || {}).dataset?.arg });
  };
  T.app.innerHTML = `<div class="screen join scroll"><div class="rays"></div>${setupForm({ name: d.name, color: d.color, sound: d.sound, takenColors: i.taken || [], takenNames: i.names || [], takenSounds: i.sounds || [], langs: true })}</div>`;
  bindTaps(T.app.firstElementChild, { lang: id => { play('pop'); setLang(id); } });
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
  T.redraw = () => { T.quiet = true; playScreen(); render(); T.quiet = false; };
  T.app.innerHTML = `
  <div class="screen team">
    <div class="tbar">
      <div class="tname"><i></i><span></span></div>
      <div class="tround"></div>
      <div class="tscore">0</div>
      <button class="iconbtn langbtn" data-act="lang" aria-label="${t('language')}: ${langInfo().name}" lang="${lang()}">${langInfo().short}</button>
      <button class="iconbtn snd-toggle${prefs.sound ? '' : ' off'}" data-act="mute" aria-label="${t('sound_onoff')}">${soundIcon(prefs.sound)}</button>
    </div>
    <div class="tstage"></div>
    <div class="tconn">${t('reconnecting')}</div>
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
    pick: arg => pick(+arg),
    change: () => { T.joined = false; setup(); },
    // the phone's language button flips to the next language
    lang: () => { const k = LANGS.findIndex(l => l.id === lang()); setLang(LANGS[(k + 1) % LANGS.length].id); haptic('tap'); },
  });
  hostPill();
}

// The team picks A, B, C or D. The big screen decides if it's right.
function pick(i) {
  const v = T.view;
  if (!v || v.v !== 'pick' || v.locked !== undefined || T.picked !== null) return;
  if (performance.now() - T.enteredAt < 350) return; // a slap finger still coming down
  if (!v.choices || !(i in v.choices) || (v.gone || []).includes(i)) return;
  T.picked = i;
  sendPick();
  haptic('tap'); play('pop');
  T.app.querySelectorAll('.pk').forEach((b, k) => { b.disabled = true; b.classList.toggle('chosen', k === i); b.classList.toggle('faded', k !== i); });
  const m = $('.pickmsg', T.app); if (m) m.textContent = t('locked_in');
}
// say it again if the big screen hasn't heard (a blip in the Wi-Fi)
function sendPick() {
  clearTimeout(T.pickT);
  const v = T.view;
  if (!v || v.v !== 'pick' || v.locked !== undefined || T.picked === null) return;
  T.link && T.link.send({ t: 'pick', r: v.seq, a: v.att, i: T.picked });
  T.pickT = setTimeout(sendPick, 1500);
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
    setSub(t('too_early'));
    return;
  }
  if (T.armed && !T.slapped && v.v === 'slap') {
    if (now < T.lockUntil) { const w = $('.dome-wrap', T.app); if (w) { w.classList.remove('shake'); void w.offsetWidth; w.classList.add('shake'); } return; }
    T.slapped = true;
    const rt = Math.round(now - T.armT);
    T.link && T.link.send({ t: 'slap', r: v.seq, a: v.att, rt });
    buzzer(T.sound); haptic('slap'); squish(dome, true);
    const wrap = $('.dome-wrap', T.app); if (wrap) wrap.classList.remove('live');
    if (dome) { dome.classList.remove('live'); dome.classList.add('wait'); $('.dome-label', dome).textContent = '!'; }
    setSub(t('slapped_q'));
  }
}
function squish(dome, stay) { if (!dome) return; dome.classList.add('squish'); setTimeout(() => dome.classList.remove('squish'), stay ? 160 : 120); }
function setSub(t) { const s = $('.tsub', T.app); if (s) s.textContent = t; }

function arm() {
  if (T.armed) return;
  T.armed = true; T.armT = performance.now();
  haptic('armed');
  const scr = $('.screen.team', T.app);
  if (scr) { scr.classList.remove('goflash'); void scr.offsetWidth; scr.classList.add('goflash'); setTimeout(() => scr.classList.remove('goflash'), 700); }
  const dome = $('.dome', T.app), wrap = $('.dome-wrap', T.app);
  if (dome && T.view && T.view.v === 'slap') {
    dome.classList.remove('wait', 'dim', 'locked'); dome.classList.add('live'); wrap.classList.add('live');
    $('.dome-label', dome).textContent = t('slap');
    setSub('');
  }
}

function hostPill() {
  const el = $('.tconn', T.app); if (!el) return;
  if (!T.hostOn) { el.textContent = t('host_asleep'); el.classList.add('show'); }
  else if (T.link && T.link.isOpen) el.classList.remove('show');
}

const LOCK = '<svg class="lock" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const chip = by => by ? `<span class="chip" style="--c:${colorOf(by.color)};--k:${by.color && ['lemon', 'lime', 'aqua', 'tangerine'].includes(by.color) ? '#062027' : '#fff'}">${esc(by.name)}</span>` : '';

function render() {
  const v = T.view, scr = $('.screen.team', T.app);
  if (!v || !scr) return;
  if (v.color && v.color !== T.color) { T.color = v.color; save(); }
  if (v.name && v.name !== T.name) { T.name = v.name; save(); }
  teamStyle(scr, T.color);
  $('.tname span', scr).textContent = T.name;
  $('.tscore', scr).textContent = v.score || 0;
  $('.tround', scr).textContent = v.total ? `${v.round}/${v.total}` : '';
  // each new question, and each steal, resets the buzzer
  const ak = v.seq + ':' + (v.att || 1);
  if (ak !== T.ak && v.v !== 'lobby') { T.ak = ak; T.armed = false; T.slapped = false; T.picked = null; clearTimeout(T.pickT); }
  if (v.v === 'slap' && T.prevState === 'paused') T.armed = false;
  const { ms, score, rank, ...rest } = v;
  const key = JSON.stringify(rest);
  const changed = key !== T.lastV;
  const prev = T.prevState;
  T.lastV = key; T.prevState = v.v;
  if (!changed) { if (v.v === 'slap' && !T.armed) arm(); return; }
  const fx = !T.quiet;                 // buzzes and confetti only when something really happened (not a language switch)
  const left = Math.max(0, (v.ms || 0) - (performance.now() - (T.viewAt || performance.now())));
  if (fx) T.enteredAt = performance.now();   // a language switch isn't a new screen
  clearInterval(T.countT);
  scr.classList.remove('flood');
  const st = $('.tstage', scr);
  const dome = (label, cls = '') => `<div class="dome-wrap ${cls.includes('live') ? 'live' : ''}"><div class="dome ${cls}"><span class="dome-label">${label}</span></div></div>`;
  const ans = a => `<span class="ans">${esc(loc(a))}</span>`;
  const team = chip(v.by);
  let h = '';
  switch (v.v) {
    case 'lobby':
      h = dome(t('slap'), 'live') + `<div class="tmsg">${t('you_in')}</div><div class="tsub">${t('test_it')}</div><button class="btn ghost small" data-act="change">${t('change_team')}</button>`;
      break;
    case 'intro':
      h = dome('', 'wait') + `<div class="tmsg">${t('get_ready')}</div><div class="tsub">${t('starting')}</div>`;
      break;
    case 'next':
      h = dome(LOCK, 'locked') + `<div class="tmsg">${v.bonus ? t('bonus') : t('next_q')}</div><div class="tsub">${v.bonus ? t('double_this') : t('eyes')}</div>`;
      break;
    case 'get':
      h = v.steal
        ? dome(LOCK + `<span>${t('wait')}</span>`, 'locked') + `<div class="tmsg">${t('steal_it')}</div><div class="tsub">${t('slap_when')}</div>`
        : dome(LOCK + `<span>${t('wait')}</span>`, 'locked') + `<div class="tsub">${v.voice ? t('listen_q') : t('read_q')}<br>${t('slap_when_x')}</div>`;
      break;
    case 'slap':
      h = dome(t('slap'), 'live') + `<div class="slapbar"><i></i></div><div class="tsub">${v.steal ? t('slap_steal') : ''}</div>`;
      break;
    case 'sit':
      h = dome('', 'dim') + `<div class="tmsg">${t('sitting_out')}</div><div class="tsub">${t('others_steal')}</div>`;
      break;
    case 'out': {
      if (fx && prev === 'slap') haptic('out');
      const L = loc(v.said).slice(0, 1);
      if (v.choosing) h = dome('', 'dim') + `<div class="tmsg">${T.slapped ? t('so_close') : t('beaten')}</div><div class="tsub">${t('first_picking', { team })}</div>`;
      else if (v.missed) h = dome('', 'dim') + `<div class="tsub">${L ? t('picked_wrong', { team, L }) : t('ran_out', { team })}</div>` + (v.next ? `<div class="tmsg">${t('get_ready_steal')}</div>` : '');
      else h = dome('', 'dim') + `<div class="tsub">${t('team_picked', { team })}</div><div class="tsub">${ans(v.said)}</div>`;
      break;
    }
    case 'pick': {
      scr.classList.add('flood');
      const locked = v.locked !== undefined;
      if (fx && prev !== 'pick') haptic('up');
      const mine = locked ? v.locked : T.picked;
      const Q = (v.tr && v.tr[lang()]) || v;   // the question in this phone's language
      const choices = Q.choices || v.choices || [];
      h = `<div class="pickhead"><div class="tmsg">${locked ? t('checking') : t('you_up')}</div>${locked ? '' : `<div class="pickcount">${Math.ceil(left / 1000)}</div>`}</div>
        <div class="pq" lang="${Q === v ? 'en' : lang()}">${esc(Q.q || '')}</div>
        <div class="picks n${choices.length}">${choices.map((c, i) => {
          const gone = (v.gone || []).includes(i);
          const cls = gone ? ' gone' : mine === i ? ' chosen' : mine !== null && mine !== undefined ? ' faded' : '';
          return `<button class="pk${cls}" data-act="pick" data-arg="${i}"${gone || locked || T.picked !== null ? ' disabled' : ''}><span class="ltr">${'ABCD'[i]}</span><span class="ctext">${esc(c)}</span></button>`;
        }).join('')}</div>
        <div class="pickmsg">${locked || T.picked !== null ? t('locked_in') : t('tap_answer')}</div>`;
      if (!locked) {
        const end = performance.now() + left;
        T.countT = setInterval(() => { const c = $('.pickcount', T.app); if (!c) return; c.textContent = Math.max(0, Math.ceil((end - performance.now()) / 1000)); }, 200);
      }
      break;
    }
    case 'miss':
      scr.classList.add('flood');
      if (fx) haptic('lose');
      clearTimeout(T.pickT);
      h = `<div class="bigcount">✗</div><div class="tmsg">${v.late ? t('out_of_time') : t('not_that')}</div><div class="tsub">${v.more ? t('chance_steal') : t('better_luck')}</div>`;
      break;
    case 'res':
      clearTimeout(T.pickT);
      if (v.mine) {
        scr.classList.add('flood');
        if (fx) { haptic('win'); confetti({ y: innerHeight * 0.75, n: 140 }); }
        h = `<div class="tmsg pop-in">${v.stolen ? t('stolen') : t('nailed')}</div><div class="bigcount pop-in">+${v.pts}</div><div class="tsub">${ans(v.answer)}</div>`;
      } else {
        h = dome('', 'dim') + `<div class="tsub">${v.stolen ? t('team_stole', { team }) : t('team_got', { team })}</div><div class="tsub">${t('answer_was')}<br>${ans(v.answer)}</div>`;
      }
      break;
    case 'timeup':
      if (fx && prev !== 'timeup') haptic('out');
      h = dome('', 'dim') + `<div class="tmsg">${v.answer ? (v.tried ? t('nobody_got') : t('nobody_slapped')) : t('times_up')}</div>` + (v.answer ? `<div class="tsub">${t('answer_was')}<br>${ans(v.answer)}</div>` : '');
      break;
    case 'paused':
      h = dome('', 'dim') + `<div class="tmsg">${t('paused')}</div><div class="tsub">${t('hang_tight')}</div>`;
      break;
    case 'final':
      h = dome('', 'wait') + `<div class="tmsg">${t('winner_is')}</div>`;
      break;
    case 'over': {
      const champ = v.place === 1;
      if (champ) { scr.classList.add('flood'); if (fx) { haptic('champ'); rain(160); } }
      h = champ
        ? `<div class="bigcount pop-in">\u{1F3C6}</div><div class="tmsg pop-in">${v.tie ? t('tied_win') : t('champions')}</div><div class="tsub">${tn('pts', v.score)}</div>`
        : `<div class="tmsg">${placeText(v.place)}</div><div class="tsub">${tn('pts', v.score)}. ${t('great_playing')}</div><div class="tsub">${t('won_show', { team: chip(v.winner) })}</div>`;
      break;
    }
  }
  st.innerHTML = h;
  st.classList.toggle('picking', v.v === 'pick');
  if (v.v === 'slap') {
    const bar = $('.slapbar i', st);
    const full = Math.max(1, v.ms || 1);
    if (bar) { bar.style.transition = 'none'; bar.style.transform = `scaleX(${left / full})`; void bar.offsetWidth; bar.style.transition = `transform ${left}ms linear`; bar.style.transform = 'scaleX(0)'; }
    if (!T.armed) arm();
    if (T.slapped) { const d = $('.dome', st); d.classList.remove('live'); d.classList.add('wait'); $('.dome-label', d).textContent = '!'; $('.dome-wrap', st).classList.remove('live'); setSub(t('slapped_q')); }
  }
}
