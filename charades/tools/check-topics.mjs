// Checks every deck before it goes live:  node charades/tools/check-topics.mjs
//
// It loads topics/index.js and each deck file the same way the game does,
// and stops with a list of problems if anything would break the game or
// trip the content rules (see topics/README.md).

import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const topics = join(here, '..', 'topics');
const problems = [], notes = [];

// Words that should never be in a deck for 10-12 year olds. A hit isn't
// always wrong (a "beer" in "root beer" is fine), so a person decides: add
// the exact card to ALLOW below once it has been looked at.
const FLAG = [
  'beer', 'wine', 'vodka', 'whisk(e)?y', 'cocktail', 'drunk', 'bar ?tender', 'casino', 'gambl', 'poker', 'cigar', 'smok', 'vape', 'drug',
  'gun', 'rifle', 'pistol', 'shoot', 'bomb', 'grenade', 'knife', 'stab', 'kill', 'murder', 'blood', 'dead', 'die\\b', 'war\\b', 'army', 'soldier',
  'kiss', 'date\\b', 'dating', 'boyfriend', 'girlfriend', 'sexy', 'bikini', 'naked', 'underwear', 'bra\\b',
  'president', 'senator', 'election', 'vote', 'congress', 'politic', 'church', 'god\\b', 'jesus', 'pray',
  'actor', 'actress', 'celebrity', 'movie star', 'pop star', 'influencer', 'tiktok', 'instagram', 'youtube', 'snapchat',
  'iphone', 'ipad', 'xbox', 'playstation', 'nintendo', 'fortnite', 'minecraft', 'roblox', 'disney', 'marvel', 'lego', 'barbie', 'pokemon', 'starbucks', 'mcdonald',
  'stupid', 'dumb', 'idiot', 'fat\\b', 'ugly',
];
const ALLOW = new Set([
  'mummy',       // the Egyptian kind
  'tug-of-war',  // the rope game
]);
const MAX_LEN = 26;   // longer words get too small on a phone held at arm's length
const MIN_CARDS = 40; // a 2-minute round can go through 30+ cards

if (!existsSync(join(topics, 'index.js'))) { console.error('topics/index.js is missing'); process.exit(1); }
const list = (await import(pathToFileURL(join(topics, 'index.js')))).default;
if (!Array.isArray(list)) { console.error('topics/index.js must export a list of file names'); process.exit(1); }

const ids = new Map(), everywhere = new Map();
let total = 0;
for (const name of list) {
  const file = join(topics, name + '.js');
  if (!existsSync(file)) { problems.push(`${name}: no file topics/${name}.js`); continue; }
  let d;
  try { d = (await import(pathToFileURL(file))).default; }
  catch (e) { problems.push(`${name}.js won't load: ${e.message}`); continue; }
  const where = `${name}.js`;
  if (!d || typeof d !== 'object') { problems.push(`${where}: needs "export default { ... }"`); continue; }
  if (!/^[a-z0-9-]{2,30}$/.test(d.id || '')) problems.push(`${where}: id must be lowercase letters, numbers or dashes`);
  if (ids.has(d.id)) problems.push(`${where}: id "${d.id}" is also used by ${ids.get(d.id)}`);
  ids.set(d.id, where);
  if (!d.title || d.title.length > 24) problems.push(`${where}: title missing or longer than 24 letters`);
  if (!d.icon) notes.push(`${where}: no icon (shows a star)`);
  if (d.color && !/^#[0-9a-f]{6}$/i.test(d.color)) problems.push(`${where}: color must look like #1a2b3c`);
  if (!Array.isArray(d.cards)) { problems.push(`${where}: cards must be a list`); continue; }
  if (d.cards.length < MIN_CARDS) problems.push(`${where}: only ${d.cards.length} cards (needs at least ${MIN_CARDS})`);
  const mine = new Set();
  for (const c of d.cards) {
    if (typeof c !== 'string' || !c.trim()) { problems.push(`${where}: a card is empty or not text`); continue; }
    const k = c.trim().toLowerCase();
    if (c !== c.trim()) problems.push(`${where}: "${c}" has spaces at the start or end`);
    if (mine.has(k)) problems.push(`${where}: "${c}" is in the deck twice`);
    mine.add(k);
    if (everywhere.has(k) && everywhere.get(k) !== where) problems.push(`${where}: "${c}" is also in ${everywhere.get(k)} (Shuffle all would show it twice)`);
    everywhere.set(k, where);
    if (c.length > MAX_LEN) problems.push(`${where}: "${c}" is ${c.length} letters (keep it to ${MAX_LEN})`);
    if (/[<>]/.test(c)) problems.push(`${where}: "${c}" has < or >`);
    if (!ALLOW.has(k)) for (const f of FLAG) if (new RegExp('\\b' + f, 'i').test(c)) { problems.push(`${where}: "${c}" needs a look (matches "${f}"); if it's fine, add it to ALLOW in this file`); break; }
  }
  total += d.cards.length;
  notes.push(`${d.icon || '?'} ${d.title}: ${d.cards.length} cards`);
}

console.log(notes.join('\n'));
console.log(`${list.length} decks, ${total} cards`);
if (problems.length) { console.error('\nProblems:\n- ' + problems.join('\n- ')); process.exit(1); }
console.log('All decks look good.');
