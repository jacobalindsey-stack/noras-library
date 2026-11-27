// The rules of a game, as one function: reduce(state, op, from, now).
//
// The same file runs in two places:
//   - in the browser, for a game on one phone (from is 'local');
//   - in worker/index.js, where the online room applies every device's
//     moves in order and sends the new state to everyone in the room.
// So it must not touch the page, the clock or random numbers: the caller
// passes `now`, and anything random (which word comes next) arrives inside
// the op from the device that drew it.

export const RULES = 1;
export const LIMITS = { players: 16, devices: 10, name: 14, word: 40, deck: 40 };
export const TIMES = [30, 45, 60, 90, 120];
export const TURNS = [1, 2, 3];

export function freshState(opts = {}) {
  return {
    v: RULES,
    phase: 'lobby',          // lobby | turn | ready | play | results | final
    host: opts.host || null, // device that made the room (online only)
    devs: {},                // device id -> { on: true/false }
    players: [],             // { id, name, dev }
    set: { secs: 60, turns: 1 },
    sched: [],               // player ids in turn order, made at start
    turn: 0,                 // index into sched
    rounds: [],              // finished turns: { pid, deck, title, cards: [{ w, ok, x }], pts, skip }
    cur: null,               // the turn being played
    game: 0,                 // games started in this room
    nextId: 1,
    seq: 0,
  };
}

export const cleanName = s => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, LIMITS.name);
const cleanText = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, n);
const cleanCard = c => (c && typeof c.w === 'string' && c.w.trim()) ? { w: cleanText(c.w, LIMITS.word), x: c.x ? 1 : 0 } : null;

export const playerById = (S, id) => S.players.find(p => p.id === id) || null;
export const currentPlayer = S => (S.sched.length && S.turn < S.sched.length) ? playerById(S, S.sched[S.turn]) : null;
export const roundPoints = cards => cards.reduce((n, c) => n + (c.ok ? (c.x ? 2 : 1) : 0), 0);
export const usedWords = S => {
  const out = new Set();
  for (const r of S.rounds) for (const c of r.cards) out.add(c.w);
  if (S.cur) { for (const c of S.cur.cards) out.add(c.w); if (S.cur.card) out.add(S.cur.card.w); }
  return out;
};

// Totals per player for the game so far, best first, with ranks (ties share).
export function standings(S) {
  const tot = new Map(S.players.map(p => [p.id, 0]));
  for (const r of S.rounds) if (tot.has(r.pid)) tot.set(r.pid, tot.get(r.pid) + r.pts);
  const inGame = new Set(S.sched);
  const rows = S.players.filter(p => inGame.has(p.id)).map(p => ({ id: p.id, name: p.name, pts: tot.get(p.id) || 0 }));
  rows.sort((a, b) => b.pts - a.pts);
  let rank = 0, last = null;
  rows.forEach((r, i) => { if (r.pts !== last) { rank = i + 1; last = r.pts; } r.rank = rank; });
  return rows;
}

// who may do what
const isHost = (S, from) => from === 'local' || from === S.host;
const isActive = (S, from) => from === 'local' || (S.cur && S.cur.dev === from) || (!S.cur && currentPlayer(S) && currentPlayer(S).dev === from);

// Returns { S, err }. S is a new object when something changed, or the same
// object (with err set) when the op was refused.
export function reduce(S0, op, from, now) {
  if (!op || typeof op.t !== 'string') return { S: S0, err: 'bad' };
  const S = JSON.parse(JSON.stringify(S0));
  const no = err => ({ S: S0, err });
  const ok = () => { S.seq++; return { S, err: null }; };

  switch (op.t) {
    // A device says who is playing on it. In the lobby (or after a game) the
    // list is replaced; players keep their id while their name stays the same.
    case 'names': {
      if (!(S.phase === 'lobby' || S.phase === 'final')) return no('busy');
      const names = (Array.isArray(op.names) ? op.names : []).map(cleanName).filter(Boolean);
      const mine = S.players.filter(p => p.dev === from);
      const others = S.players.filter(p => p.dev !== from);
      if (others.length + names.length > LIMITS.players) return no('full');
      const kept = [];
      const seen = new Set();
      for (const n of names) {
        const key = n.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        const was = mine.find(p => p.name.toLowerCase() === key);
        kept.push(was ? { ...was, name: n } : { id: 'p' + (S.nextId++), name: n, dev: from });
      }
      // keep this device's players where they were in the list, add new ones at the end
      const out = [];
      let placed = false;
      for (const p of S.players) {
        if (p.dev !== from) out.push(p);
        else if (!placed) { out.push(...kept); placed = true; }
      }
      if (!placed) out.push(...kept);
      S.players = out;
      if (S.phase === 'final') { /* the scorecard stays; new names play next game */ }
      return ok();
    }

    case 'settings': {
      if (!isHost(S, from)) return no('host');
      if (!(S.phase === 'lobby' || S.phase === 'final')) return no('busy');
      if (TIMES.includes(op.secs)) S.set.secs = op.secs;
      if (TURNS.includes(op.turns)) S.set.turns = op.turns;
      return ok();
    }

    case 'start': {
      if (!isHost(S, from)) return no('host');
      if (!(S.phase === 'lobby' || S.phase === 'final')) return no('busy');
      if (S.players.length < 2) return no('need2');
      S.sched = [];
      for (let r = 0; r < S.set.turns; r++) for (const p of S.players) S.sched.push(p.id);
      S.turn = 0; S.rounds = []; S.cur = null; S.game++; S.startedAt = now;
      S.phase = 'turn';
      return ok();
    }

    // the player whose turn it is picks a deck
    case 'pick': {
      if (S.phase !== 'turn') return no('phase');
      if (!isActive(S, from) && !isHost(S, from)) return no('turn');
      const p = currentPlayer(S);
      if (!p) return no('phase');
      S.cur = { pid: p.id, dev: p.dev, deck: cleanText(op.deck, LIMITS.deck), title: cleanText(op.title, LIMITS.deck), mode: null, ends: 0, left: 0, card: null, cards: [] };
      S.phase = 'ready';
      return ok();
    }

    case 'unpick': {
      if (S.phase !== 'ready') return no('phase');
      if (!isActive(S, from) && !isHost(S, from)) return no('turn');
      S.cur = null; S.phase = 'turn';
      return ok();
    }

    // the round starts. mode 'tilt': the player's own phone is on their
    // forehead and decides. mode 'tap': the others see the word and tap
    // Got it / Pass (a laptop or iPad guessing, or a phone without motion).
    case 'go': {
      if (S.phase !== 'ready' || !S.cur) return no('phase');
      if (!isActive(S, from)) return no('turn');
      const card = cleanCard(op.card);
      if (!card) return no('card');
      S.cur.mode = op.mode === 'tap' ? 'tap' : 'tilt';
      S.cur.ends = now + S.set.secs * 1000;
      S.cur.left = 0;
      S.cur.card = card;
      S.cur.cards = [];
      S.phase = 'play';
      return ok();
    }

    // Got it (ok true) or Pass for the word on screen. The device that marks
    // it also brings the next word, so the next card shows at once.
    case 'mark': {
      if (S.phase !== 'play' || !S.cur || !S.cur.card) return no('phase');
      if (S.cur.left) return no('paused');
      if (from !== 'local') {
        if (S.cur.mode === 'tilt' && from !== S.cur.dev) return no('turn');
        if (S.cur.mode === 'tap' && from === S.cur.dev) return no('turn');
      }
      if (op.w !== S.cur.card.w) return no('stale'); // someone else already marked this card
      if (now > S.cur.ends + 1500) return no('late');
      S.cur.cards.push({ w: S.cur.card.w, ok: !!op.ok, x: S.cur.card.x });
      S.cur.card = cleanCard(op.next);
      return ok();
    }

    case 'pause': {
      if (S.phase !== 'play' || !S.cur || S.cur.left) return no('phase');
      if (!isActive(S, from) && !isHost(S, from)) return no('turn');
      S.cur.left = Math.max(1000, S.cur.ends - now);
      return ok();
    }

    case 'resume': {
      if (S.phase !== 'play' || !S.cur || !S.cur.left) return no('phase');
      if (!isActive(S, from) && !isHost(S, from)) return no('turn');
      S.cur.ends = now + S.cur.left; S.cur.left = 0;
      return ok();
    }

    // time is up (anyone may say so once the clock has run out), or the
    // player or host ends the turn early
    case 'end': {
      if (S.phase !== 'play' || !S.cur) return no('phase');
      const early = isActive(S, from) || isHost(S, from);
      if (!early && (S.cur.left || now < S.cur.ends - 300)) return no('early');
      const c = S.cur;
      S.rounds.push({ pid: c.pid, deck: c.deck, title: c.title, cards: c.cards, pts: roundPoints(c.cards) });
      S.cur = null;
      S.phase = 'results';
      return ok();
    }

    // the host skips a turn (the player's device has gone away)
    case 'skip': {
      if (!isHost(S, from)) return no('host');
      if (!(S.phase === 'turn' || S.phase === 'ready' || S.phase === 'play')) return no('phase');
      const p = currentPlayer(S);
      if (!p) return no('phase');
      const cards = S.cur ? S.cur.cards : [];
      S.rounds.push({ pid: p.id, deck: S.cur ? S.cur.deck : '', title: S.cur ? S.cur.title : '', cards, pts: roundPoints(cards), skip: 1 });
      S.cur = null;
      S.phase = 'results';
      return ok();
    }

    case 'next': {
      if (S.phase !== 'results') return no('phase');
      const last = S.rounds[S.rounds.length - 1];
      const lastP = last && playerById(S, last.pid);
      const nextP = playerById(S, S.sched[S.turn + 1]);
      const mayNext = isHost(S, from) || (lastP && lastP.dev === from) || (nextP && nextP.dev === from);
      if (!mayNext) return no('turn');
      S.turn++;
      S.phase = S.turn >= S.sched.length ? 'final' : 'turn';
      return ok();
    }

    // stop the game early and go to the scorecard
    case 'finish': {
      if (!isHost(S, from)) return no('host');
      if (S.phase === 'lobby' || S.phase === 'final') return no('phase');
      if (S.cur && S.cur.cards.length) S.rounds.push({ pid: S.cur.pid, deck: S.cur.deck, title: S.cur.title, cards: S.cur.cards, pts: roundPoints(S.cur.cards) });
      S.cur = null;
      S.phase = 'final';
      return ok();
    }

    case 'lobby': {
      if (!isHost(S, from)) return no('host');
      S.phase = 'lobby'; S.cur = null; S.sched = []; S.rounds = []; S.turn = 0;
      return ok();
    }

    // online only: the room server calls these itself
    case 'dev': {
      if (from !== 'server') return no('server');
      if (op.on) S.devs[op.id] = { on: true };
      else if (S.devs[op.id]) S.devs[op.id].on = false;
      if (op.host) S.host = op.id;
      return ok();
    }

    case 'drop': { // a device left the room on purpose
      if (from !== 'server') return no('server');
      delete S.devs[op.id];
      if (S.phase === 'lobby' || S.phase === 'final') S.players = S.players.filter(p => p.dev !== op.id);
      return ok();
    }
  }
  return no('unknown');
}
