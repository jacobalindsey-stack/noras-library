// Slap Happy on the big screen: the lobby with the room letters and QR code,
// the questions, the timer, the scoreboard, and every rule of the game.
// Phones only send slaps, reveals and right/wrong; this file decides.

import { $, $$, esc, COLORS, colorOf, inkOn, teamStyle, randomName, SPEED, stayAwake, confetti, rain, bindTaps, isTouch } from './common.js';
import { Link, newCode, rid, isCode } from './net.js';
import * as SND from './sound.js';
import { haptic } from './haptics.js';
import { loadTopics, pickQuestions, markSeen } from './topics.js';
import { setupForm, wireSetup } from './team.js';

const SAVE = 'slaphappy.host.v1';
const MAX_TEAMS = 8;
const ms = s => s * 1000 * SPEED;
const now = () => performance.now();

export function savedShow() {
  try { const s = JSON.parse(localStorage.getItem(SAVE) || 'null'); if (s && Date.now() - s.t < 3 * 3600e3 && isCode(s.room)) return s; } catch (e) {}
  return null;
}

let H = null;

export async function startHost(app, { fresh }) {
  if (H) H.stop();
  H = {
    app, room: null, key: null, link: null, net: 'connecting', netSince: now(), teams: [], topics: [],
    settings: { count: 10, slap: 20, answer: 10, topics: null, voice: false },
    g: null, loop: null, screen: null, screens: new Set(), pingT: null,
    stop() { clearInterval(this.loop); clearInterval(this.pingT); if (this.link) this.link.close(); SND.stopMusic(); SND.hush(); },
  };
  window.SLAP = window.SLAP || {}; window.SLAP.host = H;
  const s = !fresh && savedShow();
  if (s) {
    H.room = s.room; H.key = s.key;
    Object.assign(H.settings, s.settings || {});
    H.teams = (s.teams || []).map(t => ({ ...t, online: !!t.local }));
  } else {
    H.room = newCode(); H.key = rid(16);
    try { localStorage.removeItem(SAVE); } catch (e) {}
  }
  app.innerHTML = '';
  H.topics = await loadTopics();
  const ids = H.topics.map(t => t.id);
  H.settings.topics = (H.settings.topics || ids).filter(id => ids.includes(id));
  if (!H.settings.topics.length) H.settings.topics = ids.slice();
  connect();
  lobby();
  H.loop = setInterval(tick, 50);
  H.pingT = setInterval(pingPhones, 4000);
  stayAwake();
  addEventListener('keydown', onKey);
  if (s && s.g && s.g.qs && s.g.i < s.g.qs.length) offerResume(s.g);
}

// ---------- the relay ----------
function connect() {
  if (H.link) H.link.close();
  H.link = new Link(`/room/${H.room}?host=${H.key}`, {
    message: onNet,
    status: st => { H.net = st; H.netSince = now(); renderNet(); },
    fatal: why => {
      if (why === 'taken') { H.room = newCode(); save(); connect(); if (H.screen === 'lobby') lobby(); }
      else { H.net = 'dead'; renderNet(); }
    },
  });
}
const send = (to, m) => H.link && H.link.send({ to, m });
const byId = id => H.teams.find(t => t.id === id);

function onNet(m) {
  if (m.t === 'hello') {
    for (const t of H.teams) if (!t.local) t.online = m.teams.includes(t.id);
    broadcastInfo();
    pushViews(true);
    renderTeams();
  } else if (m.t === 'peer') {
    const t = byId(m.id);
    if (m.on) { if (t) { t.online = true; sendView(t, true); } send(m.id, info()); }
    else { if (t) t.online = false; H.screens.delete(m.id); }
    renderTeams();
  } else if (m.f && m.m) fromTeam(m.f, m.m);
}

function info() { return { t: 'info', taken: H.teams.map(t => t.color), names: H.teams.map(t => t.name), sounds: H.teams.map(t => t.sound), started: !!H.g }; }
function broadcastInfo() { send('*', info()); }

function cleanName(n) { return String(n || '').trim().replace(/\s+/g, ' ').slice(0, 22) || randomName(H.teams.map(t => t.name)); }
function freeColor(want, self) {
  const taken = H.teams.filter(t => t !== self).map(t => t.color);
  if (COLORS.some(c => c.id === want) && !taken.includes(want)) return want;
  return (COLORS.find(c => !taken.includes(c.id)) || COLORS[0]).id;
}

function fromTeam(id, msg) {
  if (msg.t === 'watch') { H.screens.add(id); syncScreens(true); return; }
  let t = byId(id);
  if (msg.t === 'pong') { if (t && isFinite(msg.s)) { const r = Math.max(0, now() - msg.s); t.rtt = t.rtt ? t.rtt * 0.6 + r * 0.4 : r; } return; }
  if (msg.t === 'join') {
    const sound = SND.BUZZERS.some(b => b.id === msg.sound) ? msg.sound : 'boing';
    if (!t) {
      if (H.teams.length >= MAX_TEAMS) { send(id, { t: 'full' }); return; }
      t = { id, name: cleanName(msg.name), sound, score: 0, local: false, online: true };
      t.color = freeColor(msg.color, t);
      H.teams.push(t);
      SND.play('join');
      setTimeout(() => SND.buzzer(t.sound), 280);
    } else {
      t.name = cleanName(msg.name); t.sound = sound; t.color = freeColor(msg.color, t); t.online = true;
    }
    save(); renderTeams(); wiggle(t); broadcastInfo(); sendView(t, true);
    return;
  }
  if (!t) return;
  if (msg.t === 'slap') {
    const g = H.g;
    if (!g || g.over) { SND.buzzer(t.sound); wiggle(t); sendFx({ k: 'buzz', id: t.id }); return; } // testing the buzzer in the lobby
    if (g.phase === 'armed' && msg.r === g.seq && !g.paused) registerSlap(t, +msg.rt);
  } else if (msg.t === 'reveal') {
    if (H.g && H.g.phase === 'up' && H.g.buzz === id && msg.r === H.g.seq) reveal();
  } else if (msg.t === 'judge') {
    if (H.g && H.g.phase === 'judge' && H.g.buzz === id && msg.r === H.g.seq) judge(!!msg.ok);
  }
}

// ---------- what each phone should show ----------
function rankOf(t) { return 1 + H.teams.filter(o => o.score > t.score).length; }
function viewFor(t) {
  const g = H.g, q = g && g.qs[g.i];
  const v = { t: 'view', name: t.name, color: t.color, sound: t.sound, score: t.score, rank: rankOf(t), round: g ? Math.min(g.i + 1, g.qs.length) : 0, total: g ? g.qs.length : 0, bonus: !!(q && q.bonus), seq: g ? g.seq : 0 };
  if (!g) return { ...v, v: 'lobby' };
  if (g.paused) return { ...v, v: 'paused' };
  const left = () => Math.max(0, Math.round(g.end - now()));
  const buzzT = g.buzz && byId(g.buzz);
  const by = buzzT ? { name: buzzT.name, color: buzzT.color } : null;
  const answer = q ? q.answerText : '';
  switch (g.phase) {
    case 'intro': return { ...v, v: 'intro' };
    case 'splash': return { ...v, v: 'next' };
    case 'ready': return { ...v, v: 'get', ms: left() };
    case 'armed': return { ...v, v: 'slap', ms: left() };
    case 'up': case 'revealing':
      return t.id === g.buzz ? { ...v, v: 'up', ms: g.phase === 'up' ? left() : 0, revealing: g.phase === 'revealing' } : { ...v, v: 'out', by };
    case 'judge': return t.id === g.buzz ? { ...v, v: 'judge', answer } : { ...v, v: 'out', by, answer };
    case 'result': return { ...v, v: 'res', mine: t.id === g.buzz, ok: g.result.ok, pts: g.result.pts, by, answer };
    case 'timeout': return { ...v, v: 'timeup' };
    case 'answer': return { ...v, v: 'timeup', answer };
    case 'final': return { ...v, v: 'final' };
    case 'over': {
      const top = [...H.teams].sort((a, b) => b.score - a.score)[0];
      return { ...v, v: 'over', place: rankOf(t), tie: H.teams.filter(o => o.score === t.score).length > 1, winner: top ? { name: top.name, color: top.color } : null };
    }
  }
  return { ...v, v: 'lobby' };
}
function sendView(t, force) {
  if (H.mirror) return;
  const v = viewFor(t);
  const k = JSON.stringify({ ...v, ms: 0 });
  if (!force && t._k === k) return;
  t._k = k;
  if (t.local) renderPad(t, v);
  else if (t.online) send(t.id, v);
}
function pushViews(force) { if (H.mirror) return; for (const t of H.teams) sendView(t, force); syncScreens(force); }

// ---------- far-away screens: a live copy of the show ----------
function snapshot() {
  const g = H.g, q = g && g.qs[Math.min(Math.max(g.i, 0), g.qs.length - 1)];
  return {
    t: 'show', screen: H.screen, room: H.room,
    settings: { count: H.settings.count, slap: H.settings.slap, answer: H.settings.answer, topics: H.settings.topics },
    teams: H.teams.map(({ id, name, color, sound, score, local, online }) => ({ id, name, color, sound, score, local, online })),
    g: g ? {
      i: g.i, total: g.qs.length, seq: g.seq, phase: g.phase, dur: g.dur || 0, paused: !!g.paused, buzz: g.buzz, result: g.result,
      revealed: !!g.revealed, over: !!g.over, slapped: g.slaps.map(x => x.id),
      left: g.paused ? Math.round(g.left || 0) : (g.end ? Math.max(0, Math.round(g.end - now())) : 0),
      q: q ? { id: q.id, q: q.q, choices: q.choices, answer: q.answer, answerText: q.answerText, fact: q.fact, bonus: q.bonus } : null,
    } : null,
  };
}
function syncScreens(force) {
  if (!H || H.mirror || !H.screens || !H.screens.size) return;
  const s = snapshot();
  const k = JSON.stringify({ ...s, g: s.g ? { ...s.g, left: 0 } : null });
  if (!force && k === H._sk) return;
  H._sk = k;
  send([...H.screens], s);
}
function sendFx(fx) { if (H && !H.mirror && H.screens && H.screens.size) send([...H.screens], { t: 'fx', ...fx }); }

// How long to wait after the first slap for slaps still on their way: long
// enough for the slowest phone's connection (Croatia is a long way from home).
function pingPhones() {
  if (!H || H.mirror) return;
  const s = Math.round(now());
  for (const t of H.teams) if (!t.local && t.online) send(t.id, { t: 'ping', s });
}
function slapWindow() {
  const r = H.teams.filter(t => !t.local && t.online && t.rtt).map(t => t.rtt);
  return Math.round(Math.min(700, Math.max(260, (r.length ? Math.max(...r) : 0) + 100)));
}

// ---------- saving, so a reload or a sleepy iPad doesn't end the show ----------
let saveT = null;
function save() {
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    const g = H.g;
    const s = { t: Date.now(), room: H.room, key: H.key, settings: H.settings,
      teams: H.teams.map(({ id, name, color, sound, score, local }) => ({ id, name, color, sound, score, local })),
      g: g && !g.over ? { qs: g.qs, i: g.i, seq: g.seq } : null };
    try { localStorage.setItem(SAVE, JSON.stringify(s)); } catch (e) {}
  }, 200);
}

// ---------- icons ----------
const ICON = {
  sound: on => on ? '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>',
  music: on => `<svg viewBox="0 0 24 24"><path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>${on ? '' : '<path d="M3 3l18 18"/>'}</svg>`,
  pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>',
  exit: '<svg viewBox="0 0 24 24"><path d="M14 5H6v14h8M10 12h11M17 8l4 4-4 4"/></svg>',
};

// ---------- the lobby ----------
function joinURL() { return location.origin + location.pathname.replace(/index\.html$/, '') + '?join=' + H.room; }
function shortURL() { return (location.host + location.pathname.replace(/index\.html$/, '').replace(/\/$/, '')).replace(/^www\./, ''); }
function qrSVG(text) {
  try { const qr = window.qrcode(0, 'M'); qr.addData(text); qr.make(); return qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); } catch (e) { return ''; }
}

function lobby() {
  H.screen = 'lobby';
  H.g = null;
  const S = H.settings;
  const pool = H.topics.filter(t => S.topics.includes(t.id)).reduce((n, t) => n + t.questions.length, 0);
  H.app.innerHTML = `
  <div class="screen host lobby">
    <div class="rays turn"></div>
    <header>
      <div class="mini-logo">Slap <b>Happy</b></div>
      <div class="grow"></div>
      <div class="tools">
        <button class="iconbtn${SND.prefs.music ? '' : ' off'}" data-act="music" aria-label="Music on or off">${ICON.music(SND.prefs.music)}</button>
        <button class="iconbtn${SND.prefs.sound ? '' : ' off'}" data-act="sound" aria-label="Sound on or off">${ICON.sound(SND.prefs.sound)}</button>
        <button class="iconbtn" data-act="exit" aria-label="Leave the show">${ICON.exit}</button>
      </div>
    </header>
    <div class="lobby-main">
      <section class="join-card marquee chase">
        <div class="how">Join on your phone</div>
        <div class="qr">${qrSVG(joinURL())}</div>
        <div class="codebox">
          <div class="url">${esc(shortURL())}</div>
          <div class="code-label">Room letters</div>
          <div class="code${H.net === 'open' ? '' : ' pending'}">${H.room}</div>
          <div class="netwarn"></div>
          ${H.mirror ? '' : `<div class="farnote">Family far away? Open this page on their TV or iPad, tap Watch on another screen, and type the letters.</div>`}
        </div>
      </section>
      <section class="teams-card">
        <div class="teams-head"><h2>Teams</h2><div class="grow"></div><button class="btn ghost small" data-act="addlocal">Add a team on this screen</button></div>
        <div class="podiums lobby-podiums scroll"></div>
      </section>
    </div>
    <footer class="lobby-foot">
      <div class="optgroup"><div class="lbl">Topics</div><div class="topics">${H.topics.map(t => `<button class="topic${S.topics.includes(t.id) ? ' on' : ''}" data-act="topic" data-arg="${t.id}"><span class="e">${esc(t.emoji)}</span>${esc(t.title)} <small>${t.questions.length}</small></button>`).join('') || '<span class="netwarn">No topics found.</span>'}</div></div>
      <div class="optgroup"><div class="lbl">Questions</div><div class="pills">${[10, 15, 20].map(n => `<button class="pill${S.count === n ? ' on' : ''}" data-act="count" data-arg="${n}" ${n > pool ? 'disabled style="opacity:.3"' : ''}>${n}</button>`).join('')}</div></div>
      <div class="optgroup"><div class="lbl">Time to slap</div><div class="pills">${[10, 20, 30].map(n => `<button class="pill${S.slap === n ? ' on' : ''}" data-act="slaptime" data-arg="${n}">${n}s</button>`).join('')}</div></div>
      <div class="optgroup"><div class="lbl">Read questions aloud</div><div class="pills"><button class="pill${S.voice ? '' : ' on'}" data-act="voice" data-arg="0">Off</button><button class="pill${S.voice ? ' on' : ''}" data-act="voice" data-arg="1">On</button></div></div>
      <div class="grow"></div>
      <button class="btn big gold start" data-act="start">Start the show</button>
    </footer>
    ${H.mirror ? `<div class="mirror-wait">Waiting for the host to start the show</div>` : ''}
  </div>`;
  const scr = H.app.firstElementChild;
  if (H.mirror) scr.classList.add('mirror');
  bindTaps(scr, {
    music: (a, b) => { SND.setMusic(!SND.prefs.music); b.innerHTML = ICON.music(SND.prefs.music); b.classList.toggle('off', !SND.prefs.music); if (SND.prefs.music) SND.music('lobby'); },
    sound: (a, b) => { SND.setSound(!SND.prefs.sound); b.innerHTML = ICON.sound(SND.prefs.sound); b.classList.toggle('off', !SND.prefs.sound); },
    exit: () => H.mirror ? leaveMirror() : confirmBox('Leave the show?', 'Phones will be sent home. The teams can join a new show later.', 'Leave', () => { endShow(); }),
    addlocal: () => addLocal(),
    remove: id => { const t = byId(id); if (!t) return; if (!t.local) H.link.send({ kick: id }); H.teams = H.teams.filter(x => x !== t); SND.play('pop'); save(); renderTeams(); broadcastInfo(); },
    topic: id => { const on = S.topics.includes(id); if (on && S.topics.length === 1) return; S.topics = on ? S.topics.filter(x => x !== id) : [...S.topics, id]; SND.play('pop'); save(); lobby(); },
    count: n => { S.count = +n; SND.play('pop'); save(); lobby(); },
    slaptime: n => { S.slap = +n; SND.play('pop'); save(); lobby(); },
    voice: n => { S.voice = n === '1'; SND.play('pop'); save(); lobby(); if (S.voice) SND.speak('Welcome to Slap Happy!'); },
    start: () => startGame(),
  });
  wirePads(scr);
  renderTeams();
  renderNet();
  SND.music('lobby');
}

function renderNet() {
  const code = $('.join-card .code', H.app), warn = $('.netwarn', H.app);
  if (!code || !warn) return;
  code.classList.toggle('pending', H.net !== 'open');
  const bad = H.net === 'dead' || (H.net !== 'open' && H.link && H.link.tries >= 3);
  warn.textContent = bad ? "Phones can't reach this show right now. Check the Wi-Fi, or add teams on this screen." : '';
}

function podiumHTML(t, { lobbyMode } = {}) {
  const b = SND.BUZZERS.find(x => x.id === t.sound);
  return `<div class="podium${t.local ? ' local' : ''}${!t.local && !t.online ? ' offline' : ''}" data-id="${t.id}" style="--tc:${colorOf(t.color)};--tink:${inkOn(colorOf(t.color))}">
    <div class="p-light"></div>
    ${lobbyMode ? `<button class="p-x" data-act="remove" data-arg="${t.id}" aria-label="Remove ${esc(t.name)}">×</button><span class="p-sound">${b ? b.e : ''}</span>` : ''}
    <span class="p-off">phone asleep</span>
    <div class="p-name">${esc(t.name)}</div>
    <div class="p-score">${t.score}</div>
    <div class="p-act"></div>
  </div>`;
}

function renderTeams() {
  if (H.screen === 'lobby') {
    const box = $('.lobby-podiums', H.app); if (!box) return;
    box.innerHTML = H.teams.length ? H.teams.map(t => podiumHTML(t, { lobbyMode: true })).join('') : `<div class="empty-teams">Scan the code or go to the address with each team's phone. Teams pop up here as they join.</div>`;
    const start = $('[data-act="start"]', H.app); if (start) start.disabled = !H.teams.length;
    if (!H.mirror) for (const t of H.teams) if (t.local) renderPad(t, viewFor(t));
  } else if (H.screen === 'show') {
    const foot = $('.show-foot .podiums', H.app); if (!foot) return;
    const have = $$('.podium', foot).map(p => p.dataset.id).join(',');
    if (have !== H.teams.map(t => t.id).join(',')) { foot.innerHTML = H.teams.map(t => podiumHTML(t)).join(''); foot.style.setProperty('--n', H.teams.length); foot.classList.toggle('many', H.teams.length > 5); for (const t of H.teams) { t._shown = t.score; t._k = null; } }
    renderPodiums();
  }
  syncScreens();
}

function wiggle(t) { const p = $(`.podium[data-id="${t.id}"]`, H.app); if (!p) return; p.classList.remove('wiggle'); void p.offsetWidth; p.classList.add('wiggle'); }

// teams that play on the big screen itself: their podium is their buzzer
function wirePads(scr) {
  scr.addEventListener('pointerdown', e => {
    const b = e.target.closest('.p-tap[data-pad="slap"]'); if (!b) return;
    e.preventDefault();
    const t = byId(b.closest('.podium').dataset.id); if (!t) return;
    padSlap(t);
  });
  scr.addEventListener('pointerup', e => {
    const b = e.target.closest('.p-tap[data-pad]'); if (H.mirror || !b || b.dataset.pad === 'slap' || b.disabled) return;
    const t = byId(b.closest('.podium').dataset.id); if (!t) return;
    const g = H.g;
    if (b.dataset.pad === 'test') { SND.buzzer(t.sound); wiggle(t); haptic('tap'); sendFx({ k: 'buzz', id: t.id }); }
    if (b.dataset.pad === 'reveal' && g && g.phase === 'up' && g.buzz === t.id) reveal();
    if (b.dataset.pad === 'yes' && g && g.phase === 'judge' && g.buzz === t.id) judge(true);
    if (b.dataset.pad === 'no' && g && g.phase === 'judge' && g.buzz === t.id) judge(false);
  });
}
function padSlap(t) {
  if (H.mirror) return;
  const g = H.g;
  if (!g) { SND.buzzer(t.sound); wiggle(t); sendFx({ k: 'buzz', id: t.id }); return; }
  if (g.phase === 'armed' && !g.paused && !g.slaps.some(s => s.id === t.id)) { SND.buzzer(t.sound); haptic('slap'); registerSlap(t, now() - g.armedAt); renderPad(t, viewFor(t)); }
  else if (g.phase === 'ready' || g.phase === 'splash') { SND.play('early'); }
}
function renderPad(t, v) {
  const p = $(`.podium[data-id="${t.id}"] .p-act`, H.app); if (!p) return;
  const g = H.g;
  let h = '';
  switch (v.v) {
    case 'lobby': h = `<button class="p-tap" data-pad="test">Test</button>`; break;
    case 'next': case 'get': case 'intro': h = `<button class="p-tap calm" data-pad="slap">Wait for it</button>`; break;
    case 'slap': h = g && g.slaps.some(s => s.id === t.id) ? `<button class="p-tap calm" disabled>Slapped!</button>` : `<button class="p-tap live" data-pad="slap">Slap!</button>`; break;
    case 'up': h = v.revealing ? `<button class="p-tap calm" disabled>...</button>` : `<button class="p-tap calm" data-pad="reveal">Show answer</button>`; break;
    case 'judge': h = `<button class="p-tap yes" data-pad="yes">✓ Right</button><button class="p-tap no" data-pad="no">✗ Wrong</button>`; break;
    default: h = '';
  }
  if (p.innerHTML !== h) p.innerHTML = h;
}

function addLocal() {
  if (H.teams.length >= MAX_TEAMS) return;
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `<div class="card marquee"><div class="join">${setupForm({ title: 'Team on this screen', takenColors: H.teams.map(t => t.color), takenNames: H.teams.map(t => t.name), takenSounds: H.teams.map(t => t.sound), button: 'Add team' })}<button class="btn ghost small back" data-act="cancel">Cancel</button></div></div>`;
  H.app.firstElementChild.appendChild(ov);
  bindTaps(ov, { cancel: () => ov.remove() });
  ov.addEventListener('pointerdown', e => { if (e.target === ov) ov.remove(); });
  wireSetup(ov, {
    takenNames: () => H.teams.map(t => t.name),
    onReady: ({ name, color, sound }) => {
      const t = { id: 'l' + rid(10), name: cleanName(name), sound, score: 0, local: true, online: true };
      t.color = freeColor(color, t);
      H.teams.push(t);
      ov.remove();
      SND.play('join');
      save(); renderTeams(); broadcastInfo(); wiggle(t);
    },
  });
}

function confirmBox(title, note, yes, onYes) {
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `<div class="card marquee"><h2>${esc(title)}</h2><p class="note">${esc(note)}</p><div class="row"><button class="btn ghost" data-act="no">Stay</button><button class="btn tang" data-act="yes">${esc(yes)}</button></div></div>`;
  H.app.firstElementChild.appendChild(ov);
  bindTaps(ov, { no: () => ov.remove(), yes: () => { ov.remove(); onYes(); } });
}

function endShow() {
  try { localStorage.removeItem(SAVE); } catch (e) {}
  send('*', { t: 'ended' });
  removeEventListener('keydown', onKey);
  H.stop();
  H = null;
  window.SLAP.title();
}

function offerResume(sg) {
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `<div class="card marquee"><h2>Pick up where you left off?</h2><p class="note">Question ${Math.min(sg.i + 1, sg.qs.length)} of ${sg.qs.length}, scores kept.</p><div class="row"><button class="btn ghost" data-act="no">Back to the lobby</button><button class="btn gold" data-act="yes">Keep playing</button></div></div>`;
  H.app.firstElementChild.appendChild(ov);
  bindTaps(ov, {
    no: () => { ov.remove(); },
    yes: () => { ov.remove(); startGame({ resume: sg }); },
  });
}

// ---------- the game ----------
function startGame({ resume, again } = {}) {
  if (!H.teams.length) return;
  SND.unlock();
  stayAwake();
  let qs, i = -1, seq = 0;
  if (resume) { qs = resume.qs; i = Math.max(-1, resume.i - 1); seq = resume.seq || 0; }
  else {
    qs = pickQuestions(H.topics, H.settings.topics, H.settings.count);
    if (!qs.length) return;
    if (!resume) for (const t of H.teams) t.score = 0;
  }
  H.g = { qs, i, seq: seq + 1, phase: 'intro', end: 0, onEnd: null, paused: false, left: 0, buzz: null, slaps: [], decideT: null, result: null, armedAt: 0, lastTick: -1, over: false };
  buildShow();
  setPhase('intro', ms(3.4), nextQuestion);
  splash([['3', '']]);
  SND.stopMusic();
  [0, 1, 2].forEach(k => setTimeout(() => { if (!H || !H.g || H.g.phase !== 'intro') return; splash([[String(3 - k), '']]); SND.play('beep'); }, ms(k * 1)));
  setTimeout(() => { if (!H || !H.g || H.g.phase !== 'intro') return; splash([['Go!', 'pink']]); SND.play('go'); }, ms(3));
  broadcastInfo();
  save();
}

function setPhase(name, dur, onEnd) {
  const g = H.g;
  g.phase = name;
  if (name !== 'up') $$('.buzzname, .burst', H.app).forEach(el => el.remove());
  g.end = dur ? now() + dur : 0;
  g.dur = dur;
  g.onEnd = dur ? onEnd : null;
  g.lastTick = -1;
  renderShow();
  pushViews();
}

function nextQuestion() {
  const g = H.g;
  g.i++;
  if (g.i >= g.qs.length) { final(); return; }
  g.seq++; g.buzz = null; g.slaps = []; g.result = null; g.revealed = false;
  clearTimeout(g.decideT); g.decideT = null;
  const q = g.qs[g.i];
  markSeen([q.id]);
  renderQuestion(q);
  SND.stopMusic();
  if (q.bonus) { SND.play('bonus'); splash([['Bonus round!', 'pink'], ['Double points', 'small']]); }
  else { SND.play('whoosh'); splash([[`Question ${g.i + 1}`, ''], [`of ${g.qs.length}`, 'small']]); }
  save();
  setPhase('splash', ms(q.bonus ? 2.4 : 1.4), () => {
    splash(null);
    const len = q.q.length + (q.choices ? q.choices.join('').length * 0.6 : 0);
    let read = Math.min(5600, Math.max(2000, 1100 + 30 * len));
    if (H.settings.voice) { SND.speak(q.q); read *= 1.35; }
    setPhase('ready', read * SPEED, arm);
  });
}

function arm() {
  const g = H.g;
  g.armedAt = now();
  setPhase('armed', ms(H.settings.slap), () => { if (g.slaps.length) decide(); else timeUp(); });
  SND.play('ding');
  SND.music('think');
}

// Slaps are judged by reaction time (from when each buzzer lit up to the
// slap), not by arrival, so a phone on slower Wi-Fi isn't cheated. The big
// screen waits a quarter second after the first slap to hear from the rest.
function registerSlap(t, rt) {
  const g = H.g;
  if (g.phase !== 'armed' || g.slaps.some(s => s.id === t.id)) return;
  if (!isFinite(rt) || rt < 0) rt = now() - g.armedAt;
  g.slaps.push({ id: t.id, rt: Math.min(rt, 600000), at: now() });
  if (!g.decideT) g.decideT = setTimeout(decide, slapWindow());
}
function decide() {
  const g = H.g;
  clearTimeout(g.decideT); g.decideT = null;
  if (!g || g.phase !== 'armed' || !g.slaps.length) return;
  const win = [...g.slaps].sort((a, b) => a.rt - b.rt || a.at - b.at)[0];
  const t = byId(win.id); if (!t) return;
  buzzed(t);
}

function buzzed(t) {
  const g = H.g;
  g.buzz = t.id;
  SND.stopMusic(); SND.hush();
  SND.buzzer(t.sound);
  const scr = H.app.firstElementChild;
  teamStyle(scr, t.color);
  burst(t);
  setPhase('up', ms(H.settings.answer), reveal);
}

function reveal() {
  const g = H.g;
  if (!g || g.phase !== 'up') return;
  SND.drumroll(0.85 * SPEED);
  setPhase('revealing', ms(0.95), () => { g.revealed = true; SND.play('tada'); setPhase('judge', 0, null); });
}

function judge(ok) {
  const g = H.g;
  if (!g || g.phase !== 'judge') return;
  const t = byId(g.buzz), q = g.qs[g.i];
  const pts = ok ? (q.bonus ? 200 : 100) : 0;
  if (t) t.score += pts;
  g.result = { ok, pts };
  if (ok) {
    SND.play('correct'); SND.applause(2);
    const p = t && $(`.podium[data-id="${t.id}"]`, H.app);
    if (p) { const r = p.getBoundingClientRect(); confetti({ x: r.left + r.width / 2, y: r.top, n: 110, colors: [colorOf(t.color), '#ffb81c', '#fff3d1'] }); }
  } else SND.play('wrong');
  save();
  setPhase('result', ms(7), nextQuestion);
}

function timeUp() {
  const g = H.g;
  SND.stopMusic(); SND.hush();
  SND.play('timeup');
  setPhase('timeout', ms(1.2), () => { g.revealed = true; SND.play('tada'); setPhase('answer', ms(6.5), nextQuestion); });
}

function final() {
  const g = H.g;
  SND.stopMusic();
  splash([['And the winner is...', '']]);
  SND.drumroll(2.3 * SPEED);
  setPhase('final', ms(2.6), () => { splash(null); g.over = true; save(); setPhase('over', 0, null); podiumScreen(); });
}

function skip() {
  const g = H.g; if (!g) return;
  clearTimeout(g.decideT); g.decideT = null;
  SND.hush(); SND.stopMusic();
  if (['splash', 'ready', 'armed', 'up', 'revealing', 'judge', 'timeout'].includes(g.phase)) { g.revealed = true; setPhase('answer', ms(5), nextQuestion); }
  else nextQuestion();
}

// ---------- the clock ----------
function tick() {
  const g = H && H.g; if (!g || g.paused) return;
  const t = now();
  if (g.onEnd && g.end && t >= g.end) { const f = g.onEnd; g.onEnd = null; f(); return; }
  // timer ring and countdown ticks
  const tm = $('.timer', H.app);
  if (tm && (g.phase === 'armed' || g.phase === 'up')) {
    const left = Math.max(0, g.end - t), secs = Math.ceil(left / (1000 * SPEED));
    const frac = g.dur ? left / g.dur : 0;
    $('.arc', tm).style.strokeDashoffset = String(CIRC * (1 - frac));
    $('.tnum', tm).textContent = secs;
    tm.classList.toggle('hurry', g.phase === 'armed' && secs <= 5);
    if (secs !== g.lastTick) {
      if (g.lastTick !== -1 && ((g.phase === 'armed' && secs <= 5) || (g.phase === 'up' && secs <= 3)) && secs > 0) SND.play(secs % 2 ? 'tick' : 'tock');
      g.lastTick = secs;
    }
  }
  const nb = $('.nextbar i', H.app);
  if (nb && g.end && g.dur) nb.style.transform = `scaleX(${Math.max(0, (g.end - t) / g.dur)})`;
}

function onKey(e) {
  if (!H || e.target.closest && e.target.closest('input')) return;
  const g = H.g;
  if (e.key === ' ' && g && !g.over) { e.preventDefault(); g.paused ? resume() : pause(); }
  if (e.key === 'Enter' && g && (g.phase === 'result' || g.phase === 'answer')) nextQuestion();
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= 8) { const locals = H.teams.filter(t => t.local); if (locals[n - 1]) padSlap(locals[n - 1]); }
}

// ---------- the show screen ----------
const CIRC = 2 * Math.PI * 45;
function buildShow() {
  H.screen = 'show';
  const topicIds = H.settings.topics;
  const tp = H.topics.filter(t => topicIds.includes(t.id));
  const chip = tp.length === 1 ? `${esc(tp[0].emoji)} ${esc(tp[0].title)}` : `${tp.map(t => esc(t.emoji)).join(' ')} Mixed bag`;
  H.app.innerHTML = `
  <div class="screen host show">
    <div class="rays"></div>
    <header class="show-head">
      <div class="mini-logo">Slap <b>Happy</b></div>
      <div class="round"></div>
      <div class="topic-chip">${chip}</div>
      <div class="grow"></div>
      <div class="roomcode">Join: ${esc(shortURL())} · <b>${H.room}</b></div>
      <button class="iconbtn" data-act="pause" aria-label="Pause">${ICON.pause}</button>
    </header>
    <main class="stage">
      <div class="qrow">
        <div class="board marquee"><div class="bonus-tag">Bonus round: double points</div><div class="qtext"></div></div>
        <div class="timer idle"><svg viewBox="0 0 100 100"><circle class="track" cx="50" cy="50" r="45"/><circle class="arc" cx="50" cy="50" r="45" stroke-dasharray="${CIRC}" stroke-dashoffset="0"/></svg><span class="tnum"></span><span class="tlbl"></span></div>
      </div>
      <div class="choices"></div>
      <div class="say-it">Say your answer out loud</div>
      <div class="openans"></div>
      <div class="fact"></div>
      <div class="statusline"></div>
    </main>
    <footer class="show-foot"><div class="podiums"></div></footer>
    <div class="splash"></div>
  </div>`;
  const scr = H.app.firstElementChild;
  if (H.mirror) scr.classList.add('mirror');
  bindTaps(scr, {
    pause: () => pause(),
    next: () => { const g = H.g; if (g && (g.phase === 'result' || g.phase === 'answer')) nextQuestion(); },
    oreveal: () => reveal(),
    oyes: () => judge(true),
    ono: () => judge(false),
  });
  wirePads(scr);
  renderTeams();
}

function renderQuestion(q) {
  const scr = H.app.firstElementChild;
  scr.classList.toggle('bonus', !!q.bonus);
  const qt = $('.qtext', scr);
  qt.textContent = q.q;
  const L = q.q.length;
  qt.style.setProperty('--qs', L < 50 ? 4.8 : L < 80 ? 4.3 : L < 120 ? 3.8 : 3.3);
  const ch = $('.choices', scr);
  if (q.choices) {
    const longest = Math.max(...q.choices.map(c => c.length));
    ch.style.display = '';
    ch.style.fontSize = '';
    ch.innerHTML = q.choices.map((c, i) => `<div class="choice" style="font-size:calc(${longest < 16 ? 3.3 : longest < 26 ? 2.9 : 2.5} * var(--u))"><span class="ltr">${'ABCD'[i]}</span><span>${esc(c)}</span></div>`).join('');
  } else { ch.style.display = 'none'; ch.innerHTML = ''; }
  $('.say-it', scr).style.display = q.choices ? 'none' : '';
  const oa = $('.openans', scr); oa.textContent = q.answerText; oa.classList.remove('show');
  $('.fact', scr).classList.remove('show');
  fitStage();
}

function renderShow() {
  const g = H.g, scr = H.app.firstElementChild;
  if (!g || H.screen !== 'show' || !scr) return;
  const q = g.qs[Math.min(g.i, g.qs.length - 1)] || g.qs[0];
  $('.round', scr).innerHTML = g.i >= 0 && g.i < g.qs.length ? `Question <b>${g.i + 1}</b> of ${g.qs.length}` : '';
  const buzzT = g.buzz && byId(g.buzz);
  const showAns = g.revealed && ['judge', 'result', 'answer'].includes(g.phase);
  scr.classList.toggle('buzzed', ['up', 'revealing', 'judge', 'result'].includes(g.phase) && !!buzzT);
  if (buzzT) teamStyle(scr, buzzT.color);
  // choices
  $$('.choice', scr).forEach((c, i) => { c.classList.toggle('right', showAns && i === q.answer); c.classList.toggle('wrongout', showAns && i !== q.answer); });
  $('.openans', scr).classList.toggle('show', showAns && !q.choices);
  const fact = $('.fact', scr);
  if (showAns && q.fact) { fact.innerHTML = `<b>Did you know?</b> ${esc(q.fact)}`; fact.classList.add('show'); } else fact.classList.remove('show');
  // timer
  const tm = $('.timer', scr);
  tm.classList.toggle('idle', !(g.phase === 'armed' || g.phase === 'up'));
  $('.tlbl', tm).textContent = g.phase === 'up' ? 'to answer' : g.phase === 'armed' || g.phase === 'ready' ? 'to slap' : '';
  if (g.phase === 'ready') { $('.tnum', tm).textContent = H.settings.slap; $('.arc', tm).style.strokeDashoffset = '0'; }
  if (g.phase === 'up') { $('.arc', tm).style.strokeDashoffset = '0'; }
  if (['timeout', 'answer'].includes(g.phase)) $('.tnum', tm).textContent = '0';
  // the line under the question
  const sl = $('.statusline', scr);
  const name = buzzT ? esc(buzzT.name) : '';
  let h = '';
  switch (g.phase) {
    case 'ready': h = `<div class="call">Get ready...</div>`; break;
    case 'armed': h = `<div class="call go">Slap your buzzers!</div>`; break;
    case 'up': h = `<div class="call">${name}, say your answer!</div><div class="override"><button class="btn ghost small" data-act="oreveal">Show the answer</button></div>`; break;
    case 'revealing': h = `<div class="call">And the answer is...</div>`; break;
    case 'judge': h = `<div class="call">Did ${name} get it right?</div><div class="override"><span>Or decide here:</span> <button class="btn mint small" data-act="oyes">✓ Right</button><button class="btn tang small" data-act="ono">✗ Wrong</button></div>`; break;
    case 'result': h = g.result.ok ? `<div class="call go">+${g.result.pts} for ${name}!</div>` : `<div class="call">Not this time, ${name}</div>`; h += nextHTML(); break;
    case 'timeout': h = `<div class="call">Time's up!</div>`; break;
    case 'answer': h = `<div class="call">Nobody slapped. Here's the answer</div>` + nextHTML(); break;
  }
  sl.innerHTML = h;
  scr.classList.toggle('reveal', showAns);
  renderPodiums();
  fitStage();
}

// If the question, choices, fact and buttons won't fit above the podiums,
// shrink the whole stage a step at a time until they do.
function fitStage() {
  const st = $('.stage', H.app); if (!st) return;
  st.style.setProperty('--fit', '1');
  const need = () => {
    const cs = getComputedStyle(st), gap = parseFloat(cs.rowGap) || 0;
    const kids = [...st.children].filter(k => k.offsetParent !== null && getComputedStyle(k).display !== 'none');
    return kids.reduce((n, k) => n + k.offsetHeight, 0) + gap * Math.max(0, kids.length - 1) + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  };
  let f = 1;
  for (let k = 0; k < 12 && need() > st.clientHeight + 1; k++) { f -= 0.05; st.style.setProperty('--fit', f.toFixed(2)); }
}
addEventListener('resize', () => { if (H && H.screen === 'show') fitStage(); });
if (document.fonts) document.fonts.ready.then(() => { if (H && H.screen === 'show') fitStage(); });
const nextHTML = () => `<div class="override"><div class="nextbar"><i></i></div><button class="btn ghost small" data-act="next">Next question</button></div>`;

function renderPodiums() {
  const g = H.g;
  const top = Math.max(0, ...H.teams.map(t => t.score));
  const leaders = H.teams.filter(t => t.score === top && top > 0);
  for (const t of H.teams) {
    const p = $(`.podium[data-id="${t.id}"]`, H.app); if (!p) continue;
    const lit = g && g.buzz === t.id && ['up', 'revealing', 'judge', 'result'].includes(g.phase);
    p.classList.toggle('lit', !!lit);
    p.classList.toggle('dimmed', !!(g && g.buzz && !lit && ['up', 'revealing', 'judge'].includes(g.phase)));
    p.classList.toggle('crown', leaders.includes(t));
    p.classList.toggle('offline', !t.local && !t.online);
    countScore(t, $('.p-score', p));
  }
}
function countScore(t, el) {
  if (!el) return;
  if (t._shown === undefined) t._shown = t.score;
  if (t._shown === t.score) { el.textContent = t.score; return; }
  const from = t._shown, to = t.score, t0 = now();
  t._shown = to;
  let lastCoin = 0;
  const step = () => {
    const k = Math.min(1, (now() - t0) / 900);
    el.textContent = Math.round(from + (to - from) * k);
    if (k - lastCoin > 0.2 && to > from) { lastCoin = k; SND.play('coin'); }
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function splash(lines) {
  const sp = $('.splash', H.app); if (!sp) return;
  if (!lines) { sp.classList.remove('show', 'anim'); return; }
  sp.innerHTML = lines.map(([txt, cls]) => cls === 'small' ? `<div class="small">${esc(txt)}</div>` : `<div class="big ${cls}">${esc(txt)}</div>`).join('');
  sp.classList.add('show'); sp.classList.remove('anim'); void sp.offsetWidth; sp.classList.add('anim');
}

function burst(t) {
  const scr = H.app.firstElementChild;
  const p = $(`.podium[data-id="${t.id}"]`, scr);
  const r = p ? p.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight, width: 0, height: 0 };
  const b = document.createElement('div');
  b.className = 'burst';
  b.style.left = (r.left + r.width / 2) + 'px'; b.style.top = (r.top + r.height / 2) + 'px';
  b.style.setProperty('--s', Math.hypot(innerWidth, innerHeight) / 20 * 1.3);
  scr.appendChild(b);
  requestAnimationFrame(() => b.classList.add('go'));
  setTimeout(() => b.remove(), 900);
  const n = document.createElement('div');
  n.className = 'buzzname';
  n.innerHTML = `<span>${esc(t.name)}!</span>`;
  scr.appendChild(n);
  requestAnimationFrame(() => n.classList.add('go'));
  setTimeout(() => n.remove(), 1600);
}

// ---------- pause ----------
function pause() {
  const g = H.g; if (!g || g.paused || g.over) return;
  g.paused = true;
  g.left = g.onEnd && g.end ? Math.max(0, g.end - now()) : 0;
  clearTimeout(g.decideT);
  SND.hush(); SND.stopMusic();
  pushViews();
  const ov = document.createElement('div');
  ov.className = 'overlay pause-ov';
  const draw = () => {
    ov.innerHTML = `<div class="card marquee">
      <h2>Paused</h2>
      <div class="row"><button class="btn big gold" data-act="resume">Keep playing</button></div>
      <div class="row"><button class="btn ghost small" data-act="skip">Skip this question</button><button class="btn ghost small" data-act="end">End the show now</button></div>
      <div class="field-label" style="margin:6px 0 -6px 4px">Fix the scores</div>
      <div class="scorefix">${H.teams.map(t => `<div class="sf" style="--tc:${colorOf(t.color)};--tink:${inkOn(colorOf(t.color))}"><span>${esc(t.name)}</span><button data-act="minus" data-arg="${t.id}" aria-label="Take away 100">−100</button><b>${t.score}</b><button data-act="plus" data-arg="${t.id}" aria-label="Add 100">+100</button></div>`).join('')}</div>
      <div class="toggles">
        <button class="btn ghost small" data-act="snd">Sound: ${SND.prefs.sound ? 'on' : 'off'}</button>
        <button class="btn ghost small" data-act="mus">Music: ${SND.prefs.music ? 'on' : 'off'}</button>
        <button class="btn ghost small" data-act="voice">Read aloud: ${H.settings.voice ? 'on' : 'off'}</button>
      </div>
    </div>`;
  };
  draw();
  H.app.firstElementChild.appendChild(ov);
  bindTaps(ov, {
    resume: () => { ov.remove(); resume(); },
    skip: () => { ov.remove(); resume(true); skip(); },
    end: () => { ov.remove(); resume(true); g.i = g.qs.length; final(); },
    minus: id => { const t = byId(id); if (t) { t.score = Math.max(0, t.score - 100); save(); draw(); renderPodiums(); syncScreens(); } },
    plus: id => { const t = byId(id); if (t) { t.score += 100; save(); draw(); renderPodiums(); syncScreens(); } },
    snd: () => { SND.setSound(!SND.prefs.sound); draw(); },
    mus: () => { SND.setMusic(!SND.prefs.music); draw(); },
    voice: () => { H.settings.voice = !H.settings.voice; save(); draw(); },
  });
}
function resume(quiet) {
  const g = H.g; if (!g || !g.paused) return;
  g.paused = false;
  $$('.pause-ov', H.app).forEach(o => o.remove());
  if (g.onEnd) g.end = now() + g.left;
  if (!quiet) {
    if (g.phase === 'armed') SND.music('think');
    if (g.phase === 'armed' && g.slaps.length) g.decideT = setTimeout(decide, slapWindow());
  }
  pushViews(true);
  renderShow();
}

// ---------- the winners ----------
function podiumScreen() {
  H.screen = 'over';
  const ranked = [...H.teams].sort((a, b) => b.score - a.score);
  const placeOf = t => 1 + H.teams.filter(o => o.score > t.score).length;
  const winners = ranked.filter(t => placeOf(t) === 1);
  const steps = ranked.slice(0, 3);
  const order = steps.length === 3 ? [steps[1], steps[0], steps[2]] : steps.length === 2 ? [steps[1], steps[0]] : steps;
  const rest = ranked.slice(3);
  H.app.innerHTML = `
  <div class="screen host final">
    <div class="rays turn"></div>
    <header><div class="mini-logo">Slap <b>Happy</b></div><div class="grow"></div></header>
    <div class="winbox">
      <div class="champ">${winners.length > 1 ? `<span>It's a tie!</span>${winners.map(w => esc(w.name)).join(' & ')}` : `<span>The winner is</span>${esc(winners[0].name)}`}</div>
      <div class="steps">${order.map(t => { const p = placeOf(t); return `<div class="step p${Math.min(p, 4)}" style="--tc:${colorOf(t.color)};--tink:${inkOn(colorOf(t.color))}"><div class="who">${esc(t.name)}</div><div class="pts">${t.score}</div><div class="block">${p}</div></div>`; }).join('')}</div>
      ${rest.length ? `<div class="rest">${rest.map(t => `<span style="--tc:${colorOf(t.color)};--tink:${inkOn(colorOf(t.color))}">${placeOf(t)}. ${esc(t.name)} · ${t.score}</span>`).join('')}</div>` : ''}
    </div>
    <div class="acts">
      <button class="btn big gold" data-act="again">Play again</button>
      <button class="btn ghost" data-act="teams">Change teams or topics</button>
      <button class="btn ghost" data-act="done">Finish</button>
    </div>
  </div>`;
  const scr = H.app.firstElementChild;
  if (H.mirror) scr.classList.add('mirror');
  bindTaps(scr, {
    again: () => startGame({ again: true }),
    teams: () => { for (const t of H.teams) t.score = 0; H.g = null; save(); lobby(); pushViews(true); },
    done: () => endShow(),
  });
  SND.play('fanfare');
  SND.applause(3, 0.4);
  rain(260, winners.map(w => colorOf(w.color)).concat(['#ffb81c', '#fff3d1', '#ff5fa2']));
  pushViews(true);
}


// =====================================================================
// Watch on another screen: a TV or iPad in another house (in-laws in
// Croatia, friends in Seattle) joins with the room letters and shows the
// same show, live, with its own sound. Everyone still buzzes on a phone.
// It plays nothing itself: the big screen sends it a copy of the show
// (snapshot()) whenever anything changes, and this side draws it with the
// same screens the big screen uses.
// =====================================================================
export async function startMirror(app, { code, back }) {
  if (H) H.stop();
  H = {
    app, mirror: true, back, room: code, key: null, link: null, net: 'connecting', netSince: now(), teams: [], topics: [],
    settings: { count: 10, slap: 20, answer: 10, topics: [], voice: false },
    g: null, loop: null, screen: null, introT: [], hostOn: true, setKey: '',
    stop() { clearInterval(this.loop); (this.introT || []).forEach(clearTimeout); if (this.link) this.link.close(); SND.stopMusic(); SND.hush(); },
  };
  window.SLAP = window.SLAP || {}; window.SLAP.host = H;
  if (!isCode(code)) { watchLetters(''); return; }
  watchURL(code); // a reload (or a sleepy TV) comes straight back to the show
  mirrorNote('Finding the show', code);
  H.topics = await loadTopics();
  const id = 'w' + rid(11);
  H.link = new Link(`/room/${code}?team=${id}`, {
    message: onMirror,
    status: st => { H.net = st; renderNet(); mirrorPill(); },
    fatal: why => {
      H.link = null;
      watchURL('');
      if (why === 'noroom') watchLetters(`No show is using ${code} right now. Check the letters on the big screen.`, code);
      else if (why === 'full') watchLetters('That show is full.', code);
      else watchLetters('Something went wrong. Try again.', code);
    },
  });
  H.failT = setTimeout(() => { if (H && H.mirror && H.link && !H.link.isOpen && !H.screen) watchLetters("Can't reach the show. Check that this screen is online.", code); }, 12000);
  H.loop = setInterval(tick, 50);
  stayAwake();
}

function watchLetters(err, code = '') {
  if (H && H.link) { H.link.close(); H.link = null; }
  const back = H && H.back;
  H.screen = null;
  H.app.innerHTML = `
  <div class="screen join scroll">
    <div class="rays"></div>
    <div class="inner">
      <h2>Watch the show</h2>
      <p class="hint">Type the four letters on the big screen</p>
      <input class="letters" maxlength="4" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" enterkeyhint="go" placeholder="ABCD" value="${esc(code)}" aria-label="Room letters">
      <p class="err">${esc(err)}</p>
      <button class="btn big gold go" data-act="go">Watch</button>
      <button class="btn ghost small back" data-act="back">Back</button>
    </div>
  </div>`;
  const inp = $('.letters', H.app);
  inp.addEventListener('input', () => { inp.value = inp.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4); });
  const go = () => {
    const c = inp.value.toUpperCase();
    if (!isCode(c)) { $('.err', H.app).textContent = c.length < 4 ? 'The room has four letters.' : `There's no show called ${c}. Room letters never have vowels.`; return; }
    startMirror(H.app, { code: c, back });
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  bindTaps(H.app.firstElementChild, { go, back: () => { leaveMirror(); } });
  setTimeout(() => { if (!code) inp.focus(); }, 60);
}

function mirrorNote(title, sub) {
  H.screen = null;
  H.app.innerHTML = `<div class="screen join"><div class="rays"></div><div class="inner"><h2>${esc(title)}</h2><p class="hint">${esc(sub || '')}</p></div></div>`;
}

function watchURL(code) {
  try {
    const u = new URL(location.href);
    u.searchParams.delete('join');
    if (code) u.searchParams.set('watch', code); else u.searchParams.delete('watch');
    history.replaceState(null, '', u);
  } catch (e) {}
}

function leaveMirror() {
  watchURL('');
  const back = H && H.back;
  if (H) H.stop();
  H = null;
  if (back) back(); else window.SLAP.title();
}

function mirrorPill() {
  if (!H || !H.mirror) return;
  let el = $('.mpill', H.app);
  const msg = H.link && !H.link.isOpen ? 'Reconnecting' : !H.hostOn ? 'The big screen dropped out. Waiting for it' : '';
  if (!msg) { if (el) el.remove(); return; }
  const scr = H.app.firstElementChild; if (!scr) return;
  if (!el) { el = document.createElement('div'); el.className = 'mpill'; scr.appendChild(el); }
  el.textContent = msg;
}

function onMirror(m) {
  if (!H || !H.mirror) return;
  if (m.t === 'hello') {
    clearTimeout(H.failT);
    H.hostOn = m.host;
    H.link.send({ t: 'watch' });
    if (!H.screen) mirrorNote(m.host ? 'Connecting to the show' : 'Waiting for the big screen', H.room);
    mirrorPill();
  } else if (m.t === 'host') {
    H.hostOn = m.on;
    if (m.on) H.link.send({ t: 'watch' });
    mirrorPill();
  } else if (m.t === 'show') {
    applyShow(m);
    mirrorPill();
  } else if (m.t === 'fx') {
    const t = byId(m.id);
    if (m.k === 'buzz' && t) { SND.buzzer(t.sound); wiggle(t); }
  } else if (m.t === 'ended') {
    watchURL('');
    const back = H.back;
    H.stop();
    H.app.innerHTML = `<div class="screen join"><div class="rays"></div><div class="inner"><h2>That's a wrap!</h2><p class="hint">Thanks for playing Slap Happy</p><button class="btn big gold go" data-act="again">Watch another show</button></div></div>`;
    bindTaps(H.app.firstElementChild, { again: () => startMirror(H.app, { code: '', back }) });
  }
}

function applyShow(s) {
  const prevScreen = H.screen, prevG = H.g;
  const prevPhase = prevG ? prevG.phase : null, prevSeq = prevG ? prevG.seq : null, prevPaused = prevG ? prevG.paused : false;
  const prevIds = new Set(H.teams.map(t => t.id));
  const shown = Object.fromEntries(H.teams.map(t => [t.id, t._shown]));
  H.room = s.room;
  Object.assign(H.settings, s.settings || {});
  H.teams = (s.teams || []).map(t => ({ ...t, _shown: shown[t.id] }));
  const fresh = H.teams.filter(t => !prevIds.has(t.id));

  if (s.screen === 'lobby' || !s.g) {
    H.g = null;
    const setKey = JSON.stringify(H.settings);
    if (prevScreen !== 'lobby' || setKey !== H.setKey) { H.setKey = setKey; lobby(); }
    else renderTeams();
    if (prevScreen === 'lobby') for (const t of fresh) { SND.play('join'); wiggle(t); }
    return;
  }

  const sg = s.g, q = sg.q;
  const g = prevG && prevScreen !== 'lobby' ? prevG : { qs: [], slaps: [] };
  Object.assign(g, {
    i: sg.i, seq: sg.seq, phase: sg.phase, dur: sg.dur, paused: sg.paused, buzz: sg.buzz, result: sg.result,
    revealed: sg.revealed, over: sg.over, onEnd: null, left: sg.left,
    end: sg.left ? now() + sg.left : 0, slaps: (sg.slapped || []).map(id => ({ id })),
  });
  if (q) g.qs = new Array(Math.max(1, sg.total)).fill(q);
  else if (!g.qs.length) g.qs = new Array(Math.max(1, sg.total)).fill({ q: '', fact: '', answerText: '' });
  H.g = g;

  if (s.screen === 'over') { if (prevScreen !== 'over') { (H.introT || []).forEach(clearTimeout); SND.stopMusic(); podiumScreen(); } return; }

  if (H.screen !== 'show') { buildShow(); if (q) renderQuestion(q); }
  else if (sg.seq !== prevSeq && q) renderQuestion(q);
  if (sg.phase !== prevPhase || sg.seq !== prevSeq || (prevPaused && !sg.paused)) mirrorPhase(g, q, prevPaused && !sg.paused);
  mirrorPaused(sg.paused);
  renderShow();
}

// the big screen's sounds and moments, replayed here as the show moves on
function mirrorPhase(g, q, resumed) {
  const scr = H.app.firstElementChild;
  (H.introT || []).forEach(clearTimeout); H.introT = [];
  if (g.phase !== 'up') $$('.buzzname, .burst', H.app).forEach(el => el.remove());
  if (g.paused) { SND.stopMusic(); return; }
  switch (g.phase) {
    case 'intro': {
      SND.stopMusic();
      const step = 1000 * SPEED, el = Math.max(0, (g.dur || 0) - (g.left || 0));
      const n = Math.min(3, Math.floor(el / step));
      splash(n < 3 ? [[String(3 - n), '']] : [['Go!', 'pink']]);
      for (let k = n + 1; k <= 3; k++) H.introT.push(setTimeout(() => { if (!H || !H.g || H.g.phase !== 'intro') return; if (k < 3) { splash([[String(3 - k), '']]); SND.play('beep'); } else { splash([['Go!', 'pink']]); SND.play('go'); } }, k * step - el));
      break;
    }
    case 'splash':
      SND.stopMusic();
      if (q && q.bonus) { SND.play('bonus'); splash([['Bonus round!', 'pink'], ['Double points', 'small']]); }
      else { SND.play('whoosh'); splash([[`Question ${g.i + 1}`, ''], [`of ${g.qs.length}`, 'small']]); }
      break;
    case 'ready': splash(null); break;
    case 'armed': splash(null); if (!resumed) SND.play('ding'); SND.music('think'); break;
    case 'up': {
      splash(null); SND.stopMusic();
      const t = byId(g.buzz);
      if (t && !resumed) { SND.buzzer(t.sound); teamStyle(scr, t.color); burst(t); }
      break;
    }
    case 'revealing': SND.drumroll(0.85 * SPEED); break;
    case 'judge': if (!resumed) SND.play('tada'); break;
    case 'result': {
      const t = byId(g.buzz);
      if (g.result && g.result.ok) {
        SND.play('correct'); SND.applause(2);
        const p = t && $(`.podium[data-id="${t.id}"]`, H.app);
        if (p) { const r = p.getBoundingClientRect(); confetti({ x: r.left + r.width / 2, y: r.top, n: 110, colors: [colorOf(t.color), '#ffb81c', '#fff3d1'] }); }
      } else SND.play('wrong');
      break;
    }
    case 'timeout': splash(null); SND.stopMusic(); SND.play('timeup'); break;
    case 'answer': if (!resumed) SND.play('tada'); break;
    case 'final': SND.stopMusic(); splash([['And the winner is...', '']]); SND.drumroll(2.3 * SPEED); break;
  }
}

function mirrorPaused(on) {
  const scr = H.app.firstElementChild; if (!scr) return;
  let ov = $('.mpause', scr);
  if (on && !ov) {
    ov = document.createElement('div');
    ov.className = 'overlay mpause';
    ov.innerHTML = `<div class="card marquee"><h2>Paused</h2><p class="note">The host paused the show</p></div>`;
    scr.appendChild(ov);
    SND.stopMusic(); SND.hush();
  } else if (!on && ov) ov.remove();
}
