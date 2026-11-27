// Online rooms. Devices join a room on noralindsey.com by a four-letter code.
// The room (worker/index.js) keeps the game state and applies everyone's
// moves with the same rules as a game on one phone (rules.js), then sends
// the new state to every device. Player names stay in the room only while
// it is in use.

export const ALPHA = 'BCDFGHJKLMNPQRSTVWXZ'; // no vowels: a code never spells a word
export const PROTO = 1;

export function newCode() {
  const a = new Uint8Array(4); crypto.getRandomValues(a);
  return [...a].map(v => ALPHA[v % ALPHA.length]).join('');
}
export const validCode = c => typeof c === 'string' && /^[BCDFGHJKLMNPQRSTVWXZ]{4}$/.test(c);

export function serverBase() {
  const h = location.hostname;
  if (/(^|\.)noralindsey\.com$/.test(h) || h === 'localhost' || h === '127.0.0.1') return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host;
  return 'wss://noralindsey.com';
}

export const WHY = {
  taken: 'That room code is busy. Making a new one…',
  noroom: 'No room with that code is open. Check the letters with the person who made it.',
  full: 'That room is full.',
  key: 'This device can’t rejoin that room.',
  old: 'This page is out of date. Reload it to play online.',
  bad: 'Something went wrong joining the room.',
};

export class Room {
  // how: 'make' (new room), 'join', or 'back' (rejoin after a reload)
  constructor(code, how, o) {
    this.code = code; this.how = how; this.o = o;
    this.S = null; this.offset = 0; this.bestRtt = 1e9;
    this.status = 'connecting'; this.closedByUs = false; this.tries = 0;
    this.lastRx = performance.now();
    this.open();
    this.ka = setInterval(() => {
      if (this.status !== 'open' || !this.ws) return;
      if (performance.now() - this.lastRx > 14000) { this.kill(); return; }
      try { this.ws.send('ka'); } catch (e) {}
    }, 5000);
    this.vis = () => {
      if (document.hidden) return;
      if (this.status === 'retrying') { clearTimeout(this.retryT); this.open(); }
      else if (this.status === 'open' && performance.now() - this.lastRx > 7000) this.kill();
    };
    document.addEventListener('visibilitychange', this.vis);
  }

  setStatus(s) { if (this.status !== s) { this.status = s; this.o.onStatus && this.o.onStatus(s); } }

  open() {
    this.setStatus(this.tries ? 'retrying' : 'connecting');
    const q = new URLSearchParams({ dev: this.o.dev, key: this.o.key, how: this.how, v: PROTO });
    let ws;
    try { ws = new WebSocket(`${this.o.base || serverBase()}/charades-online/room/${this.code}?${q}`); }
    catch (e) { this.retry(); return; }
    this.ws = ws;
    ws.onopen = () => {
      this.lastRx = performance.now();
      this.tries = 0;
      this.how = 'back'; // from now on, reconnects rejoin
      this.setStatus('open');
      this.pings = 0; this.ping();
    };
    ws.onmessage = ev => {
      this.lastRx = performance.now();
      if (ev.data === 'ka') return;
      let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.t === 'state') {
        if (this.bestRtt > 5000) this.offset = m.now - Date.now();
        this.S = m.S; this.o.onState && this.o.onState(m.S);
      } else if (m.t === 'time') {
        const t = Date.now(), rtt = t - m.c;
        if (rtt < this.bestRtt) { this.bestRtt = rtt; this.offset = m.s - (m.c + rtt / 2); }
        if (++this.pings < 4) setTimeout(() => this.ping(), 250);
      } else if (m.t === 'err') {
        if (m.fatal) { this.fatal = m.why; this.o.onFatal && this.o.onFatal(m.why); }
        else this.o.onRefused && this.o.onRefused(m.why, m.op);
      }
    };
    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.ws = null;
      if (this.closedByUs || this.fatal) { this.setStatus('closed'); return; }
      this.retry();
    };
    ws.onerror = () => {};
  }

  ping() { try { this.ws && this.ws.readyState === 1 && this.ws.send(JSON.stringify({ t: 'time', c: Date.now() })); } catch (e) {} }

  retry() {
    this.setStatus('retrying');
    this.tries++;
    const wait = Math.min(8000, 400 * Math.pow(1.7, this.tries));
    clearTimeout(this.retryT);
    this.retryT = setTimeout(() => this.open(), wait);
  }

  kill() { const ws = this.ws; this.ws = null; try { ws && ws.close(); } catch (e) {} if (!this.closedByUs) this.retry(); }

  // server clock, as best this device can tell
  now() { return Date.now() + this.offset; }

  send(op) {
    if (!this.ws || this.ws.readyState !== 1) return false;
    try { this.ws.send(JSON.stringify({ t: 'op', op })); return true; } catch (e) { return false; }
  }

  leave() {
    this.closedByUs = true;
    clearInterval(this.ka); clearTimeout(this.retryT);
    document.removeEventListener('visibilitychange', this.vis);
    try { if (this.ws && this.ws.readyState === 1) { this.ws.send(JSON.stringify({ t: 'leave' })); this.ws.close(1000, 'bye'); } } catch (e) {}
    this.ws = null;
    this.setStatus('closed');
  }
}
