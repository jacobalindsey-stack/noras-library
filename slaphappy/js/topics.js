// Topic modules. Each topic is one JSON file in topics/, listed in
// topics/manifest.json. See TOPICS.md for the format and the content rules.

export async function loadTopics() {
  const out = [];
  let man;
  try { man = await (await fetch('topics/manifest.json', { cache: 'no-cache' })).json(); }
  catch (e) { console.warn('Slap Happy: no topics/manifest.json', e); return out; }
  const files = (man.topics || []).map(x => typeof x === 'string' ? x : x.file).filter(Boolean);
  const loaded = await Promise.all(files.map(f => fetch('topics/' + f, { cache: 'no-cache' }).then(r => r.json()).catch(e => { console.warn('Slap Happy: could not load topic', f, e); return null; })));
  for (const t of loaded) { const c = clean(t); if (c) out.push(c); }
  return out;
}

function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }

export function clean(t) {
  if (!t || typeof t !== 'object' || !/^[a-z0-9-]{2,30}$/.test(t.id || '') || !Array.isArray(t.questions)) return null;
  const qs = [];
  t.questions.forEach((q, i) => {
    const bad = why => console.warn(`Slap Happy: topic ${t.id} question ${i + 1} skipped: ${why}`);
    if (!q || typeof q.q !== 'string' || !q.q.trim()) return bad('no question text');
    const out = { id: t.id + ':' + hash(q.q), topic: t.id, q: q.q.trim(), fact: typeof q.fact === 'string' ? q.fact.trim() : '', level: [1, 2, 3].includes(q.level) ? q.level : 2, fixed: !!q.fixed };
    // every question is multiple choice: the team that slaps picks on its phone
    if (!Array.isArray(q.choices)) return bad('needs choices');
    const ch = q.choices.map(c => String(c).trim());
    if (ch.length < 2 || ch.length > 4 || new Set(ch).size !== ch.length || ch.some(c => !c)) return bad('needs 2 to 4 different choices');
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= ch.length) return bad('answer must be the number of the right choice, counting from 0');
    out.choices = ch; out.answer = q.answer;
    qs.push(out);
  });
  if (!qs.length) return null;
  return { id: t.id, title: String(t.title || t.id), emoji: String(t.emoji || '❓'), blurb: String(t.blurb || ''), questions: qs };
}

const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const SEEN = 'slaphappy.seen.v1';
export function seenSet() { try { return new Set(JSON.parse(localStorage.getItem(SEEN) || '[]')); } catch (e) { return new Set(); } }
export function markSeen(ids) {
  try { const s = [...seenSet(), ...ids]; localStorage.setItem(SEEN, JSON.stringify([...new Set(s)].slice(-800))); } catch (e) {}
}

// Pick n questions: ones this iPad hasn't asked come first; easy ones open the
// show and it builds from there; every fifth question is a double-points bonus.
export function pickQuestions(topics, ids, n) {
  const pool = topics.filter(t => ids.includes(t.id)).flatMap(t => t.questions);
  const seen = seenSet();
  const fresh = shuffle(pool.filter(q => !seen.has(q.id)));
  const old = shuffle(pool.filter(q => seen.has(q.id)));
  const chosen = [...fresh, ...old].slice(0, Math.min(n, pool.length));
  // easy first, harder later, but mixed a little so it isn't predictable
  chosen.sort((a, b) => (a.level + Math.random() * 1.6) - (b.level + Math.random() * 1.6));
  return chosen.map((q, i) => {
    const r = { ...q, bonus: (i + 1) % 5 === 0 };
    const order = q.choices.map((c, k) => k);
    if (!q.fixed) shuffle(order);
    r.choices = order.map(k => q.choices[k]);
    r.answer = order.indexOf(q.answer);
    r.answerText = q.choices[q.answer];
    return r;
  });
}
