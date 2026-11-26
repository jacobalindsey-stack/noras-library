// NUBBINS — the online flow for 2-4 players: make or join a room, wait for
// friends, the room maker presses START (2 players: 1 on 1; 3-4: a party),
// everyone picks a bear, the room maker picks the arena, fight, then rematch,
// new bears or leave. Nothing another player sends is ever shown as text: only
// bear and arena keys that this game already knows, checked against its own lists.
import { Link, Lockstep, newCode, PROTO } from './net.js';
import { BY_KEY } from './roster.js';
import { STAGES, SECRET_STAGES, STAGE_BY_KEY } from './stages.js';
import { sfx, playMusic } from './audio.js';

const FRIEND_GONE = 45; // seconds to wait for a player whose connection dropped
const MAX_PLAYERS = 4;

export class Online {
  constructor(G) {
    this.G = G; this.link = null; this.seat = -1; this.code = '';
    this.mode = 'menu'; this.roster = null; this.picks = {}; this.votes = {};
    this.mid = 0; this.ls = null; this.offT = new Map();
    this.rtts = new Map(); this.peerRt = {}; this.pingN = 0; this.pingT = 0; this.pingSent = 0;
  }

  get peers() { return this.link ? [...this.link.peers].sort((a, b) => a - b) : []; }
  get isHost() { return this.seat === 0; }
  inRoster(s) { return !!(this.roster && this.roster.includes(s)); }

  // ------------------------------------------------------------ rooms
  menu() {
    this.closeLink();
    this.mode = 'menu';
    this.G.endFight(); this.G.loadStage('sill'); this.G.showMenuScene('select', [null, null]);
    this.G.ui.onlineMenu({ onMake: () => this.make(), onJoin: () => this.joinScreen(), onBack: () => this.G.toTitle() });
    playMusic('select');
  }

  async make(tries = 0) {
    this.mode = 'connecting';
    this.G.ui.onlineMsg('MAKING A ROOM', '', [['◀ BACK', 'alt small', () => this.menu()]], true);
    const code = newCode();
    const link = this.openLink(code, 'make');
    try { await link.ready; } catch (e) {
      if (link !== this.link) return;
      if (e.message === 'taken' && tries < 6) { this.make(tries + 1); return; }
      this.problem(e.message); return;
    }
    if (link !== this.link) return;
    this.seat = link.seat; this.code = code;
    this.room();
  }

  joinScreen(error, code) {
    this.closeLink(); this.mode = 'join';
    this.G.ui.onlineJoin({ error, code, onBack: () => this.menu(), onJoin: c => this.join(c) });
  }

  async join(code) {
    this.mode = 'connecting';
    this.G.ui.onlineMsg('LOOKING FOR ' + code, '', [['◀ BACK', 'alt small', () => this.joinScreen(null, code)]], true);
    const link = this.openLink(code, 'join');
    try { await link.ready; } catch (e) {
      if (link !== this.link) return;
      const why = {
        noroom: 'No room with those letters. Check them with your friend?',
        full: 'That room already has four players in it.',
        old: 'Your copy of the game is out of date. Reload the page, then try again.',
        net: "Couldn't reach the game room. Is the internet on?",
        csp: "Online play only works from noralindsey.com. This copy of the game isn't allowed to go on the internet.",
      }[e.message] || "Couldn't get into that room. Try again?";
      this.joinScreen(why, code); return;
    }
    if (link !== this.link) return;
    this.seat = link.seat; this.code = code;
    this.link.send({ t: 'hi', v: PROTO });
    this.room();
  }

  // the waiting room: everyone who is here so far; the room maker starts when ready
  room(toast) {
    this.mode = 'room'; this.roster = null; this.ls = null; this.picks = {}; this.votes = {};
    this.G.endFight(); this.G.loadStage('sill'); this.G.showMenuScene('select', [null, null]);
    this.paintRoom();
    if (toast) this.G.ui.toast(toast, 3.5);
  }
  paintRoom() {
    if (this.mode !== 'room') return;
    const here = [this.seat, ...this.peers];
    this.G.ui.onlineRoom({
      code: this.code, seat: this.seat, isHost: this.isHost,
      present: Array.from({ length: MAX_PLAYERS }, (_, s) => here.includes(s)),
      onStart: () => this.hostGo(),
      onLeave: () => (this.isHost ? this.menu() : this.leave()),
    });
  }
  hostGo() {
    if (!this.isHost || this.mode !== 'room') return;
    const roster = [this.seat, ...this.peers].sort((a, b) => a - b).slice(0, MAX_PLAYERS);
    if (roster.length < 2) return;
    this.roster = roster;
    this.link.send({ t: 'go', r: roster });
    sfx('confirm');
    this.pickPhase(true);
  }

  openLink(code, how) {
    this.closeLink();
    this.roster = null; this.picks = {}; this.votes = {}; this.rtts = new Map(); this.peerRt = {}; this.offT = new Map();
    const link = new Link(code, how, {
      onPeer: (s, on, left) => { if (link === this.link) this.onPeer(s, on, left); },
      onMsg: (o, from) => { if (link === this.link) this.onMsg(o, from); },
      onDrop: () => {},
      onBack: () => { if (link === this.link) this.resendState(); },
      onFail: why => { if (link === this.link) this.problem(why); },
    });
    this.link = link;
    return link;
  }

  closeLink() { if (this.link) { this.link.close(); this.link = null; } this.ls = null; }
  close() { this.closeLink(); this.mode = 'gone'; }

  problem(why) {
    this.closeLink();
    this.G.endFight(); this.G.loadStage('sill');
    const text = why === 'csp' ? "Online play only works from noralindsey.com. This copy of the game isn't allowed to go on the internet." : why === 'net' ? "Couldn't reach the game room. Is the internet on?" : 'The connection to the game room was lost.';
    this.G.ui.onlineMsg('UH OH', text, [['OK', 'gold', () => this.menu()]]);
    this.mode = 'menu';
  }

  closedBy(title, text) {
    if (this.mode === 'gone') return;
    this.closeLink();
    this.G.endFight(); this.G.loadStage('sill'); this.G.showMenuScene('select', [null, null]);
    this.G.ui.onlineMsg(title, text, [['OK', 'gold', () => this.menu()]]);
    sfx('back');
    this.mode = 'menu';
  }

  // someone who was playing left (or stayed gone too long): everyone still here goes back to the room
  playerLeft(s) {
    this.offT.delete(s);
    if (s === 0 && !this.isHost) { this.closedBy('THE ROOM CLOSED', 'The room maker left, so the room is closed. You can make a new one any time.'); return; }
    if (this.inRoster(s) || this.mode === 'room') this.room(this.mode === 'room' ? null : 'A player left, so everyone is back in the room.');
  }

  // ------------------------------------------------------- players in and out
  onPeer(s, on, left) {
    if (on) {
      this.offT.delete(s);
      this.link.send({ t: 'hi', v: PROTO, to: s });
      if (this.mode === 'room') { this.paintRoom(); sfx('select'); return; }
      if (this.inRoster(s)) { this.resendState(); if (this.mode !== 'fight') this.G.ui.toast('Your friend is back!'); return; }
      if (this.isHost) this.link.send({ t: 'started', to: s }); // a game is already going: they can join the next one
      return;
    }
    if (left) { this.playerLeft(s); return; }
    if (this.mode === 'room') { this.paintRoom(); return; }
    if (this.inRoster(s) || s === 0) {
      this.offT.set(s, 0);
      if (this.mode !== 'fight') this.G.ui.toast("A friend's connection dropped. Waiting for them…", 4);
    }
  }

  onMsg(o, from) {
    if (this.ls && this.ls.take(o, from)) return;
    if (typeof o.to === 'number' && o.to !== this.seat) return; // meant for someone else
    switch (o.t) {
      case 'hi':
        if (o.v !== PROTO) this.closedBy('DIFFERENT VERSIONS', 'Someone in the room has an older copy of the game. Everyone reload the page, then try again.');
        break;
      case 'ping': this.link.send({ t: 'pong', n: o.n, to: from }); break;
      case 'pong': if (o.n === this.pingN && this.pingSent) { const a = this.rtts.get(from) || []; a.push(performance.now() - this.pingSent); if (a.length > 7) a.shift(); this.rtts.set(from, a); } break;
      case 'started': this.closedBy('ALREADY PLAYING', "That room's game has already started. Ask the room maker to come back to the room, then join again."); break;
      case 'go': {
        if (from !== 0 || !this.validRoster(o.r) || !o.r.includes(this.seat)) break;
        if (this.mode !== 'room' && this.roster && this.roster.join() === o.r.join()) break; // already picking with this group
        this.roster = o.r.slice();
        this.pickPhase(true);
        break;
      }
      case 'pick':
        if (!this.inRoster(from) || typeof o.k !== 'string' || !BY_KEY[o.k]) break;
        this.picks[from] = o.k;
        if (typeof o.rt === 'number' && isFinite(o.rt)) this.peerRt[from] = Math.min(1000, Math.max(0, o.rt));
        if (this.mode === 'pick') this.G.ui.toast((this.roster.length === 2 ? 'Your friend' : 'P' + (from + 1)) + ' picked ' + BY_KEY[o.k].name + '!');
        if (this.mode === 'pickWait' || this.mode === 'arenaWait' || this.mode === 'arena') this.afterPick();
        break;
      case 'unpick':
        if (!this.inRoster(from)) break;
        delete this.picks[from];
        if (this.mode === 'arena' || this.mode === 'pickWait' || this.mode === 'arenaWait') this.afterPick();
        break;
      case 'start': {
        if (from !== 0 || this.isHost || !this.validRoster(o.r) || !o.r.includes(this.seat)) break;
        if (!Array.isArray(o.p) || o.p.length !== o.r.length || !o.p.every(k => typeof k === 'string' && BY_KEY[k])) break;
        if (typeof o.st !== 'string' || !STAGE_BY_KEY[o.st] || !Number.isInteger(o.m) || o.m <= this.mid || !Number.isInteger(o.d) || o.d < 2 || o.d > 12) break;
        this.roster = o.r.slice();
        this.beginMatch(o.m, o.p.slice(), o.st, o.d);
        break;
      }
      case 'again': case 'repick':
        if (!this.inRoster(from)) break;
        this.votes[from] = o.t;
        if (o.t === 'repick' && this.mode === 'results') this.pickPhase(true);
        else this.checkVotes();
        break;
      case 'bye': this.playerLeft(from); break;
      default: break;
    }
  }
  validRoster(r) { return Array.isArray(r) && r.length >= 2 && r.length <= MAX_PLAYERS && r[0] === 0 && r.every((s, i) => Number.isInteger(s) && s >= 0 && s < MAX_PLAYERS && (i === 0 || s > r[i - 1])); }

  // ------------------------------------------------------------- picking
  // fresh: a new round of picking for everyone; otherwise only I am choosing again
  pickPhase(fresh = true) {
    if (fresh) { this.picks = {}; this.votes = {}; } else delete this.picks[this.seat];
    this.mode = 'pick';
    this.G.endFight();
    this.G.pickChar({
      heading: 'PICK YOUR GUMMY', picker: this.seat ? 1 : 0, youTag: true,
      onBack: () => this.leaveAsk(() => this.pickPhase(false)),
      onPick: k => {
        if (this.mode !== 'pick') return;
        this.picks[this.seat] = k; this.link.send({ t: 'pick', k, rt: Math.round(this.worstRtt()) });
        this.afterPick();
      },
    });
  }

  afterPick() {
    if (!this.roster) return;
    const me = this.picks[this.seat];
    if (!me) { if (this.mode !== 'pick') this.pickPhase(false); return; }
    const keys = this.roster.map(s => this.picks[s] || null), local = this.roster.indexOf(this.seat);
    this.G.loadStage('sill'); this.G.showMenuScene('select', this.roster.length === 2 ? keys : [null, null]);
    const unpick = ['◀ CHANGE MY BEAR', 'alt small', () => { this.link.send({ t: 'unpick' }); this.pickPhase(false); }];
    const missing = this.roster.filter(s => !this.picks[s]).length;
    const two = this.roster.length === 2;
    if (missing) {
      this.mode = 'pickWait';
      this.G.ui.onlinePair(keys, local, two ? 'Waiting for your friend to pick' : `Waiting for ${missing === 1 ? 'one more friend' : missing + ' friends'} to pick`, [unpick], this.roster);
      return;
    }
    if (this.isHost) {
      this.mode = 'arena';
      const list = this.G.save.unlocked.gummoth ? [...STAGES, ...SECRET_STAGES] : STAGES;
      this.G.ui.stageSelect(list, st => this.hostStart(st), unpick[2]);
    } else {
      this.mode = 'arenaWait';
      this.G.ui.onlinePair(keys, local, two ? 'Your friend is picking the arena' : 'The room maker is picking the arena', [unpick], this.roster);
    }
  }

  // how far away the farthest friend is (round trip, ms)
  worstRtt() {
    let w = 0;
    for (const a of this.rtts.values()) { if (!a.length) continue; const r = a.slice().sort((x, y) => x - y); w = Math.max(w, r[r.length >> 1]); }
    return w;
  }
  delay() {
    const all = [];
    for (const a of this.rtts.values()) all.push(...a);
    const r = all.sort((a, b) => a - b);
    let rtt = r.length ? r[r.length >> 1] : 120;
    for (const s of this.roster || []) if (this.peerRt[s]) rtt = Math.max(rtt, this.peerRt[s]); // a friend far from another friend
    // a bumpy connection (pings that vary a lot) gets a little more cushion
    const bump = r.length >= 4 ? Math.max(0, r[Math.floor(r.length * 0.8)] - r[r.length >> 1]) / 2 : 10;
    return Math.max(2, Math.min(10, Math.ceil((rtt / 2 + 12 + Math.min(bump, 50)) / (1000 / 60)) + 1));
  }

  hostStart(stage) {
    if (!this.isHost || !this.roster || this.roster.some(s => !this.picks[s])) return;
    this.lastStage = stage;
    const m = this.mid + 1, d = this.delay(), p = this.roster.map(s => this.picks[s]);
    this.link.send({ t: 'start', m, p, r: this.roster, st: stage, d });
    this.beginMatch(m, p, stage, d);
  }

  async beginMatch(mid, p, stage, delay) {
    this.mid = mid; this.mode = 'fight'; this.votes = {}; this.lastStage = stage;
    this.roster.forEach((s, i) => { this.picks[s] = p[i]; });
    const L = new Lockstep(this.link, mid, this.roster, this.seat, delay);
    this.ls = L;
    this.G.showMenuScene(null, null);
    if (p.length === 2) await this.G.ui.versus(p[0], p[1], 1600);
    else await new Promise(r => setTimeout(r, 300));
    if (this.ls !== L || this.mode !== 'fight') return;
    const G = this.G;
    G.startFight({
      bears: p, p1: p[0], p2: p[1], humans: this.roster.map(s => s === this.seat), mode: 'vs', stage, level: 1,
      net: { ls: L, local: L.local, role: L.local === 0 ? 'host' : 'guest', go: false, loaded: true },
      netBot: !!G.testAuto,
      onEnd: res => this.matchOver(res),
    });
    this.link.send({ t: 'loaded', m: mid });
  }

  matchOver(res) {
    if (this.mode !== 'fight') return;
    this.mode = 'results';
    if (this.ls) this.ls.flush(true);
    this.G.recordResult(res, this.roster.map(s => s === this.seat));
    this.G.endFight(); this.G.showMenuScene('select', this.roster.length === 2 ? this.roster.map(s => this.picks[s]) : [null, null]);
    this.lastResult = res;
    this.setWait = this.G.ui.onlineResults(res, this.roster.indexOf(this.seat), {
      onAgain: () => this.vote('again'),
      onRepick: () => this.vote('repick'),
      onLeave: () => this.leave(),
    }, this.roster);
    if (Object.values(this.votes).includes('repick')) { this.pickPhase(true); return; }
    this.checkVotes();
  }

  vote(v) {
    if (this.mode !== 'results') return;
    this.votes[this.seat] = v;
    this.link.send({ t: v });
    if (v === 'repick') { this.pickPhase(true); return; }
    this.checkVotes();
  }

  checkVotes() {
    if (this.mode !== 'results' || !this.roster) return;
    const again = this.roster.filter(s => this.votes[s] === 'again').length, n = this.roster.length;
    if (again === n) {
      if (this.isHost) { const m = this.mid + 1, d = this.delay(), p = this.roster.map(s => this.picks[s]); this.link.send({ t: 'start', m, p, r: this.roster, st: this.lastStage, d }); this.beginMatch(m, p, this.lastStage, d); }
      else this.setWait && this.setWait('Starting the rematch');
      return;
    }
    const others = n - 1 - (this.votes[this.seat] === 'again' ? again - 1 : again);
    if (this.votes[this.seat] === 'again') this.setWait && this.setWait(n === 2 ? 'Waiting for your friend' : `Waiting for ${others === 1 ? 'one more friend' : others + ' friends'}`);
    else if (again) this.setWait && this.setWait(n === 2 ? 'Your friend wants a rematch!' : `${again} of ${n - 1} friends want a rematch!`);
  }

  // after a connection blipped (mine or a friend's), say again whatever may have been lost
  resendState() {
    const L = this.link; if (!L) return;
    if (this.isHost && this.roster && ['pick', 'pickWait', 'arena', 'arenaWait'].includes(this.mode)) L.send({ t: 'go', r: this.roster });
    const mine = this.picks[this.seat];
    if (['pick', 'pickWait', 'arena', 'arenaWait'].includes(this.mode)) L.send(mine ? { t: 'pick', k: mine, rt: Math.round(this.worstRtt()) } : { t: 'unpick' });
    if (this.mode === 'fight' && this.ls) {
      if (this.isHost) L.send({ t: 'start', m: this.mid, p: this.roster.map(s => this.picks[s]), r: this.roster, st: this.lastStage, d: this.ls.D });
      L.send({ t: 'loaded', m: this.mid });
      this.ls.flush(true);
    }
    if (this.mode === 'results' && this.votes[this.seat]) L.send({ t: this.votes[this.seat] });
  }

  // --------------------------------------------------------------- leaving
  leaveAsk(back) {
    this.G.ui.onlineMsg('LEAVE THE ROOM?', this.isHost ? 'Closing the room sends your friends home too.' : 'You can join again with the same letters.', [['STAY', 'gold', back], ['LEAVE', 'small', () => this.leave()]]);
  }
  leave() { this.closeLink(); this.mode = 'gone'; this.G.online = null; this.G.toTitle(); }

  fightMenu() {
    if (this.G.netMenu) { this.G.ui.clear(); return; }
    this.G.ui.fightMenu({ onResume: () => this.G.ui.clear(), onLeave: () => this.leave() });
  }

  // ------------------------------------------------------------- each frame
  tick(dt) {
    if (!this.link) return;
    const now = performance.now();
    // a ping a second tells us how far away everyone is (sets the button delay)
    if (this.link.peers.size && now - this.pingT > 1000) { this.pingT = now; this.pingN = (this.pingN + 1) % 1000; this.pingSent = now; this.link.send({ t: 'ping', n: this.pingN }); }
    for (const [s, t] of this.offT) { const t2 = t + dt; this.offT.set(s, t2); if (t2 > FRIEND_GONE) { this.playerLeft(s); return; } }
    const M = this.G.match;
    if (M && M.net) {
      let t = null;
      if (this.link.state === 'retrying') t = 'Reconnecting…';
      else if (this.offT.size) t = "A friend's connection dropped. Waiting for them…";
      else if (!M.net.go && M.stallT > 0.6) t = this.roster.length === 2 ? 'Waiting for your friend to load…' : 'Waiting for everyone to load…';
      else if (M.stallT > 0.45) t = this.roster.length === 2 ? 'Waiting for your friend…' : 'Waiting for your friends…';
      this.G.ui.netBanner(t);
    }
  }
}
