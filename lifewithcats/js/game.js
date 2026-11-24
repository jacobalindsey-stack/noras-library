// Life with Cats — the household: money, the clock, the to-do notes on the
// fridge, levels, the save file, and the weather out of the window.
import { ROOMS } from './house.js';
import { ITEMS } from './items.js';
import { MEMES, MEME, PERS, BREEDS, COATS, makeCat, offers, stray } from './catdata.js';
import { rng, clamp, lerp, mix, pick, hashStr, smooth, weighted } from './util.js';

export const SAVE_KEY = 'lifewithcats.save.v1';
export const PHOTO_KEY = 'lifewithcats.photos.v1';
export const DAY_START = 7 * 60, DAY_END = 23 * 60, WORK_START = 9 * 60, WORK_END = 17 * 60;
export const SEC_PER_HOUR = 7.5; // a day (7am to 11pm) lasts two minutes
export const BOND = [0, 15, 40, 75, 120, 175, 240, 320, 410, 510, 620];
export const hearts = b => { let h = 0; while (h < 10 && b >= BOND[h + 1]) h++; return h; };
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

export function xpFor(level) { return Math.round(50 + 35 * (level - 1) + 6 * (level - 1) ** 2); }

function defaultSave() {
  return {
    v: 1, started: Date.now(), day: 1, minute: DAY_START, bleps: 120, xp: 0, level: 1, followers: 0,
    rooms: ROOMS.map((r, i) => i === 0), cats: [], items: [], upgrades: {},
    pantry: { kibble: 12, wet: 2, fancy: 0, treats: 6, catnip: 0 },
    wear: {}, messes: [], floorGifts: [], gifts: {}, memes: {}, catalogue: {},
    goals: [], goalsDone: 0, tut: 0,
    stats: { pets: 0, plays: 0, feeds: 0, catches: 0, mischief: 0, cleans: 0, posts: 0, photos: 0, likes: 0, adopted: 0, days: 0, bestPost: 0, treats: 0, brushes: 0, trims: 0, scoops: 0 },
    today: { wage: 0, lost: 0, posts: 0, likes: 0, catches: 0, mischief: 0, purrs: 0, bleps: 0, followers: 0, events: [] },
    weather: 'clear', strayPending: null, offersDay: 0, adoptedToday: {},
    settings: { music: true, sfx: true, quality: 'auto', motion: true },
  };
}
export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY); if (!raw) return null;
    const s = JSON.parse(raw); if (!s || s.v !== 1) return null;
    // fill in anything newer versions added
    const d = defaultSave();
    for (const k in d) if (s[k] === undefined) s[k] = d[k];
    for (const k in d.stats) if (s.stats[k] === undefined) s.stats[k] = 0;
    for (const k in d.today) if (s.today[k] === undefined) s.today[k] = d.today[k];
    for (const k in d.pantry) if (s.pantry[k] === undefined) s.pantry[k] = 0;
    for (const k in d.settings) if (s.settings[k] === undefined) s.settings[k] = d.settings[k];
    while (s.rooms.length < ROOMS.length) s.rooms.push(false);
    // notes from an earlier version that asked for posting photos are retired
    s.goals = s.goals.filter(g => G[g.type]);
    return s;
  } catch (e) { return null; }
}

// ----------------------------------------------------------------- goals
const G = {
  feed: { ev: 'feed', text: g => `Fill the food bowl${g.n > 1 ? ` ${g.n} times` : ''}`, n: [1, 2, 3] },
  pet: { ev: 'pet', text: g => g.cat ? `Pet ${g.catName} until they purr` : g.n > 1 ? `Give ${g.n} petting sessions` : 'Pet a cat until they purr', n: [1, 2, 3], perCat: true },
  play: { ev: 'play', text: g => g.cat ? `Play with ${g.catName}` : g.n > 1 ? `Play with the cats ${g.n} times` : 'Play with a cat', n: [1, 2, 3], perCat: true },
  brush: { ev: 'brush', text: g => g.cat ? `Brush ${g.catName}` : g.n > 1 ? `Brush the cats ${g.n} times` : 'Brush a cat', n: [1, 2], perCat: true, level: 2 },
  treat: { ev: 'treat', text: g => `Give ${g.n} treats`, n: [2, 3, 4] },
  trim: { ev: 'trim', text: g => g.cat ? `Trim ${g.catName}’s claws` : `Trim claws ${g.n} times`, n: [1, 2], perCat: true, level: 2 },
  scoop: { ev: 'scoop', text: g => `Scoop the litter box${g.n > 1 ? ` ${g.n} times` : ''}`, n: [1, 2] },
  clean: { ev: 'clean', text: g => `Clean up ${g.n} mess${g.n > 1 ? 'es' : ''}`, n: [1, 2, 3], level: 2 },
  catch: { ev: 'catch', text: g => `Catch ${g.n} cat${g.n > 1 ? 's' : ''} mid-mischief`, n: [1, 2, 3], level: 2 },
  photo: { ev: 'photo', text: g => `Take ${g.n > 1 ? g.n + ' photos' : 'a photo'}`, n: [1, 2] },
  meme: { ev: 'meme', text: g => `Photograph “${MEME[g.meme].name}”`, n: [1], level: 2 },
  keep: { ev: 'keep', text: g => `Put ${g.n > 1 ? g.n + ' photos' : 'a photo'} in the scrapbook`, n: [1, 2], level: 2 },
  happy: { ev: 'happy', text: g => `Make every cat happy at once`, n: [1], level: 3 },
  bond: { ev: 'bond', text: g => `Reach ${g.n} hearts with ${g.catName}`, perCat: true, level: 2, max: true },
  buy: { ev: 'buy', text: g => `Buy something for the cats`, n: [1] },
  adopt: { ev: 'adopt', text: g => `Welcome a new cat home`, n: [1], level: 2 },
  gift: { ev: 'gift', text: g => `Collect a present from a cat`, n: [1], level: 3 },
  room: { ev: 'room', text: g => `Open up a new room`, n: [1], level: 2 },
};
const TUTORIAL = [
  { type: 'feed', n: 1, text: 'Fill the food bowl (tap it)', reward: { bleps: 15, xp: 10 } },
  { type: 'pet', n: 1, cat: true, reward: { bleps: 15, xp: 10 } },
  { type: 'play', n: 1, cat: true, reward: { bleps: 20, xp: 12 } },
  { type: 'scoop', n: 1, text: 'Scoop the litter box (tap it)', reward: { bleps: 15, xp: 10 } },
  { type: 'photo', n: 1, text: 'Take a photo (camera button)', reward: { bleps: 20, xp: 12 } },
  { type: 'buy', n: 1, text: 'Buy a scratching post to save the sofa', reward: { bleps: 20, xp: 15 } },
];

export class Game {
  constructor(save) {
    this.s = save || defaultSave();
    this.fresh = !save;
    this.L = {};
    this.paused = false;
    this.speed = 1;
    this.cozy = 50;
  }
  on(ev, fn) { (this.L[ev] ||= []).push(fn); }
  emit(ev, d) { for (const fn of this.L[ev] || []) fn(d); for (const fn of this.L['*'] || []) fn(ev, d); this.goalEvent(ev, d); }
  persist() { try { this.s.saved = Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(this.s)); } catch (e) {} }

  // ------------------------------------------------------------ money & xp
  can(n) { return this.s.bleps >= n; }
  spend(n) { if (this.s.bleps < n) return false; this.s.bleps -= n; this.emit('money', -n); return true; }
  earn(n, why) { n = Math.round(n); if (!n) return; this.s.bleps += n; this.s.today.bleps += n; this.emit('money', n); }
  xp(n) {
    n = Math.round(n); if (!n) return;
    this.s.xp += n; this.s.today.purrs += n; this.emit('xp', n);
    while (this.s.xp >= xpFor(this.s.level)) {
      this.s.xp -= xpFor(this.s.level); this.s.level++;
      const gift = 20 + this.s.level * 10;
      this.s.bleps += gift;
      const unlocks = Object.entries(ITEMS).filter(([k, it]) => it.level === this.s.level).map(([k, it]) => it.name);
      const rooms = ROOMS.filter(r => r.level === this.s.level).map(r => r.name);
      if (this.s.level === 5) unlocks.push('Featherstone Pedigrees (breeders)');
      this.emit('levelup', { level: this.s.level, gift, unlocks: [...unlocks, ...rooms] });
    }
  }
  get capacity() { return 2 * this.s.rooms.filter(Boolean).length; }
  roomsOpen() { return this.s.rooms.map((o, i) => o ? i : -1).filter(i => i >= 0); }

  // ------------------------------------------------------------ the clock
  get minute() { return this.s.minute; }
  get season() { return SEASONS[Math.floor((this.s.day - 1) / 7) % 4]; }
  get dayName() { return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][this.s.day % 7]; }
  tick(dt) {
    if (this.paused) return 0;
    const gm = dt * 60 / SEC_PER_HOUR * this.speed;
    const before = this.s.minute;
    this.s.minute = Math.min(DAY_END, this.s.minute + gm);
    // the day job: paid by the hour, unless a cat is sitting on the laptop
    const workMins = Math.max(0, Math.min(this.s.minute, WORK_END) - Math.max(before, WORK_START));
    if (workMins > 0) {
      const perMin = this.wageRate() / 480;
      if (this.laptopBlocked) this.s.today.lost += perMin * workMins; else this.s.today.wage += perMin * workMins;
    }
    for (const h of [8 * 60, 12 * 60, 18 * 60]) if (before < h && this.s.minute >= h) this.emit('meal', h);
    if (before < WORK_END && this.s.minute >= WORK_END) this.emit('workdone', { wage: Math.round(this.s.today.wage) });
    if (this.s.minute >= DAY_END && before < DAY_END) this.emit('dayend');
    return gm;
  }
  wageRate() { return 26 + this.s.level * 4; }
  env() {
    const m = this.s.minute, h = m / 60;
    const day = smooth(clamp((h - 6) / 2, 0, 1)) * (1 - smooth(clamp((h - 18.6) / 2.2, 0, 1)));
    const warm = clamp(1 - Math.abs(h - 13) / 5.5, 0, 1);
    const warmth = Math.max(0, 1 - warm) * day * 0.9 + (h > 17 ? 0.15 : 0);
    const lamps = smooth(clamp((h - 17.6) / 1.8, 0, 1)) + (this.s.weather === 'rain' ? 0.45 : 0) * (1 - smooth(clamp((h - 17.6) / 1.8, 0, 1)));
    const K = [[6, '#3a4468', '#8a7a8a'], [7.2, '#9fb3c8', '#f0c49a'], [9.5, '#8fb3d0', '#e4ece6'], [14, '#86acd0', '#e2ebe4'], [17.2, '#94a8c6', '#f0cc98'], [19.2, '#53628e', '#e29a76'], [20.6, '#26304e', '#4a4f78'], [24, '#1c2440', '#30365a']];
    let a = K[0], b = K[K.length - 1];
    for (let i = 0; i < K.length - 1; i++) if (h >= K[i][0] && h <= K[i + 1][0]) { a = K[i]; b = K[i + 1]; break; }
    const t = clamp((h - a[0]) / Math.max(0.001, b[0] - a[0]), 0, 1);
    let skyTop = mix(a[1], b[1], t), skyBot = mix(a[2], b[2], t);
    const w = this.s.weather;
    if (w === 'rain') { skyTop = mix(skyTop, '#7d868e', 0.6); skyBot = mix(skyBot, '#9aa2a6', 0.6); }
    if (w === 'snow') { skyTop = mix(skyTop, '#b8c4cc', 0.5); skyBot = mix(skyBot, '#e2e8ec', 0.5); }
    const night = 1 - day;
    let tint = mix('#2c3454', '#ffffff', Math.pow(day, 0.8));
    tint = mix(tint, '#ffd2a6', warmth * 0.5);
    if (w === 'rain') tint = mix(tint, '#9aa4aa', 0.35);
    const fire = Math.max(lamps, this.season === 'winter' ? 0.8 : this.season === 'autumn' ? 0.35 : 0) * (this.s.rooms[0] ? 1 : 0);
    return { minutes: m, daylight: day, warmth, lamps: clamp(lamps, 0, 1), fire, skyTop, skyBot, night: clamp(night, 0, 1), tint, season: this.season, weather: w };
  }

  // ------------------------------------------------------------ goals
  goalEvent(ev, d) {
    let changed = false;
    for (const g of this.s.goals) {
      if (g.done) continue;
      const def = G[g.type]; if (!def || def.ev !== ev) continue;
      if (g.cat && d && d.cat && d.cat !== g.cat) continue;
      if (g.cat && (!d || !d.cat) && ev !== 'bond') continue;
      if (g.type === 'meme' && (!d || !d.memes || !d.memes.includes(g.meme))) continue;
      if (def.max) { const v = d && d.value || 0; if (g.type === 'bond' && d.cat !== g.cat) continue; g.prog = Math.max(g.prog, v); }
      else g.prog += 1;
      if (g.prog >= g.n) { g.done = true; changed = true; this.earn(g.reward.bleps); this.xp(g.reward.xp); this.s.goalsDone++; this.emit('goaldone', g); }
    }
    if (changed) { this.s.goals = this.s.goals.filter(g => !g.done); this.fillGoals(); this.emit('goals'); }
  }
  fillGoals() {
    const s = this.s, cats = s.cats;
    while (s.goals.length < 3) {
      let g;
      if (s.tut < TUTORIAL.length) {
        const t = TUTORIAL[s.tut++];
        g = { type: t.type, n: t.n, prog: 0, reward: t.reward, fixed: t.text };
        if (t.cat && cats[0]) { g.cat = cats[0].id; g.catName = cats[0].name; }
      } else g = this.newGoal();
      if (!g) break;
      g.id = 'g' + Date.now() + Math.floor(Math.random() * 1e4);
      g.text = g.fixed || G[g.type].text(g);
      s.goals.push(g);
    }
  }
  newGoal() {
    const s = this.s, L = s.level, r = Math.random;
    const active = new Set(s.goals.map(g => g.type));
    const types = Object.keys(G).filter(k => !active.has(k) && (G[k].level || 1) <= L).filter(k => {
      if (k === 'adopt') return s.cats.length < this.capacity;
      if (k === 'room') return s.rooms.some((o, i) => !o && ROOMS[i].level <= L + 1);
      if (k === 'gift') return s.cats.some(c => hearts(c.bond) >= 2);
      if (k === 'bond') return s.cats.some(c => hearts(c.bond) < 10);
      if ((G[k].perCat || k === 'bond') && !s.cats.length) return false;
      return true;
    });
    const type = weighted(types, k => ({ feed: 1.2, pet: 1.4, play: 1.4, meme: 1.6, catch: 1.3, keep: 0.8, bond: 1, buy: 0.6, adopt: 0.8, room: 0.5, happy: 0.7 }[k] ?? 1), r);
    if (!type) return null;
    const def = G[type];
    const g = { type, prog: 0, n: def.n ? def.n[Math.min(def.n.length - 1, Math.floor(r() * Math.min(def.n.length, 1 + L / 3)))] : 1 };
    if (def.perCat && (r() < 0.65 || type === 'bond')) { const c = pick(type === 'bond' ? s.cats.filter(c => hearts(c.bond) < 10) : s.cats, r); g.cat = c.id; g.catName = c.name; if (type === 'bond') { g.n = Math.min(10, hearts(c.bond) + 1); g.prog = hearts(c.bond); } }
    if (type === 'meme') {
      const easy = ['loaf', 'groom', 'meow', 'sunbeam', 'judge', 'sploot', 'fits', 'biscuits', 'trap', 'blep', 'perch', 'zoomies', 'regret', 'keyboard', 'tv', 'kitten', 'void', 'brain', 'chonk', 'pile', 'blink', 'gift', 'floof', 'hide', 'laundry', 'loafpile', 'ride', 'cucumber'];
      const can = easy.filter(m => !s.memes[m] && this.memePossible(m));
      g.meme = can.length ? can[Math.floor(r() * Math.min(can.length, 4))] : pick(easy.filter(m => this.memePossible(m)), r);
    }
    const base = { feed: 10, pet: 12, play: 14, brush: 14, treat: 10, trim: 16, scoop: 10, clean: 12, catch: 18, photo: 12, meme: 30, keep: 14, happy: 35, bond: 30, buy: 15, adopt: 30, gift: 25, room: 50 }[type] || 15;
    const scale = 1 + (L - 1) * 0.18;
    // more steps, a bit more reward (but a target like "reach 5 hearts" is not 5 steps)
    const steps = def.max ? 1 : Math.min(g.n, 5);
    g.reward = { bleps: Math.round(base * scale * (1 + 0.3 * (steps - 1))), xp: Math.round(base * 0.8 * (1 + L * 0.06)) };
    return g;
  }
  memePossible(m) {
    const s = this.s, cats = s.cats;
    if (m === 'kitten') return cats.some(c => c.age === 'kitten');
    if (m === 'void') return cats.some(c => c.coat === 'black');
    if (m === 'brain') return cats.some(c => c.coat === 'orange' || c.coat === 'orangewhite');
    if (m === 'chonk') return false;
    if (m === 'pile' || m === 'loafpile') return cats.length >= 2;
    if (m === 'keyboard' || m === 'regret') return true;
    if (m === 'tv') return s.items.some(i => i.kind === 'tank' || i.kind === 'feeder');
    if (m === 'hide') return s.items.some(i => i.kind === 'tunnel') || s.rooms[4];
    if (m === 'laundry') return s.rooms[2];
    if (m === 'ride') return !!s.upgrades.vacuum;
    if (m === 'floof') return cats.some(c => BREEDS[c.breed].fluff > 0.3);
    if (m === 'gift') return cats.some(c => hearts(c.bond) >= 2);
    if (m === 'blink') return cats.some(c => hearts(c.bond) >= 3);
    if (m === 'cucumber') return s.rooms[1];
    return true;
  }

  // ------------------------------------------------------------ the day
  startDay() {
    const s = this.s;
    s.today = { wage: 0, lost: 0, posts: 0, likes: 0, catches: 0, mischief: 0, purrs: 0, bleps: 0, followers: 0, events: [] };
    s.adoptedToday = {};
    // weather: a little rain, snow in winter
    const r = rng(hashStr('wx' + s.day));
    const season = this.season;
    s.weather = season === 'winter' ? (r() < 0.5 ? 'snow' : 'clear') : (r() < (season === 'autumn' ? 0.3 : 0.18) && s.day > 2 ? 'rain' : 'clear');
    this.emit('daystart');
  }
  // returns the summary of the day that just ended
  endDay(agents) {
    const s = this.s;
    const wage = Math.round(s.today.wage), lost = Math.round(s.today.lost);
    this.earn(wage);
    const sum = { day: s.day, wage, lost, purrs: s.today.purrs, catches: s.today.catches, mischief: s.today.mischief, moments: s.today.moments || 0, events: [] };
    s.stats.days++;
    // overnight
    for (const c of s.cats) {
      c.needs.energy = 100; c.needs.food = Math.max(5, c.needs.food - 22); c.needs.fun = Math.max(5, c.needs.fun - 10); c.needs.love = Math.max(5, c.needs.love - 8); c.needs.tidy = Math.max(5, c.needs.tidy - 4);
      c.bladder = Math.min(80, (c.bladder || 0) + 30);
      c.treatsToday = 0;
      c.ageDays = (c.ageDays || 0) + 1;
      if (c.age === 'kitten' && c.ageDays >= 8) { c.age = 'adult'; sum.events.push(`${c.name} isn't a kitten any more!`); c.grew = true; }
      // a slow drift back toward a healthy weight
      if (c.weight > 46) c.weight -= 0.6; else if (c.weight < 34) c.weight += 0.8;
      c.health = clamp(c.health + (c.weight > 80 ? -6 : 4) + (c.needs.food < 15 ? -5 : 0), 20, 100);
    }
    // night happenings
    const r = rng(hashStr('night' + s.day));
    if (s.cats.length) {
      const c = pick(s.cats, r), roll = r();
      if (roll < 0.22) sum.events.push(`${c.name} had the zoomies at 3am. You heard everything.`);
      else if (roll < 0.4 && hearts(c.bond) >= 2) { sum.events.push(`${c.name} slept on your feet all night.`); c.bond += 4; }
      else if (roll < 0.52 && PERS[c.pers].chatty) sum.events.push(`${c.name} sang to the moon at 4am.`);
      else if (roll < 0.64) sum.events.push(`${c.name} brought you a present. It's by the bed.`);
    }
    s.day++; s.minute = DAY_START;
    if (s.day % 7 === 1) sum.events.push(`It's ${this.season} now.`);
    this.persist();
    return sum;
  }
  strayChance() {
    const s = this.s;
    if (s.cats.length >= this.capacity) return 0;
    if (s.cats.length === 0) return 1;
    return clamp(0.16 + this.cozy * 0.0025 + (s.items.some(i => i.kind === 'box') ? 0.05 : 0), 0, 0.45);
  }
  offersFor(source) { return offers(source, this.s.day, this.s.level).filter(c => !this.s.adoptedToday[c.id + source]); }
}
export { G as GOALS, makeCat, stray };
