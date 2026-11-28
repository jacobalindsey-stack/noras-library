// Slap Happy on the big screen: the lobby with the room letters and QR code,
// the questions, the timer, the scoreboard, and every rule of the game.
// Phones only send slaps and picks (A, B, C or D); this file decides.

import { $, $$, esc, COLORS, colorOf, inkOn, teamStyle, randomName, SPEED, stayAwake, confetti, rain, bindTaps, isTouch } from './common.js';
import { Link, newCode, rid, isCode } from './net.js';
import * as SND from './sound.js';
import { haptic } from './haptics.js';
import { loadTopics, pickQuestions, markSeen } from './topics.js';
import { setupForm, wireSetup } from './team.js';
import { t, tn, lang, setLang, onLang, langSwitch, loc, qx, LANGS } from './i18n.js';

const T = t; // for the places where `t` is a team

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
    settings: { count: 10, slap: 20, answer: 10, topics: null, voice: true },
    g: null, loop: null, screen: null, screens: new Set(), pingT: null, offLang: onLang(() => relang()),
    stop() { clearInterval(this.loop); clearInterval(this.pingT); if (this.link) this.link.close(); SND.stopMusic(); SND.hush(); this.offLang(); },
  };
  window.SLAP = window.SLAP || {}; window.SLAP.host = H;
  const s = !fresh && savedShow();
  if (s) {
    H.room = s.room; H.key = s.key;
    Object.assign(H.settings, s.settings || {});
    if (!H.settings.voiceSet) H.settings.voice = true;
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
    else { if (t) t.online = false; H.screens.delete(m.id); if (H.g && H.g.readers && H.g.readers.delete(m.id)) readDone(); }
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
  // a watch screen finished reading the question aloud (in its own language)
  if (msg.t === 'read') { const g = H.g; if (g && g.readers && msg.r === g.seq && g.readers.delete(id)) readDone(); return; }
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
    if (g.phase === 'armed' && msg.r === g.seq && (msg.a || 1) === g.att && !g.paused) registerSlap(t, +msg.rt);
  } else if (msg.t === 'pick') {
    const g = H.g;
    if (g && g.phase === 'up' && !g.paused && g.buzz === id && msg.r === g.seq && (msg.a || 1) === g.att) choose(msg.i);
  }
}

// ---------- what each phone should show ----------
function rankOf(t) { return 1 + H.teams.filter(o => o.score > t.score).length; }
const LTR = 'ABCD';
// a team can still answer this question if it hasn't missed it already
function canPlay(t) { const g = H.g; return !!g && !g.out.includes(t.id) && (t.local || t.online); }
function viewFor(t) {
  const g = H.g, q = g && g.qs[g.i];
  const v = { t: 'view', name: t.name, color: t.color, sound: t.sound, score: t.score, rank: rankOf(t), round: g ? Math.min(g.i + 1, g.qs.length) : 0, total: g ? g.qs.length : 0, bonus: !!(q && q.bonus), seq: g ? g.seq : 0, att: g ? g.att : 0 };
  if (!g) return { ...v, v: 'lobby' };
  if (g.paused) return { ...v, v: 'paused' };
  const left = () => Math.max(0, Math.round(g.end - now()));
  const buzzT = g.buzz && byId(g.buzz);
  const by = buzzT ? { name: buzzT.name, color: buzzT.color } : null;
  // answers go to phones in every language; each phone shows its own
  const answer = q ? inAll(q, x => `${LTR[q.answer]}: ${x.answerText}`) : '';
  const said = g.pick && q ? inAll(q, x => `${LTR[g.pick.i]}: ${x.choices[g.pick.i]}`) : '';
  const tr = q ? Object.fromEntries(Object.entries(q.tr || {}).map(([id, x]) => [id, { q: x.q, choices: x.choices }])) : null;
  const mine = t.id === g.buzz, out = g.out.includes(t.id);
  switch (g.phase) {
    case 'intro': return { ...v, v: 'intro' };
    case 'splash': return { ...v, v: 'next' };
    case 'ready': return { ...v, v: 'get', voice: !!H.settings.voice };
    case 'steal': return out ? { ...v, v: 'sit' } : { ...v, v: 'get', steal: true };
    case 'armed': return out ? { ...v, v: 'sit' } : { ...v, v: 'slap', ms: left(), steal: g.att > 1 };
    case 'up': return mine ? { ...v, v: 'pick', ms: left(), q: q.q, choices: q.choices, tr, gone: g.gone } : { ...v, v: 'out', by, choosing: true };
    case 'checking': return mine ? { ...v, v: 'pick', locked: g.pick.i, q: q.q, choices: q.choices, tr, gone: g.gone.filter(i => i !== g.pick.i) } : { ...v, v: 'out', by, said };
    case 'miss': {
      const more = q.choices.length - g.gone.length > 1 && H.teams.some(canPlay); // a steal is coming
      return mine ? { ...v, v: 'miss', said, late: !g.pick, more } : { ...v, v: 'out', by, said, missed: true, next: more && canPlay(t) };
    }
    case 'result': return { ...v, v: 'res', mine, ok: true, pts: g.result.pts, stolen: g.result.stolen, by, answer };
    case 'timeout': return { ...v, v: 'timeup' };
    case 'answer': return { ...v, v: 'timeup', answer, tried: g.att > 1 || g.out.length > 0 };
    case 'final': return { ...v, v: 'final' };
    case 'over': {
      const top = [...H.teams].sort((a, b) => b.score - a.score)[0];
      return { ...v, v: 'over', place: rankOf(t), tie: H.teams.filter(o => o.score === t.score).length > 1, winner: top ? { name: top.name, color: top.color } : null };
    }
  }
  return { ...v, v: 'lobby' };
}
// { en: ..., hr: ... } built from a question in each of its languages
function inAll(q, f) {
  const o = { en: f(q) };
  for (const [id, x] of Object.entries(q.tr || {})) o[id] = f({ ...q, ...x });
  return o;
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
    settings: { count: H.settings.count, slap: H.settings.slap, answer: H.settings.answer, topics: H.settings.topics, voice: !!H.settings.voice },
    teams: H.teams.map(({ id, name, color, sound, score, local, online }) => ({ id, name, color, sound, score, local, online })),
    g: g ? {
      i: g.i, total: g.qs.length, seq: g.seq, att: g.att, phase: g.phase, dur: g.dur || 0, paused: !!g.paused, buzz: g.buzz, result: g.result,
      revealed: !!g.revealed, over: !!g.over, slapped: g.slaps.map(x => x.id), out: g.out, gone: g.gone, pick: g.pick,
      left: g.paused ? Math.round(g.left || 0) : (g.end ? Math.max(0, Math.round(g.end - now())) : 0),
      q: q ? { id: q.id, q: q.q, choices: q.choices, answer: q.answer, answerText: q.answerText, fact: q.fact, bonus: q.bonus, tr: q.tr || {} } : null,
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
        ${langSwitch()}
        <button class="iconbtn${SND.prefs.music ? '' : ' off'}" data-act="music" aria-label="${t('music_onoff')}">${ICON.music(SND.prefs.music)}</button>
        <button class="iconbtn${SND.prefs.sound ? '' : ' off'}" data-act="sound" aria-label="${t('sound_onoff')}">${ICON.sound(SND.prefs.sound)}</button>
        <button class="iconbtn" data-act="exit" aria-label="${t('leave_show')}">${ICON.exit}</button>
      </div>
    </header>
    <div class="lobby-main">
      <section class="join-card marquee chase">
        <div class="how">${t('join_phone')}</div>
        <div class="qr">${qrSVG(joinURL())}</div>
        <div class="codebox">
          <div class="url">${esc(shortURL())}</div>
          <div class="code-label">${t('room_letters')}</div>
          <div class="code${H.net === 'open' ? '' : ' pending'}">${H.room}</div>
          <div class="netwarn"></div>
          ${H.mirror ? '' : `<div class="farnote">${t('farnote')}</div>`}
        </div>
      </section>
      <section class="teams-card">
        <div class="teams-head"><h2>${t('teams')}</h2><div class="grow"></div><button class="btn ghost small" data-act="addlocal">${t('add_local')}</button></div>
        <div class="podiums lobby-podiums scroll"></div>
      </section>
    </div>
    <footer class="lobby-foot">
      <div class="optgroup"><div class="lbl">${t('topics')}</div><div class="topics">${H.topics.map(tp => `<button class="topic${S.topics.includes(tp.id) ? ' on' : ''}" data-act="topic" data-arg="${tp.id}"><span class="e">${esc(tp.emoji)}</span>${esc(qx(tp).title)} <small>${tp.questions.length}</small></button>`).join('') || `<span class="netwarn">${t('no_topics')}</span>`}</div></div>
      <div class="optgroup"><div class="lbl">${t('questions')}</div><div class="pills">${[10, 15, 20].map(n => `<button class="pill${S.count === n ? ' on' : ''}" data-act="count" data-arg="${n}" ${n > pool ? 'disabled style="opacity:.3"' : ''}>${n}</button>`).join('')}</div></div>
      <div class="optgroup"><div class="lbl">${t('time_slap')}</div><div class="pills">${[10, 20, 30].map(n => `<button class="pill${S.slap === n ? ' on' : ''}" data-act="slaptime" data-arg="${n}">${n}s</button>`).join('')}</div></div>
      <div class="optgroup"><div class="lbl">${t('read_aloud')}</div><div class="pills"><button class="pill${S.voice ? '' : ' on'}" data-act="voice" data-arg="0">${t('off')}</button><button class="pill${S.voice ? ' on' : ''}" data-act="voice" data-arg="1">${t('on')}</button></div></div>
      <div class="grow"></div>
      <button class="btn big gold start" data-act="start">${t('start')}</button>
    </footer>
    ${H.mirror ? `<div class="mirror-wait">${t('waiting_host')}</div>` : ''}
  </div>`;
  const scr = H.app.firstElementChild;
  if (H.mirror) scr.classList.add('mirror');
  bindTaps(scr, {
    music: (a, b) => { SND.setMusic(!SND.prefs.music); b.innerHTML = ICON.music(SND.prefs.music); b.classList.toggle('off', !SND.prefs.music); if (SND.prefs.music) SND.music('lobby'); },
    sound: (a, b) => { SND.setSound(!SND.prefs.sound); b.innerHTML = ICON.sound(SND.prefs.sound); b.classList.toggle('off', !SND.prefs.sound); },
    lang: id => { SND.play('pop'); setLang(id); },
    exit: () => H.mirror ? leaveMirror() : confirmBox(t('leave_q'), t('leave_note'), t('leave'), () => { endShow(); }),
    addlocal: () => addLocal(),
    remove: id => { const t = byId(id); if (!t) return; if (!t.local) H.link.send({ kick: id }); H.teams = H.teams.filter(x => x !== t); SND.play('pop'); save(); renderTeams(); broadcastInfo(); },
    topic: id => { const on = S.topics.includes(id); if (on && S.topics.length === 1) return; S.topics = on ? S.topics.filter(x => x !== id) : [...S.topics, id]; SND.play('pop'); save(); lobby(); },
    count: n => { S.count = +n; SND.play('pop'); save(); lobby(); },
    slaptime: n => { S.slap = +n; SND.play('pop'); save(); lobby(); },
    voice: n => { S.voice = n === '1'; S.voiceSet = true; SND.play('pop'); save(); lobby(); if (S.voice) SND.primeSpeech(t('say_welcome'), lang()); },
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
  warn.textContent = bad ? t('net_warn') : '';
}

function podiumHTML(t, { lobbyMode } = {}) {
  const b = SND.BUZZERS.find(x => x.id === t.sound);
  return `<div class="podium${t.local ? ' local' : ''}${!t.local && !t.online ? ' offline' : ''}" data-id="${t.id}" style="--tc:${colorOf(t.color)};--tink:${inkOn(colorOf(t.color))}">
    <div class="p-light"></div>
    ${lobbyMode ? `<button class="p-x" data-act="remove" data-arg="${t.id}" aria-label="${T('remove', { name: esc(t.name) })}">×</button><span class="p-sound">${b ? b.e : ''}</span>` : ''}
    <span class="p-off">${T('phone_asleep')}</span>
    <div class="p-name">${esc(t.name)}</div>
    <div class="p-score">${t.score}</div>
    <div class="p-act"></div>
  </div>`;
}

function renderTeams() {
  if (H.screen === 'lobby') {
    const box = $('.lobby-podiums', H.app); if (!box) return;
    box.innerHTML = H.teams.length ? H.teams.map(t => podiumHTML(t, { lobbyMode: true })).join('') : `<div class="empty-teams">${T('empty_teams')}</div>`;
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
  });
  // a team on this screen answers by tapping a choice on the board
  scr.addEventListener('pointerup', e => {
    const c = e.target.closest('.choice.tappable'); if (H.mirror || !c) return;
    const g = H.g;
    if (g && g.phase === 'up' && !g.paused) { const t = byId(g.buzz); if (t && t.local) choose(+c.dataset.i); }
  });
}
function padSlap(t) {
  if (H.mirror) return;
  const g = H.g;
  if (!g) { SND.buzzer(t.sound); wiggle(t); sendFx({ k: 'buzz', id: t.id }); return; }
  if (g.phase === 'armed' && !g.paused && canPlay(t) && !g.slaps.some(s => s.id === t.id)) { SND.buzzer(t.sound); haptic('slap'); registerSlap(t, now() - g.armedAt); renderPad(t, viewFor(t)); }
  else if (g.phase === 'ready' || g.phase === 'splash' || g.phase === 'steal') { SND.play('early'); }
}
function renderPad(t, v) {
  const p = $(`.podium[data-id="${t.id}"] .p-act`, H.app); if (!p) return;
  const g = H.g;
  let h = '';
  switch (v.v) {
    case 'lobby': h = `<button class="p-tap" data-pad="test">${T('test')}</button>`; break;
    case 'next': case 'get': case 'intro': h = `<button class="p-tap calm" data-pad="slap">${v.steal ? T('steal_coming') : T('wait_for_it')}</button>`; break;
    case 'slap': h = g && g.slaps.some(s => s.id === t.id) ? `<button class="p-tap calm" disabled>${T('slapped')}</button>` : `<button class="p-tap live" data-pad="slap">${T('slap')}</button>`; break;
    case 'pick': h = v.locked === undefined ? `<span class="p-hint">${T('tap_answer')}</span>` : `<span class="p-hint">${LTR[v.locked]}!</span>`; break;
    case 'sit': h = `<span class="p-hint">${T('sitting_out')}</span>`; break;
    default: h = '';
  }
  if (p.innerHTML !== h) p.innerHTML = h;
}

function addLocal() {
  if (H.teams.length >= MAX_TEAMS) return;
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `<div class="card marquee"><div class="join">${setupForm({ title: T('team_here'), takenColors: H.teams.map(t => t.color), takenNames: H.teams.map(t => t.name), takenSounds: H.teams.map(t => t.sound), button: T('add_team') })}<button class="btn ghost small back" data-act="cancel">${T('cancel')}</button></div></div>`;
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
  ov.innerHTML = `<div class="card marquee"><h2>${esc(title)}</h2><p class="note">${esc(note)}</p><div class="row"><button class="btn ghost" data-act="no">${t('stay')}</button><button class="btn tang" data-act="yes">${esc(yes)}</button></div></div>`;
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
  ov.innerHTML = `<div class="card marquee"><h2>${t('resume_q')}</h2><p class="note">${t('resume_note', { i: Math.min(sg.i + 1, sg.qs.length), n: sg.qs.length })}</p><div class="row"><button class="btn ghost" data-act="no">${t('back_lobby')}</button><button class="btn gold" data-act="yes">${t('keep_playing')}</button></div></div>`;
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
  if (H.settings.voice) SND.primeSpeech(t('say_lets_play'), lang());
  stayAwake();
  let qs, i = -1, seq = 0;
  if (resume) {
    // shows saved before every question had choices: drop the ones without
    const ok = q => Array.isArray(q.choices) && q.choices.length >= 2 && Number.isInteger(q.answer);
    qs = resume.qs.filter(ok);
    i = Math.max(-1, resume.i - resume.qs.slice(0, resume.i).filter(q => !ok(q)).length - 1);
    seq = resume.seq || 0;
    if (!qs.length) return;
  }
  else {
    qs = pickQuestions(H.topics, H.settings.topics, H.settings.count);
    if (!qs.length) return;
    if (!resume) for (const t of H.teams) t.score = 0;
  }
  H.g = { qs, i, seq: seq + 1, att: 1, phase: 'intro', end: 0, onEnd: null, paused: false, left: 0, buzz: null, slaps: [], out: [], gone: [], pick: null, decideT: null, result: null, armedAt: 0, lastTick: -1, over: false };
  buildShow();
  setPhase('intro', ms(3.4), nextQuestion);
  splash([['3', '']]);
  SND.stopMusic();
  [0, 1, 2].forEach(k => setTimeout(() => { if (!H || !H.g || H.g.phase !== 'intro') return; splash([[String(3 - k), '']]); SND.play('beep'); }, ms(k * 1)));
  setTimeout(() => { if (!H || !H.g || H.g.phase !== 'intro') return; splash([[t('go'), 'pink']]); SND.play('go'); }, ms(3));
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
  g.seq++; g.att = 1; g.buzz = null; g.slaps = []; g.out = []; g.gone = []; g.pick = null; g.result = null; g.revealed = false;
  clearTimeout(g.decideT); g.decideT = null;
  const q = g.qs[g.i];
  markSeen([q.id]);
  renderQuestion(q);
  SND.stopMusic();
  if (q.bonus) { SND.play('bonus'); splash([[t('bonus'), 'pink'], [t('double_pts'), 'small']]); }
  else { SND.play('whoosh'); splash([[t('question_n', { n: g.i + 1 }), ''], [t('of_n', { n: g.qs.length }), 'small']]); }
  save();
  if (q.bonus && H.settings.voice) SND.speak(t('bonus'), null, lang());
  setPhase('splash', ms(q.bonus ? 2.2 : 1.2), () => { splash(null); readQuestion(q); });
}

// The buzzers stay locked while the question is read. With the voice on they
// unlock a beat after it finishes (never sooner than 2.5 s, and if the voice
// stalls, after a generous guess). With it off, after time to read it.
// Watch screens far away read it too, in their own language (Croatian takes
// a little longer), and the buzzers wait for them as well.
const longest = q => Math.max(q.q.length, ...Object.values(q.tr || {}).map(x => x.q.length));
function readTime(q) {
  const all = [q, ...Object.values(q.tr || {})];
  const len = Math.max(...all.map(x => x.q.length + (x.choices ? x.choices.join('').length * 0.6 : 0)));
  return Math.min(6000, Math.max(2500, 1200 + 32 * len));
}
function readQuestion(q) {
  const g = H.g, seq = g.seq, started = now();
  g.readers = new Set(); g.hostAt = null;
  if (!H.settings.voice) { setPhase('ready', readTime(q) * SPEED, arm); return; }
  const mine = qx(q).q;
  const guess = 900 + 70 * mine.length;                     // how long this voice should take
  const fallback = Math.min(14000, Math.max(4000, (900 + 70 * longest(q)) * 1.5 + 1500));
  g.readers = new Set(H.screens);
  setPhase('ready', fallback * SPEED, arm);
  SND.speak(mine, ok => {
    if (!H || H.g !== g || g.seq !== seq || g.phase !== 'ready') return;
    const took = now() - started;
    // a voice that "finished" far too fast didn't really speak: give reading time instead
    g.hostAt = ok && took > guess * 0.4 ? Math.max(started + 2500 * SPEED, now() + 350 * SPEED) : started + readTime(q) * SPEED;
    readDone();
  }, lang());
}
// unlock once this screen and every watch screen have finished reading
function readDone() {
  const g = H.g;
  if (!g || g.phase !== 'ready' || g.paused || g.hostAt == null || (g.readers && g.readers.size)) return;
  g.end = Math.min(g.end, Math.max(g.hostAt, now() + 350 * SPEED));
}

function arm() {
  const g = H.g;
  g.armedAt = now();
  SND.hush();
  const secs = g.att > 1 ? Math.min(H.settings.slap, 10) : H.settings.slap; // steals are quicker
  setPhase('armed', ms(secs), () => { if (g.slaps.length) decide(); else timeUp(); });
  SND.play('ding');
  SND.music('think');
  goFlash();
}
function goFlash() {
  const scr = H.app.firstElementChild; if (!scr) return;
  const f = document.createElement('div');
  f.className = 'goflash';
  scr.appendChild(f);
  setTimeout(() => f.remove(), 900);
}

// Slaps are judged by reaction time (from when each buzzer lit up to the
// slap), not by arrival, so a phone on slower Wi-Fi isn't cheated. The big
// screen waits a quarter second after the first slap to hear from the rest.
function registerSlap(t, rt) {
  const g = H.g;
  if (g.phase !== 'armed' || !canPlay(t) || g.slaps.some(s => s.id === t.id)) return;
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
  g.buzz = t.id; g.pick = null;
  SND.stopMusic(); SND.hush();
  SND.buzzer(t.sound);
  const scr = H.app.firstElementChild;
  teamStyle(scr, t.color);
  burst(t);
  setPhase('up', ms(H.settings.answer), () => missed());
}

// The team that slapped picks A, B, C or D on its phone (or on the board, for
// a team on this screen). A short drumroll, then right or wrong.
function choose(i) {
  const g = H.g, q = g && g.qs[g.i];
  if (!g || g.phase !== 'up' || !q || !Number.isInteger(i) || i < 0 || i >= q.choices.length || g.gone.includes(i)) return;
  g.pick = { id: g.buzz, i };
  SND.stopMusic();
  SND.drumroll(0.6 * SPEED);
  setPhase('checking', ms(0.75), () => i === q.answer ? right() : missed());
}

function right() {
  const g = H.g, t = byId(g.buzz), q = g.qs[g.i];
  const pts = q.bonus ? 200 : 100;
  if (t) t.score += pts;
  g.result = { ok: true, pts, stolen: g.att > 1 };
  g.revealed = true;
  SND.play('correct'); SND.applause(1.6);
  const p = t && $(`.podium[data-id="${t.id}"]`, H.app);
  if (p) { const r = p.getBoundingClientRect(); confetti({ x: r.left + r.width / 2, y: r.top, n: 110, colors: [colorOf(t.color), '#ffb81c', '#fff3d1'] }); }
  save();
  setPhase('result', ms(4.5), nextQuestion);
}

// A wrong pick (or no pick before the clock ran out): that choice is crossed
// out, the team sits out the rest of this question, and the others can steal.
function missed() {
  const g = H.g;
  if (g.pick) g.gone.push(g.pick.i);
  if (g.buzz && !g.out.includes(g.buzz)) g.out.push(g.buzz);
  SND.play('wrong');
  setPhase('miss', ms(1.3), afterMiss);
}
function afterMiss() {
  const g = H.g, q = g.qs[g.i];
  const left = q.choices.length - g.gone.length;
  if (left > 1 && H.teams.some(canPlay)) steal();
  else { g.result = { ok: false, why: 'missed' }; showAnswer(); }
}
function steal() {
  const g = H.g;
  g.att++; g.buzz = null; g.pick = null; g.slaps = [];
  clearTimeout(g.decideT); g.decideT = null;
  SND.play('whoosh');
  splash([[t('steal_it'), 'pink'], [t('slap_when'), 'small']]);
  setPhase('steal', ms(1.4), () => { splash(null); arm(); });
}
function showAnswer() {
  const g = H.g;
  g.revealed = true;
  SND.play('tada');
  setPhase('answer', ms(4.5), nextQuestion);
}

function timeUp() {
  const g = H.g;
  SND.stopMusic(); SND.hush();
  SND.play('timeup');
  g.result = { ok: false, why: g.att > 1 ? 'nosteal' : 'noslap' };
  setPhase('timeout', ms(1), showAnswer);
}

function final() {
  const g = H.g;
  SND.stopMusic();
  splash([[t('winner_is'), '']]);
  SND.drumroll(2.3 * SPEED);
  setPhase('final', ms(2.6), () => { splash(null); g.over = true; save(); setPhase('over', 0, null); podiumScreen(); });
}

function skip() {
  const g = H.g; if (!g) return;
  clearTimeout(g.decideT); g.decideT = null;
  SND.hush(); SND.stopMusic();
  if (['splash', 'ready', 'armed', 'up', 'checking', 'miss', 'steal', 'timeout'].includes(g.phase)) { g.result = { ok: false, why: 'skip' }; splash(null); g.revealed = true; setPhase('answer', ms(4.5), nextQuestion); }
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
  const k = 'abcd'.indexOf(String(e.key).toLowerCase());
  if (k >= 0 && g && g.phase === 'up' && !g.paused) { const t = byId(g.buzz); if (t && t.local) choose(k); }
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= 8) { const locals = H.teams.filter(t => t.local); if (locals[n - 1]) padSlap(locals[n - 1]); }
}

// ---------- the show screen ----------
const CIRC = 2 * Math.PI * 45;
function buildShow() {
  H.screen = 'show';
  const topicIds = H.settings.topics;
  const tp = H.topics.filter(t => topicIds.includes(t.id));
  const chip = tp.length === 1 ? `${esc(tp[0].emoji)} ${esc(qx(tp[0]).title)}` : tp.length <= 4 ? `${tp.map(x => esc(x.emoji)).join(' ')} ${t('mixed')}` : t('mixed_n', { n: tp.length });
  H.app.innerHTML = `
  <div class="screen host show">
    <div class="rays"></div>
    <header class="show-head">
      <div class="mini-logo">Slap <b>Happy</b></div>
      <div class="round"></div>
      <div class="topic-chip">${chip}</div>
      <div class="grow"></div>
      <div class="roomcode">${t('join_at')} ${esc(shortURL())} · <b>${H.room}</b></div>
      ${langSwitch('small')}
      <button class="iconbtn" data-act="pause" aria-label="${t('pause')}">${ICON.pause}</button>
    </header>
    <main class="stage">
      <div class="qrow">
        <div class="board marquee"><div class="bonus-tag">${t('bonus_tag')}</div><div class="qtext"></div></div>
        <div class="timer idle"><svg viewBox="0 0 100 100"><circle class="track" cx="50" cy="50" r="45"/><circle class="arc" cx="50" cy="50" r="45" stroke-dasharray="${CIRC}" stroke-dashoffset="0"/></svg><span class="tnum"></span><span class="tlbl"></span></div>
      </div>
      <div class="choices"></div>
      <div class="fact"></div>
      <div class="statusline"></div>
    </main>
    <footer class="show-foot"><div class="podiums"></div></footer>
    <div class="splash"></div>
  </div>`;
  const scr = H.app.firstElementChild;
  if (H.mirror) scr.classList.add('mirror');
  bindTaps(scr, {
    lang: id => setLang(id),
    pause: () => pause(),
    next: () => { const g = H.g; if (g && (g.phase === 'result' || g.phase === 'answer')) nextQuestion(); },
  });
  wirePads(scr);
  renderTeams();
}

function renderQuestion(q0) {
  const scr = H.app.firstElementChild;
  const q = qx(q0);                       // in this screen's language
  scr.classList.toggle('bonus', !!q.bonus);
  const qt = $('.qtext', scr);
  qt.textContent = q.q;
  qt.lang = q0.tr && q0.tr[lang()] ? lang() : 'en';
  const L = q.q.length;
  qt.style.setProperty('--qs', L < 50 ? 4.8 : L < 80 ? 4.3 : L < 120 ? 3.8 : 3.3);
  const ch = $('.choices', scr);
  const choices = q.choices || [];
  const longest = Math.max(0, ...choices.map(c => c.length));
  ch.classList.toggle('two', choices.length === 2);
  ch.innerHTML = choices.map((c, i) => `<div class="choice" data-i="${i}" style="font-size:calc(${longest < 16 ? 3.3 : longest < 26 ? 2.9 : 2.5} * var(--u))"><span class="ltr">${LTR[i]}</span><span class="ctext">${esc(c)}</span></div>`).join('');
  $('.fact', scr).classList.remove('show');
  fitStage();
}

function renderShow() {
  const g = H.g, scr = H.app.firstElementChild;
  if (!g || H.screen !== 'show' || !scr) return;
  const q = g.qs[Math.min(g.i, g.qs.length - 1)] || g.qs[0];
  $('.round', scr).innerHTML = g.i >= 0 && g.i < g.qs.length ? t('round', { n: g.i + 1, total: g.qs.length }) : '';
  const buzzT = g.buzz && byId(g.buzz);
  const showAns = g.revealed && ['result', 'answer'].includes(g.phase);
  scr.classList.toggle('buzzed', ['up', 'checking', 'miss', 'result'].includes(g.phase) && !!buzzT);
  if (buzzT) teamStyle(scr, buzzT.color);
  // choices: crossed out after a wrong pick, lit while a pick is checked, green when right
  const gone = g.gone || [], pick = g.pick;
  const localUp = g.phase === 'up' && buzzT && buzzT.local && !H.mirror && !g.paused;
  $$('.choice', scr).forEach((c, i) => {
    c.classList.toggle('right', showAns && i === q.answer);
    c.classList.toggle('wrongout', showAns && i !== q.answer && !gone.includes(i));
    c.classList.toggle('gone', gone.includes(i));
    c.classList.toggle('picked', !!pick && pick.i === i && ['checking', 'miss'].includes(g.phase));
    c.classList.toggle('nope', !!pick && pick.i === i && g.phase === 'miss');
    c.classList.toggle('tappable', !!localUp && !gone.includes(i));
  });
  const fact = $('.fact', scr);
  const qq = qx(q);
  if (showAns && qq.fact) { fact.innerHTML = `<b>${t('did_you_know')}</b> ${esc(qq.fact)}`; fact.classList.add('show'); } else fact.classList.remove('show');
  // timer
  const tm = $('.timer', scr);
  tm.classList.toggle('idle', !(g.phase === 'armed' || g.phase === 'up'));
  $('.tlbl', tm).textContent = g.phase === 'up' ? t('to_pick') : g.phase === 'armed' || g.phase === 'ready' ? t('to_slap') : '';
  if (g.phase === 'ready') { $('.tnum', tm).textContent = H.settings.slap; $('.arc', tm).style.strokeDashoffset = '0'; }
  if (g.phase === 'up') { $('.arc', tm).style.strokeDashoffset = '0'; }
  if (['timeout', 'answer', 'checking', 'miss', 'steal'].includes(g.phase)) $('.tnum', tm).textContent = '';
  // the line under the question
  const sl = $('.statusline', scr);
  const name = buzzT ? esc(buzzT.name) : '';
  const L = pick ? LTR[pick.i] : '';
  const why = g.result && g.result.why;
  let h = '';
  switch (g.phase) {
    case 'ready': h = `<div class="signal wait"><i></i>${H.settings.voice ? t('listen') : t('read_it')}</div>`; break;
    case 'steal': h = `<div class="signal wait"><i></i>${t('steal_soon')}</div>`; break;
    case 'armed': h = `<div class="signal go"><i></i>${g.att > 1 ? t('slap_steal') : t('slap_now')}</div>`; break;
    case 'up': h = `<div class="call">${t(localUp ? 'pick_board' : 'pick_phone', { name })}</div>`; break;
    case 'checking': h = `<div class="call">${t('says', { name, L })}</div>`; break;
    case 'miss': h = `<div class="call">${pick ? t('not_L', { L }) : t('late_name', { name })}</div>`; break;
    case 'result': h = `<div class="call go">${g.result.stolen ? t('stolen_pre') : ''}${t('plus_for', { pts: g.result.pts, name })}</div>` + nextHTML(); break;
    case 'timeout': h = `<div class="call">${t('times_up')}</div>`; break;
    case 'answer': h = `<div class="call">${t(why === 'noslap' ? 'ans_noslap' : why === 'nosteal' ? 'ans_nosteal' : why === 'skip' ? 'ans_skip' : 'ans_nobody')}</div>` + nextHTML(); break;
  }
  sl.innerHTML = h;
  scr.classList.toggle('reveal', showAns);
  scr.classList.toggle('locked', g.phase === 'ready' || g.phase === 'splash' || g.phase === 'steal');
  scr.classList.toggle('live', g.phase === 'armed' && !g.paused);
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
const nextHTML = () => `<div class="override"><div class="nextbar"><i></i></div><button class="btn ghost small" data-act="next">${t('next_question')}</button></div>`;

function renderPodiums() {
  const g = H.g;
  const top = Math.max(0, ...H.teams.map(t => t.score));
  const leaders = H.teams.filter(t => t.score === top && top > 0);
  for (const t of H.teams) {
    const p = $(`.podium[data-id="${t.id}"]`, H.app); if (!p) continue;
    const lit = g && g.buzz === t.id && ['up', 'checking', 'miss', 'result'].includes(g.phase);
    p.classList.toggle('lit', !!lit);
    p.classList.toggle('dimmed', !!(g && g.buzz && !lit && ['up', 'checking', 'miss'].includes(g.phase)));
    p.classList.toggle('sitout', !!(g && g.out && g.out.includes(t.id) && ['miss', 'steal', 'armed', 'up', 'checking'].includes(g.phase) && !lit));
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
  pauseMenu();
}
function pauseMenu() {
  const g = H.g;
  const ov = document.createElement('div');
  ov.className = 'overlay pause-ov';
  const onoff = v => v ? t('v_on') : t('v_off');
  const draw = () => {
    ov.innerHTML = `<div class="card marquee">
      <h2>${t('paused')}</h2>
      <div class="row"><button class="btn big gold" data-act="resume">${t('keep_playing')}</button></div>
      <div class="row"><button class="btn ghost small" data-act="skip">${t('skip_q')}</button><button class="btn ghost small" data-act="end">${t('end_now')}</button></div>
      <div class="field-label" style="margin:6px 0 -6px 4px">${t('fix_scores')}</div>
      <div class="scorefix">${H.teams.map(tm => `<div class="sf" style="--tc:${colorOf(tm.color)};--tink:${inkOn(colorOf(tm.color))}"><span>${esc(tm.name)}</span><button data-act="minus" data-arg="${tm.id}" aria-label="${t('take100')}">−100</button><b>${tm.score}</b><button data-act="plus" data-arg="${tm.id}" aria-label="${t('add100')}">+100</button></div>`).join('')}</div>
      <div class="toggles">
        <button class="btn ghost small" data-act="snd">${t('sound_v', { v: onoff(SND.prefs.sound) })}</button>
        <button class="btn ghost small" data-act="mus">${t('music_v', { v: onoff(SND.prefs.music) })}</button>
        <button class="btn ghost small" data-act="voice">${t('read_v', { v: onoff(H.settings.voice) })}</button>
        ${langSwitch()}
      </div>
    </div>`;
  };
  draw();
  H.app.firstElementChild.appendChild(ov);
  bindTaps(ov, {
    lang: id => setLang(id),
    resume: () => { ov.remove(); resume(); },
    skip: () => { ov.remove(); resume(true); skip(); },
    end: () => { ov.remove(); resume(true); g.i = g.qs.length; final(); },
    minus: id => { const t = byId(id); if (t) { t.score = Math.max(0, t.score - 100); save(); draw(); renderPodiums(); syncScreens(); } },
    plus: id => { const t = byId(id); if (t) { t.score += 100; save(); draw(); renderPodiums(); syncScreens(); } },
    snd: () => { SND.setSound(!SND.prefs.sound); draw(); },
    mus: () => { SND.setMusic(!SND.prefs.music); draw(); },
    voice: () => { H.settings.voice = !H.settings.voice; H.settings.voiceSet = true; save(); draw(); if (H.settings.voice) SND.primeSpeech('', lang()); else SND.hush(); },
  });
}
function resume(quiet) {
  const g = H.g; if (!g || !g.paused) return;
  g.paused = false;
  $$('.pause-ov', H.app).forEach(o => o.remove());
  if (g.phase === 'ready') g.left = Math.min(g.left, 1500 * SPEED); // the voice was cut off by the pause: unlock soon after
  if (g.onEnd) g.end = now() + g.left;
  if (!quiet) {
    if (g.phase === 'armed') SND.music('think');
    if (g.phase === 'armed' && g.slaps.length) g.decideT = setTimeout(decide, slapWindow());
  }
  pushViews(true);
  renderShow();
}

// ---------- the winners ----------
function podiumScreen(quiet) {
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
    <header><div class="mini-logo">Slap <b>Happy</b></div><div class="grow"></div>${langSwitch()}</header>
    <div class="winbox">
      <div class="champ">${winners.length > 1 ? `<span>${t('tie')}</span>${winners.map(w => esc(w.name)).join(' & ')}` : `<span>${t('winner_short')}</span>${esc(winners[0].name)}`}</div>
      <div class="steps">${order.map(t => { const p = placeOf(t); return `<div class="step p${Math.min(p, 4)}" style="--tc:${colorOf(t.color)};--tink:${inkOn(colorOf(t.color))}"><div class="who">${esc(t.name)}</div><div class="pts">${t.score}</div><div class="block">${p}</div></div>`; }).join('')}</div>
      ${rest.length ? `<div class="rest">${rest.map(t => `<span style="--tc:${colorOf(t.color)};--tink:${inkOn(colorOf(t.color))}">${placeOf(t)}. ${esc(t.name)} · ${t.score}</span>`).join('')}</div>` : ''}
    </div>
    <div class="acts">
      <button class="btn big gold" data-act="again">${t('play_again')}</button>
      <button class="btn ghost" data-act="teams">${t('change_setup')}</button>
      <button class="btn ghost" data-act="done">${t('finish')}</button>
    </div>
  </div>`;
  const scr = H.app.firstElementChild;
  if (H.mirror) scr.classList.add('mirror');
  bindTaps(scr, {
    lang: id => setLang(id),
    again: () => startGame({ again: true }),
    teams: () => { for (const t of H.teams) t.score = 0; H.g = null; save(); lobby(); pushViews(true); },
    done: () => endShow(),
  });
  if (quiet) return;
  SND.play('fanfare');
  SND.applause(3, 0.4);
  rain(260, winners.map(w => colorOf(w.color)).concat(['#ffb81c', '#fff3d1', '#ff5fa2']));
  pushViews(true);
}

// The language was switched on this screen: draw what's showing again, in the
// new language, without replaying sounds or confetti. (Phones and watch
// screens each keep their own language.)
function relang() {
  if (!H) return;
  if (H.mirror && H.redraw && !H.screen) { H.redraw(); return; }
  if (H.screen === 'lobby') { lobby(); return; }
  if (H.screen === 'over') { podiumScreen(true); return; }
  if (H.screen === 'show' && H.g) {
    const g = H.g, q = g.qs[Math.min(Math.max(g.i, 0), g.qs.length - 1)];
    const keepPause = !H.mirror && g.paused && $('.pause-ov', H.app);
    buildShow();
    if (q && g.i >= 0) renderQuestion(q);
    if (g.buzz) { const b = byId(g.buzz); if (b) teamStyle(H.app.firstElementChild, b.color); }
    renderShow();
    if (keepPause) pauseMenu();
    if (H.mirror) mirrorPaused(g.paused);
  }
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
    g: null, loop: null, screen: null, introT: [], hostOn: true, setKey: '', redraw: null, offLang: onLang(() => relang()),
    stop() { clearInterval(this.loop); (this.introT || []).forEach(clearTimeout); if (this.link) this.link.close(); SND.stopMusic(); SND.hush(); this.offLang(); },
  };
  window.SLAP = window.SLAP || {}; window.SLAP.host = H;
  if (!isCode(code)) { watchLetters(''); return; }
  watchURL(code); // a reload (or a sleepy TV) comes straight back to the show
  document.addEventListener('pointerup', () => SND.primeSpeech('', lang()), { once: true });
  mirrorNote('finding', code);
  H.topics = await loadTopics();
  const id = 'w' + rid(11);
  H.link = new Link(`/room/${code}?team=${id}`, {
    message: onMirror,
    status: st => { H.net = st; renderNet(); mirrorPill(); },
    fatal: why => {
      H.link = null;
      watchURL('');
      if (why === 'noroom') watchLetters(['err_noroom', { code }], code);
      else if (why === 'full') watchLetters(['show_full'], code);
      else watchLetters(['err_generic'], code);
    },
  });
  H.failT = setTimeout(() => { if (H && H.mirror && H.link && !H.link.isOpen && !H.screen) watchLetters(['err_offline_screen'], code); }, 12000);
  H.loop = setInterval(tick, 50);
  stayAwake();
}

// err is [key, vars] so it can be said again in another language
function watchLetters(err, code = '') {
  if (H && H.link) { H.link.close(); H.link = null; }
  const back = H && H.back;
  H.screen = null;
  H.redraw = () => watchLetters(err, ($('.letters', H.app) || {}).value || code);
  H.app.innerHTML = `
  <div class="screen join scroll">
    <div class="rays"></div>
    ${langSwitch('corner')}
    <div class="inner">
      <h2>${t('watch_title')}</h2>
      <p class="hint">${t('type_letters')}</p>
      <input class="letters" maxlength="4" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" enterkeyhint="go" placeholder="ABCD" value="${esc(code)}" aria-label="${t('room_letters')}">
      <p class="err">${err ? esc(t(err[0], err[1])) : ''}</p>
      <button class="btn big gold go" data-act="go">${t('watch_go')}</button>
      <button class="btn ghost small back" data-act="back">${t('back')}</button>
    </div>
  </div>`;
  const inp = $('.letters', H.app);
  inp.addEventListener('input', () => { inp.value = inp.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4); });
  const go = () => {
    const c = inp.value.toUpperCase();
    if (!isCode(c)) { err = c.length < 4 ? ['err_four'] : ['err_vowels', { code: c }]; $('.err', H.app).textContent = t(err[0], err[1]); return; }
    SND.primeSpeech('', lang());
    startMirror(H.app, { code: c, back });
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  bindTaps(H.app.firstElementChild, { go, back: () => { leaveMirror(); }, lang: id => setLang(id) });
  setTimeout(() => { if (!code) inp.focus(); }, 60);
}

function mirrorNote(key, sub) {
  H.screen = null;
  H.redraw = () => mirrorNote(key, sub);
  H.app.innerHTML = `<div class="screen join"><div class="rays"></div>${langSwitch('corner')}<div class="inner"><h2>${t(key)}</h2><p class="hint">${esc(sub || '')}</p></div></div>`;
  bindTaps(H.app.firstElementChild, { lang: id => setLang(id) });
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
  const msg = H.link && !H.link.isOpen ? t('reconnecting') : !H.hostOn ? t('big_dropped') : '';
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
    if (!H.screen) mirrorNote(m.host ? 'connecting' : 'waiting_big', H.room);
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
    const app = H.app;
    const wrap = () => {
      app.innerHTML = `<div class="screen join"><div class="rays"></div>${langSwitch('corner')}<div class="inner"><h2>${t('wrap')}</h2><p class="hint">${t('thanks')}</p><button class="btn big gold go" data-act="again">${t('watch_another')}</button></div></div>`;
      bindTaps(app.firstElementChild, { again: () => { off(); startMirror(app, { code: '', back }); }, lang: id => setLang(id) });
    };
    const off = onLang(wrap);
    wrap();
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
    i: sg.i, seq: sg.seq, att: sg.att || 1, phase: sg.phase, dur: sg.dur, paused: sg.paused, buzz: sg.buzz, result: sg.result,
    revealed: sg.revealed, over: sg.over, onEnd: null, left: sg.left, out: sg.out || [], gone: sg.gone || [], pick: sg.pick || null,
    end: sg.left ? now() + sg.left : 0, slaps: (sg.slapped || []).map(id => ({ id })),
  });
  if (q) g.qs = new Array(Math.max(1, sg.total)).fill(q);
  else if (!g.qs.length) g.qs = new Array(Math.max(1, sg.total)).fill({ q: '', fact: '', answerText: '', choices: [] });
  H.g = g;

  if (s.screen === 'over') { if (prevScreen !== 'over') { (H.introT || []).forEach(clearTimeout); SND.stopMusic(); podiumScreen(); } return; }

  if (H.screen !== 'show') { buildShow(); if (q) renderQuestion(q); }
  else if (sg.seq !== prevSeq && q) renderQuestion(q);
  const prevAtt = prevG ? prevG._att : null; g._att = g.att;
  if (sg.phase !== prevPhase || sg.seq !== prevSeq || g.att !== prevAtt || (prevPaused && !sg.paused)) mirrorPhase(g, q, prevPaused && !sg.paused);
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
      splash(n < 3 ? [[String(3 - n), '']] : [[t('go'), 'pink']]);
      for (let k = n + 1; k <= 3; k++) H.introT.push(setTimeout(() => { if (!H || !H.g || H.g.phase !== 'intro') return; if (k < 3) { splash([[String(3 - k), '']]); SND.play('beep'); } else { splash([[t('go'), 'pink']]); SND.play('go'); } }, k * step - el));
      break;
    }
    case 'splash':
      SND.stopMusic();
      if (q && q.bonus) { SND.play('bonus'); splash([[t('bonus'), 'pink'], [t('double_pts'), 'small']]); if (H.settings.voice) SND.speak(t('bonus'), null, lang()); }
      else { SND.play('whoosh'); splash([[t('question_n', { n: g.i + 1 }), ''], [t('of_n', { n: g.qs.length }), 'small']]); }
      break;
    case 'ready': splash(null); if (H.settings.voice && q && !resumed) mirrorRead(g, q); break;
    case 'armed': splash(null); SND.hush(); if (!resumed) { SND.play('ding'); goFlash(); } SND.music('think'); break;
    case 'up': {
      splash(null); SND.stopMusic();
      const t = byId(g.buzz);
      if (t && !resumed) { SND.buzzer(t.sound); teamStyle(scr, t.color); burst(t); }
      break;
    }
    case 'checking': if (!resumed) SND.drumroll(0.6 * SPEED); break;
    case 'miss': if (!resumed) SND.play('wrong'); break;
    case 'steal': SND.stopMusic(); if (!resumed) { SND.play('whoosh'); splash([[t('steal_it'), 'pink'], [t('slap_when'), 'small']]); } break;
    case 'result': {
      const t = byId(g.buzz);
      if (resumed) break;
      SND.play('correct'); SND.applause(1.6);
      const p = t && $(`.podium[data-id="${t.id}"]`, H.app);
      if (p) { const r = p.getBoundingClientRect(); confetti({ x: r.left + r.width / 2, y: r.top, n: 110, colors: [colorOf(t.color), '#ffb81c', '#fff3d1'] }); }
      break;
    }
    case 'timeout': splash(null); SND.stopMusic(); SND.play('timeup'); break;
    case 'answer': if (!resumed) SND.play('tada'); break;
    case 'final': SND.stopMusic(); splash([[t('winner_is'), '']]); SND.drumroll(2.3 * SPEED); break;
  }
}

// Read the question aloud in this screen's language, then tell the big screen,
// which keeps the buzzers locked until every screen has finished. If this
// screen can't speak (no Croatian voice, sound off), it waits reading time.
function mirrorRead(g, q) {
  const seq = g.seq, t0 = now();
  const tell = () => { if (H && H.mirror && H.link && H.g && H.g.seq === seq && H.g.phase === 'ready') H.link.send({ t: 'read', r: seq }); };
  SND.speak(qx(q).q, ok => {
    if (ok) tell();
    else setTimeout(tell, Math.max(0, readTime(q) * SPEED - (now() - t0)));
  }, lang());
}

function mirrorPaused(on) {
  const scr = H.app.firstElementChild; if (!scr) return;
  let ov = $('.mpause', scr);
  if (on && !ov) {
    ov = document.createElement('div');
    ov.className = 'overlay mpause';
    ov.innerHTML = `<div class="card marquee"><h2>${t('paused')}</h2><p class="note">${t('host_paused')}</p></div>`;
    scr.appendChild(ov);
    SND.stopMusic(); SND.hush();
  } else if (!on && ov) ov.remove();
}
