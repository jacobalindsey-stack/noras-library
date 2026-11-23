// NUBBINS — the online flow: make or join a room, both pick a bear, the room
// maker picks the arena, fight, then rematch, new bears or leave. Nothing the
// other player sends is ever shown as text: only bear and arena keys that this
// game already knows, checked against its own lists.
import { Link, Lockstep, newCode, PROTO } from './net.js';
import { BY_KEY } from './roster.js';
import { STAGES, SECRET_STAGES, STAGE_BY_KEY } from './stages.js';
import { sfx, playMusic } from './audio.js';

const FRIEND_GONE = 45; // seconds to wait for a friend whose connection dropped

export class Online {
  constructor(G) {
    this.G = G; this.link = null; this.seat = -1;
    this.mode = 'menu'; this.picks = [null, null]; this.votes = [null, null];
    this.mid = 0; this.ls = null; this.rtt = []; this.pingN = 0; this.pingT = 0;
    this.peerOn = false; this.peerOffT = 0; this.together = false;
  }

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
    this.seat = link.seat; this.code = code; this.mode = 'room';
    if (!this.together) this.G.ui.onlineRoom(code, () => this.menu());
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
      const why = { noroom: 'No room with those letters. Check them with your friend?', full: 'That room already has two players in it.', net: "Couldn't reach the game room. Is the internet on?" }[e.message] || "Couldn't get into that room. Try again?";
      this.joinScreen(why, code); return;
    }
    if (link !== this.link) return;
    this.seat = link.seat; this.code = code;
  }

  openLink(code, how) {
    this.closeLink();
    this.together = false; this.peerOn = false; this.picks = [null, null]; this.votes = [null, null]; this.rtt = [];
    const link = new Link(code, how, {
      onPeer: (on, left) => { if (link === this.link) this.onPeer(on, left); },
      onMsg: o => { if (link === this.link) this.onMsg(o); },
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
    const text = why === 'net' ? "Couldn't reach the game room. Is the internet on?" : 'The connection to the game room was lost.';
    this.G.ui.onlineMsg('UH OH', text, [['OK', 'gold', () => this.menu()]]);
    this.mode = 'menu';
  }

  friendLeft() {
    if (this.mode === 'gone') return;
    this.closeLink();
    this.G.endFight(); this.G.loadStage('sill'); this.G.showMenuScene('select', [null, null]);
    this.G.ui.onlineMsg('YOUR FRIEND LEFT', 'The room is closed now. You can make a new one any time.', [['OK', 'gold', () => this.menu()]]);
    sfx('back');
    this.mode = 'menu';
  }

  // ------------------------------------------------------- friend in and out
  onPeer(on, left) {
    this.peerOn = on; this.seat = this.link.seat;
    if (!on && left && this.together) { this.friendLeft(); return; }
    if (!on) { this.peerOffT = 0; if (this.together && this.mode !== 'fight') this.G.ui.toast("Your friend's connection dropped. Waiting for them…", 4); return; }
    if (this.together) { if (this.mode !== 'fight') this.G.ui.toast('Your friend is back!'); this.resendState(); return; }
    if (!this.together) {
      this.together = true;
      this.link.send({ t: 'hi', v: PROTO });
      sfx('confirm');
      this.pickPhase();
    }
  }

  onMsg(o) {
    if (this.ls && this.ls.take(o)) return;
    const other = 1 - this.seat;
    switch (o.t) {
      case 'hi':
        if (o.v !== PROTO) { this.closeLink(); this.G.ui.onlineMsg('DIFFERENT VERSIONS', 'One of you has an older copy of the game. Both of you reload the page, then try again.', [['OK', 'gold', () => this.menu()]]); this.mode = 'menu'; }
        break;
      case 'ping': this.link.send({ t: 'pong', n: o.n }); break;
      case 'pong': if (o.n === this.pingN && this.pingSent) { this.rtt.push(performance.now() - this.pingSent); if (this.rtt.length > 7) this.rtt.shift(); this.pingSent = 0; } break;
      case 'pick':
        if (typeof o.k !== 'string' || !BY_KEY[o.k]) break;
        this.picks[other] = o.k;
        if (this.mode === 'pick') this.G.ui.toast('Your friend picked ' + BY_KEY[o.k].name + '!');
        if (this.mode === 'pickWait') this.afterPick();
        break;
      case 'unpick':
        this.picks[other] = null;
        if (this.mode === 'arena' || this.mode === 'pickWait' || this.mode === 'arenaWait') this.afterPick();
        break;
      case 'start': {
        if (this.seat !== 1 || !Array.isArray(o.p) || o.p.length !== 2 || !o.p.every(k => typeof k === 'string' && BY_KEY[k])) break;
        if (typeof o.st !== 'string' || !STAGE_BY_KEY[o.st] || !Number.isInteger(o.m) || o.m <= this.mid || !Number.isInteger(o.d) || o.d < 2 || o.d > 12) break;
        this.beginMatch(o.m, o.p.slice(), o.st, o.d);
        break;
      }
      case 'again': case 'repick':
        this.votes[other] = o.t;
        if (o.t === 'repick' && this.mode === 'results') this.pickPhase();
        else this.checkVotes();
        break;
      case 'bye': this.friendLeft(); break;
      default: break;
    }
  }

  // ------------------------------------------------------------- picking
  // fresh: a new round of picking for both; otherwise only I am choosing again
  pickPhase(fresh = true) {
    if (fresh) { this.picks = [null, null]; this.votes = [null, null]; } else this.picks[this.seat] = null;
    this.mode = 'pick';
    this.G.endFight();
    this.G.pickChar({
      heading: 'PICK YOUR GUMMY', picker: this.seat, youTag: true,
      onBack: () => this.leaveAsk(() => this.pickPhase(false)),
      onPick: k => {
        if (this.mode !== 'pick') return;
        this.picks[this.seat] = k; this.link.send({ t: 'pick', k });
        this.afterPick();
      },
    });
  }

  afterPick() {
    const me = this.picks[this.seat], them = this.picks[1 - this.seat];
    if (!me) { if (this.mode !== 'pick') this.pickPhase(false); return; }
    this.G.loadStage('sill'); this.G.showMenuScene('select', this.picks.slice());
    const unpick = ['◀ CHANGE MY BEAR', 'alt small', () => { this.link.send({ t: 'unpick' }); this.pickPhase(false); }];
    if (!them) { this.mode = 'pickWait'; this.G.ui.onlinePair(this.picks, this.seat, 'Waiting for your friend to pick', [unpick]); return; }
    if (this.seat === 0) {
      this.mode = 'arena';
      const list = this.G.save.unlocked.gummoth ? [...STAGES, ...SECRET_STAGES] : STAGES;
      this.G.ui.stageSelect(list, st => this.hostStart(st), unpick[2]);
    } else {
      this.mode = 'arenaWait';
      this.G.ui.onlinePair(this.picks, this.seat, 'Your friend is picking the arena', [unpick]);
    }
  }

  delay() {
    const r = this.rtt.slice().sort((a, b) => a - b);
    const rtt = r.length ? r[r.length >> 1] : 120;
    return Math.max(2, Math.min(9, Math.ceil((rtt / 2 + 12) / (1000 / 60)) + 1));
  }

  hostStart(stage) {
    if (this.seat !== 0 || !this.picks[0] || !this.picks[1]) return;
    this.lastStage = stage;
    const m = this.mid + 1, d = this.delay();
    this.link.send({ t: 'start', m, p: this.picks.slice(), st: stage, d });
    this.beginMatch(m, this.picks.slice(), stage, d);
  }

  async beginMatch(mid, picks, stage, delay) {
    this.mid = mid; this.mode = 'fight'; this.votes = [null, null]; this.picks = picks.slice(); this.lastStage = stage;
    const L = new Lockstep(this.link, mid, this.seat, delay);
    this.ls = L;
    this.G.showMenuScene(null, null);
    await this.G.ui.versus(picks[0], picks[1], 1600);
    if (this.ls !== L || this.mode !== 'fight') return;
    const G = this.G;
    G.startFight({
      p1: picks[0], p2: picks[1], humans: [this.seat === 0, this.seat === 1], mode: 'vs', stage, level: 1,
      net: { ls: L, local: this.seat, role: this.seat === 0 ? 'host' : 'guest', go: false, loaded: true },
      netBot: !!G.testAuto,
      onEnd: res => this.matchOver(res),
    });
    this.link.send({ t: 'loaded', m: mid });
  }

  matchOver(res) {
    if (this.mode !== 'fight') return;
    this.mode = 'results';
    if (this.ls) this.ls.flush(true);
    this.G.recordResult(res, [this.seat === 0, this.seat === 1]);
    this.G.endFight(); this.G.showMenuScene('select', this.picks.slice());
    this.lastResult = res;
    this.setWait = this.G.ui.onlineResults(res, this.seat, {
      onAgain: () => this.vote('again'),
      onRepick: () => this.vote('repick'),
      onLeave: () => this.leave(),
    });
    if (this.votes[1 - this.seat] === 'repick') { this.pickPhase(); return; }
    this.checkVotes();
  }

  vote(v) {
    if (this.mode !== 'results') return;
    this.votes[this.seat] = v;
    this.link.send({ t: v });
    if (v === 'repick') { this.pickPhase(); return; }
    this.checkVotes();
  }

  checkVotes() {
    if (this.mode !== 'results') return;
    const [a, b] = this.votes, mine = this.votes[this.seat], theirs = this.votes[1 - this.seat];
    if (a === 'again' && b === 'again') {
      if (this.seat === 0) { const m = this.mid + 1, d = this.delay(); this.link.send({ t: 'start', m, p: this.picks.slice(), st: this.lastStage, d }); this.beginMatch(m, this.picks.slice(), this.lastStage, d); }
      else this.setWait && this.setWait('Starting the rematch');
      return;
    }
    if (mine === 'again') this.setWait && this.setWait('Waiting for your friend');
    else if (theirs === 'again') this.setWait && this.setWait('Your friend wants a rematch!');
  }

  // after either side's connection blipped, say again whatever may have been lost
  resendState() {
    const L = this.link; if (!L) return;
    const mine = this.picks[this.seat];
    if (['pick', 'pickWait', 'arena', 'arenaWait'].includes(this.mode)) L.send(mine ? { t: 'pick', k: mine } : { t: 'unpick' });
    if (this.mode === 'fight' && this.ls) {
      if (this.seat === 0) L.send({ t: 'start', m: this.mid, p: this.picks.slice(), st: this.lastStage, d: this.ls.D });
      L.send({ t: 'loaded', m: this.mid });
      this.ls.flush(true);
    }
    if (this.mode === 'results' && this.votes[this.seat]) L.send({ t: this.votes[this.seat] });
  }

  // --------------------------------------------------------------- leaving
  leaveAsk(back) {
    this.G.ui.onlineMsg('LEAVE THE ROOM?', 'Your friend will have to make a new room to play again.', [['STAY', 'gold', back], ['LEAVE', 'small', () => this.leave()]]);
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
    // a ping a second tells us how far away the friend is (sets the button delay)
    if (this.together && now - this.pingT > 1000) { this.pingT = now; this.pingN = (this.pingN + 1) % 1000; this.pingSent = now; this.link.send({ t: 'ping', n: this.pingN }); }
    if (this.together && !this.peerOn) { this.peerOffT += dt; if (this.peerOffT > FRIEND_GONE) { this.friendLeft(); return; } }
    const M = this.G.match;
    if (M && M.net) {
      let t = null;
      if (this.link.state === 'retrying') t = 'Reconnecting…';
      else if (!this.peerOn) t = "Your friend's connection dropped. Waiting for them…";
      else if (!M.net.go && M.stallT > 0.6) t = 'Waiting for your friend to load…';
      else if (M.stallT > 0.45) t = 'Waiting for your friend…';
      this.G.ui.netBanner(t);
    }
  }
}
