// noralindsey.com: serves the website's files exactly as before, plus two small
// extras: the relay that lets people play NUBBINS online, the charades rooms
// (CharadesRoom, further down), and the Slap Happy relay between the big screen
// and the team phones (worker/slaphappy.js).
//
// The relay is a set of rooms of up to four seats, named by a four-letter code.
// It passes the game's own messages (button presses, which bear, which arena)
// from each seat to the others and nothing else: there is no chat, no names, and nothing
// is kept once a room has been empty for a while.

import { freshState, reduce, LIMITS } from '../charades/js/rules.js';
import { slapOnline, SlapRoom } from './slaphappy.js';
export { SlapRoom };

const CODE = /^[BCDFGHJKLMNPQRSTVWXZ]{4}$/;   // no vowels, so a code never spells a word
const MAX_MSG = 16384;                           // bytes per message
const MAX_RATE = 400;                            // messages a socket may send in any 2 seconds
const RECONNECT_GRACE = 45000;                   // a dropped seat is kept this long for its owner
const IDLE_CLEANUP = 30 * 60 * 1000;             // an empty room forgets itself after this
const SEATS = 4;                                 // players in a room (1 on 1, or a party of 3-4)

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/nubbins-online/')) return online(request, env, url);
    if (url.pathname.startsWith('/charades-online/')) return charadesOnline(request, env, url);
    if (url.pathname.startsWith('/slaphappy-online/')) return slapOnline(request, env, url, CODE);
    return env.ASSETS.fetch(request);
  },
};

function online(request, env, url) {
  const parts = url.pathname.split('/').filter(Boolean); // ['nubbins-online', 'room', 'ABCD']
  if (parts[1] === 'ping') return new Response('{"ok":true}', { headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'cache-control': 'no-store' } });
  if ((parts[1] !== 'room' && parts[1] !== 'room2') || !CODE.test(parts[2] || '')) return new Response('Not found', { status: 404 });
  if ((request.headers.get('Upgrade') || '').toLowerCase() !== 'websocket') return new Response('This address is for the game to talk to.', { status: 426 });
  const id = env.NUBBINS_ROOMS.idFromName(parts[2]);
  return env.NUBBINS_ROOMS.get(id).fetch(request);
}

const rid = () => [...crypto.getRandomValues(new Uint8Array(12))].map(b => b.toString(16).padStart(2, '0')).join('');

export class NubbinsRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.rate = new Map(); // socket -> { n, since }
    // keep-alive pings are answered without waking the room
    try { ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ka', 'ka')); } catch (e) {}
  }

  seatSocket(seat) {
    const list = this.ctx.getWebSockets('s' + seat);
    return list.find(ws => ws.readyState === 1) || null;
  }
  // seats with a live connection
  present() { const out = []; for (let s = 0; s < SEATS; s++) if (this.seatSocket(s)) out.push(s); return out; }
  recent(R, s, now) { return R.gone[s] && now - R.gone[s] < RECONNECT_GRACE; }

  async fetch(request) {
    const url = new URL(request.url);
    const q = url.searchParams;
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const st = this.ctx.storage;
    const now = Date.now();
    let R = (await st.get('room')) || null; // { made, tokens: [seat tokens or null], gone: [ms dropped or 0] }
    if (R && R.tokens.length < SEATS) { while (R.tokens.length < SEATS) { R.tokens.push(null); R.gone.push(0); } }
    const fail = why => {
      this.ctx.acceptWebSocket(server, ['dead']);
      server.send(JSON.stringify({ t: 'err', why }));
      server.close(4001, why);
      return new Response(null, { status: 101, webSocket: client });
    };
    if (url.pathname.split('/')[2] !== 'room2') return fail('old'); // an old copy of the game: it needs a reload

    let seat, token;
    if (q.has('token')) {
      // coming back after a dropped connection
      seat = +q.get('seat');
      if (!R || !(seat >= 0 && seat < SEATS) || R.tokens[seat] !== q.get('token')) return fail('gone');
      token = R.tokens[seat];
      for (const old of this.ctx.getWebSockets('s' + seat)) { try { old.close(4000, 'replaced'); } catch (e) {} }
    } else if (q.has('make')) {
      const busy = R && R.tokens.some((t, s) => t && (this.seatSocket(s) || this.recent(R, s, now)));
      if (busy) return fail('taken');
      seat = 0; token = rid();
      R = { made: now, tokens: [token, null, null, null], gone: [0, 0, 0, 0] };
    } else if (q.has('join')) {
      if (!R || !R.tokens[0]) return fail('noroom');
      if (!(this.seatSocket(0) || this.recent(R, 0, now))) return fail('noroom');
      seat = -1;
      for (let s = 1; s < SEATS; s++) if (!this.seatSocket(s) && !(R.tokens[s] && this.recent(R, s, now))) { seat = s; break; }
      if (seat < 0) return fail('full');
      token = rid(); R.tokens[seat] = token;
    } else return fail('bad');

    R.gone[seat] = 0;
    await st.put('room', R);
    await st.deleteAlarm();
    this.ctx.acceptWebSocket(server, ['s' + seat]);
    server.serializeAttachment({ seat });
    const peers = this.present().filter(s => s !== seat);
    server.send(JSON.stringify({ t: 'hello', seat, token, peers }));
    for (const s of peers) this.seatSocket(s).send(JSON.stringify({ t: 'peer', seat, on: true }));
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, msg) {
    const a = ws.deserializeAttachment();
    if (!a || !(a.seat >= 0 && a.seat < SEATS)) return;
    if (typeof msg !== 'string') return;
    if (msg.length > MAX_MSG) { ws.close(4002, 'too big'); return; }
    const now = Date.now();
    let r = this.rate.get(ws);
    if (!r || now - r.since > 2000) { r = { n: 0, since: now }; this.rate.set(ws, r); }
    if (++r.n > MAX_RATE) { ws.close(4003, 'too fast'); return; }
    // pass it to everyone else in the room, labelled with the sender's seat
    const out = '{"f":' + a.seat + ',"m":' + msg + '}';
    for (let s = 0; s < SEATS; s++) if (s !== a.seat) { const o = this.seatSocket(s); if (o) o.send(out); }
  }

  async webSocketClose(ws, code, reason) {
    try { ws.close(code >= 1000 && code < 5000 && code !== 1005 && code !== 1006 ? code : 1000, 'bye'); } catch (e) {} // finish the goodbye so the browser notices at once
    await this.left(ws, code === 1000 && reason === 'bye');
  }
  async webSocketError(ws) { await this.left(ws); }

  // on purpose: the player pressed LEAVE, so their seat is given up at once
  async left(ws, onPurpose = false) {
    this.rate.delete(ws);
    const a = ws.deserializeAttachment();
    if (!a || !(a.seat >= 0 && a.seat < SEATS)) return;
    // a socket that was replaced by its own reconnect is not a goodbye
    const still = this.ctx.getWebSockets('s' + a.seat).some(x => x !== ws && x.readyState === 1);
    if (still) return;
    const R = await this.ctx.storage.get('room');
    if (R) {
      if (onPurpose) { R.tokens[a.seat] = null; R.gone[a.seat] = 0; } else R.gone[a.seat] = Date.now();
      await this.ctx.storage.put('room', R);
    }
    const others = this.present();
    for (const s of others) this.seatSocket(s).send(JSON.stringify(onPurpose ? { t: 'peer', seat: a.seat, on: false, left: true } : { t: 'peer', seat: a.seat, on: false }));
    if (!others.length) await this.ctx.storage.setAlarm(Date.now() + IDLE_CLEANUP);
  }

  async alarm() {
    if (this.present().length) return;
    await this.ctx.storage.deleteAll();
  }
}

// ======================================================================
// Charades rooms
//
// A room is named by a four-letter code and holds one game: who is in it,
// the scores and the turn being played. Each device sends its moves; the
// room applies them in order with the game's own rules
// (charades/js/rules.js, the same file the game uses on one phone) and
// sends the new state to every device. Player names are kept only while
// the room is in use: an hour after the last device leaves, the room
// forgets everything.

const CH_MAX_MSG = 4096;
const CH_MAX_RATE = 60;                     // messages a socket may send in any 2 seconds
const CH_IDLE = 60 * 60 * 1000;             // an empty room forgets itself after this
const CH_HOST_GRACE = 20000;                // the host's job moves on if they're gone this long
const CH_TURN_GRACE = 3500;                 // a turn ends by itself this long after time is up
const CH_REUSE = 10 * 60 * 1000;            // a code can't be remade until it's been quiet this long

function charadesOnline(request, env, url) {
  const parts = url.pathname.split('/').filter(Boolean); // ['charades-online', 'room', 'ABCD']
  if (parts[1] === 'ping') return new Response('{"ok":true}', { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  if (parts[1] !== 'room' || !CODE.test(parts[2] || '')) return new Response('Not found', { status: 404 });
  if ((request.headers.get('Upgrade') || '').toLowerCase() !== 'websocket') return new Response('This address is for the game to talk to.', { status: 426 });
  return env.CHARADES_ROOMS.get(env.CHARADES_ROOMS.idFromName(parts[2])).fetch(request);
}

export class CharadesRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.rate = new Map();
    try { ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ka', 'ka')); } catch (e) {}
    ctx.blockConcurrencyWhile(async () => {
      this.S = (await ctx.storage.get('S')) || null;        // the game (see rules.js)
      this.keys = (await ctx.storage.get('keys')) || {};    // device id -> its secret
      this.meta = (await ctx.storage.get('meta')) || { touched: 0, hostGone: 0, emptySince: 0 };
    });
  }

  sockets() { return this.ctx.getWebSockets().filter(ws => ws.readyState === 1 && !this.ctx.getTags(ws).includes('dead')); }
  liveDevs() {
    const out = new Set();
    for (const ws of this.sockets()) { const a = ws.deserializeAttachment(); if (a && a.dev) out.add(a.dev); }
    return out;
  }
  async persist() {
    await this.ctx.storage.put({ S: this.S, keys: this.keys, meta: this.meta });
    await this.plan();
  }
  broadcast() {
    if (!this.S) return;
    const msg = JSON.stringify({ t: 'state', S: this.S, now: Date.now() });
    for (const ws of this.sockets()) { try { ws.send(msg); } catch (e) {} }
  }
  apply(op, from) {
    const r = reduce(this.S, op, from, Date.now());
    if (!r.err) this.S = r.S;
    return r.err;
  }

  // the next time the room should wake up by itself
  async plan() {
    const S = this.S;
    if (!S) { await this.ctx.storage.deleteAlarm(); return; }
    const live = this.liveDevs();
    const times = [];
    if (S.phase === 'play' && S.cur && !S.cur.left) times.push(S.cur.ends + CH_TURN_GRACE);
    if (S.host && !live.has(S.host) && live.size && this.meta.hostGone) times.push(this.meta.hostGone + CH_HOST_GRACE);
    if (!live.size) times.push((this.meta.emptySince || Date.now()) + CH_IDLE);
    if (times.length) await this.ctx.storage.setAlarm(Math.max(Date.now() + 200, Math.min(...times)));
    else await this.ctx.storage.deleteAlarm();
  }

  moveHost() {
    const S = this.S; if (!S) return false;
    const live = [...this.liveDevs()];
    if (!live.length || live.includes(S.host)) return false;
    // the first device (in player order) that's still here
    const order = [...new Set(S.players.map(p => p.dev))].filter(d => live.includes(d));
    const next = order[0] || live[0];
    this.apply({ t: 'dev', id: next, on: true, host: true }, 'server');
    this.meta.hostGone = 0;
    return true;
  }

  async fetch(request) {
    const q = new URL(request.url).searchParams;
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const fail = why => {
      this.ctx.acceptWebSocket(server, ['dead']);
      server.send(JSON.stringify({ t: 'err', why, fatal: true }));
      server.close(4001, why);
      return new Response(null, { status: 101, webSocket: client });
    };
    if (q.get('v') !== '1') return fail('old');
    const dev = q.get('dev') || '', key = q.get('key') || '', how = q.get('how') || '';
    if (!/^d[0-9a-f]{12}$/.test(dev) || !/^[0-9a-f]{24}$/.test(key)) return fail('bad');
    const now = Date.now();
    const live = this.liveDevs();

    if (this.S && this.keys[dev]) {
      if (this.keys[dev] !== key) return fail('key');
    } else if (how === 'make') {
      if (this.S && (live.size || now - this.meta.touched < CH_REUSE)) return fail('taken');
      this.S = freshState({ host: dev });
      this.keys = {};
      this.meta = { touched: now, hostGone: 0, emptySince: 0 };
    } else if (how === 'join' || how === 'back') {
      if (!this.S || (!live.size && now - this.meta.touched > CH_IDLE)) return fail('noroom');
      if (Object.keys(this.keys).length >= LIMITS.devices) return fail('full');
    } else return fail('bad');

    this.keys[dev] = key;
    for (const old of this.ctx.getWebSockets('d:' + dev)) { try { old.close(4000, 'replaced'); } catch (e) {} }
    this.ctx.acceptWebSocket(server, ['d:' + dev]);
    server.serializeAttachment({ dev });
    this.apply({ t: 'dev', id: dev, on: true }, 'server');
    if (dev === this.S.host) this.meta.hostGone = 0;
    this.meta.touched = now; this.meta.emptySince = 0;
    await this.persist();
    // everyone (this device included) gets the new state
    const msg = JSON.stringify({ t: 'state', S: this.S, now: Date.now() });
    try { server.send(msg); } catch (e) {}
    for (const ws of this.sockets()) { if (ws !== server) try { ws.send(msg); } catch (e) {} }
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, msg) {
    const a = ws.deserializeAttachment();
    if (!a || !a.dev || !this.S) return;
    if (typeof msg !== 'string') return;
    if (msg.length > CH_MAX_MSG) { ws.close(4002, 'too big'); return; }
    const now = Date.now();
    let r = this.rate.get(ws);
    if (!r || now - r.since > 2000) { r = { n: 0, since: now }; this.rate.set(ws, r); }
    if (++r.n > CH_MAX_RATE) { ws.close(4003, 'too fast'); return; }
    let m; try { m = JSON.parse(msg); } catch (e) { return; }
    if (!m || typeof m !== 'object') return;

    if (m.t === 'time') { try { ws.send(JSON.stringify({ t: 'time', c: +m.c || 0, s: now })); } catch (e) {} return; }

    if (m.t === 'leave') {
      const wasHost = this.S.host === a.dev;
      delete this.keys[a.dev];
      this.apply({ t: 'drop', id: a.dev }, 'server');
      try { ws.close(1000, 'bye'); } catch (e) {}
      if (wasHost) { this.S.host = null; this.meta.hostGone = now - CH_HOST_GRACE; this.moveHost(); }
      if (!this.liveDevs().size) this.meta.emptySince = now;
      this.meta.touched = now;
      await this.persist();
      this.broadcast();
      return;
    }

    if (m.t === 'op' && m.op && typeof m.op === 'object') {
      if (m.op.t === 'dev' || m.op.t === 'drop') return;
      const err = this.apply(m.op, a.dev);
      this.meta.touched = now;
      if (err) { try { ws.send(JSON.stringify({ t: 'err', why: err, op: String(m.op.t).slice(0, 12) })); } catch (e) {} return; }
      await this.persist();
      this.broadcast();
    }
  }

  async webSocketClose(ws, code) {
    try { ws.close(code >= 1000 && code < 5000 && code !== 1005 && code !== 1006 ? code : 1000, 'bye'); } catch (e) {}
    await this.gone(ws);
  }
  async webSocketError(ws) { await this.gone(ws); }

  async gone(ws) {
    this.rate.delete(ws);
    const a = ws.deserializeAttachment();
    if (!a || !a.dev || !this.S) return;
    const still = this.ctx.getWebSockets('d:' + a.dev).some(x => x !== ws && x.readyState === 1);
    if (still) return;
    if (!this.S.devs[a.dev]) return; // left on purpose: already handled
    const now = Date.now();
    this.apply({ t: 'dev', id: a.dev, on: false }, 'server');
    if (a.dev === this.S.host) this.meta.hostGone = now;
    if (!this.liveDevs().size) this.meta.emptySince = now;
    await this.persist();
    this.broadcast();
  }

  async alarm() {
    if (!this.S) return;
    const now = Date.now();
    const live = this.liveDevs();
    let changed = false;
    const S = this.S;
    if (S.phase === 'play' && S.cur && !S.cur.left && now >= S.cur.ends + CH_TURN_GRACE - 100) changed = !this.apply({ t: 'end' }, 'server') || changed;
    if (S.host && !live.has(S.host) && this.meta.hostGone && now - this.meta.hostGone >= CH_HOST_GRACE - 100) changed = this.moveHost() || changed;
    if (!live.size && this.meta.emptySince && now - this.meta.emptySince >= CH_IDLE - 1000) {
      await this.ctx.storage.deleteAll();
      this.S = null; this.keys = {}; this.meta = { touched: 0, hostGone: 0, emptySince: 0 };
      return;
    }
    await this.persist();
    if (changed) this.broadcast();
  }
}
