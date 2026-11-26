// noralindsey.com: serves the website's files exactly as before, plus one small
// extra, the relay that lets two people play NUBBINS online.
//
// The relay is a set of rooms of up to four seats, named by a four-letter code.
// It passes the game's own messages (button presses, which bear, which arena)
// from each seat to the others and nothing else: there is no chat, no names, and nothing
// is kept once a room has been empty for a while.

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
