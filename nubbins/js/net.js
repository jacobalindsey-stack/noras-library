// NUBBINS — online play.
//
// Two players join a room on noralindsey.com by a four-letter code. The room
// only passes this game's messages back and forth (no chat, no names). Both
// devices then run the very same fight in step ("lockstep"): every 1/60 s
// step uses both players' buttons for that step, so each side plays its own
// buttons a few steps late, which gives the other side's buttons time to
// arrive. The fight logic uses only exact arithmetic, so an iPad and a PC
// work out the same numbers; a fingerprint of the fight is compared every
// half second and, if the two ever disagree, the room maker's copy is sent
// across and the other side snaps to it.

export const PROTO = 1;
export const ALPHA = 'BCDFGHJKLMNPQRSTVWXZ'; // no vowels: a code never spells a word
const BTN = ['l', 'r', 'u', 'd', 'p', 'k', 's', 'b', 'x'];

export function newCode() {
  const a = new Uint8Array(4); crypto.getRandomValues(a);
  return [...a].map(v => ALPHA[v % ALPHA.length]).join('');
}
export function validCode(c) { return typeof c === 'string' && c.length === 4 && [...c].every(ch => ALPHA.includes(ch)); }

// where the room server lives: the site itself, or noralindsey.com when the
// game is opened from somewhere else (a test copy, for instance)
export function serverBase() {
  const h = location.hostname;
  if (/(^|\.)noralindsey\.com$/.test(h) || h === 'localhost' || h === '127.0.0.1') return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host;
  return 'wss://noralindsey.com';
}

export const encodeInput = o => { let v = 0; for (let i = 0; i < BTN.length; i++) if (o[BTN[i]]) v |= 1 << i; return v; };
export const decodeInput = v => { const o = {}; for (let i = 0; i < BTN.length; i++) o[BTN[i]] = (v >> i) & 1; return o; };

// ------------------------------------------------------------ the link
// One connection to one room. It reconnects by itself (keeping its seat) if
// the network blips or the iPad sleeps for a moment.
export class Link {
  constructor(code, how, h = {}) {
    this.code = code; this.how = how; this.h = h;
    this.seat = -1; this.token = null; this.peer = false;
    this.state = 'connecting'; this.closedByUs = false;
    this.tries = 0; this.lostSince = 0;
    this.base = h.base || serverBase();
    this.ready = new Promise((res, rej) => { this._res = res; this._rej = rej; });
    this._open();
    // a heartbeat every 4 s; a connection that has heard nothing for 12 s is treated as dead
    this.lastRx = performance.now();
    this.ka = setInterval(() => {
      if (!this.ws || this.state !== 'open') return;
      if (performance.now() - this.lastRx > 12000) { this._kill(); return; }
      if (this.ws.readyState === 1) try { this.ws.send('ka'); } catch (e) {}
    }, 4000);
    this._vis = () => {
      if (document.hidden) return;
      if (this.state === 'retrying') { clearTimeout(this.retryT); this._open(); }
      else if (this.state === 'open' && performance.now() - this.lastRx > 6000) this._kill();
    };
    document.addEventListener('visibilitychange', this._vis);
  }

  _open() {
    const q = this.token ? `seat=${this.seat}&token=${this.token}` : `${this.how}=1`;
    // a page that isn't allowed to go online at all (the private test copy) says so plainly
    if (!this._csp) {
      this._csp = e => { if (String(e.blockedURI || '').startsWith(this.base.replace(/^ws/, 'http')) || String(e.blockedURI || '').startsWith(this.base)) this._fail('csp'); };
      document.addEventListener('securitypolicyviolation', this._csp);
    }
    let ws;
    try { ws = new WebSocket(`${this.base}/nubbins-online/room/${this.code}?${q}`); }
    catch (e) { this._dropped(); return; }
    this.ws = ws; this.lastRx = performance.now();
    ws.onmessage = ev => {
      if (this.ws === ws) this.lastRx = performance.now();
      if (ev.data === 'ka') return;
      let o; try { o = JSON.parse(ev.data); } catch (e) { return; }
      if (!o || typeof o !== 'object') return;
      if (o.t === 'hello') {
        const back = !!this.token;
        this.seat = o.seat === 1 ? 1 : 0; this.token = String(o.token || ''); this.peer = !!o.peer;
        this.state = 'open'; this.tries = 0; this.lostSince = 0;
        if (back) this.h.onBack && this.h.onBack(); else this._res(this);
        if (this.peer) this.h.onPeer && this.h.onPeer(true);
        return;
      }
      if (o.t === 'err') { this._fail(String(o.why || 'bad')); return; }
      if (o.t === 'peer') { this.peer = !!o.on; this.h.onPeer && this.h.onPeer(this.peer, !!o.left); return; }
      this.h.onMsg && this.h.onMsg(o);
    };
    ws.onclose = () => { if (this.ws === ws) this._dropped(); };
    ws.onerror = () => {};
  }

  // give up on a silent connection and start over with the same seat
  _kill() {
    const ws = this.ws; this.ws = null;
    if (ws) { ws.onclose = null; ws.onmessage = null; try { ws.close(4004, 'silent'); } catch (e) {} }
    this._dropped();
  }

  _dropped() {
    if (this.closedByUs || this.state === 'failed') return;
    if (this.state === 'connecting' && !this.token) { setTimeout(() => this._fail('net'), 80); return; } // a moment, in case the page's rules (not the internet) blocked it
    if (!this.lostSince) { this.lostSince = performance.now(); this.h.onDrop && this.h.onDrop(); }
    if (performance.now() - this.lostSince > 40000) { this._fail('lost'); return; }
    this.state = 'retrying';
    const wait = [300, 700, 1200, 2000, 3000][Math.min(this.tries++, 4)];
    this.retryT = setTimeout(() => this._open(), document.hidden ? 4000 : wait);
  }

  _fail(why) {
    if (this.state === 'failed') return;
    const first = this.state === 'connecting';
    this.state = 'failed';
    this.shut();
    if (first) this._rej(new Error(why)); else this.h.onFail && this.h.onFail(why);
  }

  send(o) { if (this.ws && this.ws.readyState === 1 && this.state === 'open') { try { this.ws.send(JSON.stringify(o)); return true; } catch (e) {} } return false; }

  shut() {
    this.closedByUs = true;
    clearInterval(this.ka); clearTimeout(this.retryT);
    document.removeEventListener('visibilitychange', this._vis);
    if (this._csp) document.removeEventListener('securitypolicyviolation', this._csp);
    if (this.ws) { try { this.ws.close(1000, 'bye'); } catch (e) {} }
  }
  close() { if (this.state === 'open') this.send({ t: 'bye' }); this.shut(); this.state = 'failed'; }
}

// ------------------------------------------------------------ lockstep
// Button presses for one match. Frames 1..delay are empty for both sides, then
// each side adds its own presses `delay` frames ahead of the step it is on.
export class Lockstep {
  constructor(link, mid, local, delay) {
    this.link = link; this.mid = mid; this.local = local; this.remote = 1 - local; this.D = delay;
    this.inp = [new Map(), new Map()];
    for (let f = 1; f <= delay; f++) { this.inp[0].set(f, 0); this.inp[1].set(f, 0); }
    this.mine = delay;     // my presses are decided up to this frame
    this.theirs = delay;   // I hold their presses up to this frame (no gaps)
    this.acked = delay;    // they have mine up to this frame
    this.lastSend = 0; this.lastAckSent = delay;
    this.hash = new Map(); this.peerHash = new Map();
    this.fixAt = 0; this.fixSnap = null; this.desyncs = 0;
    this.peerLoaded = false;
  }
  addMine(f, bits) { if (f === this.mine + 1) { this.inp[this.local].set(f, bits); this.mine = f; } }
  ready(f) { return this.inp[0].has(f) && this.inp[1].has(f); }
  get(f, side) { return this.inp[side].get(f) || 0; }

  flush(force) {
    const now = performance.now();
    if (!force && now - this.lastSend < 12) return;
    const fresh = this.mine > (this.sentTop || 0), ack = this.theirs !== this.lastAckSent;
    if (!force && !fresh && !ack && now - this.lastSend < 120) return;
    const s = this.acked + 1, d = [];
    for (let f = s; f <= this.mine && d.length < 240; f++) d.push(this.inp[this.local].get(f) || 0);
    if (this.link.send({ t: 'in', m: this.mid, a: this.theirs, s, d })) {
      this.lastSend = now; this.sentTop = s + d.length - 1; this.lastAckSent = this.theirs;
    }
  }

  // messages from the other player about this match
  take(o) {
    if (o.m !== this.mid) return false;
    if (o.t === 'in') {
      if (Number.isInteger(o.a) && o.a > this.acked && o.a <= this.mine) this.acked = o.a;
      if (Number.isInteger(o.s) && Array.isArray(o.d) && o.d.length <= 240) {
        const R = this.inp[this.remote];
        o.d.forEach((v, i) => { const f = o.s + i; if (f > this.theirs && !R.has(f) && Number.isInteger(v) && v >= 0 && v < 512) R.set(f, v); });
        while (R.has(this.theirs + 1)) this.theirs++;
      }
      return true;
    }
    if (o.t === 'h' && Number.isInteger(o.f) && typeof o.h === 'string') { this.peerHash.set(o.f, o.h); return true; }
    if (o.t === 'fixAt' && Number.isInteger(o.f)) { this.fixAt = o.f; this.fixSnap = null; return true; }
    if (o.t === 'fix' && Number.isInteger(o.f) && o.s && typeof o.s === 'object') { if (o.f === this.fixAt) this.fixSnap = o.s; return true; }
    if (o.t === 'loaded') { this.peerLoaded = true; return true; }
    return false;
  }

  // forget presses and fingerprints from long ago
  prune(frame) {
    if (frame % 120) return;
    const old = Math.min(frame, this.acked) - 600;
    for (const M of this.inp) for (const f of M.keys()) { if (f < old) M.delete(f); else break; }
    for (const M of [this.hash, this.peerHash]) for (const f of M.keys()) if (f < frame - 600) M.delete(f);
  }
}

// a fingerprint of everything that decides the fight
export function simHash(M) {
  const parts = [M.frame, M.phase, M.round, M.timer, M.wins[0], M.wins[1], M.hitstop, M.projectiles.length];
  for (const F of M.fighters) parts.push(F.x, F.y, F.vx, F.vy, F.hp, F.meter, F.state, F.mt, F.f, F.t);
  for (const p of M.projectiles) parts.push(p.x, p.y);
  const s = parts.join('|');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

// --------------------------------------------------- snapshot and repair
const MATCH_KEYS = ['frame', 'pt', 'phase', 'timer', 'timerAcc', 'round', 'hitstop', 'roundOver', 'fallDone'];
const SKIP_F = new Set(['def', 'M', 'opp', 'st', 'moves', 'frozenPose', 'scriptPose', 'side']);
const isPlain = v => v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype && Object.values(v).every(x => x === null || typeof x !== 'object');

function packFighter(F, M) {
  const o = {};
  for (const k of Object.keys(F)) {
    if (SKIP_F.has(k)) continue;
    const v = F[k];
    if (v === null || ['number', 'string', 'boolean'].includes(typeof v)) o[k] = v;
    else if (v instanceof Set) o[k] = { $set: [...v] };
    else if (M.fighters.includes(v)) o[k] = { $f: v.side };
    else if (v && typeof v === 'object' && v.id && F.moves && F.moves[v.id] === v) o[k] = { $m: v.id };
    else if (Array.isArray(v) && v.every(x => typeof x === 'number')) o[k] = { $a: v.slice() };
    else if (isPlain(v)) o[k] = { $o: Object.assign({}, v) };
  }
  return o;
}
function unpackFighter(F, o, M) {
  for (const k of Object.keys(o)) {
    if (SKIP_F.has(k)) continue;
    const v = o[k];
    if (v === null || typeof v !== 'object') F[k] = v;
    else if (v.$set) F[k] = new Set(v.$set);
    else if (v.$f !== undefined) F[k] = M.fighters[v.$f];
    else if (v.$m) F[k] = F.moves[v.$m] || null;
    else if (v.$a) F[k] = v.$a.slice();
    else if (v.$o) F[k] = Object.assign({}, v.$o);
  }
}
export function snapshot(M) {
  const o = { m: {}, f: M.fighters.map(F => packFighter(F, M)), w: M.wins.slice(), win: M.winner ? M.winner.side : -1, lose: M.loser ? M.loser.side : -1, p: null };
  for (const k of MATCH_KEYS) o.m[k] = M[k];
  o.p = M.projectiles.map(p => ({ x: p.x, y: p.y, vx: p.vx, vy: p.vy, age: p.age }));
  return o;
}
export function restore(M, o) {
  for (const k of MATCH_KEYS) if (k in o.m) M[k] = o.m[k];
  M.wins = o.w.slice();
  M.winner = o.win >= 0 ? M.fighters[o.win] : null; M.loser = o.lose >= 0 ? M.fighters[o.lose] : null;
  o.f.forEach((p, i) => unpackFighter(M.fighters[i], p, M));
  if (o.p && o.p.length === M.projectiles.length) o.p.forEach((q, i) => Object.assign(M.projectiles[i], q));
}
