// The link to the Slap Happy relay (worker/slaphappy.js). It reconnects by
// itself after Wi-Fi blips, the iPad sleeping or the phone locking.

const q = new URLSearchParams(location.search);
export const RELAY = q.get('relay') || ((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/slaphappy-online');
const FATAL = ['taken', 'noroom', 'full', 'bad', 'kicked'];

export class Link {
  constructor(path, on) {
    this.url = RELAY + path;
    this.on = on;
    this.stopped = false;
    this.tries = 0;
    this.ws = null;
    this.heard = 0;
    this.state = 'connecting';
    this._poke = () => { if (document.visibilityState === 'visible') this.poke(); };
    document.addEventListener('visibilitychange', this._poke);
    window.addEventListener('online', this._poke);
    window.addEventListener('pageshow', this._poke);
    this.ka = setInterval(() => this.keepAlive(), 4000);
    this.open();
  }
  setState(s) { if (this.state !== s) { this.state = s; this.on.status && this.on.status(s, this.tries); } }
  open() {
    if (this.stopped) return;
    clearTimeout(this.retryT);
    let ws;
    try { ws = new WebSocket(this.url); } catch (e) { this.retry(); return; }
    this.ws = ws;
    this.setState('connecting');
    ws.onopen = () => { if (this.ws !== ws) return; this.tries = 0; this.heard = Date.now(); this.setState('open'); };
    ws.onmessage = e => {
      if (this.ws !== ws) return;
      this.heard = Date.now();
      if (e.data === 'ka') return;
      let m; try { m = JSON.parse(e.data); } catch (err) { return; }
      if (m.t === 'err') { this.fatal(m.why); return; }
      if (m.t === 'kicked') { this.fatal('kicked'); return; }
      this.on.message(m);
    };
    ws.onclose = e => {
      if (this.ws !== ws) return;
      this.ws = null;
      if (this.stopped) return;
      if (e.code === 4005) { this.fatal('kicked'); return; }
      this.setState('lost');
      this.retry();
    };
    ws.onerror = () => {};
  }
  retry() {
    if (this.stopped) return;
    clearTimeout(this.retryT);
    const d = Math.min(4000, 300 * Math.pow(1.6, this.tries++));
    this.retryT = setTimeout(() => this.open(), d);
  }
  poke() {
    if (this.stopped) return;
    const ws = this.ws;
    if (!ws || ws.readyState > 1) { this.tries = 0; this.open(); }
    else if (ws.readyState === 1 && Date.now() - this.heard > 9000) { this.drop(); }
    else if (ws.readyState === 1) { try { ws.send('ka'); } catch (e) {} }
  }
  drop() { const ws = this.ws; this.ws = null; try { ws.close(); } catch (e) {} this.setState('lost'); this.tries = 0; this.open(); }
  keepAlive() {
    const ws = this.ws;
    if (this.stopped || !ws || ws.readyState !== 1) return;
    if (Date.now() - this.heard > 13000) { this.drop(); return; }
    try { ws.send('ka'); } catch (e) {}
  }
  send(o) { const ws = this.ws; if (ws && ws.readyState === 1) { try { ws.send(JSON.stringify(o)); return true; } catch (e) {} } return false; }
  get isOpen() { return !!(this.ws && this.ws.readyState === 1); }
  fatal(why) {
    this.close(true);
    this.on.fatal && this.on.fatal(FATAL.includes(why) ? why : 'bad');
  }
  close(silent) {
    if (this.stopped) return;
    this.stopped = true;
    clearInterval(this.ka); clearTimeout(this.retryT);
    document.removeEventListener('visibilitychange', this._poke);
    window.removeEventListener('online', this._poke);
    window.removeEventListener('pageshow', this._poke);
    const ws = this.ws; this.ws = null;
    if (ws) { try { ws.close(1000, 'bye'); } catch (e) {} }
    if (!silent) this.setState('closed');
  }
}

export const CODE_LETTERS = 'BCDFGHJKLMNPQRSTVWXZ';
export function newCode() { let s = ''; const r = crypto.getRandomValues(new Uint8Array(4)); for (const b of r) s += CODE_LETTERS[b % CODE_LETTERS.length]; return s; }
export function rid(n = 12) { const a = 'abcdefghijkmnpqrstuvwxyz23456789'; let s = ''; const r = crypto.getRandomValues(new Uint8Array(n)); for (const b of r) s += a[b % a.length]; return s; }
export const isCode = c => new RegExp('^[' + CODE_LETTERS + ']{4}$').test(c || '');
