// Topic decks. Each deck is its own file in ../topics/, listed in
// ../topics/index.js. See ../topics/README.md for how to add one.

import { load, save } from './store.js';

export const MIX = { id: 'mix', title: 'Shuffle all', icon: '🎲', color: '#ffc83d', cards: [] };
export const decks = [];
const byId = new Map();
export const deckById = id => id === MIX.id ? MIX : byId.get(id) || null;

const GOLD_CHANCE = 0.09; // about one card in eleven is a gold card worth 2

export async function loadDecks() {
  let list = [];
  try { list = (await import('../topics/index.js')).default; } catch (e) { console.error('topics/index.js did not load', e); }
  const got = await Promise.allSettled(list.map(name => import(`../topics/${name}.js`)));
  got.forEach((r, i) => {
    if (r.status !== 'fulfilled') { console.error(`topics/${list[i]}.js did not load`, r.reason); return; }
    const d = r.value.default;
    const problem = checkDeck(d);
    if (problem) { console.error(`topics/${list[i]}.js skipped: ${problem}`); return; }
    if (byId.has(d.id)) { console.error(`topics/${list[i]}.js skipped: id "${d.id}" is used twice`); return; }
    const cards = [...new Set(d.cards.map(c => String(c).trim()).filter(Boolean))];
    const deck = { id: d.id, title: d.title, icon: d.icon || '⭐', color: d.color || '#7c6cff', cards, note: d.note || '' };
    decks.push(deck); byId.set(deck.id, deck);
  });
  MIX.cards = decks.flatMap(d => d.cards);
  return decks;
}

function checkDeck(d) {
  if (!d || typeof d !== 'object') return 'no deck exported (needs "export default { ... }")';
  if (!/^[a-z0-9-]{2,30}$/.test(d.id || '')) return 'id must be lowercase letters, numbers or dashes';
  if (!d.title) return 'no title';
  if (!Array.isArray(d.cards) || d.cards.length < 12) return 'needs at least 12 cards';
  return null;
}

// Pick the next word for a deck: never one already used this game, and
// words this device has shown lately only once the rest have had a turn.
export function draw(deckId, used) {
  const deck = deckById(deckId);
  if (!deck || !deck.cards.length) return null;
  const st = load();
  const key = deck.id;
  let seen = new Set(st.seen[key] || []);
  let pool = deck.cards.filter(w => !used.has(w) && !seen.has(w));
  if (!pool.length) {
    seen = new Set(); st.seen[key] = [];
    pool = deck.cards.filter(w => !used.has(w));
  }
  if (!pool.length) pool = deck.cards.slice(); // deck used up this game: start it over
  const w = pool[Math.floor(Math.random() * pool.length)];
  (st.seen[key] = st.seen[key] || []).push(w);
  if (st.seen[key].length > deck.cards.length) st.seen[key] = st.seen[key].slice(-deck.cards.length);
  save(true);
  return { w, x: Math.random() < GOLD_CHANCE ? 1 : 0 };
}
