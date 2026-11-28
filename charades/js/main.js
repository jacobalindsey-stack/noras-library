// Charades (working title): hold the phone on your forehead, everyone else
// acts out the word, nod down for "got it", tip up to pass.
//
// The game's moves and scores follow rules.js. On one phone the moves are
// applied here; in an online room they go to the room server, which applies
// the same rules and sends the new state back to every device.

import { freshState, reduce, currentPlayer, playerById, standings, usedWords, roundPoints, TIMES, TURNS, cleanName, LIMITS } from './rules.js';
import { loadDecks, decks, deckById, draw, MIX } from './decks.js';
import { load as loadStore, save, addScorecard } from './store.js';
import { sfx, unlockAudio, startUnlocking, buzz, setSound, setBuzz, stayAwake, audioState, testStickAudio } from './sfx.js';
import { askMotion, hasTilt, reading, screenUpright, contentTurn, NodReader, NEEDS_ASK } from './tilt.js';
import { Room, newCode, validCode, WHY } from './net.js';

const TITLE = 'Charades'; // working title: the game isn't named yet
const AVA = ['#ffc83d', '#12c98a', '#ff4f9a', '#4f86ff', '#ff8a1f', '#14a3a0', '#e05ae8', '#f0473c', '#a78bfa', '#38bdf8', '#a3e635', '#fb7185'];
// degrees from level that count: tipping the head back is harder than
// nodding forward, so a pass needs a bit over half the movement of a got it
const NOD = { small: { ok: 26, pass: 14 }, normal: { ok: 36, pass: 20 }, big: { ok: 48, pass: 28 } };
const TOUCH = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
const UPRIGHT_MS = 700;   // phone held upright this long starts the countdown
const COUNT_MS = 800;     // each beat of 3-2-1
const NO_SENSOR_MS = 1600;

const $app = document.getElementById('app');
const $stage = document.getElementById('stage');
const $conf = document.getElementById('confetti');

const app = {
  st: null,            // what this device remembers (store.js)
  screen: 'title',     // title | players | online | history | scorecard | game
  mode: 'local',       // local | online
  S: null,             // the game (rules.js)
  room: null,          // the online room link
  joinCode: '', err: '', busy: false, sheet: null, histOpen: null, toast: '',
  prevPhase: null, leaveArm: 0,
  motion: 'unknown',   // motion sensor permission this visit: unknown | granted | denied | none
};
let R = null; // this device's own turn while it is being played (see "the turn" below)

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const meDev = () => app.mode === 'local' ? 'local' : app.st.dev;
const now = () => app.mode === 'online' && app.room ? app.room.now() : Date.now();
const amHost = () => app.mode === 'local' || (app.S && app.S.host === app.st.dev);
const mine = p => !!p && (app.mode === 'local' || p.dev === app.st.dev);
const avaOf = (S, pid) => { const i = S.players.findIndex(p => p.id === pid); return AVA[(i < 0 ? 0 : i) % AVA.length]; };
const initial = n => esc((n || '?').trim().charAt(0).toUpperCase() || '?');
const ava = (name, color, cls = '') => `<span class="ava ${cls}" style="--c:${color}">${initial(name)}</span>`;
const nameOf = (S, pid) => (playerById(S, pid) || { name: '?' }).name;

const ICON = {
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.6M12 18.6v2.6M21.2 12h-2.6M5.4 12H2.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8M18.5 18.5l-1.8-1.8M7.3 7.3L5.5 5.5"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="5" height="16" rx="1.5"/><rect x="14" y="4" width="5" height="16" rx="1.5"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6"/></svg>',
};

// A head in profile with the phone on its forehead, nodding: the one picture
// that explains the game.
const HEAD_SVG = `<svg class="head" viewBox="0 0 300 220" fill="none" aria-hidden="true">
  <path d="M120 200c0-22 6-34 6-48-18-8-30-30-30-58 0-40 30-70 70-70 34 0 62 24 66 58l14 26c3 5-1 10-6 10h-10v18c0 10-8 18-18 18h-16v46" stroke="#fff8ec" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="214" y="24" width="30" height="74" rx="8" transform="rotate(14 229 61)" fill="#ffc83d" stroke="#1a0f45" stroke-width="5"/>
  <path d="M262 112c14 14 18 32 12 50" stroke="#12c98a" stroke-width="8" stroke-linecap="round"/><path d="M262 158l12 6 6-14" stroke="#12c98a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M248 18c14-10 30-12 44-4" stroke="#ff8a1f" stroke-width="8" stroke-linecap="round"/><path d="M280 4l12 10-12 8" stroke="#ff8a1f" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// ================================================================ actions
// Every move goes through act(): applied here on one phone, sent to the
// room online (the room sends back the new state, which lands in setState).
function act(op) {
  if (app.mode === 'local') {
    const r = reduce(app.S, op, 'local', Date.now());
    if (r.err) { console.warn('move refused:', op.t, r.err); return false; }
    setState(r.S);
    return true;
  }
  return app.room ? app.room.send(op) : false;
}

function setState(S) {
  const prev = app.S;
  app.S = S;
  const was = app.prevPhase;
  app.prevPhase = S.phase;
  if (app.mode === 'local') { app.st.game = S.phase === 'lobby' || S.phase === 'final' ? null : S; save(true); }
  if (app.mode === 'online' && app.screen !== 'game') app.screen = 'game';

  syncTurn();
  // a turn just finished: everyone sees "Time's up!" for a moment
  if (was === 'play' && S.phase === 'results') {
    const last = S.rounds[S.rounds.length - 1];
    if (!last || !last.skip) timesUp();
  }
  if (S.phase === 'final' && was !== 'final') finished(S);
  if (S.phase === 'final' || S.phase === 'lobby') { closeSheet('pause'); }
  // pause sheet follows the shared state
  if (S.phase === 'play' && S.cur && S.cur.left && (amHost() || (R && R.state !== 'done'))) { if (app.sheet !== 'pause') openSheet('pause'); }
  else if (app.sheet === 'pause') closeSheet('pause');
  syncStage();
  render();
  if (prev && prev.phase !== S.phase) $app.scrollTop = 0;
}

function finished(S) {
  const id = (app.mode === 'online' ? app.room.code : 'L') + '-' + (S.startedAt || S.game) + '-' + S.game;
  const rows = standings(S);
  if (!S.rounds.length) return;
  addScorecard({
    id, at: Date.now(), online: app.mode === 'online', secs: S.set.secs, turns: S.set.turns,
    players: rows.map(r => ({ name: r.name, pts: r.pts, rank: r.rank })),
    rounds: S.rounds.map(r => ({ name: nameOf(S, r.pid), deck: r.deck, title: r.title, pts: r.pts, skip: r.skip ? 1 : 0, words: r.cards.map(c => [c.w, c.ok ? 1 : 0, c.x ? 1 : 0]) })),
  });
  setTimeout(() => { sfx.fanfare(); confetti(); }, app.screen === 'game' ? 250 : 0);
}

// iPhone only turns motion on from a tap. Ask at the very start of a tap
// (see the listeners near the bottom), and never switch a player to tap mode
// without saying so: the forehead screen offers "Turn on tilt" instead.
function wakeTilt() {
  if (app.st.prefs.controls !== 'tilt' || !TOUCH || app.motion === 'granted' && hasTilt()) return;
  askMotion().then(r => {
    app.motion = r;
    if (R && R.state === 'wait' && R.mode === 'tilt') { R.since = performance.now(); if (r === 'granted') R.needAsk = false; render(); }
  });
}

// ================================================================ the turn
// R is this device's own turn: waiting for the phone to go up on the
// forehead, the 3-2-1, then the cards.
function syncTurn() {
  const S = app.S;
  const p = currentPlayer(S);
  const myTurn = p && mine(p) && (S.phase === 'ready' || S.phase === 'play') && S.cur && S.cur.pid === p.id;
  if (!myTurn) {
    if (R) { R = null; stayAwake(false); }
    return;
  }
  const key = S.game + ':' + S.turn;
  if (R && R.key === key) return;
  R = {
    key, pid: p.id, deck: S.cur.deck, state: 'wait', mode: 'tilt', noSensor: false,
    reader: new NodReader(NOD[app.st.prefs.nod] || NOD.normal),
    card: null, marks: [], local: new Set(), upT: 0, since: performance.now(), countT: 0, lastBeat: 0, localEnds: 0, flashT: 0,
  };
  const wantTilt = TOUCH && app.st.prefs.controls === 'tilt' && app.motion !== 'none';
  R.mode = wantTilt ? 'tilt' : 'tap';
  if (S.phase === 'play') {
    // back after a reload in the middle of a turn: carry on
    R.mode = S.cur.mode || R.mode; R.state = 'live'; R.card = S.cur.card;
    R.marks = S.cur.cards.slice(); R.reader.begin(); R.reader.wait();
  }
  stayAwake(true);
  if (R.state === 'wait') waitLoop();
}

function waitLoop() {
  if (!R || R.state !== 'wait') return;
  requestAnimationFrame(waitLoop);
  if (app.sheet) return;
  if (R.mode === 'tilt') {
    const t = performance.now();
    if (!hasTilt()) {
      if (NEEDS_ASK) { if (!R.needAsk && t - R.since > 900) { R.needAsk = true; render(); } }
      else if (t - R.since > NO_SENSOR_MS) { R.mode = 'tap'; R.noSensor = true; render(); }
      return;
    }
    if (R.needAsk) { R.needAsk = false; render(); }
    if (screenUpright()) { if (!R.upT) R.upT = t; } else R.upT = 0;
    const f = R.upT ? Math.min(1, (t - R.upT) / UPRIGHT_MS) : 0;
    const bar = document.getElementById('upbar');
    if (bar) bar.style.width = (f * 100).toFixed(0) + '%';
    if (f >= 1) startCount();
  }
}

function startCount() {
  if (!R || R.state !== 'wait') return;
  R.state = 'count'; R.countT = performance.now(); R.lastBeat = 0;
  stayAwake(true);
  syncStage();
}

function go() {
  const S = app.S;
  if (!R || !S.cur) return;
  const used = new Set([...usedWords(S), ...R.local]);
  R.card = draw(S.cur.deck, used);
  if (!R.card) return;
  R.local.add(R.card.w);
  R.localEnds = Date.now() + S.set.secs * 1000;
  R.state = 'live';
  R.reader.begin();
  ST.flash = null; setFx('');
  act({ t: 'go', mode: R.mode, card: R.card });
  sfx.go(); buzz('go');
  if (R.card.x) setTimeout(() => sfx.goldAppears(), 250);
  showCard(true);
}

// "Got it" (ok) or pass, from a nod or a tap on this device
function markMine(ok) {
  const S = app.S;
  if (!S.cur || S.phase !== 'play' && !(app.mode === 'online' && R && R.state === 'live')) return;
  if (S.cur && S.cur.left) return;
  if (R && (R.state === 'live')) {
    const cur = R.card; if (!cur) return;
    const used = new Set([...usedWords(S), ...R.local, cur.w]);
    const next = draw(S.cur.deck, used);
    R.local.add(cur.w); if (next) R.local.add(next.w);
    R.marks.push({ w: cur.w, ok, x: cur.x });
    ST.mine.add(cur.w);
    act({ t: 'mark', ok, w: cur.w, next });
    R.card = next;
    R.state = 'flash'; R.flashT = performance.now();
    flashMark(ok, cur.x, true, R.marks);
    return;
  }
  // an actor tapping on their own device (online, tap mode)
  if (app.mode === 'online' && S.cur.mode === 'tap' && S.cur.card && S.cur.dev !== app.st.dev) {
    if (ST.flash && performance.now() < ST.flash.until) return;
    const cur = S.cur.card;
    if (ST.mine.has(cur.w)) return;
    const next = draw(S.cur.deck, new Set([...usedWords(S), cur.w]));
    ST.mine.add(cur.w);
    act({ t: 'mark', ok, w: cur.w, next });
    flashMark(ok, cur.x, true, [...S.cur.cards, { w: cur.w, ok, x: cur.x }]);
  }
}

function remainingMs() {
  const S = app.S;
  if (S.phase === 'play' && S.cur) return S.cur.left ? S.cur.left : S.cur.ends - now();
  if (R && R.localEnds) return R.localEnds - Date.now();
  return S.set.secs * 1000;
}
const paused = () => !!(app.S && app.S.phase === 'play' && app.S.cur && app.S.cur.left);

// ================================================================ the stage
// The full-screen card view, in one of four ways:
//   forehead  this phone is on the guesser's head (tilt)
//   judge     the word with Got it / Pass buttons (someone else holds it)
//   blind     online: the guesser's own screen when others are tapping
//   watch     online: the word for the actors while the guesser tilts
const ST = { role: null, flash: null, splash: null, mine: new Set(), seen: 0, lastWord: undefined, lastSec: null, raf: 0, w: 0, h: 0, turn: 0, endAsked: false, streakEl: null };

function stageRole() {
  const S = app.S;
  if (!S) return null;
  if (R && R.state !== 'wait') return R.mode === 'tilt' ? 'forehead' : (app.mode === 'local' ? 'judge' : 'blind');
  if (S.phase === 'play' && S.cur && app.mode === 'online') return S.cur.mode === 'tap' ? 'judge' : 'watch';
  return null;
}

function syncStage() {
  const role = ST.splash ? ST.role : stageRole();
  if (role) stageOpen(role); else stageClose();
}

function stageOpen(role) {
  if (ST.role === role && !$stage.hidden) return;
  const S = app.S;
  const deck = deckById(S.cur ? S.cur.deck : '') || MIX;
  ST.role = role; ST.flash = null; ST.lastWord = undefined; ST.lastSec = null; ST.endAsked = false; ST.pauseShown = false;
  ST.mine.clear();
  ST.seen = S.cur ? S.cur.cards.length : 0;
  $stage.style.setProperty('--dc', deck.color);
  const canPause = app.mode === 'local' || role === 'forehead' || role === 'blind' || amHost();
  const key = t => TOUCH ? '' : `<span class="key">${t}</span>`;
  const judge = role === 'judge';
  $stage.innerHTML = `<div class="rot">
    <div class="sbar">
      <div class="clock" id="clock"></div>
      ${canPause ? `<button class="pausebtn" data-a="pause" aria-label="Pause">${ICON.pause}</button>` : '<span></span>'}
      <div class="tally" aria-label="Got"><i>✓</i><span id="tally">0</span></div>
    </div>
    ${judge ? `<div class="jl"><button class="btn tang" data-down="pass"><span class="big-ico">↑</span>Pass${key('←')}</button></div>` : ''}
    <div class="wordcard" id="wcard"><div class="word" id="word"></div></div>
    ${judge ? `<div class="jr"><button class="btn mint" data-down="ok"><span class="big-ico">✓</span>Got it${key('→')}</button></div>` : ''}
    <div class="foot">${judge
      ? `<div class="judge"><button class="btn tang" data-down="pass">Pass${key('←')}</button><button class="btn mint" data-down="ok">Got it${key('→')}</button></div>`
      : `<span class="decktag">${esc(deck.icon)} ${esc(deck.title)}</span><span class="grow"></span><span class="who-tag">${esc(S.cur ? nameOf(S, S.cur.pid) : '')}</span>`}</div>
  </div><div id="fx"></div>${role === 'forehead' ? '<button class="btn tiltfix" id="tiltfix" data-a="tiltfix" hidden>Tap to turn tilt back on</button>' : ''}`;
  $stage.hidden = false;
  ST.w = 0; // force a layout
  if (!ST.raf) ST.raf = requestAnimationFrame(stageLoop);
}

function stageClose() {
  if ($stage.hidden && !ST.role) return;
  $stage.hidden = true; $stage.innerHTML = ''; ST.role = null; ST.splash = null; ST.flash = null;
  if (ST.raf) { cancelAnimationFrame(ST.raf); ST.raf = 0; }
}

function layoutStage() {
  const rot = $stage.querySelector('.rot'); if (!rot) return;
  const turn = ST.role === 'forehead' ? contentTurn() : 0;
  let W = window.innerWidth, H = window.innerHeight;
  if (turn) [W, H] = [H, W];
  if (W === ST.w && H === ST.h && turn === ST.turn) return;
  ST.w = W; ST.h = H; ST.turn = turn;
  rot.style.width = W + 'px'; rot.style.height = H + 'px';
  rot.style.transform = `translate(-50%, -50%) rotate(${turn}deg)`;
  const fx = document.getElementById('fx');
  if (fx) { fx.style.cssText = `position:absolute;left:50%;top:50%;width:${W}px;height:${H}px;transform:translate(-50%,-50%) rotate(${turn}deg);pointer-events:none`; }
  $stage.classList.toggle('turned', !!turn);
  $stage.classList.toggle('side', ST.role === 'judge' && W > H * 1.15);
  ST.lastWord = undefined; // refit
}

function fitWord(el, box) {
  const cs = getComputedStyle(box);
  const bw = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const bh = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  if (bw <= 0 || bh <= 0) return;
  let lo = 12, hi = Math.max(14, Math.min(bh * 0.92, bw * 0.6));
  for (let i = 0; i < 9; i++) {
    const mid = (lo + hi) / 2;
    el.style.fontSize = mid + 'px';
    if (el.scrollWidth <= bw + 1 && el.scrollHeight <= bh + 1) lo = mid; else hi = mid;
  }
  el.style.fontSize = Math.floor(lo) + 'px';
}

// what the card shows right now
function cardNow() {
  const S = app.S;
  if (ST.role === 'blind') return { blind: true };
  if (R && (ST.role === 'forehead' || (ST.role === 'judge' && app.mode === 'local'))) {
    if (R.state === 'count' || !R.card) return { w: '' };
    return R.card;
  }
  return S.cur && S.cur.card ? S.cur.card : { w: '' };
}

function showCard(force) {
  const box = document.getElementById('wcard'), el = document.getElementById('word');
  if (!box || !el) return;
  const c = cardNow();
  const sig = c.blind ? '#blind' : (c.w + (c.x ? '*' : ''));
  if (!force && sig === ST.lastWord) return;
  const wasWord = ST.lastWord;
  ST.lastWord = sig;
  if (c.blind) {
    box.classList.remove('gold');
    el.innerHTML = `<div class="blind">Guess!</div><div class="sub">The others can see your word</div>`;
    el.style.fontSize = '';
    return;
  }
  box.classList.toggle('gold', !!c.x);
  el.textContent = c.w;
  const old = box.querySelector('.x2'); if (old) old.remove();
  if (c.x) { const b = document.createElement('div'); b.className = 'x2'; b.textContent = '×2'; box.appendChild(b); }
  fitWord(el, box);
  // others hear the gold card arrive (the guesser's own phone already chimed)
  if (c.x && wasWord !== undefined && ST.role !== 'forehead' && !(R && ST.role === 'judge')) sfx.goldAppears();
}

function setFx(html, cls) {
  const fx = document.getElementById('fx'); if (!fx) return;
  fx.innerHTML = html ? `<div class="flash ${cls}">${html}</div>` : '';
}

function flashMark(ok, gold, mineFlag, list) {
  const t = performance.now();
  ST.flash = { kind: ok ? 'ok' : 'pass', until: t + (ok ? 560 : 480) };
  setFx(ok ? `<div class="big">Got it!</div>${gold ? '<div class="small">+2 gold card</div>' : ''}` : `<div class="big">Pass</div>`, (ok ? 'ok' : 'pass') + ' pop');
  if (ok) (gold ? sfx.bonus : sfx.correct)(); else sfx.pass();
  if (mineFlag || app.mode === 'local') buzz(ok ? 'ok' : 'pass');
  // streaks
  if (ok && list) {
    let n = 0; for (let i = list.length - 1; i >= 0 && list[i].ok; i--) n++;
    if ([3, 5, 8, 12, 16].includes(n)) setTimeout(() => showStreak(n), 160);
  }
}

function showStreak(n) {
  const fx = document.getElementById('fx'); if (!fx) return;
  const s = document.createElement('div'); s.className = 'streak';
  s.textContent = n >= 8 ? `${n} in a row! Unstoppable!` : `${n} in a row!`;
  fx.appendChild(s); sfx.streak();
  setTimeout(() => s.remove(), 1150);
}

function timesUp() {
  const S = app.S;
  const key = S.game + ':' + S.turn;
  if (ST.splash || ST.splashKey === key) return;
  ST.splashKey = key;
  if (!ST.role) stageOpen(app.mode === 'local' ? 'judge' : 'watch');
  ST.splash = { until: performance.now() + 1700 };
  setFx('<div class="big">Time’s up!</div>', 'time pop');
  sfx.buzzer(); buzz('end');
  if (!ST.raf) ST.raf = requestAnimationFrame(stageLoop);
}

function stageLoop() {
  ST.raf = 0;
  if ($stage.hidden) return;
  ST.raf = requestAnimationFrame(stageLoop);
  const S = app.S;
  const t = performance.now();
  layoutStage();

  if (ST.splash) {
    if (t >= ST.splash.until) { ST.splash = null; stayAwake(false); syncStage(); render(); }
    return;
  }

  // the 3-2-1
  if (R && R.state === 'count') {
    if (!app.sheet) {
      R.reader.learn();
      const el = t - R.countT, beat = Math.floor(el / COUNT_MS);
      if (beat >= 3) { go(); }
      else if (beat + 1 !== R.lastBeat) {
        R.lastBeat = beat + 1;
        setFx(`<div class="big">${3 - beat}</div><div class="small">${beat === 0 ? esc(nameOf(S, R.pid)) + ', get ready' : ''}</div>`, 'count pop');
        sfx.count(); buzz('count');
      }
    } else R.countT = t - R.lastBeat * COUNT_MS + COUNT_MS; // hold the count while a menu is open
    setClock(S.set.secs * 1000);
    return;
  }

  // tilt readings stopped (after a reload, say): offer the tap iPhone needs
  const fix = document.getElementById('tiltfix');
  if (fix) { const lost = R && R.mode === 'tilt' && (R.state === 'live' || R.state === 'flash') && !hasTilt(); if (!lost) R && (R.lostT = 0); else if (!R.lostT) R.lostT = t; fix.hidden = !(lost && t - R.lostT > 1500); }

  // nods
  if (R && R.mode === 'tilt' && !paused() && !app.sheet) {
    const res = R.reader.step();
    if (R.state === 'live' && (res === 'ok' || res === 'pass')) markMine(res === 'ok');
    else if (R.state === 'flash' && t - R.flashT > 380 && (res === 'level' || R.reader.armed)) {
      R.state = 'live'; ST.flash = null; setFx(''); showCard();
      if (R.card && R.card.x) sfx.goldAppears();
    }
  }
  if (R && R.mode === 'tap' && R.state === 'flash' && t - R.flashT > 340) {
    R.state = 'live'; ST.flash = null; setFx(''); showCard();
    if (R.card && R.card.x) sfx.goldAppears();
  }

  // other devices' marks arrive in the state
  if (S.cur && !(R && ST.role !== 'blind')) {
    const n = S.cur.cards.length;
    if (n > ST.seen) {
      const c = S.cur.cards[n - 1];
      if (!ST.mine.has(c.w)) flashMark(c.ok, c.x, false, S.cur.cards);
      ST.seen = n;
    }
  }
  if (ST.flash && t >= ST.flash.until && !(R && R.state === 'flash')) { ST.flash = null; setFx(''); }
  if (!ST.flash) showCard();

  // tally
  const marks = R && ST.role !== 'blind' ? R.marks : (S.cur ? S.cur.cards : []);
  const tl = document.getElementById('tally');
  if (tl) tl.textContent = roundPoints(marks);

  // clock
  const ms = remainingMs();
  setClock(ms);
  if (paused()) {
    if (!ST.pauseShown && app.sheet !== 'pause') { ST.pauseShown = true; setFx('<div class="big">Paused</div>', 'count'); }
    return;
  }
  if (ST.pauseShown) { ST.pauseShown = false; setFx(''); }
  if (R && (R.state === 'live' || R.state === 'flash') && ms <= 0) {
    R.state = 'done';
    if (app.mode === 'online') timesUp();
    act({ t: 'end' });
  } else if (!R && S.phase === 'play' && ms < -2500 && !ST.endAsked) {
    ST.endAsked = true; act({ t: 'end' });
  }
}

function setClock(ms) {
  const el = document.getElementById('clock'); if (!el) return;
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s === ST.lastSec) return;
  const prev = ST.lastSec;
  ST.lastSec = s;
  el.textContent = s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : String(s);
  el.classList.toggle('hurry', s <= 10 && s > 0);
  if (prev != null && s < prev && s <= 10 && s > 0 && !paused() && !(R && R.state === 'count')) {
    sfx.tick(s <= 5);
    if (s <= 3 && R) buzz('tick');
  }
}

// ================================================================ screens
let lastKey = '';
function render() {
  const key = app.screen + '|' + (app.S ? app.S.phase : '');
  const html = view();
  const focus = document.activeElement;
  const typing = focus && focus.tagName === 'INPUT' && $app.contains(focus) && key === lastKey;
  if (typing) {
    // don't rebuild the box someone is typing in: only refresh the live parts
    const tmp = document.createElement('div'); tmp.innerHTML = html;
    for (const el of tmp.querySelectorAll('[data-live]')) {
      const cur = document.getElementById(el.id);
      if (cur && !cur.contains(focus)) cur.replaceWith(el);
    }
  } else {
    $app.innerHTML = html;
  }
  lastKey = key;
  if (app.screen === 'title') heroStart(); else heroStop();
  if (app.focusAfter) { const el = document.getElementById(app.focusAfter); app.focusAfter = null; if (el) { el.focus(); try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) {} } }
}

function view() {
  switch (app.screen) {
    case 'title': return vTitle();
    case 'players': return vPlayers();
    case 'online': return vOnline();
    case 'history': return vHistory();
    case 'scorecard': return vScorecardScreen();
    case 'game': return vGame();
  }
  return vTitle();
}

function vGame() {
  const S = app.S;
  if (!S && app.mode === 'online' && app.room) return `<div class="screen ready"><h2 class="pulse">Joining room ${esc(app.room.code)}…</h2><button class="btn paper" data-a="leave">Cancel</button></div>`;
  if (!S) return vTitle();
  switch (S.phase) {
    case 'lobby': return vLobby();
    case 'turn': return vTurn();
    case 'ready': return vReady();
    case 'play': return `<div class="screen ready"><h2>${esc(nameOf(S, S.cur.pid))} is guessing…</h2></div>`;
    case 'results': return vResults();
    case 'final': return vFinal();
  }
  return '';
}

// ---------------------------------------------------------------- title
function vTitle() {
  const st = app.st;
  const g = st.game && st.game.phase !== 'lobby' && st.game.phase !== 'final' ? st.game : null;
  const room = st.room && Date.now() - st.room.at < 3 * 3600 * 1000 ? st.room : null;
  return `<div class="screen title">
    <div class="wordmark">${esc(TITLE)}</div>
    <div class="hero" id="hero" aria-hidden="true">
      <div class="hint up">↑ Pass</div>
      <div class="phone"><div class="screenface" id="heroface"><div class="face" id="heroword">Penguin</div><div class="verdict" id="heroverdict"></div></div></div>
      <div class="hint down">↓ Got it</div>
    </div>
    <div class="titlebtns">
      ${g ? `<button class="btn big" data-a="resume">Keep playing</button><button class="btn paper" data-a="play">New game</button>`
          : `<button class="btn big" data-a="play">Play</button>`}
      ${room ? `<button class="btn paper" data-a="rejoin">Back to room ${esc(room.code)}</button>` : ''}
      <button class="btn paper" data-a="online">Play online</button>
      <div class="titlemore">
        <button class="btn quiet" data-a="history">Scorecards</button>
        <button class="btn quiet" data-a="settings">Settings</button>
      </div>
    </div>
  </div>`;
}

// the phone on the title nods through a few words, showing how to play
let heroT = 0, heroStep = 0;
function heroStart() {
  if (heroT || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const pool = decks.length ? decks : [{ cards: ['Penguin', 'Pizza', 'Dragon', 'Surfing'], color: '#14a3a0' }];
  const tick = () => {
    const hero = document.getElementById('hero'); if (!hero) { heroStop(); return; }
    const w = document.getElementById('heroword'), v = document.getElementById('heroverdict'), f = document.getElementById('heroface');
    heroStep = (heroStep + 1) % 4;
    if (heroStep === 0 || heroStep === 2) {
      hero.classList.remove('ok', 'pass');
      const d = pool[Math.floor(Math.random() * pool.length)];
      const short = d.cards.filter(c => c.length <= 10);
      w.textContent = short[Math.floor(Math.random() * short.length)] || 'Penguin';
      f.style.setProperty('--hc', d.color);
    } else if (heroStep === 1) { hero.classList.add('ok'); v.textContent = 'Got it!'; }
    else { hero.classList.add('pass'); v.textContent = 'Pass'; }
  };
  heroT = setInterval(tick, 1150);
}
function heroStop() { if (heroT) { clearInterval(heroT); heroT = 0; } }

// ---------------------------------------------------------------- players
function nameRows(list, prefix, max, colorFor) {
  const rows = list.map((n, i) => `<div class="prow">
      ${ava(n || '?', colorFor ? colorFor(n, i) : AVA[i % AVA.length])}
      <input class="name" id="${prefix}${i}" data-in="${prefix}" data-i="${i}" value="${esc(n)}" placeholder="Name" maxlength="${LIMITS.name}" autocomplete="off" autocapitalize="words" spellcheck="false" enterkeyhint="next">
      ${list.length > 1 ? `<button class="x" data-a="rmname" data-list="${prefix}" data-i="${i}" aria-label="Remove">×</button>` : ''}
    </div>`).join('');
  return `<div class="plist">${rows}</div>
    ${list.length < max ? `<button class="btn paper" data-a="addname" data-list="${prefix}">+ Add player</button>` : ''}`;
}

function seg(name, values, cur, fmt) {
  return `<div class="seg" role="group">${values.map(v => `<button class="${v === cur ? 'on' : ''}" data-a="seg" data-k="${name}" data-v="${v}">${fmt(v)}</button>`).join('')}</div>`;
}

function vPlayers() {
  const st = app.st;
  if (!st.names.length) st.names = ['', ''];
  const ready = st.names.map(cleanName).filter(Boolean).length >= 2;
  return `<div class="screen">
    <div class="top"><button class="iconbtn" data-a="home" aria-label="Back">${ICON.back}</button><h2>Who’s playing?</h2></div>
    ${nameRows(st.names, 'n', LIMITS.players)}
    <div class="opts">
      <div><div class="label">Seconds per turn</div>${seg('secs', TIMES, st.set.secs, v => v)}</div>
      <div><div class="label">Turns each</div>${seg('turns', TURNS, st.set.turns, v => v)}</div>
    </div>
    <button class="btn big block" data-a="startlocal" ${ready ? '' : 'disabled'}>Let’s go</button>
  </div>`;
}

// ---------------------------------------------------------------- decks and turns
function scoreStrip(S, nowPid) {
  const rows = standings(S);
  const order = S.players.filter(p => S.sched.includes(p.id));
  return `<div class="scores" id="r-scores" data-live>${order.map(p => {
    const r = rows.find(x => x.id === p.id) || { pts: 0 };
    return `<span class="s ${p.id === nowPid ? 'now' : ''}">${ava(p.name, avaOf(S, p.id), 'sm')}${esc(p.name)} <b>${r.pts}</b></span>`;
  }).join('')}</div>`;
}

function gameTop(S, label) {
  const conn = app.mode === 'online' ? connChip() : '';
  return `<div class="top">
    <button class="iconbtn" data-a="menu" aria-label="Menu">${ICON.menu}</button>
    <span class="grow"></span>${conn}
    ${label ? `<span class="chip">${esc(label)}</span>` : ''}
  </div>`;
}

function connChip() {
  const s = app.room ? app.room.status : 'closed';
  const S = app.S;
  const n = S ? Object.values(S.devs).filter(d => d.on).length : 0;
  return `<span class="chip" id="r-conn" data-live>${s === 'open' ? `<span class="dot"></span>${esc(app.room.code)}, ${n} device${n === 1 ? '' : 's'}` : `<span class="dot warn"></span>Reconnecting…`}</span>`;
}

function vTurn() {
  const S = app.S;
  const p = currentPlayer(S);
  if (!p) return '';
  const label = `Turn ${S.turn + 1} of ${S.sched.length}`;
  if (!mine(p)) {
    const away = app.mode === 'online' && S.devs[p.dev] && !S.devs[p.dev].on;
    return `<div class="screen">
      ${gameTop(S, label)}
      <div class="turnhead">${ava(p.name, avaOf(S, p.id), 'lg')}<h1>${esc(p.name)} is picking a deck</h1></div>
      ${scoreStrip(S, p.id)}
      ${away ? `<div class="note" id="r-away" data-live>${esc(p.name)}’s device has gone quiet.</div>` : ''}
      ${away && amHost() ? `<button class="btn paper" data-a="skip">Skip ${esc(p.name)}’s turn</button>` : ''}
    </div>`;
  }
  const tiles = [...decks, MIX].map(d => `<button class="deck ${d === MIX ? 'mix' : ''}" data-a="pick" data-deck="${esc(d.id)}" style="--c:${d.color}">
      <span class="disc">${esc(d.icon)}</span><span class="t">${esc(d.title)}</span><span class="n">${d.cards.length} cards</span></button>`).join('');
  const pass = app.mode === 'local' && S.sched.length > 1 && S.players.length > 1;
  return `<div class="screen wide">
    ${gameTop(S, label)}
    <div class="turnhead">${ava(p.name, avaOf(S, p.id), 'lg')}<div class="stack" style="gap:6px"><h1>${esc(p.name)}’s turn</h1><p class="muted">${pass ? `Pass the phone to ${esc(p.name)}. ` : ''}Pick a deck.</p></div></div>
    <div class="decks">${tiles}</div>
    ${scoreStrip(S, p.id)}
  </div>`;
}

function vReady() {
  const S = app.S;
  const p = playerById(S, S.cur.pid);
  const deck = deckById(S.cur.deck) || MIX;
  const tag = `<span class="chip">${esc(deck.icon)} ${esc(deck.title)}</span>`;
  if (!R) {
    const away = app.mode === 'online' && S.devs[p.dev] && !S.devs[p.dev].on;
    return `<div class="screen ready">
      ${gameTop(S, '')}
      ${ava(p.name, avaOf(S, p.id), 'lg')}
      <h1>${esc(p.name)} is up!</h1>
      ${tag}
      <h2 class="pulse">Get ready to act it out</h2>
      ${away && amHost() ? `<button class="btn paper" data-a="skip">Skip ${esc(p.name)}’s turn</button>` : ''}
    </div>`;
  }
  if (R.mode === 'tilt') {
    return `<div class="screen ready">
      ${gameTop(S, '')}
      <h1>${esc(p.name)}, phone on your forehead</h1>
      ${HEAD_SVG}
      <div class="legend"><span class="l ok"><i>↓</i>Got it</span><span class="l pass"><i>↑</i>Pass</span></div>
      ${R.needAsk ? (app.motion === 'denied'
        ? `<div class="note">Safari is blocking tilt in this tab. Close this tab, open the game in a new tab and tap <b>Allow</b> when it asks. Still blocked? Close Safari all the way and try again.</div>
           <div class="row" style="justify-content:center"><button class="btn big" data-a="turnontilt">Try again</button><button class="btn paper" data-a="usetap">Use taps instead</button></div>`
        : `<button class="btn big" data-a="turnontilt">Turn on tilt</button>
           <button class="btn quiet" data-a="usetap">Use taps instead</button>`)
      : `<div class="waitbar"><span id="upbar"></span></div>
      <div class="row" style="justify-content:center">
        <button class="btn paper" data-a="startnow">Start</button>
        <button class="btn quiet" data-a="unpick">Change deck</button>
      </div>`}
    </div>`;
  }
  const local = app.mode === 'local';
  return `<div class="screen ready">
    ${gameTop(S, '')}
    ${R.noSensor ? `<div class="note">This device can’t feel tilting, so it’s tap mode.</div>` : ''}
    ${tag}
    <h1>${local ? 'Hand the phone to the actors' : `${esc(p.name)}, get ready to guess`}</h1>
    <p class="muted" style="font-size:19px">${local ? `${esc(p.name)} guesses. Actors tap <b>Got it</b> or <b>Pass</b>.` : 'The others see the word and tap Got it or Pass.'}</p>
    <div class="row" style="justify-content:center">
      <button class="btn big" data-a="startnow">Start</button>
    </div>
    <button class="btn quiet" data-a="unpick">Change deck</button>
  </div>`;
}

// ---------------------------------------------------------------- after a turn
function wordList(cards) {
  if (!cards.length) return '<p class="muted center">No cards this turn.</p>';
  return `<div class="words">${cards.map(c => `<div class="w ${c.ok ? 'ok' : 'no'}"><i>${c.ok ? '✓' : '↑'}</i>${esc(c.w)}${c.x ? '<span class="gold">×2</span>' : ''}</div>`).join('')}</div>`;
}

function vResults() {
  const S = app.S;
  const r = S.rounds[S.rounds.length - 1];
  if (!r) return '';
  const p = playerById(S, r.pid) || { name: '?' };
  const last = S.turn + 1 >= S.sched.length;
  const np = !last ? playerById(S, S.sched[S.turn + 1]) : null;
  const may = app.mode === 'local' || amHost() || mine(p) || (np && mine(np));
  const btn = last ? 'See the scores' : `Next: ${np ? np.name : ''}`;
  const got = r.cards.filter(c => c.ok).length;
  return `<div class="screen">
    ${gameTop(S, `Turn ${S.turn + 1} of ${S.sched.length}`)}
    <div class="center stack" style="gap:6px;align-items:center">
      ${ava(p.name, avaOf(S, p.id), 'lg')}
      <h2>${esc(p.name)}${r.skip ? '’s turn was skipped' : ''}</h2>
      ${r.skip ? '' : `<div class="bigscore"><span class="n">${r.pts}</span></div><p class="muted" style="font-size:18px">${got} got${r.pts > got ? `, plus ${r.pts - got} gold bonus` : ''}${r.title ? ` in ${esc(r.title)}` : ''}</p>`}
    </div>
    ${may ? `<button class="btn big block" data-a="next">${esc(btn)}</button>` : `<p class="center muted" style="font-size:18px">Waiting for ${esc(np ? np.name : 'the host')}…</p>`}
    ${wordList(r.cards)}
    ${scoreStrip(S, null)}
  </div>`;
}

function scorecardHTML(players, rounds, title) {
  const rows = players.map(pl => {
    const mineR = rounds.filter(r => r.name === pl.name);
    return `<tr><td class="rank">${pl.rank}</td><td>${esc(pl.name)}<div class="turns">${mineR.map(r => `<span class="tn">${esc(deckIcon(r.deck))} ${r.skip ? 'skipped' : r.pts}</span>`).join('')}</div></td><td class="tot">${pl.pts}</td></tr>`;
  }).join('');
  return `<div class="card"><div class="hd"><h3>${esc(title)}</h3></div><table><tbody>${rows}</tbody></table></div>`;
}
const deckIcon = id => (deckById(id) || { icon: '🎲' }).icon;

function vFinal() {
  const S = app.S;
  const rows = standings(S);
  const top = rows.filter(r => r.rank === 1);
  const head = !rows.length ? 'Game over' : top.length > 1 ? 'It’s a tie!' : `${top[0].name} wins!`;
  const pod = [rows.find(r => r.rank === 2) && rows.filter(r => r.rank === 2), top, rows.filter(r => r.rank === 3)];
  const podEl = (list, cls, lab) => list && list.length ? `<div class="pod ${cls}">${cls === 'r1' ? '<div class="crown">👑</div>' : ''}
      <div class="avas">${list.map(r => ava(r.name, avaOf(S, r.id), list.length > 1 ? 'sm' : '')).join('')}</div>
      <div class="who">${list.length > 2 ? `${list.length} tied` : list.map(r => esc(r.name)).join(' & ')}</div><div class="blk">${lab}</div></div>` : '';
  const scRounds = S.rounds.map(r => ({ name: nameOf(S, r.pid), deck: r.deck, pts: r.pts, skip: r.skip }));
  const host = amHost();
  return `<div class="screen">
    ${gameTop(S, '')}
    <h1 class="center">${esc(head)}</h1>
    <div><div class="podium">${podEl(pod[0], 'r2', 2)}${podEl(pod[1], 'r1', 1)}${podEl(pod[2], 'r3', 3)}</div><div class="podbase"></div></div>
    ${scorecardHTML(rows, scRounds, 'Scorecard')}
    ${app.mode === 'local' ? `
      <button class="btn big block" data-a="again">Play again</button>
      <div class="row two"><button class="btn paper" data-a="play">New players</button><button class="btn paper" data-a="home">Home</button></div>`
    : host ? `<button class="btn big block" data-a="again">Play again</button>
      <div class="row two"><button class="btn paper" data-a="tolobby">Back to the room</button><button class="btn paper" data-a="leave">Leave</button></div>`
    : `<p class="center muted" style="font-size:18px">Waiting for the host to start another game…</p><button class="btn paper" data-a="leave">Leave the room</button>`}
  </div>`;
}

// ---------------------------------------------------------------- scorecards
function fmtDate(t) {
  const d = new Date(t);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
function vHistory() {
  const h = app.st.history;
  return `<div class="screen">
    <div class="top"><button class="iconbtn" data-a="home" aria-label="Back">${ICON.back}</button><h2>Scorecards</h2></div>
    ${h.length ? `<div class="hist">${h.map((g, i) => {
      const w = g.players.filter(p => p.rank === 1).map(p => p.name).join(' & ');
      return `<button class="hitem" data-a="openhist" data-i="${i}"><div class="grow"><div class="when">${esc(fmtDate(g.at))}${g.online ? ', online' : ''}</div><div class="win">👑 ${esc(w)}</div><div class="when">${g.players.map(p => esc(p.name) + ' ' + p.pts).join(', ')}</div></div></button>`;
    }).join('')}</div>` : `<div class="panel empty"><h3>No scorecards yet</h3><p class="muted">Finish a game and its scores land here.</p></div>`}
  </div>`;
}
function vScorecardScreen() {
  const g = app.st.history[app.histOpen];
  if (!g) { app.screen = 'history'; return vHistory(); }
  return `<div class="screen">
    <div class="top"><button class="iconbtn" data-a="history" aria-label="Back">${ICON.back}</button><h2>${esc(fmtDate(g.at))}</h2></div>
    ${scorecardHTML(g.players, g.rounds, `${g.secs} seconds, ${g.turns} turn${g.turns > 1 ? 's' : ''} each`)}
    ${g.rounds.map(r => `<div class="stack" style="gap:8px"><div class="row"><h3>${esc(r.name)}</h3><span class="chip">${esc(deckIcon(r.deck))} ${esc(r.title || '')}</span><span class="grow"></span><h3>${r.skip ? 'skipped' : r.pts}</h3></div>
      ${wordList(r.words.map(w => ({ w: w[0], ok: w[1], x: w[2] })))}</div>`).join('')}
  </div>`;
}

// ---------------------------------------------------------------- online
function vOnline() {
  const st = app.st;
  if (!st.me.length) st.me = [st.names.find(n => cleanName(n)) || ''];
  const named = st.me.map(cleanName).filter(Boolean).length > 0;
  const code = app.joinCode || '';
  return `<div class="screen">
    <div class="top"><button class="iconbtn" data-a="home" aria-label="Back">${ICON.back}</button><h2>Play online</h2></div>
    ${app.err ? `<div class="err">${esc(app.err)}</div>` : ''}
    <div class="panel stack">
      <div class="label">Who’s playing on this device?</div>
      ${nameRows(st.me, 'm', 4)}
    </div>
    <div class="panel stack">
      <div class="label">Join a room</div>
      <div class="code">${[0, 1, 2, 3].map(i => `<input id="c${i}" data-in="code" data-i="${i}" maxlength="1" inputmode="text" autocapitalize="characters" autocomplete="off" spellcheck="false" value="${esc(code[i] || '')}" aria-label="Letter ${i + 1}">`).join('')}</div>
      <button class="btn big block" data-a="join" ${named && validCode(code) && !app.busy ? '' : 'disabled'}>Join</button>
    </div>
    <div class="panel stack">
      <div class="label">Or start one and share the code</div>
      <button class="btn paper block" data-a="make" ${named && !app.busy ? '' : 'disabled'}>Make a room</button>
    </div>
  </div>`;
}

function vLobby() {
  const S = app.S;
  const host = amHost();
  const hostP = S.players.find(p => p.dev === S.host);
  const devIds = [...new Set([...Object.keys(S.devs), ...S.players.map(p => p.dev)])];
  const devRows = devIds.map(d => {
    const ps = S.players.filter(p => p.dev === d);
    const on = S.devs[d] && S.devs[d].on;
    if (!ps.length && !on) return '';
    return `<div class="dev"><span class="dot ${on ? '' : 'off'}"></span><div class="who">${ps.length ? ps.map(p => `<span class="pname">${ava(p.name, avaOf(S, p.id), 'sm')}${esc(p.name)}</span>`).join('') : '<span class="muted">Someone joining…</span>'}</div>${d === S.host ? '<span class="chip">host</span>' : ''}${d === app.st.dev ? '<span class="chip">you</span>' : ''}</div>`;
  }).join('');
  const n = S.players.length;
  return `<div class="screen">
    <div class="top"><button class="iconbtn" data-a="leave" aria-label="Leave">${ICON.back}</button><h2>Room</h2>${connChip()}</div>
    <div class="code" aria-label="Room code">${[...app.room.code].map(c => `<span>${c}</span>`).join('')}</div>
    <div class="row" style="justify-content:center"><button class="btn paper" data-a="share">${ICON.share.replace('<svg', '<svg width="24" height="24"')} Share the room</button></div>
    ${app.toast ? `<p class="center" style="font-weight:800">${esc(app.toast)}</p>` : ''}
    <div class="panel stack">
      <div class="label">In the room</div>
      <div class="devs" id="r-devs" data-live>${devRows}</div>
    </div>
    <div class="panel stack">
      <div class="label">Playing on this device</div>
      ${nameRows(app.st.me, 'm', 4, (nm, i) => { const p = S.players.find(q => q.dev === app.st.dev && q.name.toLowerCase() === cleanName(nm).toLowerCase()); return p ? avaOf(S, p.id) : AVA[(S.players.length + i) % AVA.length]; })}
    </div>
    ${host ? `<div class="opts" id="r-opts" data-live>
        <div><div class="label">Seconds per turn</div>${seg('rsecs', TIMES, S.set.secs, v => v)}</div>
        <div><div class="label">Turns each</div>${seg('rturns', TURNS, S.set.turns, v => v)}</div>
      </div>
      <div id="r-start" data-live><button class="btn big block" data-a="startonline" ${n >= 2 ? '' : 'disabled'}>Start the game</button>${n < 2 ? '<p class="center muted" style="margin-top:10px">Needs at least two players.</p>' : ''}</div>`
    : `<p class="center muted" style="font-size:18px" id="r-wait" data-live>Waiting for ${esc(hostP ? hostP.name : 'the host')} to start… ${S.set.secs} seconds, ${S.set.turns} turn${S.set.turns > 1 ? 's' : ''} each.</p>`}
  </div>`;
}

// ================================================================ sheets
function openSheet(kind) { app.sheet = kind; drawSheet(); if (kind === 'settings' && !meterT) meterLoop(); }
function closeSheet(kind) { if (kind && app.sheet !== kind) return; app.sheet = null; drawSheet(); }
function drawSheet() {
  let el = document.getElementById('sheet');
  if (!app.sheet) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'sheet'; el.className = 'sheet'; document.body.appendChild(el); }
  el.innerHTML = `<div class="box" role="dialog" aria-modal="true">${sheetHTML(app.sheet)}</div>`;
}

function sheetHTML(kind) {
  const S = app.S;
  if (kind === 'settings') {
    const p = app.st.prefs;
    const opt = (k, vals, labels) => `<div class="seg">${vals.map((v, i) => `<button class="${p[k] === v ? 'on' : ''}" data-a="pref" data-k="${k}" data-v="${v}">${labels[i]}</button>`).join('')}</div>`;
    return `<h2>Settings</h2>
      <div class="set"><div class="label">Controls</div>${opt('controls', ['tilt', 'tap'], ['Tilt', 'Tap'])}<div class="n">Tilt: the phone goes on the guesser’s forehead; nod down for got it, tip up to pass. Tap: someone else holds it and taps.</div></div>
      <div class="set"><div class="label">Nod size</div>${opt('nod', ['small', 'normal', 'big'], ['Small', 'Normal', 'Big'])}<div class="n">How far to nod before it counts.</div></div>
      <div class="set"><div class="label">Try the tilt</div>
        <div class="meter" id="meter"><div class="zone z-ok" id="mzok"></div><div class="zone z-pass" id="mzpass"></div><div class="needle" id="needle"></div><div class="say" id="msay">Tap to test</div></div>
        <div class="n">Hold the phone on your forehead and nod. Green is got it, orange is pass.</div></div>
      <div class="set"><div class="label">Sound</div>${opt('sound', [true, false], ['On', 'Off'])}</div>
      <div class="set"><div class="label">Buzz</div>${opt('buzz', [true, false], ['On', 'Off'])}<div class="n">A little buzz you feel on each card. iPhones need iOS 18 or later.</div></div>
      <button class="btn block" data-a="closesheet">Done</button>`;
  }
  if (kind === 'pause') {
    const host = amHost();
    const mineTurn = !!R;
    return `<h2>Paused</h2>
      ${(mineTurn || host) ? `<button class="btn big block" data-a="resume-turn">Keep going</button>
      <button class="btn paper block" data-a="endturn">End this turn</button>` : `<p class="muted">Waiting for the game to carry on…</p>`}
      ${host ? `<button class="btn quiet block" data-a="finish">End the game</button>` : ''}`;
  }
  if (kind === 'menu') {
    const host = amHost();
    const inGame = S && S.phase !== 'lobby' && S.phase !== 'final';
    return `<h2>Menu</h2>
      <button class="btn block" data-a="closesheet">Back to the game</button>
      <button class="btn paper block" data-a="settings">Settings</button>
      ${inGame && host ? `<button class="btn paper block" data-a="finish">End the game and see scores</button>` : ''}
      ${app.mode === 'online' ? `<button class="btn quiet block" data-a="leave">${app.leaveArm > Date.now() ? 'Tap again to leave' : 'Leave the room'}</button>` : `<button class="btn quiet block" data-a="home">Quit to the title</button>`}`;
  }
  return '';
}

// the tilt tester in Settings
let meterT = 0;
function meterLoop() {
  meterT = 0;
  const needle = document.getElementById('needle'); if (!needle) return;
  meterT = requestAnimationFrame(meterLoop);
  const th = NOD[app.st.prefs.nod] || NOD.normal;
  const zl = document.getElementById('mzok'), zr = document.getElementById('mzpass'), say = document.getElementById('msay');
  const span = 90;
  zl.style.width = ((span - th.ok) / (2 * span) * 100).toFixed(1) + '%';
  zr.style.width = ((span - th.pass) / (2 * span) * 100).toFixed(1) + '%';
  if (!hasTilt()) { say.textContent = app.motion === 'denied' ? 'Blocked: close this tab and reopen the game' : 'No tilt readings yet'; return; }
  const p = reading().pitch;
  needle.style.left = (50 + Math.max(-span, Math.min(span, p)) / span * 50).toFixed(1) + '%';
  say.textContent = p < -th.ok ? 'Got it!' : p > th.pass ? 'Pass' : '';
}

// ================================================================ online room
function connect(code, how) {
  if (app.room) app.room.leave();
  app.mode = 'online'; app.err = ''; app.busy = true;
  app.S = null; app.prevPhase = null;
  const room = new Room(code, how, {
    dev: app.st.dev, key: app.st.key,
    onState: S => {
      if (app.room !== room) return;
      const first = !app.S;
      app.busy = false;
      app.st.room = { code, at: Date.now() }; save(true);
      if (first) app.prevPhase = S.phase;
      setState(S);
      if (first) sendNames(true);
    },
    onStatus: () => { if (app.room === room) { if (app.screen === 'game') render(); } },
    onFatal: why => {
      if (app.room !== room) return;
      app.busy = false;
      if (why === 'taken' && how === 'make' && (app.makeTries = (app.makeTries || 0) + 1) < 6) { connect(newCode(), 'make'); return; }
      room.leave(); app.room = null; app.mode = 'local'; app.S = null;
      if (why === 'noroom' || why === 'key') app.st.room = null;
      if (how === 'back' && why !== 'old') app.joinCode = code;
      app.err = WHY[why] || WHY.bad; app.screen = 'online'; save();
      stageClose(); render();
    },
    onRefused: (why, op) => { if (op !== 'mark' && op !== 'end') console.warn('room refused', op, why); },
  });
  app.room = room;
  render();
}

let namesT = 0;
function sendNames(now) {
  clearTimeout(namesT);
  const go = () => { if (app.mode === 'online' && app.room && app.S && (app.S.phase === 'lobby' || app.S.phase === 'final')) act({ t: 'names', names: app.st.me.map(cleanName).filter(Boolean) }); };
  if (now) go(); else namesT = setTimeout(go, 500);
}

function leaveRoom() {
  if (app.room) app.room.leave();
  app.room = null; app.mode = 'local'; app.S = null; app.st.room = null; save();
  R = null; stageClose(); closeSheet();
  app.screen = 'title';
  render();
}

// ================================================================ input
const handlers = {
  play() { closeSheet(); if (app.mode === 'online') leaveRoom(); app.screen = 'players'; render(); },
  resume() {
    app.mode = 'local';
    const S = JSON.parse(JSON.stringify(app.st.game));
    if (S.phase === 'play' && S.cur && !S.cur.left) S.cur.left = Math.max(10000, S.cur.ends - Date.now());
    wakeTilt();
    app.prevPhase = S.phase; app.screen = 'game'; setState(S);
  },
  home() { closeSheet(); if (app.mode === 'online') { leaveRoom(); return; } R = null; stageClose(); app.S = null; app.screen = 'title'; render(); },
  online() { app.err = ''; app.screen = 'online'; render(); },
  history() { closeSheet(); app.screen = 'history'; render(); },
  openhist(el) { app.histOpen = +el.dataset.i; app.screen = 'scorecard'; render(); },
  settings() { openSheet('settings'); },
  menu() { app.leaveArm = 0; openSheet('menu'); },
  closesheet() { closeSheet(); },
  rejoin() { wakeTilt(); connect(app.st.room.code, 'back'); app.screen = 'game'; render(); },

  addname(el) {
    const list = el.dataset.list === 'n' ? app.st.names : app.st.me;
    list.push(''); save(true);
    app.focusAfter = el.dataset.list + (list.length - 1);
    render();
  },
  rmname(el) {
    const list = el.dataset.list === 'n' ? app.st.names : app.st.me;
    list.splice(+el.dataset.i, 1); save(true);
    if (el.dataset.list === 'm') sendNames(true);
    render();
  },
  seg(el) {
    const k = el.dataset.k, v = +el.dataset.v;
    if (k === 'secs' || k === 'turns') { app.st.set[k] = v; save(true); render(); return; }
    if (k === 'rsecs') act({ t: 'settings', secs: v, turns: app.S.set.turns });
    if (k === 'rturns') act({ t: 'settings', secs: app.S.set.secs, turns: v });
  },
  pref(el) {
    const k = el.dataset.k; let v = el.dataset.v;
    if (v === 'true' || v === 'false') v = v === 'true';
    app.st.prefs[k] = v; save();
    setSound(app.st.prefs.sound); setBuzz(app.st.prefs.buzz);
    if (k === 'sound' && v) { unlockAudio(); sfx.pop(); }
    if (k === 'buzz' && v) buzz('ok');
    drawSheet(); if (!meterT) meterLoop();
  },

  startlocal() {
    const names = app.st.names.map(cleanName).filter(Boolean);
    if (names.length < 2) return;
    app.mode = 'local';
    app.S = freshState();
    let r = reduce(app.S, { t: 'names', names }, 'local', Date.now()); app.S = r.S;
    r = reduce(app.S, { t: 'settings', secs: app.st.set.secs, turns: app.st.set.turns }, 'local', Date.now()); app.S = r.S;
    app.prevPhase = 'lobby';
    app.screen = 'game';
    act({ t: 'start' });
  },
  again() { act({ t: 'start' }); },
  tolobby() { act({ t: 'lobby' }); },

  pick(el) {
    wakeTilt();
    const d = deckById(el.dataset.deck); if (!d) return;
    sfx.pop();
    act({ t: 'pick', deck: d.id, title: d.title });
  },
  turnontilt() {
    askMotion().then(r => {
      app.motion = r;
      if (R) { R.since = performance.now(); R.needAsk = r !== 'granted'; }
      render();
    });
  },
  usetap() { if (R) { R.mode = 'tap'; R.needAsk = false; } render(); },
  unpick() { act({ t: 'unpick' }); },
  startnow() {
    wakeTilt();
    if (!R) return;
    startCount();
  },

  pause() { if (paused()) return; act({ t: 'pause' }); if (app.mode === 'online') openSheet('pause'); },
  'resume-turn'() { closeSheet('pause'); if (R) { R.reader.wait(); if (R.mode === 'tilt') wakeTilt(); } if (paused()) act({ t: 'resume' }); },
  tiltfix() { wakeTilt(); },
  endturn() { closeSheet('pause'); if (paused()) act({ t: 'resume' }); if (R) R.state = 'done'; act({ t: 'end' }); },
  finish() { closeSheet(); act({ t: 'finish' }); },
  skip() { act({ t: 'skip' }); },
  next() { sfx.pop(); act({ t: 'next' }); },

  make() {
    app.makeTries = 0;
    const names = app.st.me.map(cleanName).filter(Boolean);
    if (!names.length) return;
    connect(newCode(), 'make');
  },
  join() {
    const code = (app.joinCode || '').toUpperCase();
    if (!validCode(code)) return;
    connect(code, 'join');
  },
  startonline() { sendNames(true); act({ t: 'start' }); },
  share() {
    const url = `${location.origin}${location.pathname}?room=${app.room.code}`;
    const done = msg => { app.toast = msg; render(); setTimeout(() => { app.toast = ''; render(); }, 2500); };
    if (navigator.share) navigator.share({ title: TITLE, text: `Join my room: ${app.room.code}`, url }).catch(() => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => done('Link copied'), () => done(url));
    else done(url);
  },
  leave() {
    if (app.sheet === 'menu' && app.leaveArm < Date.now()) { app.leaveArm = Date.now() + 3000; drawSheet(); return; }
    leaveRoom();
  },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]');
  if (el && handlers[el.dataset.a]) { e.preventDefault(); handlers[el.dataset.a](el); }
  if (e.target.closest('#meter')) {
    askMotion().then(r => { app.motion = r; save(); });
    if (!meterT) meterLoop();
  }
  if (e.target.id === 'sheet' && app.sheet !== 'pause') closeSheet();
});

// Got it / Pass act on finger-down, so they feel instant
$stage.addEventListener('pointerdown', e => {
  const el = e.target.closest('[data-down]');
  if (!el) return;
  e.preventDefault();
  el.classList.add('down'); setTimeout(() => el.classList.remove('down'), 120);
  markMine(el.dataset.down === 'ok');
});

document.addEventListener('input', e => {
  const el = e.target;
  const k = el.dataset && el.dataset.in;
  if (k === 'n' || k === 'm') {
    const list = k === 'n' ? app.st.names : app.st.me;
    list[+el.dataset.i] = el.value.slice(0, LIMITS.name);
    save(true);
    const a = el.parentElement.querySelector('.ava'); if (a) a.textContent = (el.value.trim().charAt(0) || '?').toUpperCase();
    if (k === 'm') sendNames();
    // the start/join buttons light up as soon as there are enough names
    const ready = k === 'n' ? list.map(cleanName).filter(Boolean).length >= 2 : list.map(cleanName).filter(Boolean).length > 0;
    for (const b of document.querySelectorAll(k === 'n' ? '[data-a="startlocal"]' : '[data-a="make"],[data-a="join"]')) {
      b.disabled = !ready || (b.dataset.a === 'join' && !validCode(app.joinCode || '')) || app.busy;
    }
  } else if (k === 'code') {
    const i = +el.dataset.i;
    const v = el.value.toUpperCase().replace(/[^A-Z]/g, '');
    const arr = (app.joinCode || '').padEnd(4, ' ').split('');
    if (v.length > 1) { // pasted a whole code
      v.slice(0, 4 - i).split('').forEach((ch, j) => { arr[i + j] = ch; const inp = document.getElementById('c' + (i + j)); if (inp) inp.value = ch; });
    } else { arr[i] = v || ' '; el.value = v; }
    app.joinCode = arr.join('').replace(/ +$/, '');
    if (v && i < 3) { const nx = document.getElementById('c' + Math.min(3, i + v.length)); if (nx) nx.focus(); }
    const b = document.querySelector('[data-a="join"]');
    if (b) b.disabled = !(validCode(app.joinCode) && app.st.me.map(cleanName).filter(Boolean).length && !app.busy);
  }
});

document.addEventListener('keydown', e => {
  const el = e.target;
  if (el.dataset && (el.dataset.in === 'n' || el.dataset.in === 'm') && e.key === 'Enter') {
    e.preventDefault();
    const list = el.dataset.in === 'n' ? app.st.names : app.st.me;
    const i = +el.dataset.i;
    if (i === list.length - 1 && el.value.trim() && list.length < (el.dataset.in === 'n' ? LIMITS.players : 4)) handlers.addname({ dataset: { list: el.dataset.in } });
    else { const nx = document.getElementById(el.dataset.in + (i + 1)); if (nx) nx.focus(); else el.blur(); }
    return;
  }
  if (el.dataset && el.dataset.in === 'code' && e.key === 'Backspace' && !el.value) {
    const pv = document.getElementById('c' + (+el.dataset.i - 1)); if (pv) { pv.focus(); pv.value = ''; }
  }
  if (el.dataset && el.dataset.in === 'code' && e.key === 'Enter') { handlers.join(); return; }
  if (el.tagName === 'INPUT') return;
  // keyboard play on a computer
  if (ST.role === 'judge' && !app.sheet) {
    if (['ArrowRight', 'ArrowDown', 'Enter', ' '].includes(e.key)) { e.preventDefault(); markMine(true); }
    else if (['ArrowLeft', 'ArrowUp', 'Backspace'].includes(e.key)) { e.preventDefault(); markMine(false); }
  }
  if (ST.role && (e.key === 'Escape' || e.key === 'p')) { if (paused()) handlers['resume-turn'](); else handlers.pause(); }
  if (e.key === 'Escape' && app.sheet && app.sheet !== 'pause') closeSheet();
});

// iPhone: ask for tilt first thing in a tap (once a game is on its way), so
// nothing else in the tap can use up the browser's permission to ask
function tiltTap(e) {
  if (e.isTrusted === false) return; // the hidden buzz switch's own click
  if (!app.st || app.st.prefs.controls !== 'tilt' || !TOUCH || !NEEDS_ASK) return;
  if (app.motion === 'granted' && hasTilt()) return;
  if (app.screen === 'title' && !(e.target.closest && e.target.closest('[data-a="play"],[data-a="online"],[data-a="resume"],[data-a="rejoin"]'))) return;
  if (app.screen === 'history' || app.screen === 'scorecard') return;
  wakeTilt();
}
document.addEventListener('touchend', tiltTap, { capture: true, passive: true });
document.addEventListener('click', tiltTap, true);
// then wake the sound in every tap (after the motion question above)
startUnlocking();
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault());

// put the phone down (or lock it) in the middle of a turn: pause
document.addEventListener('visibilitychange', () => {
  if (document.hidden && R && (R.state === 'live' || R.state === 'flash') && !paused()) act({ t: 'pause' });
});
window.addEventListener('resize', () => { ST.w = 0; });

// ================================================================ confetti
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = $conf, g = c.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = innerWidth * dpr; c.height = innerHeight * dpr; c.hidden = false;
  const cols = ['#ffc83d', '#12c98a', '#ff4f9a', '#4f86ff', '#ff8a1f', '#fff8ec'];
  const bits = Array.from({ length: 140 }, () => ({ x: Math.random() * c.width, y: -Math.random() * c.height * 0.6, vx: (Math.random() - 0.5) * 3 * dpr, vy: (2 + Math.random() * 3) * dpr,
    r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, s: (6 + Math.random() * 8) * dpr, col: cols[Math.floor(Math.random() * cols.length)] }));
  const t0 = performance.now();
  const step = t => {
    g.clearRect(0, 0, c.width, c.height);
    for (const b of bits) {
      b.x += b.vx; b.y += b.vy; b.vy += 0.04 * dpr; b.r += b.vr;
      g.save(); g.translate(b.x, b.y); g.rotate(b.r); g.fillStyle = b.col; g.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2); g.restore();
    }
    if (t - t0 < 4200) requestAnimationFrame(step); else { c.hidden = true; }
  };
  requestAnimationFrame(step);
}

// ================================================================ start
async function boot() {
  app.st = loadStore();
  if (!Array.isArray(app.st.me)) app.st.me = [];
  setSound(app.st.prefs.sound); setBuzz(app.st.prefs.buzz);
  await loadDecks();
  const code = (new URLSearchParams(location.search).get('room') || '').toUpperCase();
  const back = app.st.room && Date.now() - app.st.room.at < 3 * 3600 * 1000 ? app.st.room.code : '';
  if (validCode(code) && code === back) { app.screen = 'game'; connect(code, 'back'); return; } // reloaded inside a room
  if (validCode(code)) { app.joinCode = code; app.screen = 'online'; }
  render();
}

// for tests: window.CH drives the game the way fingers and nods would
window.CH = {
  app, get R() { return R; }, act, handlers, decks, ST, reading, hasTilt, audioState, testStickAudio,
  // pretend to be a phone on a forehead, tipped by `pitch` degrees (+ is up)
  hold(pitch) {
    this.pitch = pitch;
    if (this.holdT) return;
    const send = () => {
      const p = this.pitch;
      const o = p >= 0 ? { beta: 0, gamma: p - 90 } : { beta: 180, gamma: 90 + p };
      window.dispatchEvent(Object.assign(new Event('deviceorientation'), { ...o, alpha: 0 }));
    };
    send(); this.holdT = setInterval(send, 30);
  },
  release() { clearInterval(this.holdT); this.holdT = 0; },
};

boot();
