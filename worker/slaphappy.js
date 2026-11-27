// Slap Happy: the relay between the big screen (the host) and the team phones.
//
// A room is named by four letters. The big screen makes it and holds a secret
// key so it can come back after the iPad sleeps. Phones join with the letters.
// The relay only passes messages along: phone -> big screen, and big screen ->
// one phone or every phone. All the game rules live on the big screen.
// Nothing is kept once a room has been empty for a while.

const MAX_MSG = 8192;               // bytes per message
const MAX_RATE = 240;               // messages a socket may send in any 2 seconds
const MAX_TEAMS = 12;               // phones in one room
const IDLE_CLEANUP = 3 * 3600e3;    // an empty room forgets itself after this
const HOST_HOLD = 3 * 3600e3;       // a host that dropped keeps its letters this long

const KEY = /^[a-z0-9]{8,40}$/;
const TEAM = /^[a-z0-9]{6,24}$/;

export function slapOnline(request, env, url, CODE) {
  const parts = url.pathname.split('/').filter(Boolean); // ['slaphappy-online', 'room', 'ABCD']
  const cors = { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'cache-control': 'no-store' };
  if (parts[1] === 'ping') return new Response('{"ok":true}', { headers: cors });
  if (parts[1] !== 'room' || !CODE.test(parts[2] || '')) return new Response('Not found', { status: 404 });
  if ((request.headers.get('Upgrade') || '').toLowerCase() !== 'websocket') return new Response('This address is for the game to talk to.', { status: 426 });
  return env.SLAP_ROOMS.get(env.SLAP_ROOMS.idFromName(parts[2])).fetch(request);
}

export class SlapRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.rate = new Map();
    try { ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ka', 'ka')); } catch (e) {}
  }

  live(tag) { return this.ctx.getWebSockets(tag).filter(ws => ws.readyState === 1); }
  teamIds() {
    const ids = new Set();
    for (const ws of this.live('team')) { const a = ws.deserializeAttachment(); if (a && a.team) ids.add(a.team); }
    return [...ids];
  }
  sendAll(list, text) { for (const ws of list) { try { ws.send(text); } catch (e) {} } }

  async fetch(request) {
    const q = new URL(request.url).searchParams;
    const [client, server] = Object.values(new WebSocketPair());
    const st = this.ctx.storage;
    const now = Date.now();
    let R = (await st.get('room')) || null; // { key, made, seen }
    const fail = why => {
      this.ctx.acceptWebSocket(server, ['dead']);
      server.send(JSON.stringify({ t: 'err', why }));
      server.close(4001, why);
      return new Response(null, { status: 101, webSocket: client });
    };

    if (q.has('host')) {
      const key = q.get('host') || '';
      if (!KEY.test(key)) return fail('bad');
      if (R && R.key !== key) {
        const held = this.live('host').length > 0 || now - (R.seen || 0) < HOST_HOLD;
        if (held) return fail('taken');
        R = null;
      }
      if (!R) R = { key, made: now };
      R.seen = now;
      await st.put('room', R);
      await st.deleteAlarm();
      for (const old of this.ctx.getWebSockets('host')) { try { old.close(4000, 'replaced'); } catch (e) {} }
      this.ctx.acceptWebSocket(server, ['host']);
      server.serializeAttachment({ host: true });
      server.send(JSON.stringify({ t: 'hello', role: 'host', teams: this.teamIds() }));
      this.sendAll(this.live('team'), '{"t":"host","on":true}');
    } else if (q.has('team')) {
      const id = q.get('team') || '';
      if (!TEAM.test(id)) return fail('bad');
      if (!R) return fail('noroom');
      const ids = this.teamIds();
      if (!ids.includes(id) && ids.length >= MAX_TEAMS) return fail('full');
      for (const old of this.ctx.getWebSockets('t:' + id)) { try { old.close(4000, 'replaced'); } catch (e) {} }
      await st.deleteAlarm();
      this.ctx.acceptWebSocket(server, ['team', 't:' + id]);
      server.serializeAttachment({ team: id });
      const hostOn = this.live('host').length > 0;
      server.send(JSON.stringify({ t: 'hello', role: 'team', host: hostOn }));
      this.sendAll(this.live('host'), JSON.stringify({ t: 'peer', id, on: true }));
    } else return fail('bad');

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, msg) {
    const a = ws.deserializeAttachment();
    if (!a || typeof msg !== 'string') return;
    if (msg.length > MAX_MSG) { ws.close(4002, 'too big'); return; }
    const now = Date.now();
    let r = this.rate.get(ws);
    if (!r || now - r.since > 2000) { r = { n: 0, since: now }; this.rate.set(ws, r); }
    if (++r.n > MAX_RATE) { ws.close(4003, 'too fast'); return; }
    let o;
    try { o = JSON.parse(msg); } catch (e) { return; }
    if (!o || typeof o !== 'object') return;

    if (a.host) {
      // { to: '*' | id | [ids], m: {...} }  or  { kick: id }
      if (o.kick && TEAM.test(o.kick)) {
        for (const t of this.ctx.getWebSockets('t:' + o.kick)) { try { t.send('{"t":"kicked"}'); t.close(4005, 'kicked'); } catch (e) {} }
        return;
      }
      if (!o.m) return;
      const out = JSON.stringify(o.m);
      if (o.to === '*') this.sendAll(this.live('team'), out);
      else for (const id of [].concat(o.to || [])) if (TEAM.test(id)) this.sendAll(this.live('t:' + id), out);
    } else if (a.team) {
      this.sendAll(this.live('host'), '{"f":"' + a.team + '","m":' + msg + '}');
    }
  }

  async webSocketClose(ws, code, reason) {
    try { ws.close(code >= 1000 && code < 5000 && code !== 1005 && code !== 1006 ? code : 1000, 'bye'); } catch (e) {}
    await this.left(ws);
  }
  async webSocketError(ws) { await this.left(ws); }

  async left(ws) {
    this.rate.delete(ws);
    const a = ws.deserializeAttachment();
    if (!a) return;
    if (a.host) {
      if (this.ctx.getWebSockets('host').some(x => x !== ws && x.readyState === 1)) return; // replaced by its own reconnect
      const R = await this.ctx.storage.get('room');
      if (R) { R.seen = Date.now(); await this.ctx.storage.put('room', R); }
      this.sendAll(this.live('team'), '{"t":"host","on":false}');
    } else if (a.team) {
      if (this.ctx.getWebSockets('t:' + a.team).some(x => x !== ws && x.readyState === 1)) return;
      this.sendAll(this.live('host'), JSON.stringify({ t: 'peer', id: a.team, on: false }));
    }
    if (!this.live('host').length && !this.live('team').length) await this.ctx.storage.setAlarm(Date.now() + IDLE_CLEANUP);
  }

  async alarm() {
    if (this.live('host').length || this.live('team').length) return;
    await this.ctx.storage.deleteAll();
  }
}
