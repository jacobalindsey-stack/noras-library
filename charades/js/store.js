// What the game remembers on this device, in one browser-storage entry.
// Never rename the key or change the shape without carrying old saves over.

const KEY = 'charades.save.v1';

const blank = () => ({
  v: 1,
  names: [],                                   // last players on this device
  set: { secs: 60, turns: 1 },                 // last round length and turns each
  prefs: { sound: true, buzz: true, controls: 'tilt', nod: 'normal' },
  history: [],                                 // finished games, newest first
  seen: {},                                    // deck id -> words shown lately
  dev: null, key: null,                        // this device's id for online rooms
  room: null,                                  // { code, at } the last online room
  me: [],                                      // who plays on this device in online rooms
  game: null,                                  // a game on this phone that isn't finished
});

let data = null;

export function load() {
  if (data) return data;
  let d = null;
  try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; }
  const b = blank();
  if (!d || typeof d !== 'object') d = b;
  // fill in anything missing (older saves, or a damaged entry)
  for (const k of Object.keys(b)) if (d[k] === undefined || d[k] === null && b[k] !== null) d[k] = b[k];
  d.prefs = { ...b.prefs, ...(d.prefs || {}) };
  d.set = { ...b.set, ...(d.set || {}) };
  if (!Array.isArray(d.history)) d.history = [];
  if (!Array.isArray(d.names)) d.names = [];
  if (typeof d.seen !== 'object' || !d.seen) d.seen = {};
  if (!d.dev) {
    const r = n => [...crypto.getRandomValues(new Uint8Array(n))].map(x => x.toString(16).padStart(2, '0')).join('');
    d.dev = 'd' + r(6); d.key = r(12);
  }
  data = d;
  save();
  return data;
}

let saveT = 0;
export function save(soon) {
  if (!data) return;
  const write = () => { saveT = 0; try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} };
  if (soon) { if (!saveT) saveT = setTimeout(write, 400); }
  else { if (saveT) clearTimeout(saveT); write(); }
}

// A finished game, written once as a scorecard.
export function addScorecard(card) {
  load();
  if (data.history.some(h => h.id === card.id)) return;
  data.history.unshift(card);
  if (data.history.length > 40) data.history.length = 40;
  save();
}
